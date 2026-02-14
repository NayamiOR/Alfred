use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ThumbnailMetadata {
    pub file_id: String,
    pub path: String,
    pub size: u64,
    pub modified_time: i64,
}

pub struct ThumbnailCache {
    metadata: HashMap<String, ThumbnailMetadata>,
    cache_dir: PathBuf,
}

impl ThumbnailCache {
    pub fn new(cache_dir: &Path) -> Result<Self, String> {
        let mut cache = Self {
            metadata: HashMap::new(),
            cache_dir: cache_dir.to_path_buf(),
        };

        // Try to load existing metadata
        if let Err(e) = cache.load() {
            println!("Failed to load cache metadata: {}", e);
        }

        Ok(cache)
    }

    pub fn get_cache_key(file_id: &str) -> String {
        file_id.to_string()
    }

    pub fn is_valid(&self, file_id: &str, path: &Path, size: u64, modified_time: i64) -> bool {
        if let Some(meta) = self.metadata.get(file_id) {
            // Check if file metadata matches
            if meta.path == path.to_string_lossy().to_string()
                && meta.size == size
                && meta.modified_time == modified_time
            {
                // Check if thumbnail file exists
                let thumb_path = self.cache_dir.join(format!("{}.jpg", file_id));
                return thumb_path.exists();
            }
        }
        false
    }

    pub fn update_metadata(&mut self, file_id: &str, path: &Path, size: u64, modified_time: i64) {
        let meta = ThumbnailMetadata {
            file_id: file_id.to_string(),
            path: path.to_string_lossy().to_string(),
            size,
            modified_time,
        };
        self.metadata.insert(file_id.to_string(), meta);
    }

    pub fn remove_metadata(&mut self, file_id: &str) {
        self.metadata.remove(file_id);
    }

    pub fn save(&self) -> Result<(), String> {
        let metadata_path = self.cache_dir.join("metadata.json");

        // Create parent directory if needed
        if let Some(parent) = metadata_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let json = serde_json::to_string_pretty(&self.metadata).map_err(|e| e.to_string())?;

        fs::write(&metadata_path, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn load(&mut self) -> Result<(), String> {
        let metadata_path = self.cache_dir.join("metadata.json");

        if !metadata_path.exists() {
            return Ok(());
        }

        let content = fs::read_to_string(&metadata_path).map_err(|e| e.to_string())?;

        if content.trim().is_empty() {
            return Ok(());
        }

        self.metadata = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn cleanup_orphaned_thumbnails(
        &self,
        thumb_dir: &Path,
        valid_file_ids: &[String],
        limit: usize,
    ) -> Result<usize, String> {
        use std::collections::HashSet;

        let valid_set: HashSet<String> = valid_file_ids.iter().cloned().collect();

        // Read thumbnail directory
        let entries = fs::read_dir(thumb_dir).map_err(|e| e.to_string())?;

        let mut removed_count = 0;
        for entry in entries.flatten().take(limit) {
            let path = entry.path();

            // Only process .jpg files
            if path.extension().and_then(|e| e.to_str()) != Some("jpg") {
                continue;
            }

            // Extract file_id from filename (e.g., "uuid.jpg" -> "uuid")
            if let Some(file_id) = path.file_stem().and_then(|s| s.to_str()) {
                // If file_id is not in valid files, remove the thumbnail
                if !valid_set.contains(file_id) {
                    let _ = fs::remove_file(&path);
                    removed_count += 1;
                }
            }
        }

        if removed_count > 0 {
            println!("Cleaned up {} orphaned thumbnails", removed_count);
        }

        Ok(removed_count)
    }
}
