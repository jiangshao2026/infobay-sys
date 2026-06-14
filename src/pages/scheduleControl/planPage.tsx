import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import initialData from '../../data/schedulePlans'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { SchedulePlanItem, SCPhase, SCPlanStatus, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select
const { TextArea } = Input

const planStatusColor = (status: string): string => {
  switch (status) {
    case '待审批':
      return 'gold'
    case '已审批':
      return 'green'
    case '已驳回':
      return 'volcano'
    default:
      return 'gray'
  }
}

interface PlanPageProps {}

const PlanPanel: React.FC<PlanPageProps> = () => {
  const { currentUser } = useUser()
  const [list, setList] = usePersistedState<SchedulePlanItem[]>('schedule-plan', initialData)
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('scheduleControl-planPage-approval', {})
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<SchedulePlanItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      onCell: (record: SchedulePlanItem) => ({
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
      onCell: (record: SchedulePlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: SchedulePlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '阶段',
      dataIndex: 'phase',
      key: 'phase',
      width: 100,
      onCell: (record: SchedulePlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '计划开始',
      dataIndex: 'planStart',
      key: 'planStart',
      width: 110,
      onCell: (record: SchedulePlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '计划结束',
      dataIndex: 'planEnd',
      key: 'planEnd',
      width: 110,
      onCell: (record: SchedulePlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '负责人',
      dataIndex: 'responsible',
      key: 'responsible',
      width: 100,
      onCell: (record: SchedulePlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SCPlanStatus) => <Tag color={planStatusColor(status)}>{status}</Tag>,
      onCell: (record: SchedulePlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: SchedulePlanItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.status !== '已审批' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>{record.status === '审批中' ? '审批' : '发起审批'}</Button>
          )}
          <Popconfirm
            title="确定删除此进度计划？"
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

  const handleView = (record: SchedulePlanItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: SchedulePlanItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      milestones: record.milestones?.join('\n') || '',
      planStart: record.planStart ? dayjs(record.planStart) : null,
      planEnd: record.planEnd ? dayjs(record.planEnd) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
  }

  const handleReview = (record: SchedulePlanItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): SchedulePlanItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    phase: values.phase as SCPhase,
    planStart: values.planStart ? values.planStart.format('YYYY-MM-DD') : '',
    planEnd: values.planEnd ? values.planEnd.format('YYYY-MM-DD') : '',
    responsible: values.responsible,
    milestones: values.milestones ? String(values.milestones).split(/\r?\n/).filter(Boolean) : [],
    status: values.status as SCPlanStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: SchedulePlanItem = normalize(values, Date.now().toString(), [])
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
            item.responsible.toLowerCase().includes(kw)
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
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '已驳回' as SCPlanStatus } : item); return r })
      message.success('已驳回')
    } else {
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: (isLast ? '已审批' : '审批中') as SCPlanStatus } : item); return r })
      message.success(isLast ? '审批已通过' : '审批已提交至下一级')
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ phase: '开发' as SCPhase, status: '待审批' as SCPlanStatus }}>
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
        <Form.Item name="phase" label="阶段" rules={[{ required: true, message: '请选择阶段' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择阶段">
            <Option value="需求分析">需求分析</Option>
            <Option value="设计">设计</Option>
            <Option value="开发">开发</Option>
            <Option value="测试">测试</Option>
            <Option value="部署">部署</Option>
            <Option value="验收">验收</Option>
          </Select>
        </Form.Item>
        <Form.Item name="planStart" label="计划开始" rules={[{ required: true, message: '请选择开始日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="planEnd" label="计划结束" rules={[{ required: true, message: '请选择结束日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="responsible" label="负责人" rules={[{ required: true, message: '请输入负责人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入负责人" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            <Option value="待审批">待审批</Option>
            <Option value="已审批">已审批</Option>
            <Option value="已驳回">已驳回</Option>
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="milestones" label="里程碑（每行一项）">
        <TextArea rows={3} placeholder="每行一项，例如：需求冻结" />
      </Form.Item>
      <Form.Item name="attachments" label="附件">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>进度计划管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增计划</Button>
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
              <Option value="已审批">已审批</Option>
              <Option value="已驳回">已驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/负责人）" prefix={<SearchOutlined />} style={{ width: 260 }} />
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

      <Modal title="新增进度计划" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑进度计划" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="进度计划详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('阶段', descText(currentItem.phase)),
            descItem('计划开始', descText(currentItem.planStart)),
            descItem('计划结束', descText(currentItem.planEnd)),
            descItem('负责人', descText(currentItem.responsible)),
            descItem('状态', <Tag color={planStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.milestones && currentItem.milestones.length > 0
              ? descItem('里程碑', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.milestones.map((m, i) => <li key={i}>{m}</li>)}</ul>)
              : null,
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
        currentUser={currentUser.name}
        okText="提交审批"
      />
    </div>
  )
}

export default PlanPanel
