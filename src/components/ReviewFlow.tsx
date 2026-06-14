import React, { useState } from 'react'
import { Timeline, Modal, Form, Select, Input, Button, message, Space, Tag } from 'antd'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  UserOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons'
import type { ApprovalRecord } from '../types/projectManagement'

export type { ApprovalRecord }

// ============================================================
// 审批链配置（V0.2）
// - CONTRACT: 监理合同：销售 → 总监理工程师 → 部门经理 → 分管副总经理（4级）
// - KNOWLEDGE: 知识文档：知识管理员 → 分管副总经理（2级）
// - PROJECT: 其他监理项目相关：监理工程师 → 总监理工程师（2级）
// ============================================================

export type ApprovalChainType = 'CONTRACT' | 'KNOWLEDGE' | 'PROJECT' | 'PAYMENT' | 'STARTUP' | 'DOCUMENT'

export interface ApprovalChain {
  /** 唯一标识 */
  type: ApprovalChainType
  /** 审批节点名称（用于 ReviewTimeline 显示） */
  levels: string[]
  /** 各节点默认审批人（与 levels 对应） */
  reviewers: string[]
  /** 各节点审批人角色（与 levels 对应，用于权限判断） */
  roles?: string[]
  /** 各节点默认审批意见（与 levels 对应） */
  defaultComments: string[]
  /** 各节点通过后的下一个状态（与 levels 对应，null 表示到终点） */
  nextStatus?: (string | null)[]
  /** 供 ReviewModal 下拉选择的候选审批人 */
  reviewerOptions: string[]
  /** 通过时的最终状态（最后一级审批通过后应用此状态） */
  finalApprovedStatus: string
  /** 驳回时的状态 */
  rejectedStatus: string
  /** 中间级通过后的状态（可选，若为空则保持原状态） */
  inProgressStatus?: string
  /** 仅销售可发起的审批（如监理合同），第一级为销售发起 */
  salesInitiated?: boolean
}

export const APPROVAL_CHAINS: Record<ApprovalChainType, ApprovalChain> = {
  CONTRACT: {
    type: 'CONTRACT',
    levels: ['销售发起', '总监理工程师审批', '部门经理审批', '分管副总经理审批'],
    reviewers: ['孙永秀', '韦江腾', '王华', '王小平'],
    roles: ['销售', '总监理工程师', '部门经理', '副总经理'],
    defaultComments: [
      '合同条款已审核，选择总监理工程师并提交。',
      '合同已审核，符合监理工作要求，同意。',
      '部门流程合规，同意。',
      '终审通过，合同可正式签订。',
    ],
    nextStatus: ['待总监理工程师审批', '待部门经理审批', '待分管副总经理审批', null],
    reviewerOptions: ['孙永秀', '韦江腾', '赵雄飞', '许小嘉', '王华', '王小平', '蔡海婷', '许琰芳', '李金花', '滕海燕'],
    finalApprovedStatus: '已审批',
    rejectedStatus: '已驳回',
    inProgressStatus: '审批中',
    salesInitiated: true,
  },
  KNOWLEDGE: {
    type: 'KNOWLEDGE',
    levels: ['知识管理员初审', '分管副总经理审批'],
    reviewers: ['韦江腾', '王小平'],
    defaultComments: [
      '文档内容符合知识库规范，初审通过。',
      '终审通过，同意发布。',
    ],
    reviewerOptions: ['韦江腾', '王小平', '滕海燕'],
    finalApprovedStatus: '已发布',
    rejectedStatus: '草稿',
    inProgressStatus: '待审批',
  },
  PROJECT: {
    type: 'PROJECT',
    levels: ['监理工程师审批', '总监理工程师审批'],
    reviewers: ['滕海燕', '韦江腾'],
    defaultComments: [
      '文档内容规范，符合监理要求，同意通过。',
      '复核无误，审批通过。',
    ],
    reviewerOptions: ['滕海燕', '韦江腾', '王华'],
    finalApprovedStatus: '已审批',
    rejectedStatus: '已驳回',
    inProgressStatus: '审批中',
  },
  PAYMENT: {
    type: 'PAYMENT',
    levels: ['监理工程师审核', '总监理工程师审批'],
    reviewers: ['滕海燕', '韦江腾'],
    defaultComments: [
      '支付申请资料齐全，金额与合同进度相符，同意支付。',
      '已复核支付条件，同意签发支付意见。',
    ],
    reviewerOptions: ['滕海燕', '韦江腾'],
    finalApprovedStatus: '已审批',
    rejectedStatus: '已驳回',
    inProgressStatus: '审批中',
  },
  STARTUP: {
    type: 'STARTUP',
    levels: ['监理工程师审核', '总监理工程师审批'],
    reviewers: ['滕海燕', '韦江腾'],
    defaultComments: [
      '开工条件已具备，实施方案可行，同意开工。',
      '已复核开工准备工作，同意签发开工令。',
    ],
    reviewerOptions: ['滕海燕', '韦江腾'],
    finalApprovedStatus: '已审批',
    rejectedStatus: '已驳回',
    inProgressStatus: '审批中',
  },
  DOCUMENT: {
    type: 'DOCUMENT',
    levels: ['监理工程师审核', '总监理工程师审批'],
    reviewers: ['滕海燕', '韦江腾'],
    defaultComments: [
      '文档内容完整，格式规范，符合监理要求，同意提交。',
      '审核意见完整，已通过最终审核，同意发布监理审核意见。',
    ],
    reviewerOptions: ['滕海燕', '韦江腾'],
    finalApprovedStatus: '已发布',
    rejectedStatus: '已驳回',
    inProgressStatus: '待审批',
  },
}

// ============================================================
// ReviewTimeline - 多级审批流程时间线
// ============================================================

export interface ReviewTimelineProps {
  /** 当前审批等级（1/2/3...），用于渲染尚未完成的节点
   */
  levels?: string[]
  /** 已有审批记录列表（按 level 排序） */
  records?: ApprovalRecord[]
  /** 当前审批流程总体状态，如 '待审批' | '审批中' | '已通过' | '已驳回' 等 */
  status?: string
}

const DEFAULT_LEVELS = ['一级审批', '二级审批', '终审']

/** 依据状态返回对应节点图标 */
const dotFor = (rec?: ApprovalRecord, pending?: boolean) => {
  if (!rec) {
    return pending ? <ClockCircleOutlined style={{ color: '#faad14' }} /> : <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
  }
  if (rec.status === '通过') {
    return <CheckCircleFilled style={{ color: '#52c41a' }} />
  }
  return <CloseCircleFilled style={{ color: '#ff4d4f' }} />
}

export const ReviewTimeline: React.FC<ReviewTimelineProps> = ({
  levels = DEFAULT_LEVELS,
  records = [],
  status,
}) => {
  // 按 level 排序已有记录
  const sorted = [...records].sort((a, b) => a.level - b.level)
  const items = levels.map((name, idx) => {
    const level = idx + 1
    const rec = sorted.find(r => r.level === level)
    const isLast = idx === levels.length - 1
    // 当前节点：
    // - rec 存在 -> 显示记录
    // - 否则为待审批，若整体状态为"已驳回"则该节点之后都显示为"未进行"
    return {
      dot: dotFor(rec),
      color: rec ? (rec.status === '通过' ? 'green' : 'red') : 'gray',
      children: (
        <div style={{ paddingBottom: isLast ? 0 : 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          {rec ? (
            <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.8 }}>
              <div>
                <UserOutlined /> <b>{rec.reviewer}</b> · {rec.date}
                <Tag
                  style={{ marginLeft: 8 }}
                  color={rec.status === '通过' ? 'green' : 'red'}
                >
                  {rec.status}
                </Tag>
              </div>
              <div style={{ color: '#555' }}>意见：{rec.comment || '—'}</div>
              {rec.code && <div style={{ color: '#999' }}>编号：{rec.code}</div>}
            </div>
          ) : (
            <div style={{ color: '#999', marginTop: 4, fontSize: 13 }}>
              尚未审批
            </div>
          )}
        </div>
      ),
    }
  })

  return (
    <div>
      {status && (
        <div style={{ marginBottom: 12 }}>
          <Tag color="blue">当前状态：{status}</Tag>
        </div>
      )}
      <Timeline items={items as any} />
    </div>
  )
}

// ============================================================
// ReviewModal - 审批操作弹窗
// ============================================================

export interface ReviewModalProps {
  open: boolean
  title?: string
  /** 提交时触发；若为 true 则关闭 */
  onClose: () => void
  onSubmit?: (payload: {
    status: '通过' | '驳回'
    comment: string
    reviewer: string
  }) => void
  /** 可选候选审批人列表 */
  reviewerOptions?: string[]
  /** 默认审批人初始值（若未提供 currentUser 则使用） */
  defaultReviewer?: string
  /** 当前登录用户姓名；提供后审批人固定为该用户且不可修改 */
  currentUser?: string
  /** 允许选择的状态（默认 '通过'|'驳回'） */
  allowActions?: Array<'通过' | '驳回'>
  /** 确认按钮文本 */
  okText?: string
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  title = '合同审批',
  onClose,
  onSubmit,
  reviewerOptions = ['韦江腾', '滕海燕', '孙永秀', '蔡海婷', '许琰芳', '李金花', '王华', '王小平'],
  defaultReviewer,
  currentUser,
  allowActions = ['通过', '驳回'],
  okText = '提交审批',
}) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // 审批人默认值：优先使用 currentUser，否则 defaultReviewer，否则取候选列表第一项
  const reviewerValue = currentUser || defaultReviewer || reviewerOptions[0]
  // 是否锁定审批人（提供了 currentUser 则锁定为当前用户不可更改）
  const reviewerLocked = Boolean(currentUser)

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      onSubmit?.({
        status: values.status,
        comment: values.comment,
        reviewer: values.reviewer,
      })
      message.success('审批已提交')
      form.resetFields()
      setSubmitting(false)
      onClose()
    } catch {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={title}
      open={open}
      forceRender
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={submitting}
      okText={okText}
      cancelText="取消"
      width={560}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: allowActions[0] || '通过',
          reviewer: reviewerValue,
        }}
      >
        <Form.Item
          label="审批结果"
          name="status"
          rules={[{ required: true, message: '请选择审批结果' }]}
        >
          <Select
            options={allowActions.map(a => ({ label: a, value: a }))}
            placeholder="请选择"
          />
        </Form.Item>

        <Form.Item
          label="审批人"
          name="reviewer"
          rules={[{ required: true, message: '请选择审批人' }]}
        >
          <Select
            disabled={reviewerLocked}
            showSearch={!reviewerLocked}
            placeholder="请选择或输入审批人"
            options={reviewerOptions.map(r => ({ label: r, value: r }))}
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="审批意见"
          name="comment"
          rules={[{ required: true, message: '请输入审批意见' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入审批意见（必填）"
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ============================================================
// ReviewPanel - 简易封装：同时显示审批时间线 + "发起审批"按钮
// ============================================================

export interface ReviewPanelProps {
  records?: ApprovalRecord[]
  status?: string
  levels?: string[]
  canReview?: boolean
  onReview?: () => void
  reviewButtonText?: string
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  records,
  status,
  levels,
  canReview = false,
  onReview,
  reviewButtonText = '发起审批',
}) => {
  return (
    <div>
      <ReviewTimeline records={records} status={status} levels={levels} />
      {canReview && (
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <Space>
            <Button type="primary" onClick={onReview}>
              {reviewButtonText}
            </Button>
          </Space>
        </div>
      )}
    </div>
  )
}

// ============================================================
// getApprovalRecords —— 通用：根据审批链配置和当前状态生成默认审批记录
//
// 优先级：若用户已手动发起审批（approvalMap 内有记录），优先返回
// 否则，根据当前记录的 status 字段按审批链推算一套默认记录，
// 避免"记录已审批但审批时间线显示为空白"的不一致。
// ============================================================

/** 通过类：该状态视为全流程通过 */
const STATUS_APPROVED = new Set([
  '已审批', '已通过', '已批准', '已完成', '已执行', '已发布',
  '已关闭', '已整改', '已复查', '已实施', '已收款', '已支付',
  '执行中', '即将到期', '正常', '提前', '已归档', '已调阅', '已签订',
  '一审通过', '已支付',
])
/** 驳回类：该状态视为流程中断 */
const STATUS_REJECTED = new Set(['已驳回', '不通过'])
/** 待处理类：该状态视为尚未开始或进行中，不显示默认通过记录 */
const STATUS_PENDING = new Set([
  '待审批', '一审中', '审批中', '待整改', '整改中', '待复查', '待处理',
  '处理中', '待提交', '待验收', '验收中', '待归档', '归档中',
  '待收款', '待支付', '编制中', '草稿', '待签订', '待启动',
  '待总监理工程师审批', '待部门经理审批', '待分管副总经理审批',
])
/** 终止类：已作废/中止等，不显示 */
const STATUS_TERMINATED = new Set(['已作废', '已中止', '已取消', '已暂停', '滞后'])

export function getApprovalRecords(
  item: { key: string; code?: string; status: string },
  approvalMap: Record<string, ApprovalRecord[]>,
  chain: ApprovalChainType | ApprovalChain | string[] = 'PROJECT',
  dateStr: string = '',
): ApprovalRecord[] {
  const manualRecords = approvalMap?.[item.key]
  if (manualRecords && manualRecords.length > 0) return manualRecords

  // 兼容三种调用方式：
  //   ① 类型字符串  : 'PROJECT' | 'CONTRACT' | ...
  //   ② 完整配置对象: { levels, reviewers, defaultComments, ... }
  //   ③ 遗留字符串数组  : ['一级审批', '二级审批', '终审']
  let conf: ApprovalChain | undefined
  if (Array.isArray(chain)) {
    // 老调用：传入 levels 字符串数组 → 用 PROJECT 链的 reviewers/comments，覆盖 levels
    conf = {
      ...APPROVAL_CHAINS.PROJECT,
      levels: chain,
    }
  } else if (typeof chain === 'string') {
    conf = APPROVAL_CHAINS[chain as ApprovalChainType]
  } else {
    conf = chain
  }
  if (!conf || !conf.levels || !Array.isArray(conf.levels)) return []

  const status = item.status ?? ''
  const baseDate = dateStr || new Date().toISOString().slice(0, 10)

  if (STATUS_APPROVED.has(status)) {
    // 全流程通过：按链配置生成 levels.length 条"通过"记录
    return conf.levels.map((_, idx) => {
      const level = idx + 1
      return {
        key: `${item.key}-${level}`,
        code: `${item.code || item.key}-R${level}`,
        level,
        reviewer: conf.reviewers[idx] || `审批人${level}`,
        status: '通过' as const,
        comment: conf.defaultComments[idx] || '审批通过。',
        date: `${baseDate} 09:${String(10 + idx * 15).padStart(2, '0')}:00`,
      }
    })
  }

  if (STATUS_REJECTED.has(status)) {
    // 驳回：最后执行的那条驳回（2 级），前面全部通过
    const lastIdx = conf.levels.length - 1
    const recs: ApprovalRecord[] = []
    for (let i = 0; i < lastIdx; i++) {
      recs.push({
        key: `${item.key}-${i + 1}`,
        code: `${item.code || item.key}-R${i + 1}`,
        level: i + 1,
        reviewer: conf.reviewers[i] || `审批人${i + 1}`,
        status: '通过',
        comment: conf.defaultComments[i] || '同意。',
        date: `${baseDate} 09:${String(10 + i * 15).padStart(2, '0')}:00`,
      })
    }
    // 最后一级驳回
    recs.push({
      key: `${item.key}-${lastIdx + 1}`,
      code: `${item.code || item.key}-R${lastIdx + 1}`,
      level: lastIdx + 1,
      reviewer: conf.reviewers[lastIdx] || `审批人${lastIdx + 1}`,
      status: '驳回',
      comment: '审批意见中发现需修改项，请按要求修订后重新提交。',
      date: `${baseDate} 11:00:00`,
    })
    return recs
  }

  // 待处理 / 终止：不生成默认记录（界面显示"尚未审批"）
  if (STATUS_PENDING.has(status) || STATUS_TERMINATED.has(status)) return []
  return []
}

// ============================================================
// 审批文件生成与导出/打印工具（V0.2）
// - generateApprovalDocument：按类型生成可打印的 HTML 文档
// - exportDocument：下载为 .html（可另存为 PDF）
// - printDocument：直接打印
// ============================================================

export type DocumentKind =
  | 'paymentOpinion'      // 支付意见
  | 'startupOrder'        // 开工令
  | 'supervisionOpinion'  // 监理审核意见
  | 'contractApproval'    // 合同审批意见书
  | 'general'             // 通用审批意见

export interface DocumentContext {
  /** 文档编号（如：PO-2025-001） */
  code: string
  /** 项目名称/关联项目 */
  projectName: string
  /** 合同编号或主题（可选） */
  contractRef?: string
  /** 文档标题（主标题，如"支付意见"、"开工令"） */
  title: string
  /** 副标题（如"工程款支付意见"、"开工令"） */
  subtitle?: string
  /** 正文段落数组，每段一个字符串 */
  body: string[]
  /** 附件名称（可选，列出附件） */
  attachments?: string[]
  /** 审批记录（显示在底部的签名栏） */
  approvals?: ApprovalRecord[]
  /** 签发日期（格式 YYYY-MM-DD） */
  date?: string
}

/** 生成正式的审批/意见文档 HTML（可打印或另存为 PDF） */
export function generateApprovalDocument(kind: DocumentKind, ctx: DocumentContext): string {
  const kindTitleMap: Record<DocumentKind, string> = {
    paymentOpinion: '工程款支付意见',
    startupOrder: '工程开工令',
    supervisionOpinion: '监理审核意见',
    contractApproval: '合同审批意见书',
    general: '审批意见书',
  }
  const title = ctx.title || kindTitleMap[kind]
  const dateStr = ctx.date || new Date().toISOString().slice(0, 10)
  const approvals = ctx.approvals || []

  // 页面样式：A4 纸风格 + 打印适配
  const bodyHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>${title} - ${ctx.code}</title>
<style>
  body {
    font-family: "Microsoft YaHei", "SimSun", serif;
    max-width: 900px;
    margin: 40px auto;
    padding: 40px;
    line-height: 1.9;
    color: #222;
  }
  .doc-header {
    text-align: center;
    border-bottom: 3px double #333;
    padding-bottom: 16px;
    margin-bottom: 28px;
  }
  .doc-header h1 {
    font-size: 30px;
    letter-spacing: 4px;
    margin: 0 0 8px 0;
  }
  .doc-header .sub {
    color: #666;
    font-size: 14px;
    letter-spacing: 2px;
  }
  .doc-meta {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #333;
    margin-bottom: 20px;
    padding: 8px 0;
    border-bottom: 1px solid #ddd;
  }
  .doc-body {
    font-size: 15px;
    text-indent: 2em;
    margin: 24px 0;
    white-space: pre-wrap;
  }
  .doc-body p { margin: 10px 0; text-indent: 2em; }
  .doc-section-title {
    font-weight: bold;
    font-size: 16px;
    margin-top: 24px;
    text-indent: 0;
  }
  .doc-attachments {
    font-size: 14px;
    text-indent: 0;
    margin-left: 2em;
  }
  .doc-attachments li { margin: 4px 0; }
  .signature-block {
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
    font-size: 14px;
  }
  .signature-block .sig {
    min-width: 180px;
    text-align: center;
    line-height: 2.2;
  }
  .sig .label { font-weight: bold; }
  .sig .line { border-top: 1px solid #333; display: block; margin: 0 auto 4px; width: 140px; }
  .approval-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
    text-indent: 0;
  }
  .approval-table th, .approval-table td {
    border: 1px solid #999;
    padding: 8px 10px;
    text-align: center;
  }
  .approval-table th {
    background: #f0f0f0;
    font-weight: bold;
  }
  .approval-table td.text-left { text-align: left; }
  .footer {
    text-align: right;
    font-size: 14px;
    margin-top: 40px;
    color: #333;
  }
  .brand {
    font-size: 12px;
    color: #999;
    text-align: center;
    margin-top: 60px;
    border-top: 1px dashed #ccc;
    padding-top: 10px;
  }
  @media print {
    body { margin: 16mm; padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="doc-header">
    <h1>${title}</h1>
    ${ctx.subtitle ? `<div class="sub">${ctx.subtitle}</div>` : ''}
  </div>

  <div class="doc-meta">
    <span>编号：${ctx.code}</span>
    <span>签发日期：${dateStr}</span>
  </div>

  <div class="doc-body">
    <p><span class="doc-section-title">项目名称：</span>${ctx.projectName || '—'}</p>
    ${ctx.contractRef ? `<p><span class="doc-section-title">合同/文件：</span>${ctx.contractRef}</p>` : ''}
    ${ctx.body.map(p => `<p>${p}</p>`).join('')}
    ${ctx.attachments && ctx.attachments.length > 0
      ? `<p class="doc-section-title">附件：</p>
         <ol class="doc-attachments">${ctx.attachments.map(a => `<li>${a}</li>`).join('')}</ol>`
      : ''}
  </div>

  ${approvals.length > 0 ? `
  <div class="doc-section-title" style="text-indent:0;margin-top:40px;">审批记录：</div>
  <table class="approval-table">
    <thead>
      <tr><th>审批级别</th><th>审批人</th><th>审批意见</th><th>日期</th><th>结果</th></tr>
    </thead>
    <tbody>
      ${approvals.map(r => `
        <tr>
          <td>第${r.level}级</td>
          <td>${r.reviewer}</td>
          <td class="text-left">${r.comment || '—'}</td>
          <td>${r.date}</td>
          <td>${r.status}</td>
        </tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="signature-block">
    ${approvals.length > 0
      ? approvals.slice(0, 3).map(r =>
        `<div class="sig"><span class="label">${r.reviewer}</span><span class="line"></span><span>（签字）</span></div>`).join('')
      : '<div class="sig"><span class="label">监理单位：广东信佰工程咨询有限公司</span><span class="line"></span><span>（盖章）</span></div><div class="sig"><span class="label">签发人</span><span class="line"></span><span>（签字）</span></div><div class="sig"><span class="label">日期</span><span class="line"></span><span>' + dateStr + '</span></div>'
    }
  </div>

  <div class="footer">签发单位：广东信佰工程咨询有限公司</div>
  <div class="brand no-print">信佰监理服务管理系统 v0.2 · 本文件仅供监理业务使用</div>
</body>
</html>`
  return bodyHtml
}

/** 下载 HTML 文档（用户可在浏览器中另存为 PDF） */
export function exportDocument(kind: DocumentKind, ctx: DocumentContext) {
  const html = generateApprovalDocument(kind, ctx)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${ctx.code || 'approval-document'}.html`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

/** 直接在新窗口打印（用户在打印对话框中可选择"另存为 PDF"） */
export function printDocument(kind: DocumentKind, ctx: DocumentContext) {
  const html = generateApprovalDocument(kind, ctx)
  const w = window.open('', '_blank', 'width=900,height=900')
  if (!w) {
    message.warning('请允许浏览器弹出窗口以进行打印')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => {
    try { w.print() } catch (e) { /* 打印功能在部分浏览器可能受限 */ }
  }, 400)
}

/** 在页面中嵌入"导出 / 打印"按钮组 */
export const DocumentActions: React.FC<{
  kind: DocumentKind
  ctx: DocumentContext
  label?: string
}> = ({ kind, ctx, label = '导出' }) => (
  <Space>
    <Button size="small" icon={<DownloadOutlined />} onClick={() => exportDocument(kind, ctx)}>
      导出{label}
    </Button>
    <Button size="small" icon={<PrinterOutlined />} onClick={() => printDocument(kind, ctx)}>
      打印
    </Button>
  </Space>
)

export default ReviewTimeline
