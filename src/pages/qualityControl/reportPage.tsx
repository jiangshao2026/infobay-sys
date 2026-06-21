import { Card, Table, Button, Space, Input, Select, Modal, Form, message, Popconfirm, Tag, DatePicker } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialReportData, { initialReportApprovalMap } from '../../data/qualityReports'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { QualityReportItem, QCReportStatus, QCReportType, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
import { usePersistedState, getPersistedData } from '../../hooks/usePersistedState'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select
const { TextArea } = Input

const reportStatusColor = (status: string): string => {
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
    default:
      return 'gray'
  }
}

const reportTypeColor = (type: string): string => {
  switch (type) {
    case '周报':
      return 'blue'
    case '月报':
      return 'purple'
    case '专项报告':
      return 'orange'
    case '阶段报告':
      return 'geekblue'
    default:
      return 'gray'
  }
}



const ReportPanel: React.FC = () => {
  const [list, setList] = usePersistedState<QualityReportItem[]>('quality-report', initialReportData)
  const { currentUser } = useUser()
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('qualityControl-reportPage-approval', initialReportApprovalMap)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<QualityReportItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      onCell: (record: QualityReportItem) => ({
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
      onCell: (record: QualityReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: QualityReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '报告类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: QCReportType) => <Tag color={reportTypeColor(type)}>{type}</Tag>,
      onCell: (record: QualityReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '报告日期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 110,
      onCell: (record: QualityReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '编制人',
      dataIndex: 'author',
      key: 'author',
      width: 100,
      onCell: (record: QualityReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: QCReportStatus) => <Tag color={reportStatusColor(status)}>{status}</Tag>,
      onCell: (record: QualityReportItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: QualityReportItem) => (
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
            title="确定删除此质量报告？"
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

  const handleView = (record: QualityReportItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: QualityReportItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      reportDate: record.reportDate ? dayjs(record.reportDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const deletedItem = list.find(item => item.key === key)
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
    if (deletedItem) {
      addAuditLog(currentUser.name, '质量控制', '删除', deletedItem.title, '质量报告', `删除质量报告：${deletedItem.code}`)
    }
  }

  const handleReview = (record: QualityReportItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): QualityReportItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title,
    type: values.type,
    reportDate: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : '',
    author: values.author,
    summary: values.summary || '',
    status: values.status,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: QualityReportItem = normalize(values, Date.now().toString(), [])
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
      addAuditLog(currentUser.name, '质量控制', '新增', values.title, '质量报告', `新增质量报告：${values.code}`)
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
        addAuditLog(currentUser.name, '质量控制', '编辑', currentItem.title, '质量报告', `编辑质量报告：${currentItem.code}`)
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
            item.summary.toLowerCase().includes(kw)
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
    setList(getPersistedData<QualityReportItem[]>('quality-report') ?? list)
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
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '待审批' as QCReportStatus } : item); return r })
      message.success('已驳回，返回待审批')
      addAuditLog(currentUser.name, '质量控制', '审批', currentItem.title, '质量报告', `驳回质量报告：${currentItem.code}`)
    } else {
      const newStatus: QCReportStatus = currentItem.status === '待审批' ? '一审通过' : '已审批'
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: newStatus } : item); return r })
      message.success(newStatus === '已审批' ? '终审已通过' : '一审通过，等待总监理工程师终审')
      addAuditLog(currentUser.name, '质量控制', '审批', currentItem.title, '质量报告', `${newStatus === '已审批' ? '终审通过' : '一审通过'}质量报告：${currentItem.code}`)
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ type: '月报' as QCReportType, status: '草稿' as QCReportStatus }}>
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
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
        <Input placeholder="请输入报告标题" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="type" label="报告类型" rules={[{ required: true, message: '请选择类型' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择类型">
            <Option value="周报">周报</Option>
            <Option value="月报">月报</Option>
            <Option value="专项报告">专项报告</Option>
            <Option value="阶段报告">阶段报告</Option>
          </Select>
        </Form.Item>
        <Form.Item name="reportDate" label="报告日期" rules={[{ required: true, message: '请选择报告日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="author" label="编制人" rules={[{ required: true, message: '请输入编制人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入编制人" />
        </Form.Item>
      </div>
      <Form.Item name="summary" label="摘要/正文要点">
        <TextArea rows={4} placeholder="请输入报告摘要或正文要点" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            <Option value="草稿">草稿</Option>
            <Option value="待审批">待审批</Option>
            <Option value="一审中">一审中</Option>
            <Option value="一审通过">一审通过</Option>
            <Option value="已发布">已发布</Option>
            <Option value="已驳回">已驳回</Option>
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
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>质量报告（周报 / 月报 / 专项）</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增报告</Button>
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
            <Select placeholder="类型" style={{ width: 120 }} allowClear>
              <Option value="周报">周报</Option>
              <Option value="月报">月报</Option>
              <Option value="专项报告">专项报告</Option>
              <Option value="阶段报告">阶段报告</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 130 }} allowClear>
              <Option value="草稿">草稿</Option>
              <Option value="待审批">待审批</Option>
              <Option value="一审中">一审中</Option>
              <Option value="一审通过">一审通过</Option>
              <Option value="已发布">已发布</Option>
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
          scroll={{ x: 1500 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增质量报告" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑质量报告" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="质量报告详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('报告类型', <Tag color={reportTypeColor(currentItem.type)}>{currentItem.type}</Tag>),
            descItem('报告日期', descText(currentItem.reportDate)),
            descItem('编制人', descText(currentItem.author)),
            descItem('状态', <Tag color={reportStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.summary ? descItem('摘要', descText(currentItem.summary)) : null,
          ].filter(Boolean) as any[]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
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

export default ReportPanel
