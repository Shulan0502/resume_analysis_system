import { useEffect, useRef, useState } from 'react'
import { App, Button, Drawer, Empty, Input, Popconfirm, Spin, Tooltip } from 'antd'
import { DeleteOutlined, HistoryOutlined, ReloadOutlined, RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { chatWithText, clearChatHistory, deleteSingleChatHistory, getChatHistory } from '@/services/api'
import './QA.css'

type ChatItem = { id: number; userId: string; messageType: 'USER' | 'ASSISTANT'; messageContent: string; createdAt: string; updatedAt: string }
type Message = { role: 'user' | 'assistant'; content: string; createdAt: string }

const QA = ({ mode }: { mode?: 'history' }) => {
  const { message } = App.useApp()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<ChatItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [historyOpen, setHistoryOpen] = useState(mode === 'history')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const streamRef = useRef<HTMLDivElement>(null)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getChatHistory()
      const rows = Array.isArray(data) ? data : []
      setHistory(rows)
      if (!messages.length) setMessages(rows.map((row) => ({ role: row.messageType === 'USER' ? 'user' : 'assistant', content: row.messageContent, createdAt: row.createdAt })))
    } catch {
      message.error('获取对话历史失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHistory() }, [])
  useEffect(() => { streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || sending) return
    const now = new Date().toISOString()
    setInput('')
    setSending(true)
    setMessages((current) => [...current, { role: 'user', content, createdAt: now }])
    try {
      const result = await chatWithText(content)
      const response = result?.response || '暂时没有生成有效回复。'
      setMessages((current) => [...current, { role: 'assistant', content: response, createdAt: new Date().toISOString() }])
      await loadHistory()
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: '服务连接失败，请稍后重试。', createdAt: new Date().toISOString() }])
      message.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  const removeRecord = async (id: number) => {
    try {
      await deleteSingleChatHistory(id)
      setHistory((current) => current.filter((row) => row.id !== id))
    } catch { message.error('删除失败') }
  }

  const clearHistory = async () => {
    try {
      await clearChatHistory()
      setHistory([])
      setMessages([])
      message.success('历史记录已清除')
    } catch { message.error('清除失败') }
  }

  return <main className="qa-page">
    <section className="qa-heading"><div><span className="eyebrow"><RobotOutlined /> CAREER COPILOT</span><h1>求职问答</h1><p>把岗位、项目或面试困惑交给职业助手，一起拆解下一步。</p></div><Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>对话记录</Button></section>
    <section className="qa-workbench">
      <div className="qa-suggestions">{['帮我梳理前端实习的准备重点', '如何介绍自己的项目经历？', '根据目标岗位制定一周学习计划'].map((item) => <button key={item} onClick={() => setInput(item)}>{item}</button>)}</div>
      <div className="qa-stream" ref={streamRef}>{messages.length ? messages.map((item, index) => <div className={`qa-message ${item.role}`} key={`${item.createdAt}-${index}`}><div className="qa-avatar">{item.role === 'user' ? <UserOutlined /> : <RobotOutlined />}</div><div><span>{item.role === 'user' ? '你' : '职业助手'}</span><p>{item.content}</p></div></div>) : <div className="qa-empty"><RobotOutlined /><h2>从一个具体问题开始</h2><p>例如目标岗位、简历改进、项目表达或面试准备。</p></div>}{sending && <div className="qa-typing"><Spin size="small" /> 正在整理建议</div>}</div>
      <div className="qa-composer"><Input.TextArea value={input} onChange={(event) => setInput(event.target.value)} onPressEnter={(event) => { if (!event.shiftKey) { event.preventDefault(); sendMessage() } }} autoSize={{ minRows: 2, maxRows: 5 }} placeholder="输入你的求职问题，Enter 发送，Shift + Enter 换行" /><Button type="primary" shape="circle" icon={<SendOutlined />} loading={sending} onClick={sendMessage} /></div>
    </section>
    <Drawer title="对话记录" open={historyOpen} onClose={() => setHistoryOpen(false)} width="min(480px, 100vw)" extra={<Tooltip title="刷新"><Button type="text" icon={<ReloadOutlined />} onClick={loadHistory} /></Tooltip>}>
      <div className="qa-history-actions"><span>{history.length} 条记录</span><Popconfirm title="确定清除全部记录？" onConfirm={clearHistory}><Button danger type="text" icon={<DeleteOutlined />}>清除全部</Button></Popconfirm></div>
      {loading ? <div className="qa-history-loading"><Spin /></div> : history.length ? <div className="qa-history-list">{history.map((item) => <div key={item.id} className={item.messageType === 'USER' ? 'user' : 'assistant'}><span>{item.messageType === 'USER' ? '你' : '职业助手'} · {new Date(item.createdAt).toLocaleString('zh-CN')}</span><p>{item.messageContent}</p><Tooltip title="删除"><Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => removeRecord(item.id)} /></Tooltip></div>)}</div> : <Empty description="还没有对话记录" />}
    </Drawer>
  </main>
}

export default QA
