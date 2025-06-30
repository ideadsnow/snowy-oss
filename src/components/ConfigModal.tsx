import React, { useState, useEffect } from 'react';
import { Loader2, TestTube, Save, X, Info } from 'lucide-react';
import { useS3Store } from '../stores/useS3Store';
import { S3Service } from '../services/s3Service';
import { S3Config } from '../types/s3';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const ConfigModal: React.FC = () => {
  const [formData, setFormData] = useState<S3Config>({
    endpoint: '',
    region: 'auto',
    access_key_id: '',
    secret_access_key: '',
    bucket: '',
    custom_path: '',
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const {
    showConfigModal,
    setShowConfigModal,
    config,
    setConfig,
    setConnectionStatus,
    testConnection,
  } = useS3Store();

  useEffect(() => {
    if (showConfigModal && config) {
      setFormData(config);
    }
  }, [showConfigModal, config]);

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
      setFormData(prev => ({
        ...prev,
        endpoint: preset.endpoint,
        region: preset.region,
      }));
    }
  };

  const handleInputChange = (field: keyof S3Config, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.endpoint || !formData.access_key_id || !formData.secret_access_key) {
      setTestResult({
        success: false,
        message: '请填写完整的配置信息'
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      await testConnection(formData);
      setTestResult({
        success: true,
        message: '连接测试成功！'
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResult({
        success: false,
        message: `连接测试失败: ${error}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.endpoint || !formData.access_key_id || !formData.secret_access_key) {
      setTestResult({
        success: false,
        message: '请填写完整的配置信息'
      });
      return;
    }

    try {
      setSaving(true);
      setConfig(formData);
      setShowConfigModal(false);
      setTestResult({
        success: true,
        message: '配置已保存！'
      });
    } catch (error) {
      console.error('Save failed:', error);
      setTestResult({
        success: false,
        message: '保存配置失败'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowConfigModal(false);
    setTestResult(null);
    if (config) {
      setFormData(config);
    }
  };

  return (
    <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>OSS 配置</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 预设配置 */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">选择预设配置（可选）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(presetConfigs).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className="p-3 text-left border rounded-lg hover:bg-background transition-colors"
                  >
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cloudflare R2 提示 */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Cloudflare R2 用户提示：</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Region 可以填写 "auto" 或留空</li>
                    <li>Endpoint 格式：https://[account-id].r2.cloudflarestorage.com</li>
                    <li>请确保已在 R2 控制台生成 API Token</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 配置表单 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Endpoint URL <span className="text-destructive">*</span>
              </label>
              <Input
                type="url"
                placeholder="例如: https://xxx.r2.cloudflarestorage.com (R2) 或 https://s3.amazonaws.com (AWS)"
                value={formData.endpoint}
                onChange={(e) => handleInputChange('endpoint', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Region <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="例如: auto, us-east-1, cn-hangzhou"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Access Key ID <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="您的 Access Key ID"
                value={formData.access_key_id}
                onChange={(e) => handleInputChange('access_key_id', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Secret Access Key <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                placeholder="您的 Secret Access Key"
                value={formData.secret_access_key}
                onChange={(e) => handleInputChange('secret_access_key', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                默认 Bucket（可选）
              </label>
              <Input
                placeholder="默认的 Bucket 名称"
                value={formData.bucket || ''}
                onChange={(e) => handleInputChange('bucket', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                自定义路径（可选）
              </label>
              <Input
                placeholder="例如: uploads/"
                value={formData.custom_path || ''}
                onChange={(e) => handleInputChange('custom_path', e.target.value)}
              />
            </div>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="font-medium text-sm">
                {testResult.message}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                测试连接
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigModal;

