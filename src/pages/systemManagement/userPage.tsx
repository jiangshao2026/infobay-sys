import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd'
import { UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import { usePersistedState } from '../../hooks/usePersistedState'
import { DEMO_USERS, type DemoUser } from '../../context/UserContext'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
import { CompactTableCssOnly } from '../../components/DetailModal'

const { Option } = Select

const roleColorMap: Record<string, string> = {
  '副总经理': 'purple', '部门经理': 'geekblue', '总监理工程师': 'cyan',
  '监理工程师': 'green', '销售': 'orange',
}

function UserPage() {
  const { currentUser } = useUser()
  // 用 DEMO_USERS 初始化；若演示数据有新增，自动补到列表头部，保证新用户在管理页可见
  const initialList = useMemo(() => {
    const inStorage = (() => {
      try {
        const raw = localStorage.getItem('xb-demo-v4-sys-user')
        if (raw) return JSON.parse(raw) as DemoUser[]
      } catch (_) {}
      return null
    })()
    const base = inStorage && inStorage.length > 0 ? inStorage : DEMO_USERS
    const existingKeys = new Set(base.map(u => u.key))
    const missingUsers = DEMO_USERS.filter(u => !existingKeys.has(u.key))
    return [...missingUsers, ...base]
  }, [])
  const [list, setList] = usePersistedState<DemoUser[]>('sys-user', initialList)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isViewVisible, setIsViewVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<DemoUser | null>(null)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [searchKeyword, setSearchKeyword] = useState('')

  const filteredList = list.filter(item => {
    if (!searchKeyword) return true
    const kw = searchKeyword.toLowerCase()
    return item.name.toLowerCase().includes(kw) || item.position.toLowerCase().includes(kw) || item.role.toLowerCase().includes(kw)
  })

  const handleSearch = () => {
    searchForm.validateFields().then(v => setSearchKeyword(v.keyword || '')).catch(() => {})
  }
  const handleReset = () => { searchForm.resetFields(); setSearchKeyword('') }

  const showAdd = () => { setEditing(false); form.resetFields(); setIsModalVisible(true) }
  const handleEdit = (record: DemoUser) => {
    setEditing(true); setCurrentItem(record)
    form.setFieldsValue(record); setIsModalVisible(true)
  }
  const handleView = (record: DemoUser) => { setCurrentItem(record); setIsViewVisible(true) }

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editing && currentItem) {
        setList(prev => prev.map(i => i.key === currentItem.key ? {
          ...i,
          name: values.name,
          position: values.position,
          role: values.role,
          avatarText: values.name.charAt(0),
        } : i))
        message.success('修改成功')
        addAuditLog(currentUser.name, '系统管理', '编辑', values.name, '用户', `修改用户信息：姓名=${values.name}，角色=${values.role}`)
      } else {
        const newUser: DemoUser = {
          key: 'u' + Date.now(),
          name: values.name,
          position: values.position,
          role: values.role,
          avatarText: values.name.charAt(0),
        }
        setList(prev => [newUser, ...prev])
        message.success('新增成功')
        addAuditLog(currentUser.name, '系统管理', '新增', values.name, '用户', `新增用户：姓名=${values.name}，角色=${values.role}`)
      }
      setIsModalVisible(false); form.resetFields()
    }).catch(() => {})
  }

  const handleDelete = (key: string) => {
    if (list.length <= 1) { message.warning('至少保留一个用户'); return }
    const deletedUser = list.find(i => i.key === key)
    setList(prev => prev.filter(i => i.key !== key))
    message.success('已删除')
    if (deletedUser) {
      addAuditLog(currentUser.name, '系统管理', '删除', deletedUser.name, '用户', `删除用户：${deletedUser.name}`)
    }
  }

  const columns = [
    { title: '头像', dataIndex: 'avatarText', key: 'avatar', width: 70, render: (t: string) => (
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1890ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{t}</div>
    )},
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    { title: '职位', dataIndex: 'position', key: 'position', width: 200 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 150, render: (role: string) => <Tag color={roleColorMap[role] || 'blue'}>{role}</Tag> },
    {
      title: '操作', key: 'action', width: 200,
      render: (_: unknown, record: DemoUser) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); handleView(record) }}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEdit(record) }}>编辑</Button>
          <span onClick={(e) => e.stopPropagation()}>
            <Popconfirm title="确定删除此用户？" onConfirm={() => handleDelete(record.key)} okText="确定" cancelText="取消">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </span>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <CompactTableCssOnly />
      <Card title={<Space><UserOutlined /><span>用户管理</span></Space>} style={{ marginBottom: 16 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={showAdd}>新增用户</Button>}>
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="keyword">
            <Input placeholder="姓名/职位/角色" prefix={<SearchOutlined />} style={{ width: 220 }} />
          </Form.Item>
          <Form.Item><Button type="primary" onClick={handleSearch}>查询</Button></Form.Item>
          <Form.Item><Button onClick={handleReset}>重置</Button></Form.Item>
        </Form>
        <Table
          dataSource={filteredList}
          columns={columns}
          pagination={false}
          size="middle"
          rowKey="key"
          onRow={(record: DemoUser) => ({
            onClick: () => handleView(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal title={editing ? '编辑用户' : '新增用户'} open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)} width={480} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="position" label="职位" rules={[{ required: true, message: '请输入职位' }]}>
            <Input placeholder="请输入职位" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色">
              <Option value="副总经理">副总经理</Option>
              <Option value="部门经理">部门经理</Option>
              <Option value="总监理工程师">总监理工程师</Option>
              <Option value="监理工程师">监理工程师</Option>
              <Option value="销售">销售</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="用户详情" open={isViewVisible} onCancel={() => setIsViewVisible(false)} footer={null} width={400}>
        {currentItem && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1890ff', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 24, marginBottom: 16 }}>
              {currentItem.avatarText}
            </div>
            <p><strong>姓名：</strong>{currentItem.name}</p>
            <p><strong>职位：</strong>{currentItem.position}</p>
            <p><strong>角色：</strong><Tag color={roleColorMap[currentItem.role] || 'blue'}>{currentItem.role}</Tag></p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default UserPage
