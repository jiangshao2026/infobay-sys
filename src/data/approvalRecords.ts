import type { ApprovalRecord, DocumentAttachment } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-审批意见附件.pdf`,
    url: `#${seed}-1`,
    size: 123000,
    uploadedBy: '韦江腾',
    uploadDate: '2025-06-01 09:00:00',
    type: 'application/pdf',
  },
]

// 共用审批记录；code 字段关联具体业务（如变更、质量报告等）
const initialData: ApprovalRecord[] = [
  // 市场监管局信息系统数据库分库分表变更
  {
    key: 'ar-1',
    code: 'CR-2025-001',
    level: 1,
    reviewer: '韦江腾',
    comment: '变更理由充分，技术方案基本合理，建议通过。',
    status: '通过',
    date: '2025-05-12',
    attachment: att('ar1'),
  },
  {
    key: 'ar-2',
    code: 'CR-2025-001',
    level: 2,
    reviewer: '韦江腾',
    comment: '方案评审通过，同意推进。',
    status: '通过',
    date: '2025-05-14',
    attachment: att('ar2'),
  },
  {
    key: 'ar-3',
    code: 'CR-2025-001',
    level: 3,
    reviewer: '王小平',
    comment: '终审通过，按计划实施。',
    status: '通过',
    date: '2025-05-18',
    attachment: att('ar3'),
  },
  // 海洋综合执法船艇卫星定位中继设备变更
  {
    key: 'ar-4',
    code: 'CR-2025-002',
    level: 1,
    reviewer: '韦江腾',
    comment: '方案技术可行，同意进入二审。',
    status: '通过',
    date: '2025-05-28',
    attachment: att('ar4'),
  },
  {
    key: 'ar-5',
    code: 'CR-2025-002',
    level: 2,
    reviewer: '韦江腾',
    comment: '成本较高，建议重新测算后再推进；暂驳回。',
    status: '驳回',
    date: '2025-06-01',
    attachment: att('ar5'),
  },
  // 智慧海洋监管平台预警通道扩展
  {
    key: 'ar-6',
    code: 'CR-2025-003',
    level: 1,
    reviewer: '黄志强',
    comment: '范围与进度影响合理，建议通过。',
    status: '通过',
    date: '2025-06-25',
    attachment: att('ar6'),
  },
  // 民政系统历史数据变更驳回
  {
    key: 'ar-7',
    code: 'CR-2025-005',
    level: 1,
    reviewer: '滕海燕',
    comment: '补充方案过于笼统，建议细化后重新提交。',
    status: '驳回',
    date: '2025-06-05',
    attachment: att('ar7'),
  },
  // 质量报告审批
  {
    key: 'ar-8',
    code: 'QR-2025-05',
    level: 1,
    reviewer: '韦江腾',
    comment: '质量月报内容完备，同意发布。',
    status: '通过',
    date: '2025-06-04',
    attachment: att('ar8'),
  },
  // 市场主体登记系统阶段质量评审
  {
    key: 'ar-9',
    code: 'QR-2025-PH1',
    level: 1,
    reviewer: '韦江腾',
    comment: '阶段目标达成，存在性能问题需后续关注，一审通过。',
    status: '通过',
    date: '2025-05-22',
    attachment: att('ar9'),
  },
]

export default initialData
