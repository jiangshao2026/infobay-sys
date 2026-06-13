import { Card, Table, Tag, Space, Button } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { DEMO_USERS } from '../../context/UserContext'

const columns = [
  {
    title: '头像',
    dataIndex: 'avatarText',
    key: 'avatar',
    width: 80,
    render: (text: string) => (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#1890ff',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
        }}
      >
        {text}
      </div>
    ),
  },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '职位', dataIndex: 'position', key: 'position' },
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

function UserPage() {
  return (
    <div>
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>用户管理</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <p style={{ margin: 0, color: '#666' }}>
          系统用户列表，包含不同角色的用户信息。
        </p>
      </Card>

      <Card title="用户列表">
        <Table dataSource={DEMO_USERS} columns={columns} pagination={false} bordered />
      </Card>
    </div>
  )
}

export default UserPage
