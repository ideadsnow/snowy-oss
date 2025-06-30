import React, { useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Download,
  Maximize,
  Minimize,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useS3Store } from '../stores/useS3Store';
import { S3Service } from '../services/s3Service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ImagePreviewModal: React.FC = () => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(true);
  const [toolbarTimeout, setToolbarTimeout] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const {
    showImagePreview,
    previewImageUrl,
    setShowImagePreview,
    config,
    selectedBucket,
    currentPreviewObject,
  } = useS3Store();

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotifications({ type, message });
    setTimeout(() => setNotifications(null), 3000);
  };

  // 获取当前全屏元素（兼容不同浏览器和 Tauri）
  const getFullscreenElement = () => {
    // 对于 Web Fullscreen API
    return document.fullscreenElement ||
           (document as any).webkitFullscreenElement ||
           (document as any).mozFullScreenElement ||
           (document as any).msFullscreenElement;
  };

  // 检查是否为全屏状态（用于按钮显示）
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 监听全屏状态变化
  useEffect(() => {
    const updateFullscreenStatus = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const window = getCurrentWindow();
          const tauriFullscreen = await window.isFullscreen();
          setIsFullscreen(tauriFullscreen);
        } else {
          setIsFullscreen(!!getFullscreenElement());
        }
      } catch (error) {
        setIsFullscreen(!!getFullscreenElement());
      }
    };

    const handleFullscreenChange = () => {
      updateFullscreenStatus();
    };

    // 监听全屏状态变化事件
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // 初始状态检查
    updateFullscreenStatus();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [showImagePreview]);

  // 重置状态当模态框打开时
  useEffect(() => {
    if (showImagePreview) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setImageError(false);
      setImageLoaded(false);
      setLoading(true);
      setShowToolbar(true);

      if (toolbarTimeout) {
        clearTimeout(toolbarTimeout);
      }
    }
  }, [showImagePreview]);



  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation(prev => prev + 90);
  };

  const handleReset = () => {
    setScale(1); // 重置到当前CSS适应大小（100%）
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleFullscreen = async () => {
    try {
      // 检查是否在 Tauri 环境中
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const window = getCurrentWindow();
          const isFullscreen = await window.isFullscreen();

          if (isFullscreen) {
            await window.setFullscreen(false);
            showNotification('success', '已退出全屏');
          } else {
            await window.setFullscreen(true);
            showNotification('success', '已进入全屏');
          }
          return;
        } catch (tauriError) {
          console.warn('Tauri fullscreen failed, falling back to web API:', tauriError);
        }
      }

      // 回退到 Web Fullscreen API
      const requestFullscreen = document.documentElement.requestFullscreen ||
                               (document.documentElement as any).webkitRequestFullscreen ||
                               (document.documentElement as any).mozRequestFullScreen ||
                               (document.documentElement as any).msRequestFullscreen;

      const exitFullscreen = document.exitFullscreen ||
                            (document as any).webkitExitFullscreen ||
                            (document as any).mozCancelFullScreen ||
                            (document as any).msExitFullscreen;

      const fullscreenElement = getFullscreenElement();

      if (!requestFullscreen || !exitFullscreen) {
        showNotification('error', '您的浏览器不支持全屏功能');
        return;
      }

      if (!fullscreenElement) {
        // 进入全屏
        await requestFullscreen.call(document.documentElement);
        showNotification('success', '已进入全屏');
      } else {
        // 退出全屏
        await exitFullscreen.call(document);
        showNotification('success', '已退出全屏');
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      showNotification('error', '全屏功能暂不可用');
    }
  };

    const handleDownload = async () => {
    if (!config || !selectedBucket || !currentPreviewObject) {
      showNotification('error', '无法确定要下载的文件');
      return;
    }

        try {
      // 先尝试 Tauri 原生下载，如果失败则回退到浏览器下载
      try {
        await downloadWithTauri(currentPreviewObject);
      } catch (tauriError: any) {
        console.warn('Tauri 下载不可用，使用浏览器下载:', tauriError.message);
        if (tauriError.message?.includes('not found') ||
            tauriError.message?.includes('command') ||
            tauriError.message?.includes('Command') ||
            tauriError.message?.includes('invoke')) {
          await downloadWithBrowser(currentPreviewObject);
        } else {
          throw tauriError; // 重新抛出非命令相关的错误
        }
      }
    } catch (error) {
      console.error('下载失败:', error);
      showNotification('error', '下载失败');
    }
  };

  const downloadWithTauri = async (object: any) => {
    // 使用 Tauri v2 的核心 invoke 方法来调用后端实现的下载功能
    const { invoke } = await import('@tauri-apps/api/core');

    const fileName = object.key.split('/').pop() || object.key;
    showNotification('info', '正在选择保存位置...');

    // 调用后端的下载文件函数
    const result = await invoke('download_file', {
      request: {
        config: config!,
        bucket_name: selectedBucket!,
        object_key: object.key,
        default_file_name: fileName
      }
    });

    showNotification('success', `文件已保存: ${result}`);
  };



  const downloadWithBrowser = async (object: any) => {
    try {
      showNotification('info', '正在生成下载链接...');
      const url = await S3Service.getPresignedUrl(config!, selectedBucket!, object.key);

      const link = document.createElement('a');
      link.href = url;
      link.download = object.key.split('/').pop() || object.key;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('success', '下载已开始');
    } catch (error) {
      throw error;
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setImageError(true);
    setImageLoaded(false);
  };

  const handleClose = () => {
    setShowImagePreview(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showImagePreview) return;

    switch (e.key) {
      case 'Escape':
        handleClose();
        break;
      case '=':
      case '+':
        e.preventDefault();
        handleZoomIn();
        break;
      case '-':
        e.preventDefault();
        handleZoomOut();
        break;
      case '0':
        e.preventDefault();
        handleReset();
        break;
    }
  };

  // 鼠标滚轮缩放
  const handleWheel = (e: WheelEvent) => {
    if (!showImagePreview || !imageLoaded) return;

    e.preventDefault();
    const delta = e.deltaY;

    if (delta < 0) {
      setScale(prev => Math.min(prev * 1.1, 5));
    } else {
      setScale(prev => Math.max(prev / 1.1, 0.1));
    }
  };

  // 鼠标拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;

    setIsDragging(true);
    // 记录鼠标按下的位置
    setLastMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;

    // 计算鼠标移动的增量
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    // 根据缩放级别调整拖拽速度，放大越多移动越慢
    const dragSpeed = Math.max(0.4, 1 / scale);

    // 应用速度调整并累加到当前位置
    setPosition(prev => ({
      x: prev.x + deltaX * dragSpeed,
      y: prev.y + deltaY * dragSpeed,
    }));

    // 更新鼠标位置
    setLastMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 工具栏自动隐藏
  const handleMouseActivity = () => {
    setShowToolbar(true);

    if (toolbarTimeout) {
      clearTimeout(toolbarTimeout);
    }

    const timeout = setTimeout(() => {
      setShowToolbar(false);
    }, 3000);

    setToolbarTimeout(timeout);
  };

  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => handleKeyDown(e);
    const handleWheelGlobal = (e: WheelEvent) => handleWheel(e);

    document.addEventListener('keydown', handleKeyDownGlobal);
    document.addEventListener('wheel', handleWheelGlobal, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDownGlobal);
      document.removeEventListener('wheel', handleWheelGlobal);
      if (toolbarTimeout) {
        clearTimeout(toolbarTimeout);
      }
    };
  }, [showImagePreview, imageLoaded, scale, toolbarTimeout]);

  return (
    <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] p-0 bg-black border-none">
        {/* 隐藏的可访问性标题 */}
        <DialogHeader className="sr-only">
          <DialogTitle>
            {currentPreviewObject ? `图片预览: ${currentPreviewObject.key}` : '图片预览'}
          </DialogTitle>
        </DialogHeader>
        <div
          className="relative w-full h-[94vh] overflow-hidden"
          onMouseMove={handleMouseActivity}
        >
          {/* 通知栏 */}
          {notifications && (
            <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg ${
              notifications.type === 'success' ? 'bg-green-600 text-white' :
              notifications.type === 'error' ? 'bg-red-600 text-white' :
              'bg-blue-600 text-white'
            }`}>
              {notifications.message}
            </div>
          )}

          {/* 顶部工具栏 */}
          <div className={`absolute top-0 left-0 right-0 z-40 bg-black/80 p-3 flex justify-between items-center transition-transform duration-300 ${
            showToolbar ? 'translate-y-0' : '-translate-y-full'
          }`}>
            <h3 className="text-white text-lg font-medium">图片预览</h3>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="text-white hover:bg-white/20"
                title="缩小 (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="text-white hover:bg-white/20"
                title="放大 (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotateLeft}
                className="text-white hover:bg-white/20"
                title="向左旋转"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotateRight}
                className="text-white hover:bg-white/20"
                title="向右旋转"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-white hover:bg-white/20"
                title="重置 (0)"
              >
                重置
              </Button>
                                              <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20"
                  title="下载"
                >
                  <Download className="w-4 h-4" />
                </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white hover:bg-white/20"
                title="关闭 (ESC)"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 图片容器 */}
          <div
            className={`flex items-center justify-center w-full h-full overflow-hidden relative ${
              scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                <Loader2 className="w-8 h-8 animate-spin text-white mb-4" />
                <div className="text-white">正在加载图片...</div>
              </div>
            )}

            {imageError && (
              <div className="text-white text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <div className="text-lg mb-2">图片加载失败</div>
                <div className="text-sm opacity-70">请检查网络连接或稍后重试</div>
              </div>
            )}

            {previewImageUrl && (
              <img
                ref={setImageRef}
                src={previewImageUrl}
                alt="图片预览"
                onLoad={handleImageLoad}
                onError={handleImageError}
                className={`transition-transform duration-200 select-none ${
                  loading || imageError ? 'hidden' : 'block'
                } max-w-full max-h-full object-contain`}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                  pointerEvents: 'none',
                }}
                draggable={false}
              />
            )}
          </div>

          {/* 底部提示 */}
          {imageLoaded && showToolbar && (
            <div className={`absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-center transition-transform duration-300 ${
              showToolbar ? 'translate-y-0' : 'translate-y-full'
            }`}>
              <div className="text-white/70 text-xs">
                快捷键: +/- 缩放 | 鼠标滚轮缩放 | 拖拽移动 | 0 重置 | ESC 关闭
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;

