// ============================================================
// 业务规则校验工具
// 说明：监理业务中关键的业务规则约束（合同/付款/日期校验等）
// ============================================================
import type { ProjectItem, ContractItem, PaymentItem } from '../types/projectManagement'

/**
 * 校验：合同金额 ≤ 项目总投资
 * 监理合同金额不应超过项目总投资（通常监理费率为 1.5%-3%，
 * 但此处做上限约束，防止录入错误的超大金额）
 */
export const validateContractAmount = (
  contract: { amount: number; projectCode: string },
  projects: ProjectItem[]
): { valid: boolean; message?: string } => {
  const project = projects.find(p => p.code === contract.projectCode)
  if (!project) {
    return { valid: false, message: '未找到关联项目信息' }
  }
  if (contract.amount > project.investment) {
    return {
      valid: false,
      message: `合同金额（¥${(contract.amount / 10000).toFixed(2)}万）不得超过项目总投资（¥${(project.investment / 10000).toFixed(2)}万）`,
    }
  }
  return { valid: true }
}

/**
 * 校验：本次付款后累计付款 ≤ 合同总金额（防超付）
 */
export const validatePaymentTotal = (
  contractCode: string,
  newPaymentAmount: number,
  allPayments: PaymentItem[],
  contracts: ContractItem[]
): { valid: boolean; message?: string } => {
  const contract = contracts.find(c => c.code === contractCode)
  if (!contract) {
    return { valid: false, message: '未找到关联合同信息' }
  }
  const receivedPayments = allPayments.filter(
    p => p.contractCode === contractCode && p.status === '已收款'
  )
  const accumulated = receivedPayments.reduce((sum, p) => sum + p.amount, 0)
  const total = accumulated + newPaymentAmount
  if (total > contract.amount) {
    return {
      valid: false,
      message: `累计付款将超过合同金额上限：已收款 ¥${(accumulated / 10000).toFixed(2)}万 + 本次 ¥${(newPaymentAmount / 10000).toFixed(2)}万 = ¥${(total / 10000).toFixed(2)}万（合同金额 ¥${(contract.amount / 10000).toFixed(2)}万）`,
    }
  }
  return { valid: true }
}

/**
 * 校验：开始日期 ≤ 结束日期
 */
export const validateDateRange = (
  startDate: string,
  endDate: string
): { valid: boolean; message?: string } => {
  if (!startDate || !endDate) return { valid: true }
  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    return { valid: false, message: '开始日期不得晚于结束日期' }
  }
  return { valid: true }
}

/**
 * 校验：合同签订日期 ≤ 合同开始日期
 */
export const validateContractDates = (
  signDate: string,
  startDate: string,
  endDate: string
): { valid: boolean; message?: string } => {
  const rangeCheck = validateDateRange(startDate, endDate)
  if (!rangeCheck.valid) return rangeCheck
  if (signDate && startDate && new Date(signDate).getTime() > new Date(startDate).getTime()) {
    return { valid: false, message: '合同签订日期不得晚于合同开始日期' }
  }
  return { valid: true }
}

/**
 * 金额解析辅助：表单输入的"万元"字符串 → 元（number）
 * 输入为空或非法时返回 0
 */
export const parseAmountFromForm = (value: string | number | undefined): number => {
  if (value === undefined || value === null || value === '') return 0
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? 0 : Math.round(num * 10000)
}

/**
 * 金额反解析：元（number）→ 万元字符串（用于表单回显）
 */
export const amountToWanyuan = (amount: number): string => {
  if (!amount && amount !== 0) return ''
  return (amount / 10000).toFixed(2)
}
