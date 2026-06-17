import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Steps,
  message,
  Modal,
  Typography,
  List,
  Radio,
} from 'antd'
import {
  VideoCameraOutlined,
  AudioOutlined,

} from '@ant-design/icons'
import { interviewFields } from '../../data/interview/interviewFields.tsx'

const { Title} = Typography
const Interview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedField, setSelectedField] = useState<string>()
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<string>()
  const [isInterviewing] = useState(false)

  // 处理URL参数，自动选择领域
  useEffect(() => {
    const fieldId = searchParams.get('fieldId');
    const autoSelect = searchParams.get('autoSelect');
    const jobTitle = searchParams.get('jobTitle');

    if (fieldId && autoSelect === 'true') {
      // 验证fieldId是否有效
      const validField = interviewFields.find(f => f.id === fieldId);
      if (validField) {
        setSelectedField(fieldId);
        // 如果是自动选择，直接打开模态框
        setModalVisible(true);

        // 如果有岗位标题，尝试自动选择匹配的岗位
        if (jobTitle && validField.positions.length > 0) {
          // 简单匹配逻辑：选择第一个岗位作为默认
          setSelectedPosition(validField.positions[0].name);
        }
      }
    }
  }, [searchParams]);

  // 当前选中的领域对象
  const currentField = interviewFields.find(f => f.id === selectedField)

  // 点击领域卡片时弹窗
  const handleFieldClick = (fieldId: string) => {
    setSelectedField(fieldId)
    setSelectedPosition(undefined)
    setModalVisible(true)
  }

  // 开始面试
  const handleStartInterview = () => {
    if (!selectedPosition) {
      message.error('请选择岗位')
      return
    }
    // setModalVisible(false)
    // setIsInterviewing(true)
    // 这里可以根据需要跳转到面试流程页面或展示面试内容
    navigate('/interview-video-analysis');
  }

  const steps = [
    {
      title: '选择面试类型',
      description: '选择您想要面试的岗位类型',
    },
    {
      title: '设备检查',
      description: '确保摄像头和麦克风正常工作',
    },
    {
      title: '开始面试',
      description: '进入面试环节',
    },
  ]

  return (
    <div className="space-y-6">
      <Title level={2}>智能模拟面试</Title>

      <Steps
        current={0}
        items={steps}
        className="mb-8"
      />

      {!isInterviewing ? (
        <div>
          <Title level={4} className="mb-4">职业领域</Title>
          <Row gutter={[16, 16]}>
            {interviewFields.map(field => (
              <Col span={8} key={field.id}>
                <Card
                  hoverable
                  className="flex flex-col items-center py-6 cursor-pointer transition-all"
                  onClick={() => handleFieldClick(field.id)}
                >
                  {field.icon}
                  <div className="mt-2 text-base font-medium">{field.name}</div>
                </Card>
              </Col>
            ))}
          </Row>

          <Modal
            title={
              <div>
                <div>{currentField?.name + ' - 岗位选择'}</div>
                {searchParams.get('jobTitle') && (
                  <div className="text-sm text-gray-500 mt-1">
                    针对岗位：{searchParams.get('jobTitle')} - {searchParams.get('companyName')}
                  </div>
                )}
              </div>
            }
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            centered
            width={700}
            bodyStyle={{ padding: '32px 40px' }}
            footer={[
              <Button key="cancel" onClick={() => setModalVisible(false)}>
                取消
              </Button>,
              <Button key="start" type="primary" onClick={handleStartInterview}>
                开始面试
              </Button>,
            ]}
          >
            <Radio.Group
              value={selectedPosition}
              onChange={e => setSelectedPosition(e.target.value)}
              style={{ width: '100%' }}
            >
              <List
                dataSource={currentField?.positions || []}
                renderItem={item => (
                  <List.Item style={{ padding: '16px 0' }}>
                    <Radio value={item.name}>
                      <span className="font-medium text-base">{item.name}</span>
                      <span className="text-gray-400 text-xs ml-4">{item.level}</span>
                    </Radio>
                  </List.Item>
                )}
              />
            </Radio.Group>
          </Modal>
        </div>
      ) : (
        <Card>
          <div className="text-center">
            <Title level={3}>面试进行中</Title>
            <div className="mt-8">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card>
                    <VideoCameraOutlined className="text-4xl mb-4" />
                    <div>视频画面</div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <AudioOutlined className="text-4xl mb-4" />
                    <div>语音识别</div>
                  </Card>
                </Col>
              </Row>
            </div>
            <div className="mt-8">
              <Button type="primary" danger>
                结束面试
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default Interview