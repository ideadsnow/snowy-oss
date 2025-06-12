import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  message,
  Modal,
  Checkbox,
  Tag,
  Image,
  Space,
  Tooltip
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useS3Store } from '../stores/useS3Store';
import { S3Service } from '../services/s3Service';
import { S3Object } from '../types/s3';
import ImagePreviewModal from './ImagePreviewModal';

const ObjectList: React.FC = () => {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    config,
    selectedBucket,
    objects,
    selectedObjects,
    currentPrefix,
    isLoadingObjects,
    setObjects,
    setSelectedObjects,
    toggleObjectSelection,
    setLoadingObjects,
    showImagePreview,
    previewImageUrl,
    setShowImagePreview,
  } = useS3Store();

  const loadObjects = async () => {
    if (!config || !selectedBucket) {
      return;
    }

    try {
      setLoadingObjects(true);
      const objectList = await S3Service.listObjects(
        config,
        selectedBucket,
        currentPrefix || undefined
      );
      setObjects(objectList);
    } catch (error) {
      console.error('Failed to load objects:', error);
      message.error(`加载文件列表失败: ${error}`);
    } finally {
      setLoadingObjects(false);
    }
  };

  useEffect(() => {
    if (selectedBucket) {
      loadObjects();
    }
  }, [selectedBucket, currentPrefix]);

  const handleRefresh = () => {
    loadObjects();
  };

  const handlePreview = async (object: S3Object) => {
    if (!config || !selectedBucket) return;

    try {
      const fileType = S3Service.getFileType(object.key);
      
      if (fileType === 'image') {
        const url = await S3Service.getPresignedUrl(config, selectedBucket, object.key);
        setShowImagePreview(true, url, object);
      } else {
        message.info('该文件类型不支持预览');
      }
    } catch (error) {
      console.error('Failed to generate preview URL:', error);
      message.error('生成预览链接失败');
    }
  };

  const handleDownload = async (object: S3Object) => {
    if (!config || !selectedBucket) return;

    try {
      message.loading({ content: '正在生成下载链接...', key: 'download', duration: 0 });
      const url = await S3Service.getPresignedUrl(config, selectedBucket, object.key);
      
      // 创建一个临时的 a 标签来触发下载
      const link = document.createElement('a');
      link.href = url;
      link.download = object.key.split('/').pop() || object.key; // 使用文件名作为下载名
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // 添加到 DOM，点击，然后移除
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success({ content: '下载已开始', key: 'download' });
    } catch (error) {
      console.error('Failed to generate download URL:', error);
      message.error({ content: '生成下载链接失败', key: 'download' });
    }
  };

  const handleDelete = () => {
    if (selectedObjects.length === 0) {
      message.warning('请选择要删除的文件');
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!config || !selectedBucket) return;

    try {
      setDeleting(true);
      await S3Service.deleteObjects(config, selectedBucket, selectedObjects);
      message.success(`成功删除 ${selectedObjects.length} 个文件`);
      setSelectedObjects([]);
      setShowDeleteModal(false);
      loadObjects(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete objects:', error);
      message.error(`删除文件失败: ${error}`);
    } finally {
      setDeleting(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const fileType = S3Service.getFileType(filename);
    return fileType === 'image' ? <FileImageOutlined /> : <FileOutlined />;
  };

  const getFileTypeTag = (filename: string) => {
    const fileType = S3Service.getFileType(filename);
    const colors = {
      image: 'green',
      video: 'blue',
      text: 'orange',
      other: 'default',
    };
    return <Tag color={colors[fileType]}>{fileType.toUpperCase()}</Tag>;
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedObjects.length > 0 && selectedObjects.length === objects.length}
          indeterminate={selectedObjects.length > 0 && selectedObjects.length < objects.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedObjects(objects.map(obj => obj.key));
            } else {
              setSelectedObjects([]);
            }
          }}
        />
      ),
      dataIndex: 'selected',
      width: 50,
      render: (_: any, record: S3Object) => (
        <Checkbox
          checked={selectedObjects.includes(record.key)}
          onChange={() => toggleObjectSelection(record.key)}
        />
      ),
    },
    {
      title: '文件名',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => (
        <Space>
          {getFileIcon(key)}
          <span>{key}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'key',
      key: 'type',
      width: 100,
      render: (key: string) => getFileTypeTag(key),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size?: number) => S3Service.formatFileSize(size),
    },
    {
      title: '修改时间',
      dataIndex: 'last_modified',
      key: 'last_modified',
      width: 180,
      render: (date?: string) => 
        date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: S3Object) => (
        <Space>
          <Tooltip title="预览">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (!selectedBucket) {
    return (
      <Card title="文件列表" size="small">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          请选择一个 Bucket 查看文件
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={`文件列表 - ${selectedBucket}`}
        size="small"
        extra={
          <Space>
            <Button
              icon={<DeleteOutlined />}
              danger
              disabled={selectedObjects.length === 0}
              onClick={handleDelete}
            >
              删除选中 ({selectedObjects.length})
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isLoadingObjects}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={objects}
          rowKey="key"
          loading={isLoadingObjects}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个文件`,
          }}
          size="small"
        />
      </Card>

      <Modal
        title="确认删除"
        open={showDeleteModal}
        onOk={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        confirmLoading={deleting}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>你确定要删除选中的 {selectedObjects.length} 个文件吗？</p>
        <p style={{ color: '#ff4d4f' }}>此操作不可逆！</p>
      </Modal>

      <ImagePreviewModal />
    </>
  );
};

export default ObjectList;

