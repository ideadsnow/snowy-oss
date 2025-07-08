import React from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useS3Store } from "../stores/useS3Store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const UploadProgressIndicator: React.FC = () => {
  const {
    uploadProgresses,
    isUploading,
    removeUploadProgress,
    clearUploadProgresses,
  } = useS3Store();

  if (uploadProgresses.length === 0) return null;

  const completedCount = uploadProgresses.filter(
    (p) => p.status === "completed"
  ).length;
  const errorCount = uploadProgresses.filter(
    (p) => p.status === "error"
  ).length;
  const uploadingCount = uploadProgresses.filter(
    (p) => p.status === "uploading"
  ).length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-blue-600" />
              )}
              <h3 className="font-semibold text-gray-900">
                {isUploading ? "正在上传" : "上传完成"}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearUploadProgresses}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 总体进度 */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">总进度</span>
              <span className="text-gray-900 font-medium">
                {completedCount + errorCount} / {uploadProgresses.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((completedCount + errorCount) / uploadProgresses.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* 状态统计 */}
          <div className="flex items-center space-x-2 mb-3">
            {uploadingCount > 0 && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {uploadingCount} 上传中
              </Badge>
            )}
            {completedCount > 0 && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {completedCount} 成功
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {errorCount} 失败
              </Badge>
            )}
          </div>

          {/* 文件列表 */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadProgresses.map((progress) => (
              <div
                key={progress.filename}
                className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50"
              >
                <div className="flex-shrink-0">
                  {progress.status === "uploading" && (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                  {progress.status === "completed" && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {progress.status === "error" && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {progress.filename}
                  </p>
                  {progress.status === "uploading" && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  )}
                  {progress.status === "error" && progress.error && (
                    <p className="text-xs text-red-600 truncate mt-1">
                      {progress.error}
                    </p>
                  )}
                  {progress.size && (
                    <p className="text-xs text-gray-500 mt-1">
                      {(progress.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>

                {progress.status !== "uploading" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadProgress(progress.filename)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadProgressIndicator;
