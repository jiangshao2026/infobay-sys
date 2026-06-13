import { Card, Button, Space, Descriptions, Modal, message, Popconfirm } from 'antd'
import { DatabaseOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useAppData } from '../../context/AppDataContext'

function DataPage() {
  const { contractList, contractApprovalMap, resetAll } = useAppData()
  const [loading, setLoading] = useState(false)

  const contractCount = contractList?.length ?? 0
  const approvalRecordCount = Object.values(contractApprovalMap || {})
    .reduce((sum, records) => sum + (Array.isArray(records) ? records.length : 0), 0)

  const handleReset = () => {
    setLoading(true)
    setTimeout(() => {
      resetAll()
      setLoading(false)
      message.success('数据已重置')
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
          管理系统演示数据，可查看当前数据状态并重置为初始数据。
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
          <Descriptions.Item label="存储方式">
            localStorage（浏览器本地存储）
          </Descriptions.Item>
          <Descriptions.Item label="数据持久化">
            刷新页面、关闭浏览器后数据依然保留
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="数据操作" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <h3 style={{ marginBottom: 8 }}>重置演示数据</h3>
            <p style={{ color: '#666', marginBottom: 16 }}>
              将系统中的合同数据和审批记录恢复为初始状态，适合重新开始演示。
            </p>
            <Popconfirm
              title="确定要重置演示数据吗？"
              description="所有合同数据和审批记录将恢复为初始状态"
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
              <li>系统演示数据存储在浏览器的 localStorage 中</li>
              <li>刷新页面后数据不会丢失</li>
              <li>关闭浏览器后重新打开，数据依然保留</li>
              <li>如需完全重置，点击上方按钮即可</li>
            </ul>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default DataPage
