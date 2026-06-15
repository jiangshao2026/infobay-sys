import type { SchedulePlanItem, DocumentAttachment, ApprovalRecord } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-进度计划.xlsx`,
    url: `#${seed}-1`,
    size: 345000,
    uploadedBy: '项目经理',
    uploadDate: '2025-03-01 09:00:00',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
]

const initialData: SchedulePlanItem[] = [
  {
    key: 'sp-1',
    code: 'SP-2025-001',
    projectCode: 'XB2005-0037',
    title: '市场主体登记系统上线阶段计划',
    phase: '开发',
    planStart: '2025-04-01',
    planEnd: '2025-06-30',
    responsible: '韦江腾',
    milestones: ['需求冻结', '核心模块开发完成', '集成测试完成', '用户验收'],
    status: '已审批',
    attachments: att('sp1'),
  },
  {
    key: 'sp-2',
    code: 'SP-2025-002',
    projectCode: 'XB2005-0037',
    title: '信用监管平台扩容阶段计划',
    phase: '设计',
    planStart: '2025-05-01',
    planEnd: '2025-08-31',
    responsible: '滕海燕',
    milestones: ['架构评审', '数据库分库分表设计', '缓存方案评审'],
    status: '一审通过',
    attachments: att('sp2'),
  },
  {
    key: 'sp-3',
    code: 'SP-2025-003',
    projectCode: 'XB2005-0062',
    title: '综合指挥中心大屏与视频会议升级计划',
    phase: '部署',
    planStart: '2025-02-15',
    planEnd: '2025-05-30',
    responsible: '韦江腾',
    milestones: ['设备到货', '联调测试', '模拟演练', '正式上线'],
    status: '已审批',
    attachments: att('sp3'),
  },
  {
    key: 'sp-4',
    code: 'SP-2025-004',
    projectCode: 'XB2005-0089',
    title: '智慧海洋监管平台启动计划',
    phase: '需求分析',
    planStart: '2025-06-10',
    planEnd: '2025-09-30',
    responsible: '黄志强',
    milestones: ['需求调研', '原型确认', '需求评审'],
    status: '待审批',
    attachments: att('sp4'),
  },
  {
    key: 'sp-5',
    code: 'SP-2025-005',
    projectCode: 'XB2005-0123',
    title: '民政系统升级改造开发计划',
    phase: '开发',
    planStart: '2025-04-20',
    planEnd: '2025-10-31',
    responsible: '滕海燕',
    milestones: ['功能冻结', '数据迁移方案评审', '灰度发布'],
    status: '待审批',
    attachments: att('sp5'),
  },
]

export const initialPlanApprovalMap: Record<string, ApprovalRecord[]> = {
  'sp-1': [
    { key: 'sp-1-r1', code: 'SP-2025-001-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '计划内容完整，时间节点合理，一审通过。', date: '2025-04-01 15:00:00' },
    { key: 'sp-1-r2', code: 'SP-2025-001-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '终审通过，按计划执行。', date: '2025-04-02 10:00:00' },
  ],
  'sp-2': [
    { key: 'sp-2-r1', code: 'SP-2025-002-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '架构评审方案可行，同意通过。', date: '2025-05-02 16:00:00' },
  ],
  'sp-3': [
    { key: 'sp-3-r1', code: 'SP-2025-003-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '部署计划详实，一审通过。', date: '2025-02-16 14:00:00' },
    { key: 'sp-3-r2', code: 'SP-2025-003-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '终审通过，准予执行。', date: '2025-02-17 09:00:00' },
  ],
}

export default initialData
