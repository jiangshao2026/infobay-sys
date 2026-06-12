// ============================================================
// 监理支付数据 - 统一数据源
// 说明：amount 单位为 元；contractCode 为外键，对应 contracts.ts 的 code
// ============================================================
import type { PaymentItem } from '../types/projectManagement'

const initialPaymentData: PaymentItem[] = [
  {
    key: '1',
    code: 'PAY-2025-0012',
    contractCode: 'SJ-2025-0012',
    contractor: '中信信息技术股份有限公司',
    amount: 321_800,
    invoiceNo: 'INV-2025-0012',
    payDate: '2025-05-20',
    status: '已收款',
    description: '第一期监理费用（合同金额的25%）',
  },
  {
    key: '2',
    code: 'PAY-2025-0025',
    contractCode: 'SJ-2025-0012',
    contractor: '中信信息技术股份有限公司',
    amount: 386_100,
    invoiceNo: 'INV-2025-0028',
    payDate: '2025-08-15',
    status: '已收款',
    description: '第二期监理费用（需求分析与设计阶段完成，约30%）',
  },
  {
    key: '3',
    code: 'PAY-2025-0038',
    contractCode: 'SJ-2025-0025',
    contractor: '华建工程有限公司',
    amount: 196_300,
    invoiceNo: 'INV-2025-0035',
    payDate: '2025-04-30',
    status: '已收款',
    description: '第一期监理费用（合同金额的25%）',
  },
  {
    key: '4',
    code: 'PAY-2025-0056',
    contractCode: 'SJ-2025-0025',
    contractor: '华建工程有限公司',
    amount: 235_500,
    invoiceNo: 'INV-2025-0062',
    payDate: '2025-08-25',
    status: '已收款',
    description: '第二期监理费用（系统集成阶段完成，约30%）',
  },
  {
    key: '5',
    code: 'PAY-2025-0087',
    contractCode: 'SJ-2025-0038',
    contractor: '国信智能科技有限公司',
    amount: 642_000,
    invoiceNo: 'INV-2025-0088',
    payDate: '2025-04-10',
    status: '已收款',
    description: '第一期监理费用（政务云平台启动阶段，约25%）',
  },
  {
    key: '6',
    code: 'PAY-2025-0102',
    contractCode: 'SJ-2025-0038',
    contractor: '国信智能科技有限公司',
    amount: 770_400,
    invoiceNo: 'INV-2025-0115',
    payDate: '2025-09-05',
    status: '待收款',
    description: '第二期监理费用（政务云资源扩容完成，约30%）',
  },
  {
    key: '7',
    code: 'PAY-2024-0123',
    contractCode: 'SJ-2024-0087',
    contractor: '宏图建设集团',
    amount: 186_900,
    invoiceNo: 'INV-2024-0123',
    payDate: '2024-12-20',
    status: '已收款',
    description: '第一期监理费用（三维建模阶段完成，约30%）',
  },
  {
    key: '8',
    code: 'PAY-2025-0134',
    contractCode: 'SJ-2024-0087',
    contractor: '宏图建设集团',
    amount: 249_200,
    invoiceNo: 'INV-2025-0138',
    payDate: '2025-06-15',
    status: '已收款',
    description: '第二期监理费用（仿真模型建设完成，约40%）',
  },
  {
    key: '9',
    code: 'PAY-2025-0145',
    contractCode: 'SJ-2025-0073',
    contractor: '瑞麟工程咨询有限公司',
    amount: 164_500,
    invoiceNo: 'INV-2025-0156',
    payDate: '2025-08-20',
    status: '待收款',
    description: '第一期监理费用（合同金额的25%）',
  },
  {
    key: '10',
    code: 'PAY-2025-0167',
    contractCode: 'SJ-2025-0012',
    contractor: '中信信息技术股份有限公司',
    amount: 321_800,
    invoiceNo: 'INV-2025-0178',
    payDate: '2025-11-15',
    status: '待收款',
    description: '第三期监理费用（系统测试阶段完成，约25%）',
  },
]

// 根据合同编号查询关联付款
export const getPaymentsByContractCode = (contractCode: string): PaymentItem[] => {
  return initialPaymentData.filter(p => p.contractCode === contractCode)
}

// 根据合同编号查询已收款金额合计
export const getReceivedAmountByContractCode = (
  contractCode: string,
  payments: PaymentItem[] = initialPaymentData
): number => {
  return payments
    .filter(p => p.contractCode === contractCode && p.status === '已收款')
    .reduce((sum, p) => sum + p.amount, 0)
}

export default initialPaymentData
