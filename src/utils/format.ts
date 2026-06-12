// ============================================================
// 格式化工具
// 说明：金额/进度/日期等字段的统一展示格式化
// ============================================================

/**
 * 金额格式化 - 以"万元"为单位展示
 * @param amount 金额（单位：元）
 * @returns 格式化字符串，如 "¥128.70万"
 */
export const formatCurrency = (amount: number): string => {
  if (!amount && amount !== 0) return '—'
  const wanyuan = amount / 10000
  return `¥${wanyuan.toFixed(2)}万`
}

/**
 * 金额格式化 - 以"元"为单位展示（千分位）
 * @param amount 金额（单位：元）
 * @returns 格式化字符串，如 "¥1,287,000.00"
 */
export const formatCurrencyYuan = (amount: number): string => {
  if (!amount && amount !== 0) return '—'
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * 输入金额（万元为单位的字符串）→ 转换为元的 number
 * @param wanyuanStr 用户输入的"万元"金额字符串，如 "128.7"
 * @returns 单位为元的数字
 */
export const parseWanyuan = (wanyuanStr: string | number): number => {
  const num = typeof wanyuanStr === 'string' ? parseFloat(wanyuanStr) : wanyuanStr
  return isNaN(num) ? 0 : Math.round(num * 10000)
}

/**
 * 元 → 万元（用于表单回显）
 * @param amount 金额（单位：元）
 * @returns 单位为万元的字符串，保留 2 位小数
 */
export const toWanyuan = (amount: number): string => {
  if (!amount && amount !== 0) return ''
  return (amount / 10000).toFixed(2)
}

/**
 * 进度格式化
 * @param progress 进度值（0-100）
 * @returns 如 "45%"
 */
export const formatProgress = (progress: number): string => `${progress ?? 0}%`
