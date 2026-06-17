import { useState } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, message, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Option } = Select;

interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string;
  status: 'active' | 'closed';
  createdAt: string;
}

// ResumeData类型和模拟数据
interface ResumeData {
  id: string;
  name: string;
  position: string;
  education: string;
  experience: string;
  status: 'pending' | 'reviewed' | 'rejected';
  appliedAt: string;
  resumeUrl: string;
}
const initialResumes: ResumeData[] = [
  {
    id: '1',
    name: '张三',
    position: '前端开发工程师',
    education: '本科',
    experience: '3年',
    status: 'pending',
    appliedAt: '2024-03-15',
    resumeUrl: '/resumes/1.pdf',
  },
  {
    id: '2',
    name: '李四',
    position: '产品经理',
    education: '硕士',
    experience: '5年',
    status: 'reviewed',
    appliedAt: '2024-03-14',
    resumeUrl: '/resumes/2.pdf',
  },
];

const CompanyDashboard = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([
    {
      id: '1',
      title: '前端开发工程师',
      company: '示例科技有限公司',
      location: '北京',
      type: '全职',
      salary: '15k-25k',
      description: '负责公司核心产品的前端开发工作',
      requirements: '1. 3年以上前端开发经验\n2. 精通React/Vue等前端框架\n3. 良好的团队协作能力',
      status: 'active',
      createdAt: '2024-02-20',
    },
  ]);
  const [resumes, setResumes] = useState<ResumeData[]>(initialResumes);
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);

  const columns: ColumnsType<JobPost> = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '工作地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '工作类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '薪资范围',
      dataIndex: 'salary',
      key: 'salary',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '招聘中' : '已关闭'}
        </Tag>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const resumeColumns: ColumnsType<ResumeData> = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    { title: '应聘岗位', dataIndex: 'position', key: 'position', width: 150 },
    { title: '学历', dataIndex: 'education', key: 'education', width: 100 },
    { title: '工作经验', dataIndex: 'experience', key: 'experience', width: 100 },
    { title: '投递时间', dataIndex: 'appliedAt', key: 'appliedAt', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => {
      const statusMap = { pending: { color: 'blue', text: '待处理' }, reviewed: { color: 'green', text: '已通过' }, rejected: { color: 'red', text: '已拒绝' }, };
      const { color, text } = statusMap[status as keyof typeof statusMap];
      return <Tag color={color}>{text}</Tag>;
    } },
    { title: '操作', key: 'action', width: 250, render: (_, record) => (
      <Space size="middle">
        <Button type="link" icon={<EyeOutlined />} onClick={() => { setSelectedResume(record); setResumeModalOpen(true); }}>查看</Button>
        <Button type="link" icon={<DownloadOutlined />} onClick={() => message.success('开始下载简历')}>下载</Button>
        {record.status === 'pending' && <>
          <Button type="link" icon={<CheckOutlined />} onClick={() => handleResumeReview(record, 'reviewed')}>通过</Button>
          <Button type="link" danger icon={<CloseOutlined />} onClick={() => handleResumeReview(record, 'rejected')}>拒绝</Button>
        </>}
      </Space>
    ) },
  ];

  function handleResumeReview(resume: ResumeData, status: 'reviewed' | 'rejected') {
    setResumes(resumes.map(r => r.id === resume.id ? { ...r, status } : r));
    message.success(status === 'reviewed' ? '已通过简历' : '已拒绝简历');
  }

  const handleAdd = () => {
    setEditingJob(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (job: JobPost) => {
    setEditingJob(job);
    form.setFieldsValue(job);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个岗位吗？',
      onOk: () => {
        setJobs(jobs.filter(job => job.id !== id));
        message.success('删除成功');
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingJob) {
        // 编辑现有岗位
        setJobs(jobs.map(job => 
          job.id === editingJob.id ? { ...job, ...values } : job
        ));
        message.success('更新成功');
      } else {
        // 添加新岗位
        const newJob: JobPost = {
          id: Date.now().toString(),
          ...values,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        };
        setJobs([...jobs, newJob]);
        message.success('发布成功');
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Card
          title="岗位管理"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              发布新岗位
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={jobs}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
        <Modal
          title={editingJob ? '编辑岗位' : '发布新岗位'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{ type: '全职' }}
          >
            <Form.Item
              name="title"
              label="岗位名称"
              rules={[{ required: true, message: '请输入岗位名称' }]}
            >
              <Input placeholder="请输入岗位名称" />
            </Form.Item>
            <Form.Item
              name="location"
              label="工作地点"
              rules={[{ required: true, message: '请输入工作地点' }]}
            >
              <Input placeholder="请输入工作地点" />
            </Form.Item>
            <Form.Item
              name="type"
              label="工作类型"
              rules={[{ required: true, message: '请选择工作类型' }]}
            >
              <Select>
                <Option value="全职">全职</Option>
                <Option value="兼职">兼职</Option>
                <Option value="实习">实习</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="salary"
              label="薪资范围"
              rules={[{ required: true, message: '请输入薪资范围' }]}
            >
              <Input placeholder="例如：15k-25k" />
            </Form.Item>
            <Form.Item
              name="description"
              label="岗位描述"
              rules={[{ required: true, message: '请输入岗位描述' }]}
            >
              <TextArea rows={4} placeholder="请输入岗位描述" />
            </Form.Item>
            <Form.Item
              name="requirements"
              label="任职要求"
              rules={[{ required: true, message: '请输入任职要求' }]}
            >
              <TextArea rows={4} placeholder="请输入任职要求" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      <div className="bg-white rounded-2xl shadow mt-6 p-4" style={{height: 320, overflow: 'auto'}}>
        <div className="font-bold text-lg mb-2">简历接收</div>
        <Table
          columns={resumeColumns}
          dataSource={resumes}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ y: 220 }}
        />
      </div>
      <Modal
        title="简历详情"
        open={resumeModalOpen}
        onCancel={() => setResumeModalOpen(false)}
        width={800}
        footer={null}
      >
        {selectedResume && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500">姓名</div>
                <div className="text-lg">{selectedResume.name}</div>
              </div>
              <div>
                <div className="text-gray-500">应聘岗位</div>
                <div className="text-lg">{selectedResume.position}</div>
              </div>
              <div>
                <div className="text-gray-500">学历</div>
                <div className="text-lg">{selectedResume.education}</div>
              </div>
              <div>
                <div className="text-gray-500">工作经验</div>
                <div className="text-lg">{selectedResume.experience}</div>
              </div>
              <div>
                <div className="text-gray-500">投递时间</div>
                <div className="text-lg">{selectedResume.appliedAt}</div>
              </div>
              <div>
                <div className="text-gray-500">状态</div>
                <div className="text-lg">
                  <Tag color={selectedResume.status === 'pending' ? 'blue' : selectedResume.status === 'reviewed' ? 'green' : 'red'}>
                    {selectedResume.status === 'pending' ? '待处理' : selectedResume.status === 'reviewed' ? '已通过' : '已拒绝'}
                  </Tag>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => message.success('开始下载简历')}>
                下载简历
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompanyDashboard; 