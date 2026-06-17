import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Button,
  Tag,
  Progress,
  Descriptions,
  Divider,
  Space,
  message
} from 'antd'
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  DownloadOutlined,
  TrophyOutlined,
  BulbOutlined,
  RiseOutlined
} from '@ant-design/icons'
import { Radar } from '@ant-design/plots'
import axios from 'axios'

const { Title, Paragraph, Text } = Typography

interface SkillScore {
  name: string
  score: number
  color: string
  description?: string
}

interface InterviewReportData {
  success: boolean
  error?: string
  interviewId: string
  date: string
  type: string
  position: string
  score: number
  status: string
  duration: number
  skillScores: SkillScore[]
  details: {
    overallScore: number
    feedback: string
    strengths: string[]
    improvements: string[]
    recommendations: string[]
    interviewer: string
    company: string
  }
  analysisId?: number
  createdAt: string
}

const Report: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [reportData, setReportData] = useState<InterviewReportData | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取面试报告数据
  const fetchReportData = async () => {
    if (!id) {
      message.error('缺少面试记录ID')
      navigate('/home')
      return
    }

    setLoading(true)
    try {
      console.log('正在获取面试记录，ID:', id)

      // 首先获取面试记录详情
      const recordResponse = await axios.get(`/api/video/interview-records/${id}`)
      console.log('面试记录响应:', recordResponse.data)

      let recordData = recordResponse.data

      // 处理不同的响应格式
      if (!recordData.success) {
        throw new Error(recordData.error || '获取面试记录失败')
      }

      // 如果响应直接是记录数据（没有success字段）
      if (!recordData.success && recordData.id) {
        recordData = {
          success: true,
          ...recordData
        }
      }

      // 如果仍然没有必要的数据，抛出错误
      if (!recordData.id && !recordData.interviewId) {
        throw new Error('面试记录数据格式错误')
      }

      console.log('正在获取技能评估数据...')

      // 然后获取技能评估数据
      let skillData: any = { success: false, skillScores: [], analysisId: null }
      try {
        const skillResponse = await axios.get('/api/video/skill-assessment')
        console.log('技能评估响应:', skillResponse.data)
        skillData = skillResponse.data
      } catch (skillError) {
        console.warn('获取技能评估数据失败，使用默认数据:', skillError)
        // 如果技能评估失败，使用默认的空数据，不影响主要功能
      }

      // 合并数据
      const combinedData: InterviewReportData = {
        success: true,
        interviewId: recordData.id || recordData.interviewId || id,
        date: recordData.date || recordData.createdAt?.split('T')[0] || '未知',
        type: recordData.type || '面试',
        position: recordData.position || '未指定岗位',
        score: recordData.score || recordData.details?.overallScore || 0,
        status: recordData.status || '已完成',
        duration: recordData.duration || 0,
        details: recordData.details || {
          overallScore: recordData.score || 0,
          feedback: '暂无反馈信息',
          strengths: [],
          improvements: [],
          recommendations: [],
          interviewer: '未知',
          company: '未知'
        },
        skillScores: skillData.success ? (skillData.skillScores || []) : [],
        analysisId: skillData.analysisId,
        createdAt: recordData.createdAt || new Date().toISOString()
      }

      console.log('合并后的数据:', combinedData)
      setReportData(combinedData)
    } catch (error: any) {
      console.error('获取报告数据时发生错误:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`获取报告数据失败: ${errorMessage}`)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [id])

  // 雷达图配置
  const radarConfig = {
    data: reportData?.skillScores.map(skill => ({
      name: skill.name,
      value: skill.score,
    })) || [],
    xField: 'name',
    yField: 'value',
    meta: {
      value: {
        alias: '得分',
        min: 0,
        max: 100,
      },
    },
    xAxis: {
      line: null,
      tickLine: null,
    },
    yAxis: {
      label: false,
      grid: {
        alternateColor: 'rgba(0, 0, 0, 0.04)',
      },
    },
    point: {
      size: 3,
    },
    area: {
      style: {
        fill: 'rgba(24, 144, 255, 0.2)',
      },
    },
  }

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'green'
    if (score >= 70) return 'blue'
    if (score >= 60) return 'orange'
    return 'red'
  }

  // 获取分数等级
  const getScoreLevel = (score: number) => {
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 70) return '中等'
    if (score >= 60) return '及格'
    return '需要改进'
  }

  if (loading) {
    return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/home')}
            >
              返回首页
            </Button>
            <Title level={2}>个性化反馈报告</Title>
            <div></div>
          </div>
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        </div>
    )
  }

  if (!reportData) {
    return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/home')}
            >
              返回首页
            </Button>
            <Title level={2}>个性化反馈报告</Title>
            <div></div>
          </div>
          <Alert
              message="无法获取报告数据"
              description="该面试记录不存在或已被删除。您可以先完成一次面试来生成报告。"
              type="warning"
              showIcon
              action={
                <Space>
                  <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={fetchReportData}
                  >
                    重试
                  </Button>
                  <Button
                      type="primary"
                      size="small"
                      onClick={() => navigate('/interview')}
                  >
                    去面试
                  </Button>
                  <Button
                      size="small"
                      onClick={() => navigate('/home')}
                  >
                    返回首页
                  </Button>
                </Space>
              }
          />
        </div>
    )
  }

  return (
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/home')}
          >
            返回首页
          </Button>
          <Title level={2}>个性化反馈报告</Title>
          <Space>
            <Button
                icon={<ReloadOutlined />}
                onClick={fetchReportData}
                title="刷新数据"
            />
            <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => message.info('导出功能开发中')}
            >
              导出报告
            </Button>
          </Space>
        </div>

        {/* 面试基本信息 */}
        <Card title="面试基本信息" className="shadow-sm">
          <Descriptions bordered column={3}>
            <Descriptions.Item label="面试日期">{reportData.date}</Descriptions.Item>
            <Descriptions.Item label="面试类型">{reportData.type}</Descriptions.Item>
            <Descriptions.Item label="应聘岗位">{reportData.position}</Descriptions.Item>
            <Descriptions.Item label="面试时长">{reportData.duration}分钟</Descriptions.Item>
            <Descriptions.Item label="面试状态">
              <Tag color={reportData.status === '已完成' ? 'green' : 'blue'}>
                {reportData.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="综合得分">
              <Space>
                <Tag color={getScoreColor(reportData.score)} className="text-lg px-3 py-1">
                  {reportData.score}分
                </Tag>
                <Text type="secondary">({getScoreLevel(reportData.score)})</Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 能力评估 */}
        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Card
                title={
                  <Space>
                    <TrophyOutlined />
                    能力评估雷达图
                  </Space>
                }
                extra={
                  <Text type="secondary">基于面试表现智能生成</Text>
                }
                className="shadow-sm"
            >
              {reportData.skillScores.length > 0 ? (
                  <Radar {...radarConfig} />
              ) : (
                  <div className="text-center text-gray-500 py-8">
                    暂无能力评估数据
                  </div>
              )}
            </Card>
          </Col>
          <Col span={8}>
            <Card
                title={
                  <Space>
                    <RiseOutlined />
                    能力得分详情
                  </Space>
                }
                className="shadow-sm"
            >
              {reportData.skillScores.length > 0 ? (
                  reportData.skillScores.map((skill) => (
                      <div key={skill.name} className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{skill.name}</span>
                          <span className="font-bold">{skill.score}分</span>
                        </div>
                        <Progress
                            percent={skill.score}
                            strokeColor={skill.color}
                            showInfo={false}
                        />
                        {skill.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {skill.description}
                            </div>
                        )}
                      </div>
                  ))
              ) : (
                  <div className="text-center text-gray-500 py-8">
                    暂无数据
                  </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* 详细反馈信息 */}
        <Card
            title={
              <Space>
                <BulbOutlined />
                详细反馈分析
              </Space>
            }
            className="shadow-sm"
        >
          {/* 面试反馈 */}
          <div className="mb-6">
            <Title level={4}>面试反馈</Title>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Paragraph>{reportData.details.feedback}</Paragraph>
            </div>
          </div>

          <Divider />

          {/* 三列布局：优势、改进建议、专业建议 */}
          <Row gutter={24}>
            <Col span={8}>
              <div className="h-full">
                <Title level={5} className="text-green-600 mb-3">
                  <Space>
                    <TrophyOutlined />
                    优势表现
                  </Space>
                </Title>
                <div className="bg-green-50 p-4 rounded-lg h-full">
                  {reportData.details.strengths.length > 0 ? (
                      <ul className="list-none space-y-2">
                        {reportData.details.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2">✓</span>
                              <span className="text-sm">{strength}</span>
                            </li>
                        ))}
                      </ul>
                  ) : (
                      <Text type="secondary">暂无优势记录</Text>
                  )}
                </div>
              </div>
            </Col>

            <Col span={8}>
              <div className="h-full">
                <Title level={5} className="text-orange-600 mb-3">
                  <Space>
                    <RiseOutlined />
                    改进建议
                  </Space>
                </Title>
                <div className="bg-orange-50 p-4 rounded-lg h-full">
                  {reportData.details.improvements.length > 0 ? (
                      <ul className="list-none space-y-2">
                        {reportData.details.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-orange-500 mr-2">⚡</span>
                              <span className="text-sm">{improvement}</span>
                            </li>
                        ))}
                      </ul>
                  ) : (
                      <Text type="secondary">暂无改进建议</Text>
                  )}
                </div>
              </div>
            </Col>

            <Col span={8}>
              <div className="h-full">
                <Title level={5} className="text-blue-600 mb-3">
                  <Space>
                    <BulbOutlined />
                    专业建议
                  </Space>
                </Title>
                <div className="bg-blue-50 p-4 rounded-lg h-full">
                  {reportData.details.recommendations.length > 0 ? (
                      <ul className="list-none space-y-2">
                        {reportData.details.recommendations.map((recommendation, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">💡</span>
                              <span className="text-sm">{recommendation}</span>
                            </li>
                        ))}
                      </ul>
                  ) : (
                      <Text type="secondary">暂无专业建议</Text>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 面试官信息 */}
        {(reportData.details.interviewer || reportData.details.company) && (
            <Card title="面试官信息" className="shadow-sm">
              <Descriptions bordered column={2}>
                {reportData.details.interviewer && (
                    <Descriptions.Item label="面试官">{reportData.details.interviewer}</Descriptions.Item>
                )}
                {reportData.details.company && (
                    <Descriptions.Item label="公司">{reportData.details.company}</Descriptions.Item>
                )}
                {reportData.analysisId && (
                    <Descriptions.Item label="分析ID">{reportData.analysisId}</Descriptions.Item>
                )}
                <Descriptions.Item label="生成时间">{reportData.createdAt}</Descriptions.Item>
              </Descriptions>
            </Card>
        )}

        {/* 操作建议 */}
        <Card title="下一步建议" className="shadow-sm">
          <Row gutter={16}>
            <Col span={8}>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Title level={4} className="text-blue-600">继续练习</Title>
                <Paragraph className="text-sm">
                  基于当前表现，建议继续进行模拟面试练习，重点关注需要改进的能力项。
                </Paragraph>
                <Button type="primary" onClick={() => navigate('/interview')}>
                  开始新面试
                </Button>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Title level={4} className="text-green-600">查看历史</Title>
                <Paragraph className="text-sm">
                  查看所有面试记录，对比分析能力提升趋势和改进效果。
                </Paragraph>
                <Button onClick={() => navigate('/analysis')}>
                  查看分析
                </Button>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Title level={4} className="text-purple-600">AI咨询</Title>
                <Paragraph className="text-sm">
                  与AI助手深入交流，获取更多个性化的面试指导和职业建议。
                </Paragraph>
                <Button onClick={() => navigate('/qa')}>
                  AI咨询
                </Button>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
  )
}

export default Report