import React, { useState, useRef } from 'react'
import { Upload, Button, Modal, List, Space, Tag, message, Popconfirm } from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
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
 * 生成唯一 key（简化）
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
   * 真正的上传处理：基于 ant design Upload 的 beforeUpload，
   * 实际仅在前端维护本地文件状态，不做真实上传。
   */
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const newDoc: DocumentAttachment = {
      key: genKey(),
      name: file.name,
      url: `#file-${file.name}`,
      size: file.size,
      uploadedBy,
      uploadDate: nowStr(),
      type: file.type || '未知类型',
    }

    // 超出最大数量时保留前面的
    let next: DocumentAttachment[] = [...docs, newDoc]
    if (maxCount && next.length > maxCount) {
      next = next.slice(-maxCount)
      message.warning(`已超出最大附件数量 ${maxCount}，仅保留最新文件`)
    }
    setDocs(next)
    message.success(`已添加：${file.name}`)
    return false // 阻止 ant design 默认的真实上传
  }

  const uploadProps: UploadProps = {
    multiple,
    accept,
    disabled,
    beforeUpload,
    showUploadList: false, // 用自定义列表展示
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
            支持多种常见文档格式；本系统为前端演示，文件仅在本地维护引用信息（文件名/时间/上传者/大小）
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
                    onClick={() =>
                      Modal.info({
                        title: '附件预览',
                        width: 560,
                        content: (
                          <div style={{ padding: '12px 0' }}>
                            <p><b>文件名：</b>{doc.name}</p>
                            <p><b>上传时间：</b>{doc.uploadDate}</p>
                            <p><b>上传者：</b>{doc.uploadedBy}</p>
                            <p><b>文件大小：</b>{formatFileSize(doc.size)}</p>
                            <p><b>类型：</b>{doc.type || '未知类型'}</p>
                            <p style={{ color: '#999' }}>
                              （演示环境下不提供真实文件下载，仅展示元信息。）
                            </p>
                          </div>
                        ),
                      })
                    }
                  >
                    预览
                  </Button>,
                  <Button
                    key="download"
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => message.info('演示环境，暂不提供下载')}
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
                  avatar={<FileTextOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
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
  const [active, setActive] = useState<DocumentAttachment | null>(null)

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
                onClick={() => setActive(doc)}
              >
                预览
              </Button>,
              showDownload && (
                <Button
                  key="download"
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => message.info('演示环境，暂不提供下载')}
                >
                  下载
                </Button>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={<FileTextOutlined style={{ fontSize: 18, color: '#1677ff' }} />}
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

      <Modal
        open={!!active}
        title="附件详情"
        onCancel={() => setActive(null)}
        onOk={() => setActive(null)}
        width={520}
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        {active && (
          <div style={{ lineHeight: 2 }}>
            <p><b>文件名：</b>{active.name}</p>
            <p><b>上传时间：</b>{active.uploadDate}</p>
            <p><b>上传者：</b>{active.uploadedBy}</p>
            <p><b>文件大小：</b>{formatFileSize(active.size)}</p>
            <p><b>类型：</b>{active.type || '未知类型'}</p>
            <p style={{ color: '#999' }}>（演示环境下不提供真实文件下载，仅展示元信息。）</p>
          </div>
        )}
      </Modal>
    </>
  )
}

// 类型兼容：ant design 导出的 UploadFile 偶尔会被其他地方用到
export type { UploadFile }

export default DocumentUploader
