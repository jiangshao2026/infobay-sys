import { Card, Table, Tag, Space, Button } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'

const permissions = [
  { key: 'p1', role: '副总经理', modules: '所有模块', description: '系统最高权限，可访问和管理所有模块' },
  { key: 'p2', role: '部门经理', modules: '项目管理、合同审批', description: '可审批部门级合同，管理部门项目' },
  { key: 'p3', role: '总监理工程师', modules: '项目管理、质量控制、合同审批', description: '可审批监理合同，管理监理项目和质量检查' },
  { key: 'p4', role: '监理工程师', modules: '项目管理、质量检查', description: '可执行具体项目的监理工作和质量检查' },
  { key: 'p5', role: '销售', modules: '项目管理、发起合同', description: '可发起合同审批，管理销售业务' },
]

const columns = [
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    render: (role: string) => {
      let color = 'blue'
      if (role === '副总经理') color = 'purple'
      else if (role === '部门经理') color = 'geekblue'
      else if (role === '总监理工程师') color = 'cyan'
      else if (role === '监理工程师') color = 'green'
      else if (role === '销售') color = 'orange'
      return <Tag color={color}>{role}</Tag>
    },
  },
  { title: '可访问模块', dataIndex: 'modules', key: 'modules' },
  { title: '权限说明', dataIndex: 'description', key: 'description' },
]

function PermissionPage() {
  return (
    <div>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            <span>权限管理</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <p style={{ margin: 0, color: '#666' }}>
          系统角色权限管理，不同角色可访问的模块和操作权限不同。
        </p>
      </Card>

      <Card title="角色权限列表">
        <Table dataSource={permissions} columns={columns} pagination={false} bordered />
      </Card>
    </div>
  )
}

export default PermissionPage
