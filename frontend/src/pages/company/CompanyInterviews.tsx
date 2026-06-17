import { useState } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, DatePicker, Select, message } from 'antd';
import { EyeOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

interface InterviewData {
  id: string;
  candidateName: string;
  position: string;
  interviewType: 'online' | 'offline';
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduledTime: string;
  location: string;
  interviewers: string[];
  feedback?: string;
}

const CompanyInterviews = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(false);

  // 模拟面试数据
  const initialInterviews: InterviewData[] = [
    {
      id: '1',
      candidateName: '张三',
      position: '前端开发工程师',
      interviewType: 'online',
      status: 'scheduled',
      scheduledTime: '2024-03-20 14:00',
      location: '腾讯会议',
      interviewers: ['李经理', '王工程师'],
    },
    {
      id: '2',
      candidateName: '李四',
      position: '产品经理',
      interviewType: 'offline',
      status: 'completed',
      scheduledTime: '2024-03-18 10:00',
      location: '公司会议室A',
      interviewers: ['张总监', '刘经理'],
      feedback: '候选人表现优秀，技术能力符合要求，建议录用。',
    },
  ];

  const [interviews, setInterviews] = useState<InterviewData[]>(initialInterviews);

  const columns: ColumnsType<InterviewData> = [
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 120,
    },
    {
      title: '应聘岗位',
      dataIndex: 'position',
      key: 'position',
      width: 150,
    },
    {
      title: '面试类型',
      dataIndex: 'interviewType',
      key: 'interviewType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'online' ? 'blue' : 'green'}>
          {type === 'online' ? '线上面试' : '线下面试'}
        </Tag>
      ),
    },
    {
      title: '面试时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 150,
    },
    {
      title: '面试地点',
      dataIndex: 'location',
      key: 'location',
      width: 150,
    },
    {
      title: '面试官',
      dataIndex: 'interviewers',
      key: 'interviewers',
      width: 150,
      render: (interviewers: string[]) => interviewers.join('、'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          scheduled: { color: 'blue', text: '待面试' },
          completed: { color: 'green', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
        };
        const { color, text } = statusMap[status as keyof typeof statusMap];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {record.status === 'scheduled' && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleComplete(record)}
              >
                完成
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleCancel(record)}
              >
                取消
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (interview: InterviewData) => {
    setSelectedInterview(interview);
    setIsModalVisible(true);
  };

  const handleEdit = (interview: InterviewData) => {
    setSelectedInterview(interview);
    form.setFieldsValue({
      ...interview,
      scheduledTime: dayjs(interview.scheduledTime),
    });
    setIsModalVisible(true);
  };

  const handleComplete = (interview: InterviewData) => {
    Modal.confirm({
      title: '完成面试',
      content: '确定要将该面试标记为已完成吗？',
      onOk: () => {
        setInterviews(
          interviews.map((i) =>
            i.id === interview.id ? { ...i, status: 'completed' } : i
          )
        );
        message.success('面试已完成');
      },
    });
  };

  const handleCancel = (interview: InterviewData) => {
    Modal.confirm({
      title: '取消面试',
      content: '确定要取消该面试吗？',
      onOk: () => {
        setInterviews(
          interviews.map((i) =>
            i.id === interview.id ? { ...i, status: 'cancelled' } : i
          )
        );
        message.success('面试已取消');
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (selectedInterview) {
        // 编辑现有面试
        setInterviews(
          interviews.map((interview) =>
            interview.id === selectedInterview.id
              ? {
                  ...interview,
                  ...values,
                  scheduledTime: values.scheduledTime.format('YYYY-MM-DD HH:mm'),
                }
              : interview
          )
        );
        message.success('面试信息更新成功');
      }

      setIsModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card
        title="面试管理"
        className="rounded-2xl shadow"
      >
        <Table
          columns={columns}
          dataSource={interviews}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={selectedInterview ? '面试详情' : '安排面试'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        confirmLoading={loading}
      >
        {selectedInterview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500">候选人</div>
                <div className="text-lg">{selectedInterview.candidateName}</div>
              </div>
              <div>
                <div className="text-gray-500">应聘岗位</div>
                <div className="text-lg">{selectedInterview.position}</div>
              </div>
              <div>
                <div className="text-gray-500">面试类型</div>
                <div className="text-lg">
                  <Tag color={selectedInterview.interviewType === 'online' ? 'blue' : 'green'}>
                    {selectedInterview.interviewType === 'online' ? '线上面试' : '线下面试'}
                  </Tag>
                </div>
              </div>
              <div>
                <div className="text-gray-500">面试时间</div>
                <div className="text-lg">{selectedInterview.scheduledTime}</div>
              </div>
              <div>
                <div className="text-gray-500">面试地点</div>
                <div className="text-lg">{selectedInterview.location}</div>
              </div>
              <div>
                <div className="text-gray-500">面试官</div>
                <div className="text-lg">{selectedInterview.interviewers.join('、')}</div>
              </div>
              <div>
                <div className="text-gray-500">状态</div>
                <div className="text-lg">
                  <Tag
                    color={
                      selectedInterview.status === 'scheduled'
                        ? 'blue'
                        : selectedInterview.status === 'completed'
                        ? 'green'
                        : 'red'
                    }
                  >
                    {selectedInterview.status === 'scheduled'
                      ? '待面试'
                      : selectedInterview.status === 'completed'
                      ? '已完成'
                      : '已取消'}
                  </Tag>
                </div>
              </div>
            </div>
            {selectedInterview.feedback && (
              <div>
                <div className="text-gray-500">面试反馈</div>
                <div className="text-lg">{selectedInterview.feedback}</div>
              </div>
            )}
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            className="mt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="candidateName"
                label="候选人"
                rules={[{ required: true, message: '请输入候选人姓名' }]}
              >
                <Input placeholder="请输入候选人姓名" />
              </Form.Item>
              <Form.Item
                name="position"
                label="应聘岗位"
                rules={[{ required: true, message: '请输入应聘岗位' }]}
              >
                <Input placeholder="请输入应聘岗位" />
              </Form.Item>
              <Form.Item
                name="interviewType"
                label="面试类型"
                rules={[{ required: true, message: '请选择面试类型' }]}
              >
                <Select placeholder="请选择面试类型">
                  <Select.Option value="online">线上面试</Select.Option>
                  <Select.Option value="offline">线下面试</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="scheduledTime"
                label="面试时间"
                rules={[{ required: true, message: '请选择面试时间' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="请选择面试时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                name="location"
                label="面试地点"
                rules={[{ required: true, message: '请输入面试地点' }]}
              >
                <Input placeholder="请输入面试地点" />
              </Form.Item>
              <Form.Item
                name="interviewers"
                label="面试官"
                rules={[{ required: true, message: '请选择面试官' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择面试官"
                  style={{ width: '100%' }}
                >
                  <Select.Option value="李经理">李经理</Select.Option>
                  <Select.Option value="王工程师">王工程师</Select.Option>
                  <Select.Option value="张总监">张总监</Select.Option>
                  <Select.Option value="刘经理">刘经理</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default CompanyInterviews; 