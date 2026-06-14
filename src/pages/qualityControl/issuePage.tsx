import { Card, Table, Button, Space, Input, Select, Modal, Form, message, Popconfirm, Tag, DatePicker } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialIssueData from '../../data/qualityIssues'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { QualityIssueItem, QCIssueLevel, QCIssueStatus, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly, issueLevelColor, issueStatusColor } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select
const { TextArea } = Input

const issueStatusNext = (status: QCIssueStatus): QCIssueStatus => {
  const flow: QCIssueStatus[] = ['待整改', '整改中', '待复查', '已完成']
  const idx = flow.indexOf(status)
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : status
}

const IssuePanel: React.FC = () => {
  const [list, setList] = useState<QualityIssueItem[]>(initialIssueData)
const [approvalMap, setApprovalMap] = useState<Record<string, ApprovalRecord[]>>({})
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [isCheckupModalVisible, setIsCheckupModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<QualityIssueItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [checkupForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      onCell: (record: QualityIssueItem) => ({
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
      onCell: (record: QualityIssueItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      onCell: (record: QualityIssueItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '问题级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: QCIssueLevel) => <Tag color={issueLevelColor(level)}>{level}</Tag>,
      onCell: (record: QualityIssueItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '发现日期',
      dataIndex: 'discoverDate',
      key: 'discoverDate',
      width: 110,
      onCell: (record: QualityIssueItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '整改期限',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 110,
      onCell: (record: QualityIssueItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '责任人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      onCell: (record: QualityIssueItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: QCIssueStatus) => <Tag color={issueStatusColor(status)}>{status}</Tag>,
      onCell: (record: QualityIssueItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: unknown, record: QualityIssueItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.status !== '已完成' && (
            <Button type="link" icon={<PlayCircleOutlined />} size="small" onClick={() => handleCheckup(record)}>发起复查</Button>
          )}
          {(record.status === '待整改' || record.status === '整改中' || record.status === '待复查' || record.status === '已驳回') && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
          )}
          <Popconfirm
            title="确定删除此问题整改单？"
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

  const handleView = (record: QualityIssueItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: QualityIssueItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      discoverDate: record.discoverDate ? dayjs(record.discoverDate) : null,
      deadline: record.deadline ? dayjs(record.deadline) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
  }

  const handleCheckup = (record: QualityIssueItem) => {
    setCurrentItem(record)
    checkupForm.resetFields()
    setIsCheckupModalVisible(true)
  }

  const handleReview = (record: QualityIssueItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): QualityIssueItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || values.description?.slice(0, 20) || '',
    description: values.description,
    location: values.location || '',
    level: values.level,
    discoverDate: values.discoverDate ? values.discoverDate.format('YYYY-MM-DD') : '',
    deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : '',
    handler: values.handler,
    status: values.status,
    corrective: values.corrective || '',
    reviewer: values.reviewer || '管理员',
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: QualityIssueItem = normalize(values, Date.now().toString(), [])
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

  const handleCheckupOk = () => {
    checkupForm.validateFields().then(values => {
      if (currentItem) {
        const next = values.status || issueStatusNext(currentItem.status)
        setList(prev => { const r = prev.map(item =>
          item.key === currentItem.key ? { ...item, status: next, corrective: values.corrective || item.corrective } : item
        ); return r })
        setIsCheckupModalVisible(false)
        checkupForm.resetFields()
        setCurrentItem(null)
        message.success('复查操作已提交')
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
            item.description.toLowerCase().includes(kw)
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
    setIsReviewModalVisible(false)
    setIsCheckupModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    checkupForm.resetFields()
    setCurrentItem(null)
  }

  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string }) => {
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
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '已驳回' as QCIssueStatus } : item); return r })
      message.success('已驳回')
    } else {
      const next = issueStatusNext(currentItem.status)
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: next } : item); return r })
      message.success('审批已提交')
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ level: '一般' as QCIssueLevel, status: '待整改' as QCIssueStatus }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入编号" />
        </Form.Item>
        <Form.Item name="projectCode" label="项目" rules={[{ required: true, message: '请选择项目' }]} style={{ flex: 2 }}>
          <Select placeholder="请选择项目" showSearch optionFilterProp="children">
            {projectOptions}
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="description" label="问题描述" rules={[{ required: true, message: '请输入问题描述' }]}>
        <TextArea rows={3} placeholder="请输入问题描述" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="location" label="问题位置" style={{ flex: 2 }}>
          <Input placeholder="请输入问题位置" />
        </Form.Item>
        <Form.Item name="level" label="问题级别" rules={[{ required: true, message: '请选择级别' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择级别">
            <Option value="轻微">轻微</Option>
            <Option value="一般">一般</Option>
            <Option value="较严重">较严重</Option>
            <Option value="严重">严重</Option>
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="discoverDate" label="发现日期" rules={[{ required: true, message: '请选择发现日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="deadline" label="整改期限" rules={[{ required: true, message: '请选择整改期限' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="handler" label="责任人" rules={[{ required: true, message: '请输入责任人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入责任人" />
        </Form.Item>
        <Form.Item name="reviewer" label="复查人" style={{ flex: 1 }}>
          <Input placeholder="请输入复查人" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            <Option value="待整改">待整改</Option>
            <Option value="整改中">整改中</Option>
            <Option value="待复查">待复查</Option>
            <Option value="已完成">已完成</Option>
            <Option value="已驳回">已驳回</Option>
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="corrective" label="整改措施">
        <TextArea rows={3} placeholder="请输入整改措施" />
      </Form.Item>
      <Form.Item name="attachments" label="附件">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>问题整改单</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增整改单</Button>
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
              <Option value="待整改">待整改</Option>
              <Option value="整改中">整改中</Option>
              <Option value="待复查">待复查</Option>
              <Option value="已完成">已完成</Option>
              <Option value="已驳回">已驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/描述）" prefix={<SearchOutlined />} style={{ width: 240 }} />
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
          scroll={{ x: 1500 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增问题整改单" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑问题整改单" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <Modal
        title="发起复查 / 状态推进"
        open={isCheckupModalVisible}
        forceRender
        onOk={handleCheckupOk}
        onCancel={handleCancel}
        width={560}
        okText="提交"
        cancelText="取消"
      >
        <Form form={checkupForm} layout="vertical" initialValues={{ status: currentItem ? issueStatusNext(currentItem.status) : ('整改中' as QCIssueStatus) }}>
          <Form.Item label="当前整改单">
            <div style={{ color: '#555' }}>
              编号：{currentItem?.code} / 责任人：{currentItem?.handler} / 当前状态：{currentItem?.status}
            </div>
          </Form.Item>
          <Form.Item name="status" label="推进至状态" rules={[{ required: true, message: '请选择新状态' }]}>
            <Select placeholder="请选择新状态">
              <Option value="整改中">整改中</Option>
              <Option value="待复查">待复查</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="corrective" label="整改/复查结论">
            <TextArea rows={4} placeholder="请填写最新整改或复查结论" />
          </Form.Item>
        </Form>
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="问题整改单详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('问题描述', descText(currentItem.description)),
            descItem('问题位置', descText(currentItem.location)),
            descItem('问题级别', <Tag color={issueLevelColor(currentItem.level)}>{currentItem.level}</Tag>),
            descItem('发现日期', descText(currentItem.discoverDate)),
            descItem('整改期限', descText(currentItem.deadline)),
            descItem('责任人', descText(currentItem.handler)),
            descItem('复查人', descText(currentItem.reviewer)),
            descItem('状态', <Tag color={issueStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.corrective ? descItem('整改措施', descText(currentItem.corrective)) : null,
          ].filter(Boolean) as any[]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          items.push(descItem('审批记录', <ReviewTimeline records={getApprovalRecords(currentItem, approvalMap, 'PROJECT')} status={currentItem.status} levels={APPROVAL_CHAINS.PROJECT.levels} />))
          return items
        })()}
      />

      <ReviewModal
        open={isReviewModalVisible}
        title="审批操作"
        onClose={handleCancel}
        onSubmit={handleReviewSubmit}
        reviewerOptions={APPROVAL_CHAINS.PROJECT.reviewerOptions}
        okText="提交审批"
      />
    </div>
  )
}

export default IssuePanel
