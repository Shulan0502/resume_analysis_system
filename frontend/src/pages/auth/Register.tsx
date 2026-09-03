import { Form, Input, Button, message, Radio, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BankOutlined, TeamOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { register } from '@/services/api.ts';
import './Auth.css';

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

  return (
    <main className="auth-shell">
      <section className="auth-aside">
        <div className="auth-brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>面试罗盘</strong>
            <span>CAREER COMPASS</span>
          </div>
        </div>
        <div className="auth-message">
          <span>JOIN THE PLATFORM</span>
          <h1>开启你的<br />职业成长之旅。</h1>
          <p>加入学途智面，连接岗位洞察、AI 面试与能力成长路径，让每一步求职准备都有迹可循。</p>
        </div>
        <div className="auth-grid" />
      </section>
      <section className="auth-form-side">
        <div className="auth-form-wrap" style={{ width: 'min(460px, 100%)' }}>
          <span className="eyebrow" style={{ color: '#8ce4b4', fontSize: 10, fontWeight: 800, letterSpacing: '1.6px' }}>CREATE ACCOUNT</span>
          <h2 style={{ margin: '9px 0 8px', color: '#22352b', fontSize: 31 }}>注册新账号</h2>
          <p style={{ margin: '0 0 27px', color: '#718077' }}>选择身份加入学途智面 · 面试罗盘求职生态平台。</p>

          <Radio.Group
            className="auth-role-tabs"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
          >
            <Radio.Button value="student"><UserOutlined />学生</Radio.Button>
            <Radio.Button value="school"><BankOutlined />学校</Radio.Button>
            <Radio.Button value="company"><TeamOutlined />企业</Radio.Button>
          </Radio.Group>

          <Form form={form} name="register" onFinish={onFinish} layout="vertical" size="large" scrollToFirstError>
            <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', paddingRight: 8, marginBottom: 16 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#4f6157', marginBottom: 12 }}>基本信息</h3>

                <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3位' }, { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }]}>
                  <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
                </Form.Item>

                <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
                  <Input prefix={<IdcardOutlined />} placeholder="请输入真实姓名" />
                </Form.Item>

                <Form.Item name="email" label="邮箱地址" rules={[{ required: true, message: '请输入邮箱地址' }, { type: 'email', message: '请输入有效的邮箱地址' }]}>
                  <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
                </Form.Item>

                <Form.Item name="phone" label="手机号码" rules={[{ required: true, message: '请输入手机号码' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }]}>
                  <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" />
                </Form.Item>

                <Form.Item name="password" label="密码" rules={passwordRules}>
                  <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
                </Form.Item>

                <Form.Item name="confirmPassword" label="确认密码" rules={confirmPasswordRules}>
                  <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
                </Form.Item>
              </div>

              <div style={{ marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#4f6157', marginBottom: 12 }}>
                  {userType === 'student' ? '学生信息' : userType === 'school' ? '学校信息' : '企业信息'}
                </h3>
                {renderExtendedFields()}
              </div>
            </div>

            <Form.Item style={{ marginBottom: 8 }}>
              <Button type="primary" htmlType="submit" loading={loading} className="auth-submit">
                {loading ? '注册中...' : '立即注册'}
              </Button>
            </Form.Item>

            <div className="auth-links" style={{ justifyContent: 'center' }}>
              <span style={{ color: '#718077' }}>已有账号？</span>
              <Link to="/login" style={{ color: '#197352', marginLeft: 4 }}>立即登录</Link>
            </div>
          </Form>
        </div>
      </section>
    </main>
  );
};

export default Register; 