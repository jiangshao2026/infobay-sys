import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag, Progress } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/scheduleTracks'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { ScheduleTrackItem, SCPhase, SCTrackStatus, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

import { usePersistedState } from '../../hooks/usePersistedState'
const { Option } = Select
const { TextArea } = Input

const trackStatusColor = (status: string): string => {
  switch (status) {
    case '正常':
      return 'blue'
    case '滞后':
      return 'volcano'
    case '提前':
      return 'green'
    case '已完成':
      return 'geekblue'
    default:
      return 'gray'
  }
}

const deviationColor = (days: number): string => {
  if (days > 0) return '#f5222d'
  if (days < 0) return '#52c41a'
  return '#1890ff'
}

const formatDeviation = (days: number): string => {
  if (days > 0) return `+${days}天`
  if (days < 0) return `${days}天`
  return '0天'
}

interface TrackPageProps {}

const TrackPanel: React.FC<TrackPageProps> = () => {
  const [list, setList] = usePersistedState<ScheduleTrackItem[]>('schedule-track', initialData)
const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ScheduleTrackItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      onCell: (record: ScheduleTrackItem) => ({
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
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '阶段',
      dataIndex: 'phase',
      key: 'phase',
      width: 100,
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '计划开始',
      dataIndex: 'planStart',
      key: 'planStart',
      width: 110,
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '计划结束',
      dataIndex: 'planEnd',
      key: 'planEnd',
      width: 110,
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '实际开始',
      dataIndex: 'actualStart',
      key: 'actualStart',
      width: 110,
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '实际结束',
      dataIndex: 'actualEnd',
      key: 'actualEnd',
      width: 110,
      render: (v: string) => descText(v),
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '计划进度%',
      dataIndex: 'planProgress',
      key: 'planProgress',
      width: 130,
      render: (v: number) => <Progress percent={v} size="small" style={{ maxWidth: 120 }} />,
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '实际进度%',
      dataIndex: 'actualProgress',
      key: 'actualProgress',
      width: 130,
      render: (v: number) => <Progress percent={v} size="small" style={{ maxWidth: 120 }} />,
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '偏差天数',
      dataIndex: 'deviationDays',
      key: 'deviationDays',
      width: 100,
      render: (v: number) => <span style={{ color: deviationColor(v), fontWeight: 600 }}>{formatDeviation(v)}</span>,
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: SCTrackStatus) => <Tag color={trackStatusColor(status)}>{status}</Tag>,
      onCell: (record: ScheduleTrackItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: ScheduleTrackItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此进度跟踪记录？"
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

  const handleView = (record: ScheduleTrackItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: ScheduleTrackItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      planStart: record.planStart ? dayjs(record.planStart) : null,
      planEnd: record.planEnd ? dayjs(record.planEnd) : null,
      actualStart: record.actualStart ? dayjs(record.actualStart) : null,
      actualEnd: record.actualEnd ? dayjs(record.actualEnd) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): ScheduleTrackItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    phase: values.phase as SCPhase,
    planStart: values.planStart ? values.planStart.format('YYYY-MM-DD') : '',
    planEnd: values.planEnd ? values.planEnd.format('YYYY-MM-DD') : '',
    actualStart: values.actualStart ? values.actualStart.format('YYYY-MM-DD') : '',
    actualEnd: values.actualEnd ? values.actualEnd.format('YYYY-MM-DD') : '',
    planProgress: Number(values.planProgress) || 0,
    actualProgress: Number(values.actualProgress) || 0,
    deviationDays: Number(values.deviationDays) || 0,
    reason: values.reason || '',
    status: values.status as SCTrackStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: ScheduleTrackItem = normalize(values, Date.now().toString(), [])
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
            item.title.toLowerCase().includes(kw)
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
    addForm.resetFields()
    editForm.resetFields()
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ phase: '开发' as SCPhase, status: '正常' as SCTrackStatus, planProgress: 0, actualProgress: 0, deviationDays: 0 }}>
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
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            <Option value="正常">正常</Option>
            <Option value="滞后">滞后</Option>
            <Option value="提前">提前</Option>
            <Option value="已完成">已完成</Option>
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="planStart" label="计划开始" rules={[{ required: true, message: '请选择开始日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="planEnd" label="计划结束" rules={[{ required: true, message: '请选择结束日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="actualStart" label="实际开始" rules={[{ required: true, message: '请选择实际开始' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="actualEnd" label="实际结束" style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="planProgress" label="计划进度%" rules={[{ required: true, message: '请输入计划进度' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入计划进度（0-100）" />
        </Form.Item>
        <Form.Item name="actualProgress" label="实际进度%" rules={[{ required: true, message: '请输入实际进度' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="请输入实际进度（0-100）" />
        </Form.Item>
        <Form.Item name="deviationDays" label="偏差天数" rules={[{ required: true, message: '请输入偏差天数' }]} style={{ flex: 1 }}>
          <Input type="number" placeholder="正数表示滞后，负数表示提前" />
        </Form.Item>
      </div>
      <Form.Item name="reason" label="偏差原因/备注">
        <TextArea rows={3} placeholder="请输入偏差原因或备注信息" />
      </Form.Item>
      <Form.Item name="attachments" label="附件">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>进度跟踪管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增跟踪</Button>
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
              <Option value="正常">正常</Option>
              <Option value="滞后">滞后</Option>
              <Option value="提前">提前</Option>
              <Option value="已完成">已完成</Option>
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
          scroll={{ x: 1800 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增进度跟踪" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑进度跟踪" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="进度跟踪详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          return [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('阶段', descText(currentItem.phase)),
            descItem('计划开始', descText(currentItem.planStart)),
            descItem('计划结束', descText(currentItem.planEnd)),
            descItem('实际开始', descText(currentItem.actualStart)),
            descItem('实际结束', descText(currentItem.actualEnd || '未完成')),
            descItem('计划进度', <Progress percent={currentItem.planProgress} size="small" style={{ maxWidth: 320 }} />),
            descItem('实际进度', <Progress percent={currentItem.actualProgress} size="small" style={{ maxWidth: 320 }} />),
            descItem('偏差天数', <span style={{ color: deviationColor(currentItem.deviationDays), fontWeight: 600 }}>{formatDeviation(currentItem.deviationDays)}</span>),
            descItem('状态', <Tag color={trackStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.reason ? descItem('偏差原因/备注', descText(currentItem.reason)) : null,
            descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />),
          ].filter(Boolean) as any[]
        })()}
      />
    </div>
  )
}

export default TrackPanel
