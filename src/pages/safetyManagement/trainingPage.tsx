import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag, InputNumber } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/safetyTrainings'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { SafetyTrainingItem, SFTrainingStatus, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select
const { TextArea } = Input

const trainingStatusColor = (status: string): string => {
  switch (status) {
    case '计划中':
      return 'blue'
    case '进行中':
      return 'gold'
    case '已完成':
      return 'green'
    default:
      return 'gray'
  }
}

const TrainingPanel: React.FC = () => {
  const [list, setList] = useState<SafetyTrainingItem[]>(initialData)
const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<SafetyTrainingItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: SafetyTrainingItem) => ({
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
      onCell: (record: SafetyTrainingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      onCell: (record: SafetyTrainingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '培训日期',
      dataIndex: 'trainingDate',
      key: 'trainingDate',
      width: 110,
      onCell: (record: SafetyTrainingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '培训师',
      dataIndex: 'trainer',
      key: 'trainer',
      width: 120,
      onCell: (record: SafetyTrainingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '培训时长',
      dataIndex: 'hours',
      key: 'hours',
      width: 100,
      render: (hours: number) => `${hours} 小时`,
      onCell: (record: SafetyTrainingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '培训地点',
      dataIndex: 'location',
      key: 'location',
      width: 200,
      onCell: (record: SafetyTrainingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SFTrainingStatus) => <Tag color={trainingStatusColor(status)}>{status}</Tag>,
      onCell: (record: SafetyTrainingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: SafetyTrainingItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此安全培训记录？"
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

  const handleView = (record: SafetyTrainingItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: SafetyTrainingItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      trainees: record.trainees?.join('\n') || '',
      trainingDate: record.trainingDate ? dayjs(record.trainingDate) : null,
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

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): SafetyTrainingItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    trainingDate: values.trainingDate ? values.trainingDate.format('YYYY-MM-DD') : '',
    trainer: values.trainer,
    trainees: values.trainees ? String(values.trainees).split(/\r?\n/).filter(Boolean) : [],
    content: values.content || '',
    hours: values.hours || 0,
    location: values.location || '',
    attachments: values.attachments || existingAttachments,
    status: values.status as SFTrainingStatus,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: SafetyTrainingItem = normalize(values, Date.now().toString(), [])
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
            item.trainer.toLowerCase().includes(kw)
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
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ status: '计划中' as SFTrainingStatus, hours: 2 }}>
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
        <Form.Item name="trainingDate" label="培训日期" rules={[{ required: true, message: '请选择培训日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="trainer" label="培训师" rules={[{ required: true, message: '请输入培训师' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入培训师" />
        </Form.Item>
        <Form.Item name="hours" label="培训时长（小时）" rules={[{ required: true, message: '请输入培训时长' }]} style={{ flex: 1 }}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <Form.Item name="location" label="培训地点" rules={[{ required: true, message: '请输入培训地点' }]}>
        <Input placeholder="请输入培训地点" />
      </Form.Item>
      <Form.Item name="trainees" label="参训人员（每行一项）">
        <TextArea rows={3} placeholder="每行一项，例如：陈伟强" />
      </Form.Item>
      <Form.Item name="content" label="培训内容">
        <TextArea rows={3} placeholder="请输入培训内容" />
      </Form.Item>
      <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
        <Select placeholder="请选择状态">
          <Option value="计划中">计划中</Option>
          <Option value="进行中">进行中</Option>
          <Option value="已完成">已完成</Option>
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
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>安全培训管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增培训</Button>
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
              <Option value="计划中">计划中</Option>
              <Option value="进行中">进行中</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/培训师）" prefix={<SearchOutlined />} style={{ width: 260 }} />
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

      <Modal title="新增安全培训" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑安全培训" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="安全培训详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('培训日期', descText(currentItem.trainingDate)),
            descItem('培训师', descText(currentItem.trainer)),
            descItem('培训时长', descText(`${currentItem.hours} 小时`)),
            descItem('培训地点', descText(currentItem.location)),
            descItem('状态', <Tag color={trainingStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.trainees && currentItem.trainees.length > 0
              ? descItem('参训人员', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.trainees.map((m, i) => <li key={i}>{m}</li>)}</ul>)
              : null,
            currentItem.content ? descItem('培训内容', descText(currentItem.content)) : null,
          ].filter(Boolean) as any[]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          return items
        })()}
      />
    </div>
  )
}

export default TrainingPanel
