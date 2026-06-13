import { Card, Table, Tag, Space, Button } from 'antd'
import { TeamOutlined } from '@ant-design/icons'

const departments = [
  { key: 'd1', name: '信息系统监理部', manager: '韦江腾', memberCount: 12, description: '负责信息系统监理业务，包括项目监理、技术咨询等' },
  { key: 'd2', name: '财务部', manager: '财务经理', memberCount: 5, description: '负责公司财务管理、预算、预算管理、成本核算等' },
  { key: 'd3', name: '人事行政部', manager: '人事经理', memberCount: 4, description: '负责招聘、培训、绩效管理、行政事务等' },
  { key: 'd4', name: '市场部', manager: '市场经理', memberCount: 8, description: '负责市场推广、客户关系维护、销售业务拓展' },
]

const columns = [
  { title: '部门名称', dataIndex: 'name', key: 'name' },
  { title: '部门负责人', dataIndex: 'manager', key: 'manager' },
  { title: '人员数量', dataIndex: 'memberCount', key: 'memberCount' },
  { title: '部门职责', dataIndex: 'description', key: 'description' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <Button size="small" type="link">查看</Button>
        <Button size="small" type="link">编辑</Button>
      </Space>
    ),
  },
]

function OrganizationPage() {
  return (
    <div>
      <Card
      title={
        <Space>
          <TeamOutlined />
          <span>组织管理</span>
        </Space>
      }
      style={{ marginBottom: 16 }}
      >
        <p style={{ margin: 0, color: '#666' }}>
          公司组织架构，包含信息系统监理部、财务部、人事行政部、市场部四大核心部门。
        </p>
      </Card>

      <Card title="部门列表">
        <Table dataSource={departments} columns={columns} pagination={false} bordered />
      </Card>
    </div>
  )
}

export default OrganizationPage
