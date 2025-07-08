import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useS3Store } from "../stores/useS3Store";
import { S3Service } from "../services/s3Service";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ open, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const { config, uploadFilesWithDialog, selectedBucket, currentPrefix } =
    useS3Store();

  // 简化的拖拽处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🎯 Drag enter detected");
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("👋 Drag leave detected");
    // 只有当拖拽真正离开拖拽区域时才设置为false
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🔄 Drag over detected");
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("💎 Drop detected!");
      setIsDragOver(false);

      if (!config || !selectedBucket) {
        setUploadResults(["❌ 请先配置 OSS 连接并选择 Bucket"]);
        return;
      }

      const files = e.dataTransfer.files;
      console.log(`📁 Files detected: ${files.length}`);

      if (files && files.length > 0) {
        setUploading(true);
        setUploadResults([]);

        try {
          const results: string[] = [];
          let successCount = 0;
          let errorCount = 0;

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`⬆️ Uploading: ${file.name}`);

            try {
              const arrayBuffer = await file.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              const objectKey = currentPrefix
                ? `${currentPrefix}${file.name}`
                : file.name;
              const contentType = S3Service.getContentType(file.name);

              const { invoke } = await import("@tauri-apps/api/core");
              const uploadRequest = {
                config,
                bucketName: selectedBucket,
                objectKey: objectKey,
                fileBytes: Array.from(uint8Array),
                fileName: file.name,
                contentType: contentType,
              };

              const result = await invoke("upload_file_from_bytes", {
                request: uploadRequest,
              });

              console.log(`✅ Upload success: ${file.name}`);
              results.push(`✅ ${result}`);
              successCount++;
            } catch (error) {
              console.error(`❌ Upload failed: ${file.name}`, error);
              results.push(
                `❌ 上传 '${file.name}' 失败: ${
                  error instanceof Error ? error.message : "未知错误"
                }`
              );
              errorCount++;
            }
          }

          results.unshift(
            `📊 拖拽上传完成: ${successCount} 成功, ${errorCount} 失败`
          );
          setUploadResults(results);

          if (successCount > 0) {
            const { fetchObjects } = useS3Store.getState();
            await fetchObjects();
          }
        } catch (error) {
          console.error("❌ Upload error:", error);
          setUploadResults([
            `❌ 拖拽上传失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`,
          ]);
        } finally {
          setUploading(false);
        }
      }
    },
    [config, selectedBucket, currentPrefix]
  );

  const handleQuickUpload = useCallback(async () => {
    setUploading(true);
    setUploadResults([]);

    try {
      const results = await uploadFilesWithDialog();
      setUploadResults(results);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadResults([
        `上传失败: ${error instanceof Error ? error.message : "未知错误"}`,
      ]);
    } finally {
      setUploading(false);
    }
  }, [uploadFilesWithDialog]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // 只在非拖拽状态下处理点击
      if (!isDragOver) {
        handleQuickUpload();
      }
    },
    [isDragOver, handleQuickUpload]
  );

  const handleClose = () => {
    if (!uploading) {
      setUploadResults([]);
      onClose();
    }
  };

  const getResultIcon = (result: string) => {
    if (result.startsWith("✓")) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (result.startsWith("✗")) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    } else {
      return <FileIcon className="w-4 h-4 text-blue-600" />;
    }
  };

  const getResultStyle = (result: string) => {
    if (result.startsWith("✓")) {
      return "text-green-700 bg-green-50 border-green-200";
    } else if (result.startsWith("✗")) {
      return "text-red-700 bg-red-50 border-red-200";
    } else {
      return "text-blue-700 bg-blue-50 border-blue-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>文件上传</span>
          </DialogTitle>
          <DialogDescription>
            拖拽文件到下方区域或点击选择文件进行上传
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* 当前路径信息 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 text-sm">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">上传目标:</span>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {selectedBucket}
                </Badge>
                {currentPrefix && (
                  <>
                    <span className="text-blue-600">/</span>
                    <span className="text-blue-700 font-mono text-xs">
                      {currentPrefix}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 拖拽上传区域 */}
          <div
            ref={dropRef}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
              isDragOver
                ? "border-blue-400 bg-blue-50 shadow-lg scale-105"
                : "border-gray-300 hover:border-gray-400 hover:shadow-md"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onClick={handleQuickUpload}
          >
            <div className="space-y-4">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-200 ${
                  isDragOver
                    ? "bg-blue-600 scale-110"
                    : "bg-gradient-to-br from-blue-100 to-blue-200"
                }`}
              >
                <Upload
                  className={`w-8 h-8 transition-all duration-200 ${
                    isDragOver ? "text-white animate-bounce" : "text-blue-600"
                  }`}
                />
              </div>
              <div className="space-y-2">
                <h3
                  className={`text-lg font-semibold transition-colors duration-200 ${
                    isDragOver ? "text-blue-700" : "text-gray-900"
                  }`}
                >
                  {isDragOver ? "释放文件开始上传" : "选择文件上传"}
                </h3>
                <p
                  className={`transition-colors duration-200 ${
                    isDragOver ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  {isDragOver
                    ? "将文件拖放到这里..."
                    : "点击此区域选择文件，或直接拖拽文件到这里"}
                </p>
                <p className="text-sm text-gray-500">
                  支持多文件同时上传、拖拽上传，文件大小无限制
                </p>
              </div>
            </div>
          </div>

          {/* 上传结果 */}
          {(uploading || uploadResults.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <span>{uploading ? "上传中..." : "上传结果"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {uploading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
                      <p className="text-gray-600">正在上传文件，请稍候...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploadResults.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-2 p-3 rounded-lg border ${getResultStyle(
                          result
                        )}`}
                      >
                        {getResultIcon(result)}
                        <span className="text-sm flex-1 break-all">
                          {result}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {uploading
              ? "上传中..."
              : uploadResults.length > 0
              ? "完成"
              : "取消"}
          </Button>
          {!uploading && uploadResults.length === 0 && (
            <Button
              onClick={handleQuickUpload}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              选择文件
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
