import { Form, Input, Button, message, Radio, Card } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from '@/stores/auth.ts';
import { useState } from 'react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const { login } = useAuthStore();
  const [userType, setUserType] = useState<'student' | 'school' | 'company'>('student');
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password, userType);
      
      if (result.success) {
        message.success(result.message);
        
        // 根据返回的重定向URL或用户类型跳转
        if (result.redirectUrl) {
          navigate(result.redirectUrl, { replace: true });
        } else {
          // 默认跳转逻辑
          if (userType === 'student') {
            const from = (location.state as any)?.from?.pathname || '/home';
            navigate(from, { replace: true });
          } else if (userType === 'school') {
            navigate('/school/dashboard', { replace: true });
          } else if (userType === 'company') {
            navigate('/company/dashboard', { replace: true });
          }
        }
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Function to generate a random bubble element
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

  // Generate a large number of bubbles
  const numberOfBubbles = 80;
  const bubbles = Array.from({ length: numberOfBubbles }).map((_, index) => generateBubble(index));

  return (
    <ConfigProvider locale={zhCN}>
      <div className="min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="w-full max-w-md p-4">
          {/* Logo区域 */}
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-40 h-40 mx-auto mb-4 object-contain"
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              多模态AI模拟面试评测
            </h1>
            <p className="text-gray-600">欢迎回来，请登录您的账号</p>
          </div>

          {/* 用户类型选择 */}
          <div className="mb-6 flex justify-center">
            <Radio.Group
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="flex gap-4"
              buttonStyle="solid"
            >
              <Radio.Button value="student" className="custom-radio-btn">
                <span className="flex items-center justify-center gap-2">
                  <UserOutlined />
                  学生登录
                </span>
              </Radio.Button>
              <Radio.Button value="school" className="custom-radio-btn">
                <span className="flex items-center justify-center gap-2">
                  <BankOutlined />
                  学校登录
                </span>
              </Radio.Button>
              <Radio.Button value="company" className="custom-radio-btn">
                <span className="flex items-center justify-center gap-2">
                  <TeamOutlined />
                  企业登录
                </span>
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* 登录表单 */}
          <Card className="rounded-2xl shadow-lg">
            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="用户名"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="密码"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {loading ? '登录中...' : '登录'}
                </Button>
              </Form.Item>

              <div className="flex justify-between text-sm">
                <Link to="/forgot-password" className="text-blue-500 hover:text-blue-600">
                  忘记密码？
                </Link>
                <Link to="/register" className="text-blue-500 hover:text-blue-600">
                  注册账号
                </Link>
              </div>
            </Form>
          </Card>



          {/* 装饰性气泡 */}
          <div className="fixed inset-0 pointer-events-none">
            {bubbles}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Login;