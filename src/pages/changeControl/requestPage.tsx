import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/changeRequests'
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
    case '待一审':
      return 'gold'
    case '一审中':
      return 'cyan'
    case '一审通过':
      return 'blue'
    case '待二审':
      return 'purple'
    case '二审中':
      return 'magenta'
    case '二审通过':
      return 'geekblue'
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

const nextStatusMap: Record<string, CRStatus> = {
  '草稿': '待一审',
  '待一审': '一审中',
  '一审中': '一审通过',
  '一审通过': '待二审',
  '待二审': '二审中',
  '二审中': '二审通过',
  '二审通过': '已审批',
}

interface RequestPageProps {}

const RequestPanel: React.FC<RequestPageProps> = () => {
  const [list, setList] = useState<ChangeRequestItem[]>(initialData)
  const [approvalMap, setApprovalMap] = useState<Record<string, ApprovalRecord[]>>({})
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
          {record.status !== '已审批' && record.status !== '已执行' && record.status !== '已驳回' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>发起审批</Button>
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
    setList(prev => prev.filter(item => item.key !== key))
    message.success('删除成功')
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
    currentLevel: values.status === '草稿' ? 0 : getLevelFromStatus(values.status),
  })

  const getLevelFromStatus = (status: string): number => {
    const levelMap: Record<string, number> = {
      '待一审': 1,
      '一审中': 1,
      '一审通过': 1,
      '待二审': 2,
      '二审中': 2,
      '二审通过': 2,
      '已审批': 3,
      '已驳回': 1,
      '已执行': 3,
    }
    return levelMap[status] || 0
  }

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: ChangeRequestItem = normalize(values, Date.now().toString(), [])
      setList(prev => [newItem, ...prev])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentItem) {
        setList(prev => prev.map(item =>
          item.key === currentItem.key ? normalize(values, currentItem.key, currentItem.attachments) : item
        ))
        setIsEditModalVisible(false)
        editForm.resetFields()
        setCurrentItem(null)
        message.success('修改成功')
      }
    })
  }

  const handleSearch = () => {
    searchForm.validateFields().then(values => {
      let filtered = initialData.filter(item => {
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
    setList(initialData)
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
    const currentLevel = currentItem.currentLevel || getLevelFromStatus(currentItem.status)
    const newRecord: ApprovalRecord = {
      key: `${key}-${currentLevel}`,
      code: `${currentItem.code}-R${currentLevel}`,
      level: currentLevel,
      reviewer: payload.reviewer,
      comment: payload.comment,
      status: payload.status,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
    setApprovalMap(prev => ({ ...prev, [key]: [...existingRecords, newRecord] }))

    if (payload.status === '驳回') {
      setList(prev => prev.map(item => item.key === key ? { ...item, status: '已驳回' as CRStatus } : item))
      message.success('已驳回')
    } else {
      const nextStatus = nextStatusMap[currentItem.status] || '已审批'
      setList(prev => prev.map(item =>
        item.key === key ? { ...item, status: nextStatus, currentLevel: getLevelFromStatus(nextStatus) } : item
      ))
      message.success('审批已提交')
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
          <Option value="待一审">待一审</Option>
          <Option value="一审中">一审中</Option>
          <Option value="一审通过">一审通过</Option>
          <Option value="待二审">待二审</Option>
          <Option value="二审中">二审中</Option>
          <Option value="二审通过">二审通过</Option>
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
              <Option value="草稿">草稿</Option>
              <Option value="待一审">待一审</Option>
              <Option value="一审中">一审中</Option>
              <Option value="一审通过">一审通过</Option>
              <Option value="待二审">待二审</Option>
              <Option value="二审中">二审中</Option>
              <Option value="二审通过">二审通过</Option>
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
      />
    </div>
  )
}

export default RequestPanel
