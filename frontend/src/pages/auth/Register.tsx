import { Form, Input, Button, message, Radio, Card, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BankOutlined, TeamOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useState } from 'react';
import { register } from '@/services/api.ts';

const { Option } = Select;

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [userType, setUserType] = useState<'student' | 'school' | 'company'>('student');
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const registerData = {
        ...values,
        userType,
        confirmPassword: undefined // 移除确认密码字段
      };
      
      const result = await register(registerData);
      
      if (result.success) {
        message.success('注册成功！请登录您的账号');
        navigate('/login');
      } else {
        message.error(result.message || '注册失败，请重试');
      }
    } catch (error) {
      console.error('注册错误:', error);
      message.error('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 密码验证规则
  const passwordRules = [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6位' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字' }
  ];

  // 确认密码验证
  const confirmPasswordRules = [
    { required: true, message: '请确认密码' },
    ({ getFieldValue }: any) => ({
      validator(_: any, value: any) {
        if (!value || getFieldValue('password') === value) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('两次输入的密码不一致'));
      },
    }),
  ];

  // 根据用户类型渲染不同的扩展字段
  const renderExtendedFields = () => {
    switch (userType) {
      case 'student':
        return (
          <>
            <Form.Item
              name="studentId"
              label="学号"
              rules={[{ required: true, message: '请输入学号' }]}
            >
              <Input
                prefix={<IdcardOutlined className="text-gray-400" />}
                placeholder="请输入学号"
                className="rounded-lg"
              />
            </Form.Item>
            <Form.Item
              name="schoolName"
              label="学校名称"
              rules={[{ required: true, message: '请输入学校名称' }]}
            >
              <Input
                prefix={<BankOutlined className="text-gray-400" />}
                placeholder="请输入学校名称"
                className="rounded-lg"
              />
            </Form.Item>
            <Form.Item
              name="major"
              label="专业"
              rules={[{ required: true, message: '请输入专业' }]}
            >
              <Input
                placeholder="请输入专业"
                className="rounded-lg"
              />
            </Form.Item>
            <Form.Item
              name="grade"
              label="年级"
              rules={[{ required: true, message: '请选择年级' }]}
            >
              <Select placeholder="请选择年级" className="rounded-lg">
                <Option value="大一">大一</Option>
                <Option value="大二">大二</Option>
                <Option value="大三">大三</Option>
                <Option value="大四">大四</Option>
                <Option value="研一">研一</Option>
                <Option value="研二">研二</Option>
                <Option value="研三">研三</Option>
                <Option value="博士">博士</Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'school':
        return (
          <>
            <Form.Item
              name="schoolCode"
              label="学校代码"
              rules={[{ required: true, message: '请输入学校代码' }]}
            >
              <Input
                prefix={<IdcardOutlined className="text-gray-400" />}
                placeholder="请输入学校代码"
                className="rounded-lg"
              />
            </Form.Item>
            <Form.Item
              name="schoolType"
              label="学校类型"
              rules={[{ required: true, message: '请选择学校类型' }]}
            >
              <Select placeholder="请选择学校类型" className="rounded-lg">
                <Option value="985高校">985高校</Option>
                <Option value="211高校">211高校</Option>
                <Option value="双一流">双一流</Option>
                <Option value="普通本科">普通本科</Option>
                <Option value="专科院校">专科院校</Option>
                <Option value="职业院校">职业院校</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="address"
              label="学校地址"
              rules={[{ required: true, message: '请输入学校地址' }]}
            >
              <Input.TextArea
                placeholder="请输入学校地址"
                className="rounded-lg"
                rows={3}
              />
            </Form.Item>
            <Form.Item
              name="website"
              label="官网地址"
            >
              <Input
                placeholder="请输入官网地址（选填）"
                className="rounded-lg"
              />
            </Form.Item>
          </>
        );
      case 'company':
        return (
          <>
            <Form.Item
              name="companyCode"
              label="企业代码"
              rules={[{ required: true, message: '请输入企业代码' }]}
            >
              <Input
                prefix={<IdcardOutlined className="text-gray-400" />}
                placeholder="请输入企业代码"
                className="rounded-lg"
              />
            </Form.Item>
            <Form.Item
              name="industry"
              label="所属行业"
              rules={[{ required: true, message: '请选择所属行业' }]}
            >
              <Select placeholder="请选择所属行业" className="rounded-lg">
                <Option value="互联网">互联网</Option>
                <Option value="金融">金融</Option>
                <Option value="教育">教育</Option>
                <Option value="制造业">制造业</Option>
                <Option value="房地产">房地产</Option>
                <Option value="医疗健康">医疗健康</Option>
                <Option value="零售">零售</Option>
                <Option value="咨询">咨询</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="companySize"
              label="企业规模"
              rules={[{ required: true, message: '请选择企业规模' }]}
            >
              <Select placeholder="请选择企业规模" className="rounded-lg">
                <Option value="1-50人">1-50人</Option>
                <Option value="51-200人">51-200人</Option>
                <Option value="201-500人">201-500人</Option>
                <Option value="501-1000人">501-1000人</Option>
                <Option value="1000-5000人">1000-5000人</Option>
                <Option value="5000-10000人">5000-10000人</Option>
                <Option value="10000+人">10000+人</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="address"
              label="企业地址"
              rules={[{ required: true, message: '请输入企业地址' }]}
            >
              <Input.TextArea
                placeholder="请输入企业地址"
                className="rounded-lg"
                rows={3}
              />
            </Form.Item>
            <Form.Item
              name="website"
              label="官网地址"
            >
              <Input
                placeholder="请输入官网地址（选填）"
                className="rounded-lg"
              />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  // Function to generate a random bubble element
  const generateBubble = (index: number) => {
    const size = Math.random() * 6 + 2;
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const duration = Math.random() * 5 + 3;
    const delay = Math.random() * 4;
    const colorClasses = ['blue-300', 'pink-300', 'green-300', 'yellow-300', 'purple-300', 'red-300', 'teal-300', 'orange-300'];
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

  // Generate bubbles
  const numberOfBubbles = 60;
  const bubbles = Array.from({ length: numberOfBubbles }).map((_, index) => generateBubble(index));

  return (
    <ConfigProvider locale={zhCN}>
      <div className="min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center py-8">
        <div className="w-full max-w-2xl p-4">
          {/* Logo区域 */}
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-32 h-32 mx-auto mb-4 object-contain"
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">注册新账号</h1>
            <p className="text-gray-600">加入学途智面-学生高校企业智联求职生态服务平台</p>
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
                  学生注册
                </span>
              </Radio.Button>
              <Radio.Button value="school" className="custom-radio-btn">
                <span className="flex items-center justify-center gap-2">
                  <BankOutlined />
                  学校注册
                </span>
              </Radio.Button>
              <Radio.Button value="company" className="custom-radio-btn">
                <span className="flex items-center justify-center gap-2">
                  <TeamOutlined />
                  企业注册
                </span>
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* 注册表单 */}
          <Card className="rounded-2xl shadow-lg">
            <Form
              form={form}
              name="register"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              scrollToFirstError
            >
              {/* 基本信息 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">基本信息</h3>
                
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少3位' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="请输入用户名"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="realName"
                  label="真实姓名"
                  rules={[{ required: true, message: '请输入真实姓名' }]}
                >
                  <Input
                    prefix={<IdcardOutlined className="text-gray-400" />}
                    placeholder="请输入真实姓名"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="邮箱地址"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    placeholder="请输入邮箱地址"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="手机号码"
                  rules={[
                    { required: true, message: '请输入手机号码' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined className="text-gray-400" />}
                    placeholder="请输入手机号码"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="密码"
                  rules={passwordRules}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="请输入密码"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  rules={confirmPasswordRules}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="请再次输入密码"
                    className="rounded-lg"
                  />
                </Form.Item>
              </div>

              {/* 扩展信息 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  {userType === 'student' ? '学生信息' : userType === 'school' ? '学校信息' : '企业信息'}
                </h3>
                {renderExtendedFields()}
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {loading ? '注册中...' : '立即注册'}
                </Button>
              </Form.Item>

              <div className="text-center text-sm">
                <span className="text-gray-600">已有账号？</span>
                <Link to="/login" className="text-blue-500 hover:text-blue-600 ml-1">
                  立即登录
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

export default Register; 