import { Card, Button, Space, Descriptions, message, Popconfirm } from 'antd'
import { DatabaseOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { resetAllPersistedData } from '../../hooks/usePersistedState'

function DataPage() {
  const { contractList, contractApprovalMap, resetAll } = useAppData()
  const [loading, setLoading] = useState(false)
  const [storedKeys, setStoredKeys] = useState<string[]>([])

  useEffect(() => {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('xb-demo-v2-')) keys.push(k)
    }
    setStoredKeys(keys)
  }, [])

  const contractCount = contractList?.length ?? 0
  const approvalRecordCount = Object.values(contractApprovalMap || {})
    .reduce((sum, records) => sum + (Array.isArray(records) ? records.length : 0), 0)

  const handleReset = () => {
    setLoading(true)
    setTimeout(() => {
      resetAll()
      resetAllPersistedData()
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('xb-demo-v2-')) keys.push(k)
      }
      setStoredKeys(keys)
      setLoading(false)
      message.success('所有数据已重置为初始状态')
    }, 300)
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>数据管理</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <p style={{ margin: 0, color: '#666' }}>
          管理系统演示数据，可查看当前数据状态并重置为初始数据。所有模块数据支持跨页面、跨角色持久化。
        </p>
      </Card>

      <Card title="当前数据状态">
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="合同数据">
            {contractCount} 条
          </Descriptions.Item>
          <Descriptions.Item label="审批记录">
            {approvalRecordCount} 条
          </Descriptions.Item>
          <Descriptions.Item label="持久化模块数">
            {storedKeys.length} 个
          </Descriptions.Item>
          <Descriptions.Item label="存储方式">
            localStorage（浏览器本地存储 + 跨页面持久化）
          </Descriptions.Item>
          <Descriptions.Item label="数据持久化">
            刷新页面、切换模块、切换角色后数据依然保留，直至执行重置操作
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="数据操作" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <h3 style={{ marginBottom: 8 }}>重置演示数据</h3>
            <p style={{ color: '#666', marginBottom: 16 }}>
              将所有模块中变更过的数据恢复为初始状态，适合重新开始演示。重置后所有持久化数据将被清除。
            </p>
            <Popconfirm
              title="确定要重置所有演示数据吗？"
              description="所有模块数据和审批记录将恢复为初始状态，此操作不可撤销"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              okText="确定重置"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={handleReset}
            >
              <Button type="primary" danger icon={<ReloadOutlined />} loading={loading}>
                重置为初始数据
              </Button>
            </Popconfirm>
          </div>

          <div>
            <h3 style={{ marginBottom: 8 }}>数据说明</h3>
            <ul style={{ color: '#666', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>所有模块的操作数据（新增/编辑/删除/审批）存储在浏览器 localStorage 中</li>
              <li>刷新页面、切换功能模块后，已修改的数据不会丢失</li>
              <li>切换登录用户后，公共数据（如项目、合同等）依然保留</li>
              <li>关闭浏览器后重新打开，localStorage 中的数据依然存在</li>
              <li>如需完全重置所有数据，点击上方按钮即可</li>
            </ul>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default DataPage
