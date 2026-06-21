import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/fileArchives'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { FileArchiveItem, ACArchiveCategory, ACArchiveStatus, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

import { usePersistedState, getPersistedData } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
const { Option } = Select
const { TextArea } = Input

const archiveStatusColor = (status: string): string => {
  switch (status) {
    case '待归档':
      return 'default'
    case '归档中':
      return 'blue'
    case '已归档':
      return 'green'
    case '已调阅':
      return 'cyan'
    default:
      return 'gray'
  }
}

const categoryOptions: ACArchiveCategory[] = ['合同档案', '监理档案', '施工档案', '设计档案', '质量档案', '安全档案', '验收档案']
const statusOptions: ACArchiveStatus[] = ['待归档', '归档中', '已归档', '已调阅']

const FilePanel: React.FC = () => {
  const [list, setList] = usePersistedState<FileArchiveItem[]>('accept-file', initialData)
const { currentUser } = useUser()
const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<FileArchiveItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      onCell: (record: FileArchiveItem) => ({
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
      onCell: (record: FileArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: FileArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (c: string) => <Tag>{c}</Tag>,
      onCell: (record: FileArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '归档日期',
      dataIndex: 'archiveDate',
      key: 'archiveDate',
      width: 110,
      onCell: (record: FileArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '归档人',
      dataIndex: 'archivist',
      key: 'archivist',
      width: 100,
      onCell: (record: FileArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '内容摘要',
      dataIndex: 'contentSummary',
      key: 'contentSummary',
      width: 260,
      ellipsis: true,
      onCell: (record: FileArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: ACArchiveStatus) => <Tag color={archiveStatusColor(s)}>{s}</Tag>,
      onCell: (record: FileArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: FileArchiveItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此归档？"
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

  const handleView = (record: FileArchiveItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: FileArchiveItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      archiveDate: record.archiveDate ? dayjs(record.archiveDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const deletedItem = list.find(item => item.key === key)
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
    if (deletedItem) {
      addAuditLog(currentUser.name, '验收归档', '删除', deletedItem.title, '验收归档', `删除归档：${deletedItem.title}（编号：${deletedItem.code}）`)
    }
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): FileArchiveItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    category: values.category as ACArchiveCategory,
    archiveDate: values.archiveDate ? values.archiveDate.format('YYYY-MM-DD') : '',
    archivist: values.archivist || '',
    contentSummary: values.contentSummary || '',
    status: values.status as ACArchiveStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: FileArchiveItem = normalize(values, Date.now().toString(), [])
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
      addAuditLog(currentUser.name, '验收归档', '新增', newItem.title || newItem.code, '验收归档', `新增归档：${newItem.title}（编号：${newItem.code}）`)
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
        addAuditLog(currentUser.name, '验收归档', '编辑', currentItem.title, '验收归档', `编辑归档：${currentItem.title}（编号：${currentItem.code}）`)
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
            item.archivist.toLowerCase().includes(kw) ||
            item.contentSummary.toLowerCase().includes(kw)
          )
        }
        if (values.projectCode) {
          match = match && item.projectCode === values.projectCode
        }
        if (values.status) {
          match = match && item.status === values.status
        }
        if (values.category) {
          match = match && item.category === values.category
        }
        return match
      })
      setList(filtered)
      message.success(`查询到 ${filtered.length} 条记录`)
    }).catch(() => {})
  }

  const handleReset = () => {
    searchForm.resetFields()
    setList(getPersistedData<FileArchiveItem[]>('accept-file') ?? list)
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
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ category: '验收档案' as ACArchiveCategory, status: '待归档' as ACArchiveStatus }}>
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
        <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择类别' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择类别">
            {categoryOptions.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="archiveDate" label="归档日期" rules={[{ required: true, message: '请选择日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="archivist" label="归档人" rules={[{ required: true, message: '请输入归档人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入归档人" />
        </Form.Item>
      </div>
      <Form.Item name="contentSummary" label="内容摘要">
        <TextArea rows={3} placeholder="请输入内容摘要" />
      </Form.Item>
      <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
        <Select placeholder="请选择状态">
          {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
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
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>归档管理</h2>
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
          <Form.Item name="category">
            <Select placeholder="类别" style={{ width: 130 }} allowClear>
              {categoryOptions.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/归档人）" prefix={<SearchOutlined />} style={{ width: 260 }} />
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

      <Modal title="新增归档" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑归档" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="归档详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('类别', descText(currentItem.category)),
            descItem('归档日期', descText(currentItem.archiveDate)),
            descItem('归档人', descText(currentItem.archivist)),
            descItem('内容摘要', descText(currentItem.contentSummary)),
            descItem('状态', <Tag color={archiveStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
          ]
          items.push(descItem('附件清单', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          return items
        })()}
      />
    </div>
  )
}

export default FilePanel
