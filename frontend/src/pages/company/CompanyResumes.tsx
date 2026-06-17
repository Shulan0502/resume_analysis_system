import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Input, Select, Modal, message, Descriptions } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Avatar } from 'antd';
import { getReceivedApplications, processApplication, getApplicationStats } from '@/services/api.ts';

const { Search } = Input;
const { Option } = Select;

interface ApplicationData {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  userId: number;
  userName: string;
  userEmail: string;
  resumeContent: string;
  coverLetter: string;
  status: string;
  statusDisplayName: string;
  appliedAt: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  jobLocation: string;
  jobType: string;
  salaryRange: string;
  department: string;
}

interface ApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  todayApplications: number;
  thisWeekApplications: number;
  thisMonthApplications: number;
}

const CompanyResumes = () => {
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 获取简历申请列表
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await getReceivedApplications(currentPage, pageSize, statusFilter);
      if (response.success && response.data) {
        setApplications(response.data.applications || []);
        setTotalCount(response.data.totalCount || 0);
      }
    } catch (error) {
      message.error('获取简历申请失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取申请统计
  const fetchStats = async () => {
    try {
      const response = await getApplicationStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [currentPage, statusFilter]);

  // 处理申请（接受/拒绝）
  const handleProcessApplication = async (applicationId: number, status: string, notes?: string) => {
    try {
      const response = await processApplication(applicationId, { status, notes });
      if (response.success) {
        message.success(response.message);
        fetchApplications(); // 刷新列表
        fetchStats(); // 刷新统计
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('处理申请失败');
    }
  };

  const columns: ColumnsType<ApplicationData> = [
    {
      title: '姓名',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
      render: (name: string) => (
        <div className="flex items-center">
          <Avatar size="small" icon={<UserOutlined />} className="mr-2" />
          {name || '未知'}
        </div>
      ),
    },
    {
      title: '应聘岗位',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      width: 180,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '薪资范围',
      dataIndex: 'salaryRange',
      key: 'salaryRange',
      width: 120,
    },
    {
      title: '投递时间',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '状态',
      dataIndex: 'statusDisplayName',
      key: 'status',
      width: 100,
      render: (statusDisplayName: string, record: ApplicationData) => {
        const statusMap: Record<string, { color: string }> = {
          pending: { color: 'blue' },
          reviewing: { color: 'orange' },
          accepted: { color: 'green' },
          rejected: { color: 'red' },
        };
        const config = statusMap[record.status] || { color: 'default' };
        return <Tag color={config.color}>{statusDisplayName}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record: ApplicationData) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          {(record.status === 'pending' || record.status === 'reviewing') && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleProcessApplication(record.id, 'accepted', '申请通过')}
                style={{ color: '#52c41a' }}
              >
                接受
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleProcessApplication(record.id, 'rejected', '申请不符合要求')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 查看申请详情
  const handleViewDetail = (application: ApplicationData) => {
    setSelectedApplication(application);
    setDetailModalVisible(true);
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
    // 这里可以实现基于关键词的搜索
    fetchApplications();
  };

  // 状态筛选处理
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchApplications();
    fetchStats();
  };

  return (
    <div className="p-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalApplications}</div>
            <div className="text-gray-500">总申请数</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</div>
            <div className="text-gray-500">待处理</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.acceptedApplications}</div>
            <div className="text-gray-500">已接受</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejectedApplications}</div>
            <div className="text-gray-500">已拒绝</div>
          </Card>
        </div>
      )}

      <Card
        title="简历接收"
        className="rounded-2xl shadow"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <div className="mb-4 flex gap-4">
          <Search
            placeholder="搜索姓名或岗位"
            allowClear
            enterButton="搜索"
            onSearch={handleSearch}
            style={{ width: 300 }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 120 }}
            allowClear
            value={statusFilter}
            onChange={handleStatusFilter}
          >
            <Option value="">全部</Option>
            <Option value="pending">待处理</Option>
            <Option value="reviewing">审核中</Option>
            <Option value="accepted">已接受</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handlePageChange,
          }}
        />
      </Card>

      {/* 申请详情模态框 */}
      <Modal
        title="申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={
          selectedApplication && (selectedApplication.status === 'pending' || selectedApplication.status === 'reviewing') ? (
            <Space>
              <Button onClick={() => setDetailModalVisible(false)}>
                关闭
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  handleProcessApplication(selectedApplication.id, 'accepted', '申请通过');
                  setDetailModalVisible(false);
                }}
              >
                接受
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  handleProcessApplication(selectedApplication.id, 'rejected', '申请不符合要求');
                  setDetailModalVisible(false);
                }}
              >
                拒绝
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>
          )
        }
      >
        {selectedApplication && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="申请人姓名">
              {selectedApplication.userName || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              {selectedApplication.userEmail}
            </Descriptions.Item>
            <Descriptions.Item label="应聘岗位">
              {selectedApplication.jobTitle}
            </Descriptions.Item>
            <Descriptions.Item label="部门">
              {selectedApplication.department}
            </Descriptions.Item>
            <Descriptions.Item label="薪资范围">
              {selectedApplication.salaryRange}
            </Descriptions.Item>
            <Descriptions.Item label="工作地点">
              {selectedApplication.jobLocation}
            </Descriptions.Item>
            <Descriptions.Item label="工作类型">
              {selectedApplication.jobType}
            </Descriptions.Item>
            <Descriptions.Item label="申请状态">
              <Tag color={
                selectedApplication.status === 'pending' ? 'blue' :
                selectedApplication.status === 'reviewing' ? 'orange' :
                selectedApplication.status === 'accepted' ? 'green' : 'red'
              }>
                {selectedApplication.statusDisplayName}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="投递时间" span={2}>
              {new Date(selectedApplication.appliedAt).toLocaleString()}
            </Descriptions.Item>
            {selectedApplication.reviewedAt && (
              <Descriptions.Item label="处理时间" span={2}>
                {new Date(selectedApplication.reviewedAt).toLocaleString()}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="简历内容" span={2}>
              <div className="max-h-40 overflow-y-auto p-2 bg-gray-50 rounded">
                {selectedApplication.resumeContent}
              </div>
            </Descriptions.Item>
            {selectedApplication.coverLetter && (
              <Descriptions.Item label="求职信" span={2}>
                <div className="max-h-40 overflow-y-auto p-2 bg-gray-50 rounded">
                  {selectedApplication.coverLetter}
                </div>
              </Descriptions.Item>
            )}
            {selectedApplication.notes && (
              <Descriptions.Item label="处理备注" span={2}>
                {selectedApplication.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CompanyResumes; 