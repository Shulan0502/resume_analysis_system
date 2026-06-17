import { useState } from 'react';
import { Upload, message, Input, Button, Form, Spin, Row, Col, Card, Progress, Divider, Tag, Typography, Space, Tooltip } from 'antd';
import { 
  UploadOutlined, 
  SendOutlined, 
  FileTextOutlined, 
  SolutionOutlined, 
  BarChartOutlined,
  TrophyOutlined,
  BulbOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  RocketOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { Column, Radar, Pie } from '@ant-design/charts';
import axios from 'axios';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

// 生成模拟匹配度数据的函数
const generateMockMatchingData = () => {
  const dimensions = ['技能匹配', '经验匹配', '教育背景', '项目经验', '综合能力'];
  return dimensions.map(dim => ({
    dimension: dim,
    score: Math.floor(60 + Math.random() * 35),
    level: Math.random() > 0.3 ? (Math.random() > 0.5 ? '优秀' : '良好') : '一般'
  }));
};

const sectionColors = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  purple: '#722ed1',
  cyan: '#13c2c2',
  orange: '#fa8c16'
};

// 岗位匹配度统计图组件
const MatchingScoreChart = ({ data }: { data: any }) => {
  let chartData: { dimension: string; score: number; level: string }[] = [];

  if (!data || typeof data !== 'object') {
    chartData = generateMockMatchingData();
  } else {
    Object.entries(data).forEach(([, valueObj]) => {
      if (typeof valueObj === 'object' && valueObj !== null) {
        Object.entries(valueObj as Record<string, string>).forEach(([subKey, subValue]) => {
          const scoreMatch = subValue.match(/(\d+)%|(\d+)分|(\d+\.?\d*)\/10/);
          let score: number;
          let level = '待提升';

          if (scoreMatch) {
            score = parseFloat(scoreMatch[1] || scoreMatch[2] || scoreMatch[3] || '0');
            if (subValue.includes('%')) {
              level = score >= 80 ? '优秀' : score >= 60 ? '良好' : '待提升';
            } else if (subValue.includes('分') || subValue.includes('/10')) {
              if (subValue.includes('/10')) {
                score = score * 10;
              }
              level = score >= 80 ? '优秀' : score >= 60 ? '良好' : '待提升';
            }
          } else {
            if (subValue.includes('优秀') || subValue.includes('很好') || subValue.includes('强')) {
              score = 85 + Math.random() * 10;
              level = '优秀';
            } else if (subValue.includes('良好') || subValue.includes('不错') || subValue.includes('较好')) {
              score = 70 + Math.random() * 10;
              level = '良好';
            } else if (subValue.includes('一般') || subValue.includes('基本') || subValue.includes('普通')) {
              score = 50 + Math.random() * 15;
              level = '一般';
            } else {
              score = 30 + Math.random() * 20;
              level = '待提升';
            }
          }

          chartData.push({
            dimension: subKey,
            score: Math.round(score),
            level
          });
        });
      }
    });
  }

  const config = {
    data: chartData,
    xField: 'dimension',
    yField: 'score',
    colorField: 'level',
    color: ({ level }: { level: string }) => {
      switch (level) {
        case '优秀': return '#52c41a';
        case '良好': return '#1890ff';
        case '一般': return '#faad14';
        case '待提升': return '#ff4d4f';
        default: return '#d9d9d9';
      }
    },
    label: {
      position: 'middle' as const,
      style: {
        fill: '#FFFFFF',
        opacity: 0.8,
      },
    },
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
        style: {
          fontSize: 12,
          fill: '#666',
        }
      },
    },
    yAxis: {
      label: {
        style: {
          fontSize: 11,
          fill: '#999',
        }
      },
      grid: {
        line: {
          style: {
            stroke: '#f0f0f0',
            lineDash: [4, 4],
          }
        }
      }
    },
    meta: {
      score: {
        alias: '匹配度分数',
        min: 0,
        max: 100,
      },
      dimension: {
        alias: '评估维度',
      },
    },
  };

  return (
    <Card 
      hoverable
      title={<><BarChartOutlined className="mr-2" style={{ color: sectionColors.primary }} />岗位匹配度统计图</>}
      className="mb-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
      headStyle={{ 
        background: 'linear-gradient(135deg, #e6f7ff 0%, #fff7e6 100%)',
        borderBottom: '2px solid #91d5ff'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Column {...config} />
    </Card>
  );
};

// 维度分析雷达图组件
const DimensionRadarChart = ({ data }: { data: any }) => {
  let radarData: { dimension: string; score: number }[] = [];

  if (!data || typeof data !== 'object') {
    const dimensions = ['技能匹配', '经验匹配', '教育背景', '项目经验', '综合能力'];
    radarData = dimensions.map(dim => ({
      dimension: dim,
      score: Math.floor(60 + Math.random() * 35)
    }));
  } else {

  Object.entries(data).forEach(([, valueObj]) => {
    if (typeof valueObj === 'object' && valueObj !== null) {
      Object.entries(valueObj as Record<string, string>).forEach(([subKey, subValue]) => {
        const scoreMatch = subValue.match(/(\d+)%|(\d+)分|(\d+\.?\d*)\/10/);
        let score: number;

        if (scoreMatch) {
          score = parseFloat(scoreMatch[1] || scoreMatch[2] || scoreMatch[3] || '0');
          if (subValue.includes('/10')) {
            score = score * 10;
          }
        } else {
          if (subValue.includes('优秀') || subValue.includes('很好') || subValue.includes('强')) {
            score = 85 + Math.random() * 10;
          } else if (subValue.includes('良好') || subValue.includes('不错') || subValue.includes('较好')) {
            score = 70 + Math.random() * 10;
          } else if (subValue.includes('一般') || subValue.includes('基本') || subValue.includes('普通')) {
            score = 50 + Math.random() * 15;
          } else {
            score = 30 + Math.random() * 20;
          }
        }

        radarData.push({
          dimension: subKey,
          score: Math.round(score)
        });
      });
    }
  });
  }

  const config = {
    data: radarData,
    xField: 'dimension',
    yField: 'score',
    area: {
      smooth: true,
      style: {
        fill: 'l(270) 0:#ffffff 1:#1890ff',
        fillOpacity: 0.3,
      }
    },
    line: {
      smooth: true,
      style: {
        stroke: '#1890ff',
        lineWidth: 2,
      }
    },
    point: {
      size: 3,
      style: {
        fill: '#fff',
        stroke: '#1890ff',
        lineWidth: 2,
      }
    },
    axis: {
      label: {
        style: {
          fontSize: 12,
          fill: '#666',
        }
      },
      line: {
        style: {
          stroke: '#e8e8e8',
        }
      },
      grid: {
        line: {
          style: {
            stroke: '#f0f0f0',
            lineDash: [4, 4],
          }
        }
      }
    },
    meta: {
      score: {
        alias: '匹配度',
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <Card 
      hoverable
      title={<><BarChartOutlined className="mr-2" style={{ color: sectionColors.purple }} />能力维度雷达图</>}
      className="mb-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
      headStyle={{ 
        background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
        borderBottom: '2px solid #d3adf7'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Radar {...config} />
    </Card>
  );
};

// 综合评分展示组件
const OverallScoreDisplay = ({ data }: { data: any }) => {
  let overallScore = 75;
  let scoreBreakdown: { type: string; value: number; color: string }[];

  if (data && typeof data === 'object') {
    const scores: number[] = [];
    Object.entries(data).forEach(([, valueObj]) => {
      if (typeof valueObj === 'object' && valueObj !== null) {
        Object.entries(valueObj as Record<string, string>).forEach(([, subValue]) => {
          const scoreMatch = subValue.match(/(\d+)%|(\d+)分|(\d+\.?\d*)\/10/);
          if (scoreMatch) {
            let score = parseFloat(scoreMatch[1] || scoreMatch[2] || scoreMatch[3] || '0');
            if (subValue.includes('/10')) {
              score = score * 10;
            }
            scores.push(score);
          } else {
            if (subValue.includes('优秀') || subValue.includes('很好') || subValue.includes('强')) {
              scores.push(85 + Math.random() * 10);
            } else if (subValue.includes('良好') || subValue.includes('不错') || subValue.includes('较好')) {
              scores.push(70 + Math.random() * 10);
            } else if (subValue.includes('一般') || subValue.includes('基本') || subValue.includes('普通')) {
              scores.push(50 + Math.random() * 15);
            } else {
              scores.push(30 + Math.random() * 20);
            }
          }
        });
      }
    });

    if (scores.length > 0) {
      overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  scoreBreakdown = [
    { type: '已获得分数', value: overallScore, color: '#52c41a' },
    { type: '待提升空间', value: 100 - overallScore, color: '#f0f0f0' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#ff4d4f';
  };

  const scoreColor = getScoreColor(overallScore);

  const pieConfig = {
    data: scoreBreakdown,
    angleField: 'value',
    colorField: 'type',
    color: ({ type }: { type: string }) => {
      return type === '已获得分数' ? scoreColor : '#f0f0f0';
    },
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 14,
        fontWeight: 600,
        textAlign: 'center',
      },
    },
    statistic: {
      title: {
        style: {
          fontSize: '14px',
          color: '#999',
        },
        content: '综合评分',
      },
      content: {
        style: {
          fontSize: '28px',
          fontWeight: 'bold',
          color: scoreColor,
        },
        content: `${overallScore}分`,
      },
    },
    legend: false,
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { text: '优秀', color: '#52c41a', desc: '超越绝大多数候选人' };
    if (score >= 80) return { text: '良好', color: '#1890ff', desc: '具备较强竞争力' };
    if (score >= 70) return { text: '中等', color: '#faad14', desc: '有一定优势' };
    if (score >= 60) return { text: '及格', color: '#fa8c16', desc: '需要继续提升' };
    return { text: '待提升', color: '#ff4d4f', desc: '建议针对性学习' };
  };

  const scoreLevel = getScoreLevel(overallScore);

  return (
    <Card 
      hoverable
      title={<><SolutionOutlined className="mr-2" style={{ color: sectionColors.success }} />综合匹配度评分</>}
      className="mb-4 h-full rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
      headStyle={{ 
        background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
        borderBottom: '2px solid #b7eb8f'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <div className="text-center">
        <div className="mb-2">
          <Pie {...pieConfig} />
        </div>
        <div 
          className="text-lg font-medium px-4 py-2 rounded-lg inline-block mt-2"
          style={{ 
            color: scoreLevel.color, 
            backgroundColor: `${scoreLevel.color}15`,
            border: `1px solid ${scoreLevel.color}40`
          }}
        >
          {scoreLevel.text}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          {scoreLevel.desc}
        </div>
        <Progress
          percent={overallScore}
          strokeColor={scoreColor}
          trailColor="#f0f0f0"
          className="mt-4"
          format={(percent) => `${percent}% 匹配度`}
        />
      </div>
    </Card>
  );
};

// 新增：用于展示格式化分析结果的组件
const FormattedAnalysisResult = ({ data }: { data: any }) => {
  if (!data) return null;

  // 复制文本功能
  const copyToClipboard = () => {
    const textToCopy = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(textToCopy).then(() => {
      message.success('分析结果已复制到剪贴板');
    });
  };

  const cleanText = (text: string) => {
    if (typeof text !== 'string') return text;
    return text.replace(/[#*]/g, '').trim();
  };

  const {
    岗位匹配度,
    综合评估,
    亮点,
    待改进,
    面试建议
  } = data;

  const renderMatchingTable = (matchingData: any) => {
    if (!matchingData || typeof matchingData !== 'object') return <Paragraph className="text-gray-600">{cleanText(String(matchingData))}</Paragraph>;

    const tableRows: { dimension: string; detail: string; score?: number }[] = [];
    
    try {
      Object.entries(matchingData).forEach(([key, valueObj]) => {
        if (valueObj && typeof valueObj === 'object') {
          Object.entries(valueObj as Record<string, string>).forEach(([subKey, subValue]) => {
            const scoreMatch = String(subValue).match(/(\d+)%|(\d+)分/);
            const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : undefined;
            tableRows.push({
              dimension: subKey,
              detail: String(subValue),
              score
            });
          });
        } else {
          const scoreMatch = String(valueObj).match(/(\d+)%|(\d+)分/);
          const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : undefined;
          tableRows.push({
            dimension: key,
            detail: String(valueObj),
            score
          });
        }
      });
    } catch (e) {
      console.error('解析匹配数据失败:', e);
      return <Paragraph className="text-gray-600">{JSON.stringify(matchingData)}</Paragraph>;
    }

    if (tableRows.length === 0) return null;

    return (
      <div className="overflow-hidden rounded-xl border border-blue-100 shadow-sm mb-4">
        <table className="w-full text-base text-left">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-900 font-bold">
            <tr>
              <th className="px-5 py-4 border-b border-blue-100">评估维度</th>
              <th className="px-5 py-4 border-b border-blue-100">匹配详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {tableRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-5 py-4 font-bold text-gray-800 whitespace-nowrap bg-blue-50/10">
                  <Space size={6}>
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    {cleanText(row.dimension)}
                  </Space>
                </td>
                <td className="px-5 py-4 text-gray-700 leading-relaxed">
                  {row.score !== undefined ? (
                    <div className="flex items-center gap-4">
                      <span className="flex-1 font-medium">{cleanText(row.detail)}</span>
                      <Tag color={row.score >= 80 ? 'success' : row.score >= 60 ? 'processing' : 'warning'} className="m-0 rounded-full border-none px-4 py-0.5 font-bold text-sm">
                        {row.score}%
                      </Tag>
                    </div>
                  ) : <span className="font-medium">{cleanText(row.detail)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSection = (
    title: string, 
    content: any, 
    icon: React.ReactNode, 
    colorClass: string,
    bgClass: string,
    borderClass: string
  ) => {
    if (!content) return null;

    return (
      <div className={`mb-8 p-6 sm:p-8 rounded-3xl border-l-[6px] ${bgClass} ${borderClass} shadow-sm hover:shadow-md transition-all duration-300`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-black flex items-center m-0 ${colorClass} tracking-tight`}>
            <span className="mr-3 text-2xl flex items-center">{icon}</span>
            {title}
          </h3>
        </div>
        
        {title === '岗位匹配度' ? (
          renderMatchingTable(content)
        ) : Array.isArray(content) ? (
          <ul className="space-y-4 m-0 p-0 list-none">
            {content.map((item, index) => (
              <li key={index} className="flex items-start group">
                <div className={`mt-1.5 mr-4 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${colorClass.replace('text-', 'bg-').replace('600', '100')}`}>
                  {index + 1}
                </div>
                <span className="text-gray-800 text-[16px] sm:text-[17px] leading-8 group-hover:text-gray-900 transition-colors font-medium">
                  {cleanText(item)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Paragraph className="text-gray-800 whitespace-pre-wrap leading-8 m-0 text-[17px] font-medium italic opacity-90 px-2 border-l-2 border-gray-200">
            {cleanText(content as string)}
          </Paragraph>
        )}
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4 bg-white rounded-xl">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mr-3 shadow-indigo-200 shadow-lg">
            <RocketOutlined className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 m-0">简历深度分析报告</h2>
            <Text type="secondary" className="text-xs">基于AI智能分析技术生成的实时评估报告</Text>
          </div>
        </div>
        <Tooltip title="复制完整报告">
          <Button 
            icon={<CopyOutlined />} 
            onClick={copyToClipboard}
            className="rounded-full border-gray-200 hover:border-indigo-500 hover:text-indigo-600"
          >
            导出文本
          </Button>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 gap-1">
        {renderSection('岗位匹配度', 岗位匹配度, <PieChartOutlined />, 'text-blue-600', 'bg-blue-50/40', 'border-blue-500')}
        {renderSection('综合评估', 综合评估, <FileTextOutlined />, 'text-purple-600', 'bg-purple-50/40', 'border-purple-500')}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {renderSection('亮点展示', 亮点, <TrophyOutlined />, 'text-emerald-600', 'bg-emerald-50/40', 'border-emerald-500')}
          {renderSection('待改进项', 待改进, <WarningOutlined />, 'text-orange-600', 'bg-orange-50/40', 'border-orange-500')}
        </div>
        
        {renderSection('面试建议', 面试建议, <BulbOutlined />, 'text-cyan-600', 'bg-cyan-50/40', 'border-cyan-500')}
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <Space className="text-gray-400 text-xs">
          <InfoCircleOutlined />
          <span>报告由AI生成，仅供参考，请根据实际情况进行调整。</span>
        </Space>
      </div>
    </div>
  );
};

const ResumeAnalysis = () => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null); // 用于存储原始字符串或错误信息
  const [analysisData, setAnalysisData] = useState<any>(null); // 用于存储解析后的JSON数据
  const [fileList, setFileList] = useState<any[]>([]);

  const onFinish = async (values: any) => {
    setIsSubmitting(true);
    setAnalysisResult(null);
    setAnalysisData(null);
    const { jobRequirements, resumeInfo, resumeFile } = values;

    if (!resumeInfo && (!resumeFile || resumeFile.length === 0)) {
      message.error('请粘贴简历信息或上传简历文件。');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('jobRequirements', jobRequirements);
      formData.append('resumeContent', resumeInfo || '');

      if (resumeFile && resumeFile.length > 0) {
        formData.append('file', resumeFile[0].originFileObj as Blob);
      }

      const response = await axios.post('/api/jianli/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const resultData = response.data;
      
      if (typeof resultData === 'object' && resultData.data) {
        try {
          const innerData = JSON.parse(resultData.data);
          if (innerData && innerData.output) {
            try {
              const finalContent = JSON.parse(innerData.output);
              if (typeof finalContent === 'object' && finalContent.岗位匹配度) {
                setAnalysisData(finalContent);
                setAnalysisResult(null);
              } else {
                setAnalysisResult(JSON.stringify(finalContent, null, 2).replace(/[#*]/g, ''));
                setAnalysisData(null);
              }
            } catch (e) {
              setAnalysisResult(innerData.output.replace(/[#*]/g, ''));
              setAnalysisData(null);
            }
          } else {
            setAnalysisResult(JSON.stringify(innerData, null, 2).replace(/[#*]/g, ''));
            setAnalysisData(null);
          }
        } catch (e) {
          setAnalysisResult(resultData.data.replace(/[#*]/g, ''));
          setAnalysisData(null);
        }
      } else {
        // Fallback for unexpected response structure.
        setAnalysisResult(JSON.stringify(resultData, null, 2));
        setAnalysisData(null);
      }

      message.success('分析成功');
    } catch (error) {
      console.error('分析失败:', error);
      let errorMessage = '分析请求失败，请稍后重试。';
      if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data;
        // 优先尝试解析JSON格式的错误信息
        try {
          const errorJson = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
          if (errorJson && errorJson.error) {
            errorMessage = `错误: ${error.response.status} - ${errorJson.error}`;
          } else {
            throw new Error('Not a valid error JSON');
          }
        } catch (e) {
          // 如果解析JSON失败，回退到处理字符串的逻辑
          if (typeof responseData === 'string' && responseData.includes('401')) {
            errorMessage = '错误：分析服务认证失败，请联系管理员检查API密钥。';
          } else if (typeof responseData === 'string') {
            errorMessage = `错误: ${error.response.status} - ${responseData}`;
          } else {
            errorMessage = `错误: ${error.response.status} - 服务端发生未知错误。`;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = `错误: ${error.message}`;
      }
      setAnalysisResult(errorMessage);
      setAnalysisData(null); // 确保出错时清除数据
      message.error('分析失败，请查看页面提示。');
    }
    setIsSubmitting(false);
  };

  const handleFileChange = ({ fileList }: any) => {
    setFileList(fileList);
    // 当文件上传时，清除简历信息的校验状态
    if (fileList.length > 0) {
      form.setFields([{ name: 'resumeInfo', errors: [] }]);
    }
  };

  return (
    <div className="flex flex-col h-full pt-0 px-4 sm:px-8 pb-4 sm:pb-8 rounded-2xl">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-4 shadow-lg">
          <FileTextOutlined className="text-2xl text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">智能体简历分析</h1>
          <p className="text-sm text-gray-500 m-0">AI智能匹配岗位与简历，提升求职竞争力</p>
        </div>
      </div>
      <Spin spinning={isSubmitting} tip="正在分析中，请稍候...">
        <Form form={form} onFinish={onFinish} layout="vertical" className="resume-form">
          <Card className="mb-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300" headStyle={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)', borderBottom: '2px solid #91d5ff' }} title={<><SolutionOutlined className="mr-2" />岗位要求</>}>
            <Form.Item name="jobRequirements" rules={[{ required: true, message: '请输入岗位要求' }]}>
              <TextArea rows={6} placeholder="请输入岗位的详细要求，例如：&#10;• 所需技能（Python、React等）&#10;• 工作经验要求&#10;• 学历要求&#10;• 其他特殊要求" />
            </Form.Item>
          </Card>

          <Card className="mb-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300" headStyle={{ background: 'linear-gradient(135deg, #f6ffed 0%, #f9f0ff 100%)', borderBottom: '2px solid #b7eb8f' }} title={<><FileTextOutlined className="mr-2" />简历信息</>}>
            <Form.Item name="resumeInfo" rules={[({ getFieldValue }) => ({ validator(_, value) { if (value || getFieldValue('resumeFile')?.length > 0) return Promise.resolve(); return Promise.reject(new Error('请粘贴简历信息或上传简历文件')); }, })]}>
              <TextArea rows={8} placeholder="请在此处粘贴您的简历文本，或使用下方的上传功能。" />
            </Form.Item>
            <Divider style={{ margin: '12px 0' }} />
            <Form.Item name="resumeFile" label="上传简历文件" valuePropName="fileList" getValueFromEvent={(e) => e.fileList}>
              <Upload name="file" fileList={fileList} onChange={handleFileChange} beforeUpload={() => false} maxCount={1} accept=".pdf,.doc,.docx">
                <Button icon={<UploadOutlined />}>点击上传简历 (PDF/Word)</Button>
              </Upload>
            </Form.Item>
          </Card>

          <Form.Item>
            <div className="space-y-3">
              <Button type="primary" htmlType="submit" loading={isSubmitting} icon={<SendOutlined />} size="large" className="w-full h-12 text-base font-medium" style={{ background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', border: 'none' }}>
                开始智能分析
              </Button>
              <Button type="default" onClick={() => { 
                const mockData = { 
                  岗位匹配度: { 
                    核心技能: { 
                      "前端技术": "92% - 精通 React/Vue 及其生态，具备大型项目架构经验", 
                      "后端开发": "85% - 熟练使用 Node.js/Python，了解微服务架构", 
                      "工程化能力": "88% - 熟练掌握 Webpack/Vite 优化及 CI/CD 流程" 
                    },
                    经验背景: {
                      "行业经验": "80% - 3年互联网大厂经验，符合岗位 3-5 年要求",
                      "项目深度": "85% - 曾主导过千万级用户量系统的性能优化"
                    }
                  }, 
                  综合评估: "该候选人是一位资深的前端开发工程师，技术栈非常全面，不仅在前端领域有深厚的积累，同时也具备一定的后端和架构视野。其在大型项目中的性能优化经验是核心优势，非常契合本岗位的技术需求。沟通表达清晰，具备良好的技术领导力潜力。", 
                  亮点: [
                    "技术栈高度匹配，特别是 React 性能优化和架构设计方面", 
                    "具备丰富的高并发、大流量系统实战经验", 
                    "良好的工程化思维，能有效提升团队开发效率",
                    "教育背景优异，计算机相关专业背景扎实"
                  ], 
                  待改进: [
                    "可以进一步强化在云原生和 Kubernetes 方面的实践", 
                    "建议增加在团队管理或跨部门协同方面的案例分享"
                  ], 
                  面试建议: [
                    "重点考察其在性能优化过程中的具体决策逻辑", 
                    "了解其对前端未来趋势（如 WebAssembly, AI-driven UI）的看法",
                    "考察其面对复杂业务场景时的抽象和拆解能力"
                  ] 
                }; 
                setAnalysisData(mockData); 
                setAnalysisResult(null); 
              }} size="large" className="w-full">
                查看图表演示
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Spin>
      {(analysisData || analysisResult) && (
        <div className="mt-8">
          <div className="flex items-center mb-4">
            <BarChartOutlined className="text-xl mr-2" style={{ color: '#1890ff' }} />
            <h2 className="text-xl font-bold text-gray-800 m-0">分析结果</h2>
          </div>
          <div className="mb-6">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <OverallScoreDisplay data={analysisData?.岗位匹配度} />
              </Col>
              <Col xs={24} md={8}>
                <MatchingScoreChart data={analysisData?.岗位匹配度} />
              </Col>
              <Col xs={24} md={8}>
                <DimensionRadarChart data={analysisData?.岗位匹配度} />
              </Col>
            </Row>
          </div>

          <Card 
            className="rounded-2xl shadow-xl overflow-hidden border-none" 
            bodyStyle={{ padding: 0 }}
          >
            <div className="bg-white min-h-[300px]">
              {analysisData ? (
                <FormattedAnalysisResult data={analysisData} />
              ) : analysisResult ? (
                <div className="p-8 sm:p-10">
                  <div className="flex items-center gap-3 mb-6 text-indigo-600">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                      <InfoCircleOutlined className="text-lg" />
                    </div>
                    <span className="text-lg font-bold">分析摘要</span>
                  </div>
                  <div className={`p-8 rounded-2xl border ${analysisResult.startsWith('错误:') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-50 border-gray-100 text-gray-800'} shadow-inner`}>
                    <div className="whitespace-pre-wrap break-words text-[16px] sm:text-[17px] leading-relaxed font-sans tracking-normal opacity-90">
                      {analysisResult}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;