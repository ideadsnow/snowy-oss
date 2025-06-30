import React, { useEffect } from "react";
import {
  FolderOpen,
  Database,
  RefreshCw,
  AlertCircle,
  Check,
} from "lucide-react";
import { useS3Store } from "../stores/useS3Store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BucketList: React.FC = () => {
  const {
    config,
    buckets,
    isLoadingBuckets: loading,
    error,
    selectedBucket,
    fetchBuckets,
    selectBucket,
  } = useS3Store();

  useEffect(() => {
    if (config && !buckets.length) {
      fetchBuckets();
    }
  }, [config, buckets.length]); // 移除 fetchBuckets 依赖，避免重复调用

  const handleRefresh = () => {
    fetchBuckets();
  };

  if (!config) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
            <Database className="w-5 h-5 mr-2 text-gray-600" />
            Bucket 列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-600 font-medium">请先配置 OSS 连接</p>
              <p className="text-sm text-gray-500">
                配置完成后即可查看 Bucket 列表
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
            <Database className="w-5 h-5 mr-2 text-gray-600" />
            Bucket 列表
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="shadow-sm border-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-8 h-8 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">正在加载 Bucket 列表...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <p className="text-red-600 font-medium">加载失败</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="shadow-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </div>
        ) : buckets.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-600 font-medium">暂无 Bucket</p>
              <p className="text-sm text-gray-500">
                您的账户下还没有创建任何 Bucket
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {buckets.map((bucket) => (
              <button
                key={bucket.name}
                onClick={() => selectBucket(bucket.name)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  selectedBucket === bucket.name
                    ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedBucket === bucket.name
                          ? "bg-blue-600 text-white"
                          : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
                      }`}
                    >
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          selectedBucket === bucket.name
                            ? "text-blue-900"
                            : "text-gray-900"
                        }`}
                      >
                        {bucket.name}
                      </p>
                      {bucket.creationDate && (
                        <p
                          className={`text-sm ${
                            selectedBucket === bucket.name
                              ? "text-blue-700"
                              : "text-gray-500"
                          }`}
                        >
                          创建于{" "}
                          {new Date(bucket.creationDate).toLocaleDateString(
                            "zh-CN"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedBucket === bucket.name && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BucketList;
