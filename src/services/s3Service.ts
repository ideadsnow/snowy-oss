import { invoke } from "@tauri-apps/api/core";
import { S3Config, S3Object, BucketInfo } from "../types/s3";

export class S3Service {
  static async testConnection(config: S3Config): Promise<string> {
    return invoke("test_s3_connection", { config });
  }

  static async listBuckets(config: S3Config): Promise<BucketInfo[]> {
    return invoke("list_buckets", { config });
  }

  static async listObjects(
    config: S3Config,
    bucketName: string,
    prefix?: string
  ): Promise<S3Object[]> {
    console.log("Calling list_objects with:", { config, bucketName, prefix });
    const request = {
      config,
      bucketName: bucketName,
      prefix,
    };
    return invoke("list_objects", { request });
  }

  static async deleteObjects(
    config: S3Config,
    bucketName: string,
    objectKeys: string[]
  ): Promise<string> {
    const request = {
      config,
      bucketName: bucketName,
      objectKeys: objectKeys,
    };
    return invoke("delete_objects", { request });
  }

  static async getPresignedUrl(
    config: S3Config,
    bucketName: string,
    objectKey: string,
    expiresInSeconds?: number
  ): Promise<string> {
    const request = {
      config,
      bucketName: bucketName,
      objectKey: objectKey,
      expiresInSeconds: expiresInSeconds,
    };
    return invoke("get_presigned_url", { request });
  }

  static getFileType(filename: string): "image" | "video" | "text" | "other" {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
      return "image";
    }
    if (["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(ext)) {
      return "video";
    }
    if (["txt", "md", "json", "xml", "csv", "log"].includes(ext)) {
      return "text";
    }
    return "other";
  }

  static formatFileSize(bytes?: number): string {
    if (!bytes) return "0 B";

    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  static async uploadFile(
    config: S3Config,
    bucketName: string,
    objectKey: string,
    filePath: string,
    contentType?: string
  ): Promise<string> {
    const request = {
      config,
      bucketName: bucketName,
      objectKey: objectKey,
      filePath: filePath,
      contentType: contentType,
    };
    return invoke("upload_file", { request });
  }

  static async uploadFilesWithDialog(
    config: S3Config,
    bucketName: string,
    prefix?: string
  ): Promise<string[]> {
    return invoke("upload_files_with_dialog", {
      config,
      bucketName: bucketName,
      prefix: prefix || null,
    });
  }

  static getContentType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    const mimeTypes: Record<string, string> = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      bmp: "image/bmp",
      ico: "image/x-icon",

      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

      // Text
      txt: "text/plain",
      md: "text/markdown",
      html: "text/html",
      htm: "text/html",
      css: "text/css",
      js: "text/javascript",
      json: "application/json",
      xml: "text/xml",
      csv: "text/csv",

      // Audio
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      flac: "audio/flac",

      // Video
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      wmv: "video/x-ms-wmv",
      flv: "video/x-flv",
      webm: "video/webm",

      // Archives
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",
    };

    return mimeTypes[ext] || "application/octet-stream";
  }
}
