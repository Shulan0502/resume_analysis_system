import { Form, Input, Button, message, Card } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useState } from 'react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const onSendCode = async () => {
    // TODO: 实际发送验证码逻辑
    message.success('验证码已发送到邮箱');
    setCodeSent(true);
  };

  const onFinish = async (_values: any) => {
    setLoading(true);
    try {
      // TODO: 实际重置密码逻辑
      message.success('密码重置成功！请登录');
      navigate('/login');
    } catch (error) {
      message.error('重置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 气泡装饰与登录页一致
  const generateBubble = (index: number) => {
    const size = Math.random() * 6 + 2;
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const duration = Math.random() * 5 + 3;
    const delay = Math.random() * 4;
    const colorClasses = ['blue-300', 'pink-300', 'green-300', 'yellow-300', 'purple-300', 'red-300', 'teal-300', 'orange-300', 'blue-400', 'pink-400', 'green-400', 'yellow-400', 'purple-400', 'red-400', 'teal-400', 'orange-400', 'blue-500', 'pink-500', 'green-500', 'yellow-500', 'purple-500'];
    const randomColorClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];
    return (
      <div
        key={index}
        className={`absolute w-${size} h-${size} rounded-full bg-${randomColorClass} animate-bubble-float`}
        style={{
          top: `${top}%`,
          left: `${left}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          width: `${size}px`,
          height: `${size}px`,
        }}
      ></div>
    );
  };
  const numberOfBubbles = 80;
  const bubbles = Array.from({ length: numberOfBubbles }).map((_, index) => generateBubble(index));

  return (
    <ConfigProvider locale={zhCN}>
      <div className="min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="w-full max-w-md p-4">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Logo" className="w-40 h-40 mx-auto mb-4 object-contain" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">学途智面-学生高校企业智联求职生态服务平台</h1>
            <p className="text-gray-600">找回密码</p>
          </div>
          <Card className="rounded-2xl shadow-lg">
            <Form
              form={form}
              name="forgot_password"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}> <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="邮箱" className="rounded-lg" /> </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={onSendCode} disabled={codeSent} className="w-full mb-2">{codeSent ? '已发送' : '发送验证码'}</Button>
              </Form.Item>
              <Form.Item name="code" rules={[{ required: true, message: '请输入验证码' }]}> <Input placeholder="验证码" className="rounded-lg" /> </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入新密码' }, { min: 8, message: '密码长度不能小于8位' }]}> <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="新密码" className="rounded-lg" /> </Form.Item>
              <Form.Item name="confirm" dependencies={["password"]} rules={[{ required: true, message: '请确认新密码' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) { return Promise.resolve(); } return Promise.reject(new Error('两次输入的密码不一致')); }, }),]}> <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="确认新密码" className="rounded-lg" /> </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">重置密码</Button>
              </Form.Item>
              <div className="flex justify-between text-sm">
                <a href="/auth/Login" className="text-blue-500 hover:text-blue-600">返回登录</a>
              </div>
            </Form>
          </Card>
          <div className="fixed inset-0 pointer-events-none">{bubbles}</div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ForgotPassword; 