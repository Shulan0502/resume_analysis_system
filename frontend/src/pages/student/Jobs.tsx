import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Pagination,
  Spin,
  message,
  Space,
  Empty,
  Modal,
  Descriptions,
  Divider
} from 'antd'
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  UserOutlined,
  FireOutlined,
  CalendarOutlined,
  TeamOutlined,
  HomeOutlined,
  VideoCameraOutlined,
  SendOutlined
} from '@ant-design/icons'
import { getAllActiveJobs, searchJobs, getJobDetail, getPopularJobs, getLatestJobs, applyForJob } from '../../services/api.ts'

const { Search } = Input
const { Option } = Select

interface JobDetail {
  id: number
  title: string
  companyName: string
  department: string
  location: string
  jobType: string
  salaryMin?: number
  salaryMax?: number
  salaryUnit?: string
  salaryExtension?: string
  salaryRange: string
  experienceRequired: string
  educationRequired: string
  description: string
  requirements: string
  benefits: string
  welfareList?: string
  skills: string[]
  tags: string[]
  viewCount: number
  applicationCount: number
  deadline: string
  isUrgent: boolean
  isRemoteWork: boolean
  createdAt: string
  publishedAt: string
}

const Jobs: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<JobDetail[]>([])
  const [popularJobs, setPopularJobs] = useState<JobDetail[]>([])
  const [latestJobs, setLatestJobs] = useState<JobDetail[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedJobType, setSelectedJobType] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>('')
  const [jobDetailVisible, setJobDetailVisible] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null)

  // 获取所有岗位
  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await getAllActiveJobs(currentPage, pageSize)
      if (response.success && response.data) {
        setJobs(response.data.jobs || [])
        setTotalCount(response.data.totalCount || 0)
      }
    } catch (error) {
      message.error('获取岗位失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取热门岗位
  const fetchPopularJobs = async () => {
    try {
      const response = await getPopularJobs(6)
      if (response.success && response.data) {
        setPopularJobs(response.data)
      }
    } catch (error) {
      console.error('获取热门岗位失败:', error)
    }
  }

  // 获取最新岗位
  const fetchLatestJobs = async () => {
    try {
      const response = await getLatestJobs(6)
      if (response.success && response.data) {
        setLatestJobs(response.data)
      }
    } catch (error) {
      console.error('获取最新岗位失败:', error)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchPopularJobs()
    fetchLatestJobs()
  }, [currentPage])

  // 搜索处理
  const handleSearch = async () => {
    setLoading(true)
    try {
      const searchParams = {
        keyword: searchKeyword,
        jobType: selectedJobType || null,
        location: selectedLocation || null,
        minSalary: selectedSalaryRange ? parseInt(selectedSalaryRange.split('-')[0]) : null,
        maxSalary: selectedSalaryRange ? parseInt(selectedSalaryRange.split('-')[1]) : null,
        page: 1,
        size: pageSize
      }

      const response = await searchJobs(searchParams)
      if (response.success && response.data) {
        setJobs(response.data.jobs || [])
        setTotalCount(response.data.totalCount || 0)
        setCurrentPage(1)
      }
    } catch (error) {
      message.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (jobId: number) => {
    try {
      const response = await getJobDetail(jobId)
      if (response.success && response.data) {
        setSelectedJob(response.data)
        setJobDetailVisible(true)
      }
    } catch (error) {
      message.error('获取岗位详情失败')
    }
  }

  // 根据岗位标题映射到面试领域
  const mapJobToInterviewField = (jobTitle: string): string => {
    const title = jobTitle.toLowerCase();

    // 物联网相关（需要优先匹配，避免被其他规则覆盖）
    if (title.includes('物联网') || title.includes('嵌入式') || title.includes('硬件')) {
      return 'iot';
    }

    // AI相关（需要优先匹配算法工程师）
    if (title.includes('ai') || title.includes('人工智能') || title.includes('机器学习') ||
        title.includes('深度学习') || title.includes('算法工程师')) {
      return 'ai';
    }

    // 前端开发相关
    if (title.includes('前端') || title.includes('web') || title.includes('react') ||
        title.includes('vue') || title.includes('angular') || title.includes('ui') ||
        title.includes('ux') || title.includes('设计师')) {
      return 'frontend';
    }

    // 产品经理相关（需要优先匹配需求分析师）
    if (title.includes('产品') || title.includes('需求分析') || title.includes('运营')) {
      return 'product';
    }

    // 数据相关（需要在后端开发之前匹配）
    if (title.includes('数据') || title.includes('分析') || title.includes('算法')) {
      return 'bigdata';
    }

    // 后端开发相关
    if (title.includes('后端') || title.includes('java') || title.includes('python') ||
        title.includes('node') || title.includes('php') || title.includes('go') ||
        title.includes('全栈') || title.includes('开发工程师')) {
      return 'backend';
    }

    // 云计算相关
    if (title.includes('云') || title.includes('devops') || title.includes('运维')) {
      return 'cloud';
    }

    // 安全相关
    if (title.includes('安全') || title.includes('测试')) {
      return 'security';
    }

    // 智能系统相关
    if (title.includes('智能') || title.includes('自动化')) {
      return 'intelligent';
    }

    // 默认返回后端开发
    return 'backend';
  };

  const handleVideoInterview = (job: JobDetail) => {
    // 根据岗位标题自动选择面试领域
    const fieldId = mapJobToInterviewField(job.title);

    // 跳转到模拟面试页面，并传递岗位信息和自动选择的领域
    const interviewUrl = `/interview?jobTitle=${encodeURIComponent(job.title)}&companyName=${encodeURIComponent(job.companyName)}&jobId=${job.id}&fieldId=${fieldId}&autoSelect=true`
    window.location.href = interviewUrl
  }

  const handleApplyJob = async (job: JobDetail) => {
    try {
      
      const resumeContent = `我对${job.title}岗位非常感兴趣，希望能够加入${job.companyName}团队。`
      const coverLetter = `尊敬的HR，我是一名优秀的求职者，具备相关技能和经验，期待与您进一步沟通。`

      const response = await applyForJob({
        jobId: job.id,
        resumeContent,
        coverLetter
      })

      if (response.success) {
        message.success('简历投递成功！')
      } else {
        message.error(response.message || '简历投递失败')
      }
    } catch (error) {
      message.error('简历投递失败，请重试')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleReset = () => {
    setSearchKeyword('')
    setSelectedJobType('')
    setSelectedLocation('')
    setSelectedSalaryRange('')
    setCurrentPage(1)
    fetchJobs()
  }

  const renderJobCard = (job: JobDetail) => (
    <Card
      key={job.id}
      className="h-full hover:shadow-lg transition-shadow"
      actions={[
        <div key="view" className="flex items-center justify-center">
          <EyeOutlined className="mr-1" />
          {job.viewCount}
        </div>,
        <div key="apply" className="flex items-center justify-center">
          <UserOutlined className="mr-1" />
          {job.applicationCount}
        </div>
      ]}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{job.title}</h3>
            <p className="text-blue-600 font-medium">{job.companyName}</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {job.isUrgent && <Tag color="red" icon={<FireOutlined />}>紧急</Tag>}
            {job.isRemoteWork && <Tag color="green" icon={<HomeOutlined />}>远程</Tag>}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <EnvironmentOutlined className="mr-2" />
            <span>{job.location}</span>
            <Divider type="vertical" />
            <TeamOutlined className="mr-1" />
            <span>{job.department}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <DollarOutlined className="mr-2" />
            <span className="font-medium text-green-600">{job.salaryExtension || job.salaryRange}</span>
            <Divider type="vertical" />
            <span>{job.jobType}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <ClockCircleOutlined className="mr-2" />
            <span>经验要求: {job.experienceRequired}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 4).map(skill => (
            <Tag key={skill} color="blue">{skill}</Tag>
          ))}
          {job.skills.length > 4 && (
            <Tag color="default">+{job.skills.length - 4}</Tag>
          )}
        </div>

        {job.welfareList && (
          <div className="flex flex-wrap gap-1">
            {job.welfareList.split(' ').slice(0, 4).map((welfare, index) => (
              <Tag key={index} color="orange">{welfare}</Tag>
            ))}
            {job.welfareList.split(' ').length > 4 && (
              <Tag color="default">+{job.welfareList.split(' ').length - 4}</Tag>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>发布时间: {new Date(job.publishedAt).toLocaleDateString()}</span>
          {job.deadline && (
            <span>截止: {new Date(job.deadline).toLocaleDateString()}</span>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between gap-3 pt-3 border-t border-gray-100">
          <Button
            type="primary"
            size="middle"
            icon={<VideoCameraOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleVideoInterview(job)
            }}
            className="flex-1"
          >
            视频面试
          </Button>
          <Button
            type="default"
            size="middle"
            icon={<SendOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleApplyJob(job)
            }}
            className="flex-1"
          >
            简历投递
          </Button>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="p-6 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 min-h-screen animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 animate-slide-in-left">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-10 h-10 mr-3 text-blue-600 animate-bounce" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6h-4V4c0-1.103-.897-2-2-2h-4c-1.103 0-2 .897-2 2v2H4c-1.103 0-2 .897-2 2v11c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V8c0-1.103-.897-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"></path>
            </svg>
            求职市场
            <span className="text-sm text-gray-600 ml-3 bg-white bg-opacity-50 px-3 py-1 rounded-full">
              (当前显示 {jobs.length} 个岗位，总计 {totalCount} 个)
            </span>
          </h1>
          
          {/* 搜索和筛选 */}
          <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 transition-all duration-500 hover:shadow-2xl animate-slide-in-right">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <Search
                placeholder="搜索岗位、公司或技能..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={handleSearch}
                enterButton={
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />} 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                  />
                }
                size="large"
                className="rounded-xl"
              />
              
              <Select
                placeholder="请选择工作类型"
                value={selectedJobType || undefined}
                onChange={setSelectedJobType}
                size="large"
                allowClear
                showSearch
                className="rounded-xl"
                filterOption={(input: string, option: any) => {
                  const children = option?.children;
                  return typeof children === 'string' ? children.toLowerCase().includes(input.toLowerCase()) : false;
                }}
              >
                <Option value="全职">全职</Option>
                <Option value="兼职">兼职</Option>
                <Option value="实习">实习</Option>
                <Option value="合同工">合同工</Option>
              </Select>
              
              <Select
                placeholder="请选择城市"
                value={selectedLocation || undefined}
                onChange={setSelectedLocation}
                size="large"
                allowClear
                showSearch
                className="rounded-xl"
                filterOption={(input: string, option: any) => {
                  const children = option?.children;
                  return typeof children === 'string' ? children.toLowerCase().includes(input.toLowerCase()) : false;
                }}
              >
                <Option value="北京">北京</Option>
                <Option value="上海">上海</Option>
                <Option value="广州">广州</Option>
                <Option value="深圳">深圳</Option>
                <Option value="杭州">杭州</Option>
                <Option value="成都">成都</Option>
              </Select>
              
              <Select
                placeholder="请选择期望薪资范围"
                value={selectedSalaryRange || undefined}
                onChange={setSelectedSalaryRange}
                size="large"
                allowClear
                showSearch
                className="rounded-xl"
                filterOption={(input: string, option: any) => {
                  const children = option?.children;
                  return typeof children === 'string' ? children.toLowerCase().includes(input.toLowerCase()) : false;
                }}
              >
                <Option value="5-10">5k-10k</Option>
                <Option value="10-15">10k-15k</Option>
                <Option value="15-25">15k-25k</Option>
                <Option value="25-40">25k-40k</Option>
                <Option value="40-100">40k以上</Option>
              </Select>
              
              <Space className="flex md:flex-col lg:flex-row">
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700 transition-all duration-300 rounded-xl flex-1"
                >
                  搜索
                </Button>
                <Button 
                  size="large" 
                  onClick={handleReset}
                  className="border-blue-500 text-blue-500 hover:bg-blue-50 transition-all duration-300 rounded-xl flex-1"
                >
                  重置
                </Button>
              </Space>
            </div>
          </div>

          {/* 热门岗位和最新岗位 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border-l-4 border-red-500 animate-fade-in-up">
              <h3 className="text-xl font-bold mb-4 flex items-center text-red-600">
                <FireOutlined className="mr-3 text-2xl" />
                热门岗位
              </h3>
              <div className="space-y-3">
                {popularJobs.slice(0, 3).map((job, index) => (
                  <div
                    key={job.id}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 animate-fade-in-up delay-${index * 100}`}
                    onClick={() => handleViewDetail(job.id)}
                  >
                    <div>
                      <div className="font-bold text-lg">{job.title}</div>
                      <div className="text-gray-600 mt-1">{job.companyName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-bold text-lg">{job.salaryRange}</div>
                      <div className="text-sm text-gray-500 mt-1">{job.viewCount} 浏览</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border-l-4 border-blue-500 animate-fade-in-up">
              <h3 className="text-xl font-bold mb-4 flex items-center text-blue-600">
                <CalendarOutlined className="mr-3 text-2xl" />
                最新岗位
              </h3>
              <div className="space-y-3">
                {latestJobs.slice(0, 3).map((job, index) => (
                  <div
                    key={job.id}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 animate-fade-in-up delay-${index * 100}`}
                    onClick={() => handleViewDetail(job.id)}
                  >
                    <div>
                      <div className="font-bold text-lg">{job.title}</div>
                      <div className="text-gray-600 mt-1">{job.companyName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-bold text-lg">{job.salaryRange}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(job.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 岗位列表 */}
        <Spin spinning={loading} tip="加载中..." size="large">
          {jobs.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between animate-fade-in">
                <span className="text-gray-700 font-medium">共找到 {totalCount} 个岗位</span>
              </div>
              
              <Row gutter={[24, 24]}>
                {jobs.map((job, index) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={job.id} className={`animate-fade-in-up delay-${index * 50}`}>
                    {renderJobCard(job)}
                  </Col>
                ))}
              </Row>
              
              <div className="mt-8 text-center animate-fade-in">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalCount}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) =>
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }
                  className="bg-white p-4 rounded-2xl shadow-md inline-block"
                />
              </div>
            </>
          ) : (
            <Empty 
              description="暂无岗位" 
              className="animate-fade-in bg-white p-12 rounded-2xl shadow-md"
            />
          )}
        </Spin>

        {/* 岗位详情弹窗 */}
        <Modal
          title={
            <div className="flex items-center text-2xl font-bold text-gray-800">
              <UserOutlined className="mr-3 text-blue-600" />
              岗位详情
            </div>
          }
          open={jobDetailVisible}
          onCancel={() => setJobDetailVisible(false)}
          footer={[
            <Button 
              key="close" 
              onClick={() => setJobDetailVisible(false)}
              className="rounded-xl"
            >
              关闭
            </Button>,
            <Button 
              key="apply" 
              type="primary" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700 transition-all duration-300 rounded-xl"
            >
              立即申请
            </Button>
          ]}
          width={900}
          className="rounded-2xl overflow-hidden"
        >
          {selectedJob && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center border-b pb-6">
                <h2 className="text-3xl font-bold text-gray-800">{selectedJob.title}</h2>
                <p className="text-xl text-blue-600 mt-3">{selectedJob.companyName}</p>
                <div className="flex items-center justify-center space-x-4 mt-4">
                  {selectedJob.isUrgent && <Tag color="red" icon={<FireOutlined />}>紧急招聘</Tag>}
                  {selectedJob.isRemoteWork && <Tag color="green" icon={<HomeOutlined />}>支持远程</Tag>}
                </div>
              </div>

              <Descriptions column={2} bordered className="rounded-2xl overflow-hidden">
                <Descriptions.Item label="工作地点">{selectedJob.location}</Descriptions.Item>
                <Descriptions.Item label="所属部门">{selectedJob.department}</Descriptions.Item>
                <Descriptions.Item label="工作类型">{selectedJob.jobType}</Descriptions.Item>
                <Descriptions.Item label="薪资范围">
                  <span className="text-green-600 font-bold">{selectedJob.salaryRange}</span>
                </Descriptions.Item>
                <Descriptions.Item label="经验要求">{selectedJob.experienceRequired}</Descriptions.Item>
                <Descriptions.Item label="学历要求">{selectedJob.educationRequired}</Descriptions.Item>
                <Descriptions.Item label="浏览次数">{selectedJob.viewCount}</Descriptions.Item>
                <Descriptions.Item label="申请人数">{selectedJob.applicationCount}</Descriptions.Item>
              </Descriptions>

              <div className="bg-blue-50 p-6 rounded-2xl">
                <h4 className="font-bold text-lg mb-3 text-blue-800">岗位描述</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
              </div>

              <div className="bg-purple-50 p-6 rounded-2xl">
                <h4 className="font-bold text-lg mb-3 text-purple-800">任职要求</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.requirements}</p>
              </div>

              <div className="bg-green-50 p-6 rounded-2xl">
                <h4 className="font-bold text-lg mb-3 text-green-800">福利待遇</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.benefits}</p>
              </div>

              <div className="bg-yellow-50 p-6 rounded-2xl">
                <h4 className="font-bold text-lg mb-3 text-yellow-800">技能要求</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedJob.skills.map(skill => (
                    <Tag 
                      key={skill} 
                      color="blue" 
                      className="px-4 py-2 text-base rounded-full transition-all duration-300 hover:scale-110"
                    >
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>

              {selectedJob.tags.length > 0 && (
                <div className="bg-pink-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-lg mb-3 text-pink-800">岗位标签</h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedJob.tags.map(tag => (
                      <Tag 
                        key={tag} 
                        color="default" 
                        className="px-4 py-2 text-base rounded-full transition-all duration-300 hover:scale-110"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default Jobs

