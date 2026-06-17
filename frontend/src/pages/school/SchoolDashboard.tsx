import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, DatePicker, Typography, Tabs } from 'antd';
import { UserOutlined, TeamOutlined, BankOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Line } from '@ant-design/charts';

const { Title } = Typography;

interface JobData {
  id: string;
  companyName: string;
  position: string;
  dailyInterviews: number;
  totalInterviews: number;
}

interface CompanyData {
  id: string;
  companyName: string;
  dailyInterviews: number;
  totalInterviews: number;
  positions: {
    position: string;
    dailyInterviews: number;
    totalInterviews: number;
  }[];
}

// mock 数据生成函数
const generateMockLineData = (type: 'company' | 'job' | 'allJob', period: 'day' | 'week' | 'month' | 'year') => {
  const companies = ['示例公司A', '示例公司B', '示例公司C'];
  const jobs = ['前端开发工程师', '后端开发工程师', '人工智能工程师', '产品经理', 'UI设计师'];
  let data: any[] = [];
  let timeLabels: string[] = [];
  if (period === 'day') {
    timeLabels = Array.from({ length: 7 }, (_, i) => `6-${i + 1}`);
  } else if (period === 'week') {
    timeLabels = ['第1周', '第2周', '第3周', '第4周'];
  } else if (period === 'month') {
    timeLabels = ['1月', '2月', '3月', '4月', '5月', '6月'];
  } else {
    timeLabels = ['2021', '2022', '2023', '2024'];
  }
  if (type === 'company') {
    companies.forEach(company => {
      timeLabels.forEach(time => {
        data.push({ 时间: time, 公司: company, 面试人数: Math.floor(Math.random() * 20 + 5) });
      });
    });
  } else if (type === 'job') {
    jobs.forEach(job => {
      timeLabels.forEach(time => {
        data.push({ 时间: time, 岗位: job, 面试人数: Math.floor(Math.random() * 15 + 2) });
      });
    });
  } else {
    jobs.forEach(job => {
      timeLabels.forEach(time => {
        data.push({ 时间: time, 岗位: job, 面试人数: Math.floor(Math.random() * 30 + 10) });
      });
    });
  }
  return data;
};

const SchoolDashboard: React.FC = () => {
  const [jobData, setJobData] = useState<JobData[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [mainTab, setMainTab] = useState('company');
  const [subTab, setSubTab] = useState('day');
  const [selectedCompany, setSelectedCompany] = useState('全部公司');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 模拟岗位数据
      const mockJobData = [
        {
          id: '1',
          companyName: '示例公司A',
          position: '前端开发工程师',
          dailyInterviews: 5,
          totalInterviews: 20,
        },
        {
          id: '2',
          companyName: '示例公司A',
          position: '后端开发工程师',
          dailyInterviews: 3,
          totalInterviews: 15,
        },
        {
          id: '3',
          companyName: '示例公司B',
          position: '人工智能工程师',
          dailyInterviews: 4,
          totalInterviews: 18,
        },
        {
          id: '4',
          companyName: '示例公司B',
          position: '产品经理',
          dailyInterviews: 2,
          totalInterviews: 10,
        },
        {
          id: '5',
          companyName: '示例公司C',
          position: 'UI设计师',
          dailyInterviews: 3,
          totalInterviews: 12,
        },
      ];

      // 处理公司数据
      const companyMap = new Map<string, CompanyData>();
      mockJobData.forEach(job => {
        if (!companyMap.has(job.companyName)) {
          companyMap.set(job.companyName, {
            id: job.companyName,
            companyName: job.companyName,
            dailyInterviews: 0,
            totalInterviews: 0,
            positions: [],
          });
        }
        const company = companyMap.get(job.companyName)!;
        company.dailyInterviews += job.dailyInterviews;
        company.totalInterviews += job.totalInterviews;
        company.positions.push({
          position: job.position,
          dailyInterviews: job.dailyInterviews,
          totalInterviews: job.totalInterviews,
        });
      });

      setJobData(mockJobData);
      setCompanyData(Array.from(companyMap.values()));
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const jobColumns = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: '岗位名称',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '今日面试人数',
      dataIndex: 'dailyInterviews',
      key: 'dailyInterviews',
    },
    {
      title: '总面试人数',
      dataIndex: 'totalInterviews',
      key: 'totalInterviews',
    },
  ];

  const companyColumns = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: '今日面试人数',
      dataIndex: 'dailyInterviews',
      key: 'dailyInterviews',
    },
    {
      title: '总面试人数',
      dataIndex: 'totalInterviews',
      key: 'totalInterviews',
    },
    {
      title: '岗位详情',
      key: 'positions',
      render: (record: CompanyData) => (
        <ul className="list-disc pl-4">
          {record.positions.map((pos, index) => (
            <li key={index}>
              {pos.position}: {pos.dailyInterviews}人/今日, {pos.totalInterviews}人/总计
            </li>
          ))}
        </ul>
      ),
    },
  ];

  const totalDailyInterviews = jobData.reduce((sum, job) => sum + job.dailyInterviews, 0);
  const totalInterviews = jobData.reduce((sum, job) => sum + job.totalInterviews, 0);
  const uniqueCompanies = new Set(jobData.map(job => job.companyName)).size;

  const companyLineData = generateMockLineData('company', subTab as any);
  const jobLineData = generateMockLineData('job', subTab as any);
  const allJobLineData = generateMockLineData('allJob', subTab as any);

  const companyOptions = [
    { label: '全部公司', value: '全部公司' },
    { label: '示例公司A', value: '示例公司A' },
    { label: '示例公司B', value: '示例公司B' },
    { label: '示例公司C', value: '示例公司C' },
  ];

  return (
    <div className="p-6 min-h-screen bg-transparent">
      <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-lg shadow-md">
        <Title level={2} className="m-0 text-blue-500">学校管理平台</Title>
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          defaultValue={dayjs()}
        />
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="今日总面试人数"
              value={totalDailyInterviews}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="参与企业数量"
              value={uniqueCompanies}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="累计面试人数"
              value={totalInterviews}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="bg-white rounded-lg shadow-md">
        <Tabs
          defaultActiveKey="company"
          items={[
            {
              key: 'company',
              label: '企业面试统计',
              children: (
                <Table
                  columns={companyColumns}
                  dataSource={companyData}
                  loading={loading}
                  rowKey="id"
                  pagination={false}
                />
              ),
            },
            {
              key: 'job',
              label: '岗位面试统计',
              children: (
                <Table
                  columns={jobColumns}
                  dataSource={jobData}
                  loading={loading}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Card className="mb-6">
        <Tabs
          activeKey={mainTab}
          onChange={setMainTab}
          items={[{
            key: 'company',
            label: '公司面试人数统计',
            children: (
              <>
                <Tabs
                  activeKey={subTab}
                  onChange={setSubTab}
                  items={[
                    { key: 'day', label: '每日' },
                    { key: 'week', label: '每周' },
                    { key: 'month', label: '每月' },
                    { key: 'year', label: '每年' },
                  ]}
                />
                <Line
                  data={companyLineData}
                  xField="时间"
                  yField="面试人数"
                  seriesField="公司"
                  smooth
                  height={320}
                  xAxis={{
                    title: { text: '时间' },
                  }}
                  yAxis={{
                    title: { text: '面试人数' },
                  }}
                  legend={{ position: 'top' }}
                  label={{
                    position: 'top',
                    layout: [
                      { type: 'interval-adjust-position' },
                      { type: 'interval-hide-overlap' },
                      { type: 'adjust-color' }
                    ],
                    content: (originData: any) => originData['公司']
                  }}
                />
              </>
            ),
          }, {
            key: 'job',
            label: '岗位面试人数统计',
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ marginRight: 8 }}>选择公司：</span>
                  <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
                    {companyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <Tabs
                  activeKey={subTab}
                  onChange={setSubTab}
                  items={[
                    { key: 'day', label: '每日' },
                    { key: 'week', label: '每周' },
                    { key: 'month', label: '每月' },
                    { key: 'year', label: '每年' },
                  ]}
                />
                <Line
                  data={selectedCompany === '全部公司' ? jobLineData : jobLineData.filter(d => d.公司 === selectedCompany)}
                  xField="时间"
                  yField="面试人数"
                  seriesField="岗位"
                  smooth
                  height={320}
                  xAxis={{ title: { text: '时间' } }}
                  yAxis={{ title: { text: '面试人数' } }}
                  legend={{ position: 'top' }}
                />
              </>
            ),
          }, {
            key: 'allJob',
            label: '所有公司岗位总面试人数统计',
            children: (
              <>
                <Tabs
                  activeKey={subTab}
                  onChange={setSubTab}
                  items={[
                    { key: 'day', label: '每日' },
                    { key: 'week', label: '每周' },
                    { key: 'month', label: '每月' },
                    { key: 'year', label: '每年' },
                  ]}
                />
                <Line
                  data={allJobLineData}
                  xField="时间"
                  yField="面试人数"
                  seriesField="岗位"
                  smooth
                  height={320}
                  xAxis={{ title: { text: '时间' } }}
                  yAxis={{ title: { text: '面试人数' } }}
                  legend={{ position: 'top' }}
                />
              </>
            ),
          }]}
        />
      </Card>
    </div>
  );
};

export default SchoolDashboard; 