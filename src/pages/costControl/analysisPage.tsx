import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/costAnalyses'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { CostAnalysisItem, CCAnalysisStatus, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'
import { formatCurrency } from '../../utils/format'

const { Option } = Select
const { TextArea } = Input

const analysisStatusColor = (status: string): string => {
  switch (status) {
    case '草稿':
      return 'default'
    case '待审批':
      return 'gold'
    case '已发布':
      return 'green'
    default:
      return 'gray'
  }
}

interface AnalysisPageProps {}

const AnalysisPanel: React.FC<AnalysisPageProps> = () => {
  const [list, setList] = useState<CostAnalysisItem[]>(initialData)
const [approvalMap, setApprovalMap] = useState<Record<string, ApprovalRecord[]>>({})
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<CostAnalysisItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: CostAnalysisItem) => ({
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
      onCell: (record: CostAnalysisItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      onCell: (record: CostAnalysisItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '分析日期',
      dataIndex: 'analysisDate',
      key: 'analysisDate',
      width: 120,
      onCell: (record: CostAnalysisItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '编制人',
      dataIndex: 'author',
      key: 'author',
      width: 100,
      onCell: (record: CostAnalysisItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '预算总额',
      dataIndex: 'budgetTotal',
      key: 'budgetTotal',
      width: 130,
      render: (v: number) => formatCurrency(v),
      onCell: (record: CostAnalysisItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '实际总额',
      dataIndex: 'actualTotal',
      key: 'actualTotal',
      width: 130,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span>,
      onCell: (record: CostAnalysisItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CCAnalysisStatus) => <Tag color={analysisStatusColor(status)}>{status}</Tag>,
      onCell: (record: CostAnalysisItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: CostAnalysisItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.status !== '已发布' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>发起审批</Button>
          )}
          <Popconfirm
            title="确定删除此成本分析报告？"
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

  const handleView = (record: CostAnalysisItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: CostAnalysisItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      analysisDate: record.analysisDate ? dayjs(record.analysisDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
  }

  const handleReview = (record: CostAnalysisItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): CostAnalysisItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    analysisDate: values.analysisDate ? values.analysisDate.format('YYYY-MM-DD') : '',
    author: values.author,
    budgetTotal: Number(values.budgetTotal) || 0,
    actualTotal: Number(values.actualTotal) || 0,
    varianceSummary: values.varianceSummary || '',
    analysis: values.analysis || '',
    suggestions: values.suggestions || '',
    status: values.status as CCAnalysisStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: CostAnalysisItem = normalize(values, Date.now().toString(), [])
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
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '草稿' as CCAnalysisStatus } : item); return r })
      message.success('已驳回')
    } else {
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '已发布' as CCAnalysisStatus } : item); return r })
      message.success('审批已提交')
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ status: '待审批' as CCAnalysisStatus }}>
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
        <Form.Item name="analysisDate" label="分析日期" rules={[{ required: true, message: '请选择日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="author" label="编制人" rules={[{ required: true, message: '请输入编制人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入编制人" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            <Option value="草稿">草稿</Option>
            <Option value="待审批">待审批</Option>
            <Option value="已发布">已发布</Option>
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="budgetTotal" label="预算总额(元)" rules={[{ required: true, message: '请输入预算总额' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入预算总额" />
        </Form.Item>
        <Form.Item name="actualTotal" label="实际总额(元)" rules={[{ required: true, message: '请输入实际总额' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入实际总额" />
        </Form.Item>
      </div>
      <Form.Item name="varianceSummary" label="偏差总结">
        <TextArea rows={2} placeholder="请输入偏差总结说明" />
      </Form.Item>
      <Form.Item name="analysis" label="详细分析">
        <TextArea rows={3} placeholder="请输入详细分析内容" />
      </Form.Item>
      <Form.Item name="suggestions" label="改进建议">
        <TextArea rows={3} placeholder="请输入改进建议" />
      </Form.Item>
      <Form.Item name="attachments" label="附件">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>成本分析报告</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增分析</Button>
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
              <Option value="已发布">已发布</Option>
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
          scroll={{ x: 1700 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增成本分析报告" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑成本分析报告" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="成本分析详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('分析日期', descText(currentItem.analysisDate)),
            descItem('编制人', descText(currentItem.author)),
            descItem('预算总额', formatCurrency(currentItem.budgetTotal)),
            descItem('实际总额', <span style={{ fontWeight: 600 }}>{formatCurrency(currentItem.actualTotal)}</span>),
            descItem('状态', <Tag color={analysisStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.varianceSummary ? descItem('偏差总结', descText(currentItem.varianceSummary)) : null,
            currentItem.analysis ? descItem('详细分析', descText(currentItem.analysis)) : null,
            currentItem.suggestions ? descItem('改进建议', descText(currentItem.suggestions)) : null,
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

export default AnalysisPanel
