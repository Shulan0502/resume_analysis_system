import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Tabs, Avatar, Upload } from 'antd';
import { UserOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';


interface SchoolInfo {
  name: string;
  logo: string;
  type: string;
  size: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  description: string;
}

const initialSchoolInfo: SchoolInfo = {
  name: '示例中学',
  logo: '',
  type: '公立',
  size: '2000人',
  website: 'www.school.com',
  email: 'school@example.com',
  phone: '010-12345678',
  address: '北京市海淀区某路1号',
  description: '这是一所示例中学，致力于素质教育和学生全面发展。',
};

const SchoolProfile: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [schoolForm] = Form.useForm();

  const handleUpdatePassword = async (_values: any) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('密码修改成功');
      form.resetFields();
    } catch (error) {
      message.error('修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSubmit = async (_values: SchoolInfo) => {
    setLoading(true);
    try {
      // TODO: 调用API保存学校信息
      message.success('学校信息更新成功');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };



  const items: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="基本信息" className="bg-white rounded-lg shadow-md">
          <div className="flex items-start space-x-6">
            <div className="text-center">
              <Avatar size={100} icon={<UserOutlined />} className="mb-4" />
              <Upload
                name="avatar"
                listType="picture"
                maxCount={1}
                accept="image/*"
                showUploadList={false}
                beforeUpload={() => false} // 仅UI展示，实际上传逻辑可后续补充
              >
                <Button icon={<UploadOutlined />}>更换头像</Button>
              </Upload>
            </div>
            <Form
              form={schoolForm}
              layout="vertical"
              initialValues={initialSchoolInfo}
              onFinish={handleSchoolSubmit}
              className="flex-1"
            >
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}> <Input prefix={<UserOutlined />} /> </Form.Item>
              <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}> <Input /> </Form.Item>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}> <Input /> </Form.Item>
              <Form.Item name="school" label="学院" rules={[{ required: true, message: '请输入学院' }]}> <Input /> </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>保存修改</Button>
              </Form.Item>
            </Form>
          </div>
        </Card>
      ),
    },
    {
      key: 'password',
      label: '修改密码',
      children: (
        <Card title="修改密码" className="bg-white rounded-lg shadow-md">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdatePassword}
          >
            <Form.Item
              name="oldPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度不能小于6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
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
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-transparent">
      <Tabs defaultActiveKey="profile" items={items} />
    </div>
  );
};

export default SchoolProfile; 