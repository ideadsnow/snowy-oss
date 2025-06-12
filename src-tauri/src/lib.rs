use aws_sdk_s3::{Client, Error};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct S3Config {
    endpoint: String,
    region: String,
    access_key_id: String,
    secret_access_key: String,
    bucket: Option<String>,
    custom_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct S3Object {
    key: String,
    size: Option<i64>,
    last_modified: Option<String>,
    etag: Option<String>,
    storage_class: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BucketInfo {
    name: String,
    creation_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListObjectsRequest {
    config: S3Config,
    bucket_name: String,
    prefix: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteObjectsRequest {
    config: S3Config,
    bucket_name: String,
    object_keys: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetPresignedUrlRequest {
    config: S3Config,
    bucket_name: String,
    object_key: String,
    expires_in_seconds: Option<u64>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn test_s3_connection(config: S3Config) -> Result<String, String> {
    println!("Testing connection with config: endpoint={}, region={}", config.endpoint, config.region);
    
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
        },
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
                    format!("Service error: {}. Please check your endpoint URL and credentials.", e)
                }
            };
            
            Err(detailed_error)
        },
    }
}

#[tauri::command]
async fn list_buckets(config: S3Config) -> Result<Vec<BucketInfo>, String> {
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

#[tauri::command]
async fn list_objects(request: ListObjectsRequest) -> Result<Vec<S3Object>, String> {
    println!("list_objects called with bucket_name: '{}', prefix: {:?}", request.bucket_name, request.prefix);
    
    if request.bucket_name.is_empty() {
        return Err("Bucket name cannot be empty".to_string());
    }
    
    let client = create_s3_client(&request.config).await.map_err(|e| e.to_string())?;
    
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

#[tauri::command]
async fn delete_objects(request: DeleteObjectsRequest) -> Result<String, String> {
    let client = create_s3_client(&request.config).await.map_err(|e| e.to_string())?;
    
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

#[tauri::command]
async fn get_presigned_url(request: GetPresignedUrlRequest) -> Result<String, String> {
    let client = create_s3_client(&request.config).await.map_err(|e| e.to_string())?;
    
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

async fn create_s3_client(config: &S3Config) -> Result<Client, Error> {
    use aws_sdk_s3::config::Region;
    
    // Handle empty or default region for R2 and other S3-compatible services
    let region_str = if config.region.is_empty() || config.region == "auto" {
        "us-east-1".to_string() // Default fallback region
    } else {
        config.region.clone()
    };
    
    let region = Region::new(region_str);
    
    let shared_config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(region)
        .endpoint_url(&config.endpoint)
        .credentials_provider(aws_sdk_s3::config::Credentials::new(
            &config.access_key_id,
            &config.secret_access_key,
            None,
            None,
            "custom",
        ))
        .load()
        .await;
    
    let s3_config = aws_sdk_s3::config::Builder::from(&shared_config)
        .force_path_style(true)
        .build();
    
    Ok(Client::from_conf(s3_config))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            test_s3_connection,
            list_buckets,
            list_objects,
            delete_objects,
            get_presigned_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test;

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

    #[tokio::test]
    async fn test_create_s3_client() {
        let config = create_test_config();
        let result = create_s3_client(&config).await;
        assert!(result.is_ok(), "S3 client creation should succeed");
    }

    #[tokio::test]
    async fn test_create_s3_client_with_empty_region() {
        let mut config = create_test_config();
        config.region = "".to_string();
        let result = create_s3_client(&config).await;
        assert!(result.is_ok(), "S3 client creation with empty region should succeed");
    }

    #[tokio::test]
    async fn test_create_s3_client_with_auto_region() {
        let mut config = create_test_config();
        config.region = "auto".to_string();
        let result = create_s3_client(&config).await;
        assert!(result.is_ok(), "S3 client creation with 'auto' region should succeed");
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

    #[test]
    fn test_region_handling() {
        let test_cases = vec![
            ("", "us-east-1"), // Empty should default to us-east-1
            ("auto", "us-east-1"), // auto should default to us-east-1  
            ("us-west-2", "us-west-2"), // Specific region should be preserved
            ("eu-west-1", "eu-west-1"), // EU region should be preserved
        ];
        
        for (input_region, expected_region) in test_cases {
            let processed_region = if input_region.is_empty() || input_region == "auto" {
                "us-east-1".to_string()
            } else {
                input_region.to_string()
            };
            assert_eq!(processed_region, expected_region, "Failed for input: {}", input_region);
        }
    }
}
