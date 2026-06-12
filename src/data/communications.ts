import type { CommunicationItem, DocumentAttachment } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-工作联系单.pdf`,
    url: `#${seed}-1`,
    size: 123000,
    uploadedBy: '滕海燕',
    uploadDate: '2025-06-01 09:00:00',
    type: 'application/pdf',
  },
]

const initialData: CommunicationItem[] = [
  {
    key: 'cm-1',
    code: 'CM-2025-001',
    projectCode: 'XB2005-0037',
    title: '关于接口联调时间调整的工作联系单',
    type: '工作联系单',
    date: '2025-05-20',
    from: '韦江腾',
    to: '承建方项目经理',
    content: '接口联调时间由5月20日调整至5月30日，请确认。',
    reply: '已确认，按调整后的时间推进。',
    status: '已回复',
    attachments: att('cm1'),
  },
  {
    key: 'cm-2',
    code: 'CM-2025-002',
    projectCode: 'XB2005-0037',
    title: '关于首页性能优化的监理通知',
    type: '监理通知',
    date: '2025-06-05',
    from: '韦江腾',
    to: '承建方开发团队',
    content: '首页加载性能超过设计要求，须在两周内完成优化。',
    status: '已处理',
    attachments: att('cm2'),
  },
  {
    key: 'cm-3',
    code: 'CM-2025-003',
    projectCode: 'XB2005-0062',
    title: '关于卫星定位设备采购变更沟通函',
    type: '书面函件',
    date: '2025-05-28',
    from: '韦江腾',
    to: '设备供应商',
    content: '需对卫星定位设备规格进行升级，请评估报价与工期。',
    reply: '已收到，将于三日内回复评估结果。',
    status: '待回复',
    attachments: att('cm3'),
  },
  {
    key: 'cm-4',
    code: 'CM-2025-004',
    projectCode: 'XB2005-0156',
    title: '关于机房扩容审批流程优化的口头沟通记录',
    type: '口头沟通',
    date: '2025-06-12',
    from: '张建华',
    to: '机房审批部门',
    content: '口头沟通确认新联合审批流程的适用范围。',
    status: '已关闭',
    attachments: att('cm4'),
  },
]

export default initialData
