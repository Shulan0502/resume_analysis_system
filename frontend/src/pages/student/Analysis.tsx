import { Card, Row, Col, Table, Tag, Progress, Typography, DatePicker, Spin, message, Alert, Button, Select, Modal, Space, Descriptions, Popconfirm, Skeleton } from 'antd'
import { Radar } from '@ant-design/plots'
import { CalendarOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, PlayCircleOutlined, BarChartOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const { Title } = Typography

interface SkillScore {
  name: string
  score: number
  color: string
  description?: string
}

interface InterviewRecord {
  key: string
  date: string
  type: string
  score: number
  status: string
}

interface SkillAssessmentData {
  success: boolean
  error?: string
  analysisId: number
  createdAt: string
  skillScores: SkillScore[]
  recentInterviews: InterviewRecord[]
}

interface InterviewRecordsData {
  success: boolean
  error?: string
  records: DetailedInterviewRecord[]
  totalCount: number
  totalPages: number
  currentPage: number
}

interface DetailedInterviewRecord {
  id: string
  date: string
  type: string
  position: string
  score: number
  status: string
  duration: number
  videoUrl: string
  analysisUrl: string
  createdAt: string
  updatedAt: string
  details: {
    overallScore: number
    feedback: string
    strengths: string[]
    improvements: string[]
    recommendations: string[]
    interviewer: string
    company: string
  }
}

const { Option } = Select

// 骨架屏组件 - 带加载提示
const RadarSkeleton = () => (
  <Card title="能力评估雷达图" extra={<Spin size="small" />}>
    <div className="flex flex-col justify-center items-center py-8">
      <Skeleton.Avatar active size={200} shape="circle" />
      <div className="mt-4 text-sm text-gray-400">正在分析您的面试能力...</div>
    </div>
  </Card>
)

const SkillScoresSkeleton = () => (
  <Card title="能力得分详情" extra={<Spin size="small" />}>
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <Skeleton.Input active style={{ width: 80 }} size="small" />
            <Skeleton.Input active style={{ width: 40 }} size="small" />
          </div>
          <Skeleton.Input active style={{ width: '100%' }} size="small" />
        </div>
      ))}
    </div>
  </Card>
)

const TableSkeleton = () => (
  <Card title="最近面试记录">
    <Skeleton active paragraph={{ rows: 4 }} title={{ width: '30%' }} />
  </Card>
)

const Analysis = () => {
  const [skillAssessmentData, setSkillAssessmentData] = useState<SkillAssessmentData | null>(null)
  const [skillLoading, setSkillLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 面试记录相关状态
  const [interviewRecords, setInterviewRecords] = useState<InterviewRecordsData | null>(null)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [selectedRecord, setSelectedRecord] = useState<DetailedInterviewRecord | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  // 获取技能评估数据 - 带超时和缓存
  const fetchSkillAssessment = async (useCache = true) => {
    // 检查本地缓存
    if (useCache) {
      const cached = localStorage.getItem('skillAssessmentData')
      const cachedTime = localStorage.getItem('skillAssessmentDataTime')
      if (cached && cachedTime) {
        const age = Date.now() - parseInt(cachedTime)
        // 缓存5分钟内有效
        if (age < 5 * 60 * 1000) {
          setSkillAssessmentData(JSON.parse(cached))
          setSkillLoading(false)
          // 后台静默刷新
          fetchSkillAssessment(false)
          return
        }
      }
    }

    setSkillLoading(true)
    try {
      // 添加超时处理
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

      const response = await axios.get('/api/video/skill-assessment', {
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const data = response.data

      if (data.success) {
        setSkillAssessmentData(data)
        // 缓存到本地
        localStorage.setItem('skillAssessmentData', JSON.stringify(data))
        localStorage.setItem('skillAssessmentDataTime', Date.now().toString())
      } else {
        message.error(data.error || '获取技能评估数据失败')
        setSkillAssessmentData(null)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        message.error('请求超时，请检查网络连接')
      } else {
        console.error('Error fetching skill assessment:', error)
        message.error('获取技能评估数据失败，请稍后重试')
      }
      setSkillAssessmentData(null)
    } finally {
      setSkillLoading(false)
    }
  }

  // 获取面试记录数据 - 带超时
  const fetchInterviewRecords = async () => {
    setRecordsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
      })

      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)

      // 添加超时处理
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

      const response = await axios.get(`/api/video/interview-records?${params}`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const data = response.data

      if (data.success) {
        setInterviewRecords(data)
      } else {
        message.error(data.error || '获取面试记录失败')
        setInterviewRecords(null)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        message.error('请求超时，请检查网络连接')
      } else {
        console.error('Error fetching interview records:', error)
        message.error('获取面试记录失败，请稍后重试')
      }
      setInterviewRecords(null)
    } finally {
      setRecordsLoading(false)
    }
  }

  // 查看面试记录详情
  const handleViewRecord = async (recordId: string) => {
    try {
      const response = await axios.get(`/api/video/interview-records/${recordId}`)
      setSelectedRecord(response.data)
      setDetailModalVisible(true)
    } catch (error) {
      message.error('获取面试记录详情失败')
    }
  }

  // 删除面试记录
  const handleDeleteRecord = async (recordId: string) => {
    try {
      await axios.delete(`/api/video/interview-records/${recordId}`)
      message.success('删除成功')
      fetchInterviewRecords()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 页面加载时同时发起请求，但分别处理加载状态
  useEffect(() => {
    // 使用 Promise.all 同时发起请求，但各自管理 loading 状态
    fetchSkillAssessment()
    fetchInterviewRecords()
  }, [])

  useEffect(() => {
    fetchInterviewRecords()
  }, [currentPage, pageSize, statusFilter, typeFilter])

  const skillScores = skillAssessmentData?.skillScores || []
  const recentInterviewRecords = skillAssessmentData?.recentInterviews || []

  const radarData = skillScores.map((skill) => ({
    name: skill.name,
    value: skill.score,
  }))

  const filteredRecords = selectedDate
    ? recentInterviewRecords.filter(r => r.date === selectedDate)
    : recentInterviewRecords

  // 详细面试记录表格列
  const detailedColumns = [
    {
      title: '面试日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: DetailedInterviewRecord, b: DetailedInterviewRecord) => 
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      ellipsis: true,
    },
    {
      title: '面试类型',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: '技术面试', value: '技术面试' },
        { text: '综合面试', value: '综合面试' },
        { text: 'HR面试', value: 'HR面试' },
        { text: '终面', value: '终面' },
      ],
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Tag color={score >= 85 ? 'green' : score >= 70 ? 'blue' : score >= 60 ? 'orange' : 'red'}>
          {score}分
        </Tag>
      ),
      sorter: (a: DetailedInterviewRecord, b: DetailedInterviewRecord) => a.score - b.score,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration}分钟`,
      sorter: (a: DetailedInterviewRecord, b: DetailedInterviewRecord) => a.duration - b.duration,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === '已完成' ? 'green' : 
          status === '进行中' ? 'blue' : 
          status === '已取消' ? 'red' : 'default'
        }>
          {status}
        </Tag>
      ),
      filters: [
        { text: '已完成', value: '已完成' },
        { text: '进行中', value: '进行中' },
        { text: '已取消', value: '已取消' },
      ],
    },
    {
      title: '操作',
      key: 'action',
      render: (record: DetailedInterviewRecord) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewRecord(record.id)}
          >
            查看详情
          </Button>
          <Button 
            type="link" 
            icon={<PlayCircleOutlined />}
            onClick={() => window.open(record.videoUrl)}
          >
            播放视频
          </Button>
          <Button 
            type="link" 
            icon={<BarChartOutlined />}
            onClick={() => window.open(record.analysisUrl)}
          >
            分析报告
          </Button>
          <Popconfirm
            title="确定删除这条记录吗？"
            onConfirm={() => handleDeleteRecord(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 简单面试记录表格列
  const simpleColumns = [
    {
      title: '面试日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '面试岗位',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
          {score}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '已完成' ? 'green' : 'blue'}>{status}</Tag>
      ),
    },
  ]

  const radarConfig = {
    data: radarData,
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
      size: 2,
    },
    area: {
      style: {
        fill: 'rgba(24, 144, 255, 0.2)',
      },
    },
  }

  // 如果技能评估数据加载失败，显示错误提示
  const showError = !skillLoading && !skillAssessmentData

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <Title level={2}>面试分析结果</Title>
        <div className="flex items-center space-x-2">
          {!skillLoading && skillAssessmentData && (
            <span className="text-sm text-gray-500">
              基于分析ID: {skillAssessmentData.analysisId}
            </span>
          )}
          <ReloadOutlined
            className="cursor-pointer text-blue-500 hover:text-blue-700"
            onClick={() => {
              fetchSkillAssessment()
              fetchInterviewRecords()
            }}
            title="刷新数据"
          />
        </div>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert
              message="无法获取分析数据"
              description="请先完成至少一次面试分析，或稍后重试。"
              type="warning"
              showIcon
              action={
                <div className="flex items-center space-x-2">
                  <ReloadOutlined
                    className="cursor-pointer text-blue-500 hover:text-blue-700"
                    onClick={() => fetchSkillAssessment()}
                  />
                  <span className="text-sm text-gray-500">点击重试</span>
                </div>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          {skillLoading ? (
            <RadarSkeleton />
          ) : skillScores.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card title="能力评估雷达图" extra={
                <span className="text-sm text-gray-500">
                  基于最新面试表现动态生成
                </span>
              }>
                <Radar {...radarConfig} />
              </Card>
            </motion.div>
          ) : (
            <Card title="能力评估雷达图">
              <div className="text-center text-gray-500 py-8">
                暂无数据
              </div>
            </Card>
          )}
        </Col>
        <Col span={8}>
          {skillLoading ? (
            <SkillScoresSkeleton />
          ) : skillScores.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card title="能力得分详情" extra={
                <span className="text-sm text-gray-500">
                  智能评估
                </span>
              }>
                {skillScores.map((skill) => (
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
                ))}
              </Card>
            </motion.div>
          ) : (
            <Card title="能力得分详情">
              <div className="text-center text-gray-500 py-8">
                暂无数据
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* 最近面试记录 */}
      {recordsLoading ? (
        <TableSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card title={
            <div className="flex justify-between items-center">
              最近面试记录
              <DatePicker
                allowClear
                placeholder="选择日期"
                suffixIcon={<CalendarOutlined />}
                onChange={(_, dateString) => setSelectedDate(Array.isArray(dateString) ? null : (dateString || null))}
              />
            </div>
          }>
            <Table
              columns={simpleColumns}
              dataSource={filteredRecords}
              pagination={false}
              locale={{ emptyText: '暂无面试记录' }}
              size="small"
            />
          </Card>
        </motion.div>
      )}

      {/* 详细面试记录管理 */}
      <Card 
        title="面试记录管理" 
        extra={
          <Space>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="已完成">已完成</Option>
              <Option value="进行中">进行中</Option>
              <Option value="已取消">已取消</Option>
            </Select>
            <Select
              placeholder="类型筛选"
              allowClear
              style={{ width: 120 }}
              value={typeFilter}
              onChange={setTypeFilter}
            >
              <Option value="技术面试">技术面试</Option>
              <Option value="综合面试">综合面试</Option>
              <Option value="HR面试">HR面试</Option>
              <Option value="终面">终面</Option>
            </Select>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchInterviewRecords}
              title="刷新数据"
            />
          </Space>
        }
      >
        <Table
          columns={detailedColumns}
          dataSource={interviewRecords?.records || []}
          loading={recordsLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: interviewRecords?.totalCount || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page)
              if (size !== pageSize) {
                setPageSize(size)
                setCurrentPage(1)
              }
            },
          }}
          locale={{ emptyText: '暂无面试记录' }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 面试记录详情模态框 */}
      <Modal
        title="面试记录详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedRecord && (
            <Button 
              key="video" 
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => window.open(selectedRecord.videoUrl)}
            >
              观看视频
            </Button>
          ),
        ]}
        width={800}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="面试日期">{selectedRecord.date}</Descriptions.Item>
              <Descriptions.Item label="面试类型">{selectedRecord.type}</Descriptions.Item>
              <Descriptions.Item label="应聘岗位">{selectedRecord.position}</Descriptions.Item>
              <Descriptions.Item label="面试时长">{selectedRecord.duration}分钟</Descriptions.Item>
              <Descriptions.Item label="面试得分">
                <Tag color={selectedRecord.score >= 85 ? 'green' : selectedRecord.score >= 70 ? 'blue' : 'orange'}>
                  {selectedRecord.score}分
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="面试状态">
                <Tag color={selectedRecord.status === '已完成' ? 'green' : 'blue'}>
                  {selectedRecord.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="面试官">{selectedRecord.details.interviewer}</Descriptions.Item>
              <Descriptions.Item label="公司">{selectedRecord.details.company}</Descriptions.Item>
            </Descriptions>

            <div>
              <h4 className="font-medium mb-2">面试反馈</h4>
              <div className="bg-gray-50 p-3 rounded">
                {selectedRecord.details.feedback}
              </div>
            </div>

            <Row gutter={16}>
              <Col span={8}>
                <div>
                  <h4 className="font-medium mb-2 text-green-600">优势表现</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {selectedRecord.details.strengths.map((strength, index) => (
                      <li key={index} className="text-sm">{strength}</li>
                    ))}
                  </ul>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <h4 className="font-medium mb-2 text-orange-600">改进建议</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {selectedRecord.details.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm">{improvement}</li>
                    ))}
                  </ul>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <h4 className="font-medium mb-2 text-blue-600">专业建议</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {selectedRecord.details.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

export default Analysis 