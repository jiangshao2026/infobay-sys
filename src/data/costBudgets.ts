import type { CostBudgetItem, DocumentAttachment, ApprovalRecord } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-预算审批.xlsx`,
    url: `#${seed}-1`,
    size: 234000,
    uploadedBy: '财务',
    uploadDate: '2025-03-05 09:00:00',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
]

const initialData: CostBudgetItem[] = [
  {
    key: 'cb-1',
    code: 'CB-2025-001',
    projectCode: 'XB2005-0037',
    title: '市场监管局信息系统开发费用预算',
    category: '开发费',
    budgetAmount: 8500000,
    approvedAmount: 8200000,
    periodStart: '2025-01-01',
    periodEnd: '2026-06-30',
    status: '已审批',
    attachments: att('cb1'),
  },
  {
    key: 'cb-2',
    code: 'CB-2025-002',
    projectCode: 'XB2005-0037',
    title: '市场监管局设备采购预算',
    category: '设备费',
    budgetAmount: 12000000,
    approvedAmount: 11500000,
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    status: '已审批',
    attachments: att('cb2'),
  },
  {
    key: 'cb-3',
    code: 'CB-2025-003',
    projectCode: 'XB2005-0062',
    title: '海洋综合执法升级项目监理费用预算',
    category: '监理费',
    budgetAmount: 860000,
    approvedAmount: 860000,
    periodStart: '2025-02-01',
    periodEnd: '2026-01-31',
    status: '已审批',
    attachments: att('cb3'),
  },
  {
    key: 'cb-4',
    code: 'CB-2025-004',
    projectCode: 'XB2005-0089',
    title: '智慧海洋监管平台人工费用预算',
    category: '人工费',
    budgetAmount: 6800000,
    approvedAmount: 0,
    periodStart: '2025-06-10',
    periodEnd: '2026-12-31',
    status: '待审批',
    attachments: att('cb4'),
  },
  {
    key: 'cb-5',
    code: 'CB-2025-005',
    projectCode: 'XB2005-0156',
    title: '数字政府基础设施材料费预算',
    category: '材料费',
    budgetAmount: 15600000,
    approvedAmount: 0,
    periodStart: '2025-01-10',
    periodEnd: '2026-12-31',
    status: '待审批',
    attachments: att('cb5'),
  },
  {
    key: 'cb-6',
    code: 'CB-2025-006',
    projectCode: 'XB2005-0123',
    title: '民政系统升级改造其他费用预算',
    category: '其他',
    budgetAmount: 300000,
    approvedAmount: 0,
    periodStart: '2025-04-20',
    periodEnd: '2025-12-31',
    status: '待审批',
    attachments: att('cb6'),
  },
]

export const initialBudgetApprovalMap: Record<string, ApprovalRecord[]> = {
  'cb-1': [
    { key: 'cb-1-r1', code: 'CB-2025-001-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '预算合理，一审通过。', date: '2025-01-02 10:00:00' },
    { key: 'cb-1-r2', code: 'CB-2025-001-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '终审通过。', date: '2025-01-03 09:00:00' },
  ],
  'cb-2': [
    { key: 'cb-2-r1', code: 'CB-2025-002-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '采购预算合理，一审通过。', date: '2025-01-05 14:00:00' },
    { key: 'cb-2-r2', code: 'CB-2025-002-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '终审通过。', date: '2025-01-06 10:00:00' },
  ],
  'cb-3': [
    { key: 'cb-3-r1', code: 'CB-2025-003-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '监理费用预算合理，一审通过。', date: '2025-02-02 16:00:00' },
    { key: 'cb-3-r2', code: 'CB-2025-003-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '终审通过。', date: '2025-02-03 09:00:00' },
  ],
}

export default initialData
