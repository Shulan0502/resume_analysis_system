import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Upload, message, Progress, Row, Col, Tag, List, Timeline, Skeleton, Spin } from 'antd';
import { UploadOutlined, PlayCircleOutlined, PauseCircleOutlined, CameraOutlined, VideoCameraOutlined, SmileOutlined, FrownOutlined, MehOutlined, MessageOutlined, BulbOutlined, SafetyCertificateOutlined, RocketOutlined, LoadingOutlined, CloseCircleOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import Webcam from 'react-webcam';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';


const { Dragger: UploadDragger } = Upload;

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

const cardHoverEffect = {
  scale: 1.02,
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  transition: { duration: 0.3 }
};

// 自定义提示卡片组件
const TipCard: React.FC<{ icon: React.ReactNode, title: string, content: string, type: 'success' | 'info' | 'warning' }> = ({ icon, title, content, type }) => {
  const bgColors = {
    success: 'bg-green-50 border-green-100',
    info: 'bg-blue-50 border-blue-100',
    warning: 'bg-amber-50 border-amber-100'
  };
  const iconColors = {
    success: 'text-green-600',
    info: 'text-blue-600',
    warning: 'text-amber-600'
  };

  return (
    <motion.div 
      variants={itemVariants}
      className={`p-4 rounded-xl border ${bgColors[type]} mb-4 flex items-start space-x-3 shadow-sm min-h-[96px]`}
    >
      <div className={`mt-1 text-lg ${iconColors[type]}`}>{icon}</div>
      <div>
        <div className="font-bold text-gray-800 text-sm mb-1">{title}</div>
        <div className="text-xs text-gray-600 leading-relaxed">{content}</div>
      </div>
    </motion.div>
  );
};

interface InterviewEmotionResult {
  timestamp: number;
  confidence: number;
  nervousness: number; // 紧张度 0-100
  engagement: number; // 参与度 0-100
  professionalism: number; // 专业度 0-100
  authenticity: number; // 真诚度 0-100
  overallMood: 'positive' | 'neutral' | 'negative'; // 整体情绪
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
  overallScore: number; // 整体表现评分 0-100
  strengthAreas: string[]; // 优势领域
  improvementAreas: string[]; // 需要改进的领域
  recommendations: string[]; // 建议
  duration: number;
  keyMoments: {
    timestamp: number;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
  }[];
}

// 分析阶段类型
type AnalysisStage = 'uploading' | 'analyzing' | 'generating' | 'completed';

// 分析阶段配置
const stageConfig: Record<AnalysisStage, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  uploading: {
    label: '上传视频',
    description: '正在将视频文件传输到服务器...',
    icon: <UploadOutlined />,
    color: '#3b82f6'
  },
  analyzing: {
    label: 'AI 分析中',
    description: '正在分析面部表情、情绪状态、专业度等维度...',
    icon: <EyeOutlined />,
    color: '#8b5cf6'
  },
  generating: {
    label: '生成报告',
    description: '正在整理分析结果，生成专业反馈报告...',
    icon: <FileTextOutlined />,
    color: '#10b981'
  },
  completed: {
    label: '分析完成',
    description: '报告已生成，请查看下方结果',
    icon: <SafetyCertificateOutlined />,
    color: '#52c41a'
  }
};

// 骨架屏组件
const ResultSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="mt-12 space-y-8"
  >
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <div className="flex items-center space-x-3 mb-8">
        <Skeleton.Avatar active size="large" shape="square" />
        <Skeleton.Input active style={{ width: 250 }} />
      </div>
      <Row gutter={[32, 32]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <div className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100">
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
            </div>
          </Col>
        ))}
      </Row>
    </Card>
    <Row gutter={[32, 32]}>
      <Col xs={24} lg={12}>
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </Col>
    </Row>
    <Card>
      <Skeleton active paragraph={{ rows: 3 }} />
    </Card>
  </motion.div>
);

// 分析进度组件
const AnalysisProgress: React.FC<{
  stage: AnalysisStage;
  progress: number;
  onCancel: () => void;
}> = ({ stage, progress, onCancel }) => {
  const config = stageConfig[stage];
  const stageOrder: AnalysisStage[] = ['uploading', 'analyzing', 'generating', 'completed'];
  const currentStageIndex = stageOrder.indexOf(stage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">正在分析面试视频</h3>
            <p className="text-sm text-gray-500">AI 正在深度分析您的面试表现，请稍候...</p>
          </div>
          <Button
            type="text"
            icon={<CloseCircleOutlined />}
            onClick={onCancel}
            className="text-gray-400 hover:text-red-500"
          >
            取消
          </Button>
        </div>

        {/* 阶段指示器 */}
        <div className="flex justify-between mb-8">
          {stageOrder.slice(0, 3).map((s, index) => {
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            return (
              <div key={s} className="flex flex-col items-center flex-1">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isCompleted ? '#10b981' : isActive ? config.color : '#e5e7eb'
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white mb-2"
                >
                  {isCompleted ? (
                    <SafetyCertificateOutlined />
                  ) : (
                    stageConfig[s].icon
                  )}
                </motion.div>
                <span className={`text-xs font-medium ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                  {stageConfig[s].label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 当前阶段详情 */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Spin indicator={<LoadingOutlined style={{ color: config.color }} spin />} />
            <span className="font-bold text-gray-800" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">{config.description}</p>
          <Progress
            percent={progress}
            showInfo={false}
            strokeColor={{ '0%': config.color, '100%': config.color }}
            strokeWidth={8}
            className="m-0"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">进度</span>
            <span className="text-xs font-bold" style={{ color: config.color }}>{progress}%</span>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="flex items-start space-x-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-xl">
          <BulbOutlined className="text-blue-500 mt-0.5" />
          <span>分析过程通常需要 30-60 秒，取决于视频长度。您可以关闭此窗口，分析完成后会自动显示结果。</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

const InterviewVideoAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>('uploading');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<InterviewAnalysisResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<InterviewEmotionResult | null>(null);
  const [showAnalysisData, setShowAnalysisData] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 模拟实时面试表情分析
  const simulateInterviewAnalysis = useCallback(() => {
    const nervousness = Math.random() * 40 + 10; // 10-50
    const engagement = Math.random() * 30 + 70; // 70-100
    const professionalism = Math.random() * 20 + 75; // 75-95
    const authenticity = Math.random() * 25 + 70; // 70-95
    
    const analysis: InterviewEmotionResult = {
      timestamp: Date.now(),
      confidence: Math.random() * 0.3 + 0.7, // 70-100%
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
  React.useEffect(() => {
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
  React.useEffect(() => {
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

  // 生成模拟的面试分析结果
  const generateMockInterviewResult = (): InterviewAnalysisResult => {
    const emotions: InterviewEmotionResult[] = [];
    const duration = 120; // 2分钟示例
    
    for (let i = 0; i < 24; i++) { // 每5秒一个数据点
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

  // 取消分析
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setAnalysisStage('uploading');
    setProgress(0);
    setShowSkeleton(false);
    message.info('已取消分析');
  }, []);

  // 模拟阶段进度
  const simulateStageProgress = useCallback((stage: AnalysisStage, duration: number) => {
    return new Promise<void>((resolve) => {
      setAnalysisStage(stage);
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const stageProgress = Math.min((elapsed / duration) * 100, 100);
        
        // 根据阶段设置整体进度
        const stageWeights: Record<Exclude<AnalysisStage, 'completed'>, number> = { uploading: 0.3, analyzing: 0.5, generating: 0.2 };
        const stageOrder: Exclude<AnalysisStage, 'completed'>[] = ['uploading', 'analyzing', 'generating'];
        const currentStageIndex = stageOrder.indexOf(stage as Exclude<AnalysisStage, 'completed'>);
        let totalProgress = 0;
        
        for (let i = 0; i < currentStageIndex; i++) {
          totalProgress += stageWeights[stageOrder[i]] * 100;
        }
        totalProgress += stageWeights[stage as Exclude<AnalysisStage, 'completed'>] * stageProgress;
        
        setProgress(Math.round(totalProgress));
        
        if (stageProgress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }, []);

  // 上传视频文件分析
  const handleUpload = async (file: File) => {
    if (!file) return false;

    const isVideo = file.type.startsWith('video/');
    if (!isVideo) {
      message.error('只能上传视频文件！');
      return false;
    }

    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      message.error('视频文件大小不能超过100MB！');
      return false;
    }

    setIsAnalyzing(true);
    setAnalysisStage('uploading');
    setProgress(0);
    setResult(null);
    setShowSkeleton(false);

    // 创建 AbortController 用于取消请求
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('video', file);

      // 阶段1: 上传视频
      await simulateStageProgress('uploading', 2000);

      const response = await axios.post('/api/video/analyze-interview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // 上传占30%进度
            setProgress(Math.min(Math.round(percentCompleted * 0.3), 30));
          }
        },
      });

      // 阶段2: AI分析
      await simulateStageProgress('analyzing', 3000);

      // 阶段3: 生成报告
      await simulateStageProgress('generating', 1500);

      setAnalysisStage('completed');
      setProgress(100);
      setResult(response.data);
      setShowSkeleton(true);
      
      // 延迟显示骨架屏，然后显示结果
      setTimeout(() => {
        setShowSkeleton(false);
        setIsAnalyzing(false);
        message.success('面试视频分析完成！');
      }, 800);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled');
        return false;
      }
      
      message.error('视频分析失败，使用模拟数据显示');
      console.error('Error analyzing video:', error);
      
      // 如果API失败，使用模拟数据
      await simulateStageProgress('analyzing', 2000);
      await simulateStageProgress('generating', 1000);
      
      const mockResult = generateMockInterviewResult();
      setAnalysisStage('completed');
      setProgress(100);
      setResult(mockResult);
      setShowSkeleton(true);
      
      setTimeout(() => {
        setShowSkeleton(false);
        setIsAnalyzing(false);
      }, 800);
    }

    return false;
  };

  // 分析录制的视频
  const analyzeRecordedVideo = async () => {
    if (recordedChunks.length === 0) {
      message.warning('请先录制面试视频');
      return;
    }

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const file = new File([blob], 'interview-recording.webm', { type: 'video/webm' });
    await handleUpload(file);
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
      className="p-6 max-w-7xl mx-auto"
    >
      {/* 分析进度弹窗 */}
      <AnimatePresence>
        {isAnalyzing && (
          <AnalysisProgress
            stage={analysisStage}
            progress={progress}
            onCancel={cancelAnalysis}
          />
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          模拟面试分析智能体
        </h1>
        <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          依托先进 AI 技术深度分析面试表现，为您提供全方位的专业反馈与进阶建议
        </p>
      </motion.div>
      
      <Row gutter={[32, 32]} className="mb-6">
        <Col xs={24} lg={8}>
          <TipCard 
            icon={<BulbOutlined />}
            title="使用建议"
            content="为了获得最准确的分析结果，建议：1. 确保光线充足 2. 保持自然坐姿 3. 时长1-5分钟 4. 模拟真实场景练习"
            type="success"
          />
        </Col>
        <Col xs={24} lg={8}>
          <TipCard 
            icon={<SafetyCertificateOutlined />}
            title="专业面试分析"
            content="分析您的表情、情绪状态、专业度等多个维度，并提供针对性的改进建议。"
            type="info"
          />
        </Col>
        <Col xs={24} lg={8}>
          <TipCard 
            icon={<RocketOutlined />}
            title="互动问答练习"
            content="模拟真实面试对话，实时反馈应答表现，助力攻克各类高频面试考题。"
            type="warning"
          />
        </Col>
      </Row>

      <Row gutter={[32, 32]} align="stretch">
        {/* 模拟面试录制 */}
        <Col xs={24} lg={8} className="flex flex-col">
          <motion.div 
            variants={itemVariants}
            whileHover={cardHoverEffect}
            className="flex-1"
          >
            <Card 
              title={
                <div className="flex items-center space-x-2 py-1">
                  <VideoCameraOutlined className="text-blue-500" />
                  <span>模拟面试录制</span>
                </div>
              } 
              className="h-[610px] flex flex-col shadow-sm border-gray-100 rounded-2xl overflow-hidden"
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}
            >
              {!isWebcamActive ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                    <VideoCameraOutlined style={{ fontSize: '36px', color: '#3b82f6' }} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">实时模拟面试评测</h3>
                  <p className="text-gray-500 text-center mb-8 px-4 text-sm leading-relaxed">
                    通过摄像头进行实时面试模拟，AI 将深度解析您的表情变化、情绪状态及职场专业度。
                  </p>
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<CameraOutlined />}
                    onClick={() => navigate('/mock-interview-record')}
                    className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 border-none shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    开启模拟面试评测
                  </Button>
                </div>
              ) : (
                <div className="relative flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-gray-500">设备就绪</span>
                    </div>
                    <Button
                      size="small"
                      danger
                      type="text"
                      icon={<PauseCircleOutlined />}
                      onClick={() => setIsWebcamActive(false)}
                      className="hover:bg-red-50 rounded-lg"
                    >
                      关闭
                    </Button>
                  </div>
                  
                  <div className="overflow-hidden rounded-2xl shadow-xl bg-gray-900 aspect-video mb-4 relative">
                    <Webcam
                      ref={webcamRef}
                      audio={true}
                      className="w-full h-full object-cover"
                      videoConstraints={{ aspectRatio: 1.7777777778 }}
                    />
                    {isRecording && (
                      <div className="absolute top-4 left-4 flex items-center bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                        <span className="text-white text-xs font-mono">{formatTime(recordingTime)}</span>
                      </div>
                    )}
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {isWebcamActive && currentAnalysis && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4"
                      >
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">实时分析报告</h4>
                        <Row gutter={[12, 12]}>
                          {[
                            { label: '参与度', key: 'engagement', value: currentAnalysis.engagement, color: getScoreColor(currentAnalysis.engagement) },
                            { label: '冷静度', key: 'calmness', value: 100 - currentAnalysis.nervousness, color: getScoreColor(100 - currentAnalysis.nervousness) },
                            { label: '专业度', key: 'professionalism', value: currentAnalysis.professionalism, color: getScoreColor(currentAnalysis.professionalism) },
                            { label: '整体状态', key: 'mood', isIcon: true }
                          ].map((stat, idx) => (
                            <Col span={12} key={idx}>
                              <div className="bg-white p-2 rounded-lg border border-gray-50 text-center shadow-sm">
                                {showAnalysisData ? (
                                  <div className="text-base font-bold mb-0.5" style={{ color: stat.isIcon ? 'inherit' : stat.color }}>
                                    {stat.isIcon ? getMoodIcon(currentAnalysis.overallMood) : `${(stat.value ?? 0).toFixed(0)}%`}
                                  </div>
                                ) : (
                                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                                )}
                                <div className="text-[10px] text-gray-400 font-medium">{stat.label}</div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="mt-auto flex space-x-3">
                    {!isRecording ? (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={startRecording}
                        className="flex-1 h-11 rounded-xl font-bold bg-green-500 hover:bg-green-600 border-none shadow-md"
                      >
                        开始录制
                      </Button>
                    ) : (
                      <Button
                        danger
                        icon={<PauseCircleOutlined />}
                        onClick={stopRecording}
                        className="flex-1 h-11 rounded-xl font-bold shadow-md"
                      >
                        停止录制
                      </Button>
                    )}
                    {recordedChunks.length > 0 && (
                      <Button
                        type="default"
                        onClick={analyzeRecordedVideo}
                        disabled={isAnalyzing}
                        className="flex-1 h-11 rounded-xl font-bold border-blue-200 text-blue-600 hover:text-blue-700 hover:border-blue-300"
                      >
                        分析表现
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </Col>

        {/* 视频上传 */}
        <Col xs={24} lg={8} className="flex flex-col">
          <motion.div 
            variants={itemVariants}
            whileHover={cardHoverEffect}
            className="flex-1"
          >
            <Card 
              title={
                <div className="flex items-center space-x-2 py-1">
                  <UploadOutlined className="text-blue-500" />
                  <span>上传面试视频</span>
                </div>
              }
              className="h-[610px] flex flex-col shadow-sm border-gray-100 rounded-2xl overflow-hidden"
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}
            >
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                  <UploadOutlined style={{ fontSize: '36px', color: '#6366f1' }} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">深度离线分析</h3>
                <p className="text-gray-500 text-center mb-6 px-4 text-sm leading-relaxed">
                  如果您已有录制的面试视频，直接上传即可获取专业 AI 深度反馈报告。
                </p>
                <div className="w-full mt-4">
                  <UploadDragger
                    name="video"
                    multiple={false}
                    beforeUpload={handleUpload}
                    accept="video/*"
                    disabled={isAnalyzing}
                    style={{ 
                      borderRadius: '16px', 
                      background: '#f8fafc',
                      border: '2px dashed #e2e8f0',
                    }}
                  >
                    <div className="py-6">
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined style={{ fontSize: '32px', color: '#3b82f6', opacity: 0.6 }} />
                      </p>
                      <p className="text-blue-600 font-bold text-sm mb-1">点击或拖拽视频文件</p>
                      <p className="text-[11px] text-gray-400">支持 MP4, AVI, MOV 等格式 (不超过 100MB)</p>
                    </div>
                  </UploadDragger>
                </div>
              </div>

              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100"
                  >
                    <div className="flex justify-between text-xs font-bold text-blue-600 mb-2">
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
          </motion.div>
        </Col>

        {/* 模拟面试问答 */}
        <Col xs={24} lg={8} className="flex flex-col">
          <motion.div 
            variants={itemVariants}
            whileHover={cardHoverEffect}
            className="flex-1"
          >
            <Card 
              title={
                <div className="flex items-center space-x-2 py-1">
                  <MessageOutlined className="text-amber-500" />
                  <span>模拟面试问答</span>
                </div>
              }
              className="h-[610px] flex flex-col shadow-sm border-gray-100 rounded-2xl overflow-hidden"
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}
            >
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                  <MessageOutlined style={{ fontSize: '36px', color: '#f59e0b' }} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">AI 互动对练</h3>
                <p className="text-gray-500 text-center mb-8 px-4 text-sm leading-relaxed">
                  通过文字或语音与 AI 面试官进行实时互动，在实战中磨炼您的表达与逻辑技巧。
                </p>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<RocketOutlined />}
                  onClick={() => navigate('/mock-interview-qa')}
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 border-none shadow-lg shadow-amber-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  开启模拟问答
                </Button>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* 骨架屏 - 分析结果加载中 */}
      <AnimatePresence>
        {showSkeleton && <ResultSkeleton />}
      </AnimatePresence>

      {/* 分析结果 */}
      <AnimatePresence>
        {result && !showSkeleton && (
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
                  { title: '整体评分', value: result.overallScore, suffix: '/100', color: getScoreColor(result.overallScore), icon: <RocketOutlined /> },
                  { title: '分析时长', value: result.duration, suffix: '秒', color: '#8b5cf6', icon: <PlayCircleOutlined /> },
                  { title: '数据采样点', value: result.emotions.length, suffix: '个', color: '#06b6d4', icon: <CameraOutlined /> },
                  { title: '关键时刻', value: result.keyMoments.length, suffix: '处', color: '#ec4899', icon: <BulbOutlined /> }
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
  );
};

export default InterviewVideoAnalysis;