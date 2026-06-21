import { Card, Table, Button, Space, Input, Select, DatePicker, Form, message, Tag, Modal } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useState, useRef, useEffect } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/changeRequests'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { ChangeRequestItem, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'
import { formatCurrency } from '../../utils/format'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'

const { Option } = Select
const { TextArea } = Input

type ChangeRecordType = '设计变更' | '进度变更' | '费用变更' | '其他变更'
type ChangeRecordStatus = '已记录' | '待处理' | '已完成'

interface ChangeRecordItem {
  key: string
  code: string
  projectCode: string
  title: string
  description: string
  reason: string
  applicant: string
  applyDate: string
  type: ChangeRecordType
  impactScope: string[]
  impactScheduleDays: number
  impactCost: number
  priority: '高' | '中' | '低'
  status: ChangeRecordStatus
  attachments: DocumentAttachment[]
  handler: string
  currentLevel: number
}

const changeStatusColor = (status: string): string => {
  switch (status) {
    case '已记录':
      return 'default'
    case '待处理':
      return 'gold'
    case '已完成':
      return 'green'
    default:
      return 'gray'
  }
}

const convertLegacyType = (t: string): ChangeRecordType => {
  const map: Record<string, ChangeRecordType> = {
    '范围变更': '设计变更',
    '技术变更': '设计变更',
    '进度变更': '进度变更',
    '成本变更': '费用变更',
    '其他': '其他变更',
  }
  return map[t] || '其他变更'
}

const convertLegacyStatus = (s: string): ChangeRecordStatus => {
  if (s === '已审批' || s === '已执行') return '已完成'
  if (s === '草稿') return '已记录'
  return '待处理'
}

const normalizeLegacyList = (items: ChangeRequestItem[]): ChangeRecordItem[] =>
  items.map(item => ({
    ...item,
    type: convertLegacyType(item.type),
    status: convertLegacyStatus(item.status),
    handler: item.applicant || '',
  }))

function ChangeRecord() {
  const [list, setList] = usePersistedState<ChangeRecordItem[]>('change-record-list', normalizeLegacyList(initialData))
  const { currentUser } = useUser()
const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ChangeRecordItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      onCell: (record: ChangeRecordItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目名称',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 260,
      render: (code: string) => descText(getProjectNameByCode(code)),
      onCell: (record: ChangeRecordItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '变更类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: ChangeRecordType) => <Tag color="geekblue">{type}</Tag>,
      onCell: (record: ChangeRecordItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '变更日期',
      dataIndex: 'applyDate',
      key: 'applyDate',
      width: 110,
      onCell: (record: ChangeRecordItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 110,
      render: (t: string) => t || <span style={{ color: '#bbb' }}>—</span>,
      onCell: (record: ChangeRecordItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '影响工期',
      dataIndex: 'impactScheduleDays',
      key: 'impactScheduleDays',
      width: 100,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#fa541c' : undefined, fontWeight: 500 }}>
          {v > 0 ? `+${v}` : v} 天
        </span>
      ),
      onCell: (record: ChangeRecordItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '影响金额',
      dataIndex: 'impactCost',
      key: 'impactCost',
      width: 130,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#fa541c' : '#52c41a', fontWeight: 500 }}>
          {formatCurrency(v)}
        </span>
      ),
      onCell: (record: ChangeRecordItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ChangeRecordStatus) => <Tag color={changeStatusColor(status)}>{status}</Tag>,
      onCell: (record: ChangeRecordItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, record: ChangeRecordItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.key)}>删除</Button>
        </Space>
      ),
    },
  ]

  const handleView = (record: ChangeRecordItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: ChangeRecordItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      applyDate: record.applyDate ? dayjs(record.applyDate) : null,
      impactScope: record.impactScope || [],
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const item = list.find(i => i.key === key)
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此变更记录吗？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setList(prev => { const r = prev.filter(item => item.key !== key); return r })
        message.success('删除成功')
        if (item) addAuditLog(currentUser.name, '变更控制', '删除', item.title || item.code, '变更记录', `删除变更记录：${item.code}`)
      },
    })
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existing: ChangeRecordItem | null): ChangeRecordItem => {
    const prev = existing || {
      key,
      code: '',
      projectCode: '',
      title: '',
      description: '',
      reason: '',
      applicant: '',
      applyDate: '',
      type: '其他变更' as ChangeRecordType,
      impactScope: [] as string[],
      impactScheduleDays: 0,
      impactCost: 0,
      priority: '中' as '高' | '中' | '低',
      status: '已记录' as ChangeRecordStatus,
      attachments: [] as DocumentAttachment[],
      handler: '',
      currentLevel: 0,
    }
    return {
      ...prev,
      key,
      code: values.code || prev.code,
      projectCode: values.projectCode || prev.projectCode,
      title: values.title || '',
      description: values.description || '',
      reason: values.reason || '',
      applicant: values.applicant || '',
      applyDate: values.applyDate ? values.applyDate.format('YYYY-MM-DD') : prev.applyDate,
      type: values.type as ChangeRecordType,
      impactScope: (values.impactScope || []) as string[],
      impactScheduleDays: Number(values.impactScheduleDays) || 0,
      impactCost: Number(values.impactCost) || 0,
      priority: (values.priority || '中') as '高' | '中' | '低',
      status: values.status as ChangeRecordStatus,
      handler: values.handler || prev.handler,
      attachments: values.attachments || prev.attachments,
      currentLevel: prev.currentLevel,
    }
  }

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem = normalize(values, Date.now().toString(), null)
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentItem) {
        setList(prev => { const r = prev.map(item =>
          item.key === currentItem.key ? normalize(values, currentItem.key, currentItem) : item
        ); return r })
        setIsEditModalVisible(false)
        editForm.resetFields()
        setCurrentItem(null)
        message.success('修改成功')
        addAuditLog(currentUser.name, '变更控制', '编辑', currentItem.title || currentItem.code, '变更记录', `编辑变更记录：${currentItem.code}`)
      }
    })
  }

  const handleSearch = () => {
    searchForm.validateFields().then(values => {
      let filtered = list.filter(item => {
        let match = true
        if (values.keyword) {
          const kw = values.keyword.toLowerCase()
          match = match && (
            item.code.toLowerCase().includes(kw) ||
            item.title.toLowerCase().includes(kw) ||
            item.handler.toLowerCase().includes(kw) ||
            item.applicant.toLowerCase().includes(kw)
          )
        }
        if (values.projectCode) {
          match = match && item.projectCode === values.projectCode
        }
        if (values.type) {
          match = match && item.type === values.type
        }
        if (values.status) {
          match = match && item.status === values.status
        }
        return match
      })
      setList(filtered)
      message.success(`查询到 ${filtered.length} 条记录`)
    }).catch(() => {})
  }

  const handleReset = () => {
    searchForm.resetFields()
    setList([...list])
  }

  const handleCancel = () => {
    setIsAddModalVisible(false)
    setIsEditModalVisible(false)
    setIsDetailModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ type: '设计变更' as ChangeRecordType, status: '已记录' as ChangeRecordStatus, priority: '中' }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]} style={{ flex: 1 }}>
          <Input placeholder="如：BG-2025-001" />
        </Form.Item>
        <Form.Item name="projectCode" label="所属项目" rules={[{ required: true, message: '请选择项目' }]} style={{ flex: 2 }}>
          <Select placeholder="请选择项目" showSearch optionFilterProp="children">
            {projectOptions}
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="title" label="变更标题" rules={[{ required: true, message: '请输入变更标题' }]}>
        <Input placeholder="请输入变更标题" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="type" label="变更类型" rules={[{ required: true, message: '请选择类型' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择类型">
            <Option value="设计变更">设计变更</Option>
            <Option value="进度变更">进度变更</Option>
            <Option value="费用变更">费用变更</Option>
            <Option value="其他变更">其他变更</Option>
          </Select>
        </Form.Item>
        <Form.Item name="applyDate" label="变更日期" rules={[{ required: true, message: '请选择变更日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="priority" label="优先级" rules={[{ required: true }]} style={{ flex: 1 }}>
          <Select placeholder="请选择优先级">
            <Option value="高">高</Option>
            <Option value="中">中</Option>
            <Option value="低">低</Option>
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="applicant" label="申请人" rules={[{ required: true, message: '请输入申请人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入申请人" />
        </Form.Item>
        <Form.Item name="handler" label="处理人" style={{ flex: 1 }}>
          <Input placeholder="请输入处理人" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            <Option value="已记录">已记录</Option>
            <Option value="待处理">待处理</Option>
            <Option value="已完成">已完成</Option>
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="impactScheduleDays" label="影响工期（天）" style={{ flex: 1 }}>
          <Input type="number" placeholder="如：5" />
        </Form.Item>
        <Form.Item name="impactCost" label="影响金额（元）" style={{ flex: 1 }}>
          <Input type="number" placeholder="如：100000" />
        </Form.Item>
        <Form.Item name="impactScope" label="影响范围" style={{ flex: 1 }}>
          <Select mode="multiple" placeholder="可多选">
            <Option value="范围">范围</Option>
            <Option value="成本">成本</Option>
            <Option value="进度">进度</Option>
            <Option value="质量">质量</Option>
            <Option value="风险">风险</Option>
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="description" label="变更描述">
        <TextArea rows={3} placeholder="请简要描述变更内容" />
      </Form.Item>
      <Form.Item name="reason" label="变更原因">
        <TextArea rows={3} placeholder="请说明变更原因" />
      </Form.Item>
      <Form.Item name="attachments" label="附件">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>变更记录</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增变更</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="projectCode">
            <Select placeholder="项目" style={{ width: 220 }} allowClear showSearch optionFilterProp="children">
              {projectOptions}
            </Select>
          </Form.Item>
          <Form.Item name="type">
            <Select placeholder="变更类型" style={{ width: 140 }} allowClear>
              <Option value="设计变更">设计变更</Option>
              <Option value="进度变更">进度变更</Option>
              <Option value="费用变更">费用变更</Option>
              <Option value="其他变更">其他变更</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="已记录">已记录</Option>
              <Option value="待处理">待处理</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/处理人）" prefix={<SearchOutlined />} style={{ width: 260 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSearch}>查询</Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
        </Form>
        <Table
          columns={columns}
          dataSource={list}
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 1700 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增变更记录" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={760} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="修改变更记录" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={760} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="变更记录详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('变更标题', descText(currentItem.title)),
            descItem('变更类型', <Tag color="geekblue">{currentItem.type}</Tag>),
            descItem('变更日期', descText(currentItem.applyDate)),
            descItem('申请人', descText(currentItem.applicant)),
            descItem('处理人', descText(currentItem.handler || '—')),
            descItem('优先级', descText(currentItem.priority)),
            descItem('影响工期', <span style={{ fontWeight: 500 }}>{currentItem.impactScheduleDays > 0 ? `+${currentItem.impactScheduleDays}` : currentItem.impactScheduleDays} 天</span>),
            descItem('影响金额', <span style={{ fontWeight: 500 }}>{formatCurrency(currentItem.impactCost)}</span>),
            currentItem.impactScope && currentItem.impactScope.length > 0
              ? descItem('影响范围', currentItem.impactScope.map((s, i) => <Tag key={i} style={{ marginRight: 4 }}>{s}</Tag>))
              : null,
            descItem('状态', <Tag color={changeStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.description ? descItem('变更描述', descText(currentItem.description)) : null,
            currentItem.reason ? descItem('变更原因', descText(currentItem.reason)) : null,
          ].filter(Boolean) as any[]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          return items
        })()}
      />
    </div>
  )
}

export default ChangeRecord
export { ChangeRecord }
