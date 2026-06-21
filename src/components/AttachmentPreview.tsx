// ============================================================
// AttachmentPreview - 附件预览组件（只读，合同管理模块使用）
// 复用 DocumentUploader 中的预览/下载逻辑
// ============================================================
import { useState } from 'react'
import { List, Button, Space, Tag } from 'antd'
import { FileTextOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { formatFileSize, FileIcon, downloadAttachment, PreviewModal } from './DocumentUploader'

interface AttachmentFile {
  name: string
  url: string
  size?: number
  uploadedBy?: string
  uploadDate?: string
  type?: string
}

interface Props {
  attachments?: AttachmentFile[]
  title?: string
}

const AttachmentPreview: React.FC<Props> = ({ attachments, title = '合同附件' }) => {
  const [active, setActive] = useState<AttachmentFile | null>(null)

  if (!attachments || attachments.length === 0) {
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
        header={<div style={{ fontWeight: 600 }}>{title}（{attachments.length}）</div>}
        dataSource={attachments}
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
              <Button
                key="download"
                type="link"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => downloadAttachment(doc as any)}
              >
                下载
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<FileIcon doc={doc as any} />}
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

      <PreviewModal
        doc={active as any}
        onClose={() => setActive(null)}
      />
    </>
  )
}

export default AttachmentPreview