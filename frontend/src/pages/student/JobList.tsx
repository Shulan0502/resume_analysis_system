import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, message, Tag, Space, Input, Select, Drawer, Tooltip, Badge } from 'antd';
import { 
  SearchOutlined, 
  VideoCameraOutlined, 
  EnvironmentOutlined, 
  DollarOutlined,
  StarOutlined,
  StarFilled,
  ClockCircleOutlined,
  TeamOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '../../stores/userProfile.ts';

interface Job {
  id: string;
  company: string;
  position: string;
  department: string; // 新增
  location: string;
  salary: string;
  requirements: string[];
  description: string;
  type: string;
  experience: string;
  education: string;
  tags: string[];
  publishTime: string;
  applicants: number;
}

const mockJobs: Job[] = [
  {
    id: '1',
    company: '腾讯科技',
    position: '前端开发工程师',
    department: '技术部',
    location: '深圳',
    salary: '15k-25k',
    type: '全职',
    experience: '3-5年',
    education: '本科及以上',
    requirements: ['3年以上前端开发经验', '精通React/Vue', '良好的团队协作能力'],
    description: '负责公司核心产品的前端开发工作，参与产品需求分析和技术方案设计。',
    tags: ['React', 'Vue', 'TypeScript', '前端开发'],
    publishTime: '2024-03-15',
    applicants: 128
  },
  {
    id: '2',
    company: '阿里巴巴',
    position: '后端开发工程师',
    department: '技术部',
    location: '杭州',
    salary: '20k-35k',
    type: '全职',
    experience: '5-8年',
    education: '本科及以上',
    requirements: ['5年以上Java开发经验', '熟悉分布式系统', '有大型项目经验'],
    description: '负责电商平台核心系统的设计和开发，解决高并发、高可用等技术难题。',
    tags: ['Java', 'Spring Boot', '分布式系统', '高并发'],
    publishTime: '2024-03-14',
    applicants: 256
  },
  {
    id: '3',
    company: '字节跳动',
    position: '算法工程师',
    department: '技术部',
    location: '北京',
    salary: '25k-40k',
    type: '全职',
    experience: '3-5年',
    education: '硕士及以上',
    requirements: ['硕士及以上学历', '精通机器学习算法', '有推荐系统经验优先'],
    description: '负责推荐系统的算法研发，优化用户体验和业务指标。',
    tags: ['机器学习', '推荐系统', 'Python', '算法'],
    publishTime: '2024-03-13',
    applicants: 189
  },
  {
    id: '4',
    company: '华为',
    position: '前端实习生',
    department: '技术部',
    location: '广东',
    salary: '4k-8k',
    type: '实习',
    experience: '应届生',
    education: '本科及以上',
    requirements: ['熟悉HTML/CSS/JavaScript', '有React/Vue项目经验优先', '每周实习4天及以上'],
    description: '参与公司前端项目开发，协助完成页面实现和功能优化。',
    tags: ['前端', '实习', 'React', 'Vue'],
    publishTime: '2024-03-12',
    applicants: 67
  },
  {
    id: '5',
    company: '美团',
    position: '数据分析实习生',
    department: '技术部',
    location: '北京',
    salary: '5k-9k',
    type: '实习',
    experience: '应届生',
    education: '本科及以上',
    requirements: ['熟练使用Excel、SQL', '有数据分析相关实习经验优先', '逻辑思维能力强'],
    description: '协助数据分析师进行业务数据整理、分析和报告撰写。',
    tags: ['数据分析', '实习', 'SQL', 'Excel'],
    publishTime: '2024-03-10',
    applicants: 45
  },
  {
    id: '6',
    company: '京东',
    position: 'Java开发工程师',
    department: '技术部',
    location: '北京',
    salary: '12k-18k',
    type: '全职',
    experience: '应届生',
    education: '本科及以上',
    requirements: ['熟悉Java基础', '了解Spring Boot', '有良好的编程习惯'],
    description: '负责电商平台相关模块的开发与维护，欢迎应届毕业生投递。',
    tags: ['Java', '应届生', 'Spring Boot', '全职'],
    publishTime: '2024-03-09',
    applicants: 102
  }
];

const JobList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    location: undefined,
    type: undefined,
    experience: undefined,
    education: undefined
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const { profile } = useUserProfile();
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);

  useEffect(() => {
    if (location.state?.showConfirmModal) {
      setIsModalVisible(true);
    }
  }, [location.state]);

  const handleStartInterview = (job: Job) => {
    setSelectedJob(job);
    setIsModalVisible(true);
  };

  const handleConfirmInterview = () => {
    setIsModalVisible(false);
    navigate('/formal-interview', { state: { jobId: selectedJob?.id, jobTitle: selectedJob?.position, company: selectedJob?.company } });
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setIsDetailDrawerVisible(true);
  };

  const toggleFavorite = (jobId: string) => {
    setFavorites(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = 
      job.position.toLowerCase().includes(searchText.toLowerCase()) ||
      job.company.toLowerCase().includes(searchText.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesFilters = 
      (!filters.location || job.location === filters.location) &&
      (!filters.type || job.type === filters.type) &&
      (!filters.experience || job.experience === filters.experience) &&
      (!filters.education || job.education === filters.education);

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <Input
          placeholder="搜索岗位、公司或技能标签"
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-64"
        />
        <Select
          placeholder="工作地点"
          allowClear
          style={{ width: 160 }}
          onChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
        >
          <Select.Option value="北京">北京</Select.Option>
          <Select.Option value="天津">天津</Select.Option>
          <Select.Option value="上海">上海</Select.Option>
          <Select.Option value="重庆">重庆</Select.Option>
          <Select.Option value="河北">河北</Select.Option>
          <Select.Option value="山西">山西</Select.Option>
          <Select.Option value="辽宁">辽宁</Select.Option>
          <Select.Option value="吉林">吉林</Select.Option>
          <Select.Option value="黑龙江">黑龙江</Select.Option>
          <Select.Option value="江苏">江苏</Select.Option>
          <Select.Option value="浙江">浙江</Select.Option>
          <Select.Option value="安徽">安徽</Select.Option>
          <Select.Option value="福建">福建</Select.Option>
          <Select.Option value="江西">江西</Select.Option>
          <Select.Option value="山东">山东</Select.Option>
          <Select.Option value="河南">河南</Select.Option>
          <Select.Option value="湖北">湖北</Select.Option>
          <Select.Option value="湖南">湖南</Select.Option>
          <Select.Option value="广东">广东</Select.Option>
          <Select.Option value="海南">海南</Select.Option>
          <Select.Option value="四川">四川</Select.Option>
          <Select.Option value="贵州">贵州</Select.Option>
          <Select.Option value="云南">云南</Select.Option>
          <Select.Option value="陕西">陕西</Select.Option>
          <Select.Option value="甘肃">甘肃</Select.Option>
          <Select.Option value="青海">青海</Select.Option>
          <Select.Option value="台湾">台湾</Select.Option>
          <Select.Option value="内蒙古">内蒙古</Select.Option>
          <Select.Option value="广西">广西</Select.Option>
          <Select.Option value="西藏">西藏</Select.Option>
          <Select.Option value="宁夏">宁夏</Select.Option>
          <Select.Option value="新疆">新疆</Select.Option>
          <Select.Option value="香港">香港</Select.Option>
          <Select.Option value="澳门">澳门</Select.Option>
        </Select>
        <Select
          placeholder="工作类型"
          allowClear
          style={{ width: 120 }}
          onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
        >
          <Select.Option value="全职">全职</Select.Option>
          <Select.Option value="实习">实习</Select.Option>
        </Select>
        <Select
          placeholder="工作经验"
          allowClear
          style={{ width: 120 }}
          onChange={(value) => setFilters(prev => ({ ...prev, experience: value }))}
        >
          <Select.Option value="应届生">应届生</Select.Option>
          <Select.Option value="1-3年">1-3年</Select.Option>
          <Select.Option value="3-5年">3-5年</Select.Option>
          <Select.Option value="5-8年">5-8年</Select.Option>
        </Select>
        <Select
          placeholder="学历要求"
          allowClear
          style={{ width: 120 }}
          onChange={(value) => setFilters(prev => ({ ...prev, education: value }))}
        >
          <Select.Option value="大专及以上">大专及以上</Select.Option>
          <Select.Option value="本科及以上">本科及以上</Select.Option>
          <Select.Option value="硕士及以上">硕士及以上</Select.Option>
        </Select>
        <Button
          type="default"
          icon={<StarFilled className="text-yellow-500" />}
          onClick={() => setShowFavoritesDrawer(true)}
        >
          我的收藏
          {favorites.length > 0 && <Badge count={favorites.length} offset={[6, -2]} style={{ backgroundColor: '#fadb14' }} />}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map(job => (
          <Card
            key={job.id}
            className="hover:shadow-lg transition-shadow"
            title={
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{job.position}</span>
                <Space>
                  <Tooltip title={favorites.includes(job.id) ? "取消收藏" : "收藏岗位"}>
                    <Button 
                      type="text" 
                      icon={favorites.includes(job.id) ? <StarFilled className="text-yellow-500" /> : <StarOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(job.id);
                      }}
                    />
                  </Tooltip>
                  <Tag color="blue">{job.company}｜{job.department}</Tag>
                </Space>
              </div>
            }
            extra={
              <Button type="link" onClick={() => handleViewDetails(job)}>
                详情
              </Button>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <EnvironmentOutlined className="mr-2" />
                {job.location}
              </div>
              <div className="flex items-center text-gray-600">
                <DollarOutlined className="mr-2" />
                {job.salary}
              </div>
              <div className="flex items-center text-gray-600">
                <ClockCircleOutlined className="mr-2" />
                {job.publishTime}
              </div>
              <div className="flex items-center text-gray-600">
                <TeamOutlined className="mr-2" />
                {job.applicants}人已申请
              </div>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, index) => (
                  <Tag key={index} color="blue">{tag}</Tag>
                ))}
              </div>
              <div className="flex flex-row gap-4 mt-2">
                <Button
                  type="primary"
                  icon={<VideoCameraOutlined />}
                  onClick={() => handleStartInterview(job)}
                  className="w-full"
                >
                  开始面试
                </Button>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => message.success('投递成功')}
                  className="w-full"
                >
                  投递简历
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        title="确认个人信息"
        open={isModalVisible}
        onOk={handleConfirmInterview}
        onCancel={() => setIsModalVisible(false)}
        okText="确认并开始面试"
        cancelText="取消"
      >
        <div className="space-y-4">
          <p>请确认您的个人信息是否正确：</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500">姓名</div>
              <div>{profile.name}</div>
            </div>
            <div>
              <div className="text-gray-500">学校</div>
              <div>{profile.school}</div>
            </div>
            <div>
              <div className="text-gray-500">专业</div>
              <div>{profile.major}</div>
            </div>
            <div>
              <div className="text-gray-500">年级</div>
              <div>{profile.grade}</div>
            </div>
            <div>
              <div className="text-gray-500">手机号</div>
              <div>{profile.phone}</div>
            </div>
            <div>
              <div className="text-gray-500">QQ邮箱</div>
              <div>{profile.email}</div>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            如需修改个人信息，请前往
            <Button type="link" onClick={() => navigate('/profile?from=joblist')}>
              个人中心
            </Button>
            进行修改
          </p>
        </div>
      </Modal>

      <Drawer
        title="岗位详情"
        placement="right"
        width={600}
        open={isDetailDrawerVisible}
        onClose={() => setIsDetailDrawerVisible(false)}
      >
        {selectedJob && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedJob.position}</h2>
                <div className="text-lg text-gray-600">{selectedJob.company}</div>
                <div className="text-sm text-gray-500">{selectedJob.department}</div>
              </div>
              <Button 
                type="text" 
                icon={favorites.includes(selectedJob.id) ? <StarFilled className="text-yellow-500" /> : <StarOutlined />}
                onClick={() => toggleFavorite(selectedJob.id)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500">工作地点</div>
                <div>{selectedJob.location}</div>
              </div>
              <div>
                <div className="text-gray-500">薪资范围</div>
                <div>{selectedJob.salary}</div>
              </div>
              <div>
                <div className="text-gray-500">工作类型</div>
                <div>{selectedJob.type}</div>
              </div>
              <div>
                <div className="text-gray-500">工作经验</div>
                <div>{selectedJob.experience}</div>
              </div>
              <div>
                <div className="text-gray-500">学历要求</div>
                <div>{selectedJob.education}</div>
              </div>
              <div>
                <div className="text-gray-500">发布时间</div>
                <div>{selectedJob.publishTime}</div>
              </div>
              <div>
                <div className="text-gray-500">所属部门</div>
                <div>{selectedJob.department}</div>
              </div>
            </div>

            <div>
              <div className="text-lg font-medium mb-2">岗位描述</div>
              <p className="text-gray-600">{selectedJob.description}</p>
            </div>

            <div>
              <div className="text-lg font-medium mb-2">岗位要求</div>
              <ul className="list-disc pl-4 text-gray-600">
                {selectedJob.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-lg font-medium mb-2">技能标签</div>
              <div className="flex flex-wrap gap-2">
                {selectedJob.tags.map((tag, index) => (
                  <Tag key={index} color="blue">{tag}</Tag>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button onClick={() => setIsDetailDrawerVisible(false)}>关闭</Button>
              <div className="flex flex-row gap-4">
                <Button type="primary" onClick={() => {
                  setIsDetailDrawerVisible(false);
                  handleStartInterview(selectedJob);
                }}>
                  开始面试
                </Button>
                <Button
                  type="primary"
                  onClick={() => message.success('投递成功')}
                >
                  投递简历
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        title="我的收藏岗位"
        placement="right"
        width={500}
        open={showFavoritesDrawer}
        onClose={() => setShowFavoritesDrawer(false)}
      >
        {favorites.length === 0 ? (
          <div className="text-gray-400 text-center mt-12">暂无收藏岗位</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {favorites.map(fid => {
              const job = mockJobs.find(j => j.id === fid);
              if (!job) return null;
              return (
                <Card
                  key={job.id}
                  className="hover:shadow-lg transition-shadow border-yellow-200"
                  title={
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">{job.position}</span>
                      <Space>
                        <Tooltip title="取消收藏">
                          <Button
                            type="text"
                            icon={<StarFilled className="text-yellow-500" />}
                            onClick={e => {
                              e.stopPropagation();
                              toggleFavorite(job.id);
                            }}
                          />
                        </Tooltip>
                        <Tag color="blue">{job.company}｜{job.department}</Tag>
                      </Space>
                    </div>
                  }
                  extra={
                    <Button type="link" onClick={() => handleViewDetails(job)}>
                      详情
                    </Button>
                  }
                >
                  <div className="flex items-center text-gray-600">
                    <EnvironmentOutlined className="mr-2" />
                    {job.location}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarOutlined className="mr-2" />
                    {job.salary}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ClockCircleOutlined className="mr-2" />
                    {job.publishTime}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <TeamOutlined className="mr-2" />
                    {job.applicants}人已申请
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, index) => (
                      <Tag key={index} color="blue">{tag}</Tag>
                    ))}
                  </div>
                  <div className="flex flex-row gap-4 mt-2">
                    <Button
                      type="primary"
                      icon={<VideoCameraOutlined />}
                      onClick={() => handleStartInterview(job)}
                      className="w-full"
                    >
                      开始面试
                    </Button>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => message.success('投递成功')}
                      className="w-full"
                    >
                      投递简历
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default JobList; 