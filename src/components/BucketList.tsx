import React, { useEffect } from 'react';
import { List, Card, Button, message, Spin, Empty } from 'antd';
import { FolderOutlined, ReloadOutlined } from '@ant-design/icons';
import { useS3Store } from '../stores/useS3Store';
import { S3Service } from '../services/s3Service';

const BucketList: React.FC = () => {
  const {
    config,
    buckets,
    selectedBucket,
    isLoadingBuckets,
    setBuckets,
    selectBucket,
    setLoadingBuckets,
    isConnected,
  } = useS3Store();

  const loadBuckets = async () => {
    if (!config) {
      message.error('请先配置 OSS 连接');
      return;
    }

    try {
      setLoadingBuckets(true);
      const bucketList = await S3Service.listBuckets(config);
      setBuckets(bucketList);
    } catch (error) {
      console.error('Failed to load buckets:', error);
      message.error(`加载 Bucket 列表失败: ${error}`);
    } finally {
      setLoadingBuckets(false);
    }
  };

  useEffect(() => {
    if (config && isConnected) {
      loadBuckets();
    }
  }, [config, isConnected]);

  const handleBucketClick = (bucketName: string) => {
    selectBucket(bucketName);
  };

  const handleRefresh = () => {
    loadBuckets();
  };

  if (!config) {
    return (
      <Card title="Bucket 列表" size="small">
        <Empty 
          description="请先配置 OSS 连接" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card 
      title="Bucket 列表" 
      size="small"
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          size="small" 
          onClick={handleRefresh}
          loading={isLoadingBuckets}
        >
          刷新
        </Button>
      }
    >
      <Spin spinning={isLoadingBuckets}>
        {buckets.length === 0 && !isLoadingBuckets ? (
          <Empty 
            description="没有找到 Bucket" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={buckets}
            renderItem={(bucket) => (
              <List.Item
                onClick={() => handleBucketClick(bucket.name)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedBucket === bucket.name ? '#e6f7ff' : 'transparent',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginBottom: '4px',
                }}
                className="bucket-item"
              >
                <List.Item.Meta
                  avatar={<FolderOutlined style={{ color: '#1890ff' }} />}
                  title={bucket.name}
                  description={
                    bucket.creation_date 
                      ? `创建时间: ${new Date(bucket.creation_date).toLocaleDateString()}`
                      : '未知创建时间'
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
      
      <style jsx>{`
        .bucket-item:hover {
          background-color: #f5f5f5 !important;
        }
      `}</style>
    </Card>
  );
};

export default BucketList;

