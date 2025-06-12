import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, message, Spin, Typography } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useS3Store } from '../stores/useS3Store';
import { S3Service } from '../services/s3Service';

const { Text } = Typography;

const ImagePreviewModal: React.FC = () => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(true);
  const [toolbarTimeout, setToolbarTimeout] = useState<NodeJS.Timeout | null>(null);

  const {
    showImagePreview,
    previewImageUrl,
    setShowImagePreview,
    config,
    selectedBucket,
    currentPreviewObject,
  } = useS3Store();

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
      
      // 清除可能存在的工具栏隐藏定时器
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
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      // 进入全屏
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Failed to enter fullscreen:', err);
        message.error('无法进入全屏模式');
      });
    } else {
      // 退出全屏
      document.exitFullscreen().catch(err => {
        console.error('Failed to exit fullscreen:', err);
      });
    }
  };

  const handleDownload = async () => {
    if (!config || !selectedBucket || !previewImageUrl) return;

    try {
      if (!currentPreviewObject) {
        message.error('无法确定要下载的文件');
        return;
      }

      message.loading({ content: '正在生成下载链接...', key: 'download', duration: 0 });
      const url = await S3Service.getPresignedUrl(config, selectedBucket, currentPreviewObject.key);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = currentPreviewObject.key.split('/').pop() || currentPreviewObject.key;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success({ content: '下载已开始', key: 'download' });
    } catch (error) {
      console.error('Failed to download image:', error);
      message.error({ content: '下载失败', key: 'download' });
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
      case 'f':
      case 'F':
        e.preventDefault();
        handleFullscreen();
        break;
    }
  };

  // 鼠标滚轮缩放
  const handleWheel = (e: WheelEvent) => {
    if (!showImagePreview || !imageLoaded) return;
    
    e.preventDefault();
    const delta = e.deltaY;
    
    if (delta < 0) {
      // 向上滚动 - 放大
      setScale(prev => Math.min(prev * 1.1, 5));
    } else {
      // 向下滚动 - 缩小
      setScale(prev => Math.max(prev / 1.1, 0.1));
    }
  };

  // 鼠标拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return; // 只有放大时才能拖拽
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
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
    }, 3000); // 3秒后隐藏
    
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
    <Modal
      title={null}
      open={showImagePreview}
      onCancel={handleClose}
      footer={null}
      width="90vw"
      bodyStyle={{
        padding: 0,
        height: '80vh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      centered
      maskClosable
      keyboard
      destroyOnClose
      onMouseMove={handleMouseActivity}
    >
      {/* 顶部工具栏 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transform: showToolbar ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease',
      }}>
        <Text style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}>
          图片预览
        </Text>
        
        <Space>
          <Button 
            type="text" 
            icon={<ZoomOutOutlined />} 
            onClick={handleZoomOut}
            style={{ color: 'white' }}
            title="缩小 (-)"
          />
          <Text style={{ color: 'white', minWidth: '60px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </Text>
          <Button 
            type="text" 
            icon={<ZoomInOutlined />} 
            onClick={handleZoomIn}
            style={{ color: 'white' }}
            title="放大 (+)"
          />
          <Button 
            type="text" 
            icon={<RotateLeftOutlined />} 
            onClick={handleRotateLeft}
            style={{ color: 'white' }}
            title="向左旋转"
          />
          <Button 
            type="text" 
            icon={<RotateRightOutlined />} 
            onClick={handleRotateRight}
            style={{ color: 'white' }}
            title="向右旋转"
          />
          <Button 
            type="text" 
            onClick={handleReset}
            style={{ color: 'white' }}
            title="重置 (0)"
          >
            重置
          </Button>
          <Button 
            type="text" 
            icon={<DownloadOutlined />} 
            onClick={handleDownload}
            style={{ color: 'white' }}
            title="下载"
          />
          <Button 
            type="text" 
            icon={document.fullscreenElement ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
            onClick={handleFullscreen}
            style={{ color: 'white' }}
            title={document.fullscreenElement ? '退出全屏 (F)' : '全屏 (F)'}
          />
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={handleClose}
            style={{ color: 'white' }}
            title="关闭 (ESC)"
          />
        </Space>
      </div>

      {/* 图片容器 */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
          }}>
            <Spin size="large" />
            <div style={{ color: 'white', marginTop: '16px', textAlign: 'center' }}>
              正在加载图片...
            </div>
          </div>
        )}
        
        {imageError && (
          <div style={{
            color: 'white',
            textAlign: 'center',
            fontSize: '16px',
          }}>
            <div>图片加载失败</div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
              请检查网络连接或稍后重试
            </div>
          </div>
        )}
        
        {previewImageUrl && (
          <img
            src={previewImageUrl}
            alt="图片预览"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              maxWidth: scale <= 1 ? '100%' : 'none',
              maxHeight: scale <= 1 ? '100%' : 'none',
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              display: loading || imageError ? 'none' : 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        )}
      </div>

      {/* 底部提示 */}
      {imageLoaded && showToolbar && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 16px',
          textAlign: 'center',
          transform: showToolbar ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
        }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
            快捷键: +/- 缩放 | 鼠标滚轮缩放 | 拖拽移动 | 0 重置 | F 全屏 | ESC 关闭
          </Text>
        </div>
      )}
    </Modal>
  );
};

export default ImagePreviewModal;

