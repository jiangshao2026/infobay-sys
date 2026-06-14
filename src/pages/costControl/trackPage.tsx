import { Card, Table, Button, Space, Input, Select, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import initialData from '../../data/costTracks'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { CostTrackItem, CCPhase, CCTrackStatus, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'
import { formatCurrency } from '../../utils/format'

const { Option } = Select
const { TextArea } = Input

const trackStatusColor = (status: string): string => {
  switch (status) {
    case '正常':
      return 'blue'
    case '超支':
      return 'volcano'
    case '节约':
      return 'green'
    default:
      return 'gray'
  }
}

const varianceColor = (v: number): string => {
  if (v > 0) return '#f5222d'
  if (v < 0) return '#52c41a'
  return '#1890ff'
}

interface TrackPageProps {}

const TrackPanel: React.FC<TrackPageProps> = () => {
  const [list, setList] = useState<CostTrackItem[]>(initialData)
const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<CostTrackItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: CostTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 280,
      render: (code: string) => descText(getProjectNameByCode(code)),
      onCell: (record: CostTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      onCell: (record: CostTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '预算',
      dataIndex: 'budgetAmount',
      key: 'budgetAmount',
      width: 130,
      render: (v: number) => formatCurrency(v),
      onCell: (record: CostTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '实际',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 130,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span>,
      onCell: (record: CostTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '偏差金额',
      dataIndex: 'variance',
      key: 'variance',
      width: 130,
      render: (v: number) => <span style={{ color: varianceColor(v), fontWeight: 600 }}>{formatCurrency(v)}</span>,
      onCell: (record: CostTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '偏差%',
      dataIndex: 'variancePercent',
      key: 'variancePercent',
      width: 100,
      render: (v: number) => <span style={{ color: varianceColor(v), fontWeight: 600 }}>{v > 0 ? `+${v}%` : `${v}%`}</span>,
      onCell: (record: CostTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '周期',
      dataIndex: 'period',
      key: 'period',
      width: 130,
      onCell: (record: CostTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: CCTrackStatus) => <Tag color={trackStatusColor(status)}>{status}</Tag>,
      onCell: (record: CostTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: CostTrackItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此成本跟踪记录？"
            onConfirm={() => handleDelete(record.key)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<DeleteOutlined />} size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleView = (record: CostTrackItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: CostTrackItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): CostTrackItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    category: values.category as CCPhase,
    budgetAmount: Number(values.budgetAmount) || 0,
    actualAmount: Number(values.actualAmount) || 0,
    variance: Number(values.variance) || 0,
    variancePercent: Number(values.variancePercent) || 0,
    period: values.period,
    status: values.status as CCTrackStatus,
    description: values.description || '',
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: CostTrackItem = normalize(values, Date.now().toString(), [])
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
          item.key === currentItem.key ? normalize(values, currentItem.key, currentItem.attachments) : item
        ); return r })
        setIsEditModalVisible(false)
        editForm.resetFields()
        setCurrentItem(null)
        message.success('修改成功')
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
            item.title.toLowerCase().includes(kw)
          )
        }
        if (values.projectCode) {
          match = match && item.projectCode === values.projectCode
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
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ category: '开发费' as CCPhase, status: '正常' as CCTrackStatus }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入编号" />
        </Form.Item>
        <Form.Item name="projectCode" label="所属项目" rules={[{ required: true, message: '请选择项目' }]} style={{ flex: 2 }}>
          <Select placeholder="请选择项目" showSearch optionFilterProp="children">
            {projectOptions}
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
        <Input placeholder="请输入标题" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择类别' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择类别">
            <Option value="开发费">开发费</Option>
            <Option value="设备费">设备费</Option>
            <Option value="材料费">材料费</Option>
            <Option value="人工费">人工费</Option>
            <Option value="监理费">监理费</Option>
            <Option value="其他">其他</Option>
          </Select>
        </Form.Item>
        <Form.Item name="period" label="周期" rules={[{ required: true, message: '请输入周期' }]} style={{ flex: 1 }}>
          <Input placeholder="例如：2025年上半年" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            <Option value="正常">正常</Option>
            <Option value="超支">超支</Option>
            <Option value="节约">节约</Option>
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="budgetAmount" label="预算金额(元)" rules={[{ required: true, message: '请输入预算' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入预算金额" />
        </Form.Item>
        <Form.Item name="actualAmount" label="实际金额(元)" rules={[{ required: true, message: '请输入实际金额' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入实际金额" />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="variance" label="偏差金额(元)" rules={[{ required: true, message: '请输入偏差金额' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="正数表示超支，负数表示节约" />
        </Form.Item>
        <Form.Item name="variancePercent" label="偏差百分比(%)" rules={[{ required: true, message: '请输入偏差百分比' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入偏差百分比，例如：4.3" />
        </Form.Item>
      </div>
      <Form.Item name="description" label="说明">
        <TextArea rows={3} placeholder="请输入偏差说明或其他备注" />
      </Form.Item>
      <Form.Item name="attachments" label="附件">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>成本跟踪管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增跟踪</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="projectCode">
            <Select placeholder="项目" style={{ width: 220 }} allowClear showSearch optionFilterProp="children">
              {projectOptions}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 130 }} allowClear>
              <Option value="正常">正常</Option>
              <Option value="超支">超支</Option>
              <Option value="节约">节约</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题）" prefix={<SearchOutlined />} style={{ width: 240 }} />
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

      <Modal title="新增成本跟踪" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑成本跟踪" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="成本跟踪详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          return [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('类别', descText(currentItem.category)),
            descItem('周期', descText(currentItem.period)),
            descItem('预算金额', formatCurrency(currentItem.budgetAmount)),
            descItem('实际金额', <span style={{ fontWeight: 600 }}>{formatCurrency(currentItem.actualAmount)}</span>),
            descItem('偏差金额', <span style={{ color: varianceColor(currentItem.variance), fontWeight: 600 }}>{formatCurrency(currentItem.variance)}</span>),
            descItem('偏差百分比', <span style={{ color: varianceColor(currentItem.variancePercent), fontWeight: 600 }}>{currentItem.variancePercent > 0 ? `+${currentItem.variancePercent}%` : `${currentItem.variancePercent}%`}</span>),
            descItem('状态', <Tag color={trackStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.description ? descItem('说明', descText(currentItem.description)) : null,
            descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />),
          ].filter(Boolean) as any[]
        })()}
      />
    </div>
  )
}

export default TrackPanel
