import type { AcceptanceReportItem, DocumentAttachment, ApprovalRecord } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-验收报告.pdf`,
    url: `#${seed}-1`,
    size: 678000,
    uploadedBy: '滕海燕',
    uploadDate: '2025-06-05 09:00:00',
    type: 'application/pdf',
  },
]

const initialData: AcceptanceReportItem[] = [
  {
    key: 'ar2-1',
    code: 'AR-2025-001',
    projectCode: 'XB2005-0062',
    title: '海洋综合执法总队综合指挥中心升级改造项目验收报告',
    type: '分部验收',
    reportDate: '2025-06-01',
    author: '韦江腾',
    summary: '指挥中心大屏与视频会议系统验收通过；卫星定位远海模块仍在优化中。',
    issues: '卫星定位远海丢包率偏高，已形成专项优化建议。',
    suggestions: '建议推进卫星信号中继设备采购与部署。',
    result: '有条件合格',
    status: '一审通过',
    attachments: att('ar1'),
  },
  {
    key: 'ar2-2',
    code: 'AR-2025-002',
    projectCode: 'XB2005-0037',
    title: '市场主体登记系统专项验收报告',
    type: '专项验收',
    reportDate: '2025-07-12',
    author: '韦江腾',
    summary: '系统功能、性能、安全等各方面均达到设计要求。',
    issues: '首页加载性能仍需持续优化。',
    suggestions: '持续关注关键接口性能指标，定期复查。',
    result: '合格',
    status: '待审批',
    attachments: att('ar2'),
  },
  {
    key: 'ar2-3',
    code: 'AR-2025-003',
    projectCode: 'XB2005-0156',
    title: '数字政府基础设施年度验收报告',
    type: '竣工验收',
    reportDate: '2025-12-25',
    author: '张建华',
    summary: '政务云扩容、网络升级、身份认证等各子系统均完成年度验收目标。',
    issues: '机房扩容流程效率需提升。',
    suggestions: '建议下一年度优化机房审批流程。',
    result: '合格',
    status: '待审批',
    attachments: att('ar3'),
  },
  {
    key: 'ar2-4',
    code: 'AR-2025-004',
    projectCode: 'XB2005-0189',
    title: '广东省韩江流域潮州供水枢纽数字孪生平台竣工验收报告',
    type: '竣工验收',
    reportDate: '2025-08-30',
    author: '吴国栋',
    summary: '数字孪生平台已完成库区水流仿真、闸门运行调度、发电调度决策三大核心功能模块的开发与部署，验收资料齐全，功能与性能指标符合合同要求。',
    issues: '部分仿真场景渲染时间略超预期，已提出优化建议。',
    suggestions: '建议在运维期继续优化高并发场景的渲染性能，并定期开展模型训练与数据回灌。',
    result: '合格',
    status: '已审批',
    attachments: att('ar4'),
  },
]

// 初始审批记录
export const initialAcceptanceReportsApprovalMap: Record<string, ApprovalRecord[]> = {
  'ar2-1': [
    { key: 'ar2-1-r1', code: 'AR-2025-001-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '报告内容完整，数据详实，一审通过。', date: '2025-06-05 14:00:00' },
  ],
  'ar2-4': [
    { key: 'ar2-4-r1', code: 'AR-2025-004-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '报告内容完整，验收资料齐全，一审通过。', date: '2025-08-28 10:00:00' },
    { key: 'ar2-4-r2', code: 'AR-2025-004-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '复核通过，同意竣工验收。', date: '2025-08-30 09:00:00' },
  ],
}

export default initialData
