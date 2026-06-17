import { useState } from 'react';
import { Card, Form, Input, Button, Upload, message, Tabs, Switch, Divider, Modal } from 'antd';
import { UploadOutlined, MailOutlined, PhoneOutlined, GlobalOutlined, EnvironmentOutlined, LockOutlined } from '@ant-design/icons';
import { changePassword } from '@/services/api.ts';
import type { UploadProps } from 'antd';
import type { TabsProps } from 'antd';

const { TextArea } = Input;

interface CompanyInfo {
  name: string;
  logo: string;
  industry: string;
  size: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  description: string;
}

const CompanyProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 模拟企业信息
  const initialCompanyInfo: CompanyInfo = {
    name: '示例科技有限公司',
    logo: '',
    industry: '互联网/IT',
    size: '100-500人',
    website: 'www.example.com',
    email: 'contact@example.com',
    phone: '010-12345678',
    address: '北京市海淀区中关村科技园',
    description: '我们是一家专注于人工智能和大数据的高新技术企业，致力于为企业提供智能化解决方案。',
  };

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload', // 替换为实际的上传接口
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  // 处理表单提交
  const handleSubmit = async (values: CompanyInfo) => {
    setLoading(true);
    try {
      // TODO: 调用API保存企业信息
      console.log('保存的企业信息:', values);
      message.success('企业信息更新成功');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handlePasswordChange = async (values: any) => {
    setPasswordLoading(true);
    try {
      // 验证新密码和确认密码是否一致
      if (values.newPassword !== values.confirmPassword) {
        message.error('新密码和确认密码不一致');
        return;
      }

      // 调用API修改密码
      const response = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });

      if (response.success) {
        message.success('密码修改成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      } else {
        message.error(response.message || '密码修改失败');
      }
    } catch (error) {
      message.error('密码修改失败，请重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 打开修改密码模态框
  const handleOpenPasswordModal = () => {
    setPasswordModalVisible(true);
    passwordForm.resetFields();
  };

  // 关闭修改密码模态框
  const handleClosePasswordModal = () => {
    setPasswordModalVisible(false);
    passwordForm.resetFields();
  };

  // 账号设置项
  const accountSettings = [
    {
      title: '接收简历通知',
      description: '当收到新的简历投递时，通过邮件通知',
      key: 'resume_notification',
    },
    {
      title: '面试提醒',
      description: '在面试开始前30分钟发送提醒',
      key: 'interview_reminder',
    },
    {
      title: '数据分析报告',
      description: '每周发送招聘数据分析报告',
      key: 'weekly_report',
    },
  ];

  // 标签页配置
  const items: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Form
          form={form}
          layout="vertical"
          initialValues={initialCompanyInfo}
          onFinish={handleSubmit}
        >
          <div className="flex gap-8 mb-6">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>上传Logo</Button>
              </Upload>
            </div>
            <div className="flex-1">
              <Form.Item
                name="name"
                label="企业名称"
                rules={[{ required: true, message: '请输入企业名称' }]}
              >
                <Input placeholder="请输入企业名称" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="industry"
                  label="所属行业"
                  rules={[{ required: true, message: '请选择所属行业' }]}
                >
                  <Input placeholder="请输入所属行业" />
                </Form.Item>
                <Form.Item
                  name="size"
                  label="企业规模"
                  rules={[{ required: true, message: '请选择企业规模' }]}
                >
                  <Input placeholder="请输入企业规模" />
                </Form.Item>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="website"
              label="企业官网"
              rules={[{ required: true, message: '请输入企业官网' }]}
            >
              <Input prefix={<GlobalOutlined />} placeholder="请输入企业官网" />
            </Form.Item>
            <Form.Item
              name="email"
              label="联系邮箱"
              rules={[
                { required: true, message: '请输入联系邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入联系邮箱" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" />
            </Form.Item>
            <Form.Item
              name="address"
              label="企业地址"
              rules={[{ required: true, message: '请输入企业地址' }]}
            >
              <Input prefix={<EnvironmentOutlined />} placeholder="请输入企业地址" />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="企业简介"
            rules={[{ required: true, message: '请输入企业简介' }]}
          >
            <TextArea rows={4} placeholder="请输入企业简介" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'settings',
      label: '账号设置',
      children: (
        <div className="space-y-6">
          {accountSettings.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between">
              <div>
                <div className="text-base font-medium">{setting.title}</div>
                <div className="text-gray-500 text-sm">{setting.description}</div>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
          <Divider />
          <div className="mt-4 flex flex-row items-center">
            <Button type="primary" danger onClick={handleOpenPasswordModal}>
              修改密码
            </Button>
            <Button type="default" danger className="ml-8">
              注销账号
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card title="企业账号管理" className="rounded-2xl shadow">
        <Tabs defaultActiveKey="basic" items={items} />
      </Card>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={handleClosePasswordModal}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          className="mt-4"
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[
              { required: true, message: '请输入当前密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
              { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码（至少6位，包含字母和数字）"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item className="mb-0 mt-6">
            <div className="flex justify-end space-x-2">
              <Button onClick={handleClosePasswordModal}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordLoading}
              >
                确认修改
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompanyProfile; 