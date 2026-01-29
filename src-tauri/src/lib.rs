mod models;

use chrono::Utc;
use mime_guess::from_path;
use models::{AppData, AppState, FileItem, Library};
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager, State,
};
use tauri_plugin_fs::FsExt;
use uuid::Uuid;

// Helper to save data without re-locking
fn save_to_disk(data: &AppData, file_path: &Path) {
    if let Ok(content) = serde_json::to_string_pretty(data) {
        let _ = fs::write(file_path, content);
    }
}

#[tauri::command]
fn get_libraries(state: State<AppState>) -> Vec<Library> {
    let data = state.data.lock().unwrap();
    data.libraries.clone()
}

#[tauri::command]
fn create_library(name: String, state: State<AppState>) -> Library {
    let mut data = state.data.lock().unwrap();
    let lib = Library {
        id: Uuid::new_v4().to_string(),
        name,
        icon: "📁".to_string(),
        created_at: Utc::now().timestamp_millis(),
    };
    data.libraries.push(lib.clone());
    save_to_disk(&data, &state.file_path);
    lib
}

#[tauri::command]
fn delete_library(id: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    data.libraries.retain(|l| l.id != id);
    data.files.retain(|f| f.library_id != id);
    save_to_disk(&data, &state.file_path);
}

#[tauri::command]
fn get_files(library_id: String, state: State<AppState>) -> Vec<FileItem> {
    let data = state.data.lock().unwrap();
    data.files
        .iter()
        .filter(|f| f.library_id == library_id)
        .cloned()
        .collect()
}

#[tauri::command]
fn add_files(library_id: String, paths: Vec<String>, state: State<AppState>) -> Vec<FileItem> {
    let mut data = state.data.lock().unwrap();
    let mut new_files = Vec::new();

    // Whitelists
    let docs = vec![
        "pdf", "doc", "docx", "txt", "md", "markdown", "xls", "xlsx", "ppt", "pptx", "rtf", "csv",
        "json", "xml", "epub",
    ];
    let images = vec![
        "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff",
    ];
    let videos = vec!["mp4", "mkv", "avi", "mov", "webm", "wmv", "flv"];
    let audios = vec!["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma"];

    let allowed_exts: HashSet<&str> = docs
        .into_iter()
        .chain(images)
        .chain(videos)
        .chain(audios)
        .collect();

    for path_str in paths {
        let path = Path::new(&path_str);
        if !path.exists() {
            continue;
        }

        let is_dir = path.is_dir();
        let extension = path
            .extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_lowercase();

        // Filter logic: Allow if it's a directory OR if the extension is in whitelist
        if !is_dir && !allowed_exts.contains(extension.as_str()) {
            continue;
        }

        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let size = if is_dir {
            0
        } else {
            path.metadata().map(|m| m.len()).unwrap_or(0)
        };
        let mime_type = if is_dir {
            "inode/directory".to_string()
        } else {
            from_path(path).first_or_octet_stream().to_string()
        };

        let final_extension = if is_dir {
            "folder".to_string()
        } else {
            extension
        };

        let file_item = FileItem {
            id: Uuid::new_v4().to_string(),
            library_id: library_id.clone(),
            name,
            path: path_str.clone(),
            extension: final_extension,
            size,
            mime_type,
            added_at: Utc::now().timestamp_millis(),
            tags: Vec::new(),
        };
        new_files.push(file_item.clone());
        data.files.push(file_item);
    }
    save_to_disk(&data, &state.file_path);
    new_files
}

#[tauri::command]
fn delete_files(ids: Vec<String>, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    let id_set: HashSet<_> = ids.into_iter().collect();
    data.files.retain(|f| !id_set.contains(&f.id));
    save_to_disk(&data, &state.file_path);
}

// Deprecated single delete, kept for compatibility if needed, but we should use delete_files
#[tauri::command]
fn delete_file(id: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    data.files.retain(|f| f.id != id);
    save_to_disk(&data, &state.file_path);
}

#[tauri::command]
fn add_tag(file_id: String, tag: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    if let Some(file) = data.files.iter_mut().find(|f| f.id == file_id) {
        if !file.tags.contains(&tag) {
            file.tags.push(tag);
            save_to_disk(&data, &state.file_path);
        }
    }
}

#[tauri::command]
fn remove_tag(file_id: String, tag: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    if let Some(file) = data.files.iter_mut().find(|f| f.id == file_id) {
        if let Some(pos) = file.tags.iter().position(|t| t == &tag) {
            file.tags.remove(pos);
            save_to_disk(&data, &state.file_path);
        }
    }
}

#[tauri::command]
fn rename_tag(old_tag: String, new_tag: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    let mut changed = false;
    for file in data.files.iter_mut() {
        if let Some(pos) = file.tags.iter().position(|t| t == &old_tag) {
            if !file.tags.contains(&new_tag) {
                file.tags[pos] = new_tag.clone();
            } else {
                // If new tag already exists on this file, just remove the old one to avoid duplicates
                file.tags.remove(pos);
            }
            changed = true;
        }
    }
    if changed {
        save_to_disk(&data, &state.file_path);
    }
}

#[tauri::command]
fn delete_tag(tag: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    let mut changed = false;
    for file in data.files.iter_mut() {
        if let Some(pos) = file.tags.iter().position(|t| t == &tag) {
            file.tags.remove(pos);
            changed = true;
        }
    }
    if changed {
        save_to_disk(&data, &state.file_path);
    }
}

#[tauri::command]
fn get_all_files(state: State<AppState>) -> Vec<FileItem> {
    let data = state.data.lock().unwrap();
    data.files.clone()
}

#[tauri::command]
fn open_file_default(path: String) -> Result<(), String> {
    open::that(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn show_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        open::that(path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn copy_file_to_clipboard(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                &format!("Set-Clipboard -Path '{}'", path),
            ])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Not supported on this OS".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let state = AppState::new(app.handle());

            // Manually re-hydrate the filesystem scope from the saved database
            {
                let data = state.data.lock().unwrap();
                let scope = app.fs_scope();
                for file in &data.files {
                    let _ = scope.allow_file(Path::new(&file.path));
                }
            }

            app.manage(state);

            // System Tray Setup
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Open Alfred", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            get_libraries,
            create_library,
            delete_library,
            get_files,
            get_all_files,
            add_files,
            delete_file,
            delete_files,
            add_tag,
            remove_tag,
            rename_tag,
            delete_tag,
            open_file_default,
            show_in_explorer,
            copy_file_to_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
