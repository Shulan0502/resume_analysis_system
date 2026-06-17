import { Layout, Menu, Button, message } from 'antd'
import {
  HomeOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
  UserOutlined,
  BulbOutlined,
  LogoutOutlined,
  ShopOutlined,
  HistoryOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

const { Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

const LOGO_HEIGHT = 56
const CONTENT_PADDING_LEFT = 24

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    message.success('已退出登录')
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/qa',
      icon: <BulbOutlined />,
      label: '智能体问答',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史记录',
    },
    {
      key: '/jobs',
      icon: <ShopOutlined />,
      label: '求职市场',
    },
    {
      key: '/resume-analysis',
      icon: <UserOutlined />,
      label: '智能体简历分析',
    },
    {
      key: '/interview',
      icon: <VideoCameraOutlined />,
      label: '智能模拟面试',
    },
    {
      key: '/analysis',
      icon: <BarChartOutlined />,
      label: '面试分析结果',
    },
    {
      key: '/resources',
      icon: <BookOutlined />,
      label: '学习资源推荐',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心',
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
            智能体面试评测
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
            fontSize: 20,
            paddingLeft: CONTENT_PADDING_LEFT,
          }}
          className="[&_.ant-menu-item]:mb-4 [&_.ant-menu-item]:!h-16 [&_.ant-menu-item]:flex [&_.ant-menu-item]:items-center [&_.ant-menu-item-icon]:text-xl"
        />
        <div className="absolute bottom-8 left-0 right-0">
          <Button
            type="text"
            icon={<LogoutOutlined className="text-xl" />}
            onClick={handleLogout}
            className="w-full h-16 text-xl flex items-center justify-start text-gray-600 hover:text-red-500"
            style={{ paddingLeft: CONTENT_PADDING_LEFT + 16 }}
          >
            退出登录
          </Button>
        </div>
      </Sider>
      <Layout style={{ marginLeft: 260, background: 'transparent', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Content
          style={{
            padding: 24,
            background: 'transparent',
            flex: '1 1 auto',
            overflowY: 'auto',
          }}
          className="animate-fade-in-up"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
