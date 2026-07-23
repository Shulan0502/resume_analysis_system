import { Avatar, Button, Layout, Menu, Tooltip } from 'antd'
import { HomeOutlined, InboxOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

const { Sider, Content } = Layout

const CompanyLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, userInfo } = useAuthStore()
  const items = [
    { type: 'group' as const, label: '招聘工作台', children: [
      { key: '/company/dashboard', icon: <HomeOutlined />, label: '岗位管理' },
      { key: '/company/resumes', icon: <InboxOutlined />, label: '简历接收' },
      { key: '/company/profile', icon: <UserOutlined />, label: '账号设置' },
    ] },
  ]
  return <Layout className="app-shell"><Sider className="app-sider" width={248} trigger={null}>
    <div className="brand-lockup"><div className="brand-mark">M</div><div><strong>面试罗盘</strong><span>RECRUITMENT DESK</span></div></div>
    <Menu className="app-menu" theme="dark" mode="inline" selectedKeys={[location.pathname]} items={items} onClick={({ key }) => navigate(key)} />
    <div className="sider-bottom"><div className="account-strip"><Avatar size={34} icon={<UserOutlined />} className="account-avatar" /><div className="account-name"><strong>{userInfo?.realName || userInfo?.username || '招聘负责人'}</strong><span>企业端</span></div><Tooltip title="退出登录"><Button type="text" icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login') }} /></Tooltip></div></div>
  </Sider><Layout className="app-main"><Content className="app-content">{children}</Content></Layout></Layout>
}

export default CompanyLayout
