import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import initialData from '../../data/acceptanceReports'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { AcceptanceReportItem, ACCheckType, ACReportStatus, ACResult, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select
const { TextArea } = Input

const reportStatusColor = (status: string): string => {
  switch (status) {
    case '草稿':
      return 'default'
    case '待审批':
      return 'gold'
    case '一审中':
      return 'cyan'
    case '一审通过':
      return 'blue'
    case '已发布':
      return 'green'
    case '已驳回':
      return 'volcano'
    default:
      return 'gray'
  }
}

const resultColor = (result: string): string => {
  switch (result) {
    case '合格':
      return 'green'
    case '不合格':
      return 'red'
    case '有条件合格':
      return 'orange'
    case '待复查':
      return 'gold'
    default:
      return 'gray'
  }
}

const typeOptions: ACCheckType[] = ['分项验收', '分部验收', '单位工程验收', '专项验收', '竣工验收']
const statusOptions: ACReportStatus[] = ['草稿', '待审批', '一审中', '一审通过', '已发布', '已驳回']
const resultOptions: ACResult[] = ['合格', '不合格', '有条件合格', '待复查']

const ReportPanel: React.FC = () => {
  const [list, setList] = usePersistedState<ACReportItem[]>('accept-report', initialData)
  const { currentUser } = useUser()
const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('acceptanceFiling-reportPage-approval', {})
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<AcceptanceReportItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      onCell: (record: AcceptanceReportItem) => ({
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
      onCell: (record: AcceptanceReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: AcceptanceReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (t: string) => <Tag>{t}</Tag>,
      onCell: (record: AcceptanceReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '报告日期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 110,
      onCell: (record: AcceptanceReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '编制人',
      dataIndex: 'author',
      key: 'author',
      width: 100,
      onCell: (record: AcceptanceReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (r: ACResult) => <Tag color={resultColor(r)}>{r}</Tag>,
      onCell: (record: AcceptanceReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: ACReportStatus) => <Tag color={reportStatusColor(s)}>{s}</Tag>,
      onCell: (record: AcceptanceReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: AcceptanceReportItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {(record.status === '待审批' || record.status === '草稿') && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>{record.status === '审批中' ? '审批' : '发起审批'}</Button>
          )}
          <Popconfirm
            title="确定删除此验收报告？"
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

  const handleView = (record: AcceptanceReportItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: AcceptanceReportItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      reportDate: record.reportDate ? dayjs(record.reportDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
  }

  const handleReview = (record: AcceptanceReportItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): AcceptanceReportItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    type: values.type as ACCheckType,
    reportDate: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : '',
    author: values.author || '',
    summary: values.summary || '',
    issues: values.issues || '',
    suggestions: values.suggestions || '',
    result: values.result as ACResult,
    status: values.status as ACReportStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: AcceptanceReportItem = normalize(values, Date.now().toString(), [])
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
            item.title.toLowerCase().includes(kw) ||
            item.author.toLowerCase().includes(kw)
          )
        }
        if (values.projectCode) {
          match = match && item.projectCode === values.projectCode
        }
        if (values.status) {
          match = match && item.status === values.status
        }
        if (values.type) {
          match = match && item.type === values.type
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
    addForm.resetFields()
    editForm.resetFields()
    setCurrentItem(null)
  }

  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string }) => {
    if (!currentItem) return
    const key = currentItem.key
    const existingRecords = approvalMap[key] || []
    const nextLevel = existingRecords.length + 1
    const chain = APPROVAL_CHAINS.PROJECT
    const isLast = nextLevel >= chain.levels.length
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
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '已驳回' as ACReportStatus } : item); return r })
      message.success('已驳回')
    } else {
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: (isLast ? '已发布' : '审批中') as ACReportStatus } : item); return r })
      message.success(isLast ? '审批已通过' : '审批已提交至下一级')
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ type: '专项验收' as ACCheckType, status: '待审批' as ACReportStatus, result: '合格' as ACResult }}>
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
        <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择类型">
            {typeOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="reportDate" label="报告日期" rules={[{ required: true, message: '请选择日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="author" label="编制人" rules={[{ required: true, message: '请输入编制人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入编制人" />
        </Form.Item>
      </div>
      <Form.Item name="summary" label="摘要">
        <TextArea rows={2} placeholder="请输入报告摘要" />
      </Form.Item>
      <Form.Item name="issues" label="问题说明">
        <TextArea rows={2} placeholder="请输入问题说明" />
      </Form.Item>
      <Form.Item name="suggestions" label="建议">
        <TextArea rows={2} placeholder="请输入建议" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="result" label="结果" rules={[{ required: true, message: '请选择结果' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择结果">
            {resultOptions.map(r => <Option key={r} value={r}>{r}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>
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
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>验收报告管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增</Button>
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
            <Select placeholder="类型" style={{ width: 130 }} allowClear>
              {typeOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/编制人）" prefix={<SearchOutlined />} style={{ width: 260 }} />
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
          scroll={{ x: 1600 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增验收报告" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑验收报告" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="验收报告详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('类型', descText(currentItem.type)),
            descItem('报告日期', descText(currentItem.reportDate)),
            descItem('编制人', descText(currentItem.author)),
            descItem('摘要', descText(currentItem.summary)),
            descItem('问题说明', descText(currentItem.issues)),
            descItem('建议', descText(currentItem.suggestions)),
            descItem('结果', <Tag color={resultColor(currentItem.result)}>{currentItem.result}</Tag>),
            descItem('状态', <Tag color={reportStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
          ].filter(Boolean) as any[]
          items.push(descItem('附件清单', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          items.push(descItem('审批记录', <ReviewTimeline records={getApprovalRecords(currentItem, approvalMap, 'PROJECT')} status={currentItem.status} levels={APPROVAL_CHAINS.PROJECT.levels} />))
          return items
        })()}
      />

      <ReviewModal
        open={isReviewModalVisible}
        title="发起审批"
        onClose={handleCancel}
        onSubmit={handleReviewSubmit}
        okText="提交审批"
      
        currentUser={currentUser.name}
      />
    </div>
  )
}

export default ReportPanel
