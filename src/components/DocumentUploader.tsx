import React, { useState, useEffect } from 'react'
import { Upload, Button, Modal, List, Space, Tag, message, Popconfirm } from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileUnknownOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import type { DocumentAttachment } from '../types/projectManagement'
import { saveFile, loadFile, deleteFile, estimateIndexedDBUsage, formatFileSize as idbFormatSize } from '../utils/fileStore'

// ============================================================
// 工具方法
// ============================================================

export { formatFileSize } from '../utils/fileStore'

/**
 * 生成唯一 key（同时作为 IndexedDB 存储 key）
 */
const genKey = (): string =>
  `${Date.now()}-${Math.floor(Math.random() * 100000)}`

/**
 * 当前日期时间字符串
 */
const nowStr = (): string => {
  const d = new Date()
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// ============================================================
// 文件类型判断
// ============================================================

type FileKind = 'image' | 'pdf' | 'text' | 'other'

const getFileKind = (doc: DocumentAttachment): FileKind => {
  const t = (doc.type || '').toLowerCase()
  const n = doc.name.toLowerCase()
  if (t.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(n)) return 'image'
  if (t === 'application/pdf' || n.endsWith('.pdf')) return 'pdf'
  if (t.startsWith('text/') || /\.(txt|md|csv|json|xml|yml|yaml|log|js|ts|jsx|tsx|html|css|sql|py|java|go|rs|sh|bat|ps1|env|gitignore)$/i.test(n)) return 'text'
  return 'other'
}

export const FileIcon: React.FC<{ doc: DocumentAttachment; style?: React.CSSProperties }> = ({ doc, style }) => {
  const kind = getFileKind(doc)
  const iconStyle = { fontSize: 20, ...style }
  switch (kind) {
    case 'image': return <FileImageOutlined style={{ ...iconStyle, color: '#52c41a' }} />
    case 'pdf': return <FilePdfOutlined style={{ ...iconStyle, color: '#f5222d' }} />
    default: return <FileTextOutlined style={{ ...iconStyle, color: '#1677ff' }} />
  }
}

// ============================================================
// useFileBlobUrl - 从 IndexedDB 加载文件生成 Blob URL
// ============================================================

/**
 * 根据 DocumentAttachment 获取可预览的 URL：
 *  - 有 fileId 时：从 IndexedDB 加载 → 创建 Blob URL
 *  - 无 fileId 时：直接返回 url（兼容演示 SVG 数据）
 */
function useFileBlobUrl(doc: DocumentAttachment | null): string | undefined {
  const [blobUrl, setBlobUrl] = useState<string | undefined>()

  useEffect(() => {
    if (!doc) {
      setBlobUrl(undefined)
      return
    }

    // 演示数据：仅 data: 协议的 url（SVG 缩略图）视为有效，'#' 等占位符返回 undefined
    if (!doc.fileId) {
      setBlobUrl(doc.url?.startsWith('data:') ? doc.url : undefined)
      return
    }

    let cancelled = false
    let currentUrl: string | undefined

    loadFile(doc.fileId).then((buffer) => {
      if (cancelled) return
      if (buffer) {
        const blob = new Blob([buffer], { type: doc.type || 'application/octet-stream' })
        currentUrl = URL.createObjectURL(blob)
        setBlobUrl(currentUrl)
      } else {
        setBlobUrl(undefined)
      }
    })

    return () => {
      cancelled = true
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [doc?.key, doc?.fileId])

  return blobUrl
}

// ============================================================
// TextPreviewContent - 文本文件预览（独立组件解决 Hooks 调用顺序问题）
// ============================================================

const TextPreviewContent: React.FC<{ doc: DocumentAttachment; containerStyle: React.CSSProperties }> = ({ doc, containerStyle }) => {
  const [text, setText] = useState<string>('')

  useEffect(() => {
    if (doc.fileId) {
      loadFile(doc.fileId).then(buf => {
        if (buf) {
          const decoder = new TextDecoder('utf-8')
          setText(decoder.decode(buf))
        }
      })
    } else if (doc.url?.startsWith('data:')) {
      try { setText(atob(doc.url.split(',')[1])) } catch { setText('') }
    }
  }, [doc.fileId, doc.url])

  return (
    <pre style={{
      ...containerStyle,
      background: '#f6f8fa',
      padding: 16,
      overflow: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      fontSize: 13,
      lineHeight: 1.6,
      fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
    }}>
      {text || '正在加载…'}
    </pre>
  )
}

// ============================================================
// FilePreviewContent - 根据文件类型渲染预览内容
// ============================================================

interface FilePreviewContentProps {
  doc: DocumentAttachment
  maxHeight?: number
}

const FilePreviewContent: React.FC<FilePreviewContentProps> = ({ doc, maxHeight = 500 }) => {
  const blobUrl = useFileBlobUrl(doc)
  const kind = getFileKind(doc)

  const containerStyle: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight,
    border: '1px solid #f0f0f0',
    borderRadius: 4,
  }

  if (!blobUrl) {
    return (
      <div style={{ color: '#999', padding: 24, textAlign: 'center' }}>
        <FileUnknownOutlined style={{ fontSize: 48, color: '#d9d9d9', display: 'block', marginBottom: 12 }} />
        <p>文件内容不可用</p>
        {doc.fileId && <p style={{ fontSize: 12 }}>文件可能在清除浏览器数据后丢失</p>}
      </div>
    )
  }

  switch (kind) {
    case 'image':
      return (
        <div style={{ textAlign: 'center' }}>
          <img src={blobUrl} alt={doc.name} style={containerStyle} />
        </div>
      )

    case 'pdf':
      return (
        <iframe
          src={blobUrl}
          title={doc.name}
          style={{ ...containerStyle, width: '100%', height: maxHeight, border: 'none' }}
        />
      )

    case 'text': {
      return <TextPreviewContent doc={doc} containerStyle={containerStyle} />
    }

    default:
      return (
        <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
          <FileUnknownOutlined style={{ fontSize: 48, color: '#d9d9d9', display: 'block', marginBottom: 12 }} />
          <p>此文件类型暂不支持在线预览</p>
          <p style={{ fontSize: 12 }}>请使用下载功能查看文件</p>
        </div>
      )
  }
}

// ============================================================
// 下载函数（从 IndexedDB 加载后触发下载）
// ============================================================

export const downloadAttachment = async (doc: DocumentAttachment): Promise<void> => {
  let blob: Blob | undefined

  if (doc.fileId) {
    // 用户上传的文件：从 IndexedDB 加载
    const buffer = await loadFile(doc.fileId)
    if (!buffer) {
      message.warning('文件内容不可用，无法下载')
      return
    }
    blob = new Blob([buffer], { type: doc.type || 'application/octet-stream' })
  } else if (doc.url?.startsWith('data:')) {
    // 演示数据：从 data URL 转换
    const res = await fetch(doc.url)
    blob = await res.blob()
  } else {
    message.warning('文件内容不可用，无法下载')
    return
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = doc.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  message.success(`正在下载：${doc.name}`)
}

// ============================================================
// PreviewModal - 预览弹窗
// ============================================================

interface PreviewModalProps {
  doc: DocumentAttachment | null
  onClose: () => void
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ doc, onClose }) => {
  if (!doc) return null

  return (
    <Modal
      open={!!doc}
      title={
        <Space>
          <FileIcon doc={doc} />
          <span>{doc.name}</span>
        </Space>
      }
      onCancel={onClose}
      width={720}
      footer={
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => { downloadAttachment(doc); onClose() }}
          >
            下载文件
          </Button>
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
    >
      <div style={{ padding: '8px 0' }}>
        <Space style={{ marginBottom: 16 }} size={12}>
          <Tag color="blue">{idbFormatSize(doc.size || 0)}</Tag>
          <span style={{ color: '#666' }}>上传者：{doc.uploadedBy}</span>
          <span style={{ color: '#666' }}>{doc.uploadDate}</span>
        </Space>
        <FilePreviewContent doc={doc} maxHeight={420} />
      </div>
    </Modal>
  )
}

// ============================================================
// DocumentUploader - 附件上传组件
// ============================================================

export interface DocumentUploaderProps {
  value?: DocumentAttachment[]
  onChange?: (docs: DocumentAttachment[]) => void
  uploadedBy?: string
  maxCount?: number
  multiple?: boolean
  disabled?: boolean
  accept?: string
  placeholder?: string
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  value = [],
  onChange,
  uploadedBy = '当前用户',
  maxCount,
  multiple = true,
  disabled = false,
  accept,
  placeholder = '点击或拖拽文件到此区域上传',
}) => {
  const docs = value || []
  const [previewDoc, setPreviewDoc] = useState<DocumentAttachment | null>(null)
  const [uploading, setUploading] = useState(false)

  const setDocs = (next: DocumentAttachment[]) => {
    onChange?.(next)
  }

  const handleRemove = async (doc: DocumentAttachment) => {
    // 从 IndexedDB 删除文件内容
    if (doc.fileId) {
      try {
        await deleteFile(doc.fileId)
      } catch (e) {
        console.warn('删除 IndexedDB 文件失败:', e)
      }
    }
    const next = docs.filter(d => d.key !== doc.key)
    setDocs(next)
    message.success('已移除附件')
  }

  /**
   * 使用 FileReader 读取文件为 ArrayBuffer，存入 IndexedDB
   */
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    setUploading(true)

    // 单文件大小限制（20MB）
    if (file.size > 20 * 1024 * 1024) {
      message.error(`文件 "${file.name}" 超过 20MB 限制`)
      setUploading(false)
      return false
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer
      const fileKey = genKey()

      try {
        // 存入 IndexedDB
        await saveFile(fileKey, buffer)

        const newDoc: DocumentAttachment = {
          key: fileKey,
          name: file.name,
          url: '', // 用户上传的文件不存 url
          fileId: fileKey, // IndexedDB key
          size: file.size,
          uploadedBy,
          uploadDate: nowStr(),
          type: file.type || 'application/octet-stream',
        }

        let next: DocumentAttachment[] = [...docs, newDoc]
        if (maxCount && next.length > maxCount) {
          next = next.slice(-maxCount)
          message.warning(`已超出最大附件数量 ${maxCount}，仅保留最新文件`)
        }

        setDocs(next)
        message.success(`已添加：${file.name}`)

        // 检查 IndexedDB 使用情况
        const usage = await estimateIndexedDBUsage()
        if (usage.fileCount > 20) {
          message.info(
            `已存储 ${usage.fileCount} 个文件，共 ${idbFormatSize(usage.usedBytes)}` +
            `，建议及时移除不需要的附件`,
            4
          )
        }
      } catch (err) {
        message.error(`文件 "${file.name}" 存储失败，请重试`)
        console.error('saveFile error:', err)
      } finally {
        setUploading(false)
      }
    }
    reader.onerror = () => {
      message.error(`文件 "${file.name}" 读取失败，请重试`)
      setUploading(false)
    }
    reader.readAsArrayBuffer(file)

    return false // 阻止真实上传
  }

  const uploadProps: UploadProps = {
    multiple,
    accept,
    disabled: disabled || uploading,
    beforeUpload,
    showUploadList: false,
  }

  return (
    <div className="document-uploader">
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">{uploading ? '正在上传…' : placeholder}</p>
          <p className="ant-upload-hint">
            支持多种常见文档格式；单文件最大 20MB。
            文件存储在浏览器 IndexedDB 中，刷新页面后仍然保留，
            更换设备或清除浏览器数据后会丢失。
          </p>
        </Upload.Dragger>

        {docs.length > 0 && (
          <List
            size="small"
            bordered
            header={<div style={{ fontWeight: 600 }}>已上传附件（{docs.length}）</div>}
            dataSource={docs}
            renderItem={(doc) => (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    预览
                  </Button>,
                  <Button
                    key="download"
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadAttachment(doc)}
                  >
                    下载
                  </Button>,
                  !disabled && (
                    <Popconfirm
                      key="del"
                      title="确认移除该附件？"
                      onConfirm={() => handleRemove(doc)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                        移除
                      </Button>
                    </Popconfirm>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={<FileIcon doc={doc} />}
                  title={doc.name}
                  description={
                    <Space size={8}>
                      <Tag color="blue">{idbFormatSize(doc.size || 0)}</Tag>
                      <span style={{ color: '#999' }}>{doc.uploadedBy}</span>
                      <span style={{ color: '#999' }}>{doc.uploadDate}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>

      <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  )
}

// ============================================================
// DocumentList - 附件列表查看组件（只读）
// ============================================================

export interface DocumentListProps {
  documents: DocumentAttachment[]
  title?: string
  showDownload?: boolean
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents = [],
  title = '附件列表',
  showDownload = true,
}) => {
  const [previewDoc, setPreviewDoc] = useState<DocumentAttachment | null>(null)

  if (!documents || documents.length === 0) {
    return (
      <div style={{ color: '#999', fontSize: 13 }}>
        <FileTextOutlined /> 暂无附件
      </div>
    )
  }

  return (
    <>
      <List
        size="small"
        bordered
        header={<div style={{ fontWeight: 600 }}>{title}（{documents.length}）</div>}
        dataSource={documents}
        renderItem={(doc) => (
          <List.Item
            actions={[
              <Button
                key="view"
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setPreviewDoc(doc)}
              >
                预览
              </Button>,
              showDownload && (
                <Button
                  key="download"
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => downloadAttachment(doc)}
                >
                  下载
                </Button>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={<FileIcon doc={doc} />}
              title={doc.name}
              description={
                <Space size={8} wrap>
                  <Tag color="blue">{idbFormatSize(doc.size || 0)}</Tag>
                  <span style={{ color: '#999' }}>{doc.uploadedBy}</span>
                  <span style={{ color: '#999' }}>{doc.uploadDate}</span>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  )
}

// 类型兼容
export type { UploadFile }

export default DocumentUploader