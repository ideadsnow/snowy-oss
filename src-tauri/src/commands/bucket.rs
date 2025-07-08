use crate::models::s3::{BucketInfo, S3Config};
use crate::services::s3_client::create_s3_client;

/// 测试 S3 连接
#[tauri::command]
pub async fn test_s3_connection(config: S3Config) -> Result<String, String> {
    println!(
        "Testing connection with config: endpoint={}, region={}",
        config.endpoint, config.region
    );

    let client = create_s3_client(&config).await.map_err(|e| {
        let error_msg = format!("Failed to create S3 client: {}", e);
        println!("{}", error_msg);
        error_msg
    })?;

    println!("S3 client created successfully, attempting to list buckets...");

    match client.list_buckets().send().await {
        Ok(output) => {
            let bucket_count = output.buckets().len();
            let success_msg = format!("Connection successful! Found {} buckets", bucket_count);
            println!("{}", success_msg);
            Ok(success_msg)
        }
        Err(e) => {
            let error_msg = format!("Connection failed: {} (Error type: {:?})", e, e);
            println!("{}", error_msg);

            // Try to provide more specific error information
            let detailed_error = {
                let error_str = e.to_string();
                if error_str.contains("credentials") || error_str.contains("access") {
                    "No valid credentials found. Please check your Access Key ID and Secret Access Key.".to_string()
                } else if error_str.contains("endpoint") || error_str.contains("host") {
                    "Invalid endpoint URL. Please check your endpoint configuration.".to_string()
                } else if error_str.contains("region") {
                    "Invalid region. For R2, try using 'auto' or leave empty.".to_string()
                } else {
                    format!(
                        "Service error: {}. Please check your endpoint URL and credentials.",
                        e
                    )
                }
            };

            Err(detailed_error)
        }
    }
}

/// 列出所有存储桶
#[tauri::command]
pub async fn list_buckets(config: S3Config) -> Result<Vec<BucketInfo>, String> {
    let client = create_s3_client(&config).await.map_err(|e| e.to_string())?;

    match client.list_buckets().send().await {
        Ok(output) => {
            let buckets = output.buckets();
            let bucket_list: Vec<BucketInfo> = buckets
                .iter()
                .map(|bucket| BucketInfo {
                    name: bucket.name().unwrap_or_default().to_string(),
                    creation_date: bucket.creation_date().map(|date| date.to_string()),
                })
                .collect();
            Ok(bucket_list)
        }
        Err(e) => Err(format!("Failed to list buckets: {}", e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
    fn test_bucket_info_creation() {
        let bucket = BucketInfo {
            name: "test-bucket".to_string(),
            creation_date: Some("2023-01-01T00:00:00Z".to_string()),
        };
        assert_eq!(bucket.name, "test-bucket");
        assert!(bucket.creation_date.is_some());
    }

    #[test]
    fn test_r2_config_validation() {
        // Test typical R2 configuration
        let r2_config = S3Config {
            endpoint: "https://account-id.r2.cloudflarestorage.com".to_string(),
            region: "auto".to_string(),
            access_key_id: "test_key".to_string(),
            secret_access_key: "test_secret".to_string(),
            bucket: None,
            custom_path: None,
        };

        // Validate that endpoint is a valid URL
        assert!(r2_config.endpoint.starts_with("https://"));
        assert!(r2_config.endpoint.contains(".r2.cloudflarestorage.com"));
        assert_eq!(r2_config.region, "auto");
        assert!(!r2_config.access_key_id.is_empty());
        assert!(!r2_config.secret_access_key.is_empty());
    }
}
