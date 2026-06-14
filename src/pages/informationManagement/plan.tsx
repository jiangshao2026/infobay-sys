import { Card, Table, Button, Input, Select, DatePicker, Modal, Form, Upload, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, DeleteOutlined, CheckCircleOutlined, UploadOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'

import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import planData from '../../data/plans'
import type { PlanItem, PlanSearchParams, PlanType, PlanStatus } from '../../types/projectManagement'
import { DetailModal, descItem, descText, descTag, statusColor, descAttachments, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS, type ApprovalRecord } from '../../components/ReviewFlow'

const { RangePicker } = DatePicker
const { Option } = Select

const PLAN_TYPES: PlanType[] = [
  '监理规划',
  '监理实施细则',
  '专项施工方案',
  '质量控制方案',
  '安全控制方案',
  '进度控制方案',
]

function Plan() {
  const [list, setList] = usePersistedState<PlanItem[]>('info-plan', planData)
  const { currentUser } = useUser()
const [isDetailVisible, setIsDetailVisible] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<PlanItem | null>(null)
  const [isAddVisible, setIsAddVisible] = useState(false)
  const [isEditVisible, setIsEditVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('informationManagement-plan-approval', {})
  const [searchForm] = Form.useForm()
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [addFileList, setAddFileList] = useState<any[]>([])
  const [editFileList, setEditFileList] = useState<any[]>([])

  const handleSearch = (values: PlanSearchParams) => {
    const filtered = list.filter(item => {
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        if (
          !item.code.toLowerCase().includes(kw) &&
          !item.title.toLowerCase().includes(kw)
        ) {
          return false
        }
      }
      if (values.projectCode && item.projectCode !== values.projectCode) {
        return false
      }
      if (values.type && item.type !== values.type) {
        return false
      }
      if (values.status && item.status !== values.status) {
        return false
      }
      if (values.dateRange && values.dateRange[0] && values.dateRange[1]) {
        const startStr = values.dateRange[0].format('YYYY-MM-DD')
        const endStr = values.dateRange[1].format('YYYY-MM-DD')
        if (item.createDate < startStr || item.createDate > endStr) {
          return false
        }
      }
      return true
    })
    setList(filtered)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setList([...list])
  }

  const handleView = (record: PlanItem) => {
    setCurrentPlan(record)
    setIsDetailVisible(true)
  }

  const handleEdit = (record: PlanItem) => {
    setCurrentPlan(record)
    editForm.setFieldsValue({
      ...record,
      createDate: record.createDate ? dayjs(record.createDate) : null,
      reviewDate: record.reviewDate ? dayjs(record.reviewDate) : null,
    })
    setEditFileList((record.attachments || []).map((f, i) => ({
      uid: String(i),
      name: f.name,
      url: f.url,
      status: 'done',
    })))
    setIsEditVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => {
      const result = prev.filter(item => item.key !== key)
      return result
    })
    message.success('删除成功')
  }

  const handleReview = (record: PlanItem) => {
    setCurrentPlan(record)
    setIsReviewModalVisible(true)
  }

  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string }) => {
    if (!currentPlan) return
    const key = currentPlan.key
    const existingRecords = approvalMap[key] || []
    const nextLevel = existingRecords.length + 1
    const chain = APPROVAL_CHAINS.PROJECT
    const isLast = nextLevel >= chain.levels.length
    const newRecord: ApprovalRecord = {
      key: `${key}-${nextLevel}`,
      code: `${currentPlan.code}-R${nextLevel}`,
      level: nextLevel,
      reviewer: payload.reviewer,
      status: payload.status,
      comment: payload.comment,
      date: new Date().toLocaleString('zh-CN'),
    }
    setApprovalMap(prev => ({ ...prev, [key]: [...existingRecords, newRecord] }))
    if (payload.status === '通过') {
      setList(prev => {
        const result = prev.map(item => item.key === key ? { ...item, status: (isLast ? '已审批' : '审批中') as PlanStatus } : item)
        return result
      })
      if (currentPlan.key === key) {
        setCurrentPlan(prev => prev ? { ...prev, status: '已审批' } : prev)
      }
      message.success('审批通过')
    } else {
      setList(prev => {
        const result = prev.map(item => item.key === key ? { ...item, status: '编制中' as PlanStatus } : item)
        return result
      })
      if (currentPlan.key === key) {
        setCurrentPlan(prev => prev ? { ...prev, status: '编制中' } : prev)
      }
      message.success('审批已驳回')
    }
    setIsReviewModalVisible(false)
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddVisible(true)
  }

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newPlan: PlanItem = {
        ...values,
        key: Date.now().toString(),
        code: values.code || `PLAN-${dayjs().format('YYYYMMDD')}-${String(allDataRef.current.length + 1).padStart(3, '0')}`,
        createDate: values.createDate ? values.createDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        reviewDate: values.reviewDate ? values.reviewDate.format('YYYY-MM-DD') : undefined,
        status: values.status || '编制中',
        attachments: addFileList.map(f => ({ name: f.name, url: f.url || '#' })),
      }
      setList(prev => {
        const result = [newPlan, ...prev]
        return result
      })
      setIsAddVisible(false)
      message.success('新增成功')
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentPlan) {
        setList(prev => {
          const result = prev.map(item =>
            item.key === currentPlan.key
              ? {
                  ...values,
                  key: currentPlan.key,
                  createDate: values.createDate ? values.createDate.format('YYYY-MM-DD') : currentPlan.createDate,
                  reviewDate: values.reviewDate ? values.reviewDate.format('YYYY-MM-DD') : undefined,
                  attachments: editFileList.map(f => ({ name: f.name, url: f.url || '#' })),
                }
              : item
          )
          return result
        })
        setIsEditVisible(false)
        setCurrentPlan(null)
        message.success('修改成功')
      }
    })
  }

  const handleCancel = () => {
    setIsAddVisible(false)
    setIsEditVisible(false)
    setIsDetailVisible(false)
    setIsReviewModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    setAddFileList([])
    setEditFileList([])
    setCurrentPlan(null)
  }

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      onCell: (record: PlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '监理规划名称',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      onCell: (record: PlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目名称',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 220,
      render: (code: string) => getProjectNameByCode(code),
      onCell: (record: PlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      onCell: (record: PlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 90,
      onCell: (record: PlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 90,
      onCell: (record: PlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '创建日期',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 110,
      onCell: (record: PlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PlanStatus) => descTag(status, statusColor),
      onCell: (record: PlanItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: PlanItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.status !== '已发布' && record.status !== '已驳回' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>{record.status === '审批中' ? '审批' : '发起审批'}</Button>
          )}
          <Popconfirm
            title="确定删除此文档？"
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>监理规划和实施细则管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增文档</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: '16px' }} onFinish={handleSearch}>
          <Form.Item name="keyword">
            <Input placeholder="标题/编号" prefix={<SearchOutlined />} style={{ width: '200px' }} />
          </Form.Item>
          <Form.Item name="projectCode">
            <Select placeholder="项目名称" style={{ width: '220px' }} allowClear>
              {initialProjectData.map(p => (
                <Option key={p.code} value={p.code}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type">
            <Select placeholder="文档类型" style={{ width: '140px' }} allowClear>
              {PLAN_TYPES.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="审批状态" style={{ width: '130px' }} allowClear>
              <Option value="编制中">编制中</Option>
              <Option value="待审批">待审批</Option>
              <Option value="已审批">已审批</Option>
              <Option value="已执行">已执行</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker placeholder={['创建开始', '创建结束']} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">查询</Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
        </Form>
        <Table
          size="small"
          dataSource={list}
          columns={columns}
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 1600 }}
          rowKey="key"
        />
      </Card>

      <Modal
        title="新增计划文档"
        open={isAddVisible}
        forceRender
        onOk={handleAddOk}
        onCancel={handleCancel}
        width={640}
        okText="确认新增"
      >
        <Form form={addForm} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="code"
              label="文档编号"
              rules={[{ required: true, message: '请输入文档编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="如 PLAN-2025-001" />
            </Form.Item>
            <Form.Item
              name="type"
              label="文档类型"
              initialValue="监理规划"
              rules={[{ required: true, message: '请选择文档类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择">
                {PLAN_TYPES.map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="title"
            label="文档标题"
            rules={[{ required: true, message: '请输入文档标题' }]}
          >
            <Input placeholder="请输入文档标题" />
          </Form.Item>
          <Form.Item
            name="projectCode"
            label="所属项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select placeholder="请选择项目">
              {initialProjectData.map(p => (
                <Option key={p.code} value={p.code}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="version"
              label="版本号"
              initialValue="V1.0"
              rules={[{ required: true, message: '请输入版本号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入版本号" />
            </Form.Item>
            <Form.Item
              name="author"
              label="作者"
              rules={[{ required: true, message: '请输入作者' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入作者" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="createDate"
              label="创建日期"
              rules={[{ required: true, message: '请选择创建日期' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="reviewDate"
              label="审批日期"
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item
            name="status"
            label="状态"
            initialValue="编制中"
          >
            <Select placeholder="请选择状态">
              <Option value="编制中">编制中</Option>
              <Option value="待审批">待审批</Option>
              <Option value="已审批">已审批</Option>
              <Option value="已执行">已执行</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="addAttachments"
            label="文档附件"
            getValueProps={(fileList) => ({ fileList })}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={addFileList}
              onChange={info => setAddFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑计划文档"
        open={isEditVisible}
        forceRender
        onOk={handleEditOk}
        onCancel={handleCancel}
        width={640}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="code"
              label="文档编号"
              rules={[{ required: true, message: '请输入文档编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入文档编号" disabled />
            </Form.Item>
            <Form.Item
              name="type"
              label="文档类型"
              rules={[{ required: true, message: '请选择文档类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择">
                {PLAN_TYPES.map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="title"
            label="文档标题"
            rules={[{ required: true, message: '请输入文档标题' }]}
          >
            <Input placeholder="请输入文档标题" />
          </Form.Item>
          <Form.Item
            name="projectCode"
            label="所属项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select placeholder="请选择项目">
              {initialProjectData.map(p => (
                <Option key={p.code} value={p.code}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="version"
              label="版本号"
              rules={[{ required: true, message: '请输入版本号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入版本号" />
            </Form.Item>
            <Form.Item
              name="author"
              label="作者"
              rules={[{ required: true, message: '请输入作者' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入作者" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="createDate"
              label="创建日期"
              rules={[{ required: true, message: '请选择创建日期' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="reviewDate"
              label="审批日期"
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              <Option value="编制中">编制中</Option>
              <Option value="待审批">待审批</Option>
              <Option value="已审批">已审批</Option>
              <Option value="已执行">已执行</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="editAttachments"
            label="文档附件"
            getValueProps={(fileList) => ({ fileList })}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={editFileList}
              onChange={info => setEditFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <DetailModal
        open={isDetailVisible}
        title="监理规划详情"
        onClose={() => {
          setIsDetailVisible(false)
          setCurrentPlan(null)
        }}
        items={(() => {
          if (!currentPlan) return []
          const items = [
            descItem('编号', descText(currentPlan.code)),
            descItem('监理规划名称', descText(currentPlan.title)),
            descItem('所属项目', descText(getProjectNameByCode(currentPlan.projectCode))),
            descItem('类型', descText(currentPlan.type)),
            descItem('版本', descText(currentPlan.version)),
            descItem('作者', descText(currentPlan.author)),
            descItem('创建日期', descText(currentPlan.createDate)),
            currentPlan.reviewDate ? descItem('审批日期', descText(currentPlan.reviewDate)) : null,
            descItem('状态', descTag(currentPlan.status, statusColor)),
            descItem('文档附件', descAttachments(currentPlan.attachments)),
            currentPlan.description ? descItem('描述', descText(currentPlan.description)) : null,
            descItem('审批记录', <ReviewTimeline records={getApprovalRecords(currentPlan, approvalMap, 'PROJECT')} status={currentPlan.status} levels={APPROVAL_CHAINS.PROJECT.levels} />),
          ].filter(Boolean) as any
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

export default Plan
