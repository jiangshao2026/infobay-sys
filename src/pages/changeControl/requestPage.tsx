import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import { usePersistedState, getPersistedData } from '../../hooks/usePersistedState'
import { useCrossModuleData } from '../../context/CrossModuleDataContext'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
import initialData, { initialRequestApprovalMap } from '../../data/changeRequests'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { ChangeRequestItem, CRType, CRStatus, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'
import { formatCurrency } from '../../utils/format'

const { Option } = Select
const { TextArea } = Input

const changeStatusColor = (status: string): string => {
  switch (status) {
    case '草稿':
      return 'default'
    case '待审批':
      return 'gold'
    case '一审通过':
      return 'cyan'
    case '已审批':
      return 'green'
    case '已驳回':
      return 'volcano'
    case '已执行':
      return 'lime'
    default:
      return 'gray'
  }
}

const priorityColor = (priority: string): string => {
  switch (priority) {
    case '高':
      return 'red'
    case '中':
      return 'orange'
    case '低':
      return 'green'
    default:
      return 'gray'
  }
}


interface RequestPageProps {}

const RequestPanel: React.FC<RequestPageProps> = () => {
  const { changeRequestList: list, setChangeRequestList: setList } = useCrossModuleData()
  const { currentUser } = useUser()
const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('changeControl-requestPage-approval', initialRequestApprovalMap)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ChangeRequestItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: ChangeRequestItem) => ({
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
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 90,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '申请日期',
      dataIndex: 'applyDate',
      key: 'applyDate',
      width: 110,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '变更类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '影响工期(天)',
      dataIndex: 'impactScheduleDays',
      key: 'impactScheduleDays',
      width: 110,
      render: (v: number) => <span style={{ fontWeight: 600, color: v > 0 ? '#f5222d' : '#1890ff' }}>{v > 0 ? `+${v}` : v}</span>,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '影响金额',
      dataIndex: 'impactCost',
      key: 'impactCost',
      width: 130,
      render: (v: number) => <span style={{ fontWeight: 600, color: v > 0 ? '#f5222d' : '#52c41a' }}>{formatCurrency(v)}</span>,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (v: string) => <Tag color={priorityColor(v)}>{v}</Tag>,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '当前审批级别',
      dataIndex: 'currentLevel',
      key: 'currentLevel',
      width: 110,
      render: (v: number) => v > 0 ? `第${v}级` : '未启动',
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CRStatus) => <Tag color={changeStatusColor(status)}>{status}</Tag>,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: ChangeRequestItem) => (
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
            title="确定删除此变更申请？"
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

  const handleView = (record: ChangeRequestItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: ChangeRequestItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      impactScope: record.impactScope || [],
      applyDate: record.applyDate ? dayjs(record.applyDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const deletedItem = list.find(item => item.key === key)
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
    if (deletedItem) {
      addAuditLog(currentUser.name, '变更控制', '删除', deletedItem.title, '变更申请', `删除变更申请：${deletedItem.code}`)
    }
  }

  const handleReview = (record: ChangeRequestItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): ChangeRequestItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    description: values.description || '',
    reason: values.reason || '',
    applicant: values.applicant,
    applyDate: values.applyDate ? values.applyDate.format('YYYY-MM-DD') : '',
    type: values.type as CRType,
    impactScope: values.impactScope || [],
    impactScheduleDays: Number(values.impactScheduleDays) || 0,
    impactCost: Number(values.impactCost) || 0,
    priority: values.priority as '高' | '中' | '低',
    status: values.status as CRStatus,
    attachments: values.attachments || existingAttachments,
    currentLevel: values.status === '草稿' ? 0 : values.status === '待审批' ? 0 : 1,
  })


  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: ChangeRequestItem = normalize(values, Date.now().toString(), [])
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
      addAuditLog(currentUser.name, '变更控制', '新增', values.title, '变更申请', `新增变更申请：${values.code}`)
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
        addAuditLog(currentUser.name, '变更控制', '编辑', currentItem.title, '变更申请', `编辑变更申请：${currentItem.code}`)
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
            item.applicant.toLowerCase().includes(kw)
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
    setList(getPersistedData<ChangeRequestItem[]>('change-request') ?? list)
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
    const nextLevel = currentItem.status === '一审通过' ? 2 : (existingRecords.length + 1)

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
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '待审批' as CRStatus } : item); return r })
      message.success('已驳回，返回待审批')
      addAuditLog(currentUser.name, '变更控制', '审批', currentItem.title, '变更申请', `驳回变更申请：${currentItem.code}`)
    } else {
      const newStatus: CRStatus = currentItem.status === '待审批' ? '一审通过' : '已审批'
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: newStatus, currentLevel: nextLevel } : item); return r })
      message.success(newStatus === '已审批' ? '终审已通过' : '一审通过，等待总监理工程师终审')
      addAuditLog(currentUser.name, '变更控制', '审批', currentItem.title, '变更申请', `${newStatus === '已审批' ? '终审通过' : '一审通过'}变更申请：${currentItem.code}`)
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ type: '范围变更' as CRType, priority: '中', status: '草稿' as CRStatus, impactScope: ['范围'] }}>
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
        <Input placeholder="请输入变更标题" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="applicant" label="申请人" rules={[{ required: true, message: '请输入申请人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入申请人" />
        </Form.Item>
        <Form.Item name="applyDate" label="申请日期" rules={[{ required: true, message: '请选择日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="type" label="变更类型" rules={[{ required: true, message: '请选择类型' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择类型">
            <Option value="范围变更">范围变更</Option>
            <Option value="技术变更">技术变更</Option>
            <Option value="进度变更">进度变更</Option>
            <Option value="成本变更">成本变更</Option>
            <Option value="其他">其他</Option>
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="impactScheduleDays" label="影响工期(天)" rules={[{ required: true, message: '请输入影响工期' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入影响工期天数" />
        </Form.Item>
        <Form.Item name="impactCost" label="影响金额(元)" rules={[{ required: true, message: '请输入影响金额' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入影响金额（单位：元）" />
        </Form.Item>
        <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择优先级">
            <Option value="高">高</Option>
            <Option value="中">中</Option>
            <Option value="低">低</Option>
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="impactScope" label="影响范围（多选）">
        <Select mode="multiple" placeholder="请选择影响范围">
          <Option value="范围">范围</Option>
          <Option value="成本">成本</Option>
          <Option value="进度">进度</Option>
          <Option value="质量">质量</Option>
          <Option value="风险">风险</Option>
        </Select>
      </Form.Item>
      <Form.Item name="description" label="变更描述">
        <TextArea rows={3} placeholder="请详细描述变更内容" />
      </Form.Item>
      <Form.Item name="reason" label="变更原因">
        <TextArea rows={3} placeholder="请说明变更原因和背景" />
      </Form.Item>
      <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
        <Select placeholder="请选择状态">
          <Option value="草稿">草稿</Option>
          <Option value="待审批">待审批</Option>
          <Option value="一审通过">一审通过</Option>
          <Option value="已审批">已审批</Option>
          <Option value="已驳回">已驳回</Option>
          <Option value="已执行">已执行</Option>
        </Select>
      </Form.Item>
      <Form.Item name="attachments" label="附件">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>变更申请管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增申请</Button>
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
              <Option value="待审批">待审批</Option>
              <Option value="一审通过">一审通过</Option>
              <Option value="已审批">已审批</Option>
              <Option value="已驳回">已驳回</Option>
              <Option value="已执行">已执行</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/申请人）" prefix={<SearchOutlined />} style={{ width: 280 }} />
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
          scroll={{ x: 2000 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增变更申请" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑变更申请" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="变更申请详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('变更类型', descText(currentItem.type)),
            descItem('申请人', descText(currentItem.applicant)),
            descItem('申请日期', descText(currentItem.applyDate)),
            descItem('优先级', <Tag color={priorityColor(currentItem.priority)}>{currentItem.priority}</Tag>),
            descItem('影响工期', <span style={{ fontWeight: 600, color: currentItem.impactScheduleDays > 0 ? '#f5222d' : '#1890ff' }}>{currentItem.impactScheduleDays > 0 ? `+${currentItem.impactScheduleDays}` : currentItem.impactScheduleDays} 天</span>),
            descItem('影响金额', <span style={{ fontWeight: 600, color: currentItem.impactCost > 0 ? '#f5222d' : '#52c41a' }}>{formatCurrency(currentItem.impactCost)}</span>),
            currentItem.impactScope && currentItem.impactScope.length > 0
              ? descItem('影响范围', currentItem.impactScope.map((s, i) => <Tag key={i} style={{ marginRight: 4 }}>{s}</Tag>))
              : null,
            descItem('当前审批级别', descText(currentItem.currentLevel > 0 ? `第${currentItem.currentLevel}级` : '未启动')),
            descItem('状态', <Tag color={changeStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.description ? descItem('变更描述', descText(currentItem.description)) : null,
            currentItem.reason ? descItem('变更原因', descText(currentItem.reason)) : null,
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

export default RequestPanel
