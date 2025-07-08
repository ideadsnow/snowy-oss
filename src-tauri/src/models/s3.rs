use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S3Config {
    pub endpoint: String,
    pub region: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub bucket: Option<String>,
    pub custom_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct S3Object {
    pub key: String,
    pub size: Option<i64>,
    pub last_modified: Option<String>,
    pub etag: Option<String>,
    pub storage_class: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BucketInfo {
    pub name: String,
    pub creation_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListObjectsRequest {
    pub config: S3Config,
    #[serde(rename = "bucketName")]
    pub bucket_name: String,
    pub prefix: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteObjectsRequest {
    pub config: S3Config,
    #[serde(rename = "bucketName")]
    pub bucket_name: String,
    #[serde(rename = "objectKeys")]
    pub object_keys: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetPresignedUrlRequest {
    pub config: S3Config,
    #[serde(rename = "bucketName")]
    pub bucket_name: String,
    #[serde(rename = "objectKey")]
    pub object_key: String,
    #[serde(rename = "expiresInSeconds")]
    pub expires_in_seconds: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DownloadFileRequest {
    pub config: S3Config,
    #[serde(rename = "bucketName")]
    pub bucket_name: String,
    #[serde(rename = "objectKey")]
    pub object_key: String,
    #[serde(rename = "defaultFileName")]
    pub default_file_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadFileRequest {
    pub config: S3Config,
    #[serde(rename = "bucketName")]
    pub bucket_name: String,
    #[serde(rename = "objectKey")]
    pub object_key: String,
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "contentType")]
    pub content_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadFileBytesRequest {
    pub config: S3Config,
    #[serde(rename = "bucketName")]
    pub bucket_name: String,
    #[serde(rename = "objectKey")]
    pub object_key: String,
    #[serde(rename = "fileBytes")]
    pub file_bytes: Vec<u8>,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "contentType")]
    pub content_type: String,
}
