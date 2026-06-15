import type { SafetyIncidentItem, DocumentAttachment, ApprovalRecord } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-事故调查报告.pdf`,
    url: `#${seed}-1`,
    size: 567000,
    uploadedBy: '安全主管',
    uploadDate: '2025-05-25 09:00:00',
    type: 'application/pdf',
  },
]

const initialData: SafetyIncidentItem[] = [
  {
    key: 'si-1',
    code: 'SI-2025-001',
    projectCode: 'XB2005-0062',
    title: '大屏显示系统花屏事件',
    description: '下午2-3点之间大屏出现短暂花屏，疑似散热问题导致。',
    incidentDate: '2025-04-22',
    location: '广州市越秀区 - 综合指挥中心',
    level: '一般事故',
    casualties: '无',
    economicLoss: 5000,
    handler: '韦江腾',
    rootCause: '显示控制盒散热不良导致短暂故障。',
    correctiveActions: '更换控制盒并增加散热模块。',
    status: '已处理',
    attachments: att('si1'),
  },
  {
    key: 'si-2',
    code: 'SI-2025-002',
    projectCode: 'XB2005-0156',
    title: '机房UPS短暂断电',
    description: '机房UPS短暂切换至备用电源，造成部分业务中断约2分钟。',
    incidentDate: '2025-05-18',
    location: '广州市越秀区 - 政务云机房',
    level: '较大事故',
    casualties: '无',
    economicLoss: 50000,
    handler: '张建华',
    rootCause: 'UPS电池老化导致切换过程中瞬时断电。',
    correctiveActions: '更换UPS电池组，并进行系统演练。',
    status: '处理中',
    attachments: att('si2'),
  },
  {
    key: 'si-3',
    code: 'SI-2025-003',
    projectCode: 'XB2005-0234',
    title: '情报指挥中心视频监控系统故障',
    description: '3号区域视频监控系统出现设备故障，约2小时后恢复。',
    incidentDate: '2025-06-20',
    location: '广州市天河区 - 情报指挥中心',
    level: '一般事故',
    casualties: '无',
    economicLoss: 8000,
    handler: '刘雪峰',
    rootCause: '设备硬盘损坏。',
    correctiveActions: '更换硬盘并加强定期巡检。',
    status: '已归档',
    attachments: att('si3'),
  },
]

// 初始审批记录
export const initialIncidentApprovalMap: Record<string, ApprovalRecord[]> = {
  'si-1': [
    { key: 'si-1-r1', code: 'SI-2025-001-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '事故处理方案合理，整改措施到位，一审通过。', date: '2025-06-02 16:00:00' },
  ],
  'si-3': [
    { key: 'si-3-r1', code: 'SI-2025-003-R1', level: 1, reviewer: '滕海燕', status: '通过', comment: '调查报告完整，处理得当，一审通过。', date: '2025-05-22 14:00:00' },
    { key: 'si-3-r2', code: 'SI-2025-003-R2', level: 2, reviewer: '韦江腾', status: '通过', comment: '终审通过。', date: '2025-05-23 09:00:00' },
  ],
}

export default initialData
