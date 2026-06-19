import { useEffect, useState } from 'react';
import {
  Card,
  Select,
  Input,
  Button,
  Row,
  Col,
  Progress,
  Tag,
  Table,
  Spin,
  Empty,
  Alert,
  Space,
  Divider,
  App as AntdApp,
  List,
  Typography,
  Badge,
} from 'antd';
import { ThunderboltOutlined, AimOutlined, BankOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons';
import {
  matchResume,
  recommendJobs,
  getGraphData,
  type ResumeMatchData,
  type RecommendJob,
  type GraphNode,
} from '../../services/graph_api';
import { searchJobs, type CompanyJob } from '../../services/job_api';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;


const RESUME_PLACEHOLDER = `请粘贴简历内容，例如：
张三，本科，3 年 Python 后端开发经验。
熟悉 Python、Django、Flask、MySQL、Redis、Docker。
了解微服务架构，有高并发项目经验。
有良好的团队协作和沟通能力。`;

export default function JobMatchingPage() {
  const { message } = AntdApp.useApp();

  const [jobOptions, setJobOptions] = useState<{ value: string; label: string }[]>([]);
  const [targetJob, setTargetJob] = useState<string | undefined>();
  const [resumeText, setResumeText] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeMatchData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [companyJobs, setCompanyJobs] = useState<CompanyJob[]>([]);

  // 加载岗位选项
  useEffect(() => {
    setJobsLoading(true);
    getGraphData({ limit: 500 })
      .then((data) => {
        const jobs = data.nodes.filter((n: GraphNode) => n.type === 'Job');
        setJobOptions(jobs.map((j: GraphNode) => ({ value: j.label, label: j.label })));
      })
      .catch((e) => message.error('岗位列表加载失败：' + e.message))
      .finally(() => setJobsLoading(false));
  }, []);

  const handleAnalyze = async () => {
    if (!targetJob) {
      message.warning('请选择目标岗位');
      return;
    }
    if (!resumeText.trim()) {
      message.warning('请粘贴简历内容');
      return;
    }

    setLoading(true);
    setResult(null);
    setRecommendations([]);
    setCompanyJobs([]);
    try {
      const matchData = await matchResume({ target_job: targetJob, resume_text: resumeText });
      setResult(matchData);

      // 并发请求推荐岗位和公司职位（仅10个）
      const [recResult, jobsResult] = await Promise.allSettled([
        matchData.resume_skills.length > 0 ? recommendJobs(matchData.resume_skills, 10) : Promise.resolve([]),
        searchJobs(targetJob, 1, 10),
      ]);

      if (recResult.status === 'fulfilled') {
        setRecommendations(recResult.value);
      } else {
        console.error('推荐岗位加载失败：', recResult.reason);
      }

      if (jobsResult.status === 'fulfilled') {
        setCompanyJobs(jobsResult.value.jobs);
      } else {
        console.error('公司职位加载失败：', jobsResult.reason);
        message.warning('公司职位加载失败，请稍后重试');
      }
    } catch (e: any) {
      message.error('分析失败：' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card title={<><AimOutlined /> 人岗匹配分析</>}>
        <Row gutter={16}>
          <Col span={8}>
            <div className="mb-2 font-medium">目标岗位</div>
            <Select
              showSearch
              placeholder="选择或搜索目标岗位"
              optionFilterProp="label"
              value={targetJob}
              onChange={setTargetJob}
              options={jobOptions}
              style={{ width: '100%' }}
              size="large"
              loading={jobsLoading}
              notFoundContent={jobsLoading ? '加载中...' : '无匹配岗位'}
            />
          </Col>
          <Col span={16}>
            <div className="mb-2 font-medium">简历内容</div>
            <TextArea
              rows={8}
              placeholder={RESUME_PLACEHOLDER}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </Col>
        </Row>
        <Divider />
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          loading={loading}
          onClick={handleAnalyze}
          block
        >
          开始分析
        </Button>
      </Card>

      <Spin spinning={loading}>
        {!result && !loading && (
          <Empty description="请填写岗位和简历后点击分析" className="mt-12" />
        )}

        {result && (
          <>
            <Card title="匹配评分">
              <Row gutter={24} justify="center">
                <Col>
                  <Progress
                    type="dashboard"
                    percent={Math.round(result.total_score)}
                    format={(p) => `${p} 分`}
                    strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                    size={140}
                  />
                  <div className="text-center mt-2 text-gray-500">总分</div>
                </Col>
                <Col>
                  <Progress
                    type="dashboard"
                    percent={Math.round((result.skill_score / 50) * 100)}
                    format={() => `${result.skill_score} / 50`}
                    strokeColor="#5B8FF9"
                    size={120}
                  />
                  <div className="text-center mt-2 text-gray-500">技能</div>
                </Col>
                <Col>
                  <Progress
                    type="dashboard"
                    percent={Math.round((result.experience_score / 25) * 100)}
                    format={() => `${result.experience_score} / 25`}
                    strokeColor="#F6BD16"
                    size={120}
                  />
                  <div className="text-center mt-2 text-gray-500">经验</div>
                </Col>
                <Col>
                  <Progress
                    type="dashboard"
                    percent={Math.round((result.education_score / 25) * 100)}
                    format={() => `${result.education_score} / 25`}
                    strokeColor="#F5222D"
                    size={120}
                  />
                  <div className="text-center mt-2 text-gray-500">学历</div>
                </Col>
              </Row>
            </Card>

            <Row gutter={16} className="mt-4">
              <Col span={12}>
                <Card title={`✅ 已具备技能 (${result.matched_skills.length})`}>
                  {result.matched_skills.length === 0 && (
                    <Alert message="未匹配到任何技能" type="info" showIcon />
                  )}
                  <Space wrap>
                    {result.matched_skills.map((s) => (
                      <Tag
                        color={s.importance === 'required' ? 'green' : 'lime'}
                        key={s.name}
                      >
                        {s.name}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title={`❌ 缺失技能 (${result.missing_skills.length})`}>
                  {result.missing_skills.length === 0 ? (
                    <Alert message="已具备所有核心技能！" type="success" showIcon />
                  ) : (
                    <Space wrap>
                      {result.missing_skills.map((s) => (
                        <Tag color="red" key={s.name}>
                          {s.name}
                        </Tag>
                      ))}
                    </Space>
                  )}
                </Card>
              </Col>
            </Row>

            <Card title={`🎯 推荐岗位 (${recommendations.length})`} className="mt-4">
              {recommendations.length === 0 ? (
                <Empty description="暂无相似岗位" />
              ) : (
                <Table
                  rowKey="job"
                  dataSource={recommendations}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '岗位', dataIndex: 'job', key: 'job' },
                    {
                      title: '匹配度',
                      dataIndex: 'match_ratio',
                      key: 'match_ratio',
                      render: (v) => (
                        <Progress
                          percent={Math.round(v * 100)}
                          size="small"
                          status={v >= 0.5 ? 'success' : 'normal'}
                        />
                      ),
                    },
                    {
                      title: '共享技能',
                      dataIndex: 'shared_skills',
                      key: 'shared_skills',
                      render: (skills: string[]) => (
                        <Space wrap>
                          {skills.map((s) => (
                            <Tag key={s}>{s}</Tag>
                          ))}
                        </Space>
                      ),
                    },
                    {
                      title: '覆盖',
                      key: 'coverage',
                      render: (_, r) => `${r.matched_skill_count}/${r.total_skill_count}`,
                    },
                  ]}
                />
              )}
            </Card>

            <Card
              title={<><BankOutlined /> 匹配公司职位 ({companyJobs.length})</>}
              className="mt-4"
            >
              {companyJobs.length === 0 ? (
                <Empty description="暂无相关公司职位" />
              ) : (
                <List
                  dataSource={companyJobs}
                  renderItem={(job) => (
                    <List.Item
                      key={job.id}
                      style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, marginBottom: 12 }}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ fontSize: 16 }}>{job.title}</Text>
                            <Badge count={job.companyName} style={{ backgroundColor: '#52c41a' }} />
                          </div>
                        }
                        description={
                          <div style={{ marginTop: 8 }}>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <div>
                                <EnvironmentOutlined style={{ marginRight: 4 }} />
                                <Text type="secondary">{job.location || '地点不限'}</Text>
                                <DollarOutlined style={{ marginLeft: 16, marginRight: 4 }} />
                                <Text type="secondary">{job.salaryRange}</Text>
                              </div>
                              <div>
                                <Text type="secondary">经验要求：</Text>
                                <Text>{job.experienceRequired || '不限'}</Text>
                                <Text type="secondary" style={{ marginLeft: 16 }}>学历要求：</Text>
                                <Text>{job.educationRequired || '不限'}</Text>
                              </div>
                              <div>
                                <Text type="secondary">技能要求：</Text>
                                <Space wrap>
                                  {job.skills.slice(0, 8).map((skill) => (
                                    <Tag key={skill} color="blue">{skill}</Tag>
                                  ))}
                                  {job.skills.length > 8 && (
                                    <Tag>+{job.skills.length - 8}</Tag>
                                  )}
                                </Space>
                              </div>
                              {job.welfareList && (
                                <Paragraph
                                  ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Text type="secondary">福利：</Text>
                                  <Text>{job.welfareList}</Text>
                                </Paragraph>
                              )}
                            </Space>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </>
        )}
      </Spin>
    </div>
  );
}
