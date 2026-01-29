use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Library {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileItem {
    pub id: String,
    pub library_id: String,
    pub name: String,
    pub path: String,
    pub extension: String,
    pub size: u64,
    pub mime_type: String,
    pub added_at: i64,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct AppData {
    pub libraries: Vec<Library>,
    pub files: Vec<FileItem>,
}

pub struct AppState {
    pub data: Arc<Mutex<AppData>>,
    pub file_path: PathBuf,
}

impl AppState {
    pub fn new(app_handle: &tauri::AppHandle) -> Self {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."));
        if !app_data_dir.exists() {
            let _ = fs::create_dir_all(&app_data_dir);
        }
        let file_path = app_data_dir.join("data.json");

        let data = if file_path.exists() {
            let content = fs::read_to_string(&file_path).unwrap_or_default();
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            // Create default library if new
            let default_lib = Library {
                id: Uuid::new_v4().to_string(),
                name: "My Files".to_string(),
                icon: "📁".to_string(),
                created_at: Utc::now().timestamp_millis(),
            };
            AppData {
                libraries: vec![default_lib],
                files: vec![],
            }
        };

        Self {
            data: Arc::new(Mutex::new(data)),
            file_path,
        }
    }

    pub fn save(&self) {
        let data = self.data.lock().unwrap();
        let content = serde_json::to_string_pretty(&*data).unwrap();
        let _ = fs::write(&self.file_path, content);
    }
}
