import React, { useState } from 'react'
import { Card, Button, Typography, Space, Input, message } from 'antd'
import { ReloadOutlined, BugOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

interface ApiResponse {
  [key: string]: any
}

const DebugAPI: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [interviewRecords, setInterviewRecords] = useState<ApiResponse | null>(null)
  const [skillAssessment, setSkillAssessment] = useState<ApiResponse | null>(null)
  const [specificRecord, setSpecificRecord] = useState<ApiResponse | null>(null)
  const [recordId, setRecordId] = useState<string>('')

  // 测试获取面试记录列表
  const testInterviewRecords = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/video/interview-records?page=1&size=10')
      setInterviewRecords(response.data)
      console.log('面试记录列表:', response.data)
      message.success('获取面试记录列表成功')
    } catch (error: any) {
      console.error('获取面试记录列表失败:', error)
      message.error('获取面试记录列表失败')
      setInterviewRecords({ error: error?.message || '未知错误' })
    } finally {
      setLoading(false)
    }
  }

  // 测试获取技能评估
  const testSkillAssessment = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/video/skill-assessment')
      setSkillAssessment(response.data)
      console.log('技能评估数据:', response.data)
      message.success('获取技能评估数据成功')
    } catch (error: any) {
      console.error('获取技能评估数据失败:', error)
      message.error('获取技能评估数据失败')
      setSkillAssessment({ error: error?.message || '未知错误' })
    } finally {
      setLoading(false)
    }
  }

  // 测试获取特定面试记录
  const testSpecificRecord = async () => {
    if (!recordId.trim()) {
      message.warning('请输入面试记录ID')
      return
    }

    setLoading(true)
    try {
      const response = await axios.get(`/api/video/interview-records/${recordId}`)
      setSpecificRecord(response.data)
      console.log('特定面试记录:', response.data)
      message.success('获取特定面试记录成功')
    } catch (error: any) {
      console.error('获取特定面试记录失败:', error)
      message.error('获取特定面试记录失败')
      setSpecificRecord({ error: error?.message || '未知错误' })
    } finally {
      setLoading(false)
    }
  }

  // 自动提取第一个记录ID
  const extractFirstRecordId = () => {
    if (interviewRecords?.records && Array.isArray(interviewRecords.records) && interviewRecords.records.length > 0) {
      const firstRecord = interviewRecords.records[0]
      const id = firstRecord?.id || firstRecord?._id || firstRecord?.interviewId
      setRecordId(id || '')
      message.info(`已提取第一个记录ID: ${id}`)
    } else if (Array.isArray(interviewRecords) && interviewRecords.length > 0) {
      const firstRecord = interviewRecords[0]
      const id = firstRecord?.id || firstRecord?._id || firstRecord?.interviewId
      setRecordId(id || '')
      message.info(`已提取第一个记录ID: ${id}`)
    } else {
      message.warning('没有找到可用的记录ID')
    }
  }

  return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Title level={2}>
            <BugOutlined className="mr-2" />
            API 调试工具
          </Title>
          <Text type="secondary">用于调试面试记录和技能评估API</Text>
        </div>

        {/* 测试按钮区域 */}
        <Card title="API 测试" className="shadow-sm">
          <Space wrap>
            <Button
                type="primary"
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={testInterviewRecords}
            >
              测试面试记录列表
            </Button>
            <Button
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={testSkillAssessment}
            >
              测试技能评估
            </Button>
            <Button
                onClick={extractFirstRecordId}
                disabled={!interviewRecords}
            >
              提取第一个记录ID
            </Button>
          </Space>

          <div className="mt-4">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                  placeholder="输入面试记录ID"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
              />
              <Button
                  type="primary"
                  loading={loading}
                  onClick={testSpecificRecord}
              >
                测试特定记录
              </Button>
            </Space.Compact>
          </div>
        </Card>

        {/* 面试记录列表结果 */}
        {interviewRecords && (
            <Card title="面试记录列表响应" className="shadow-sm">
              <TextArea
                  value={JSON.stringify(interviewRecords, null, 2)}
                  rows={10}
                  readOnly
              />
            </Card>
        )}

        {/* 技能评估结果 */}
        {skillAssessment && (
            <Card title="技能评估响应" className="shadow-sm">
              <TextArea
                  value={JSON.stringify(skillAssessment, null, 2)}
                  rows={8}
                  readOnly
              />
            </Card>
        )}

        {/* 特定记录结果 */}
        {specificRecord && (
            <Card title="特定面试记录响应" className="shadow-sm">
              <TextArea
                  value={JSON.stringify(specificRecord, null, 2)}
                  rows={12}
                  readOnly
              />
            </Card>
        )}

        {/* 使用说明 */}
        <Card title="使用说明" className="shadow-sm">
          <Paragraph>
            <Text strong>调试步骤：</Text>
          </Paragraph>
          <ol>
            <li>点击"测试面试记录列表"查看API返回的数据结构</li>
            <li>点击"提取第一个记录ID"自动获取第一个记录的ID</li>
            <li>点击"测试特定记录"查看单个记录的详细数据</li>
            <li>点击"测试技能评估"查看技能评估数据结构</li>
            <li>检查浏览器控制台的详细日志信息</li>
          </ol>
          <Paragraph className="mt-4">
            <Text type="secondary">
              这个工具可以帮助我们了解后端API的实际响应格式，从而修复报告页面的数据获取问题。
            </Text>
          </Paragraph>
        </Card>
      </div>
  )
}

export default DebugAPI