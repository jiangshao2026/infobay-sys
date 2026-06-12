// ============================================================
// 监理合同数据 - 统一数据源
// 说明：amount 单位为 元；projectCode 为外键，对应 projects.ts 的 code
// ============================================================
import type { ContractItem } from '../types/projectManagement'

const initialContractData: ContractItem[] = [
  {
    key: '1',
    code: 'SJ-2025-0012',
    name: '广东省市场监管局信息化项目监理合同',
    projectCode: 'XB2005-0037',
    amount: 1_287_000,
    signDate: '2025-03-08',
    startDate: '2025-03-15',
    endDate: '2026-06-30',
    partyA: '广东省市场监督管理局',
    partyB: '广东信佰工程咨询有限公司',
    status: '执行中',
    progress: 45,
    attachments: [
      { name: '监理合同正文.pdf', url: '#' },
      { name: '技术要求附件.pdf', url: '#' },
    ],
  },
  {
    key: '2',
    code: 'SJ-2025-0025',
    name: '广东省海洋综合执法总队综合指挥中心升级改造项目监理合同',
    projectCode: 'XB2005-0062',
    amount: 785_000,
    signDate: '2025-01-25',
    startDate: '2025-02-01',
    endDate: '2026-01-31',
    partyA: '广东省海洋综合执法总队',
    partyB: '广东信佰工程咨询有限公司',
    status: '执行中',
    progress: 60,
    attachments: [
      { name: '监理合同正文.pdf', url: '#' },
    ],
  },
  {
    key: '3',
    code: 'SJ-2025-0038',
    name: '数字政府基础设施建设项目监理合同',
    projectCode: 'XB2005-0156',
    amount: 2_568_000,
    signDate: '2025-01-05',
    startDate: '2025-01-10',
    endDate: '2026-12-31',
    partyA: '广东省政务服务和数据管理局',
    partyB: '广东信佰工程咨询有限公司',
    status: '执行中',
    progress: 38,
    attachments: [
      { name: '监理合同正文.pdf', url: '#' },
      { name: '技术规范书.pdf', url: '#' },
      { name: '安全监理方案.pdf', url: '#' },
    ],
  },
  {
    key: '4',
    code: 'SJ-2024-0087',
    name: '潮州供水枢纽数字孪生平台建设项目监理合同',
    projectCode: 'XB2005-0189',
    amount: 623_000,
    signDate: '2024-08-08',
    startDate: '2024-08-15',
    endDate: '2025-08-30',
    partyA: '广东省韩江流域管理局',
    partyB: '广东信佰工程咨询有限公司',
    status: '即将到期',
    progress: 92,
    attachments: [],
  },
  {
    key: '5',
    code: 'SJ-2025-0056',
    name: '广州市民政局2025年升级改造项目监理合同',
    projectCode: 'XB2005-0123',
    amount: 441_000,
    signDate: '2025-04-15',
    startDate: '2025-04-20',
    endDate: '2025-12-31',
    partyA: '广州市民政局',
    partyB: '广东信佰工程咨询有限公司',
    status: '待审批',
    progress: 0,
    attachments: [
      { name: '监理合同正文.pdf', url: '#' },
    ],
  },
  {
    key: '6',
    code: 'SJ-2025-0073',
    name: '"赣数智"一体化平台项目监理合同',
    projectCode: 'XB2005-0267',
    amount: 658_000,
    signDate: '2025-05-15',
    startDate: '2025-05-20',
    endDate: '2026-08-31',
    partyA: '江西省统计局',
    partyB: '广东信佰工程咨询有限公司',
    status: '执行中',
    progress: 28,
    attachments: [
      { name: '监理合同正文.pdf', url: '#' },
      { name: '数据安全专项监理方案.pdf', url: '#' },
    ],
  },
  {
    key: '7',
    code: 'SJ-2024-0102',
    name: '番禺区排水管网基础数据完善及厂网河一体化信息系统建设项目监理合同',
    projectCode: 'XB2005-0301',
    amount: 986_000,
    signDate: '2024-11-05',
    startDate: '2024-11-10',
    endDate: '2026-06-30',
    partyA: '广州市番禺区水务局',
    partyB: '广东信佰工程咨询有限公司',
    status: '已驳回',
    progress: 15,
    attachments: [],
  },
  {
    key: '8',
    code: 'SJ-2025-0091',
    name: '顺德区医疗健康信息系统一体化建设项目监理合同',
    projectCode: 'XB2005-0345',
    amount: 1_624_000,
    signDate: '2025-05-28',
    startDate: '2025-06-01',
    endDate: '2027-03-31',
    partyA: '佛山市顺德区卫生健康局',
    partyB: '广东信佰工程咨询有限公司',
    status: '待审批',
    progress: 0,
    attachments: [
      { name: '监理合同正文.pdf', url: '#' },
      { name: '医疗数据安全规范.pdf', url: '#' },
      { name: '项目分期执行计划.pdf', url: '#' },
    ],
  },
]

// 合同编号 → 合同的便捷查询
export const getContractByCode = (code: string): ContractItem | undefined => {
  return initialContractData.find(c => c.code === code)
}

// 根据项目编号查询关联合同
export const getContractsByProjectCode = (projectCode: string): ContractItem[] => {
  return initialContractData.filter(c => c.projectCode === projectCode)
}

export default initialContractData
