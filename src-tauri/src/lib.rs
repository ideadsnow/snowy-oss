// 模块声明
mod commands;
mod models;
mod services;
mod utils;

// 导入 Tauri 命令
use commands::bucket::{list_buckets, test_s3_connection};
use commands::download::download_file;
use commands::object::{delete_objects, get_presigned_url, list_objects};
use commands::upload::{upload_file, upload_file_from_bytes, upload_files_with_dialog};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            test_s3_connection,
            list_buckets,
            list_objects,
            delete_objects,
            get_presigned_url,
            download_file,
            upload_file,
            upload_files_with_dialog,
            upload_file_from_bytes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use models::s3::S3Config;

    fn create_test_config() -> S3Config {
        S3Config {
            endpoint: "https://test.r2.cloudflarestorage.com".to_string(),
            region: "auto".to_string(),
            access_key_id: "test_access_key".to_string(),
            secret_access_key: "test_secret_key".to_string(),
            bucket: None,
            custom_path: None,
        }
    }

    #[test]
    fn test_s3_config_serialization() {
        let config = create_test_config();
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: S3Config = serde_json::from_str(&json).unwrap();
        assert_eq!(config.endpoint, deserialized.endpoint);
        assert_eq!(config.region, deserialized.region);
        assert_eq!(config.access_key_id, deserialized.access_key_id);
    }
}
