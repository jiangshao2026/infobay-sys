import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/meetings'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { MeetingItem, DocumentAttachment } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select
const { TextArea } = Input

type OrgMeetingType = '启动会' | '监理例会' | '专题会议' | '技术交底' | '协调会议'
type OrgMeetingStatus = '已安排' | '已召开' | '已取消'

interface OrgMeetingItem {
  key: string
  code: string
  projectCode: string
  title: string
  type: OrgMeetingType
  meetingDate: string
  location: string
  host: string
  attendees: string[]
  topics: string[]
  decisions: string[]
  nextActions: string[]
  status: OrgMeetingStatus
  attachments: DocumentAttachment[]
}

const meetingStatusColor = (status: string): string => {
  switch (status) {
    case '已安排':
      return 'gold'
    case '已召开':
      return 'green'
    case '已取消':
      return 'red'
    default:
      return 'default'
  }
}

const convertLegacyType = (t: string): OrgMeetingType => {
  const map: Record<string, OrgMeetingType> = {
    '监理例会': '监理例会',
    '专题会议': '专题会议',
    '技术交底': '技术交底',
    '协调会议': '协调会议',
  }
  return map[t] || '监理例会'
}

const convertLegacyStatus = (s: string): OrgMeetingStatus => {
  if (s === '已安排') return '已安排'
  if (s === '已取消') return '已取消'
  return '已召开'
}

const normalizeLegacyList = (items: MeetingItem[]): OrgMeetingItem[] =>
  items.map(item => ({
    ...item,
    type: convertLegacyType(item.type),
    status: convertLegacyStatus(item.status),
  }))

function OrgMeeting() {
  const [list, setList] = useState<OrgMeetingItem[]>(normalizeLegacyList(initialData))
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<OrgMeetingItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: OrgMeetingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '主题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: OrgMeetingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '日期',
      dataIndex: 'meetingDate',
      key: 'meetingDate',
      width: 110,
      onCell: (record: OrgMeetingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '参会人员',
      dataIndex: 'attendees',
      key: 'attendees',
      width: 220,
      render: (attendees: string[]) =>
        attendees && attendees.length > 0 ? (
          <Space size={[4, 4]} wrap style={{ maxWidth: 220 }}>
            {attendees.slice(0, 3).map((a, i) => (
              <Tag key={i} color="blue">{a}</Tag>
            ))}
            {attendees.length > 3 && <Tag>{`+${attendees.length - 3}`}</Tag>}
          </Space>
        ) : (
          <span style={{ color: '#bbb' }}>—</span>
        ),
      onCell: (record: OrgMeetingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '会议地点',
      dataIndex: 'location',
      key: 'location',
      width: 220,
      onCell: (record: OrgMeetingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '会议类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: OrgMeetingType) => <Tag color="cyan">{type}</Tag>,
      onCell: (record: OrgMeetingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrgMeetingStatus) => <Tag color={meetingStatusColor(status)}>{status}</Tag>,
      onCell: (record: OrgMeetingItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: OrgMeetingItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.key)}>删除</Button>
        </Space>
      ),
    },
  ]

  const handleView = (record: OrgMeetingItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: OrgMeetingItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      attendees: record.attendees?.join('\n') || '',
      topics: record.topics?.join('\n') || '',
      decisions: record.decisions?.join('\n') || '',
      nextActions: record.nextActions?.join('\n') || '',
      meetingDate: record.meetingDate ? dayjs(record.meetingDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此会议记录吗？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setList(prev => prev.filter(item => item.key !== key))
        message.success('删除成功')
      },
    })
  }

  const showAddModal = () => {
    addForm.resetFields()
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string): OrgMeetingItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    type: values.type as OrgMeetingType,
    meetingDate: values.meetingDate ? values.meetingDate.format('YYYY-MM-DD') : '',
    location: values.location || '',
    host: values.host || '',
    attendees: values.attendees ? String(values.attendees).split(/\r?\n/).filter(Boolean) : [],
    topics: values.topics ? String(values.topics).split(/\r?\n/).filter(Boolean) : [],
    decisions: values.decisions ? String(values.decisions).split(/\r?\n/).filter(Boolean) : [],
    nextActions: values.nextActions ? String(values.nextActions).split(/\r?\n/).filter(Boolean) : [],
    status: values.status as OrgMeetingStatus,
    attachments: values.attachments || [],
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: OrgMeetingItem = normalize(values, Date.now().toString())
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
          item.key === currentItem.key ? normalize(values, currentItem.key) : item
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
      let filtered = normalizeLegacyList(initialData).filter(item => {
        let match = true
        if (values.keyword) {
          const kw = values.keyword.toLowerCase()
          match = match && (
            item.code.toLowerCase().includes(kw) ||
            item.title.toLowerCase().includes(kw) ||
            item.host.toLowerCase().includes(kw)
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
    setList(normalizeLegacyList(initialData))
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
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ type: '监理例会' as OrgMeetingType, status: '已召开' as OrgMeetingStatus }}>
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
      <Form.Item name="title" label="会议标题" rules={[{ required: true, message: '请输入会议标题' }]}>
        <Input placeholder="请输入会议标题" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="type" label="会议类型" rules={[{ required: true, message: '请选择类型' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择类型">
            <Option value="启动会">启动会</Option>
            <Option value="监理例会">监理例会</Option>
            <Option value="专题会议">专题会议</Option>
            <Option value="技术交底">技术交底</Option>
            <Option value="协调会议">协调会议</Option>
          </Select>
        </Form.Item>
        <Form.Item name="meetingDate" label="会议日期" rules={[{ required: true, message: '请选择会议日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="host" label="主持人" rules={[{ required: true, message: '请输入主持人' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入主持人" />
        </Form.Item>
      </div>
      <Form.Item name="location" label="会议地点" rules={[{ required: true, message: '请输入会议地点' }]}>
        <Input placeholder="请输入会议地点" />
      </Form.Item>
      <Form.Item name="attendees" label="参会人员（每行一项）">
        <TextArea rows={3} placeholder="每行一项" />
      </Form.Item>
      <Form.Item name="topics" label="会议议题（每项一行）">
        <TextArea rows={3} placeholder="每行一项" />
      </Form.Item>
      <Form.Item name="decisions" label="会议决议（每项一行）">
        <TextArea rows={3} placeholder="每行一项" />
      </Form.Item>
      <Form.Item name="nextActions" label="后续行动（每项一行）">
        <TextArea rows={3} placeholder="每行一项" />
      </Form.Item>
      <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
        <Select placeholder="请选择状态">
          <Option value="已安排">已安排</Option>
          <Option value="已召开">已召开</Option>
          <Option value="已取消">已取消</Option>
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
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>会议管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增会议</Button>
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
              <Option value="启动会">启动会</Option>
              <Option value="监理例会">监理例会</Option>
              <Option value="专题会议">专题会议</Option>
              <Option value="技术交底">技术交底</Option>
              <Option value="协调会议">协调会议</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="已安排">已安排</Option>
              <Option value="已召开">已召开</Option>
              <Option value="已取消">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/主持人）" prefix={<SearchOutlined />} style={{ width: 260 }} />
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

      <Modal title="新增会议" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑会议" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="会议详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('会议标题', descText(currentItem.title)),
            descItem('类型', <Tag color="cyan">{currentItem.type}</Tag>),
            descItem('会议日期', descText(currentItem.meetingDate)),
            descItem('会议地点', descText(currentItem.location)),
            descItem('主持人', descText(currentItem.host)),
            descItem('状态', <Tag color={meetingStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.attendees && currentItem.attendees.length > 0
              ? descItem('参会人员', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.attendees.map((a, i) => <li key={i}>{a}</li>)}</ul>)
              : null,
            currentItem.topics && currentItem.topics.length > 0
              ? descItem('会议议题', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.topics.map((t, i) => <li key={i}>{t}</li>)}</ul>)
              : null,
            currentItem.decisions && currentItem.decisions.length > 0
              ? descItem('会议决议', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul>)
              : null,
            currentItem.nextActions && currentItem.nextActions.length > 0
              ? descItem('后续行动', <ul style={{ margin: 0, paddingLeft: 20 }}>{currentItem.nextActions.map((n, i) => <li key={i}>{n}</li>)}</ul>)
              : null,
          ].filter(Boolean) as any[]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          return items
        })()}
      />
    </div>
  )
}

export default OrgMeeting
export { OrgMeeting }
