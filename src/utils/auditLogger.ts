/**
 * 审计日志工具 - 用于记录用户操作日志，实现操作可追溯
 * 所有日志存储在 localStorage 中，与 usePersistedState('sys-audit-log') 共享同一份数据
 */
import type { AuditLogItem, AuditAction, AuditModule } from '../types/projectManagement'

const STORAGE_KEY = 'sys-audit-log'
const MAX_LOG_COUNT = 500

/** 获取当前存储的所有审计日志 */
function getLogs(): AuditLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 写入审计日志列表 */
function saveLogs(logs: AuditLogItem[]): void {
  // 只保留最新的 MAX_LOG_COUNT 条
  const trimmed = logs.slice(0, MAX_LOG_COUNT)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

/**
 * 记录一条审计日志
 * @param user    操作人用户名
 * @param module  所属功能模块
 * @param action  操作类型
 * @param target  操作对象名称（如项目名称、合同编号）
 * @param targetType 对象类型（如项目、合同、质量问题）
 * @param detail  操作详情描述
 */
export function addAuditLog(
  user: string,
  module: AuditModule,
  action: AuditAction,
  target: string,
  targetType: string,
  detail: string,
): void {
  const logs = getLogs()
  const log: AuditLogItem = {
    key: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
    user,
    module,
    action,
    target,
    targetType,
    detail,
  }
  logs.unshift(log) // 最新记录在头部
  saveLogs(logs)
}