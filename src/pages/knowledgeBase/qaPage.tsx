import { Card, Input, Button, Upload, Space, message, Spin, Avatar, Modal } from 'antd'
import { SendOutlined, PaperClipOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons'
import { useState, useRef, useEffect } from 'react'
import type { UploadFile } from 'antd'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
import { usePersistedState } from '../../hooks/usePersistedState'

const { TextArea } = Input

interface QAMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: UploadFile[]
  timestamp: string
  loading?: boolean
  rating?: 'like' | 'dislike'
  reviewComment?: string
}

const nowStr = (): string => {
  const d = new Date()
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const QA_KNOWLEDGE: Record<string, string> = {
  '信息系统等级保护2.0': `等保2.0的核心是构建 "技术+管理"双维度的主动防御体系。实施要点主要包括精准定级、闭环流程、技术管理双合规，以及关注云、工控等新领域的扩展要求。

🔎 等保2.0的核心变化
相较于1.0版本，等保2.0有两个重大变化：
保护对象更广：从传统信息系统，扩展至云计算、物联网、工业控制系统等新领域。
要求体系升级：从"一个中心、三重防护"升级为 "通用要求+扩展要求" 的灵活框架，针对不同场景有定制化规范。`,
}

// 针对用户问题进行关键词匹配
const matchAnswer = (q: string): string => {
  const q2 = q.replace(/\s+/g, '')
  if (/等级保护|等保2?\.?0|等保20|信息系统等级|等保/.test(q2)) return QA_KNOWLEDGE['信息系统等级保护2.0']
  if (/监理|监理师|监理工程师/.test(q2)) return `监理师在信息系统项目中扮演的核心角色是"过程监督与质量把关"。主要职责包括：
  1) 协助建设单位进行需求分析与招标评审；
  2) 对承建单位的项目实施过程进行监督；
  3) 把控项目质量、进度、成本、变更、合同、信息、安全、组织协调等；
  4) 出具监理报告、阶段性验收意见与最终验收意见。`
  if (/质量控制|质量检查|质量管理/.test(q2)) return `质量控制是信息系统监理的核心工作之一，要点：
  1) 事前控制：制定质量计划、明确质量标准；
  2) 事中控制：通过检查、评审、测试等手段跟踪执行；
  3) 事后控制：整改质量问题、形成质量报告；
  4) 持续改进：积累质量知识库，形成组织过程资产。`
  if (/进度|进度控制|项目计划/.test(q2)) return `进度控制要点：
  1) 制定WBS分解与里程碑计划；
  2) 建立实际进度与计划进度的跟踪对比机制；
  3) 识别进度偏差并采取纠偏措施（增加资源、优化路径）；
  4) 输出进度跟踪报告与调整报告。`
  if (/合同|支付|付款/.test(q2)) return `合同管理要点：
  1) 合同签订前评审：条款合法性、完整性；
  2) 履约跟踪：对承建方执行过程进行监控；
  3) 变更管理：变更申请→评审→记录→执行；
  4) 支付管理：按合同条款与里程碑节点审核支付。`
  return `已收到您的问题：「${q}」\n\n当前知识库暂未收录该问题的精确答案。建议您：
  1) 使用更具体的关键词提问；
  2) 上传相关文档作为知识来源；
  3) 在文档管理中查找相关资料。`
}

const KnowledgeQAPanel: React.FC = () => {
  const { currentUser } = useUser()
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = usePersistedState<QAMessage[]>('knowledge-qa-messages', [
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好，我是信佰监理智能助手 🤖\n可以向我咨询信息系统监理、等级保护2.0、项目管理、质量进度控制等相关问题。\n您也可以上传文档作为知识来源。',
      timestamp: nowStr(),
    },
  ])
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDislikeModalVisible, setIsDislikeModalVisible] = useState(false)
  const [dislikeTargetId, setDislikeTargetId] = useState<string | null>(null)
  const [dislikeComment, setDislikeComment] = useState('')

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 注入对话区域滚动条样式（Chrome/Edge/Safari）
  useEffect(() => {
    const styleId = 'qa-chat-scrollbar-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        .qa-chat-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .qa-chat-scroll::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
        .qa-chat-scroll::-webkit-scrollbar-thumb {
          background: #d9d9d9;
          border-radius: 3px;
        }
        .qa-chat-scroll::-webkit-scrollbar-thumb:hover {
          background: #bfbfbf;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  const handleSubmit = () => {
    if (!question.trim() && fileList.length === 0) {
      message.warning('请输入问题或上传文档')
      return
    }
    const questionText = question.trim() || `（用户上传了 ${fileList.length} 个文档）`
    const userMsg: QAMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: questionText,
      attachments: fileList.length > 0 ? [...fileList] : undefined,
      timestamp: nowStr(),
    }
    const loadingMsg: QAMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: nowStr(),
      loading: true,
    }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setQuestion('')
    setFileList([])
    setSubmitting(true)
    // 模拟15秒返回答案
    setTimeout(() => {
      const answer = matchAnswer(questionText)
      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? { ...m, content: answer, loading: false } : m))
      setSubmitting(false)
    }, 15000)
  }

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '对话已清空，您可以重新开始提问。',
        timestamp: nowStr(),
      },
    ])
  }

  const handleLike = (msgId: string) => {
    const targetMsg = messages.find(m => m.id === msgId)
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, rating: m.rating === 'like' ? undefined : 'like', reviewComment: undefined } : m
    ))
    message.success('已标记为有用的回答')
    if (targetMsg) {
      addAuditLog(currentUser.name, '知识库', '编辑', targetMsg.content.slice(0, 50), '智能问答', `标记问答回答为有用`)
    }
  }

  const handleDislikeClick = (msgId: string) => {
    setDislikeTargetId(msgId)
    setDislikeComment('')
    setIsDislikeModalVisible(true)
  }

  const handleDislikeSubmit = () => {
    if (dislikeTargetId) {
      const targetMsg = messages.find(m => m.id === dislikeTargetId)
      setMessages(prev => prev.map(m =>
        m.id === dislikeTargetId
          ? { ...m, rating: 'dislike', reviewComment: dislikeComment.trim() || undefined }
          : m
      ))
      setIsDislikeModalVisible(false)
      setDislikeTargetId(null)
      setDislikeComment('')
      message.success('感谢您的反馈')
      if (targetMsg) {
        addAuditLog(currentUser.name, '知识库', '编辑', targetMsg.content.slice(0, 50), '智能问答', `标记问答回答为不满意，反馈：${dislikeComment.trim() || '无'}`)
      }
    }
  }

  const handleDislikeCancel = () => {
    setIsDislikeModalVisible(false)
    setDislikeTargetId(null)
    setDislikeComment('')
  }

  return (
    <div style={{ height: 'calc(100vh - 170px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>智能问答</h2>
        <Space>
          <Button onClick={handleClear}>清空对话</Button>
        </Space>
      </div>

      {/* 对话区域（可滚动） */}
      <Card
        style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 16, overflow: 'hidden' }}
        styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
      >
        <div
          ref={scrollRef}
          className="qa-chat-scroll"
          style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', padding: '12px 8px', scrollbarWidth: 'thin' }}
        >
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', marginBottom: 18, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1677ff', marginRight: 10, flexShrink: 0 }} />
              )}
              <div style={{ maxWidth: '68%' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                  {m.role === 'user' ? '我' : '智能助手'} &nbsp; {m.timestamp}
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: m.role === 'user' ? '#1677ff' : '#f5f7fa',
                    color: m.role === 'user' ? '#fff' : '#333',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                  }}
                >
                  {m.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Spin size="small" />
                      <span style={{ color: '#666' }}>正在思考...</span>
                    </div>
                  ) : m.content}
                </div>
                {m.attachments && m.attachments.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                    📎 已上传：{m.attachments.map(a => a.name).join('、')}
                  </div>
                )}
                {/* AI 回答下方的喜欢/不喜欢按钮（排除欢迎消息） */}
                {m.role === 'assistant' && !m.loading && m.id !== 'welcome' && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button
                      size="small"
                      type={m.rating === 'like' ? 'primary' : 'default'}
                      style={{
                        borderColor: m.rating === 'like' ? '#52c41a' : undefined,
                        background: m.rating === 'like' ? '#52c41a' : undefined,
                        color: m.rating === 'like' ? '#fff' : '#666',
                      }}
                      onClick={() => handleLike(m.id)}
                    >
                      👍 喜欢
                    </Button>
                    <Button
                      size="small"
                      type={m.rating === 'dislike' ? 'primary' : 'default'}
                      style={{
                        borderColor: m.rating === 'dislike' ? '#ff4d4f' : undefined,
                        background: m.rating === 'dislike' ? '#ff4d4f' : undefined,
                        color: m.rating === 'dislike' ? '#fff' : '#666',
                      }}
                      onClick={() => handleDislikeClick(m.id)}
                    >
                      👎 不喜欢
                    </Button>
                    {m.rating === 'dislike' && m.reviewComment && (
                      <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>
                        反馈：{m.reviewComment}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a', marginLeft: 10, flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 输入区域 */}
      <Card>
        <div style={{ marginBottom: 8 }}>
          <Upload
            multiple
            fileList={fileList}
            beforeUpload={(f) => {
              setFileList(prev => [...prev, f])
              return false
            }}
            onRemove={(f) => {
              setFileList(prev => prev.filter(x => x.uid !== f.uid))
            }}
          >
            <Button icon={<PaperClipOutlined />} size="small">上传文档（可多选，不自动提交）</Button>
          </Upload>
          {fileList.length > 0 && (
            <span style={{ marginLeft: 12, color: '#666', fontSize: 12 }}>已附加 {fileList.length} 个文档，将随下一条问题发送</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextArea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请输入您的问题，例如：信息系统等级保护2.0的实施要点包括哪些"
            autoSize={{ minRows: 2, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            style={{ flex: 1 }}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit} loading={submitting} style={{ alignSelf: 'flex-end', height: 44, minWidth: 96 }}>
            发送
          </Button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>💡 提示：按 Enter 发送，Shift+Enter 换行；上传的文档将作为回答的知识来源（模拟）。</div>
      </Card>

      {/* 不喜欢点评 Modal */}
      <Modal
        title="提供反馈"
        open={isDislikeModalVisible}
        onOk={handleDislikeSubmit}
        onCancel={handleDislikeCancel}
        width={560}
        okText="提交反馈"
        cancelText="取消"
        okButtonProps={{ disabled: !dislikeComment.trim() }}
      >
        <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
          请告诉我们您对该回答不满意的原因，这将帮助我们持续改进：
        </div>
        <TextArea
          value={dislikeComment}
          onChange={(e) => setDislikeComment(e.target.value)}
          rows={4}
          placeholder="例如：答案不够准确 / 内容不够详细 / 格式混乱 / 其他..."
          maxLength={300}
        />
        <div style={{ marginTop: 8, textAlign: 'right', fontSize: 12, color: '#999' }}>
          {dislikeComment.length}/300
        </div>
      </Modal>
    </div>
  )
}

export default KnowledgeQAPanel
