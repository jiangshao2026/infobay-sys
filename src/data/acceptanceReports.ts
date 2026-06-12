import type { AcceptanceReportItem, DocumentAttachment } from '../types/projectManagement'

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
    status: '草稿',
    attachments: att('ar3'),
  },
]

export default initialData
