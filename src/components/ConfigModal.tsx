import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Space, Select, Card, Typography } from 'antd';
import { useS3Store } from '../stores/useS3Store';
import { S3Service } from '../services/s3Service';
import { S3Config } from '../types/s3';

const { Text } = Typography;
const { Option } = Select;

const ConfigModal: React.FC = () => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const {
    showConfigModal,
    setShowConfigModal,
    config,
    setConfig,
    setConnectionStatus,
  } = useS3Store();

  useEffect(() => {
    if (showConfigModal && config) {
      form.setFieldsValue(config);
    }
  }, [showConfigModal, config, form]);

  const presetConfigs = {
    r2: {
      name: 'Cloudflare R2',
      endpoint: 'https://[account-id].r2.cloudflarestorage.com',
      region: 'auto',
      description: 'Cloudflare R2 对象存储服务'
    },
    aws: {
      name: 'AWS S3',
      endpoint: 'https://s3.amazonaws.com',
      region: 'us-east-1',
      description: 'Amazon Web Services S3'
    },
    aliyun: {
      name: '阿里云 OSS',
      endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
      region: 'cn-hangzhou',
      description: '阿里云对象存储 OSS'
    },
    tencent: {
      name: '腾讯云 COS',
      endpoint: 'https://cos.ap-beijing.myqcloud.com',
      region: 'ap-beijing',
      description: '腾讯云对象存储 COS'
    },
    qiniu: {
      name: '七牛云',
      endpoint: 'https://s3-cn-east-1.qiniucs.com',
      region: 'cn-east-1',
      description: '七牛云对象存储'
    }
  };

  const handlePresetChange = (presetKey: string) => {
    if (presetKey && presetConfigs[presetKey as keyof typeof presetConfigs]) {
      const preset = presetConfigs[presetKey as keyof typeof presetConfigs];
      form.setFieldsValue({
        endpoint: preset.endpoint,
        region: preset.region,
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      
      const testConfig: S3Config = {
        endpoint: values.endpoint,
        region: values.region,
        access_key_id: values.access_key_id,
        secret_access_key: values.secret_access_key,
        bucket: values.bucket,
        custom_path: values.custom_path,
      };

      await S3Service.testConnection(testConfig);
      message.success('连接测试成功！');
      setConnectionStatus(true);
    } catch (error) {
      console.error('Connection test failed:', error);
      message.error(`连接测试失败: ${error}`);
      setConnectionStatus(false, String(error));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      const newConfig: S3Config = {
        endpoint: values.endpoint,
        region: values.region,
        access_key_id: values.access_key_id,
        secret_access_key: values.secret_access_key,
        bucket: values.bucket,
        custom_path: values.custom_path,
      };

      setConfig(newConfig);
      setShowConfigModal(false);
      message.success('配置已保存！');
    } catch (error) {
      console.error('Save failed:', error);
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowConfigModal(false);
    if (config) {
      form.setFieldsValue(config);
    }
  };

  return (
    <Modal
      title="OSS 配置"
      open={showConfigModal}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="test" loading={testing} onClick={handleTestConnection}>
          测试连接
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          保存
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          region: 'auto',
        }}
      >
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f8f9fa' }}>
          <Form.Item
            label="选择预设配置（可选）"
            tooltip="选择常用的 OSS 服务商预设配置，会自动填入对应的 Endpoint 和 Region"
          >
            <Select
              placeholder="选择服务商预设"
              allowClear
              onChange={handlePresetChange}
              style={{ width: '100%' }}
            >
              {Object.entries(presetConfigs).map(([key, preset]) => (
                <Option key={key} value={key}>
                  <div>
                    <strong>{preset.name}</strong>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {preset.description}
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>
        
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fff7e6', borderColor: '#ffa940' }}>
          <Text style={{ fontSize: '12px', color: '#d48806' }}>
            💡 <strong>Cloudflare R2 用户提示：</strong>
            <br />• Region 可以填写 "auto" 或留空
            <br />• Endpoint 格式：https://[account-id].r2.cloudflarestorage.com
            <br />• 请确保已在 R2 控制台生成 API Token
          </Text>
        </Card>
        
        <Form.Item
          label="Endpoint URL"
          name="endpoint"
          rules={[
            { required: true, message: '请输入 Endpoint URL' },
            { type: 'url', message: '请输入有效的 URL' },
          ]}
        >
          <Input placeholder="例如: https://xxx.r2.cloudflarestorage.com (R2) 或 https://s3.amazonaws.com (AWS)" />
        </Form.Item>

        <Form.Item
          label="Region（可选）"
          name="region"
          tooltip="对于 Cloudflare R2，可以留空或填写 auto。对于 AWS S3，请填写具体区域如 us-east-1"
        >
          <Input placeholder="auto (R2默认) 或 us-east-1 (AWS)" />
        </Form.Item>

        <Form.Item
          label="Access Key ID"
          name="access_key_id"
          rules={[{ required: true, message: '请输入 Access Key ID' }]}
        >
          <Input placeholder="AKIA..." />
        </Form.Item>

        <Form.Item
          label="Secret Access Key"
          name="secret_access_key"
          rules={[{ required: true, message: '请输入 Secret Access Key' }]}
        >
          <Input.Password placeholder="..." />
        </Form.Item>

        <Form.Item
          label="默认 Bucket（可选）"
          name="bucket"
        >
          <Input placeholder="my-bucket" />
        </Form.Item>

        <Form.Item
          label="自定义路径前缀（可选）"
          name="custom_path"
        >
          <Input placeholder="uploads/" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfigModal;

