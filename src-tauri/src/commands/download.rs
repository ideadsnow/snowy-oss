use tauri_plugin_dialog::DialogExt;

use crate::models::s3::DownloadFileRequest;
use crate::services::s3_client::create_s3_client;

/// 下载文件到本地
#[tauri::command]
pub async fn download_file(
    app: tauri::AppHandle,
    request: DownloadFileRequest,
) -> Result<String, String> {
    // 显示文件保存对话框
    let file_path = app
        .dialog()
        .file()
        .set_file_name(&request.default_file_name)
        .blocking_save_file();

    let file_path = match file_path {
        Some(path) => path,
        None => return Err("用户取消了文件保存".to_string()),
    };

    // 创建S3客户端并生成预签名URL
    let client = create_s3_client(&request.config)
        .await
        .map_err(|e| e.to_string())?;

    let expires_in = std::time::Duration::from_secs(3600); // 1小时
    let presigning_config = aws_sdk_s3::presigning::PresigningConfig::expires_in(expires_in)
        .map_err(|e| format!("Failed to create presigning config: {}", e))?;

    let presigned_request = client
        .get_object()
        .bucket(&request.bucket_name)
        .key(&request.object_key)
        .presigned(presigning_config)
        .await
        .map_err(|e| format!("Failed to generate presigned URL: {}", e))?;

    let download_url = presigned_request.uri().to_string();

    // 下载文件内容
    let response = reqwest::get(&download_url)
        .await
        .map_err(|e| format!("Failed to download file: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Download failed with status: {}",
            response.status()
        ));
    }

    let content = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response content: {}", e))?;

    // 保存文件到用户选择的位置
    let path = file_path.as_path().ok_or("无效的文件路径")?;
    std::fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(path.display().to_string())
}
