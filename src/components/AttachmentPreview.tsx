// ============================================================
// AttachmentPreview - 附件预览组件
// 风格与 DocumentList（验收管理模块）保持一致
// ============================================================
import { useState } from 'react'
import { List, Button, Space, Tag, Modal, message } from 'antd'
import { FileTextOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'

interface AttachmentFile {
  name: string
  url: string
  size?: number
  uploadedBy?: string
  uploadDate?: string
  type?: string
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
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
                onClick={() => message.info('演示环境，暂不提供下载')}
              >
                下载
              </Button>,
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

export default AttachmentPreview
