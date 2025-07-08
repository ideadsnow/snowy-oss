use aws_sdk_s3::{Client, Error};
use aws_sdk_s3::config::Region;

use crate::models::s3::S3Config;

/// 创建 S3 客户端
pub async fn create_s3_client(config: &S3Config) -> Result<Client, Error> {
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
        assert!(
            result.is_ok(),
            "S3 client creation with empty region should succeed"
        );
    }

    #[tokio::test]
    async fn test_create_s3_client_with_auto_region() {
        let mut config = create_test_config();
        config.region = "auto".to_string();
        let result = create_s3_client(&config).await;
        assert!(
            result.is_ok(),
            "S3 client creation with 'auto' region should succeed"
        );
    }

    #[test]
    fn test_region_handling() {
        let test_cases = vec![
            ("", "us-east-1"),          // Empty should default to us-east-1
            ("auto", "us-east-1"),      // auto should default to us-east-1
            ("us-west-2", "us-west-2"), // Specific region should be preserved
            ("eu-west-1", "eu-west-1"), // EU region should be preserved
        ];

        for (input_region, expected_region) in test_cases {
            let processed_region = if input_region.is_empty() || input_region == "auto" {
                "us-east-1".to_string()
            } else {
                input_region.to_string()
            };
            assert_eq!(
                processed_region, expected_region,
                "Failed for input: {}",
                input_region
            );
        }
    }
}
