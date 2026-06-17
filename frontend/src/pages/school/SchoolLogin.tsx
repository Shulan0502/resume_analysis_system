import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/auth.ts';

const SchoolLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password, 'school');
      if (result.success) {
        message.success('登录成功');
        navigate('/school/dashboard', { replace: true });
      } else {
        message.error(result.message || '登录失败，请检查账号密码');
      }
    } catch (error) {
      message.error('登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">学校管理平台</h1>
        <Form
          name="school_login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入学校账号' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="学校账号"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default SchoolLogin; 