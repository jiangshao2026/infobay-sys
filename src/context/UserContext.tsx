import React, { createContext, useContext, useState, useMemo, useEffect } from 'react'

export interface DemoUser {
  key: string
  name: string
  position: string
  avatarText: string
  role: string
}

// 演示用户（不同角色在监理合同审批等场景有不同权限）
export const DEMO_USERS: DemoUser[] = [
  { key: 'u1', name: '王小平', position: '常务副总经理', avatarText: '王', role: '副总经理' },
  { key: 'u2', name: '王华', position: '部门经理', avatarText: '王', role: '部门经理' },
  { key: 'u3', name: '韦江腾', position: '总监理工程师 / 知识管理员', avatarText: '韦', role: '总监理工程师' },
  { key: 'u4', name: '滕海燕', position: '监理工程师', avatarText: '滕', role: '监理工程师' },
  { key: 'u5', name: '李建华', position: '销售', avatarText: '李', role: '销售' },
  // ===== 以下为新增 =====
  { key: 'u6', name: '许琰芳', position: '销售', avatarText: '许', role: '销售' },
  { key: 'u7', name: '蔡海婷', position: '销售', avatarText: '蔡', role: '销售' },
  { key: 'u8', name: '李鉴韬', position: '销售', avatarText: '李', role: '销售' },
  { key: 'u9', name: '孙永秀', position: '销售', avatarText: '孙', role: '销售' },
  { key: 'u10', name: '梁育境', position: '监理工程师', avatarText: '梁', role: '监理工程师' },
  { key: 'u11', name: '马健霖', position: '监理工程师', avatarText: '马', role: '监理工程师' },
  { key: 'u12', name: '陈健文', position: '监理工程师', avatarText: '陈', role: '监理工程师' },
  { key: 'u13', name: '邱隆宝', position: '监理工程师', avatarText: '邱', role: '监理工程师' },
  { key: 'u14', name: '许小嘉', position: '总监理工程师 / 监理工程师', avatarText: '许', role: '总监理工程师' },
  { key: 'u15', name: '赵雄飞', position: '总监理工程师 / 监理工程师', avatarText: '赵', role: '总监理工程师' },
]

const DEFAULT_PASSWORD = 'xinbai'

interface UserContextValue {
  currentUser: DemoUser
  setCurrentUser: (user: DemoUser) => void
  login: (username: string, password: string) => { ok: boolean; message?: string }
  logout: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

const STORAGE_KEY = 'xb-demo-current-user'

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserInternal] = useState<DemoUser>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const cached = JSON.parse(raw) as DemoUser
        const matched = DEMO_USERS.find((u) => u.key === cached.key)
        if (matched) return matched
      }
    } catch (_) {
      // ignore
    }
    return DEMO_USERS[2] // 默认：韦江腾
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
    } catch (_) {
      // ignore
    }
  }, [currentUser])

  const setCurrentUser = (user: DemoUser) => {
    setCurrentUserInternal(user)
  }

  const login = (username: string, password: string) => {
    if (password !== DEFAULT_PASSWORD) {
      return { ok: false, message: '密码错误' }
    }
    const user = DEMO_USERS.find((u) => u.name === username.trim())
    if (!user) {
      return { ok: false, message: '未找到该用户，请从演示用户中选择' }
    }
    setCurrentUserInternal(user)
    return { ok: true }
  }

  const logout = () => {
    setCurrentUserInternal(DEMO_USERS[2])
  }

  const value = useMemo<UserContextValue>(
    () => ({ currentUser, setCurrentUser, login, logout }),
    [currentUser]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext)
  if (!ctx) {
    // 降级：直接返回默认用户，避免子页面报错
    return {
      currentUser: DEMO_USERS[2],
      setCurrentUser: () => {},
      login: () => ({ ok: false }),
      logout: () => {},
    }
  }
  return ctx
}

export { DEFAULT_PASSWORD }
