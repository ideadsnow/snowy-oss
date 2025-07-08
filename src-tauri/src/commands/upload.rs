use tauri_plugin_dialog::DialogExt;

use crate::models::s3::{S3Config, UploadFileBytesRequest, UploadFileRequest};
use crate::services::s3_client::create_s3_client;
use crate::utils::content_type::guess_content_type;

/// 上传文件到 S3
#[tauri::command]
pub async fn upload_file(request: UploadFileRequest) -> Result<String, String> {
    // 读取文件内容
    let file_content =
        std::fs::read(&request.file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    // 获取文件大小
    let file_size = file_content.len();

    // 创建 S3 客户端
    let client = create_s3_client(&request.config)
        .await
        .map_err(|e| e.to_string())?;

    // 构建上传请求
    let mut put_request = client
        .put_object()
        .bucket(&request.bucket_name)
        .key(&request.object_key)
        .body(file_content.into());

    // 如果指定了 content_type，则设置
    if let Some(content_type) = &request.content_type {
        put_request = put_request.content_type(content_type);
    }

    // 执行上传
    match put_request.send().await {
        Ok(_) => Ok(format!(
            "Successfully uploaded file '{}' ({} bytes) to {}",
            request.object_key, file_size, request.bucket_name
        )),
        Err(e) => Err(format!("Upload failed: {}", e)),
    }
}

/// 通过文件选择对话框上传多个文件
#[tauri::command]
pub async fn upload_files_with_dialog(
    app: tauri::AppHandle,
    config: S3Config,
    bucket_name: String,
    prefix: Option<String>,
) -> Result<Vec<String>, String> {
    // 显示文件选择对话框，允许多选
    let file_paths = app
        .dialog()
        .file()
        .add_filter("所有文件", &["*"])
        .add_filter(
            "图片文件",
            &["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"],
        )
        .add_filter(
            "文档文件",
            &["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
        )
        .add_filter(
            "文本文件",
            &[
                "txt", "md", "html", "htm", "css", "js", "json", "xml", "csv",
            ],
        )
        .add_filter("音频文件", &["mp3", "wav", "ogg", "flac"])
        .add_filter("视频文件", &["mp4", "avi", "mov", "wmv", "flv", "webm"])
        .add_filter("压缩文件", &["zip", "rar", "7z", "tar", "gz"])
        .set_title("选择要上传的文件")
        .blocking_pick_files();

    let file_paths = match file_paths {
        Some(paths) => paths,
        None => return Ok(vec![]), // 用户取消选择
    };

    let mut results = Vec::new();
    let mut upload_count = 0;
    let mut errors = Vec::new();

    for file_path in file_paths {
        let path_buf = file_path.as_path().ok_or("无效的文件路径")?;
        let file_name = path_buf
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or("无法获取文件名")?;

        // 构建对象键
        let object_key = if let Some(ref p) = prefix {
            format!("{}{}", p, file_name)
        } else {
            file_name.to_string()
        };

        // 推断 Content-Type
        let content_type = guess_content_type(file_name);

        // 创建上传请求
        let upload_request = UploadFileRequest {
            config: config.clone(),
            bucket_name: bucket_name.clone(),
            object_key: object_key.clone(),
            file_path: path_buf.display().to_string(),
            content_type: Some(content_type),
        };

        // 执行上传
        match upload_file(upload_request).await {
            Ok(message) => {
                upload_count += 1;
                results.push(format!("✓ {}", message));
            }
            Err(error) => {
                errors.push(format!("✗ 上传 '{}' 失败: {}", file_name, error));
            }
        }
    }

    // 汇总结果
    let mut summary = vec![format!("上传完成: {} 个文件成功", upload_count)];
    summary.extend(results);

    if !errors.is_empty() {
        summary.push("错误:".to_string());
        summary.extend(errors);
    }

    Ok(summary)
}

/// 通过字节数组上传文件
#[tauri::command]
pub async fn upload_file_from_bytes(request: UploadFileBytesRequest) -> Result<String, String> {
    // 获取文件大小
    let file_size = request.file_bytes.len();

    // 创建 S3 客户端
    let client = create_s3_client(&request.config)
        .await
        .map_err(|e| e.to_string())?;

    // 构建上传请求
    let put_request = client
        .put_object()
        .bucket(&request.bucket_name)
        .key(&request.object_key)
        .body(request.file_bytes.into())
        .content_type(&request.content_type);

    // 执行上传
    match put_request.send().await {
        Ok(_) => Ok(format!(
            "Successfully uploaded '{}' ({} bytes) to {}",
            request.file_name, file_size, request.bucket_name
        )),
        Err(e) => Err(format!("Upload failed: {}", e)),
    }
}
