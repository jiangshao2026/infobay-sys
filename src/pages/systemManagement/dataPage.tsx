import { Card, Button, message, Popconfirm } from 'antd'
import { DatabaseOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { resetAllPersistedData } from '../../hooks/usePersistedState'
import { clearAllFiles } from '../../utils/fileStore'

function DataPage() {
  const { resetAll } = useAppData()
  const [loading, setLoading] = useState(false)

  const handleReset = () => {
    setLoading(true)
    setTimeout(async () => {
      await clearAllFiles()
      resetAll()
      resetAllPersistedData()
      message.success('所有数据已重置为初始状态，页面即将刷新')
      setTimeout(() => { window.location.reload() }, 800)
    }, 300)
  }

  return (
    <div>
      <Card
        title={
          <>
            <DatabaseOutlined />
            <span> 数据管理</span>
          </>
        }
      >
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

        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>数据说明</h3>
          <ul style={{ color: '#666', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>所有模块的操作数据（新增/编辑/删除/审批）存储在浏览器 localStorage 中</li>
            <li>上传的文件附件存储在浏览器 IndexedDB 中</li>
            <li>刷新页面、切换功能模块后，已修改的数据不会丢失</li>
            <li>切换登录用户后，公共数据（如项目、合同等）依然保留</li>
            <li>关闭浏览器后重新打开，localStorage 和 IndexedDB 中的数据依然存在</li>
            <li>如需完全重置所有数据，点击上方按钮即可</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default DataPage
