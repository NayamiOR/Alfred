mod models;

use chrono::Utc;
use mime_guess::from_path;
use models::{AppData, AppState, FileItem, Tag, TagGroup};
use serde::Serialize;
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, State,
};
use tauri_plugin_fs::FsExt;
use uuid::Uuid;

// i18n
use i18n_embed::{fluent::FluentLanguageLoader, DesktopLanguageRequester, LanguageRequester};
use once_cell::sync::Lazy;
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "i18n/"]
struct Localizations;

static LANGUAGE_LOADER: Lazy<FluentLanguageLoader> = Lazy::new(|| {
    let loader = i18n_embed::fluent::fluent_language_loader!();
    let requested_languages = DesktopLanguageRequester::new().requested_languages();
    let _ = i18n_embed::select(&loader, &Localizations, &requested_languages);
    loader
});

fn get_localized_string(key: &str) -> String {
    LANGUAGE_LOADER.get(key)
}

// Helper to save data without re-locking
fn save_to_disk(data: &AppData, file_path: &Path) {
    if let Ok(content) = serde_json::to_string_pretty(data) {
        let _ = fs::write(file_path, content);
    }
}

#[tauri::command]
fn get_initial_data(state: State<AppState>) -> AppData {
    let data = state.data.lock().unwrap();
    data.clone()
}

#[derive(Serialize)]
pub struct AddFilesResponse {
    pub added_files: Vec<FileItem>,
    pub skipped_duplicates: Vec<String>,
    pub skipped_unsupported: Vec<String>,
}

#[tauri::command]
fn add_files(
    app: tauri::AppHandle,
    paths: Vec<String>,
    state: State<AppState>,
) -> AddFilesResponse {
    let mut data = state.data.lock().unwrap();
    let mut added_files = Vec::new();
    let mut skipped_duplicates = Vec::new();
    let mut skipped_unsupported = Vec::new();

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

    // Create a HashSet of existing paths for fast lookup
    let existing_paths: HashSet<String> = data.files.iter().map(|f| f.path.clone()).collect();

    for path_str in paths {
        // Check for duplicates
        if existing_paths.contains(&path_str) {
            skipped_duplicates.push(path_str);
            continue;
        }

        let path = Path::new(&path_str);
        if !path.exists() {
            continue;
        }

        // Dynamically allow access to this path immediately
        let scope = app.fs_scope();
        let ret = if path.is_dir() {
            scope.allow_directory(path, true)
        } else {
            scope.allow_file(path)
        };

        if let Err(e) = ret {
            // Log error to console/terminal for debugging
            println!("Failed to extend fs scope for {:?}: {}", path, e);
        }

        let is_dir = path.is_dir();
        let extension = path
            .extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_lowercase();

        // Filter logic: Allow if it's a directory OR if the extension is in whitelist
        if !is_dir && !allowed_exts.contains(extension.as_str()) {
            skipped_unsupported.push(path_str);
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
            name,
            path: path_str.clone(),
            extension: final_extension,
            size,
            mime_type,
            added_at: Utc::now().timestamp_millis(),
            tag_ids: Vec::new(),
        };
        added_files.push(file_item.clone());
        data.files.push(file_item);
    }
    save_to_disk(&data, &state.file_path);

    AddFilesResponse {
        added_files,
        skipped_duplicates,
        skipped_unsupported,
    }
}

#[tauri::command]
fn delete_files(ids: Vec<String>, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    let id_set: HashSet<_> = ids.into_iter().collect();
    data.files.retain(|f| !id_set.contains(&f.id));
    save_to_disk(&data, &state.file_path);
}

// --- Tag Group Ops ---

#[tauri::command]
fn create_tag_group(name: String, color: Option<String>, state: State<AppState>) -> TagGroup {
    let mut data = state.data.lock().unwrap();
    let group = TagGroup {
        id: Uuid::new_v4().to_string(),
        name,
        color,
    };
    data.groups.push(group.clone());
    save_to_disk(&data, &state.file_path);
    group
}

#[tauri::command]
fn update_tag_group(
    id: String,
    name: Option<String>,
    color: Option<String>,
    state: State<AppState>,
) {
    let mut data = state.data.lock().unwrap();
    if let Some(group) = data.groups.iter_mut().find(|g| g.id == id) {
        if let Some(n) = name {
            group.name = n;
        }
        if let Some(c) = color {
            group.color = Some(c);
        }
        save_to_disk(&data, &state.file_path);
    }
}

#[tauri::command]
fn delete_tag_group(id: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    // Ungroup tags
    for tag in data.tags.iter_mut() {
        if tag.group_id.as_ref() == Some(&id) {
            tag.group_id = None;
        }
    }
    // Delete group
    data.groups.retain(|g| g.id != id);
    save_to_disk(&data, &state.file_path);
}

// --- Tag Ops ---

#[tauri::command]
fn create_tag(
    name: String,
    parent_id: Option<String>,
    group_id: Option<String>,
    state: State<AppState>,
) -> Result<Tag, String> {
    let mut data = state.data.lock().unwrap();

    // Check for duplicate tag name (case-insensitive)
    if data.tags.iter().any(|t| t.name.eq_ignore_ascii_case(&name)) {
        return Err("Duplicate tag name".to_string());
    }

    let tag = Tag {
        id: Uuid::new_v4().to_string(),
        name,
        parent_id,
        group_id,
    };
    data.tags.push(tag.clone());
    save_to_disk(&data, &state.file_path);
    Ok(tag)
}

#[tauri::command]
fn rename_tag(id: String, name: String, state: State<AppState>) -> Result<(), String> {
    let mut data = state.data.lock().unwrap();

    // Check for duplicates (excluding self)
    if data
        .tags
        .iter()
        .any(|t| t.id != id && t.name.eq_ignore_ascii_case(&name))
    {
        return Err("Duplicate tag name".to_string());
    }

    if let Some(tag) = data.tags.iter_mut().find(|t| t.id == id) {
        tag.name = name;
        save_to_disk(&data, &state.file_path);
        Ok(())
    } else {
        Err("Tag not found".to_string())
    }
}

#[tauri::command]
fn move_tag(
    id: String,
    parent_id: Option<String>,
    group_id: Option<String>,
    state: State<AppState>,
) {
    let mut data = state.data.lock().unwrap();
    if let Some(tag) = data.tags.iter_mut().find(|t| t.id == id) {
        tag.parent_id = parent_id;
        tag.group_id = group_id;
        save_to_disk(&data, &state.file_path);
    }
}

#[tauri::command]
fn delete_tag(id: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    // Detach from files
    for file in data.files.iter_mut() {
        file.tag_ids.retain(|tid| tid != &id);
    }
    // Detach children (flatten)
    for tag in data.tags.iter_mut() {
        if tag.parent_id.as_ref() == Some(&id) {
            tag.parent_id = None;
        }
    }
    // Delete tag
    data.tags.retain(|t| t.id != id);
    save_to_disk(&data, &state.file_path);
}

// --- File Tag Ops ---

#[tauri::command]
fn attach_tag(file_id: String, tag_id: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    if let Some(file) = data.files.iter_mut().find(|f| f.id == file_id) {
        if !file.tag_ids.contains(&tag_id) {
            file.tag_ids.push(tag_id);
            save_to_disk(&data, &state.file_path);
        }
    }
}

#[tauri::command]
fn detach_tag(file_id: String, tag_id: String, state: State<AppState>) {
    let mut data = state.data.lock().unwrap();
    if let Some(file) = data.files.iter_mut().find(|f| f.id == file_id) {
        if let Some(pos) = file.tag_ids.iter().position(|t| t == &tag_id) {
            file.tag_ids.remove(pos);
            save_to_disk(&data, &state.file_path);
        }
    }
}

// --- OS Ops ---

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
        use std::os::windows::process::CommandExt;
        Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                &format!("Set-Clipboard -Path '{}'", path.replace("'", "''")),
            ])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
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
                    let path = Path::new(&file.path);
                    if path.exists() {
                        if path.is_dir() {
                            let _ = scope.allow_directory(path, true);
                        } else {
                            let _ = scope.allow_file(path);
                        }
                    }
                }
            }

            app.manage(state);

            // System Tray Setup
            let quit_i = MenuItem::with_id(
                app,
                "quit",
                &get_localized_string("tray-menu-quit"),
                true,
                None::<&str>,
            )?;
            let show_i = MenuItem::with_id(
                app,
                "show",
                &get_localized_string("tray-menu-show"),
                true,
                None::<&str>,
            )?;
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
            tauri::WindowEvent::DragDrop(event) => {
                if let tauri::DragDropEvent::Drop { paths, .. } = event {
                    let paths_vec: Vec<String> = paths
                        .iter()
                        .map(|p| p.to_string_lossy().to_string())
                        .collect();
                    let _ = window.emit(
                        "tauri://drag-drop",
                        serde_json::json!({ "paths": paths_vec }),
                    );
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            get_initial_data,
            add_files,
            delete_files,
            create_tag_group,
            update_tag_group,
            delete_tag_group,
            create_tag,
            rename_tag,
            move_tag,
            delete_tag,
            attach_tag,
            detach_tag,
            open_file_default,
            show_in_explorer,
            copy_file_to_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
