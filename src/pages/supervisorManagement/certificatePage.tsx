import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/supervisorCertificates'
import initialSupervisors from '../../data/supervisors'
import type { SupervisorCertificateItem, SPCertType, SPCertStatus, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly, typeColor, statusColor } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select

const certTypeOptions: SPCertType[] = ['信息系统监理师', '信息系统项目管理师', '系统集成项目管理工程师', '系统架构设计师', '软件设计师', '软件造价工程师', '数据库系统工程师', '系统分析师', '其他']
const certStatusOptions: SPCertStatus[] = ['有效', '即将到期', '已过期', '已注销']

const getSupervisorNameByCode = (code: string): string => {
  const supervisor = initialSupervisors.find(s => s.code === code)
  return supervisor ? supervisor.name : code
}

const CertificatePanel: React.FC = () => {
  const [list, setList] = useState<SupervisorCertificateItem[]>(initialData)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<SupervisorCertificateItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      onCell: (record: SupervisorCertificateItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '所属监理师',
      dataIndex: 'supervisorCode',
      key: 'supervisorCode',
      width: 130,
      render: (code: string) => descText(getSupervisorNameByCode(code)),
      onCell: (record: SupervisorCertificateItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '证书类型',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      render: (t: string) => <Tag color={typeColor()}>{t}</Tag>,
      onCell: (record: SupervisorCertificateItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '证书编号',
      dataIndex: 'certificateNo',
      key: 'certificateNo',
      width: 160,
      onCell: (record: SupervisorCertificateItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '颁发日期',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 110,
      onCell: (record: SupervisorCertificateItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '有效期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 110,
      onCell: (record: SupervisorCertificateItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '颁发机构',
      dataIndex: 'issueOrganization',
      key: 'issueOrganization',
      width: 220,
      onCell: (record: SupervisorCertificateItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: SPCertStatus) => <Tag color={statusColor(s)}>{s}</Tag>,
      onCell: (record: SupervisorCertificateItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: SupervisorCertificateItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此证书信息？"
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

  const handleView = (record: SupervisorCertificateItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: SupervisorCertificateItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      issueDate: record.issueDate ? dayjs(record.issueDate) : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
      attachment: record.attachment || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => prev.filter(item => item.key !== key))
    message.success('删除成功')
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = []): SupervisorCertificateItem => {
    const supCode: string = values.supervisorCode || ''
    const supervisor = initialSupervisors.find(s => s.code === supCode)
    return {
      key,
      code: values.code,
      supervisorCode: supCode,
      name: supervisor?.name || '',
      type: values.type as SPCertType,
      certificateNo: values.certificateNo || '',
      issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : '',
      expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : '',
      issueOrganization: values.issueOrganization || '',
      status: values.status as SPCertStatus,
      attachment: values.attachment || existingAttachments,
    }
  }

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: SupervisorCertificateItem = normalize(values, Date.now().toString(), [])
      setList(prev => [newItem, ...prev])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentItem) {
        setList(prev => prev.map(item =>
          item.key === currentItem.key ? normalize(values, currentItem.key, currentItem.attachment || []) : item
        ))
        setIsEditModalVisible(false)
        editForm.resetFields()
        setCurrentItem(null)
        message.success('修改成功')
      }
    })
  }

  const handleSearch = () => {
    searchForm.validateFields().then(values => {
      let filtered = initialData.filter(item => {
        let match = true
        if (values.keyword) {
          const kw = values.keyword.toLowerCase()
          const supName = getSupervisorNameByCode(item.supervisorCode).toLowerCase()
          match = match && (
            item.code.toLowerCase().includes(kw) ||
            item.certificateNo.toLowerCase().includes(kw) ||
            item.issueOrganization.toLowerCase().includes(kw) ||
            supName.includes(kw)
          )
        }
        if (values.supervisorCode) {
          match = match && item.supervisorCode === values.supervisorCode
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
    setList(initialData)
  }

  const handleCancel = () => {
    setIsAddModalVisible(false)
    setIsEditModalVisible(false)
    setIsDetailModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    setCurrentItem(null)
  }

  const supervisorOptions = initialSupervisors.map(s => (
    <Option key={s.code} value={s.code}>{s.name}（{s.code}）</Option>
  ))

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ status: '有效' as SPCertStatus }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入编号" />
        </Form.Item>
        <Form.Item name="supervisorCode" label="所属监理师" rules={[{ required: true, message: '请选择监理师' }]} style={{ flex: 2 }}>
          <Select placeholder="请选择监理师" showSearch optionFilterProp="children">
            {supervisorOptions}
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="type" label="证书类型" rules={[{ required: true, message: '请选择证书类型' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择证书类型">
            {certTypeOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="certificateNo" label="证书编号" rules={[{ required: true, message: '请输入证书编号' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入证书编号" />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="issueDate" label="颁发日期" style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="expiryDate" label="有效期" style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="issueOrganization" label="颁发机构" rules={[{ required: true, message: '请输入颁发机构' }]} style={{ flex: 2 }}>
          <Input placeholder="请输入颁发机构" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            {certStatusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="attachment" label="附件（证书扫描件）">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>监理师资质证书管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="supervisorCode">
            <Select placeholder="监理师" style={{ width: 220 }} allowClear showSearch optionFilterProp="children">
              {supervisorOptions}
            </Select>
          </Form.Item>
          <Form.Item name="type">
            <Select placeholder="证书类型" style={{ width: 150 }} allowClear>
              {certTypeOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              {certStatusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/证书编号/机构）" prefix={<SearchOutlined />} style={{ width: 280 }} />
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

      <Modal title="新增资质证书" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑资质证书" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="资质证书详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属监理师', descText(getSupervisorNameByCode(currentItem.supervisorCode))),
            descItem('证书类型', <Tag color={typeColor()}>{currentItem.type}</Tag>),
            descItem('证书编号', descText(currentItem.certificateNo)),
            descItem('颁发日期', descText(currentItem.issueDate)),
            descItem('有效期', descText(currentItem.expiryDate)),
            descItem('颁发机构', descText(currentItem.issueOrganization)),
            descItem('状态', <Tag color={statusColor(currentItem.status)}>{currentItem.status}</Tag>),
          ]
          items.push(descItem('附件清单', <DocumentList documents={currentItem.attachment || []} showDownload={false} />))
          return items
        })()}
      />
    </div>
  )
}

export default CertificatePanel
