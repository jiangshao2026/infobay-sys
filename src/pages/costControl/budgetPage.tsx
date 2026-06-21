import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
import initialData, { initialBudgetApprovalMap } from '../../data/costBudgets'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { CostBudgetItem, CCPhase, CCBudgetStatus, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'
import { formatCurrency } from '../../utils/format'

const { Option } = Select

const budgetStatusColor = (status: string): string => {
  switch (status) {
    case '草稿':
      return 'default'
    case '待审批':
      return 'gold'
    case '一审中':
      return 'cyan'
    case '一审通过':
      return 'blue'
    case '已审批':
      return 'green'
    case '已驳回':
      return 'volcano'
    default:
      return 'gray'
  }
}

interface BudgetPageProps {}

const BudgetPanel: React.FC<BudgetPageProps> = () => {
  const [list, setList] = usePersistedState<CostBudgetItem[]>('cost-budget', initialData)
  const { currentUser } = useUser()
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('costControl-budgetPage-approval', initialBudgetApprovalMap)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<CostBudgetItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: CostBudgetItem) => ({
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
      onCell: (record: CostBudgetItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: CostBudgetItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      onCell: (record: CostBudgetItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '预算金额',
      dataIndex: 'budgetAmount',
      key: 'budgetAmount',
      width: 130,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span>,
      onCell: (record: CostBudgetItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '审批金额',
      dataIndex: 'approvedAmount',
      key: 'approvedAmount',
      width: 130,
      render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{formatCurrency(v)}</span>,
      onCell: (record: CostBudgetItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '周期开始',
      dataIndex: 'periodStart',
      key: 'periodStart',
      width: 110,
      onCell: (record: CostBudgetItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '周期结束',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      width: 110,
      onCell: (record: CostBudgetItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: CCBudgetStatus) => <Tag color={budgetStatusColor(status)}>{status}</Tag>,
      onCell: (record: CostBudgetItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: CostBudgetItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {(record.status === '待审批' && (currentUser.role === '监理工程师' || currentUser.role === '总监理工程师')) && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
          )}
          {record.status === '一审通过' && currentUser.role === '总监理工程师' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
          )}
          <Popconfirm
            title="确定删除此成本预算？"
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

  const handleView = (record: CostBudgetItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: CostBudgetItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      periodStart: record.periodStart ? dayjs(record.periodStart) : null,
      periodEnd: record.periodEnd ? dayjs(record.periodEnd) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const deletedItem = list.find(item => item.key === key)
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
    if (deletedItem) {
      addAuditLog(currentUser.name, '成本控制', '删除', deletedItem.title, '成本预算', `删除成本预算：${deletedItem.code}`)
    }
  }

  const handleReview = (record: CostBudgetItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): CostBudgetItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    category: values.category as CCPhase,
    budgetAmount: Number(values.budgetAmount) || 0,
    approvedAmount: Number(values.approvedAmount) || 0,
    periodStart: values.periodStart ? values.periodStart.format('YYYY-MM-DD') : '',
    periodEnd: values.periodEnd ? values.periodEnd.format('YYYY-MM-DD') : '',
    status: values.status as CCBudgetStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: CostBudgetItem = normalize(values, Date.now().toString(), [])
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
      addAuditLog(currentUser.name, '成本控制', '新增', values.title, '成本预算', `新增成本预算：${values.code}`)
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
        addAuditLog(currentUser.name, '成本控制', '编辑', currentItem.title, '成本预算', `编辑成本预算：${currentItem.code}`)
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
    setList(getPersistedData<CostBudgetItem[]>('cost-budget') ?? list)
  }

  const handleCancel = () => {
    setIsAddModalVisible(false)
    setIsEditModalVisible(false)
    setIsDetailModalVisible(false)
    setIsReviewModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    setCurrentItem(null)
  }

  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string }) => {
    if (!currentItem) return
    const key = currentItem.key
    const existingRecords = approvalMap[key] || []
    const nextLevel = (existingRecords.length + 1)

    const newRecord: ApprovalRecord = {
      key: `${key}-r${nextLevel}-${Date.now()}`,
      code: `${currentItem.code}-R${nextLevel}`,
      level: nextLevel,
      reviewer: payload.reviewer,
      comment: payload.comment,
      status: payload.status,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
    setApprovalMap(prev => ({ ...prev, [key]: [...existingRecords, newRecord] }))

    if (payload.status === '驳回') {
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '待审批' as CCBudgetStatus } : item); return r })
      message.success('已驳回，返回待审批')
      addAuditLog(currentUser.name, '成本控制', '审批', currentItem.title, '成本预算', `驳回成本预算：${currentItem.code}`)
    } else {
      const newStatus: CCBudgetStatus = currentItem.status === '待审批' ? '一审通过' : '已审批'
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: newStatus } : item); return r })
      message.success(newStatus === '已审批' ? '终审已通过' : '一审通过，等待总监理工程师终审')
      addAuditLog(currentUser.name, '成本控制', '审批', currentItem.title, '成本预算', `${newStatus === '已审批' ? '终审通过' : '一审通过'}成本预算：${currentItem.code}`)
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ category: '开发费' as CCPhase, status: '草稿' as CCBudgetStatus }}>
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
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            <Option value="草稿">草稿</Option>
            <Option value="待审批">待审批</Option>
            <Option value="一审中">一审中</Option>
            <Option value="一审通过">一审通过</Option>
            <Option value="已审批">已审批</Option>
            <Option value="已驳回">已驳回</Option>
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="budgetAmount" label="预算金额(元)" rules={[{ required: true, message: '请输入预算金额' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入预算金额（单位：元）" />
        </Form.Item>
        <Form.Item name="approvedAmount" label="审批金额(元)" style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入审批金额（单位：元）" />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="periodStart" label="周期开始" rules={[{ required: true, message: '请选择开始日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="periodEnd" label="周期结束" rules={[{ required: true, message: '请选择结束日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <Form.Item name="attachments" label="附件">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>成本预算管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增预算</Button>
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
              <Option value="草稿">草稿</Option>
              <Option value="待审批">待审批</Option>
              <Option value="一审中">一审中</Option>
              <Option value="一审通过">一审通过</Option>
              <Option value="已审批">已审批</Option>
              <Option value="已驳回">已驳回</Option>
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

      <Modal title="新增成本预算" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑成本预算" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="成本预算详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('类别', descText(currentItem.category)),
            descItem('预算金额', <span style={{ fontWeight: 600 }}>{formatCurrency(currentItem.budgetAmount)}</span>),
            descItem('审批金额', <span style={{ color: '#52c41a', fontWeight: 600 }}>{formatCurrency(currentItem.approvedAmount)}</span>),
            descItem('周期开始', descText(currentItem.periodStart)),
            descItem('周期结束', descText(currentItem.periodEnd)),
            descItem('状态', <Tag color={budgetStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
          ].filter(Boolean) as any[]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          items.push(descItem('审批记录', <ReviewTimeline records={getApprovalRecords(currentItem, approvalMap, 'PROJECT')} status={currentItem.status} levels={APPROVAL_CHAINS.PROJECT.levels} />))
          return items
        })()}
      />

      <ReviewModal
        open={isReviewModalVisible}
        title="发起审批"
        onClose={handleCancel}
        onSubmit={handleReviewSubmit}
        reviewerOptions={APPROVAL_CHAINS.PROJECT.reviewerOptions}
        okText="提交审批"
      
        currentUser={currentUser.name}
      />
    </div>
  )
}

export default BudgetPanel
