use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use uuid::Uuid;

// Define the current version of the data schema
const CURRENT_VERSION: u32 = 2;

fn default_version() -> u32 {
    CURRENT_VERSION
}

// --- V2 Data Structures (Current) ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TagGroup {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub group_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileItem {
    pub id: String,
    pub name: String,
    pub path: String,
    pub extension: String,
    pub size: u64,
    pub mime_type: String,
    pub added_at: i64,
    #[serde(default)]
    pub tag_ids: Vec<String>, // Changed from 'tags' (strings) to 'tag_ids' (uuids)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppData {
    #[serde(default = "default_version")]
    pub version: u32,
    pub files: Vec<FileItem>,
    pub tags: Vec<Tag>,
    pub groups: Vec<TagGroup>,
}

impl Default for AppData {
    fn default() -> Self {
        Self {
            version: CURRENT_VERSION,
            files: vec![],
            tags: vec![],
            groups: vec![],
        }
    }
}

// --- V1 Data Structures (Migration Source) ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileItemV1 {
    pub id: String,
    pub name: String,
    pub path: String,
    pub extension: String,
    pub size: u64,
    pub mime_type: String,
    pub added_at: i64,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppDataV1 {
    #[serde(default)] // Defaults to 1 if missing
    pub version: u32,
    pub files: Vec<FileItemV1>,
}

impl Default for AppDataV1 {
    fn default() -> Self {
        Self {
            version: 1,
            files: vec![],
        }
    }
}

// --- V0 Data Structures (Legacy) ---

#[derive(Debug, Deserialize)]
struct LegacyLibrary {
    id: String,
    name: String,
}

#[derive(Debug, Deserialize)]
struct LegacyFileItem {
    id: String,
    library_id: String,
    name: String,
    path: String,
    extension: String,
    size: u64,
    mime_type: String,
    added_at: i64,
    #[serde(default)]
    tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct LegacyAppData {
    libraries: Vec<LegacyLibrary>,
    files: Vec<LegacyFileItem>,
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

        let final_data = if file_path.exists() {
            let content = fs::read_to_string(&file_path).unwrap_or_default();

            // Step 1: Normalize to V1 (Memory)
            let v1_data = if content.contains("\"libraries\":") {
                // V0 -> V1 Logic
                match serde_json::from_str::<LegacyAppData>(&content) {
                    Ok(legacy_data) => {
                        let lib_map: HashMap<_, _> = legacy_data
                            .libraries
                            .iter()
                            .map(|l| (l.id.clone(), l.name.clone()))
                            .collect();

                        let mut new_files = Vec::new();
                        for old_file in legacy_data.files {
                            let mut tags = old_file.tags;
                            if let Some(lib_name) = lib_map.get(&old_file.library_id) {
                                if !tags.contains(lib_name) {
                                    tags.push(lib_name.clone());
                                }
                            }
                            new_files.push(FileItemV1 {
                                id: old_file.id,
                                name: old_file.name,
                                path: old_file.path,
                                extension: old_file.extension,
                                size: old_file.size,
                                mime_type: old_file.mime_type,
                                added_at: old_file.added_at,
                                tags,
                            });
                        }
                        AppDataV1 {
                            version: 1,
                            files: new_files,
                        }
                    }
                    Err(_) => AppDataV1::default(),
                }
            } else {
                // Try parsing as V1 (or V2 if version matches, but here we assume V1 check first)
                // We use a heuristic: try to parse as V1. If version is 2, this might partial parse or fail if we are strict.
                // But AppDataV1 is compatible with AppData structure mostly, except 'tags' field type difference.
                // If it's V2, 'tags' is a struct array, V1 expects strings.
                // So we should check version first using untyped serde value.
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(v) = value.get("version").and_then(|v| v.as_u64()) {
                        if v >= 2 {
                            // It's V2 or higher, parse directly as AppData
                            match serde_json::from_str::<AppData>(&content) {
                                Ok(data) => {
                                    return Self {
                                        data: Arc::new(Mutex::new(data)),
                                        file_path,
                                    }
                                }
                                Err(_) => AppDataV1::default(), // Fallback
                            }
                        } else {
                            // Version 1
                            serde_json::from_str::<AppDataV1>(&content).unwrap_or_default()
                        }
                    } else {
                        // Missing version, assume V1
                        serde_json::from_str::<AppDataV1>(&content).unwrap_or_default()
                    }
                } else {
                    AppDataV1::default()
                }
            };

            // Step 2: Migrate V1 -> V2
            // We have v1_data (AppDataV1). Convert to AppData (V2).
            let mut all_tag_names = HashSet::new();
            for file in &v1_data.files {
                for tag in &file.tags {
                    all_tag_names.insert(tag.clone());
                }
            }

            // Create Tag entities
            let mut tags_v2 = Vec::new();
            let mut name_to_id = HashMap::new();

            for tag_name in all_tag_names {
                let id = Uuid::new_v4().to_string();
                name_to_id.insert(tag_name.clone(), id.clone());
                tags_v2.push(Tag {
                    id,
                    name: tag_name,
                    parent_id: None,
                    group_id: None,
                });
            }

            // Convert files
            let files_v2: Vec<FileItem> = v1_data
                .files
                .into_iter()
                .map(|f| {
                    let tag_ids = f
                        .tags
                        .iter()
                        .filter_map(|name| name_to_id.get(name))
                        .cloned()
                        .collect();

                    FileItem {
                        id: f.id,
                        name: f.name,
                        path: f.path,
                        extension: f.extension,
                        size: f.size,
                        mime_type: f.mime_type,
                        added_at: f.added_at,
                        tag_ids,
                    }
                })
                .collect();

            let final_data = AppData {
                version: 2,
                files: files_v2,
                tags: tags_v2,
                groups: vec![],
            };

            // Save migrated data
            let save_content = serde_json::to_string_pretty(&final_data).unwrap();
            let _ = fs::write(&file_path, save_content);

            final_data
        } else {
            AppData::default()
        };

        Self {
            data: Arc::new(Mutex::new(final_data)),
            file_path,
        }
    }
}
