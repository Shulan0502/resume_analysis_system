import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Tag, message, Progress, Typography, Badge } from 'antd';
import { 
  AudioOutlined, 
  SendOutlined, 
  EyeOutlined, 
  ArrowRightOutlined, 
  ArrowLeftOutlined,
  MessageOutlined,
  BookOutlined,
  CheckCircleOutlined,
  SoundOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text } = Typography;

// 面试问题数据结构
interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  referenceAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// 预设问题库
const interviewQuestions: InterviewQuestion[] = [
  {
    id: '1',
    category: '技术类',
    question: '请介绍一下 React 的生命周期方法，以及它们在什么场景下使用？',
    referenceAnswer: 'React 生命周期分为三个阶段：\n1. 挂载阶段：constructor、getDerivedStateFromProps、render、componentDidMount\n2. 更新阶段：getDerivedStateFromProps、shouldComponentUpdate、render、getSnapshotBeforeUpdate、componentDidUpdate\n3. 卸载阶段：componentWillUnmount\n\n常用场景：\n- componentDidMount：发起网络请求、添加事件监听\n- componentDidUpdate：根据props变化更新状态\n- componentWillUnmount：清理定时器、取消订阅',
    difficulty: 'medium'
  },
  {
    id: '2',
    category: '行为类',
    question: '请描述一次你解决团队冲突的经历，你是如何处理的？',
    referenceAnswer: '回答要点：\n1. 描述具体情境：项目背景、冲突原因\n2. 说明你的行动：如何沟通、协调双方\n3. 展示结果：冲突如何化解、项目结果如何\n4. 反思总结：学到了什么、如何改进\n\n示例结构：\n"在上一个项目中，两位同事对技术方案有不同意见...我组织了技术评审会议...最终我们达成了共识...项目按时交付..."',
    difficulty: 'medium'
  },
  {
    id: '3',
    category: '项目经验',
    question: '请详细介绍你最有成就感的一个项目，你在其中扮演了什么角色？',
    referenceAnswer: '回答结构（STAR法则）：\n1. Situation（情境）：项目背景、目标\n2. Task（任务）：你的具体职责\n3. Action（行动）：你采取的关键步骤\n4. Result（结果）：量化成果、个人贡献\n\n重点突出：\n- 技术挑战和解决方案\n- 团队协作经验\n- 个人成长和收获',
    difficulty: 'medium'
  },
  {
    id: '4',
    category: '职业规划',
    question: '你未来三年的职业规划是什么？',
    referenceAnswer: '回答要点：\n1. 短期目标（1年）：快速融入团队、掌握核心技术栈\n2. 中期目标（2-3年）：成为技术专家或团队负责人\n3. 长期愿景：与公司发展方向一致\n\n示例：\n"第一年我希望快速适应工作环境，成为独当一面的开发工程师；第二到三年，我希望能够在某个技术领域深入钻研，同时培养团队协作能力；长期来看，我希望能够成长为技术负责人，带领团队完成更有挑战性的项目。"',
    difficulty: 'easy'
  },
  {
    id: '5',
    category: '技术类',
    question: '什么是闭包？请举例说明其应用场景。',
    referenceAnswer: '闭包是指有权访问另一个函数作用域中变量的函数。\n\n特点：\n1. 函数嵌套函数\n2. 内部函数可以访问外部函数的变量\n3. 外部函数的变量不会被垃圾回收\n\n应用场景：\n1. 数据封装和私有化\n2. 函数柯里化\n3. 防抖和节流\n4. 回调函数和异步操作\n\n示例：\n```javascript\nfunction createCounter() {\n  let count = 0;\n  return function() {\n    return ++count;\n  };\n}\n```',
    difficulty: 'easy'
  },
  {
    id: '6',
    category: '行为类',
    question: '当你面对一个不可能完成的截止日期时，你会怎么做？',
    referenceAnswer: '回答策略：\n1. 保持冷静，分析现状\n2. 优先级排序：识别核心功能和可延期内容\n3. 及时沟通：向上级反馈风险，协商调整\n4. 寻求支持：请求资源或协助\n5. 制定计划：分阶段交付，保证质量\n\n关键：展示问题解决能力、沟通能力和责任心',
    difficulty: 'medium'
  },
  {
    id: '7',
    category: '技术类',
    question: '请解释一下 JavaScript 中的原型链是什么？',
    referenceAnswer: '原型链是 JavaScript 实现继承的机制。\n\n核心概念：\n1. 每个对象都有 __proto__ 属性，指向其原型\n2. 原型对象也有 __proto__，形成链式结构\n3. 当访问对象属性时，会沿着原型链向上查找\n\n原型链终点：Object.prototype.__proto__ === null\n\n实际应用：\n- 实现继承\n- 共享方法和属性\n- instanceof 判断原理',
    difficulty: 'hard'
  },
  {
    id: '8',
    category: '项目经验',
    question: '你在项目中遇到过的最大技术挑战是什么？如何解决的？',
    referenceAnswer: '回答结构：\n1. 挑战描述：具体的技术难题\n2. 分析过程：如何定位问题根源\n3. 解决方案：尝试了哪些方法，最终选择什么\n4. 实施过程：具体执行步骤\n5. 结果验证：如何验证方案有效性\n6. 经验总结：学到了什么\n\n示例方向：\n- 性能优化\n- 架构重构\n- 技术选型\n- 疑难bug解决',
    difficulty: 'hard'
  }
];

// 动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const MockInterviewQA: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const [showReferenceAnswer, setShowReferenceAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = interviewQuestions[currentQuestionIndex];
  const progress = ((answeredQuestions.size) / interviewQuestions.length) * 100;

  // 获取难度标签颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  // 获取难度中文
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  // 提交回答
  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) {
      message.warning('请输入您的回答');
      return;
    }
    setSubmittedAnswer(userAnswer);
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    message.success('回答已提交');
  };

  // 查看参考答案
  const handleShowReference = () => {
    setShowReferenceAnswer(true);
  };

  // 下一题
  const handleNextQuestion = () => {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setSubmittedAnswer('');
      setShowReferenceAnswer(false);
    } else {
      message.success('恭喜！您已完成所有问题');
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        options.mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      }
      
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunks, { 
            type: options.mimeType || 'audio/webm' 
          });
          
          if (audioBlob.size === 0) {
            message.error('录音失败，请重试');
            return;
          }
          
          // 这里简化处理，实际应该调用语音识别API
          // 模拟语音转文字
          message.loading('正在识别语音...', 1.5);
          setTimeout(() => {
            message.info('语音输入功能演示：请手动输入您的回答');
          }, 1500);
          
        } catch (error) {
          console.error('处理录音数据失败:', error);
          message.error('处理录音数据失败');
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      message.success('开始录音，请说话...');
    } catch (error) {
      console.error('启动录音失败:', error);
      message.error('无法访问麦克风，请检查权限设置');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // 语音按钮点击处理
  const handleVoice = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 max-w-5xl mx-auto"
    >
      {/* 顶部导航和进度 */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/interview-video-analysis')}
            className="rounded-xl"
          >
            返回
          </Button>
          <div className="flex items-center gap-4">
            <Badge 
              count={`${currentQuestionIndex + 1} / ${interviewQuestions.length}`} 
              style={{ backgroundColor: '#3b82f6' }}
            />
            <span className="text-gray-500">模拟问答练习</span>
          </div>
        </div>
        <Progress 
          percent={Math.round(progress)} 
          status="active"
          strokeColor={{ from: '#3b82f6', to: '#8b5cf6' }}
          className="rounded-full"
        />
      </motion.div>

      {/* 页面标题 */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <Title level={2} className="mb-2">
          <RocketOutlined className="text-amber-500 mr-3" />
          模拟面试问答
        </Title>
        <Text className="text-gray-500">
          练习面试问题，提升应答能力
        </Text>
      </motion.div>

      {/* 问题卡片 */}
      <motion.div variants={itemVariants}>
        <Card 
          className="mb-6 shadow-lg border-0 rounded-2xl overflow-hidden"
          bodyStyle={{ padding: '32px' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Tag color="blue" icon={<BookOutlined />} className="rounded-lg px-3 py-1">
              {currentQuestion.category}
            </Tag>
            <Tag color={getDifficultyColor(currentQuestion.difficulty)} className="rounded-lg px-3 py-1">
              {getDifficultyText(currentQuestion.difficulty)}
            </Tag>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageOutlined className="text-white text-xl" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-800 leading-normal">
                {currentQuestion.question}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 用户回答区域 */}
      <AnimatePresence mode="wait">
        {!submittedAnswer ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card 
              className="mb-6 shadow-md border-0 rounded-2xl"
              title={
                <div className="flex items-center gap-2">
                  <SoundOutlined className="text-green-500" />
                  <span className="font-semibold">您的回答</span>
                </div>
              }
            >
              <div>
                <textarea
                  ref={inputRef}
                  className="w-full min-h-[150px] p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="请输入您的回答，支持文字或语音输入..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="flex items-center justify-end gap-3 mt-4">
                  <Button
                    type="text"
                    icon={<AudioOutlined className={isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500'} />}
                    onClick={handleVoice}
                    className="rounded-full w-10 h-10 flex items-center justify-center"
                    title={isRecording ? '停止录音' : '语音输入'}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim()}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-none"
                  >
                    提交回答
                  </Button>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-400 flex items-center gap-4">
                <span>💡 提示：按 Enter 发送，Shift + Enter 换行</span>
                {isRecording && <span className="text-red-500 animate-pulse">● 正在录音...</span>}
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card 
              className="mb-6 shadow-md border-0 rounded-2xl"
              title={
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-500" />
                  <span className="font-semibold">您的回答</span>
                </div>
              }
            >
              <div className="bg-gray-50 rounded-xl p-4 text-gray-800 leading-relaxed whitespace-pre-wrap">
                {submittedAnswer}
              </div>
              {!showReferenceAnswer && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={handleShowReference}
                    size="large"
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 border-none shadow-lg"
                  >
                    查看参考答案
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 参考答案区域 */}
      <AnimatePresence>
        {showReferenceAnswer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card 
              className="mb-6 shadow-lg border-0 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50"
              title={
                <div className="flex items-center gap-2">
                  <BookOutlined className="text-amber-600" />
                  <span className="font-semibold text-amber-800">参考答案</span>
                </div>
              }
            >
              <div className="bg-white/70 rounded-xl p-4 text-gray-800 leading-relaxed whitespace-pre-wrap">
                {currentQuestion.referenceAnswer}
              </div>
            </Card>

            {/* 下一题按钮 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={handleNextQuestion}
                size="large"
                className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 border-none shadow-lg h-12 px-8"
              >
                {currentQuestionIndex < interviewQuestions.length - 1 ? '下一题' : '完成练习'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部提示 */}
      <motion.div variants={itemVariants} className="mt-8 text-center">
        <Text className="text-gray-400 text-sm">
          坚持练习，不断提升面试表现 💪
        </Text>
      </motion.div>
    </motion.div>
  );
};

export default MockInterviewQA;
