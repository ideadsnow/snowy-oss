import React, { useEffect } from 'react';
import { Layout, Row, Col, Button, Space, Typography, Tag, Divider } from 'antd';
import { SettingOutlined, CloudOutlined, ApiOutlined } from '@ant-design/icons';
import { useS3Store } from './stores/useS3Store';
import ConfigModal from './components/ConfigModal';
import BucketList from './components/BucketList';
import ObjectList from './components/ObjectList';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

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
      return <Tag color="default">未配置</Tag>;
    }
    if (isConnected) {
      return <Tag color="success">已连接</Tag>;
    }
    if (connectionError) {
      return <Tag color="error">连接失败</Tag>;
    }
    return <Tag color="processing">连接中</Tag>;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header 
        style={{ 
          background: '#fff', 
          padding: '0 24px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CloudOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            Snowy OSS Manager
          </Title>
        </div>
        
        <Space>
          {config && (
            <>
              <Text type="secondary">
                <ApiOutlined /> {new URL(config.endpoint).hostname}
              </Text>
              {getConnectionStatus()}
              <Divider type="vertical" />
            </>
          )}
          
          <Button 
            icon={<SettingOutlined />} 
            onClick={handleOpenConfig}
            type={config ? 'default' : 'primary'}
          >
            {config ? '修改配置' : 'OSS 配置'}
          </Button>
          
          {config && (
            <Button onClick={handleDisconnect} danger>
              断开连接
            </Button>
          )}
        </Space>
      </Header>
      
      <Layout>
        <Sider
          width={300}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
          }}
        >
          <div style={{ padding: '16px' }}>
            <BucketList />
          </div>
        </Sider>
        
        <Layout style={{ padding: '16px' }}>
          <Content
            style={{
              background: '#fff',
              borderRadius: '8px',
              overflow: 'auto',
            }}
          >
            <div style={{ padding: '16px' }}>
              {!config ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '80px 20px',
                  color: '#999'
                }}>
                  <CloudOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
                  <Title level={3} type="secondary">
                    欢迎使用 Snowy OSS Manager
                  </Title>
                  <Text type="secondary">
                    请点击“OSS 配置”按钮开始配置您的对象存储服务
                  </Text>
                  <br />
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<SettingOutlined />}
                    onClick={handleOpenConfig}
                    style={{ marginTop: '24px' }}
                  >
                    开始配置
                  </Button>
                </div>
              ) : (
                <>
                  <ObjectList />
                  
                  {selectedBucket && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      background: '#f5f5f5', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      <Row gutter={24}>
                        <Col span={8}>
                          <strong>当前 Bucket:</strong> {selectedBucket}
                        </Col>
                        <Col span={8}>
                          <strong>文件数量:</strong> {objects.length}
                        </Col>
                        <Col span={8}>
                          <strong>总大小:</strong> {
                            objects.reduce((sum, obj) => sum + (obj.size || 0), 0) > 0
                              ? `${(objects.reduce((sum, obj) => sum + (obj.size || 0), 0) / 1024 / 1024).toFixed(2)} MB`
                              : '0 B'
                          }
                        </Col>
                      </Row>
                    </div>
                  )}
                </>
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
      
      <ConfigModal />
    </Layout>
  );
}

export default App;
