use tauri::Manager;
use tauri::path::BaseDirectory;
use std::process::Stdio;
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // New: enables checking a remote manifest (hosted on GitHub Releases)
        // for a newer version, downloading it, and installing it.
        .plugin(tauri_plugin_updater::Builder::new().build())
        // New: lets the frontend call relaunch() after an update installs.
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            // Dev mode keeps using the live dev-relative paths (unbundled).
            // Production build resolves the bundled resources instead.
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

            // Plain tokio process spawn — this is backend-initiated, not
            // frontend-invoked, so it deliberately bypasses tauri-plugin-shell's
            // ACL system (which can't match a runtime-resolved install path anyway).
            let mut child: Child = Command::new(&java_path)
                .args(["-jar", &jar_path])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .expect("failed to spawn backend process");

            let stdout = child.stdout.take().expect("no stdout handle");
            let stderr = child.stderr.take().expect("no stderr handle");

            // Store the child so we can kill it on window close
            let child_holder = std::sync::Mutex::new(Some(child));
            app.manage(child_holder);

            tauri::async_runtime::spawn(async move {
                let mut lines = BufReader::new(stdout).lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    println!("[backend] {}", line);
                }
            });

            tauri::async_runtime::spawn(async move {
                let mut lines = BufReader::new(stderr).lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    eprintln!("[backend-err] {}", line);
                }
            });

            // Poll the health endpoint until the backend is ready, then show the window
            let window = app.get_webview_window("main").unwrap();
            tauri::async_runtime::spawn(async move {
                let client = reqwest::Client::new();
                loop {
                    match client
                        .get("http://localhost:8080/actuator/health")
                        .timeout(Duration::from_secs(2))
                        .send()
                        .await
                    {
                        Ok(resp) if resp.status().is_success() => {
                            let _ = window.eval("window.location.reload();");
                            break;
                        }
                        _ => {
                            tokio::time::sleep(Duration::from_millis(500)).await;
                        }
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
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