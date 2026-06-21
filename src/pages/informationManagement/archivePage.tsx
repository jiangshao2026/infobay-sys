import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/infoArchives'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { InfoArchiveItem, IMDocCategory, IMArchiveStatus, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly, categoryColor, statusColor } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
const { Option } = Select
const { TextArea } = Input

const ArchivePanel: React.FC = () => {
  const [list, setList] = usePersistedState<FileArchiveItem[]>('info-archive', initialData)
  const { currentUser } = useUser()
const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<InfoArchiveItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: InfoArchiveItem) => ({
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
      onCell: (record: InfoArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      onCell: (record: InfoArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (category: IMDocCategory) => <Tag color={categoryColor()}>{category}</Tag>,
      onCell: (record: InfoArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '归档日期',
      dataIndex: 'archiveDate',
      key: 'archiveDate',
      width: 110,
      onCell: (record: InfoArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '归档人',
      dataIndex: 'archivist',
      key: 'archivist',
      width: 100,
      onCell: (record: InfoArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location',
      width: 180,
      onCell: (record: InfoArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: IMArchiveStatus) => <Tag color={statusColor(status)}>{status}</Tag>,
      onCell: (record: InfoArchiveItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: InfoArchiveItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此归档资料？"
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

  const handleView = (record: InfoArchiveItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: InfoArchiveItem) => {
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
      addAuditLog(currentUser.name, '信息管理', '删除', deletedItem.title, '信息管理归档', `删除归档：${deletedItem.title}（编号：${deletedItem.code}）`)
    }
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): InfoArchiveItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    category: values.category as IMDocCategory,
    archiveDate: values.archiveDate ? values.archiveDate.format('YYYY-MM-DD') : '',
    archivist: values.archivist,
    content: values.content || '',
    location: values.location || '',
    status: values.status as IMArchiveStatus,
    attachments: values.attachments || existingAttachments,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: InfoArchiveItem = normalize(values, Date.now().toString(), [])
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
      addAuditLog(currentUser.name, '信息管理', '新增', values.title || values.code, '信息管理归档', `新增归档：${values.title}（编号：${values.code}）`)
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
        addAuditLog(currentUser.name, '信息管理', '编辑', currentItem.title, '信息管理归档', `编辑归档：${currentItem.title}（编号：${currentItem.code}）`)
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
            item.archivist.toLowerCase().includes(kw)
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
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ category: '合同文件' as IMDocCategory, status: '归档中' as IMArchiveStatus }}>
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
            <Option value="监理规划">监理规划</Option>
            <Option value="实施细则">实施细则</Option>
            <Option value="合同文件">合同文件</Option>
            <Option value="设计文件">设计文件</Option>
            <Option value="会议纪要">会议纪要</Option>
            <Option value="其他">其他</Option>
          </Select>
        </Form.Item>
        <Form.Item name="archiveDate" label="归档日期" rules={[{ required: true, message: '请选择归档日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="archivist" label="归档人" rules={[{ required: true, message: '请输入归档人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入归档人" />
        </Form.Item>
      </div>
      <Form.Item name="location" label="存放位置" rules={[{ required: true, message: '请输入存放位置' }]}>
        <Input placeholder="如 综合档案室 - A区 - 柜03" />
      </Form.Item>
      <Form.Item name="content" label="资料内容说明">
        <TextArea rows={3} placeholder="请输入资料内容说明" />
      </Form.Item>
      <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
        <Select placeholder="请选择状态">
          <Option value="待归档">待归档</Option>
          <Option value="归档中">归档中</Option>
          <Option value="已归档">已归档</Option>
          <Option value="已调阅">已调阅</Option>
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
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>资料归档管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增归档</Button>
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
              <Option value="监理规划">监理规划</Option>
              <Option value="实施细则">实施细则</Option>
              <Option value="合同文件">合同文件</Option>
              <Option value="设计文件">设计文件</Option>
              <Option value="会议纪要">会议纪要</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="待归档">待归档</Option>
              <Option value="归档中">归档中</Option>
              <Option value="已归档">已归档</Option>
              <Option value="已调阅">已调阅</Option>
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
          scroll={{ x: 1700 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增归档资料" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑归档资料" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="归档资料详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('类别', <Tag color={categoryColor()}>{currentItem.category}</Tag>),
            descItem('归档日期', descText(currentItem.archiveDate)),
            descItem('归档人', descText(currentItem.archivist)),
            descItem('存放位置', descText(currentItem.location)),
            descItem('状态', <Tag color={statusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.content ? descItem('资料内容说明', descText(currentItem.content)) : null,
          ].filter(Boolean) as any[]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          return items
        })()}
      />
    </div>
  )
}

export default ArchivePanel
