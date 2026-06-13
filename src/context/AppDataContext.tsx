import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ContractItem, ApprovalRecord } from '../types/projectManagement'
import initialContractData from '../data/contracts'

// ============================================================
// 全局共享数据上下文
// - contractList: 监理合同列表（包含审批状态变更）
// - contractApprovalMap: 合同审批记录（按合同 key 存储）
// - 所有变更持久化到 localStorage，保证切换用户后仍可见
// ============================================================

const STORAGE_KEY_CONTRACTS = 'xb-demo-contracts'
const STORAGE_KEY_APPROVALS = 'xb-demo-contract-approvals'

interface AppDataContextValue {
  // 合同列表（含状态）
  contractList: ContractItem[]
  setContractList: (list: ContractItem[]) => void

  // 单个合同更新（按 key 匹配替换）
  updateContract: (key: string, updates: Partial<ContractItem>) => void

  // 更新合同状态（最常用的快捷方式）
  updateContractStatus: (key: string, status: ContractItem['status']) => void

  // 合同审批记录：{ [contractKey]: ApprovalRecord[] }
  contractApprovalMap: Record<string, ApprovalRecord[]>

  // 追加审批记录到指定合同
  addContractApproval: (contractKey: string, record: ApprovalRecord) => void

  // 批量覆盖审批记录（由调用方维护完整数组）
  setContractApprovalMap: (map: Record<string, ApprovalRecord[]>) => void

  // 重置所有数据为初始状态（用于调试）
  resetAll: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

// 从 localStorage 加载数据，无数据时使用初始值
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      return JSON.parse(raw) as T
    }
  } catch (_) {
    // ignore parse errors
  }
  return fallback
}

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 合同列表
  const [contractList, setContractListInternal] = useState<ContractItem[]>(() =>
    loadFromStorage<ContractItem[]>(STORAGE_KEY_CONTRACTS, initialContractData)
  )

  // 合同审批记录
  const [contractApprovalMap, setContractApprovalMapInternal] = useState<Record<string, ApprovalRecord[]>>(() =>
    loadFromStorage<Record<string, ApprovalRecord[]>>(STORAGE_KEY_APPROVALS, {})
  )

  // 持久化到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTRACTS, JSON.stringify(contractList))
    } catch (_) {
      // ignore
    }
  }, [contractList])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_APPROVALS, JSON.stringify(contractApprovalMap))
    } catch (_) {
      // ignore
    }
  }, [contractApprovalMap])

  // 封装 setContractList（仅类型化 wrapper，不改变行为）
  const setContractList = useCallback((list: ContractItem[]) => {
    setContractListInternal(list)
  }, [])

  // 单个合同更新
  const updateContract = useCallback((key: string, updates: Partial<ContractItem>) => {
    setContractListInternal(prev => prev.map(item =>
      item.key === key ? { ...item, ...updates } : item
    ))
  }, [])

  // 更新合同状态
  const updateContractStatus = useCallback((key: string, status: ContractItem['status']) => {
    setContractListInternal(prev => prev.map(item =>
      item.key === key ? { ...item, status } : item
    ))
  }, [])

  // 追加审批记录
  const addContractApproval = useCallback((contractKey: string, record: ApprovalRecord) => {
    setContractApprovalMapInternal(prev => ({
      ...prev,
      [contractKey]: [...(prev[contractKey] || []), record],
    }))
  }, [])

  const setContractApprovalMap = useCallback((map: Record<string, ApprovalRecord[]>) => {
    setContractApprovalMapInternal(map)
  }, [])

  // 重置所有数据
  const resetAll = useCallback(() => {
    setContractListInternal(initialContractData)
    setContractApprovalMapInternal({})
    try {
      localStorage.removeItem(STORAGE_KEY_CONTRACTS)
      localStorage.removeItem(STORAGE_KEY_APPROVALS)
    } catch (_) {
      // ignore
    }
  }, [])

  const value: AppDataContextValue = {
    contractList,
    setContractList,
    updateContract,
    updateContractStatus,
    contractApprovalMap,
    addContractApproval,
    setContractApprovalMap,
    resetAll,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

// 使用 Hook
export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) {
    // 不应该发生：确保 Provider 已正确注入
    throw new Error('useAppData must be used within an AppDataProvider')
  }
  return ctx
}