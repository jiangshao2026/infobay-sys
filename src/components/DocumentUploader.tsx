import React, { useState, useRef } from 'react'
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

// ============================================================
// 工具方法
// ============================================================

/**
 * 文件大小格式化（字节 -> 可读字符串）
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/**
 * 生成唯一 key
 */
const genKey = (): string =>
  `${Date.now()}-${Math.floor(Math.random() * 100000)}`

/**
 * 当前日期时间字符串（用于模拟上传时间）
 */
const nowStr = (): string => {
  const d = new Date()
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 估算 base64 解码后的字节数 */
const estimateDecodedSize = (dataUrl: string): number => {
  const comma = dataUrl.indexOf(',')
  if (comma === -1) return dataUrl.length
  const base64 = dataUrl.slice(comma + 1)
  return Math.round(base64.length * 0.75)
}

// ============================================================
// 文件类型判断 & 预览渲染
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

/** 估算附件存储占用 localStorage 的百分比（基于 5MB 配额） */
const estimateStorageUsage = (docs: DocumentAttachment[]): number => {
  let total = 0
  for (const d of docs) {
    if (d.url && d.url.startsWith('data:')) {
      total += estimateDecodedSize(d.url)
    }
  }
  return total / (5 * 1024 * 1024) // 按 5MB 配额估算
}

const localStorageWarnThreshold = 0.7 // 达到 70% 配额时提醒

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
// PreviewContent - 根据文件类型渲染不同的预览内容
// ============================================================

interface PreviewContentProps {
  doc: DocumentAttachment
  maxHeight?: number
}

export const PreviewContent: React.FC<PreviewContentProps> = ({ doc, maxHeight = 500 }) => {
  const kind = getFileKind(doc)
  const style: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight,
    border: '1px solid #f0f0f0',
    borderRadius: 4,
  }

  if (!doc.url || !doc.url.startsWith('data:')) {
    return <div style={{ color: '#999', padding: 24, textAlign: 'center' }}>文件内容不可用</div>
  }

  switch (kind) {
    case 'image':
      return (
        <div style={{ textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={doc.url} alt={doc.name} style={style} />
        </div>
      )

    case 'pdf':
      return (
        <iframe
          src={doc.url}
          title={doc.name}
          style={{ ...style, width: '100%', height: maxHeight, border: 'none' }}
        />
      )

    case 'text': {
      const text = atob(doc.url.split(',')[1] || '')
      return (
        <pre style={{
          ...style,
          background: '#f6f8fa',
          padding: 16,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
        }}>
          {text}
        </pre>
      )
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
// 下载工具函数
// ============================================================

export const downloadAttachment = (doc: DocumentAttachment): void => {
  if (!doc.url || !doc.url.startsWith('data:')) {
    message.warning('文件内容不可用，无法下载')
    return
  }
  const link = document.createElement('a')
  link.href = doc.url
  link.download = doc.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  message.success(`正在下载：${doc.name}`)
}

// ============================================================
// PreviewModal - 预览弹窗（复用）
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
          <Tag color="blue">{formatFileSize(doc.size)}</Tag>
          <span style={{ color: '#666' }}>上传者：{doc.uploadedBy}</span>
          <span style={{ color: '#666' }}>{doc.uploadDate}</span>
        </Space>
        <PreviewContent doc={doc} maxHeight={420} />
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
  const innerInputRef = useRef<HTMLInputElement>(null)

  const setDocs = (next: DocumentAttachment[]) => {
    onChange?.(next)
  }

  const handleRemove = (key: string) => {
    const next = docs.filter(d => d.key !== key)
    setDocs(next)
    message.success('已移除附件')
  }

  /**
   * 使用 FileReader 将文件读取为 base64 Data URL 后存储
   */
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    // 检查文件大小（警告超过 1MB 的文件）
    if (file.size > 1024 * 1024) {
      message.warning(`文件 "${file.name}" 超过 1MB，过大文件可能影响演示系统性能`)
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string

      const newDoc: DocumentAttachment = {
        key: genKey(),
        name: file.name,
        url: dataUrl, // 存储完整的 base64 Data URL
        size: file.size,
        uploadedBy,
        uploadDate: nowStr(),
        type: file.type || '未知类型',
      }

      let next: DocumentAttachment[] = [...docs, newDoc]
      if (maxCount && next.length > maxCount) {
        next = next.slice(-maxCount)
        message.warning(`已超出最大附件数量 ${maxCount}，仅保留最新文件`)
      }

      setDocs(next)
      message.success(`已添加：${file.name}`)

      // 检查 localStorage 使用情况
      const usage = estimateStorageUsage(next)
      if (usage > localStorageWarnThreshold) {
        message.warning(
          `附件存储已占用约 ${(usage * 100).toFixed(0)}% 的本地存储空间，` +
          `建议及时移除不需要的附件以免影响系统性能`,
          5
        )
      }
    }
    reader.onerror = () => {
      message.error(`文件 "${file.name}" 读取失败，请重试`)
    }
    reader.readAsDataURL(file)

    return false // 阻止真实上传
  }

  const uploadProps: UploadProps = {
    multiple,
    accept,
    disabled,
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
          <p className="ant-upload-text">{placeholder}</p>
          <p className="ant-upload-hint">
            支持多种常见文档格式；文件将存储在浏览器本地（localStorage），
            刷新页面后仍然保留，更换设备或清除浏览器数据后会丢失。
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
                      onConfirm={() => handleRemove(doc.key)}
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
                      <Tag color="blue">{formatFileSize(doc.size)}</Tag>
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

      <input ref={innerInputRef} type="file" style={{ display: 'none' }} />
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
                  <Tag color="blue">{formatFileSize(doc.size)}</Tag>
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