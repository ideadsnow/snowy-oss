import React from "react";
import { Cloud, Settings, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useS3Store } from "./stores/useS3Store";
import ConfigModal from "./components/ConfigModal";
import BucketList from "./components/BucketList";
import ObjectList from "./components/ObjectList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function App() {
  const {
    config,
    isConnected,
    connectionError,
    selectedBucket,
    objects,
    setShowConfigModal,
    clearConfig,
  } = useS3Store();

  const handleOpenConfig = () => {
    setShowConfigModal(true);
  };

  const handleDisconnect = () => {
    clearConfig();
  };

  const getConnectionStatus = () => {
    if (!config) {
      return (
        <Badge variant="outline" className="text-gray-500 border-gray-300">
          未配置
        </Badge>
      );
    }
    if (isConnected) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 text-white">
          <Wifi className="w-3 h-3 mr-1" />
          已连接
        </Badge>
      );
    }
    if (connectionError) {
      return (
        <Badge variant="destructive">
          <WifiOff className="w-3 h-3 mr-1" />
          连接失败
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600 text-white">连接中</Badge>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Snowy OSS Manager
              </h1>
              <p className="text-sm text-gray-600">现代化对象存储管理工具</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {config && (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">
                    {new URL(config.endpoint).hostname}
                  </span>
                  {getConnectionStatus()}
                </div>
                <div className="w-px h-6 bg-gray-300" />
              </>
            )}

            <Button
              variant={config ? "outline" : "default"}
              onClick={handleOpenConfig}
              className="flex items-center space-x-2 shadow-sm"
            >
              <Settings className="w-4 h-4" />
              <span>{config ? "修改配置" : "OSS 配置"}</span>
            </Button>

            {config && (
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="shadow-sm"
              >
                断开连接
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-80 border-r border-gray-200 bg-white shadow-sm">
          <div className="p-6">
            <BucketList />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-gray-50">
          <div className="p-6 flex-1">
            {!config ? (
              <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md shadow-lg border-0">
                  <CardContent className="pt-8 pb-8">
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                        <Cloud className="w-10 h-10 text-blue-600" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          欢迎使用 Snowy OSS Manager
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          请点击"OSS 配置"按钮开始配置您的对象存储服务
                        </p>
                      </div>
                      <Button
                        onClick={handleOpenConfig}
                        className="w-full h-12 text-base font-medium shadow-md"
                      >
                        <Settings className="w-5 h-5 mr-2" />
                        开始配置
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <ObjectList />

                {selectedBucket && (
                  <Card className="shadow-sm border-gray-200">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">
                            当前 Bucket:
                          </span>
                          <p className="text-gray-600 mt-1">{selectedBucket}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">
                            文件数量:
                          </span>
                          <p className="text-gray-600 mt-1">{objects.length}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">
                            总大小:
                          </span>
                          <p className="text-gray-600 mt-1">
                            {objects.reduce(
                              (sum, obj) => sum + (obj.size || 0),
                              0
                            ) > 0
                              ? `${(
                                  objects.reduce(
                                    (sum, obj) => sum + (obj.size || 0),
                                    0
                                  ) /
                                  1024 /
                                  1024
                                ).toFixed(2)} MB`
                              : "0 B"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfigModal />
    </div>
  );
}

export default App;
