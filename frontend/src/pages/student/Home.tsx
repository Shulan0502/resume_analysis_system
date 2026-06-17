import { Card, Statistic, message } from 'antd'
import {
  VideoCameraOutlined,
  BarChartOutlined,
  UserOutlined,
  BookOutlined,
  AudioOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'
import { ConfigProvider } from 'antd'
import 'dayjs/locale/zh-cn'
import dayjs from 'dayjs'
import React from 'react'
import axios from 'axios'
import { getResourceStats } from '@/services/api.ts'

dayjs.locale('zh-cn')

const Home = () => {
  const navigate = useNavigate()
  const [inputValue, setInputValue] = React.useState('')
  const [finishedCount, setFinishedCount] = React.useState<number>(0)
  const [avgImprove, setAvgImprove] = React.useState<number>(0)
  const [recommendedResourcesCount, setRecommendedResourcesCount] = React.useState<number>(12)

  // 新增：最新面试记录ID
  const [latestInterviewId, setLatestInterviewId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchInterviewStats = async () => {
      try {
        console.log('正在获取面试统计数据...')
        const response = await axios.get('/api/video/interview-records?page=1&size=1000')
        const data = response.data
        console.log('面试记录响应:', data)

        // 处理不同的响应格式
        let records = []
        if (data.success && Array.isArray(data.records)) {
          records = data.records
        } else if (Array.isArray(data)) {
          // 如果直接返回数组
          records = data
        } else if (data.records && Array.isArray(data.records)) {
          // 如果有records字段但没有success字段
          records = data.records
        }

        console.log('处理后的记录数组:', records)

        if (records.length > 0) {
          // 过滤已完成的面试
          const finished = records.filter((r: any) =>
            r.status === '已完成' || r.status === 'completed' || !r.status
          )
          console.log('已完成的面试记录:', finished)

          setFinishedCount(finished.length)

          if (finished.length > 0) {
            // 按创建时间排序，获取最新的记录
            const latestRecord = finished.sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || a.date || 0).getTime()
              const dateB = new Date(b.createdAt || b.date || 0).getTime()
              return dateB - dateA
            })[0]

            console.log('最新面试记录:', latestRecord)
            const recordId = latestRecord.id || latestRecord._id || latestRecord.interviewId
            setLatestInterviewId(recordId)
            console.log('设置的最新面试ID:', recordId)

            // 计算平均分数和提升幅度
            const avgScore = finished.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / finished.length
            const improve = Math.max(0, Math.round(((avgScore - 70) / 70) * 100))
            setAvgImprove(improve)
          } else {
            console.log('没有已完成的面试记录')
            setLatestInterviewId(null)
            setAvgImprove(0)
          }
        } else {
          console.log('没有面试记录')
          setFinishedCount(0)
          setLatestInterviewId(null)
          setAvgImprove(0)
        }
      } catch (e) {
        console.error('获取面试统计数据失败:', e)
        setFinishedCount(0)
        setLatestInterviewId(null)
        setAvgImprove(0)
      }
    }
    fetchInterviewStats()
    fetchResourceStats()
  }, [])

  // 获取学习资源统计
  const fetchResourceStats = async () => {
    try {
      const response = await getResourceStats(1) // 默认用户ID为1
      if (response.success && response.data) {
        setRecommendedResourcesCount(response.data.totalRecommendations || 12)
      }
    } catch (error) {
      console.error('获取资源统计失败:', error)
      // 保持默认值12
    }
  }

  const handleSend = () => {
    if (!inputValue.trim()) {
      message.warning('请输入消息内容')
      return
    }
    message.success('消息已发送: ' + inputValue)
    setInputValue('')
  }
// 功能入口卡片
  const features = [
    {
      title: '智能模拟面试',
      icon: <VideoCameraOutlined className="text-3xl text-blue-500" />,
      desc: '体验真实岗位场景，提升实战能力',
      path: '/interview',
    },
    {
      title: '多模态能力评测',
      icon: <BarChartOutlined className="text-3xl text-purple-500" />,
      desc: '语音、视频、文本全维度分析',
      path: '/analysis',
    },
    {
      title: '个性化反馈报告',
      icon: <UserOutlined className="text-3xl text-green-500" />,
      desc: '能力雷达图，精准定位提升方向',
      path: '/report',
      onClick: () => { // 点击事件处理
        if (latestInterviewId) {
          navigate(`/report/${latestInterviewId}`)
        } else if (finishedCount > 0) {
          // 有完成的面试但没有最新记录ID，可能是数据加载问题
          message.info('正在加载面试记录，请稍后再试')
        } else {
          // 确实没有面试记录，引导用户去面试
          message.warning('暂无面试记录，请先完成一次面试')
          // 可选：自动跳转到面试页面
          // navigate('/interview')
        }
      }
    },
    {
      title: '学习资源推荐',
      icon: <BookOutlined className="text-3xl text-yellow-500" />,
      desc: '专属学习路径，助力高效成长',
      path: '/resources',
    },
  ]

  // 数据统计
  const stats = [
    {
      title: '已完成模拟面试',
      value: finishedCount,
      icon: <VideoCameraOutlined className="text-xl text-blue-400" />,
    },
    {
      title: '平均能力提升',
      value: avgImprove,
      suffix: '%',
      icon: <BarChartOutlined className="text-xl text-purple-400" />,
    },
    {
      title: '推荐学习资源',
      value: recommendedResourcesCount,
      suffix: '门',
      icon: <BookOutlined className="text-xl text-yellow-400" />,
    },
  ]

  // 系统亮点
  const highlights = [
    {
      title: '场景丰富',
      desc: '覆盖AI、大数据、物联网等多领域典型岗位',
    },
    {
      title: '多模态分析',
      desc: '语音、视频、文本深度融合，能力评测更科学',
    },
    {
      title: '智能反馈',
      desc: '可视化报告+改进建议，提升更有针对性',
    },
  ]

  return (
    <ConfigProvider locale={zhCN}>
      <div className="p-4 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 min-h-screen">
        {/* 顶部Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-4 flex items-center bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
          <div className="p-0 flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-0 drop-shadow inline-block align-top">多模态AI模拟面试评测</h1>
            {/* Animated line decoration */}
            <div className="inline-block h-1 bg-purple-500 ml-2 animate-line-stretch align-top"></div>
            {/* Animated bubbles */}
            <div className="inline-block relative w-32 h-8 ml-4" style={{ top: '10px' }}>
              <div className="absolute w-3 h-3 rounded-full bg-blue-300 animate-bubble-float" style={{ top: '5%', left: '10%', animationDuration: '3s', animationDelay: '0s' }}></div>
              <div className="absolute w-2 h-2 rounded-full bg-pink-300 animate-bubble-float" style={{ top: '20%', left: '20%', animationDuration: '3.5s', animationDelay: '0.5s' }}></div>
              <div className="absolute w-4 h-4 rounded-full bg-green-300 animate-bubble-float" style={{ top: '10%', left: '30%', animationDuration: '4s', animationDelay: '1s' }}></div>
              <div className="absolute w-2 h-2 rounded-full bg-yellow-300 animate-bubble-float" style={{ top: '25%', left: '40%', animationDuration: '2.8s', animationDelay: '0.2s' }}></div>
              <div className="absolute w-3 h-3 rounded-full bg-red-300 animate-bubble-float" style={{ top: '15%', left: '50%', animationDuration: '3.2s', animationDelay: '0.8s' }}></div>
              <div className="absolute w-2 h-2 rounded-full bg-indigo-300 animate-bubble-float" style={{ top: '0%', left: '60%', animationDuration: '3.8s', animationDelay: '1.2s' }}></div>
              <div className="absolute w-4 h-4 rounded-full bg-teal-300 animate-bubble-float" style={{ top: '30%', left: '70%', animationDuration: '4.2s', animationDelay: '1.5s' }}></div>
              <div className="absolute w-3 h-3 rounded-full bg-orange-300 animate-bubble-float" style={{ top: '5%', left: '80%', animationDuration: '3s', animationDelay: '0.7s' }}></div>

              <div className="absolute w-2 h-2 rounded-full bg-blue-400 animate-bubble-float" style={{ top: '15%', left: '5%', animationDuration: '3.1s', animationDelay: '0.1s' }}></div>
              <div className="absolute w-3 h-3 rounded-full bg-pink-400 animate-bubble-float" style={{ top: '35%', left: '95%', animationDuration: '3.6s', animationDelay: '0.6s' }}></div>
              <div className="absolute w-2 h-2 rounded-full bg-green-400 animate-bubble-float" style={{ top: '10%', left: '75%', animationDuration: '4.1s', animationDelay: '1.1s' }}></div>
              <div className="absolute w-4 h-4 rounded-full bg-yellow-400 animate-bubble-float" style={{ top: '25%', left: '15%', animationDuration: '2.9s', animationDelay: '0.3s' }}></div>
              <div className="absolute w-3 h-3 rounded-full bg-red-400 animate-bubble-float" style={{ top: '40%', left: '85%', animationDuration: '3.3s', animationDelay: '0.9s' }}></div>
            </div>
            <div className="text-lg text-gray-600 mb-2 mt-0">面向高校学生，助力提升面试能力，赢在职场起点</div>
            <div className="text-sm text-gray-400">项目背景：聚焦高校毕业生面试痛点，提供AI驱动的全方位模拟与反馈</div>
          </div>
        </div>

        {/* 功能入口卡片区 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl shadow hover:shadow-lg transition-all cursor-pointer flex flex-col items-center py-8 group"
              onClick={() => {
                if (f.onClick) {
                  f.onClick()
                } else {
                  navigate(f.path)
                }
              }}
            >
              <div className="mb-3 group-hover:scale-110 transition-transform">{f.icon}</div>
              <div className="text-base font-semibold mb-1 text-gray-800">{f.title}</div>
              <div className="text-xs text-gray-400">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* 数据统计区 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((s) => (
            <Card key={s.title} className="rounded-2xl shadow border-0">
              <Statistic
                title={<span className="flex items-center gap-2">{s.icon}{s.title}</span>}
                value={s.value}
                suffix={s.suffix}
              />
            </Card>
          ))}
        </div>

        {/* 系统亮点区 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {highlights.map((h) => (
            <div key={h.title} className="bg-white rounded-2xl shadow p-6 text-center">
              <div className="text-lg font-bold mb-2 text-blue-600">{h.title}</div>
              <div className="text-gray-500 text-sm">{h.desc}</div>
            </div>
          ))}
        </div>

        {/* 消息输入区（大圆角卡片风格，右下语音和发送） */}
        <div className="w-full max-w-4xl mx-auto px-4 mt-8 mb-8">
          <form
            className="bg-white rounded-3xl border border-gray-200 px-8 pt-6 pb-4 min-h-[120px] flex flex-col justify-between relative"
            onSubmit={e => { e.preventDefault(); handleSend(); }}
          >
            <textarea
              className="w-full resize-none border-none outline-none text-base bg-transparent placeholder:text-gray-400 min-h-[48px] max-h-40 mb-2"
              placeholder="• 通过文字交互与智能体深度对话，即可获取定制化面试及求职策略建议
• 借助语音实时转文字功能直抒困惑与需求，高效驱动面试准备进程"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onClick={() => navigate('/qa')}
              rows={3}
            />
            {/* 语音和发送按钮 - 放在输入框内右下角 */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors focus:outline-none p-0 border-none bg-transparent"
                title="语音输入"
              >
                <AudioOutlined className="text-2xl" />
              </button>
              <button
                type="submit"
                className={`flex items-center justify-center transition-colors focus:outline-none p-0 border-none bg-transparent ${inputValue.trim() ? 'text-blue-600 hover:text-blue-500' : 'text-gray-400 cursor-not-allowed'}`}
                title="发送"
                disabled={!inputValue.trim()}
              >
                <SendOutlined className="text-2xl" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default Home