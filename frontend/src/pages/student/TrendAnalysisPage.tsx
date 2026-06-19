import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Spin,
  Alert,
  Typography,
  Statistic,
  Tag,
  List,
  Switch,
  Space,
  Divider,
} from 'antd';
import {
  FireOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import {
  getTrendData,
  getTrendInsight,
  type TrendAnalysisData,
} from '../../services/graph_api';
import ReactMarkdown from 'react-markdown';

const { Title, Text } = Typography;

export default function TrendAnalysisPage() {
  const [dataLoading, setDataLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [data, setData] = useState<TrendAnalysisData | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [includeAI, setIncludeAI] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (includeAI && data && !aiInsight && !aiLoading) {
      loadAI();
    }
    if (!includeAI) {
      setAiInsight(null);
    }
  }, [includeAI, data]);

  const loadData = async () => {
    setDataLoading(true);
    setError(null);
    setAiInsight(null);
    try {
      const result = await getTrendData();
      setData(result);
    } catch (e: any) {
      setError(e.message || '数据加载失败');
    } finally {
      setDataLoading(false);
    }
  };

  const loadAI = async () => {
    setAiLoading(true);
    try {
      const insight = await getTrendInsight();
      setAiInsight(insight);
    } catch (e: any) {
      console.error('AI 解读失败：', e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up">
      <Card
        title={
          <Space>
            <Title level={3} style={{ margin: 0 }}>
              技能趋势分析
            </Title>
            <Switch
              checked={includeAI}
              onChange={setIncludeAI}
              checkedChildren="AI解读"
              unCheckedChildren="仅数据"
            />
          </Space>
        }
        extra={
          <Text type="secondary">基于 {data?.summary?.total_skills || 0} 个热门技能分析</Text>
        }
      >
        <Spin spinning={dataLoading}>
          {error && (
            <Alert
              message="加载失败"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}

          {data && !error && (
            <>
              {/* 统计概览 */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Statistic
                    title="热门技能数"
                    value={data.summary.total_skills}
                    prefix={<FireOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="技能关联关系"
                    value={data.summary.total_relations}
                    prefix={<ThunderboltOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="新兴岗位数"
                    value={data.summary.emerging_count}
                    prefix={<RocketOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="AI智能解读"
                    value={aiLoading ? '生成中...' : aiInsight ? '已生成' : '未启用'}
                    prefix={<RobotOutlined />}
                    valueStyle={{ color: aiLoading ? '#faad14' : aiInsight ? '#1890ff' : '#d9d9d9' }}
                  />
                </Col>
              </Row>

              <Row gutter={16}>
                {/* 热门技能排行 */}
                <Col span={8}>
                  <Card
                    title={<><FireOutlined /> 热门技能排行 TOP15</>}
                    size="small"
                    style={{ height: '100%' }}
                  >
                    <List
                      dataSource={data.popular_skills}
                      renderItem={(item, index) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  background: index < 3 ? '#ff4d4f' : '#1890ff',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                }}
                              >
                                {index + 1}
                              </div>
                            }
                            title={<Text strong>{item.skill}</Text>}
                            description={
                              <Space>
                                <Text type="secondary">{item.job_count} 个岗位需求</Text>
                                {index < 3 && <Tag color="red">热门</Tag>}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>

                {/* 技能关联分析 */}
                <Col span={8}>
                  <Card
                    title={<><ThunderboltOutlined /> 技能关联关系 TOP20</>}
                    size="small"
                    style={{ height: '100%' }}
                  >
                    <List
                      dataSource={data.skill_relations}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <Space>
                                <Tag color="blue">{item.skill1}</Tag>
                                <Text type="secondary">+</Text>
                                <Tag color="green">{item.skill2}</Tag>
                              </Space>
                            }
                            description={<Text type="secondary">共现 {item.co_occurrence} 个岗位</Text>}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>

                {/* 新兴岗位发现 */}
                <Col span={8}>
                  <Card
                    title={<><RocketOutlined /> 新兴岗位发现</>}
                    size="small"
                    style={{ height: '100%' }}
                  >
                    {data.emerging_jobs.length === 0 ? (
                      <Alert message="暂无新兴岗位数据" type="info" showIcon />
                    ) : (
                      <List
                        dataSource={data.emerging_jobs}
                        renderItem={(item) => (
                          <List.Item>
                            <List.Item.Meta
                              title={<Text strong>{item.job_name}</Text>}
                              description={
                                <div>
                                  <div style={{ marginBottom: 4 }}>
                                    <Space wrap>
                                      {item.skills.map((skill) => (
                                        <Tag key={skill} color="purple">{skill}</Tag>
                                      ))}
                                    </Space>
                                  </div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    罕见度: {item.common_jobs} 个相似岗位
                                  </Text>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </Card>
                </Col>
              </Row>

              {/* AI 趋势解读 */}
              {includeAI && (
                <>
                  <Divider style={{ margin: '24px 0' }} />
                  <Card
                    title={<><RobotOutlined /> AI 趋势解读</>}
                    style={{
                      background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                      border: '1px solid #adc6ff',
                    }}
                  >
                    <Spin spinning={aiLoading} tip="AI 解读生成中...">
                      {aiInsight ? (
                        <div style={{ fontSize: 15, lineHeight: 1.8 }}>
                          <ReactMarkdown>{aiInsight}</ReactMarkdown>
                        </div>
                      ) : (
                        <Alert
                          message="AI 解读未启用或生成失败"
                          type="info"
                          showIcon
                        />
                      )}
                    </Spin>
                  </Card>
                </>
              )}
            </>
          )}
        </Spin>
      </Card>
    </div>
  );
}
