import type { QualityReportItem, DocumentAttachment, ApprovalRecord } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-质量月报.pdf`,
    url: `#${seed}-1`,
    size: 1245678,
    uploadedBy: '韦江腾',
    uploadDate: '2025-06-01 10:00:00',
    type: 'application/pdf',
  },
]

const initialData: QualityReportItem[] = [
  {
    key: 'qr-1',
    code: 'QR-2025-05',
    projectCode: 'XB2005-0037',
    title: '广东省市场监管局项目2025年5月质量月报',
    type: '月报',
    reportDate: '2025-06-03',
    author: '韦江腾',
    summary: '本月共完成质量检查6次，发现一般问题3项、较严重问题1项，已整改4项，整体质量可控。',
    status: '一审通过',
    attachments: att('qr1'),
  },
  {
    key: 'qr-2',
    code: 'QR-2025-04-062',
    projectCode: 'XB2005-0062',
    title: '海洋综合执法指挥中心升级项目2025年4月质量月报',
    type: '月报',
    reportDate: '2025-05-05',
    author: '韦江腾',
    summary: '指挥中心大屏与视频会议系统本月无重大问题，完成小问题修复共3项，稳定运行。',
    status: '已审批',
    attachments: att('qr2'),
  },
  {
    key: 'qr-3',
    code: 'QR-2025-SP1',
    projectCode: 'XB2005-0062',
    title: '海洋综合执法船艇卫星定位专项质量报告',
    type: '专项报告',
    reportDate: '2025-05-28',
    author: '韦江腾',
    summary: '船艇卫星定位系统在近海与远海表现差异较大，远海丢包率偏高，已形成专项优化建议。',
    status: '待审批',
    attachments: att('qr3'),
  },
  {
    key: 'qr-4',
    code: 'QR-2025-05-089',
    projectCode: 'XB2005-0089',
    title: '智慧海洋监管平台5月质量周报（W4）',
    type: '周报',
    reportDate: '2025-06-01',
    author: '黄志强',
    summary: '平台基础功能稳定运行，预警推送通道存在轻微延迟，已列入下月整改计划。',
    status: '待审批',
    attachments: att('qr4'),
  },
  {
    key: 'qr-5',
    code: 'QR-2025-PH1',
    projectCode: 'XB2005-0037',
    title: '市场主体登记系统阶段质量评审报告',
    type: '阶段报告',
    reportDate: '2025-05-20',
    author: '韦江腾',
    summary: '登记系统完成阶段目标，总体质量达到预期，但性能指标仍需持续优化。',
    status: '一审通过',
    attachments: att('qr5'),
  },
]

// 初始审批记录：为状态为"一审通过"或"已审批"的记录补充审批历史
export const initialReportApprovalMap: Record<string, ApprovalRecord[]> = {
  'qr-1': [
    { key: 'qr-1-r1', code: 'QR-2025-05-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '报告内容完整，数据准确，一审通过。', date: '2025-06-03 14:00:00' },
  ],
  'qr-2': [
    { key: 'qr-2-r1', code: 'QR-2025-04-062-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '报告质量良好，无重大问题。', date: '2025-05-05 16:00:00' },
    { key: 'qr-2-r2', code: 'QR-2025-04-062-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '终审通过，同意发布。', date: '2025-05-06 10:00:00' },
  ],
  'qr-5': [
    { key: 'qr-5-r1', code: 'QR-2025-PH1-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '阶段评审报告内容详实，通过一审。', date: '2025-05-20 15:00:00' },
  ],
}

export default initialData
