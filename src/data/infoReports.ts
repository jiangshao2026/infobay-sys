import type { InfoReportItem, DocumentAttachment, ApprovalRecord } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-监理报告.pdf`,
    url: `#${seed}-1`,
    size: 456000,
    uploadedBy: '滕海燕',
    uploadDate: '2025-06-05 09:00:00',
    type: 'application/pdf',
  },
]

const initialData: InfoReportItem[] = [
  {
    key: 'ir-1',
    code: 'IR-2025-W23',
    projectCode: 'XB2005-0037',
    title: '市场监管局项目第23周监理周报',
    type: '监理周报',
    reportDate: '2025-06-09',
    author: '韦江腾',
    content: '本周完成系统集成测试，总体进度72%，接口联调仍在进行。',
    status: '已审批',
    attachments: att('ir1'),
  },
  {
    key: 'ir-2',
    code: 'IR-2025-M5-062',
    projectCode: 'XB2005-0062',
    title: '海洋综合执法项目5月监理月报',
    type: '监理月报',
    reportDate: '2025-06-03',
    author: '韦江腾',
    content: '指挥中心大屏与视频会议系统验收通过；船艇卫星定位模块持续优化。',
    status: '已审批',
    attachments: att('ir2'),
  },
  {
    key: 'ir-3',
    code: 'IR-2025-N1',
    projectCode: 'XB2005-0089',
    title: '智慧海洋监管平台需求确认工作联系单',
    type: '工作联系单',
    reportDate: '2025-06-22',
    author: '黄志强',
    content: '请各业务部门于本周内确认平台需求范围与交付时间。',
    status: '一审通过',
    attachments: att('ir3'),
  },
  {
    key: 'ir-4',
    code: 'IR-2025-NO1',
    projectCode: 'XB2005-0156',
    title: '关于机房扩容进度滞后的监理通知',
    type: '监理通知',
    reportDate: '2025-06-05',
    author: '张建华',
    content: '机房扩容审批流程滞后，影响整体进度，请相关部门协调推进。',
    status: '待审批',
    attachments: att('ir4'),
  },
  {
    key: 'ir-5',
    code: 'IR-2025-SP2',
    projectCode: 'XB2005-0234',
    title: '情报指挥中心启动阶段专项报告',
    type: '专项报告',
    reportDate: '2025-07-10',
    author: '刘雪峰',
    content: '指挥中心项目启动阶段工作总结与风险评估。',
    status: '待审批',
    attachments: att('ir5'),
  },
]

// 初始审批记录：为状态为"一审通过"或"已审批"的记录补充审批历史
// 一审由监理工程师滕海燕审批，二审由总监理工程师韦江腾审批
export const initialReportApprovalMap: Record<string, ApprovalRecord[]> = {
  'ir-1': [
    { key: 'ir-1-r1', code: 'IR-2025-W23-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '周报内容完整，数据详实，一审通过。', date: '2025-06-10 09:00:00' },
    { key: 'ir-1-r2', code: 'IR-2025-W23-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '终审通过，报告质量合格。', date: '2025-06-10 15:00:00' },
  ],
  'ir-2': [
    { key: 'ir-2-r1', code: 'IR-2025-M5-062-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '月报内容完整，验收记录清晰，一审通过。', date: '2025-06-04 10:00:00' },
    { key: 'ir-2-r2', code: 'IR-2025-M5-062-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '终审通过。', date: '2025-06-04 16:00:00' },
  ],
  'ir-3': [
    { key: 'ir-3-r1', code: 'IR-2025-N1-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '联系单内容明确，需求范围清晰，一审通过。', date: '2025-06-23 11:00:00' },
  ],
}

export default initialData
