use serde::Serialize;
use std::{fs, path::Path};
use tauri::{Manager, Window};

#[derive(Debug, Default, Serialize)]
pub struct FileMetadata {
    pub name: String,
    pub size: u64,
    pub path: String,
    pub is_dir: bool,
    pub extension: String,
}

#[tauri::command]
pub fn show(window: Window) {
    window
        .get_window("main")
        .expect("no window labeled 'main' found")
        .show()
        .unwrap();
}

#[tauri::command]
pub fn get_file_metadata(path: &str) -> FileMetadata {
    let p = Path::new(path);
    let name = p
        .file_name()
        .unwrap_or_default()
        .to_str()
        .unwrap_or_default()
        .to_string();
    let is_dir = p.is_dir();
    let extension = p
        .extension()
        .unwrap_or_default()
        .to_str()
        .unwrap_or_default()
        .to_string();
    let size = if is_dir {
        match get_directory_size(path) {
            Ok(size) => size,
            Err(_) => 0,
        }
    } else {
        match p.metadata() {
            Ok(metadata) => metadata.len(),
            Err(_) => 0,
        }
    };
    FileMetadata {
        name,
        size,
        path: path.to_owned(),
        is_dir,
        extension,
    }
}

fn get_directory_size(path: &str) -> Result<u64, std::io::Error> {
    let path = Path::new(path);

    let mut total_size = 0;

    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let file_type = entry.file_type()?;

            if file_type.is_dir() {
                // 如果是子目录，递归获取子目录大小
                total_size += get_directory_size(entry.path().to_str().unwrap())?;
            } else if file_type.is_file() {
                // 如果是文件，累加文件大小
                total_size += entry.metadata()?.len();
            }
        }
    }

    Ok(total_size)
}
