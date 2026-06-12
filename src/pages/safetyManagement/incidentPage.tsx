import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/safetyIncidents'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import { formatCurrency } from '../../utils/format'
import type { SafetyIncidentItem, SFIncidentLevel, SFIncidentStatus, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select
const { TextArea } = Input

const incidentStatusColor = (status: string): string => {
  switch (status) {
    case '待处理':
      return 'gold'
    case '处理中':
      return 'blue'
    case '已处理':
      return 'green'
    case '待审批':
      return 'orange'
    case '已归档':
      return 'purple'
    default:
      return 'gray'
  }
}

const incidentLevelColor = (level: string): string => {
  switch (level) {
    case '一般事故':
      return 'blue'
    case '较大事故':
      return 'orange'
    case '重大事故':
      return 'red'
    default:
      return 'gray'
  }
}

const IncidentPanel: React.FC = () => {
  const [list, setList] = useState<SafetyIncidentItem[]>(initialData)
  const [approvalMap, setApprovalMap] = useState<Record<string, ApprovalRecord[]>>({})
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<SafetyIncidentItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 260,
      render: (code: string) => descText(getProjectNameByCode(code)),
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '事故日期',
      dataIndex: 'incidentDate',
      key: 'incidentDate',
      width: 110,
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '事故地点',
      dataIndex: 'location',
      key: 'location',
      width: 200,
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '事故级别',
      dataIndex: 'level',
      key: 'level',
      width: 110,
      render: (level: SFIncidentLevel) => <Tag color={incidentLevelColor(level)}>{level}</Tag>,
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '伤亡人数',
      dataIndex: 'casualties',
      key: 'casualties',
      width: 100,
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '经济损失',
      dataIndex: 'economicLoss',
      key: 'economicLoss',
      width: 130,
      render: (loss: number) => formatCurrency(loss),
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SFIncidentStatus) => <Tag color={incidentStatusColor(status)}>{status}</Tag>,
      onCell: (record: SafetyIncidentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: SafetyIncidentItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.status !== '已归档' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>发起审批</Button>
          )}
          <Popconfirm
            title="确定删除此安全事故记录？"
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

  const handleView = (record: SafetyIncidentItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: SafetyIncidentItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      incidentDate: record.incidentDate ? dayjs(record.incidentDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => prev.filter(item => item.key !== key))
    message.success('删除成功')
  }

  const handleReview = (record: SafetyIncidentItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): SafetyIncidentItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    description: values.description || '',
    incidentDate: values.incidentDate ? values.incidentDate.format('YYYY-MM-DD') : '',
    location: values.location || '',
    level: values.level as SFIncidentLevel,
    casualties: values.casualties || '无',
    economicLoss: values.economicLoss || 0,
    handler: values.handler,
    rootCause: values.rootCause || '',
    correctiveActions: values.correctiveActions || '',
    status: values.status as SFIncidentStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: SafetyIncidentItem = normalize(values, Date.now().toString(), [])
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
            item.handler.toLowerCase().includes(kw)
          )
        }
        if (values.projectCode) {
          match = match && item.projectCode === values.projectCode
        }
        if (values.status) {
          match = match && item.status === values.status
        }
        if (values.level) {
          match = match && item.level === values.level
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

  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string}) => {
    if (!currentItem) return
    const key = currentItem.key
    const existingRecords = approvalMap[key] || []
    const nextLevel = existingRecords.length + 1
    const newRecord: ApprovalRecord = {
      key: `${key}-${nextLevel}`,
      code: `${currentItem.code}-R${nextLevel}`,
      level: nextLevel,
      reviewer: payload.reviewer,
      comment: payload.comment,
      status: payload.status,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
    setApprovalMap(prev => ({ ...prev, [key]: [...existingRecords, newRecord] }))

    if (payload.status === '驳回') {
      setList(prev => prev.map(item => item.key === key ? { ...item, status: '待审批' as SFIncidentStatus } : item))
      message.success('已驳回')
    } else {
      setList(prev => prev.map(item => item.key === key ? { ...item, status: '已归档' as SFIncidentStatus } : item))
      message.success('审批已提交')
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ level: '一般事故' as SFIncidentLevel, status: '待处理' as SFIncidentStatus, casualties: '无', economicLoss: 0 }}>
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
        <Form.Item name="incidentDate" label="事故日期" rules={[{ required: true, message: '请选择事故日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="level" label="事故级别" rules={[{ required: true, message: '请选择事故级别' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择事故级别">
            <Option value="一般事故">一般事故</Option>
            <Option value="较大事故">较大事故</Option>
            <Option value="重大事故">重大事故</Option>
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="location" label="事故地点" rules={[{ required: true, message: '请输入事故地点' }]}>
        <Input placeholder="请输入事故地点" />
      </Form.Item>
      <Form.Item name="description" label="事故描述" rules={[{ required: true, message: '请输入事故描述' }]}>
        <TextArea rows={3} placeholder="请输入事故描述" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="casualties" label="伤亡人数" rules={[{ required: true, message: '请输入伤亡人数' }]} style={{ flex: 1 }}>
          <Input placeholder="如：无 / 轻伤1人" />
        </Form.Item>
        <Form.Item name="economicLoss" label="经济损失（元）" rules={[{ required: true, message: '请输入经济损失' }]} style={{ flex: 1 }}>
          <Input type="number" min={0} placeholder="请输入金额" />
        </Form.Item>
        <Form.Item name="handler" label="处理人" rules={[{ required: true, message: '请输入处理人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入处理人" />
        </Form.Item>
      </div>
      <Form.Item name="rootCause" label="根本原因">
        <TextArea rows={2} placeholder="请输入根本原因" />
      </Form.Item>
      <Form.Item name="correctiveActions" label="整改措施">
        <TextArea rows={2} placeholder="请输入整改措施" />
      </Form.Item>
      <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
        <Select placeholder="请选择状态">
          <Option value="待处理">待处理</Option>
          <Option value="处理中">处理中</Option>
          <Option value="已处理">已处理</Option>
          <Option value="待审批">待审批</Option>
          <Option value="已归档">已归档</Option>
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
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>安全事故管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增事故</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="projectCode">
            <Select placeholder="项目" style={{ width: 220 }} allowClear showSearch optionFilterProp="children">
              {projectOptions}
            </Select>
          </Form.Item>
          <Form.Item name="level">
            <Select placeholder="事故级别" style={{ width: 130 }} allowClear>
              <Option value="一般事故">一般事故</Option>
              <Option value="较大事故">较大事故</Option>
              <Option value="重大事故">重大事故</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="待处理">待处理</Option>
              <Option value="处理中">处理中</Option>
              <Option value="已处理">已处理</Option>
              <Option value="待审批">待审批</Option>
              <Option value="已归档">已归档</Option>
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
          scroll={{ x: 1800 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增安全事故" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑安全事故" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="安全事故详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('事故日期', descText(currentItem.incidentDate)),
            descItem('事故地点', descText(currentItem.location)),
            descItem('事故级别', <Tag color={incidentLevelColor(currentItem.level)}>{currentItem.level}</Tag>),
            descItem('事故描述', descText(currentItem.description)),
            descItem('伤亡人数', descText(currentItem.casualties)),
            descItem('经济损失', descText(formatCurrency(currentItem.economicLoss))),
            descItem('处理人', descText(currentItem.handler)),
            descItem('状态', <Tag color={incidentStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.rootCause ? descItem('根本原因', descText(currentItem.rootCause)) : null,
            currentItem.correctiveActions ? descItem('整改措施', descText(currentItem.correctiveActions)) : null,
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

export default IncidentPanel
