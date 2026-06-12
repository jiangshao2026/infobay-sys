import type { ScheduleReportItem, DocumentAttachment } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-进度周报.pdf`,
    url: `#${seed}-1`,
    size: 678000,
    uploadedBy: '韦江腾',
    uploadDate: '2025-06-09 10:00:00',
    type: 'application/pdf',
  },
]

const initialData: ScheduleReportItem[] = [
  {
    key: 'sr-1',
    code: 'SR-2025-W23',
    projectCode: 'XB2005-0037',
    title: '市场监管局项目第23周进度周报',
    type: '周报',
    reportDate: '2025-06-09',
    author: '韦江腾',
    progressSummary: '本周完成系统集成测试，总体进度72%；按计划推进。',
    issues: '接口联调耗时超预期；数据库索引优化仍在进行。',
    nextPlan: '下周启动用户验收测试准备工作。',
    status: '已发布',
    attachments: att('sr1'),
  },
  {
    key: 'sr-2',
    code: 'SR-2025-M5',
    projectCode: 'XB2005-0062',
    title: '海洋综合执法总队5月进度月报',
    type: '月报',
    reportDate: '2025-06-03',
    author: '韦江腾',
    progressSummary: '指挥中心大屏与视频会议升级已完成验收，船艇卫星定位模块持续推进中。',
    issues: '卫星定位远海丢包率偏高。',
    nextPlan: '推进专项优化方案评审与实施。',
    status: '已发布',
    attachments: att('sr2'),
  },
  {
    key: 'sr-3',
    code: 'SR-2025-SP2',
    projectCode: 'XB2005-0089',
    title: '智慧海洋监管平台需求阶段专项报告',
    type: '专项报告',
    reportDate: '2025-06-25',
    author: '黄志强',
    progressSummary: '需求阶段整体进度正常，已完成与各业务部门关键访谈。',
    issues: '预警推送通道需进一步明确责任单位。',
    nextPlan: '进入设计与原型评审阶段。',
    status: '草稿',
    attachments: att('sr3'),
  },
  {
    key: 'sr-4',
    code: 'SR-2025-W22',
    projectCode: 'XB2005-0123',
    title: '民政系统升级改造第22周周报',
    type: '周报',
    reportDate: '2025-06-02',
    author: '滕海燕',
    progressSummary: '社会救助与社会组织登记模块开发进度正常。',
    issues: '历史数据迁移缺省字段需确认。',
    nextPlan: '制定数据补充方案。',
    status: '待审批',
    attachments: att('sr4'),
  },
]

export default initialData
