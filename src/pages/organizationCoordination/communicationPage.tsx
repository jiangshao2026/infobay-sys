import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/communications'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { CommunicationItem, OCComType, OCComStatus, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
const { Option } = Select
const { TextArea } = Input

const comStatusColor = (status: string): string => {
  switch (status) {
    case '待回复':
      return 'gold'
    case '已回复':
      return 'blue'
    case '已处理':
      return 'green'
    case '已关闭':
      return 'gray'
    default:
      return 'gray'
  }
}

const CommunicationPanel: React.FC = () => {
  const [list, setList] = usePersistedState<OrgCommItem[]>('org-comm', initialData)
const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<CommunicationItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: CommunicationItem) => ({
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
      onCell: (record: CommunicationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      onCell: (record: CommunicationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: OCComType) => <Tag color="cyan">{type}</Tag>,
      onCell: (record: CommunicationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      onCell: (record: CommunicationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '发件人',
      dataIndex: 'from',
      key: 'from',
      width: 120,
      onCell: (record: CommunicationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '收件人',
      dataIndex: 'to',
      key: 'to',
      width: 200,
      onCell: (record: CommunicationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OCComStatus) => <Tag color={comStatusColor(status)}>{status}</Tag>,
      onCell: (record: CommunicationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: CommunicationItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此沟通记录？"
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

  const handleView = (record: CommunicationItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: CommunicationItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      date: record.date ? dayjs(record.date) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const deletedItem = list.find(item => item.key === key)
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
    if (deletedItem) {
      addAuditLog(currentUser.name, '组织协调', '删除', deletedItem.title, '沟通记录', `删除沟通记录：${deletedItem.title}（编号：${deletedItem.code}）`)
    }
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): CommunicationItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    type: values.type as OCComType,
    date: values.date ? values.date.format('YYYY-MM-DD') : '',
    from: values.from || '',
    to: values.to || '',
    content: values.content || '',
    reply: values.reply || undefined,
    status: values.status as OCComStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: CommunicationItem = normalize(values, Date.now().toString(), [])
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
      addAuditLog(currentUser.name, '组织协调', '新增', values.title || values.code, '沟通记录', `新增沟通记录：${values.title}（编号：${values.code}）`)
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
        addAuditLog(currentUser.name, '组织协调', '编辑', currentItem.title, '沟通记录', `编辑沟通记录：${currentItem.title}（编号：${currentItem.code}）`)
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
            item.from.toLowerCase().includes(kw) ||
            item.to.toLowerCase().includes(kw)
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
    addForm.resetFields()
    editForm.resetFields()
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ type: '工作联系单' as OCComType, status: '待回复' as OCComStatus }}>
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
            <Option value="工作联系单">工作联系单</Option>
            <Option value="监理通知">监理通知</Option>
            <Option value="工程变更">工程变更</Option>
            <Option value="口头沟通">口头沟通</Option>
            <Option value="书面函件">书面函件</Option>
          </Select>
        </Form.Item>
        <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="from" label="发件人" rules={[{ required: true, message: '请输入发件人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入发件人" />
        </Form.Item>
        <Form.Item name="to" label="收件人" rules={[{ required: true, message: '请输入收件人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入收件人" />
        </Form.Item>
      </div>
      <Form.Item name="content" label="沟通内容" rules={[{ required: true, message: '请输入沟通内容' }]}>
        <TextArea rows={4} placeholder="请输入沟通内容" />
      </Form.Item>
      <Form.Item name="reply" label="回复内容">
        <TextArea rows={3} placeholder="请输入回复内容（选填）" />
      </Form.Item>
      <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
        <Select placeholder="请选择状态">
          <Option value="待回复">待回复</Option>
          <Option value="已回复">已回复</Option>
          <Option value="已处理">已处理</Option>
          <Option value="已关闭">已关闭</Option>
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
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>沟通记录管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增记录</Button>
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
              <Option value="工作联系单">工作联系单</Option>
              <Option value="监理通知">监理通知</Option>
              <Option value="工程变更">工程变更</Option>
              <Option value="口头沟通">口头沟通</Option>
              <Option value="书面函件">书面函件</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="待回复">待回复</Option>
              <Option value="已回复">已回复</Option>
              <Option value="已处理">已处理</Option>
              <Option value="已关闭">已关闭</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/发件人/收件人）" prefix={<SearchOutlined />} style={{ width: 280 }} />
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

      <Modal title="新增沟通记录" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑沟通记录" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="沟通记录详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('类型', <Tag color="cyan">{currentItem.type}</Tag>),
            descItem('日期', descText(currentItem.date)),
            descItem('发件人', descText(currentItem.from)),
            descItem('收件人', descText(currentItem.to)),
            descItem('状态', <Tag color={comStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.content ? descItem('沟通内容', descText(currentItem.content)) : null,
            currentItem.reply ? descItem('回复内容', descText(currentItem.reply)) : null,
          ].filter(Boolean) as any[]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          return items
        })()}
      />
    </div>
  )
}

export default CommunicationPanel
