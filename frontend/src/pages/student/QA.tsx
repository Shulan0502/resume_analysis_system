import React, { useState, useEffect, useRef } from 'react';
import { message, Input, Modal, Button, Spin, Popconfirm, Badge, Tooltip, Space, DatePicker } from 'antd';
import { Menu } from 'antd';
import {
  AudioOutlined,
  SendOutlined,
  HomeOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
  UserOutlined,
  BulbOutlined,
  HistoryOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CloseOutlined,
  CopyOutlined,
  DownloadOutlined,
  CalendarOutlined,
  MessageOutlined,
  RobotOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatWithText, getChatHistory, clearChatHistory, deleteSingleChatHistory } from '@/services/api.ts';
import dayjs, { Dayjs } from 'dayjs';
import Draggable from 'react-draggable';

const { Search } = Input;

interface Message {
  id?: number;
  role?: 'user' | 'assistant';
  content?: string;
  createdAt: string;
  recognizedText?: string;
  messageType?: 'USER' | 'ASSISTANT';
  messageContent?: string;
  audioUrl?: string;
  audioDuration?: number;
}

interface ChatHistoryItem {
  id: number;
  userId: string;
  messageType: 'USER' | 'ASSISTANT';
  messageContent: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupedHistory {
  date: string;
  items: ChatHistoryItem[];
}

interface QAProps {
  mode?: 'history';
}

// 1. 新增HistoryContent组件
// 移除重复import React
// 为HistoryContent添加类型声明
interface HistoryContentProps {
  statsData: any;
  loadingHistory: boolean;
  groupedHistory: any[];
  searchKeyword: string;
  setSearchKeyword: (v: string) => void;
  getRelativeTimeDescription: (t: string) => string;
  handleCopyMessage: (msg: string) => void;
  handleDeleteSingleRecord: (id: number) => void;
  onLoadToCurrentChatMessage?: (date?: string) => void;
  loadChatHistory: () => void; // 新增
  handleExportHistory: () => void; // 新增
  chatHistory: ChatHistoryItem[]; // 新增
  handleClearHistory: () => void; // 新增
  filteredHistory: ChatHistoryItem[]; // 新增
  isModal?: boolean; // 新增
}

export const HistoryContent: React.FC<HistoryContentProps> = ({
  statsData,
  loadingHistory,
  groupedHistory,
  searchKeyword,
  setSearchKeyword,
  getRelativeTimeDescription,
  handleCopyMessage,
  handleDeleteSingleRecord,
  onLoadToCurrentChatMessage,
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  // 过滤分组
  const displayGroups = selectedDate
    ? groupedHistory.filter(g => dayjs(g.date).isSame(selectedDate, 'day'))
    : groupedHistory;
    

  // 新增：用于控制弹窗内的滚动
  // useEffect(() => {
  //   if (scrollToMsgId) {
  //     setTimeout(() => {
  //       const el = document.getElementById(`history-msg-${scrollToMsgId}`);
  //       if (el) el.scrollIntoView({ block: 'center' });
  //     }, 100);
  //   }
  // }, [groupedHistory, scrollToMsgId]);

  return (
    <div className="p-0 m-0 bg-transparent flex flex-col h-full">
      {/* 统计区美化 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl bg-gradient-to-r from-blue-100 to-blue-50 shadow p-6 flex flex-col items-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">{statsData.total}</div>
          <div className="text-base text-gray-600">总消息</div>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-green-100 to-green-50 shadow p-6 flex flex-col items-center">
          <div className="text-3xl font-bold text-green-600 mb-1">{statsData.today}</div>
          <div className="text-base text-gray-600">今日消息</div>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-purple-100 to-purple-50 shadow p-6 flex flex-col items-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">{statsData.userMessages}</div>
          <div className="text-base text-gray-600">我的消息</div>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-orange-100 to-orange-50 shadow p-6 flex flex-col items-center">
          <div className="text-3xl font-bold text-orange-600 mb-1">{statsData.assistantMessages}</div>
          <div className="text-base text-gray-600">AI回复</div>
        </div>
      </div>
      {/* 搜索栏 */}
      <div className="mb-4 flex items-center gap-4">
        <Search
          placeholder="搜索历史对话内容..."
          allowClear
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={(value) => setSearchKeyword(value)}
          className="w-full max-w-xl"
          size="large"
        />
        <DatePicker
          allowClear
          value={selectedDate}
          onChange={setSelectedDate}
          format="YYYY/MM/DD"
          placeholder="选择日期"
          className="!h-10"
        />
      </div>
      {/* 历史对话内容 */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ minHeight: 0 }}
      >
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : displayGroups.length > 0 ? (
          <div>
            {displayGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-8">
                {/* 日期分组标题美化+日历图标可点 */}
                <div className="flex items-center gap-2 text-lg font-semibold text-blue-700 mb-4">
                  <CalendarOutlined className="cursor-pointer" onClick={() => setSelectedDate(dayjs(group.date))} />
                  <span>{group.date}</span>
                  <Badge count={group.items.length} className="ml-2" />
                  {selectedDate && (
                    <Button size="small" onClick={() => setSelectedDate(null)} className="ml-2">清除筛选</Button>
                  )}
                </div>
                {/* 该日期的消息列表 */}
                <div className="space-y-4">
                  {group.items.map((item: ChatHistoryItem, index: number) => (
                    <div
                      key={`${item.id}-${index}`}
                      id={`history-msg-${item.id}`}
                      className={`flex ${item.messageType === 'USER' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-3xl ${item.messageType === 'USER' ? 'order-2' : ''}`}>
                        <div className={`mb-1 flex items-center gap-2 ${item.messageType === 'USER' ? 'flex-row-reverse text-blue-600' : 'text-green-600'}`}>
                          <span className="font-medium">
                            {item.messageType === 'USER' ? '你' : 'AI助手'}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {getRelativeTimeDescription(item.createdAt)}
                          </span>
                          {/* 操作按钮区 */}
                          <div className="opacity-80 hover:opacity-100 flex gap-1 ml-2">
                            <Tooltip title="复制内容">
                              <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyMessage(item.messageContent)}
                                className="h-6 w-6 p-0"
                              />
                            </Tooltip>
                            <Tooltip title="删除此对话">
                              <Popconfirm
                                title="确定删除此对话？"
                                description="将同时删除提问和回答"
                                onConfirm={() => handleDeleteSingleRecord(item.id)}
                                okText="确定"
                                cancelText="取消"
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  className="h-6 w-6 p-0"
                                />
                              </Popconfirm>
                            </Tooltip>
                            {/* 加载到当前会话按钮 */}
                            {typeof onLoadToCurrentChatMessage === 'function' && (
                              <Tooltip title="加载到当前会话">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<ImportOutlined />}
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const date = dayjs(item.createdAt).format('YYYY/MM/DD');
                                    if (onLoadToCurrentChatMessage) {
                                      onLoadToCurrentChatMessage(date);
                                    }
                                  }}
                                />
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <div className={`rounded-2xl px-5 py-3 shadow-sm text-base whitespace-pre-line break-words ${item.messageType === 'USER' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 border border-gray-100'}`}>{item.messageContent}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">暂无历史记录</div>
        )}
      </div>
      {/* 操作按钮区（仅主页面显示） */}
      {/* 删除HistoryContent底部 {typeof onLoadToCurrentChatMessage === 'function' && ( ... )} 区块。 */}
    </div>
  );
}

const QA: React.FC<QAProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const inputRef = useRef<any>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // 聊天历史相关状态
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [recentHistory, setRecentHistory] = useState<ChatHistoryItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<ChatHistoryItem[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);
  const [statsData, setStatsData] = useState({
    total: 0,
    today: 0,
    userMessages: 0,
    assistantMessages: 0
  });

  // 1. 恢复 showHistoryDetail/historyDetailMsg 相关 state，移除 isHistoryMode/backupMessages
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  // 1. 修改historyDetailMsg类型，增加highlightMsgIndex
  const [historyDetailMsg] = useState<ChatHistoryItem[] | null>(null);

  const mainContentRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // 1. 新增历史浏览模式相关 state
  const [historyViewMode, setHistoryViewMode] = useState(false);
  const [historyViewDate, setHistoryViewDate] = useState<string | null>(null);

  // 新增：加载历史到当前会话
  const onLoadToCurrentChatMessage = (date?: string) => {
    if (date) {
      setHistoryViewDate(date);
      setHistoryViewMode(true);
      setShowFullHistory(false); // 关闭弹窗
    }
  };

  // Focus input on page load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Scroll to the bottom after messages update
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
    }
  }, [messages]);

  // 页面加载时获取聊天历史
  useEffect(() => {
    loadChatHistory();
  }, []);

  // 处理历史记录搜索和分组
  useEffect(() => {
    let filtered = chatHistory;
    
    // 搜索过滤
    if (searchKeyword.trim()) {
      filtered = chatHistory.filter(item => 
        item.messageContent.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    
    setFilteredHistory(filtered);
    
    // 按日期分组
    const grouped = groupHistoryByDate(filtered);
    setGroupedHistory(grouped);
    
    // 计算统计数据
    calculateStats(chatHistory);
  }, [chatHistory, searchKeyword]);

  // 按日期分组历史记录
  const groupHistoryByDate = (history: ChatHistoryItem[]): GroupedHistory[] => {
    const groups: { [key: string]: ChatHistoryItem[] } = {};
    
    history.forEach((item: ChatHistoryItem) => { // 为 item 添加 ChatHistoryItem 类型
      const date = new Date(item.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    
    return Object.entries(groups)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // 计算统计数据
  const calculateStats = (history: ChatHistoryItem[]) => {
    const today = new Date().toLocaleDateString('zh-CN');
    const todayHistory = history.filter(item => 
      new Date(item.createdAt).toLocaleDateString('zh-CN') === today
    );
    
    setStatsData({
      total: history.length,
      today: todayHistory.length,
      userMessages: history.filter(item => item.messageType === 'USER').length,
      assistantMessages: history.filter(item => item.messageType === 'ASSISTANT').length
    });
  };

  // 加载聊天历史
  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = (await getChatHistory()) as ChatHistoryItem[];
      const uniqueHistory = Array.from(new Map(history.map(item => [item.id, item])).values());
      setChatHistory(uniqueHistory);
      
      // 获取最近的几条记录用于侧边栏显示
      const recent = history.slice(-6);
      setRecentHistory(recent);
    } catch (error) {
      console.error('加载聊天历史失败:', error);
      message.error('加载聊天历史失败');
    } finally {
      setLoadingHistory(false);
    }
  };

  // 清除聊天历史
  const handleClearHistory = async () => {
    try {
      await clearChatHistory();
      setChatHistory([]);
      setRecentHistory([]);
      setFilteredHistory([]);
      setGroupedHistory([]);
      message.success('聊天历史已清除');
    } catch (error) {
      console.error('清除聊天历史失败:', error);
      message.error('清除聊天历史失败');
    }
  };

  // 删除单条对话（包括用户问题和AI回答）
  const handleDeleteSingleRecord = async (recordId: number) => {
    try {
      await deleteSingleChatHistory(recordId);
      // 从本地state中移除对话对
      const targetRecord = chatHistory.find(item => item.id === recordId);
      if (!targetRecord) return;
      
      const recordsToRemove = new Set<number>([recordId]);
      
      // 如果删除的是用户消息，找到后续的AI回复
      if (targetRecord.messageType === 'USER') {
        const targetIndex = chatHistory.findIndex(item => item.id === recordId);
        if (targetIndex !== -1 && targetIndex + 1 < chatHistory.length) {
          const nextRecord = chatHistory[targetIndex + 1];
          if (nextRecord.messageType === 'ASSISTANT') {
            recordsToRemove.add(nextRecord.id);
          }
        }
      }
      // 如果删除的是AI回复，找到前面的用户问题
      else if (targetRecord.messageType === 'ASSISTANT') {
        const targetIndex = chatHistory.findIndex(item => item.id === recordId);
        if (targetIndex > 0) {
          const prevRecord = chatHistory[targetIndex - 1];
          if (prevRecord.messageType === 'USER') {
            recordsToRemove.add(prevRecord.id);
          }
        }
      }
      
      const newHistory = chatHistory.filter(item => !recordsToRemove.has(item.id));
      setChatHistory(newHistory);
      message.success('对话已删除');
    } catch (error) {
      console.error('删除对话失败:', error);
      message.error('删除对话失败');
    }
  };

  // 复制消息内容
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success('内容已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败');
    }
  };

  // 导出历史记录
  const handleExportHistory = () => {
    try {
      const exportData = chatHistory.map(item => ({
        时间: new Date(item.createdAt).toLocaleString('zh-CN'),
        类型: item.messageType === 'USER' ? '用户' : 'AI助手',
        内容: item.messageContent
      }));
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `聊天历史_${new Date().toLocaleDateString('zh-CN')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('历史记录导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 加载历史对话到当前会话
// 格式化时间
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 0 ? '刚刚' : `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 48) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  // 获取对话预览文本
  const getPreviewText = (content: string) => {
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  };

  // 获取相对时间描述
  const getRelativeTimeDescription = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInHours < 24) return `${diffInHours}小时前`;
    if (diffInDays === 1) return '昨天';
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newUserMessage: Message = {
      role: 'user',
      content: inputValue,
      createdAt: new Date().toISOString(),
      messageType: 'USER',
      messageContent: inputValue,
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    const currentInput = inputValue;
    setInputValue(''); // Clear input immediately

    try {
      // 调用后端API进行文本对话
      const response = await chatWithText(currentInput);
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: response.response || response.message || response.content || '抱歉，没有收到有效回复',
        createdAt: new Date().toISOString(),
        messageType: 'ASSISTANT',
        messageContent: response.response || response.message || response.content || '抱歉，没有收到有效回复',
      };
      setMessages(prevMessages => [...prevMessages, newAssistantMessage]);

      // 重新加载聊天历史以获取最新的记录
      loadChatHistory();
    } catch (error) {
      console.error('API调用失败:', error);
      // 如果API调用失败，显示错误信息
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，连接服务器失败，请检查网络连接或稍后重试。',
        createdAt: new Date().toISOString(),
        messageType: 'ASSISTANT',
        messageContent: '抱歉，连接服务器失败，请检查网络连接或稍后重试。',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      message.error('连接服务器失败，请检查网络连接');
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // 设置采样率为16kHz
          channelCount: 1,   // 单声道
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // 尝试使用最佳音频格式，优先级：WAV > WebM+PCM > WebM
      let options: MediaRecorderOptions = {};
      let formatInfo = '';
      
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        options.mimeType = 'audio/wav';
        formatInfo = 'WAV格式（完美兼容）';
        console.log('使用WAV格式录音');
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=pcm')) {
        options.mimeType = 'audio/webm;codecs=pcm';
        formatInfo = 'WebM+PCM格式（良好兼容）';
        console.log('使用WebM+PCM格式录音');
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
        formatInfo = 'WebM+Opus格式（需要转换）';
        console.log('使用WebM+Opus格式录音');
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
        formatInfo = 'WebM格式（需要转换）';
        console.log('使用WebM格式录音');
      } else {
        formatInfo = '默认格式（兼容性未知）';
        console.warn('使用默认格式录音');
      }
      
      // 显示格式信息给用户
      message.info(`开始录音 - ${formatInfo}`);
      
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          // 创建音频Blob
          const audioBlob = new Blob(chunks, { 
            type: options.mimeType || 'audio/wav' 
          });
          
          console.log('录音完成，文件大小:', audioBlob.size, '字节');
          console.log('录音格式:', audioBlob.type);
          
          // 检查文件大小
          if (audioBlob.size === 0) {
            message.error('录音失败，请重试');
            return;
          }
          
          if (audioBlob.size > 5 * 1024 * 1024) {
            message.error('录音文件过大，请录制更短的音频');
            return;
          }
          
          // 根据实际格式创建文件
          let fileName = 'voice.wav';
          if (audioBlob.type.includes('webm')) {
            fileName = 'voice.webm';
          } else if (audioBlob.type.includes('mp4')) {
            fileName = 'voice.mp4';
          } else if (audioBlob.type.includes('ogg')) {
            fileName = 'voice.ogg';
          }
          
          const audioFile = new File([audioBlob], fileName, { 
            type: audioBlob.type 
          });
          
          // 处理语音上传
          await handleVoiceUpload(audioFile);
        } catch (error) {
          console.error('处理录音数据失败:', error);
          message.error('处理录音数据失败，请重试');
        } finally {
          // 停止所有音频轨道
          stream.getTracks().forEach(track => track.stop());
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      message.success(`开始录音 - ${formatInfo}`);
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
      message.success('录音结束，正在处理...');
    }
  };

  // 处理语音上传
  const handleVoiceUpload = async (audioFile: File) => {
    const formData = new FormData();
    formData.append('audioFile', audioFile);

    try {
      message.loading('正在识别语音...', 0);

      console.log('开始上传语音文件:', audioFile.name, '大小:', audioFile.size, '类型:', audioFile.type);

      const response = await fetch('/api/chat/voice', {
        method: 'POST',
        body: formData,
      });

      message.destroy(); // 清除loading消息

      if (response.ok) {
        const result = await response.json();
        console.log('语音识别结果:', result);

        if (result.success) {
          const recognizedText = result.recognizedText;
          console.log('识别的文字:', recognizedText);
          
          // 验证识别结果质量
          if (recognizedText && recognizedText.trim().length > 0) {
            // 检查是否是有效的识别结果
            if (isValidRecognitionResult(recognizedText)) {
              message.success('语音识别成功！');
              
              // 将识别的文字设置到输入框
              setInputValue(recognizedText);
              
              // 自动发送消息（可选）
              if (recognizedText.length > 1) {
                // 先设置输入值，然后发送
                setTimeout(() => {
                  handleSend();
                }, 100);
              }
            } else {
              message.warning('识别结果可能不准确，请检查后再发送');
              setInputValue(recognizedText);
            }
          } else {
            handleVoiceError('语音识别结果为空，请重新录制');
          }
        } else {
          handleVoiceError(result.message || '语音识别失败');
        }
      } else {
        const errorText = await response.text();
        console.error('语音识别请求失败:', response.status, errorText);
        handleVoiceError(`服务器错误 (${response.status})`);
      }
    } catch (error) {
      message.destroy();
      console.error('语音上传失败:', error);
      handleVoiceError('网络连接失败，请检查网络后重试');
    } finally {
      // setIsUploading(false); // 移除此行
    }
  };

  // 验证识别结果是否有效
  const isValidRecognitionResult = (text: string): boolean => {
    if (!text || text.trim().length === 0) {
      return false;
    }

    const cleanText = text.trim();
    
    // 检查是否只包含无意义的内容
    const meaninglessPatterns = [
      /^[嗯啊呃额哦唔]+$/,
      /^[。，、？！.?!,\s]+$/,
      /^[\s]*$/
    ];

    for (const pattern of meaninglessPatterns) {
      if (pattern.test(cleanText)) {
        return false;
      }
    }

    // 如果文本太短且只包含标点符号，认为无效
    return !(cleanText.length <= 2 && /^[\p{P}\s]*$/u.test(cleanText));


  };

  // 处理语音错误
  const handleVoiceError = (errorMessage: string) => {
    console.error('语音处理错误:', errorMessage);
    
    // 根据错误类型提供不同的用户提示和建议
    if (errorMessage.includes('格式') || errorMessage.includes('不支持')) {
      message.error({
        content: (
          <div>
            <div>音频格式不支持</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              建议使用Safari浏览器录制WAV格式，或尝试录制更短的音频
            </div>
          </div>
        ),
        duration: 5,
      });
    } else if (errorMessage.includes('超时')) {
      message.error({
        content: (
          <div>
            <div>语音识别超时</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              请尝试录制更短的音频（建议30秒内）
            </div>
          </div>
        ),
        duration: 4,
      });
    } else if (errorMessage.includes('网络') || errorMessage.includes('连接')) {
      message.error({
        content: (
          <div>
            <div>网络连接失败</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              请检查网络连接后重试
            </div>
          </div>
        ),
        duration: 4,
      });
    } else if (errorMessage.includes('质量') || errorMessage.includes('环境')) {
      message.error({
        content: (
          <div>
            <div>音频质量不佳</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              请在安静环境中重新录制，说话清晰一些
            </div>
          </div>
        ),
        duration: 4,
      });
    } else if (errorMessage.includes('过大')) {
      message.error({
        content: (
          <div>
            <div>音频文件过大</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              请录制更短的音频（建议30秒内）
            </div>
          </div>
        ),
        duration: 4,
      });
    } else {
      message.error({
        content: (
          <div>
            <div>语音识别失败</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {errorMessage || '请重新录制'}
            </div>
          </div>
        ),
        duration: 4,
      });
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

  // Menu items - replicated from MainLayout
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/qa',
      icon: <BulbOutlined />,
      label: '智能体问答',
    },
    {
      key: '/interview',
      icon: <VideoCameraOutlined />,
      label: '智能模拟面试',
    },
    {
      key: '/analysis',
      icon: <BarChartOutlined />,
      label: '面试分析',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
  ];

  if (mode === 'history') {
    return (
      <div className="p-0 m-0 bg-transparent">
        <div className="flex items-center gap-3 mb-6 mt-2">
          <HistoryOutlined className="text-2xl text-blue-500" />
          <span className="text-xl font-bold text-gray-800">历史记录</span>
        </div>
        <HistoryContent
          statsData={statsData}
          loadingHistory={loadingHistory}
          loadChatHistory={loadChatHistory}
          handleExportHistory={handleExportHistory}
          chatHistory={chatHistory}
          handleClearHistory={handleClearHistory}
          filteredHistory={filteredHistory}
          groupedHistory={groupedHistory}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          getRelativeTimeDescription={getRelativeTimeDescription}
          handleCopyMessage={handleCopyMessage}
          handleDeleteSingleRecord={handleDeleteSingleRecord}
        />
      </div>
    )
  }

  // 4. 主内容区渲染逻辑调整
  let displayedMessages = messages.map(m => ({ ...m, createdAt: m.createdAt || '' }));
    if (historyViewMode && historyViewDate) {
      // 添加显式类型声明并完善属性映射
      const historyMsgs: Message[] = chatHistory.filter(item => {
        const date = dayjs(item.createdAt).format('YYYY/MM/DD');
        return date === historyViewDate;
      }).map(item => ({
        role: item.messageType === 'USER' ? 'user' : 'assistant',
        content: item.messageContent,
        createdAt: item.createdAt,
        messageType: item.messageType,
        messageContent: item.messageContent
      }));
      displayedMessages = [...historyMsgs, ...messages.map(m => ({ ...m, createdAt: m.createdAt || '' }))];
    }

  return (
    <div className="h-screen flex">
      {/* 侧边栏 */}
      <div className="w-64 bg-white rounded-tr-[32px] rounded-br-[32px] border-r border-gray-200 flex flex-col" style={{ height: '100vh', paddingTop: 48, position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 10 }}>
        {/* Logo/Title Area - Replicated from MainLayout */}
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: 24,
            letterSpacing: 2,
            paddingLeft: 24,
            paddingRight: 8,
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            智能面试评测
          </span>
        </div>

        {/* Navigation Menu - Replicated from MainLayout */}
        <div className="flex-1 flex flex-col">
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{
              background: '#fff',
              fontSize: 18,
              paddingLeft: 20,
              borderRight: 'none', // Remove default menu border
            }}
            className="[&_.ant-menu-item]:mb-4 [&_.ant-menu-item]:!h-14 [&_.ant-menu-item]:flex [&_.ant-menu-item]:items-center"
          />

          {/* History Content Area */}
          <div className="flex-1 p-4 border-t border-gray-200 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HistoryOutlined className="text-blue-600" />
                历史对话
              </h3>
              <div className="flex gap-1">
                <Tooltip title="刷新历史记录">
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 p-1 border-none bg-transparent flex items-center justify-center rounded hover:bg-blue-50"
                    onClick={loadChatHistory}
                  >
                    <ReloadOutlined className="text-base" />
                  </button>
                </Tooltip>
                <Tooltip title="查看全部历史对话">
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 p-1 border-none bg-transparent flex items-center justify-center rounded hover:bg-blue-50"
                    onClick={() => setShowFullHistory(true)}
                  >
                    <HistoryOutlined className="text-base" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Statistics */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge count={statsData.total} showZero className="[&_.ant-badge-count]:bg-blue-500" />
                  <span className="text-gray-600">总对话</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge count={statsData.today} showZero className="[&_.ant-badge-count]:bg-green-500" />
                  <span className="text-gray-600">今日</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-blue-500" />
                  <span className="text-gray-600">{statsData.userMessages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RobotOutlined className="text-green-500" />
                  <span className="text-gray-600">{statsData.assistantMessages}</span>
                </div>
              </div>
            </div>
            
            {/* History items */}
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <Spin size="small" />
              </div>
            ) : recentHistory.length > 0 ? (
              <div className="space-y-2">
                {recentHistory.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="p-3 rounded-lg bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all duration-200 group"
                    onClick={() => {
                      const date = dayjs(item.createdAt).format('YYYY/MM/DD');
                      if (onLoadToCurrentChatMessage) {
                        onLoadToCurrentChatMessage(date);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${item.messageType === 'USER' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      <span className={`text-xs font-medium ${item.messageType === 'USER' ? 'text-blue-600' : 'text-green-600'}`}>
                        {item.messageType === 'USER' ? '你' : 'AI助手'}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto group-hover:text-gray-600">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-tight group-hover:text-gray-900">
                      {getPreviewText(item.messageContent)}
                    </p>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    onClick={() => setShowFullHistory(true)}
                  >
                    查看全部 {statsData.total} 条记录 →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageOutlined className="text-3xl mb-2 opacity-50" />
                <p className="text-sm">暂无历史对话</p>
                <p className="text-xs text-gray-400 mt-1">开始聊天后记录会显示在这里</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域，渐变背景填充，输入框悬浮在上方 */}
      <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
        {showHistoryDetail ? (
          <div className="relative w-full h-full bg-transparent">
            {/* 退出按钮 */}
            <button
              className="absolute top-8 right-10 z-50 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-base font-bold shadow-xl border-2 border-white/40 hover:scale-105 hover:shadow-2xl hover:brightness-110 transition-all duration-200 group backdrop-blur-sm"
              style={{ boxShadow: '0 6px 24px 0 rgba(120, 80, 220, 0.18)' }}
              onClick={() => setShowHistoryDetail(false)}
              title="退出历史查看"
            >
              <HistoryOutlined className="text-3xl mr-2 drop-shadow group-hover:animate-spin-slow" />
              退出历史查看
            </button>
            <div className="w-full flex flex-col items-center justify-start min-h-screen pt-24 pb-12">
              <div className="w-full max-w-3xl mx-auto h-full overflow-y-auto overflow-x-hidden" style={{maxHeight: 'calc(100vh - 120px)'}}>
                {Array.isArray(historyDetailMsg) && historyDetailMsg.length > 0 ? (
                  historyDetailMsg.map((msg, idx) => (
                    <div
                      key={idx}
                      id={msg.id ? `msg-${msg.id}` : undefined}
                      className={`flex mb-4 ${msg.messageType === 'USER' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] break-words ${msg.messageType === 'USER' ? 'ml-auto' : 'mr-auto'}`}>
                        <div className={`rounded-xl px-4 py-2 shadow text-base ${msg.messageType === 'USER' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                          {msg.messageContent}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-8">暂无历史消息</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto px-6 pt-2 min-h-0"
              ref={mainContentRef}
            >
              {displayedMessages.map((msg, index) => {
                    // 日期分隔条
                    const isFirst = index === 0;
                    const prevMsg = displayedMessages[index - 1];
                    const showDate = isFirst || (prevMsg && (msg.createdAt || '') && (prevMsg.createdAt || '') && new Date(msg.createdAt as string).toDateString() !== new Date(prevMsg.createdAt as string).toDateString());
                    return (
                      <React.Fragment key={index}>
                        {showDate && msg.createdAt && (
                          <div className="text-center text-xs text-gray-400 my-2">{msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}</div>
                        )}
                        <div className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && (
                            <div className="flex-shrink-0 mr-3">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">AI</div>
                            </div>
                          )}
                          <div className="flex flex-col max-w-[70%]">
                            <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>{msg.content}</div>
                          </div>
                          {msg.role === 'user' && (
                            <div className="flex-shrink-0 ml-3">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">我</div>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                {historyViewMode && (
                  <button
                    className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-base font-bold shadow-xl border-2 border-white/40 hover:scale-105 hover:shadow-2xl hover:brightness-110 transition-all duration-200 group backdrop-blur-sm"
                    style={{ boxShadow: '0 6px 24px 0 rgba(120, 80, 220, 0.18)' }}
                    onClick={() => { setHistoryViewMode(false); setHistoryViewDate(null); }}
                    title="退出历史浏览"
                  >
                    <CloseOutlined className="text-2xl mr-2 drop-shadow group-hover:animate-spin-slow" />
                    退出历史浏览
                  </button>
                )}
              </div>
              {/* 底部输入框和按钮 */}
              <div className="fixed bottom-0 left-64 right-0 px-6 pb-6 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
                <div className="w-full max-w-4xl mx-auto relative">
                  {/* 历史记录按钮 - 移动到输入框外部右侧 */}
                  <button
                    className="absolute right-[-180px] top-1/2 -translate-y-1/2 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-base font-bold shadow-xl border-2 border-white/40 hover:scale-105 hover:shadow-2xl hover:brightness-110 transition-all duration-200 group backdrop-blur-sm"
                    onClick={() => setShowFullHistory(true)}
                    title="查看全部历史记录"
                  >
                    <HistoryOutlined className="text-3xl mr-2 drop-shadow group-hover:animate-spin-slow" />
                    历史记录
                  </button>
                  <form
                    className="relative bg-white rounded-3xl border border-gray-200 px-8 pt-6 pb-16 min-h-[120px] flex flex-col justify-between"
                    onSubmit={e => { e.preventDefault(); handleSend(); }}
                  >
                    <textarea
                      ref={inputRef}
                      className="w-full resize-none border-none outline-none text-base bg-transparent placeholder:text-gray-400 min-h-[48px] max-h-40"
                      placeholder="• 发消息  • 查看历史记录  • 语音输入"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={3}
                    />
                    {/* 右下角语音和发送按钮 */}
                    <div className="absolute right-6 bottom-4 flex items-center gap-3">
                      <button
                        type="button"
                        className={`flex items-center justify-center transition-colors focus:outline-none p-0 border-none bg-transparent ${isRecording ? 'text-red-600 hover:text-red-500 animate-pulse' : 'text-gray-600 hover:text-blue-600'}`}
                        title={isRecording ? '点击停止录音' : '点击开始语音输入'}
                        onClick={handleVoice}
                      >
                        <AudioOutlined className="text-2xl" />
                      </button>
                      {/* Send Button */}
                      <button
                        type="submit"
                        className={`flex items-center justify-center transition-colors focus:outline-none p-0 border-none bg-transparent ${inputValue.trim() ? 'text-blue-600 hover:text-blue-500' : 'text-gray-400 cursor-not-allowed'}`}
                        title="发送"
                        disabled={!inputValue.trim()}
                      >
                        <SendOutlined className="text-2xl" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
      </div>
      {/* Modal 移到主内容区div外部 */}
      {mode !== 'history' && (
        <Modal
          title={
            <div className="flex items-center justify-between w-full cursor-move select-none">
              <div className="flex items-center gap-3">
                <HistoryOutlined className="text-white text-xl" />
                <div>
                  <span className="text-lg font-semibold text-white">聊天历史</span>
                  <div className="text-sm text-white/80 mt-1">
                    共 {statsData.total} 条记录 · 今日 {statsData.today} 条
                  </div>
                </div>
              </div>
              <Space size="small">
                <Tooltip title="刷新">
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined className="text-white" />}
                    onClick={loadChatHistory}
                    loading={loadingHistory}
                    className="hover:bg-white/20 border-none"
                  />
                </Tooltip>
                <Tooltip title="导出历史">
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined className="text-white" />}
                    onClick={handleExportHistory}
                    disabled={chatHistory.length === 0}
                    className="hover:bg-white/20 border-none"
                  />
                </Tooltip>
                <Popconfirm
                  title="确定要清除所有聊天历史吗？"
                  description="此操作不可撤销，将删除所有历史记录"
                  onConfirm={handleClearHistory}
                  okText="确定"
                  cancelText="取消"
                >
                  <Tooltip title="清除历史">
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined className="text-white" />}
                      disabled={chatHistory.length === 0}
                      className="hover:bg-red-500/30 border-none"
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            </div>
          }
          open={showFullHistory}
          onCancel={() => {
            setShowFullHistory(false);
            setSearchKeyword('');
          }}
          width={900}
          bodyStyle={{ height: 600, padding: 0 }} // 关键：bodyStyle设置高度
          footer={null}
          className="chat-history-modal"
          modalRender={modal => (
            <Draggable
              handle=".ant-modal-content"
              cancel=".ant-modal-footer,button,input,textarea,.ant-btn"
              onStart={() => setDragging(true)}
              onStop={() => setDragging(false)}
            >
              <div style={{ width: '100%', height: '100%' }}>
                {React.cloneElement(modal as React.ReactElement, {
                  style: {
                    ...(modal as any).props.style,
                    cursor: dragging ? 'move' : 'auto',
                  },
                  className: `${(modal as any).props.className || ''} ${dragging ? 'dragging-modal' : ''}`,
                })}
              </div>
            </Draggable>
          )}
        >
          <div style={{ padding: 24, position: 'relative', minHeight: 400, height: 'calc(100% - 64px)' }}>
            <HistoryContent
              statsData={statsData}
              loadingHistory={loadingHistory}
              loadChatHistory={loadChatHistory}
              handleExportHistory={handleExportHistory}
              chatHistory={chatHistory}
              handleClearHistory={handleClearHistory}
              filteredHistory={filteredHistory}
              groupedHistory={groupedHistory}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              getRelativeTimeDescription={getRelativeTimeDescription}
              handleCopyMessage={handleCopyMessage}
              handleDeleteSingleRecord={handleDeleteSingleRecord}
              isModal={true}
              onLoadToCurrentChatMessage={onLoadToCurrentChatMessage}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default QA;