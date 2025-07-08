import React, { useEffect, useState, useMemo } from "react";
import {
  Trash2,
  Eye,
  RefreshCw,
  Download,
  FileImage,
  File,
  AlertTriangle,
  Check,
  X,
  Folder,
  FolderOpen,
  ChevronRight,
  Home,
  Upload,
} from "lucide-react";
import { useS3Store } from "../stores/useS3Store";
import { S3Service } from "../services/s3Service";
import { S3Object } from "../types/s3";
import ImagePreviewModal from "./ImagePreviewModal";
import UploadModal from "./UploadModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const ObjectList: React.FC = () => {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [notifications, setNotifications] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const {
    config,
    selectedBucket,
    objects,
    selectedObjects,
    currentPrefix,
    isLoadingObjects,
    setSelectedObjects,
    toggleObjectSelection,
    setCurrentPrefix,
    fetchObjects,
    deleteObjects,
    setShowImagePreview,
  } = useS3Store();

  // 解析文件夹结构
  const { folders, files } = useMemo(() => {
    const folders = new Set<string>();
    const files: S3Object[] = [];

    const prefix = currentPrefix || "";

    objects.forEach((obj) => {
      // 移除当前前缀
      const relativePath = prefix ? obj.key.replace(prefix, "") : obj.key;

      // 跳过空路径
      if (!relativePath) return;

      const pathParts = relativePath.split("/");

      if (pathParts.length > 1 && pathParts[0]) {
        // 这是一个文件夹中的项目
        folders.add(pathParts[0]);
      } else if (pathParts[0] && !pathParts[0].includes("/")) {
        // 这是当前目录下的文件
        files.push(obj);
      }
    });

    return {
      folders: Array.from(folders).sort(),
      files: files.sort((a, b) => a.key.localeCompare(b.key)),
    };
  }, [objects, currentPrefix]);

  // 面包屑导航
  const breadcrumbs = useMemo(() => {
    if (!currentPrefix) return [];

    const parts = currentPrefix.split("/").filter(Boolean);
    const crumbs = [];

    for (let i = 0; i < parts.length; i++) {
      crumbs.push({
        name: parts[i],
        path: parts.slice(0, i + 1).join("/") + "/",
      });
    }

    return crumbs;
  }, [currentPrefix]);

  const showNotification = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    setNotifications({ type, message });
    setTimeout(() => setNotifications(null), 5000);
  };

  useEffect(() => {
    if (selectedBucket) {
      fetchObjects().catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        showNotification("error", `加载文件列表失败: ${errorMessage}`);
      });
    }
  }, [selectedBucket, currentPrefix]); // 移除 fetchObjects 依赖，避免重复调用

  const handleRefresh = () => {
    fetchObjects().catch((error) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showNotification("error", `刷新文件列表失败: ${errorMessage}`);
    });
  };

  const handlePreview = async (object: S3Object) => {
    if (!config || !selectedBucket) return;

    try {
      const fileType = S3Service.getFileType(object.key);

      if (fileType === "image") {
        const url = await S3Service.getPresignedUrl(
          config,
          selectedBucket,
          object.key
        );
        setShowImagePreview(true, url, object);
      } else {
        showNotification("info", "该文件类型不支持预览");
      }
    } catch (error) {
      console.error("Failed to generate preview URL:", error);
      showNotification("error", "生成预览链接失败");
    }
  };

  const handleDownload = async (object: S3Object) => {
    if (!config || !selectedBucket) return;

    try {
      // 先尝试 Tauri 原生下载，如果失败则回退到浏览器下载
      try {
        await downloadWithTauri(object);
      } catch (tauriError: any) {
        console.warn("Tauri 下载不可用，使用浏览器下载:", tauriError.message);
        if (
          tauriError.message?.includes("not found") ||
          tauriError.message?.includes("command") ||
          tauriError.message?.includes("Command") ||
          tauriError.message?.includes("invoke")
        ) {
          await downloadWithBrowser(object);
        } else {
          throw tauriError; // 重新抛出非命令相关的错误
        }
      }
    } catch (error) {
      console.error("下载失败:", error);
      showNotification("error", "下载失败");
    }
  };

  const downloadWithTauri = async (object: S3Object) => {
    // 使用 Tauri v2 的核心 invoke 方法来调用后端实现的下载功能
    const { invoke } = await import("@tauri-apps/api/core");

    const fileName = object.key.split("/").pop() || object.key;
    showNotification("info", "正在选择保存位置...");

    // 调用后端的下载文件函数
    const result = await invoke("download_file", {
      request: {
        config: config!,
        bucket_name: selectedBucket!,
        object_key: object.key,
        default_file_name: fileName,
      },
    });

    showNotification("success", `文件已保存: ${result}`);
  };

  const downloadWithBrowser = async (object: S3Object) => {
    try {
      showNotification("info", "正在生成下载链接...");
      const url = await S3Service.getPresignedUrl(
        config!,
        selectedBucket!,
        object.key
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = object.key.split("/").pop() || object.key;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", "下载已开始");
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = () => {
    if (selectedObjects.length === 0) {
      showNotification("info", "请选择要删除的文件");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!config || !selectedBucket) return;

    try {
      setDeleting(true);
      await deleteObjects(selectedObjects);
      showNotification("success", `成功删除 ${selectedObjects.length} 个文件`);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete objects:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showNotification("error", `删除文件失败: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const fileType = S3Service.getFileType(filename);
    return fileType === "image" ? (
      <FileImage className="w-4 h-4 text-green-500" />
    ) : (
      <File className="w-4 h-4 text-gray-500" />
    );
  };

  const getFileTypeTag = (filename: string) => {
    const fileType = S3Service.getFileType(filename);
    return fileType.toUpperCase();
  };

  const getFileTypeBadgeClass = (filename: string) => {
    const fileType = S3Service.getFileType(filename);
    const colorClasses = {
      image: "bg-green-100 text-green-800 border-green-200",
      video: "bg-blue-100 text-blue-800 border-blue-200",
      text: "bg-orange-100 text-orange-800 border-orange-200",
      other: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return colorClasses[fileType];
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedObjects(files.map((obj) => obj.key));
    } else {
      setSelectedObjects([]);
    }
  };

  // 进入文件夹
  const handleFolderClick = (folderName: string) => {
    const newPrefix = (currentPrefix || "") + folderName + "/";
    setCurrentPrefix(newPrefix);
  };

  // 导航到指定路径
  const handleBreadcrumbClick = (path: string) => {
    setCurrentPrefix(path);
  };

  // 返回根目录
  const handleGoHome = () => {
    setCurrentPrefix("");
  };

  if (!selectedBucket) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <File className="w-10 h-10 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                请选择 Bucket
              </h3>
              <p className="text-gray-600">
                请从左侧 Bucket 列表中选择一个 Bucket 来查看文件
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* 通知栏 */}
      {notifications && (
        <div
          className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
            notifications.type === "success"
              ? "bg-green-50 border-green-400 text-green-800"
              : notifications.type === "error"
              ? "bg-red-50 border-red-400 text-red-800"
              : "bg-blue-50 border-blue-400 text-blue-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {notifications.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : notifications.type === "error" ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            <span className="font-medium">{notifications.message}</span>
          </div>
          {notifications.type === "success" && (
            <button
              onClick={() => setNotifications(null)}
              className="text-current hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-xl font-bold text-gray-900">
                {selectedBucket} 文件列表
              </CardTitle>
              <Badge
                variant="outline"
                className="text-gray-600 border-gray-300"
              >
                {folders.length + files.length} 个项目
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {selectedObjects.length > 0 && (
                <>
                  <Badge className="bg-blue-600 text-white">
                    已选择 {selectedObjects.length} 个
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="shadow-sm"
                  >
                    {deleting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    批量删除
                  </Button>
                </>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                上传文件
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoadingObjects}
                className="shadow-sm border-gray-300"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isLoadingObjects ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </div>
          </div>

          {/* 面包屑导航 */}
          <div className="flex items-center space-x-2 pt-3 border-t border-gray-100 mt-3">
            <button
              onClick={handleGoHome}
              className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
            >
              <Home className="w-4 h-4" />
              <span>根目录</span>
            </button>

            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                  className="px-2 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {(folders.length > 0 || files.length > 0) && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                checked={
                  selectedObjects.length === files.length && files.length > 0
                }
                onCheckedChange={handleSelectAll}
                className="border-gray-300"
              />
              <span className="text-sm text-gray-600">全选文件</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {isLoadingObjects ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">正在加载文件列表...</p>
            </div>
          ) : folders.length + files.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Folder className="w-10 h-10 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  文件夹为空
                </h3>
                <p className="text-gray-600">
                  当前文件夹中没有任何文件或子文件夹
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 文件夹列表 */}
              {folders.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Folder className="w-4 h-4 mr-2" />
                    文件夹 ({folders.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {folders.map((folder) => (
                      <button
                        key={folder}
                        onClick={() => handleFolderClick(folder)}
                        className="group p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-colors">
                            <FolderOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {folder}
                            </p>
                            <p className="text-sm text-gray-500">文件夹</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 文件列表 */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <File className="w-4 h-4 mr-2" />
                    文件 ({files.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {files.map((object) => (
                      <div
                        key={object.key}
                        className={`group relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                          selectedObjects.includes(object.key)
                            ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={selectedObjects.includes(object.key)}
                            onCheckedChange={() =>
                              toggleObjectSelection(object.key)
                            }
                            className="mt-1 border-gray-300"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                {getFileIcon(object.key)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  className="font-medium text-gray-900 truncate"
                                  title={object.key}
                                >
                                  {object.key.split("/").pop()}
                                </p>

                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs px-2 py-0 border ${getFileTypeBadgeClass(
                                      object.key
                                    )}`}
                                  >
                                    {getFileTypeTag(object.key)}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {S3Service.formatFileSize(object.size)}
                                  </span>
                                </div>

                                {object.last_modified && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(
                                      object.last_modified
                                    ).toLocaleString("zh-CN")}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(object)}
                                className="h-8 px-2 text-xs shadow-sm"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                下载
                              </Button>

                              {S3Service.getFileType(object.key) ===
                                "image" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreview(object)}
                                  className="h-8 px-2 text-xs shadow-sm"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  预览
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span>确认删除</span>
            </DialogTitle>
            <DialogDescription>
              你确定要删除选中的 {selectedObjects.length} 个文件吗？
              <br />
              <span className="text-destructive font-medium">
                此操作不可逆！
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImagePreviewModal />

      {/* 上传模态框 */}
      <UploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </>
  );
};

export default ObjectList;
