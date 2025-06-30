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
