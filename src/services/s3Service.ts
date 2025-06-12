import { invoke } from '@tauri-apps/api/core';
import { S3Config, S3Object, BucketInfo } from '../types/s3';

export class S3Service {
  static async testConnection(config: S3Config): Promise<string> {
    return invoke('test_s3_connection', { config });
  }

  static async listBuckets(config: S3Config): Promise<BucketInfo[]> {
    return invoke('list_buckets', { config });
  }

  static async listObjects(
    config: S3Config,
    bucketName: string,
    prefix?: string
  ): Promise<S3Object[]> {
    console.log('Calling list_objects with:', { config, bucketName, prefix });
    const request = {
      config,
      bucket_name: bucketName,
      prefix,
    };
    return invoke('list_objects', { request });
  }

  static async deleteObjects(
    config: S3Config,
    bucketName: string,
    objectKeys: string[]
  ): Promise<string> {
    const request = {
      config,
      bucket_name: bucketName,
      object_keys: objectKeys,
    };
    return invoke('delete_objects', { request });
  }

  static async getPresignedUrl(
    config: S3Config,
    bucketName: string,
    objectKey: string,
    expiresInSeconds?: number
  ): Promise<string> {
    const request = {
      config,
      bucket_name: bucketName,
      object_key: objectKey,
      expires_in_seconds: expiresInSeconds,
    };
    return invoke('get_presigned_url', { request });
  }

  static getFileType(filename: string): 'image' | 'video' | 'text' | 'other' {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return 'image';
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
      return 'video';
    }
    if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(ext)) {
      return 'text';
    }
    return 'other';
  }

  static formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
}

