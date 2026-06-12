import type { FileArchiveItem, DocumentAttachment } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-归档清单.pdf`,
    url: `#${seed}-1`,
    size: 234000,
    uploadedBy: '王华',
    uploadDate: '2025-06-10 09:00:00',
    type: 'application/pdf',
  },
]

const initialData: FileArchiveItem[] = [
  {
    key: 'fa-1',
    code: 'FA-2025-001',
    projectCode: 'XB2005-0062',
    title: '海洋综合执法总队项目监理档案归档',
    category: '监理档案',
    archiveDate: '2025-06-10',
    archivist: '韦江腾',
    contentSummary: '监理规划、实施细则、质量检查记录、进度周报月报、变更审批记录、安全档案等。',
    status: '已归档',
    attachments: att('fa1'),
  },
  {
    key: 'fa-2',
    code: 'FA-2025-002',
    projectCode: 'XB2005-0062',
    title: '海洋综合执法总队项目合同档案归档',
    category: '合同档案',
    archiveDate: '2025-06-10',
    archivist: '韦江腾',
    contentSummary: '监理合同、设备采购合同、维保合同正本与附件。',
    status: '已归档',
    attachments: att('fa2'),
  },
  {
    key: 'fa-3',
    code: 'FA-2025-003',
    projectCode: 'XB2005-0037',
    title: '市场主体登记系统质量档案归档',
    category: '质量档案',
    archiveDate: '2025-07-15',
    archivist: '韦江腾',
    contentSummary: '质量检查记录、整改单、复查记录、质量报告。',
    status: '归档中',
    attachments: att('fa3'),
  },
  {
    key: 'fa-4',
    code: 'FA-2025-004',
    projectCode: 'XB2005-0156',
    title: '数字政府基础设施安全档案',
    category: '安全档案',
    archiveDate: '2025-12-30',
    archivist: '张建华',
    contentSummary: '安全检查记录、安全培训记录、安全事故报告、安全演练记录。',
    status: '待归档',
    attachments: att('fa4'),
  },
  {
    key: 'fa-5',
    code: 'FA-2025-005',
    projectCode: 'XB2005-0037',
    title: '市场主体登记系统竣工验收档案',
    category: '验收档案',
    archiveDate: '2025-07-20',
    archivist: '韦江腾',
    contentSummary: '验收计划、验收记录、验收报告、用户意见反馈。',
    status: '已调阅',
    attachments: att('fa5'),
  },
]

export default initialData
