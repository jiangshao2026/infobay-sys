// ============================================================
// 详情 Modal 通用组件
// 说明：统一使用 Ant Design Descriptions 组件展示详情，
//       替代各页面中手写的 div+span 重复代码
// ============================================================
import { Modal, Descriptions, Tag, Progress, List, Space, Button } from 'antd'
import { EyeOutlined, DownloadOutlined, WarningOutlined } from '@ant-design/icons'
import type { DescriptionsProps } from 'antd'
import { useState } from 'react'
import { downloadAttachment, PreviewModal, FileIcon, formatFileSize } from './DocumentUploader'

// ---------- 通用详情 Modal ----------
interface DetailModalProps {
  open: boolean
  title: string
  items: DescriptionsProps['items']
  width?: number
  onClose: () => void
  children?: React.ReactNode
}

export const DetailModal = ({ open, title, items, width = 700, onClose, children }: DetailModalProps) => {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onClose}
      onCancel={onClose}
      width={width}
      okText="关闭"
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <Descriptions column={1} bordered size="small" items={items} />
      {children}
    </Modal>
  )
}

// ---------- 常用标签颜色映射（集中化，避免页面内重复 if-else） ----------
// 统一色系：
//   状态-待/进行中类: gold / blue / cyan
//   状态-完成/通过/正常: green
//   状态-异常/驳回/问题: red / volcano
//   级别-严重: red, 较严重: orange, 一般: blue, 轻微: cyan
//   类型/分类: geekblue
export const scaleColor = (scale: string): string =>
  scale === '大型' ? 'red' : scale === '中型' ? 'orange' : 'green'

// 统一状态映射（覆盖监理合同、项目启动、文档、计划、变更、安全、验收、知识、问题整改等）
export const statusColor = (status: string): string => {
  switch (status) {
    // —— 进行中/工作态 ——
    case '进行中':
    case '执行中':
      return 'blue'
    case '启动阶段':
    case '未启动':
      return 'default'
    case '已启动':
      return 'blue'
    case '整改中':
    case '编制中':
      return 'cyan'
    case '即将完工':
    case '即将到期':
      return 'orange'
    // —— 待审批/待确认类 ——
    case '待审批':
    case '待收款':
    case '待复查':
    case '待整改':
    case '待总监理工程师审批':
    case '待部门经理审批':
    case '待分管副总经理审批':
      return 'gold'
    // —— 完成/通过类 ——
    case '已完成':
    case '已审批':
    case '已执行':
    case '已通过':
    case '已收款':
    case '已完善':
    case '已验收':
      return 'green'
    // —— 异常/驳回类 ——
    case '已作废':
    case '已取消':
    case '已驳回':
    case '异常':
      return 'volcano'
    case '待完善':
      return 'gold'
    default:
      return 'gray'
  }
}

// 统一级别映射（问题级别/风险级别等）
export const levelColor = (level: string): string => {
  switch (level) {
    case '严重':
    case '高风险':
      return 'red'
    case '较严重':
    case '中风险':
      return 'orange'
    case '一般':
    case '低风险':
      return 'blue'
    case '轻微':
      return 'cyan'
    default:
      return 'gray'
  }
}

// 统一优先级
export const priorityColor = (priority: string): string =>
  priority === '高' ? 'red' : priority === '中' ? 'orange' : 'green'

// 统一类型/分类（文档类型/分类等用同一色系 geekblue 系列）
export const typeColor = (): string => 'geekblue'

// 统一分类（知识分类/信息分类等）
export const categoryColor = (): string => 'geekblue'

// —— 各页面独立颜色（保留，避免影响特定页面） ——
export const issueStatusColor = (status: string): string => {
  switch (status) {
    case '待整改':
      return 'gold'
    case '整改中':
      return 'cyan'
    case '待复查':
      return 'blue'
    case '已完成':
      return 'green'
    case '已驳回':
      return 'volcano'
    default:
      return 'gray'
  }
}

export const issueLevelColor = (level: string): string => {
  switch (level) {
    case '严重':
      return 'red'
    case '较严重':
      return 'orange'
    case '一般':
      return 'blue'
    case '轻微':
      return 'cyan'
    default:
      return 'gray'
  }
}

// 文档状态映射（知识库/信息管理文档）
export const docStatusColor = (status: string): string => {
  switch (status) {
    case '草稿':
    case '编制中':
      return 'default'
    case '待审批':
      return 'gold'
    case '已审批':
    case '已发布':
    case '已通过':
      return 'green'
    case '已驳回':
      return 'volcano'
    default:
      return 'gray'
  }
}

// ---------- 便捷描述项构造器 ----------
export const descItem = (
  label: string,
  children: React.ReactNode
): NonNullable<DescriptionsProps['items']>[number] => ({
  label,
  children,
})

export const descText = (value?: string | number): React.ReactNode => value || '—'

export const descTag = (
  value?: string,
  colorFn: (v: string) => string = statusColor
): React.ReactNode =>
  value ? <Tag color={colorFn(value)}>{value}</Tag> : '—'

export const descProgress = (progress: number): React.ReactNode => (
  <Progress percent={progress} size="small" style={{ maxWidth: 320 }} />
)

/** 判断文件内容是否可用 */
const hasValidContent = (file: { url?: string; fileId?: string }): boolean =>
  !!(file.fileId || (file.url && file.url.startsWith('data:')))

/** 附件列表内部组件（承载 useState hooks，避免父组件 hooks 数量变化） */
const DescAttachmentsInner: React.FC<{
  attachments: { name: string; url?: string; size?: number; uploadedBy?: string; uploadDate?: string; fileId?: string }[]
}> = ({ attachments }) => {
  const [previewDoc, setPreviewDoc] = useState<{
    key: string
    name: string
    url: string
    fileId?: string
    size?: number
    uploadedBy?: string
    uploadDate?: string
    type?: string
  } | null>(null)

  if (!attachments || attachments.length === 0) return null

  return (
    <>
      <List
        size="small"
        bordered
        dataSource={attachments}
        renderItem={(file) => (
          <List.Item
            actions={
              hasValidContent(file)
                ? [
                    <Button
                      key="view"
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setPreviewDoc({ ...file, key: file.fileId || file.url || '' })}
                    >
                      预览
                    </Button>,
                    <Button
                      key="download"
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadAttachment(file as any)}
                    >
                      下载
                    </Button>,
                  ]
                : undefined
            }
          >
            <List.Item.Meta
              avatar={
                hasValidContent(file)
                  ? <FileIcon doc={file as any} />
                  : <WarningOutlined style={{ fontSize: 20, color: '#faad14' }} />
              }
              title={
                hasValidContent(file)
                  ? <span style={{ fontSize: 13 }}>{file.name}</span>
                  : <span style={{ fontSize: 13, color: '#999' }}>{file.name} <Tag color="warning" style={{ fontSize: 11 }}>文件附件已丢失，请重新上传</Tag></span>
              }
              description={
                <Space size={12} style={{ fontSize: 12, color: '#999' }}>
                  {file.size ? <span>{formatFileSize(file.size)}</span> : null}
                  {file.uploadedBy ? <span>上传人：{file.uploadedBy}</span> : null}
                  {file.uploadDate ? <span>{file.uploadDate}</span> : null}
                </Space>
              }
            />
          </List.Item>
        )}
        style={{ maxWidth: 520 }}
      />
      <PreviewModal
        doc={previewDoc as any}
        onClose={() => setPreviewDoc(null)}
      />
    </>
  )
}

export const descAttachments = (
  attachments?: { name: string; url?: string; size?: number; uploadedBy?: string; uploadDate?: string; fileId?: string }[]
): React.ReactNode => {
  if (!attachments || attachments.length === 0) return '—'
  return <DescAttachmentsInner attachments={attachments} />
}

// ---------- 紧凑表格样式（替代页面内 inline <style>） ----------
export const CompactTableCssOnly = (): React.ReactNode => (
  <style>{`
    .ant-table-thead > tr > th,
    .ant-table-tbody > tr > td {
      padding: 6px 12px !important;
    }
    .ant-table-tbody > tr > td .ant-space {
      display: flex;
    }
  `}</style>
)
