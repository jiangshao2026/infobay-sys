import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd'
import { SafetyCertificateOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
import { CompactTableCssOnly } from '../../components/DetailModal'

const { Option } = Select

interface PermItem {
  key: string
  role: string
  modules: string
  description: string
}

const initPerms: PermItem[] = [
  { key: 'p1', role: '副总经理', modules: '所有模块', description: '系统最高权限，可访问和管理所有模块，拥有审批最终决定权' },
  { key: 'p2', role: '部门经理', modules: '项目管理、合同审批、人员管理', description: '可审批部门级合同，管理部门项目和人员' },
  { key: 'p3', role: '总监理工程师', modules: '项目管理、质量控制、监理规划、监理师管理', description: '可审批监理合同，管理监理项目和质量检查' },
  { key: 'p4', role: '监理工程师', modules: '项目管理、质量检查、进度跟踪、成本跟踪', description: '可执行具体项目的监理工作和质量检查' },
  { key: 'p5', role: '销售', modules: '项目管理、发起合同、合同收款', description: '可发起合同审批，管理销售业务' },
]

const roleColors: Record<string, string> = {
  '副总经理': 'purple', '部门经理': 'geekblue', '总监理工程师': 'cyan',
  '监理工程师': 'green', '销售': 'orange',
}

function PermissionPage() {
  const { currentUser } = useUser()
  const [list, setList] = usePersistedState<PermItem[]>('sys-perm', initPerms)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isViewVisible, setIsViewVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<PermItem | null>(null)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [searchKeyword, setSearchKeyword] = useState('')

  const filteredList = list.filter(item => {
    if (!searchKeyword) return true
    const kw = searchKeyword.toLowerCase()
    return item.role.toLowerCase().includes(kw) || item.modules.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw)
  })

  const handleSearch = () => {
    searchForm.validateFields().then(v => setSearchKeyword(v.keyword || '')).catch(() => {})
  }
  const handleReset = () => { searchForm.resetFields(); setSearchKeyword('') }

  const showAdd = () => { setEditing(false); form.resetFields(); setIsModalVisible(true) }
  const handleEdit = (record: PermItem) => {
    setEditing(true); setCurrentItem(record)
    form.setFieldsValue(record); setIsModalVisible(true)
  }
  const handleView = (record: PermItem) => { setCurrentItem(record); setIsViewVisible(true) }

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editing && currentItem) {
        setList(prev => prev.map(i => i.key === currentItem.key ? { ...i, ...values } : i))
        message.success('修改成功')
        addAuditLog(currentUser.name, '系统管理', '编辑', values.role, '权限', `修改权限配置：角色=${values.role}`)
      } else {
        const newItem: PermItem = { ...values, key: 'p' + Date.now() }
        setList(prev => [newItem, ...prev])
        message.success('新增成功')
        addAuditLog(currentUser.name, '系统管理', '新增', values.role, '权限', `新增权限配置：角色=${values.role}，模块=${values.modules}`)
      }
      setIsModalVisible(false); form.resetFields()
    }).catch(() => {})
  }

  const handleDelete = (key: string) => {
    if (list.length <= 1) { message.warning('至少保留一条权限配置'); return }
    const deletedItem = list.find(i => i.key === key)
    setList(prev => prev.filter(i => i.key !== key))
    message.success('已删除')
    if (deletedItem) {
      addAuditLog(currentUser.name, '系统管理', '删除', deletedItem.role, '权限', `删除权限配置：${deletedItem.role}`)
    }
  }

  const columns = [
    { title: '角色', dataIndex: 'role', key: 'role', width: 160, render: (role: string) => <Tag color={roleColors[role] || 'blue'}>{role}</Tag> },
    { title: '可访问模块', dataIndex: 'modules', key: 'modules', width: 300 },
    { title: '权限说明', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作', key: 'action', width: 200,
      render: (_: unknown, record: PermItem) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); handleView(record) }}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEdit(record) }}>编辑</Button>
          <span onClick={(e) => e.stopPropagation()}>
            <Popconfirm title="确定删除此权限配置？" onConfirm={() => handleDelete(record.key)} okText="确定" cancelText="取消">
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
      <Card title={<Space><SafetyCertificateOutlined /><span>权限管理</span></Space>} style={{ marginBottom: 16 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={showAdd}>新增权限</Button>}>
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="keyword">
            <Input placeholder="角色/模块" prefix={<SearchOutlined />} style={{ width: 220 }} />
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
          onRow={(record: PermItem) => ({
            onClick: () => handleView(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal title={editing ? '编辑权限' : '新增权限'} open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)} width={520} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="role" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="modules" label="可访问模块" rules={[{ required: true, message: '请输入可访问模块' }]}>
            <Input placeholder="如：项目管理、质量控制、合同审批" />
          </Form.Item>
          <Form.Item name="description" label="权限说明">
            <Input.TextArea rows={2} placeholder="请输入权限说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="权限详情" open={isViewVisible} onCancel={() => setIsViewVisible(false)} footer={null} width={450}>
        {currentItem && (
          <div>
            <p><strong>角色：</strong><Tag color={roleColors[currentItem.role] || 'blue'}>{currentItem.role}</Tag></p>
            <p><strong>可访问模块：</strong>{currentItem.modules}</p>
            <p><strong>权限说明：</strong>{currentItem.description}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PermissionPage
