# Releasing an update (TrustKhata)

Every time you want existing installs to receive a new version, follow this
exact sequence. Skipping a step (especially the signature/latest.json parts)
means the updater silently won't offer the update to anyone.

## 0. One-time note

The very first shipped version has no updater code in it. Those installs
can't self-update — only versions built *after* Stage 3 was added can. If a
user is on that original build, they need one manual reinstall to get onto
the updater-enabled version. After that, this process applies normally.

## 1. Bump the version

Edit `desktop-shell/src-tauri/tauri.conf.json` — change `"version"` (e.g.
`"0.1.0"` → `"0.1.1"`). Also bump `desktop-shell/src-tauri/Cargo.toml`'s
`version` field to match, for consistency (not strictly required by the
updater, but keeps things sane).

## 2. Set the signing key as environment variables

The private key file needs its contents (and password) available as env
vars during the build, so the bundler can sign the update package.

```powershell
cd G:\retail-erp\desktop-shell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw src-tauri\updater-signing.key
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<the password you set when generating it>"
```

These only need to be set for this PowerShell session — no need to save them
permanently anywhere.

## 3. Build

```powershell
npm run tauri build
```

This produces the installer(s) **and** a `.sig` signature file for each,
under `src-tauri\target\release\bundle\`. For the NSIS installer (the one
we'll use for updates) look in:

```
src-tauri\target\release\bundle\nsis\
```

You should see two files, e.g.:
```
TrustKhata_0.1.1_x64-setup.exe
TrustKhata_0.1.1_x64-setup.exe.sig
```

## 4. Read the signature file

```powershell
Get-Content src-tauri\target\release\bundle\nsis\TrustKhata_0.1.1_x64-setup.exe.sig
```

Copy that entire output — it's a long base64 string. You'll paste it into
`latest.json` next.

## 5. Create `latest.json`

Make a new file (anywhere temporary, e.g. your Desktop) with this content,
filling in the three placeholders:

```json
{
  "version": "0.1.1",
  "notes": "Describe what changed in this release, briefly.",
  "pub_date": "2026-08-04T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "PASTE_THE_SIG_FILE_CONTENTS_HERE",
      "url": "https://github.com/mridul01r/TrustKhata/releases/download/v0.1.1/TrustKhata_0.1.1_x64-setup.exe"
    }
  }
}
```

- `version` — must match Step 1 exactly
- `pub_date` — any valid ISO 8601 timestamp, current time is fine
- `signature` — the full contents from Step 4
- `url` — must exactly match the filename you'll upload in Step 6, including
  the tag (`v0.1.1` below) — a mismatch here means the download will 404 and
  the update will fail silently for users

## 6. Create the GitHub Release

1. Go to `https://github.com/mridul01r/TrustKhata/releases/new`
2. Tag: `v0.1.1` (must match the URL you put in `latest.json`)
3. Title: whatever you like (e.g. "v0.1.1")
4. Description: your release notes
5. **Upload as release assets:**
   - `TrustKhata_0.1.1_x64-setup.exe` (from Step 3)
   - `latest.json` (from Step 5)
6. **Important:** make sure "Set as the latest release" is checked (it's the
   default for a new release, but double-check) — the updater's endpoint URL
   (`.../releases/latest/download/latest.json`) only resolves to whichever
   release GitHub currently marks as "latest"
7. Publish the release

## 7. Verify

On a machine running an **older, updater-enabled** build of the app, launch
it and confirm the "Update available" card appears in the bottom-right
within a few seconds. Click "Update now" and confirm it downloads, installs,
and relaunches into the new version.

## Quick checklist for next time

- [ ] Bumped version in `tauri.conf.json` (and `Cargo.toml`)
- [ ] Set `TAURI_SIGNING_PRIVATE_KEY` / `_PASSWORD` env vars
- [ ] `npm run tauri build`
- [ ] Copied the `.sig` file contents
- [ ] Built `latest.json` with matching version/signature/url
- [ ] Created GitHub Release tagged to match the URL, uploaded both files
- [ ] Confirmed "latest release" is checked
- [ ] Tested the update on an older build