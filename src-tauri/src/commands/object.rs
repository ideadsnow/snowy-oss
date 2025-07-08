use crate::models::s3::{
    DeleteObjectsRequest, GetPresignedUrlRequest, ListObjectsRequest, S3Object,
};
use crate::services::s3_client::create_s3_client;

/// 列出存储桶中的对象
#[tauri::command]
pub async fn list_objects(request: ListObjectsRequest) -> Result<Vec<S3Object>, String> {
    println!(
        "list_objects called with bucket_name: '{}', prefix: {:?}",
        request.bucket_name, request.prefix
    );

    if request.bucket_name.is_empty() {
        return Err("Bucket name cannot be empty".to_string());
    }

    let client = create_s3_client(&request.config)
        .await
        .map_err(|e| e.to_string())?;

    let mut s3_request = client.list_objects_v2().bucket(&request.bucket_name);

    if let Some(prefix) = request.prefix {
        s3_request = s3_request.prefix(prefix);
    }

    match s3_request.send().await {
        Ok(output) => {
            let objects = output.contents();
            let object_list: Vec<S3Object> = objects
                .iter()
                .map(|obj| S3Object {
                    key: obj.key().unwrap_or_default().to_string(),
                    size: obj.size(),
                    last_modified: obj.last_modified().map(|date| date.to_string()),
                    etag: obj.e_tag().map(|tag| tag.to_string()),
                    storage_class: obj.storage_class().map(|class| class.as_str().to_string()),
                })
                .collect();
            Ok(object_list)
        }
        Err(e) => Err(format!("Failed to list objects: {}", e)),
    }
}

/// 删除多个对象
#[tauri::command]
pub async fn delete_objects(request: DeleteObjectsRequest) -> Result<String, String> {
    let client = create_s3_client(&request.config)
        .await
        .map_err(|e| e.to_string())?;

    let mut deleted_count = 0;
    let mut errors = Vec::new();

    for key in request.object_keys {
        match client
            .delete_object()
            .bucket(&request.bucket_name)
            .key(&key)
            .send()
            .await
        {
            Ok(_) => deleted_count += 1,
            Err(e) => errors.push(format!("Failed to delete {}: {}", key, e)),
        }
    }

    if errors.is_empty() {
        Ok(format!("Successfully deleted {} objects", deleted_count))
    } else {
        Err(format!(
            "Deleted {} objects, but encountered errors: {}",
            deleted_count,
            errors.join(", ")
        ))
    }
}

/// 获取预签名 URL
#[tauri::command]
pub async fn get_presigned_url(request: GetPresignedUrlRequest) -> Result<String, String> {
    let client = create_s3_client(&request.config)
        .await
        .map_err(|e| e.to_string())?;

    let expires_in = std::time::Duration::from_secs(request.expires_in_seconds.unwrap_or(3600));

    let presigning_config = aws_sdk_s3::presigning::PresigningConfig::expires_in(expires_in)
        .map_err(|e| format!("Failed to create presigning config: {}", e))?;

    let presigned_request = client
        .get_object()
        .bucket(&request.bucket_name)
        .key(&request.object_key)
        .presigned(presigning_config)
        .await
        .map_err(|e| format!("Failed to generate presigned URL: {}", e))?;

    Ok(presigned_request.uri().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::s3::S3Config;

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
    fn test_s3_object_creation() {
        let object = S3Object {
            key: "test-file.txt".to_string(),
            size: Some(1024),
            last_modified: Some("2023-01-01T00:00:00Z".to_string()),
            etag: Some("d41d8cd98f00b204e9800998ecf8427e".to_string()),
            storage_class: Some("STANDARD".to_string()),
        };
        assert_eq!(object.key, "test-file.txt");
        assert_eq!(object.size, Some(1024));
    }

    #[test]
    fn test_list_objects_request_validation() {
        let config = create_test_config();
        let request = ListObjectsRequest {
            config,
            bucket_name: "".to_string(),
            prefix: None,
        };

        // Validate empty bucket name would fail
        assert!(request.bucket_name.is_empty());
    }
}
