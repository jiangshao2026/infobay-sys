import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag, Divider } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/supervisors'
import type { SupervisorItem, SPGender, SPEducation, SPTitle, SPPosition, SPStatus, SPCertType, SPCertRef, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'

import { usePersistedState, getPersistedData } from '../../hooks/usePersistedState'
const { Option } = Select
const { TextArea } = Input

const supervisorStatusColor = (status: string): string => {
  switch (status) {
    case '在职':
      return 'green'
    case '离职':
      return 'volcano'
    case '停职':
      return 'orange'
    case '退休':
      return 'default'
    default:
      return 'gray'
  }
}

const genderOptions: SPGender[] = ['男', '女']
const educationOptions: SPEducation[] = ['大专', '本科', '硕士', '博士']
const titleOptions: SPTitle[] = ['助理工程师', '工程师', '高级工程师', '教授级高工']
const positionOptions: SPPosition[] = ['监理员', '专业监理工程师', '总监代表', '总监理工程师']
const statusOptions: SPStatus[] = ['在职', '离职', '停职', '退休']
const certTypeOptions: SPCertType[] = ['信息系统监理师', '信息系统项目管理师', '系统集成项目管理工程师', '系统架构设计师', '软件设计师', '软件造价工程师', '数据库系统工程师', '系统分析师', '其他']

const SupervisorPanel: React.FC = () => {
  const [list, setList] = usePersistedState<SupervisorItem[]>('supervisor-main', initialData)
const { currentUser } = useUser()
const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<SupervisorItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  // 证书维护（作为人员信息属性）：新增/编辑 Modal 内部各维护一份
  const [addCertList, setAddCertList] = useState<SPCertRef[]>([])
  const [editCertList, setEditCertList] = useState<SPCertRef[]>([])
  const [isCertModalVisible, setIsCertModalVisible] = useState(false)
  const [certFormTarget, setCertFormTarget] = useState<'add' | 'edit'>('add')
  const [certForm] = Form.useForm()
  const [certEditingKey, setCertEditingKey] = useState<string | null>(null)

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
      width: 130,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '职务',
      dataIndex: 'position',
      key: 'position',
      width: 140,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '入职日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 110,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 160,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: SPStatus) => <Tag color={supervisorStatusColor(s)}>{s}</Tag>,
      onCell: (record: SupervisorItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: SupervisorItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此监理师信息？"
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

  const handleView = (record: SupervisorItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: SupervisorItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      birthDate: record.birthDate ? dayjs(record.birthDate) : null,
      joinDate: record.joinDate ? dayjs(record.joinDate) : null,
    })
    setEditCertList(record.certificates ? [...record.certificates] : [])
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
  }

  const showAddModal = () => {
    addForm.resetFields()
    setAddCertList([])
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, certificates: SPCertRef[] | undefined): SupervisorItem => ({
    key,
    code: values.code,
    name: values.name || '',
    gender: values.gender as SPGender,
    birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : '',
    phone: values.phone || '',
    email: values.email || '',
    idCard: values.idCard || '',
    education: values.education as SPEducation,
    major: values.major || '',
    title: values.title as SPTitle,
    position: values.position as SPPosition,
    joinDate: values.joinDate ? values.joinDate.format('YYYY-MM-DD') : '',
    department: values.department || '',
    status: values.status as SPStatus,
    description: values.description || '',
    certificates,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: SupervisorItem = normalize(values, Date.now().toString(), addCertList)
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      setAddCertList([])
      message.success('新增成功')
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentItem) {
        setList(prev => { const r = prev.map(item =>
          item.key === currentItem.key ? normalize(values, currentItem.key, editCertList) : item
        ); return r })
        setIsEditModalVisible(false)
        editForm.resetFields()
        setEditCertList([])
        setCurrentItem(null)
        message.success('修改成功')
        addAuditLog(currentUser.name, '监理师管理', '编辑', currentItem.name || currentItem.code, '监理师', `编辑监理师：${currentItem.name}（编号：${currentItem.code}）`)
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
            item.name.toLowerCase().includes(kw) ||
            item.phone.toLowerCase().includes(kw) ||
            item.email.toLowerCase().includes(kw) ||
            item.department.toLowerCase().includes(kw) ||
            item.idCard.toLowerCase().includes(kw)
          )
        }
        if (values.status) {
          match = match && item.status === values.status
        }
        if (values.position) {
          match = match && item.position === values.position
        }
        if (values.title) {
          match = match && item.title === values.title
        }
        return match
      })
      setList(filtered)
      message.success(`查询到 ${filtered.length} 条记录`)
    }).catch(() => {})
  }

  const handleReset = () => {
    searchForm.resetFields()
    setList(getPersistedData<SupervisorItem[]>('supervisor-main') ?? list)
  }

  const handleCancel = () => {
    setIsAddModalVisible(false)
    setIsEditModalVisible(false)
    setIsDetailModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    setAddCertList([])
    setEditCertList([])
    setCurrentItem(null)
    setIsCertModalVisible(false)
    setCertEditingKey(null)
    certForm.resetFields()
  }

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ gender: '男' as SPGender, status: '在职' as SPStatus }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入编号" />
        </Form.Item>
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择性别">
            {genderOptions.map(g => <Option key={g} value={g}>{g}</Option>)}
          </Select>
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="birthDate" label="出生日期" style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="phone" label="电话" rules={[{ required: true, message: '请输入电话' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入电话" />
        </Form.Item>
        <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入邮箱" />
        </Form.Item>
      </div>
      <Form.Item name="idCard" label="身份证号">
        <Input placeholder="请输入身份证号" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="education" label="学历" rules={[{ required: true, message: '请选择学历' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择学历">
            {educationOptions.map(e => <Option key={e} value={e}>{e}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="major" label="专业" style={{ flex: 1 }}>
          <Input placeholder="请输入专业" />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="title" label="职称" rules={[{ required: true, message: '请选择职称' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择职称">
            {titleOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="position" label="职务" rules={[{ required: true, message: '请选择职务' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择职务">
            {positionOptions.map(p => <Option key={p} value={p}>{p}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="joinDate" label="入职日期" style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="department" label="部门" rules={[{ required: true, message: '请输入部门' }]} style={{ flex: 2 }}>
          <Input placeholder="请输入部门" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择状态">
            {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="description" label="个人简介">
        <TextArea rows={3} placeholder="请输入个人简介" />
      </Form.Item>

      <Divider orientation="left" plain style={{ margin: '12px 0' }}>资质证书维护</Divider>

      <div style={{ marginBottom: 12 }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => openCertModal(isEdit ? 'edit' : 'add', null)}>添加证书</Button>
      </div>

      {(() => {
        const certList = isEdit ? editCertList : addCertList
        const setCertList = isEdit ? setEditCertList : setAddCertList
        const columns = [
          { title: '证书类型', dataIndex: 'type', key: 'type', width: 180 },
          { title: '证书编号', dataIndex: 'certificateNo', key: 'certificateNo', width: 180 },
          { title: '颁发日期', dataIndex: 'issueDate', key: 'issueDate', width: 110 },
          { title: '有效期至', dataIndex: 'expiryDate', key: 'expiryDate', width: 110 },
          { title: '颁发机构', dataIndex: 'issueOrganization', key: 'issueOrganization', width: 180 },
          { title: '附件', dataIndex: 'attachments', key: 'attachments', render: (a: DocumentAttachment[] | undefined) => a && a.length > 0 ? <DocumentList documents={a} /> : <span style={{ color: '#999' }}>无</span> },
          {
            title: '操作',
            key: 'action',
            width: 140,
            fixed: 'right' as const,
            render: (_: unknown, record: SPCertRef) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openCertModal(isEdit ? 'edit' : 'add', record)}>编辑</Button>
                <Popconfirm title="确定删除此证书？" onConfirm={() => {
                  setCertList(certList.filter(c => c.key !== record.key))
                  message.success('已删除证书')
                }} okText="确定" cancelText="取消">
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]
        return (
          <Table
            columns={columns}
            dataSource={certList}
            size="small"
            pagination={false}
            rowKey="key"
            locale={{ emptyText: '尚未添加证书' }}
            scroll={{ x: 1060 }}
          />
        )
      })()}
    </Form>
  )

  const openCertModal = (target: 'add' | 'edit', cert: SPCertRef | null) => {
    setCertFormTarget(target)
    setCertEditingKey(cert ? cert.key : null)
    certForm.resetFields()
    if (cert) {
      certForm.setFieldsValue({
        type: cert.type,
        certificateNo: cert.certificateNo,
        issueDate: cert.issueDate ? dayjs(cert.issueDate) : null,
        expiryDate: cert.expiryDate ? dayjs(cert.expiryDate) : null,
        issueOrganization: cert.issueOrganization,
        attachments: cert.attachments || [],
      })
    }
    setIsCertModalVisible(true)
  }

  const handleCertOk = () => {
    certForm.validateFields().then((values: any) => {
      const setCertList = certFormTarget === 'edit' ? setEditCertList : setAddCertList
      const certList = certFormTarget === 'edit' ? editCertList : addCertList
      const newCert: SPCertRef = {
        key: certEditingKey || Date.now().toString(),
        type: values.type,
        certificateNo: values.certificateNo || '',
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : '',
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : '',
        issueOrganization: values.issueOrganization || '',
        attachments: values.attachments || [],
      }
      if (certEditingKey) {
        setCertList(certList.map(c => c.key === certEditingKey ? newCert : c))
        message.success('证书已更新')
        addAuditLog(currentUser.name, '监理师管理', '编辑', newCert.certificateNo || newCert.type, '资质证书', `编辑资质证书：${newCert.type}（编号：${newCert.certificateNo}）`)
      } else {
        setCertList([...certList, newCert])
        message.success('证书已添加')
        addAuditLog(currentUser.name, '监理师管理', '新增', newCert.certificateNo || newCert.type, '资质证书', `新增资质证书：${newCert.type}（编号：${newCert.certificateNo}）`)
      }
      setIsCertModalVisible(false)
      setCertEditingKey(null)
      certForm.resetFields()
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>监理师信息管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="position">
            <Select placeholder="职务" style={{ width: 150 }} allowClear>
              {positionOptions.map(p => <Option key={p} value={p}>{p}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="title">
            <Select placeholder="职称" style={{ width: 140 }} allowClear>
              {titleOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 110 }} allowClear>
              {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（姓名/编号/电话/部门）" prefix={<SearchOutlined />} style={{ width: 280 }} />
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

      <Modal title="新增监理师信息" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={860} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑监理师信息" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={860} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <Modal title={certEditingKey ? '编辑证书' : '添加证书'} open={isCertModalVisible} forceRender onOk={handleCertOk} onCancel={() => { setIsCertModalVisible(false); setCertEditingKey(null); certForm.resetFields() }} width={640} okText="确定" cancelText="取消">
        <Form form={certForm} layout="vertical">
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
            <Form.Item name="issueDate" label="颁发日期" rules={[{ required: true, message: '请选择颁发日期' }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="expiryDate" label="有效期至" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="issueOrganization" label="颁发机构" rules={[{ required: true, message: '请输入颁发机构' }]}>
            <Input placeholder="请输入颁发机构" />
          </Form.Item>
          <Form.Item name="attachments" label="证书附件（可上传扫描件/照片）">
            <DocumentUploader
              value={certForm.getFieldValue('attachments') || []}
              onChange={(docs) => certForm.setFieldsValue({ attachments: docs })}
            />
          </Form.Item>
        </Form>
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="监理师详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('姓名', descText(currentItem.name)),
            descItem('性别', descText(currentItem.gender)),
            descItem('出生日期', descText(currentItem.birthDate)),
            descItem('电话', descText(currentItem.phone)),
            descItem('邮箱', descText(currentItem.email)),
            descItem('身份证号', descText(currentItem.idCard)),
            descItem('学历', descText(currentItem.education)),
            descItem('专业', descText(currentItem.major)),
            descItem('职称', descText(currentItem.title)),
            descItem('职务', descText(currentItem.position)),
            descItem('入职日期', descText(currentItem.joinDate)),
            descItem('部门', descText(currentItem.department)),
            descItem('状态', <Tag color={supervisorStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            descItem('个人简介', descText(currentItem.description)),
          ]
          if (currentItem.certificates && currentItem.certificates.length > 0) {
            const certNodes = currentItem.certificates.map(c => (
              <div key={c.key} style={{ border: '1px solid #f0f0f0', borderRadius: 4, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ color: '#1677ff' }}>{c.type}</strong>
                  <span style={{ color: '#666' }}>编号：{c.certificateNo}</span>
                </div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                  颁发日期：{c.issueDate} &nbsp;|&nbsp; 有效期至：{c.expiryDate || '长期'} &nbsp;|&nbsp; 颁发机构：{c.issueOrganization}
                </div>
                {c.attachments && c.attachments.length > 0 ? (
                  <div style={{ fontSize: 13 }}>附件：<DocumentList documents={c.attachments} /></div>
                ) : null}
              </div>
            ))
            items.push({
              key: 'certificates',
              label: '资质证书',
              children: certNodes,
            })
          }
          return items
        })()}
      />
    </div>
  )
}

export default SupervisorPanel
