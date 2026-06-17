import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, message, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { createJob, updateJob, deleteJob, getCompanyJobs, getCompanyJobStats } from '@/services/api.ts';
import { useAuthStore } from '@/stores/auth.ts';

const { TextArea } = Input;

interface JobData {
  id: number;
  title: string;
  companyName: string;
  department: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryRange: string;
  experienceRequired: string;
  educationRequired: string;
  description: string;
  requirements: string;
  benefits: string;
  skills: string[];
  tags: string[];
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  status: string;
  priorityLevel: number;
  viewCount: number;
  applicationCount: number;
  deadline: string;
  isUrgent: boolean;
  isRemoteWork: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  pausedJobs: number;
  closedJobs: number;
  totalViews: number;
  totalApplications: number;
}

const CompanyJobs = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 从用户登录信息获取公司ID
  const { userInfo } = useAuthStore();
  const companyId = userInfo?.id || 3; // 使用当前登录用户ID，默认为3
  const companyName = userInfo?.realName || "创新科技有限公司"; // 使用当前登录用户名称

  // 获取公司岗位列表
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await getCompanyJobs(companyId, currentPage, pageSize);
      if (response.success && response.data) {
        setJobs(response.data.jobs || []);
        setTotalCount(response.data.totalCount || 0);
      }
    } catch (error) {
      message.error('获取岗位列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await getCompanyJobStats(companyId);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [currentPage]);

  const columns: ColumnsType<JobData> = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '工作类型',
      dataIndex: 'jobType',
      key: 'jobType',
      width: 100,
    },
    {
      title: '工作地点',
      dataIndex: 'location',
      key: 'location',
      width: 100,
    },
    {
      title: '工作经验',
      dataIndex: 'experienceRequired',
      key: 'experienceRequired',
      width: 100,
    },
    {
      title: '学历要求',
      dataIndex: 'educationRequired',
      key: 'educationRequired',
      width: 120,
    },
    {
      title: '薪资范围',
      dataIndex: 'salaryRange',
      key: 'salaryRange',
      width: 120,
      render: (text: string) => (
        <span className="text-green-600 font-medium">{text}</span>
      ),
    },
    {
      title: '浏览/申请',
      key: 'stats',
      width: 100,
      render: (_, record: JobData) => (
        <div className="text-center">
          <div className="text-blue-600">{record.viewCount}</div>
          <div className="text-green-600">{record.applicationCount}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingJob(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (job: JobData) => {
    setEditingJob(job);
    form.setFieldsValue(job);
    setIsModalVisible(true);
  };

  const handleDelete = async (job: JobData) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除岗位"${job.title}"吗？`,
      onOk: async () => {
        try {
          const response = await deleteJob(job.id, companyId);
          if (response.success) {
            message.success('删除成功');
            fetchJobs(); // 重新获取列表
            fetchStats(); // 更新统计
          } else {
            message.error(response.message || '删除失败');
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 处理技能和标签字符串
      const skillsStr = Array.isArray(values.skills) ? values.skills.join(',') : values.skills || '';
      const tagsStr = Array.isArray(values.tags) ? values.tags.join(',') : values.tags || '';

      const jobData = {
        ...values,
        companyId,
        companyName,
        skills: skillsStr,
        tags: tagsStr,
        deadline: values.deadline ? values.deadline.toISOString() : null,
      };

      if (editingJob) {
        // 编辑现有岗位
        const response = await updateJob(editingJob.id, jobData);
        if (response.success) {
          message.success('岗位更新成功');
          fetchJobs(); // 重新获取列表
          fetchStats(); // 更新统计
        } else {
          message.error(response.message || '更新失败');
        }
      } else {
        // 添加新岗位
        const response = await createJob(jobData);
        if (response.success) {
          message.success('岗位发布成功');
          fetchJobs(); // 重新获取列表
          fetchStats(); // 更新统计
        } else {
          message.error(response.message || '发布失败');
        }
      }

      setIsModalVisible(false);
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="总岗位数"
                value={stats.totalJobs}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="招聘中"
                value={stats.activeJobs}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总浏览量"
                value={stats.totalViews || 0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总申请数"
                value={stats.totalApplications || 0}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card
        title="岗位管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            发布岗位
          </Button>
        }
        className="rounded-2xl shadow"
      >
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: false,
            showQuickJumper: true,
            onChange: (page) => setCurrentPage(page),
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingJob ? '编辑岗位' : '发布岗位'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="title"
              label="岗位名称"
              rules={[{ required: true, message: '请输入岗位名称' }]}
            >
              <Input placeholder="请输入岗位名称" />
            </Form.Item>
            <Form.Item
              name="department"
              label="所属部门"
              rules={[{ required: true, message: '请选择所属部门' }]}
            >
              <Select placeholder="请选择所属部门">
                <Select.Option value="技术部">技术部</Select.Option>
                <Select.Option value="产品部">产品部</Select.Option>
                <Select.Option value="市场部">市场部</Select.Option>
                <Select.Option value="销售部">销售部</Select.Option>
                <Select.Option value="人事部">人事部</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="jobType"
              label="工作类型"
              rules={[{ required: true, message: '请选择工作类型' }]}
            >
              <Select placeholder="请选择工作类型">
                <Select.Option value="全职">全职</Select.Option>
                <Select.Option value="兼职">兼职</Select.Option>
                <Select.Option value="实习">实习</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="location"
              label="工作地点"
              rules={[{ required: true, message: '请输入工作地点' }]}
            >
              <Input placeholder="请输入工作地点" />
            </Form.Item>
            <Form.Item
              name="salaryMin"
              label="最低薪资(k)"
              rules={[{ required: true, message: '请输入最低薪资' }]}
            >
              <Input type="number" placeholder="例如：15" />
            </Form.Item>
            <Form.Item
              name="salaryMax"
              label="最高薪资(k)"
              rules={[{ required: true, message: '请输入最高薪资' }]}
            >
              <Input type="number" placeholder="例如：25" />
            </Form.Item>
            <Form.Item
              name="experienceRequired"
              label="工作经验"
              rules={[{ required: true, message: '请选择工作经验' }]}
            >
              <Select placeholder="请选择工作经验">
                <Select.Option value="应届生">应届生</Select.Option>
                <Select.Option value="1-3年">1-3年</Select.Option>
                <Select.Option value="3-5年">3-5年</Select.Option>
                <Select.Option value="5-8年">5-8年</Select.Option>
                <Select.Option value="8年以上">8年以上</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="educationRequired"
              label="学历要求"
              rules={[{ required: true, message: '请选择学历要求' }]}
            >
              <Select placeholder="请选择学历要求">
                <Select.Option value="大专及以上">大专及以上</Select.Option>
                <Select.Option value="本科及以上">本科及以上</Select.Option>
                <Select.Option value="硕士及以上">硕士及以上</Select.Option>
                <Select.Option value="博士及以上">博士及以上</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="requirements"
            label="任职要求"
            rules={[{ required: true, message: '请输入任职要求' }]}
          >
            <TextArea rows={4} placeholder="请输入任职要求" />
          </Form.Item>
          <Form.Item
            name="description"
            label="岗位描述"
            rules={[{ required: true, message: '请输入岗位描述' }]}
          >
            <TextArea rows={4} placeholder="请输入岗位描述" />
          </Form.Item>
          <Form.Item
            name="benefits"
            label="福利待遇"
          >
            <TextArea rows={3} placeholder="请输入福利待遇" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="skills"
              label="技能要求"
            >
              <Input placeholder="请输入技能要求，用逗号分隔" />
            </Form.Item>
            <Form.Item
              name="contactPerson"
              label="联系人"
            >
              <Input placeholder="请输入联系人姓名" />
            </Form.Item>
            <Form.Item
              name="contactPhone"
              label="联系电话"
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
            <Form.Item
              name="contactEmail"
              label="联系邮箱"
            >
              <Input placeholder="请输入联系邮箱" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CompanyJobs; 