import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialCheckData, { initialCheckApprovalMap } from '../../data/qualityChecks'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { QualityCheckItem, QCLevel, QCCheckStatus, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, descTag, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
import { usePersistedState } from '../../hooks/usePersistedState'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select
const { TextArea } = Input

const levelColor = (level: string): string => {
  switch (level) {
    case '严重':
      return 'red'
    case '较严重':
      return 'orange'
    case '一般':
      return 'blue'
    default:
      return 'gray'
  }
}

const checkStatusColor = (status: string): string => {
  switch (status) {
    case '待审批':
      return 'gold'
    case '一审通过':
      return 'cyan'
    case '已审批':
      return 'green'
    case '已驳回':
      return 'volcano'
    default:
      return 'gray'
  }
}

interface CheckPageProps {}

const CheckPanel: React.FC<CheckPageProps> = () => {
  const [list, setList] = usePersistedState<QualityCheckItem[]>('quality-check', initialCheckData)
  const { currentUser } = useUser()
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('qualityControl-checkPage-approval', initialCheckApprovalMap)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<QualityCheckItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      onCell: (record: QualityCheckItem) => ({
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
      onCell: (record: QualityCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '检查日期',
      dataIndex: 'checkDate',
      key: 'checkDate',
      width: 110,
      onCell: (record: QualityCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '检查地点',
      dataIndex: 'location',
      key: 'location',
      width: 220,
      onCell: (record: QualityCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (level: QCLevel) => descTag(level, levelColor),
      onCell: (record: QualityCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '检查人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 100,
      onCell: (record: QualityCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: QCCheckStatus) => <Tag color={checkStatusColor(status)}>{status}</Tag>,
      onCell: (record: QualityCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: QualityCheckItem) => (
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
            title="确定删除此质量检查记录？"
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

  const handleView = (record: QualityCheckItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: QualityCheckItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      items: record.items?.join('\n') || '',
      issues: record.issues?.join('\n') || '',
      checkDate: record.checkDate ? dayjs(record.checkDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const item = list.find(i => i.key === key)
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
    if (item) addAuditLog(currentUser.name, '质量控制', '删除', item.title || item.code, '质量检查', `删除质量检查记录：${item.code}`)
  }

  const handleReview = (record: QualityCheckItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): QualityCheckItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    checkDate: values.checkDate ? values.checkDate.format('YYYY-MM-DD') : '',
    location: values.location,
    items: values.items ? String(values.items).split(/\r?\n/).filter(Boolean) : [],
    issues: values.issues ? String(values.issues).split(/\r?\n/).filter(Boolean) : [],
    level: values.level,
    reviewer: values.reviewer,
    status: values.status,
    comments: values.comments || '',
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: QualityCheckItem = normalize(values, Date.now().toString(), [])
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
      addAuditLog(currentUser.name, '质量控制', '新增', values.title || values.code, '质量检查', `新增质量检查记录：${values.code}`)
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
        addAuditLog(currentUser.name, '质量控制', '编辑', currentItem.title || currentItem.code, '质量检查', `编辑质量检查记录：${currentItem.code}`)
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
            item.location.toLowerCase().includes(kw)
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
    setList(getPersistedData<QualityCheckItem[]>('quality-check') ?? list)
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
    const nextLevel = existingRecords.length + 1
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
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '待审批' as QCCheckStatus } : item); return r })
      message.success('已驳回，返回待审批')
      addAuditLog(currentUser.name, '质量控制', '审批', currentItem.title || currentItem.code, '质量检查', `驳回质量检查记录：${currentItem.code}`)
    } else {
      const newStatus: QCCheckStatus = currentItem.status === '待审批' ? '一审通过' : '已审批'
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: newStatus } : item); return r })
      message.success(newStatus === '已审批' ? '终审已通过' : '一审通过，等待总监理工程师终审')
      addAuditLog(currentUser.name, '质量控制', '审批', currentItem.title || currentItem.code, '质量检查', `审批通过质量检查记录：${currentItem.code}，状态：${newStatus}`)
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ level: '一般' as QCLevel, status: '待审批' as QCCheckStatus }}>
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
      <Form.Item name="title" label="标题/检查内容" rules={[{ required: true, message: '请输入标题' }]}>
        <Input placeholder="请输入标题" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="checkDate" label="检查日期" rules={[{ required: true, message: '请选择检查日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="location" label="检查地点" rules={[{ required: true, message: '请输入检查地点' }]} style={{ flex: 2 }}>
          <Input placeholder="请输入检查地点" />
        </Form.Item>
      </div>
      <Form.Item name="items" label="检查项（每行一项）">
        <TextArea rows={3} placeholder="每行一项，例如：登录鉴权符合要求" />
      </Form.Item>
      <Form.Item name="issues" label="发现问题（每行一项）">
        <TextArea rows={3} placeholder="每行一项，若无问题可留空" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="level" label="问题级别" rules={[{ required: true, message: '请选择级别' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择级别">
            <Option value="一般">一般</Option>
            <Option value="较严重">较严重</Option>
            <Option value="严重">严重</Option>
          </Select>
        </Form.Item>
        <Form.Item name="reviewer" label="检查人" rules={[{ required: true, message: '请输入检查人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入检查人" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            <Option value="待审批">待审批</Option>
            <Option value="一审通过">一审通过</Option>
            <Option value="已审批">已审批</Option>
            <Option value="已驳回">已驳回</Option>
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="comments" label="备注/检查结论">
        <TextArea rows={2} placeholder="请输入检查结论或备注" />
      </Form.Item>
      <Form.Item name="attachments" label="附件">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>质量检查记录</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增检查记录</Button>
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
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/地点）" prefix={<SearchOutlined />} style={{ width: 240 }} />
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
          scroll={{ x: 1400 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增质量检查记录" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑质量检查记录" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="质量检查详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('检查日期', descText(currentItem.checkDate)),
            descItem('检查地点', descText(currentItem.location)),
            descItem('级别', <Tag color={levelColor(currentItem.level)}>{currentItem.level}</Tag>),
            descItem('检查人', descText(currentItem.reviewer)),
            descItem('状态', <Tag color={checkStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.items && currentItem.items.length > 0
              ? descItem('检查项', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.items.map((t, i) => <li key={i}>{t}</li>)}</ul>)
              : null,
            currentItem.issues && currentItem.issues.length > 0
              ? descItem('发现问题', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.issues.map((t, i) => <li key={i}>{t}</li>)}</ul>)
              : null,
            currentItem.comments ? descItem('检查结论', descText(currentItem.comments)) : null,
          ].filter(Boolean) as any[]
          // 附件列表（独立 section）
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          // 审批时间线
          items.push(descItem('审批记录', <ReviewTimeline records={getApprovalRecords(currentItem, approvalMap, 'PROJECT')} status={currentItem.status} levels={APPROVAL_CHAINS.PROJECT.levels} />))
          return items
        })()}
      />

      <ReviewModal
        open={isReviewModalVisible}
        title="审批"
        onClose={handleCancel}
        onSubmit={handleReviewSubmit}
        reviewerOptions={APPROVAL_CHAINS.PROJECT.reviewerOptions}
        okText="提交审批"
        currentUser={currentUser.name}
      />
    </div>
  )
}

export default CheckPanel
