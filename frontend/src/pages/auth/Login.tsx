import { Form, Input, Button, Radio, message } from 'antd'
import { BankOutlined, LockOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import './Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [form] = Form.useForm()
  const [userType, setUserType] = useState<'student' | 'school' | 'company'>('student')
  const [loading, setLoading] = useState(false)
  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const result = await login(values.username, values.password, userType)
      if (!result.success) return message.error(result.message)
      const fallback = userType === 'student' ? ((location.state as any)?.from?.pathname || '/home') : userType === 'school' ? '/school/dashboard' : '/company/dashboard'
      navigate(result.redirectUrl || fallback, { replace: true })
    } finally { setLoading(false) }
  }
  return <main className="auth-shell"><section className="auth-aside"><div className="auth-brand"><div className="brand-mark">M</div><div><strong>面试罗盘</strong><span>CAREER COMPASS</span></div></div><div className="auth-message"><span>CAREER READINESS SYSTEM</span><h1>准备得更清晰，<br />走得更笃定。</h1><p>整合岗位洞察、面试练习与能力成长，帮助每一次求职准备产生实际进展。</p></div><div className="auth-grid" /></section><section className="auth-form-side"><div className="auth-form-wrap"><span className="eyebrow">WELCOME BACK</span><h2>登录工作台</h2><p>选择身份后继续你的职业成长计划。</p><Radio.Group className="auth-role-tabs" value={userType} onChange={(event) => setUserType(event.target.value)}><Radio.Button value="student"><UserOutlined />学生</Radio.Button><Radio.Button value="school"><BankOutlined />学校</Radio.Button><Radio.Button value="company"><TeamOutlined />企业</Radio.Button></Radio.Group><Form form={form} layout="vertical" onFinish={onFinish} size="large"><Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}><Input prefix={<UserOutlined />} placeholder="请输入用户名" /></Form.Item><Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}><Input.Password prefix={<LockOutlined />} placeholder="请输入密码" /></Form.Item><Button type="primary" htmlType="submit" loading={loading} className="auth-submit">登录</Button></Form><div className="auth-links"><Link to="/forgot-password">忘记密码</Link><Link to="/register">创建账号</Link></div></div></section></main>
}

export default Login
