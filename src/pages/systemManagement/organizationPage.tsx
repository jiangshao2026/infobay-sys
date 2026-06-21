import { Card, Table, Space, Button, Modal, Form, Input, message, Popconfirm, Tag, Select } from 'antd'
import { TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
import { CompactTableCssOnly } from '../../components/DetailModal'

const { Option } = Select

interface DeptItem {
  key: string
  name: string
  manager: string
  memberCount: number
  description: string
  status: string
}

const initDepts: DeptItem[] = [
  { key: 'd1', name: '信息系统监理部', manager: '韦江腾', memberCount: 12, description: '负责信息系统监理业务，包括项目监理、技术咨询等', status: '正常' },
  { key: 'd2', name: '财务部', manager: '财务经理', memberCount: 5, description: '负责公司财务管理、预算管理、成本核算等', status: '正常' },
  { key: 'd3', name: '人事行政部', manager: '人事经理', memberCount: 4, description: '负责招聘、培训、绩效管理、行政事务等', status: '正常' },
  { key: 'd4', name: '市场部', manager: '市场经理', memberCount: 8, description: '负责市场推广、客户关系维护、销售业务拓展', status: '正常' },
]

const statusColors: Record<string, string> = { '正常': 'green', '停用': 'red' }

function OrganizationPage() {
  const { currentUser } = useUser()
  const [list, setList] = usePersistedState<DeptItem[]>('sys-org', initDepts)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isViewVisible, setIsViewVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<DeptItem | null>(null)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [searchParams, setSearchParams] = useState<{ keyword?: string; status?: string }>({})

  const filteredList = list.filter(item => {
    if (searchParams.keyword) {
      const kw = searchParams.keyword.toLowerCase()
      if (!item.name.toLowerCase().includes(kw) && !item.manager.toLowerCase().includes(kw)) return false
    }
    if (searchParams.status && item.status !== searchParams.status) return false
    return true
  })

  const handleSearch = () => {
    searchForm.validateFields().then(v => setSearchParams(v)).catch(() => {})
  }
  const handleReset = () => { searchForm.resetFields(); setSearchParams({}) }

  const showAdd = () => { setEditing(false); form.resetFields(); setIsModalVisible(true) }
  const handleEdit = (record: DeptItem) => {
    setEditing(true); setCurrentItem(record)
    form.setFieldsValue(record); setIsModalVisible(true)
  }
  const handleView = (record: DeptItem) => { setCurrentItem(record); setIsViewVisible(true) }

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editing && currentItem) {
        setList(prev => prev.map(i => i.key === currentItem.key ? { ...i, ...values, memberCount: Number(values.memberCount) || i.memberCount } : i))
        message.success('修改成功')
        addAuditLog(currentUser.name, '系统管理', '编辑', values.name, '部门', `修改部门信息：名称=${values.name}，负责人=${values.manager}`)
      } else {
        const newItem: DeptItem = { ...values, key: 'd' + Date.now(), memberCount: Number(values.memberCount) || 0 }
        setList(prev => [newItem, ...prev])
        message.success('新增成功')
        addAuditLog(currentUser.name, '系统管理', '新增', values.name, '部门', `新增部门：名称=${values.name}，负责人=${values.manager}`)
      }
      setIsModalVisible(false); form.resetFields()
    }).catch(() => {})
  }

  const handleDelete = (key: string) => {
    const deletedItem = list.find(i => i.key === key)
    setList(prev => prev.filter(i => i.key !== key))
    message.success('已删除')
    if (deletedItem) {
      addAuditLog(currentUser.name, '系统管理', '删除', deletedItem.name, '部门', `删除部门：${deletedItem.name}`)
    }
  }

  const toggleStatus = (record: DeptItem) => {
    const newStatus = record.status === '正常' ? '停用' : '正常'
    setList(prev => prev.map(i => i.key === record.key ? { ...i, status: newStatus } : i))
    message.success(`已${newStatus === '正常' ? '启用' : '停用'}`)
    addAuditLog(currentUser.name, '系统管理', '编辑', record.name, '部门', `${newStatus === '正常' ? '启用' : '停用'}部门：${record.name}`)
  }

  const columns = [
    { title: '部门名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '部门负责人', dataIndex: 'manager', key: 'manager', width: 140 },
    { title: '人员数量', dataIndex: 'memberCount', key: 'memberCount', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag> },
    { title: '部门职责', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作', key: 'action', width: 240,
      render: (_: unknown, record: DeptItem) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); handleView(record) }}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEdit(record) }}>编辑</Button>
          <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); toggleStatus(record) }}>
            {record.status === '正常' ? '停用' : '启用'}
          </Button>
          <span onClick={(e) => e.stopPropagation()}>
            <Popconfirm title="确定删除此部门？" onConfirm={() => handleDelete(record.key)} okText="确定" cancelText="取消">
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
      <Card title={<Space><TeamOutlined /><span>组织管理</span></Space>} style={{ marginBottom: 16 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={showAdd}>新增部门</Button>}>
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="keyword">
            <Input placeholder="部门名称/负责人" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="正常">正常</Option>
              <Option value="停用">停用</Option>
            </Select>
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
          onRow={(record: DeptItem) => ({
            onClick: () => handleView(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal title={editing ? '编辑部门' : '新增部门'} open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)} width={520} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item name="manager" label="部门负责人" rules={[{ required: true, message: '请输入负责人' }]}>
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item name="memberCount" label="人员数量">
            <Input type="number" placeholder="请输入人员数量" />
          </Form.Item>
          <Form.Item name="description" label="部门职责">
            <Input.TextArea rows={2} placeholder="请输入部门职责描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="部门详情" open={isViewVisible} onCancel={() => setIsViewVisible(false)} footer={null} width={520}>
        {currentItem && (
          <div>
            <p><strong>部门名称：</strong>{currentItem.name}</p>
            <p><strong>负责人：</strong>{currentItem.manager}</p>
            <p><strong>人员数量：</strong>{currentItem.memberCount}</p>
            <p><strong>状态：</strong><Tag color={statusColors[currentItem.status]}>{currentItem.status}</Tag></p>
            <p><strong>职责：</strong>{currentItem.description}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrganizationPage
