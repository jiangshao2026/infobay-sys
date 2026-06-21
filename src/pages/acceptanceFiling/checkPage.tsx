import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useCrossModuleData } from '../../context/CrossModuleDataContext'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
import initialData from '../../data/acceptanceChecks'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { AcceptanceCheckItem, ACCheckType, ACCheckStatus, ACResult, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select
const { TextArea } = Input

const checkStatusColor = (status: string): string => {
  switch (status) {
    case '待审批':
      return 'gold'
    case '一审通过':
      return 'cyan'
    case '已审批':
    case '已完成':
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
const statusOptions: ACCheckStatus[] = ['待审批', '一审通过', '已审批', '已驳回']
const resultOptions: ACResult[] = ['合格', '不合格', '有条件合格', '待复查']

const CheckPanel: React.FC = () => {
  const [list, setList] = usePersistedState<ACCheckItem[]>('accept-check', initialData)
  const { projectList: projectData, setProjectList: setProjectData } = useCrossModuleData()
  const { currentUser } = useUser()
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('acceptanceFiling-checkPage-approval', {})
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<AcceptanceCheckItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      onCell: (record: AcceptanceCheckItem) => ({
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
      onCell: (record: AcceptanceCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: AcceptanceCheckItem) => ({
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
      onCell: (record: AcceptanceCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '检查日期',
      dataIndex: 'checkDate',
      key: 'checkDate',
      width: 100,
      onCell: (record: AcceptanceCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 180,
      onCell: (record: AcceptanceCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '检查人',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 100,
      onCell: (record: AcceptanceCheckItem) => ({
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
      onCell: (record: AcceptanceCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: ACCheckStatus) => <Tag color={checkStatusColor(s)}>{s}</Tag>,
      onCell: (record: AcceptanceCheckItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: AcceptanceCheckItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === '待审批' && (currentUser.role === '监理工程师' || currentUser.role === '总监理工程师') && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
          )}
          {record.status === '一审通过' && currentUser.role === '总监理工程师' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
          )}
          <Popconfirm
            title="确定删除此验收检查？"
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

  const handleView = (record: AcceptanceCheckItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: AcceptanceCheckItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      participants: record.participants?.join('\n') || '',
      issues: record.issues?.join('\n') || '',
      checkDate: record.checkDate ? dayjs(record.checkDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const deletedItem = list.find(item => item.key === key)
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
    if (deletedItem) {
      addAuditLog(currentUser.name, '验收归档', '删除', deletedItem.title, '验收检查', `删除验收检查：${deletedItem.title}（编号：${deletedItem.code}）`)
    }
  }

  const handleReview = (record: AcceptanceCheckItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): AcceptanceCheckItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    type: values.type as ACCheckType,
    checkDate: values.checkDate ? values.checkDate.format('YYYY-MM-DD') : '',
    location: values.location || '',
    inspector: values.inspector || '',
    participants: values.participants ? String(values.participants).split(/\r?\n/).filter(Boolean) : [],
    issues: values.issues ? String(values.issues).split(/\r?\n/).filter(Boolean) : [],
    result: values.result as ACResult,
    status: values.status as ACCheckStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: AcceptanceCheckItem = normalize(values, Date.now().toString(), [])
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
      addAuditLog(currentUser.name, '验收归档', '新增', newItem.title || newItem.code, '验收检查', `新增验收检查：${newItem.title}（编号：${newItem.code}）`)
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
        addAuditLog(currentUser.name, '验收归档', '编辑', currentItem.title, '验收检查', `编辑验收检查：${currentItem.title}（编号：${currentItem.code}）`)
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
            item.inspector.toLowerCase().includes(kw)
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
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '已驳回' as ACCheckStatus } : item); return r })
      message.success('已驳回，返回待审批')
      addAuditLog(currentUser.name, '验收归档', '审批', currentItem.title, '验收检查', `驳回验收检查：${currentItem.title}（编号：${currentItem.code}）`)
    } else {
      const newStatus: ACCheckStatus = currentItem.status === '待审批' ? '一审通过' : '已审批'
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: newStatus } : item); return r })

      // 验收备案模块与项目列表状态联动：
      // 当竣工验收类型的检查最终审批通过后，将对应项目状态自动更新为"已验收"
      if (newStatus === '已审批' && currentItem.type === '竣工验收') {
        setProjectData(prev =>
          prev.map(p =>
            p.code === currentItem.projectCode ? { ...p, status: '已验收' } : p
          )
        )
        message.success(`竣工验收终审已通过，对应项目状态已同步为"已验收"`)
        addAuditLog(currentUser.name, '验收归档', '审批', currentItem.title, '验收检查', `审批通过：${currentItem.title}（编号：${currentItem.code}），类型：${currentItem.type}，状态：已审批`)
      } else if (newStatus === '已审批') {
        message.success('终审已通过')
        addAuditLog(currentUser.name, '验收归档', '审批', currentItem.title, '验收检查', `审批通过：${currentItem.title}（编号：${currentItem.code}），状态：已审批`)
      } else {
        message.success('一审通过，等待总监理工程师终审')
        addAuditLog(currentUser.name, '验收归档', '审批', currentItem.title, '验收检查', `审批通过：${currentItem.title}（编号：${currentItem.code}），状态：一审通过`)
      }
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ type: '分项验收' as ACCheckType, status: '待审批' as ACCheckStatus, result: '合格' as ACResult }}>
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
        <Form.Item name="checkDate" label="检查日期" rules={[{ required: true, message: '请选择日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="inspector" label="检查人" rules={[{ required: true, message: '请输入检查人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入检查人" />
        </Form.Item>
      </div>
      <Form.Item name="location" label="地点">
        <Input placeholder="请输入检查地点" />
      </Form.Item>
      <Form.Item name="participants" label="参与人员（每行一项）">
        <TextArea rows={3} placeholder="每行一项，例如：监理工程师" />
      </Form.Item>
      <Form.Item name="issues" label="存在问题（每行一项）">
        <TextArea rows={3} placeholder="每行一项，例如：性能不达标" />
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
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>验收检查管理</h2>
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
            <Input placeholder="关键字（编号/标题/检查人）" prefix={<SearchOutlined />} style={{ width: 260 }} />
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

      <Modal title="新增验收检查" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑验收检查" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="验收检查详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('类型', descText(currentItem.type)),
            descItem('检查日期', descText(currentItem.checkDate)),
            descItem('地点', descText(currentItem.location)),
            descItem('检查人', descText(currentItem.inspector)),
            currentItem.participants && currentItem.participants.length > 0
              ? descItem('参与人员', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.participants.map((p, i) => <li key={i}>{p}</li>)}</ul>)
              : null,
            currentItem.issues && currentItem.issues.length > 0
              ? descItem('存在问题', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.issues.map((p, i) => <li key={i}>{p}</li>)}</ul>)
              : null,
            descItem('结果', <Tag color={resultColor(currentItem.result)}>{currentItem.result}</Tag>),
            descItem('状态', <Tag color={checkStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
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
        reviewerOptions={APPROVAL_CHAINS.PROJECT.reviewerOptions}
        okText="提交审批"
      
        currentUser={currentUser.name}
      />
    </div>
  )
}

export default CheckPanel
