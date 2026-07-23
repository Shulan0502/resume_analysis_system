import { Layout, Menu, Button, Avatar, Tooltip, message } from 'antd'
import {
  ApartmentOutlined,
  AimOutlined,
  BarChartOutlined,
  BookOutlined,
  HomeOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReadOutlined,
  RobotOutlined,
  ShopOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../stores/auth'

const { Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, userInfo } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    message.success('已退出登录')
    navigate('/login')
  }

  const menuItems = [
    { type: 'group' as const, label: '工作台', children: [
      { key: '/home', icon: <HomeOutlined />, label: '成长概览' },
      { key: '/qa', icon: <RobotOutlined />, label: '求职问答' },
    ] },
    { type: 'group' as const, label: '求职准备', children: [
      { key: '/jobs', icon: <ShopOutlined />, label: '求职市场' },
      { key: '/knowledge-graph', icon: <ApartmentOutlined />, label: '能力图谱' },
      { key: '/job-matching', icon: <AimOutlined />, label: '人岗匹配' },
      { key: '/trend-analysis', icon: <LineChartOutlined />, label: '趋势分析' },
    ] },
    { type: 'group' as const, label: '练习与提升', children: [
      { key: '/resume-analysis', icon: <ReadOutlined />, label: '简历分析' },
      { key: '/interview', icon: <VideoCameraOutlined />, label: '模拟面试' },
      { key: '/analysis', icon: <BarChartOutlined />, label: '面试报告' },
      { key: '/resources', icon: <BookOutlined />, label: '学习资源' },
    ] },
  ]

  return (
    <Layout className="app-shell">
      <Sider className="app-sider" width={248} collapsedWidth={76} collapsed={collapsed} trigger={null}>
        <div className="brand-lockup">
          <div className="brand-mark">M</div>
          {!collapsed && <div><strong>面试罗盘</strong><span>CAREER COMPASS</span></div>}
        </div>
        <Menu className="app-menu" mode="inline" theme="dark" selectedKeys={[location.pathname]} items={menuItems} onClick={({ key }) => navigate(key)} />
        <div className="sider-bottom">
          <Tooltip title={collapsed ? '展开导航' : '收起导航'} placement="right">
            <Button type="text" className="collapse-button" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          </Tooltip>
          <div className="account-strip">
            <Avatar size={34} icon={<UserOutlined />} className="account-avatar" />
            {!collapsed && <div className="account-name"><strong>{userInfo?.realName || userInfo?.username || '求职者'}</strong><span>学生端</span></div>}
            {!collapsed && <Tooltip title="退出登录"><Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} /></Tooltip>}
          </div>
        </div>
      </Sider>
      <Layout className="app-main">
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
