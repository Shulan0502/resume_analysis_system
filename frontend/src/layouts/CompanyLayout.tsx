import { Layout, Menu, Button } from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

const { Sider, Content } = Layout

interface CompanyLayoutProps {
  children: React.ReactNode
}

const LOGO_HEIGHT = 56
const CONTENT_PADDING_LEFT = 24

const CompanyLayout: React.FC<CompanyLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/company/dashboard',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/company/resumes',
      icon: <InboxOutlined />,
      label: '简历接收',
    },
    {
      key: '/company/profile',
      icon: <UserOutlined />,
      label: '账号管理',
    },
  ]

  return (
    <Layout className="min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
      <Sider
        width={260}
        trigger={null}
        theme="light"
        className="rounded-tr-[32px] rounded-br-[32px]"
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          paddingTop: 48,
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: LOGO_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: 24,
            letterSpacing: 2,
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            transition: 'padding 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <span
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse"
          >
            智能招聘管理
          </span>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: '#fff',
            fontSize: 18,
            paddingLeft: CONTENT_PADDING_LEFT,
          }}
          className="[&_.ant-menu-item]:mb-4 [&_.ant-menu-item]:!h-14 [&_.ant-menu-item]:flex [&_.ant-menu-item]:items-center"
        />
        <div className="absolute bottom-0 w-full p-4">
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="w-full h-14 text-lg flex items-center justify-start text-gray-600 hover:text-red-500"
            style={{ paddingLeft: CONTENT_PADDING_LEFT + 16 }}
          >
            退出登录
          </Button>
        </div>
      </Sider>
      <Layout style={{ marginLeft: 260, background: 'transparent' }}>
        <Content
          style={{
            margin: 0,
            padding: `0 ${CONTENT_PADDING_LEFT}px`,
            background: 'transparent',
            minHeight: 280,
          }}
          className="animate-fade-in-up"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default CompanyLayout 