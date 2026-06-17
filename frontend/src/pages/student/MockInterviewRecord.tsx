import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, message, Row, Col, Progress, Typography, List, Tag, Timeline } from 'antd';
import { 
  VideoCameraOutlined, 
  CameraOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  ArrowLeftOutlined,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  BulbOutlined
} from '@ant-design/icons';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text } = Typography;

// 动画变体配置
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface InterviewEmotionResult {
  timestamp: number;
  confidence: number;
  nervousness: number;
  engagement: number;
  professionalism: number;
  authenticity: number;
  overallMood: 'positive' | 'neutral' | 'negative';
  specificEmotions: {
    confident: number;
    nervous: number;
    enthusiastic: number;
    calm: number;
    focused: number;
    hesitant: number;
  };
}

interface InterviewAnalysisResult {
  emotions: InterviewEmotionResult[];
  overallScore: number;
  strengthAreas: string[];
  improvementAreas: string[];
  recommendations: string[];
  duration: number;
  keyMoments: {
    timestamp: number;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
  }[];
}

// 生成模拟的面试分析结果
const generateMockInterviewResult = (): InterviewAnalysisResult => {
  const emotions: InterviewEmotionResult[] = [];
  const duration = 120;
  
  for (let i = 0; i < 24; i++) {
    const timestamp = i * 5;
    const nervousness = Math.max(0, Math.min(100, 40 + Math.sin(i * 0.3) * 15));
    const engagement = Math.max(60, Math.min(100, 85 + Math.cos(i * 0.2) * 10));
    
    emotions.push({
      timestamp,
      confidence: 0.85 + Math.random() * 0.1,
      nervousness,
      engagement,
      professionalism: 80 + Math.random() * 15,
      authenticity: 75 + Math.random() * 20,
      overallMood: engagement > 80 ? 'positive' : engagement > 65 ? 'neutral' : 'negative',
      specificEmotions: {
        confident: 70 + Math.random() * 25,
        nervous: nervousness,
        enthusiastic: engagement,
        calm: 100 - nervousness,
        focused: 80 + Math.random() * 15,
        hesitant: 20 + Math.random() * 20
      }
    });
  }

  return {
    emotions,
    overallScore: 82,
    strengthAreas: [
      '良好的眼神交流',
      '表达清晰自然',
      '专业形象良好',
      '回答问题时保持冷静'
    ],
    improvementAreas: [
      '可以适当降低紧张情绪',
      '增强回答的热情度',
      '手势表达可以更加自然'
    ],
    recommendations: [
      '建议在面试前进行深呼吸练习，有助于缓解紧张',
      '可以通过微笑和适当的手势来增强表达的亲和力',
      '回答问题时可以稍微放慢语速，显得更加从容',
      '准备一些具体的例子来支撑你的回答，增加说服力'
    ],
    duration,
    keyMoments: [
      { timestamp: 15, description: '开始时略显紧张，这是正常的', type: 'neutral' },
      { timestamp: 45, description: '回答技术问题时表现自信', type: 'positive' },
      { timestamp: 78, description: '讨论项目经验时非常投入', type: 'positive' },
      { timestamp: 95, description: '回答挑战性问题时有些犹豫', type: 'negative' },
      { timestamp: 110, description: '结束时表现专业', type: 'positive' }
    ]
  };
};

const MockInterviewRecord: React.FC = () => {
  const navigate = useNavigate();
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<InterviewEmotionResult | null>(null);
  const [showAnalysisData, setShowAnalysisData] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<InterviewAnalysisResult | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 模拟实时面试表情分析
  const simulateInterviewAnalysis = useCallback(() => {
    const nervousness = Math.random() * 40 + 10;
    const engagement = Math.random() * 30 + 70;
    const professionalism = Math.random() * 20 + 75;
    const authenticity = Math.random() * 25 + 70;
    
    const analysis: InterviewEmotionResult = {
      timestamp: Date.now(),
      confidence: Math.random() * 0.3 + 0.7,
      nervousness,
      engagement,
      professionalism,
      authenticity,
      overallMood: engagement > 80 ? 'positive' : engagement > 60 ? 'neutral' : 'negative',
      specificEmotions: {
        confident: Math.random() * 30 + 60,
        nervous: nervousness,
        enthusiastic: engagement,
        calm: 100 - nervousness,
        focused: Math.random() * 20 + 75,
        hesitant: Math.random() * 30 + 10
      }
    };
    
    setCurrentAnalysis(analysis);
  }, []);

  // 开始实时检测
  useEffect(() => {
    if (isWebcamActive) {
      simulateInterviewAnalysis();
      const timer = setTimeout(() => setShowAnalysisData(true), 2000);
      const interval = setInterval(simulateInterviewAnalysis, 3000);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
        setShowAnalysisData(false);
      };
    }
  }, [isWebcamActive, simulateInterviewAnalysis]);

  // 录制计时器
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setRecordingTime(0);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  // 开始录制
  const startRecording = useCallback(() => {
    if (!webcamRef.current) return;

    const stream = webcamRef.current.video?.srcObject as MediaStream;
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorderRef.current = mediaRecorder;
    setRecordedChunks([]);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      message.success('面试录制完成，可以进行专业分析').then(() => {});
    };

    mediaRecorder.start();
    setIsRecording(true);
    message.success('开始录制面试视频');
  }, []);

  // 停止录制
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // 分析录制的视频
  const analyzeRecordedVideo = async () => {
    if (recordedChunks.length === 0) {
      message.warning('请先录制面试视频');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    // 模拟分析进度
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    // 模拟分析完成
    setTimeout(() => {
      const mockResult = generateMockInterviewResult();
      setProgress(100);
      setResult(mockResult);
      setIsAnalyzing(false);
      message.success('面试视频分析完成！');
      clearInterval(progressInterval);
    }, 3000);
  };

  // 修改formatTime函数，支持小数点后两位
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2).padStart(5, '0');
    return `${mins.toString().padStart(2, '0')}:${secs}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'positive': return <SmileOutlined style={{ color: '#52c41a' }} />;
      case 'negative': return <FrownOutlined style={{ color: '#ff4d4f' }} />;
      default: return <MehOutlined style={{ color: '#faad14' }} />;
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 max-w-6xl mx-auto"
    >
      {/* 顶部导航 */}
      <motion.div variants={itemVariants} className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/interview-video-analysis')}
          className="rounded-xl"
        >
          返回
        </Button>
      </motion.div>

      {/* 页面标题 */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <Title level={2} className="mb-2">
          <VideoCameraOutlined className="text-blue-500 mr-3" />
          模拟面试评测
        </Title>
        <Text className="text-gray-500">
          通过摄像头进行实时面试模拟，AI 将深度解析您的表情变化、情绪状态及职场专业度
        </Text>
      </motion.div>

      {!isWebcamActive ? (
        /* 初始状态 - 开启摄像头 */
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-16">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
            <VideoCameraOutlined style={{ fontSize: '56px', color: '#3b82f6' }} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">准备开始模拟面试</h3>
          <p className="text-gray-500 text-center mb-8 px-4 text-base leading-relaxed max-w-lg">
            为了获得最准确的分析结果，建议：
            <br />1. 确保光线充足 2. 保持自然坐姿 3. 时长1-5分钟 4. 模拟真实场景练习
          </p>
          <Button 
            type="primary" 
            size="large" 
            icon={<CameraOutlined />}
            onClick={() => setIsWebcamActive(true)}
            className="h-14 px-12 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 border-none shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all text-lg"
          >
            开启摄像头
          </Button>
        </motion.div>
      ) : (
        /* 摄像头已开启 - 录制界面 */
        <motion.div variants={itemVariants}>
          <Row gutter={[24, 24]} align="stretch">
            {/* 左侧 - 视频区域 */}
            <Col xs={24} lg={16} className="flex flex-col">
              <Card 
                className="shadow-lg border-0 rounded-2xl overflow-hidden flex-1 h-full"
                bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-gray-500">设备就绪</span>
                  </div>
                  <Button
                    danger
                    type="text"
                    icon={<PauseCircleOutlined />}
                    onClick={() => setIsWebcamActive(false)}
                    className="hover:bg-red-50 rounded-lg"
                  >
                    关闭摄像头
                  </Button>
                </div>
                
                <div className="overflow-hidden rounded-2xl shadow-xl bg-gray-900 aspect-video mb-6 relative">
                  <Webcam
                    ref={webcamRef}
                    audio={true}
                    className="w-full h-full object-cover"
                    videoConstraints={{ aspectRatio: 1.7777777778 }}
                  />
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                      <span className="text-white text-sm font-mono">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>
                
                {/* 录制控制按钮 */}
                <div className="flex space-x-4">
                  {!isRecording ? (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={startRecording}
                      size="large"
                      className="flex-1 h-12 rounded-xl font-bold bg-green-500 hover:bg-green-600 border-none shadow-md text-lg"
                    >
                      开始录制
                    </Button>
                  ) : (
                    <Button
                      danger
                      icon={<PauseCircleOutlined />}
                      onClick={stopRecording}
                      size="large"
                      className="flex-1 h-12 rounded-xl font-bold shadow-md text-lg"
                    >
                      停止录制
                    </Button>
                  )}
                  {recordedChunks.length > 0 && (
                    <Button
                      type="default"
                      onClick={analyzeRecordedVideo}
                      disabled={isAnalyzing}
                      size="large"
                      className="flex-1 h-12 rounded-xl font-bold border-blue-200 text-blue-600 hover:text-blue-700 hover:border-blue-300 text-lg"
                    >
                      分析表现
                    </Button>
                  )}
                </div>

                {/* 分析进度 */}
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100"
                    >
                      <div className="flex justify-between text-sm font-bold text-blue-600 mb-2">
                        <span>正在分析视频特征...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress 
                        percent={progress} 
                        showInfo={false}
                        status="active" 
                        strokeColor={{ '0%': '#3b82f6', '100%': '#6366f1' }}
                        strokeWidth={6}
                        className="m-0"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </Col>

            {/* 右侧 - 实时分析 */}
            <Col xs={24} lg={8} className="flex flex-col">
              <AnimatePresence mode="wait">
                {isWebcamActive && currentAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <Card 
                      className="shadow-lg border-0 rounded-2xl h-full flex-1"
                      bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                      title={
                        <div className="flex items-center space-x-2">
                          <SafetyCertificateOutlined className="text-blue-500" />
                          <span className="font-semibold">实时分析报告</span>
                        </div>
                      }
                    >
                      <div className="space-y-4">
                        {[
                          { label: '参与度', key: 'engagement', value: currentAnalysis.engagement, color: getScoreColor(currentAnalysis.engagement) },
                          { label: '冷静度', key: 'calmness', value: 100 - currentAnalysis.nervousness, color: getScoreColor(100 - currentAnalysis.nervousness) },
                          { label: '专业度', key: 'professionalism', value: currentAnalysis.professionalism, color: getScoreColor(currentAnalysis.professionalism) },
                          { label: '真诚度', key: 'authenticity', value: currentAnalysis.authenticity, color: getScoreColor(currentAnalysis.authenticity) },
                          { label: '整体状态', key: 'mood', isIcon: true }
                        ].map((stat, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 font-medium">{stat.label}</span>
                              {showAnalysisData ? (
                                <div className="text-2xl font-bold" style={{ color: stat.isIcon ? 'inherit' : stat.color }}>
                                  {stat.isIcon ? getMoodIcon(currentAnalysis.overallMood) : `${(stat.value as number).toFixed(0)}%`}
                                </div>
                              ) : (
                                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 建议提示 */}
                      <div className="mt-auto p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex items-start space-x-2">
                          <RocketOutlined className="text-amber-500 mt-1" />
                          <div className="text-sm text-gray-700">
                            <p className="font-semibold mb-1">小贴士</p>
                            <p className="text-gray-500">保持眼神交流，微笑面对镜头，展现自信专业的形象。</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </Col>
          </Row>

          {/* 分析结果 */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mt-12 space-y-8"
              >
                <Card 
                  className="border-none shadow-xl shadow-blue-50/50 rounded-3xl overflow-hidden"
                  bodyStyle={{ padding: '32px' }}
                >
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <SafetyCertificateOutlined className="text-white text-xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">面试表现深度分析报告</h2>
                  </div>
                  
                  <Row gutter={[32, 32]}>
                    {[
                      { title: '整体评分', value: result.overallScore, suffix: '/100', color: getScoreColor(result.overallScore) },
                      { title: '分析时长', value: result.duration, suffix: '秒', color: '#8b5cf6' },
                      { title: '数据采样点', value: result.emotions.length, suffix: '个', color: '#06b6d4' },
                      { title: '关键时刻', value: result.keyMoments.length, suffix: '处', color: '#ec4899' }
                    ].map((stat, idx) => (
                      <Col xs={24} sm={12} md={6} key={idx}>
                        <div className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 flex flex-col items-center text-center">
                          <div className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">{stat.title}</div>
                          <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>
                            {stat.value}<span className="text-base ml-1 opacity-60 font-medium">{stat.suffix}</span>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card>

                <Row gutter={[32, 32]}>
                  <Col xs={24} lg={12}>
                    <Card 
                      title={<div className="font-bold flex items-center"><SmileOutlined className="text-green-500 mr-2" /> 优势表现</div>} 
                      className="h-full rounded-2xl border-gray-100 shadow-sm"
                    >
                      <List
                        dataSource={result.strengthAreas}
                        renderItem={(item) => (
                          <List.Item className="border-none px-0 py-2">
                            <div className="flex items-center bg-green-50/50 px-4 py-3 rounded-xl border border-green-100/50 w-full">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                              <span className="text-gray-700 font-medium">{item}</span>
                            </div>
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card 
                      title={<div className="font-bold flex items-center"><BulbOutlined className="text-amber-500 mr-2" /> 待改进项</div>} 
                      className="h-full rounded-2xl border-gray-100 shadow-sm"
                    >
                      <List
                        dataSource={result.improvementAreas}
                        renderItem={(item) => (
                          <List.Item className="border-none px-0 py-2">
                            <div className="flex items-center bg-amber-50/50 px-4 py-3 rounded-xl border border-amber-100/50 w-full">
                              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3" />
                              <span className="text-gray-700 font-medium">{item}</span>
                            </div>
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card 
                  title={<div className="font-bold">💡 专家深度建议</div>} 
                  className="rounded-2xl border-gray-100 shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.recommendations.map((item, index) => (
                      <div key={index} className="flex items-start p-4 rounded-xl bg-blue-50/30 border border-blue-100/30">
                        <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-4 mt-0.5 shrink-0 shadow-md">
                          {index + 1}
                        </div>
                        <span className="text-gray-700 leading-relaxed text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card 
                  title={<div className="font-bold">⏰ 面试关键时刻回顾</div>} 
                  className="rounded-2xl border-gray-100 shadow-sm"
                  bodyStyle={{ padding: '32px' }}
                >
                  <Timeline
                    mode="left"
                    items={result.keyMoments.map(moment => ({
                      color: moment.type === 'positive' ? '#10b981' : moment.type === 'negative' ? '#ef4444' : '#3b82f6',
                      children: (
                        <div className="pb-6 pl-2">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                              {formatTime(moment.timestamp)}
                            </span>
                            <Tag 
                              color={moment.type === 'positive' ? 'success' : moment.type === 'negative' ? 'error' : 'processing'}
                              className="rounded-full border-none px-3 font-bold text-[10px]"
                            >
                              {moment.type === 'positive' ? '表现优秀' : moment.type === 'negative' ? '需注意' : '平稳'}
                            </Tag>
                          </div>
                          <div className="text-gray-800 font-semibold mb-1">{moment.description}</div>
                        </div>
                      )
                    }))}
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MockInterviewRecord;
