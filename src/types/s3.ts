export interface S3Config {
  endpoint: string;
  region: string;
  access_key_id: string;
  secret_access_key: string;
  bucket?: string;
  custom_path?: string;
}

export interface S3Object {
  key: string;
  size?: number;
  last_modified?: string;
  etag?: string;
  storage_class?: string;
}

export interface BucketInfo {
  name: string;
  creation_date?: string;
}

export interface FilePreview {
  url: string;
  type: "image" | "video" | "text" | "other";
  name: string;
}

export interface UploadFileRequest {
  config: S3Config;
  bucket_name: string;
  object_key: string;
  file_path: string;
  content_type?: string;
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  size?: number;
  uploadedSize?: number;
}

export interface UploadResult {
  success: boolean;
  message: string;
  filename: string;
  objectKey: string;
}
