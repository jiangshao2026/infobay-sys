import type { InfoReportItem, DocumentAttachment } from '../types/projectManagement'

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
    status: '已发布',
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
    status: '已发布',
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
    status: '草稿',
    attachments: att('ir5'),
  },
]

export default initialData
