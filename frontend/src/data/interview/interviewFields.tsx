import {
  RobotOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  UserSwitchOutlined,
  CloudOutlined,
  SafetyOutlined,
  CodeOutlined,
  HddOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'

export const interviewFields = [
  {
    id: 'ai',
    name: '人工智能',
    icon: <RobotOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    positions: [
      { name: 'AI算法工程师', level: '高级' },
      { name: '机器学习工程师', level: '中级' },
      { name: '计算机视觉研究员', level: '初级' },
    ],
  },
  {
    id: 'bigdata',
    name: '大数据',
    icon: <DatabaseOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    positions: [
      { name: '大数据开发工程师', level: '中级' },
      { name: '数据分析师', level: '初级' },
    ],
  },
  {
    id: 'iot',
    name: '物联网',
    icon: <GlobalOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    positions: [
      { name: '物联网开发工程师', level: '中级' },
      { name: '嵌入式开发工程师', level: '初级' },
    ],
  },
  {
    id: 'intelligent',
    name: '智能系统',
    icon: <UserSwitchOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    positions: [
      { name: '智能系统工程师', level: '中级' },
      { name: '自动化测试工程师', level: '初级' },
    ],
  },
  {
    id: 'cloud',
    name: '云计算',
    icon: <CloudOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    positions: [
      { name: '云平台开发工程师', level: '中级' },
      { name: '云运维工程师', level: '初级' },
    ],
  },
  {
    id: 'security',
    name: '网络安全',
    icon: <SafetyOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    positions: [
      { name: '安全工程师', level: '中级' },
      { name: '渗透测试工程师', level: '初级' },
    ],
  },
  {
    id: 'frontend',
    name: '前端开发',
    icon: <CodeOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    positions: [
      { name: '前端开发工程师', level: '中级' },
      { name: 'Web前端实习生', level: '初级' },
    ],
  },
  {
    id: 'backend',
    name: '后端开发',
    icon: <HddOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    positions: [
      { name: '后端开发工程师', level: '中级' },
      { name: '数据库开发工程师', level: '初级' },
    ],
  },
  {
    id: 'product',
    name: '产品经理',
    icon: <AppstoreOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    positions: [
      { name: '产品经理', level: '中级' },
      { name: '需求分析师', level: '初级' },
      { name: '用户体验设计师', level: '初级' },
    ],
  },
] 