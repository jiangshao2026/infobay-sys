import { useState, useEffect } from 'react'

const STORAGE_PREFIX = 'xb-demo-v4-' // 数据结构变更时升版，自动清旧缓存

/**
 * 通用持久化 useState — 用法同 useState，自动同步 localStorage
 * 参照监理合同模块 AppDataContext 实现
 */
export function usePersistedState<T>(key: string, initialData: T) {
  const storageKey = STORAGE_PREFIX + key

  const [data, setData] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        // 数组且内容匹配初始数据类型则用缓存
        if (Array.isArray(parsed) && Array.isArray(initialData)) return parsed as T
        if (typeof parsed === typeof initialData && parsed !== null) return parsed as T
      }
    } catch { /* ignore */ }
    return initialData
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch { /* ignore */ }
  }, [data, storageKey])

  return [data, setData] as const
}

/**
 * 清除所有模块的持久化数据（供"重置为初始数据"使用）
 */
export function resetAllPersistedData(): void {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(k)
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))
}
