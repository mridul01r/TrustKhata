// TODO(known gap, not yet fixed): this backend currently requires a
// PostgreSQL server already running on localhost:5432 with the `retailerp`
// database and schema already migrated. That's true on dev machines (native
// PostgreSQL 18 install) but NOT on a fresh customer PC with nothing
// installed - the backend will fail to start there with no visible error to
// the user beyond "can't reach this page". Before shipping to real
// customers, switch the desktop build to an embedded/file-based database
// (H2 or SQLite) so it needs zero externally-installed services, keeping
// Postgres only for any future hosted/cloud version via a build profile.

use tauri::Manager;
use tauri::path::BaseDirectory;
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::process::Stdio;
use std::time::Duration;
use std::fs::OpenOptions;
use std::io::Write;
use std::sync::OnceLock;
use std::path::PathBuf;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};

static LOG_PATH: OnceLock<PathBuf> = OnceLock::new();

fn log_line(msg: &str) {
    if let Some(path) = LOG_PATH.get() {
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
            let _ = writeln!(file, "[{}] {}", chrono_now(), msg);
        }
    }
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    format!("epoch:{}", secs)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            let log_dir = app.path().app_log_dir()?;
            std::fs::create_dir_all(&log_dir)?;
            let log_path = log_dir.join("backend-debug.log");
            let _ = std::fs::remove_file(&log_path);
            let _ = LOG_PATH.set(log_path);

            log_line("=== TrustKhata launch started ===");
            log_line("setup() started");

            let (java_path, jar_path) = if cfg!(debug_assertions) {
                (
                    "../../backend/custom-jre/bin/java.exe".to_string(),
                    "../../backend/build/libs/backend-0.0.1-SNAPSHOT.jar".to_string(),
                )
            } else {
                let java = app
                    .path()
                    .resolve("custom-jre/bin/java.exe", BaseDirectory::Resource)?
                    .to_string_lossy()
                    .to_string();
                let jar = app
                    .path()
                    .resolve("backend.jar", BaseDirectory::Resource)?
                    .to_string_lossy()
                    .to_string();
                (java, jar)
            };

            let java_path = java_path.strip_prefix(r"\\?\").unwrap_or(&java_path).to_string();
            let jar_path = jar_path.strip_prefix(r"\\?\").unwrap_or(&jar_path).to_string();

            log_line(&format!("Resolved java_path = {}", java_path));
            log_line(&format!("Resolved jar_path = {}", jar_path));
            log_line(&format!("java_path exists on disk: {}", std::path::Path::new(&java_path).exists()));
            log_line(&format!("jar_path exists on disk: {}", std::path::Path::new(&jar_path).exists()));

            let work_dir = std::path::Path::new(&java_path)
                .parent()
                .and_then(|p| p.parent())
                .and_then(|p| p.parent())
                .map(|p| p.to_path_buf());
            log_line(&format!("Computed working dir: {:?}", work_dir));

            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let db_path = app_data_dir.join("data").join("retailerp");
            std::fs::create_dir_all(db_path.parent().unwrap())?;
            let db_path_str = db_path.to_string_lossy().to_string();
            log_line(&format!("Resolved db_path = {}", db_path_str));

            let profile_arg = "-Dspring.profiles.active=desktop".to_string();
            let db_path_arg = format!("-Ddb.path={}", db_path_str);

            log_line("Attempting to spawn child process...");
            let mut cmd = Command::new(&java_path);
            cmd.args([&profile_arg, &db_path_arg, "-jar", &jar_path])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped());
            if let Some(dir) = &work_dir {
                cmd.current_dir(dir);
            }
            #[cfg(windows)]
            cmd.creation_flags(0x08000000);
            let spawn_result = cmd.spawn();

            let mut child: Child = match spawn_result {
                Ok(c) => {
                    log_line(&format!("Spawn SUCCEEDED, PID = {:?}", c.id()));
                    c
                }
                Err(e) => {
                    log_line(&format!("Spawn FAILED with error: {}", e));
                    log_line(&format!("Error kind: {:?}", e.kind()));
                    return Ok(());
                }
            };

            let stdout = child.stdout.take();
            let stderr = child.stderr.take();

            if let Some(stdout) = stdout {
                tauri::async_runtime::spawn(async move {
                    let mut lines = BufReader::new(stdout).lines();
                    while let Ok(Some(line)) = lines.next_line().await {
                        log_line(&format!("[backend-stdout] {}", line));
                    }
                    log_line("[backend-stdout] stream ended");
                });
            }

            if let Some(stderr) = stderr {
                tauri::async_runtime::spawn(async move {
                    let mut lines = BufReader::new(stderr).lines();
                    while let Ok(Some(line)) = lines.next_line().await {
                        log_line(&format!("[backend-stderr] {}", line));
                    }
                    log_line("[backend-stderr] stream ended");
                });
            }

            log_line(&format!("Spawned child PID: {:?}", child.id()));

            let child_holder = std::sync::Mutex::new(Some(child));
            app.manage(child_holder);

            let window = app.get_webview_window("main").unwrap();
            tauri::async_runtime::spawn(async move {
                let client = reqwest::Client::new();
                let mut attempts = 0;
                loop {
                    attempts += 1;
                    match client
                        .get("http://localhost:8080/actuator/health")
                        .timeout(Duration::from_secs(2))
                        .send()
                        .await
                    {
                        Ok(resp) if resp.status().is_success() => {
                            log_line(&format!("Health check SUCCEEDED after {} attempts", attempts));
                            let _ = window.eval("window.location.reload();");
                            break;
                        }
                        Ok(resp) => {
                            log_line(&format!("Health check attempt {}: got status {}", attempts, resp.status()));
                            tokio::time::sleep(Duration::from_millis(500)).await;
                        }
                        Err(e) => {
                            if attempts % 10 == 0 {
                                log_line(&format!("Health check attempt {}: error {}", attempts, e));
                            }
                            tokio::time::sleep(Duration::from_millis(500)).await;
                        }
                    }
                    if attempts > 120 {
                        log_line("Giving up on health check after 120 attempts (~60s)");
                        break;
                    }
                }
            });

            log_line("setup() completed");
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                log_line("Window close requested, killing child process");
                if let Some(holder) = window
                    .app_handle()
                    .try_state::<std::sync::Mutex<Option<Child>>>()
                {
                    if let Some(mut child) = holder.lock().unwrap().take() {
                        let _ = child.start_kill();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
