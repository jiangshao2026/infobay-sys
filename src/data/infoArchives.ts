import type { InfoArchiveItem, DocumentAttachment } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-归档清单.pdf`,
    url: `#${seed}-1`,
    size: 234000,
    uploadedBy: '王华',
    uploadDate: '2025-06-01 09:00:00',
    type: 'application/pdf',
  },
]

const initialData: InfoArchiveItem[] = [
  {
    key: 'ia-1',
    code: 'IA-2025-001',
    projectCode: 'XB2005-0062',
    title: '综合指挥中心合同文件归档',
    category: '合同文件',
    archiveDate: '2025-05-30',
    archivist: '韦江腾',
    content: '合同正本、技术协议、商务附件、补充协议等共12份文件',
    location: '综合档案室 - A区 - 柜03',
    status: '已归档',
    attachments: att('ia1'),
  },
  {
    key: 'ia-2',
    code: 'IA-2025-002',
    projectCode: 'XB2005-0037',
    title: '市场主体登记系统设计文档归档',
    category: '设计文件',
    archiveDate: '2025-06-10',
    archivist: '韦江腾',
    content: '系统架构图、数据库设计文档、接口文档、部署手册',
    location: '综合档案室 - B区 - 柜07',
    status: '归档中',
    attachments: att('ia2'),
  },
  {
    key: 'ia-3',
    code: 'IA-2025-003',
    projectCode: 'XB2005-0156',
    title: '数字政府基础设施会议纪要归档',
    category: '会议纪要',
    archiveDate: '2025-05-20',
    archivist: '张建华',
    content: '2025年1-6月会议纪要共26份',
    location: '综合档案室 - C区 - 柜02',
    status: '已调阅',
    attachments: att('ia3'),
  },
  {
    key: 'ia-4',
    code: 'IA-2025-004',
    projectCode: 'XB2005-0089',
    title: '智慧海洋监管平台监理规划归档',
    category: '监理规划',
    archiveDate: '2025-06-25',
    archivist: '黄志强',
    content: '监理规划、实施细则、质量检查记录',
    location: '综合档案室 - D区 - 柜01',
    status: '待归档',
    attachments: att('ia4'),
  },
]

export default initialData
