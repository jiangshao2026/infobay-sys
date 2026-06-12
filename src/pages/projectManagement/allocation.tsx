import { Card, Table, Button, Tag, Input, Select, DatePicker, Modal, Form, message, Space } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import {
  DetailModal,
  descItem,
  descText,
  descTag,
  statusColor,
  priorityColor,
} from '../../components/DetailModal'
import { CompactTableCssOnly } from '../../components/CompactTable'
import initialAllocationData from '../../data/allocations'
import projectsData, { getProjectNameByCode } from '../../data/projects'
import type { AllocationItem, AllocationSearchParams } from '../../types/projectManagement'
import { validateDateRange } from '../../utils/validation'

const { RangePicker } = DatePicker
const { Option } = Select

const ASSIGNEE_OPTIONS = ['韦江腾', '李文海', '黄志强', '滕海燕', '张建华', '吴国栋', '郑慧敏', '冯志华']

function Allocation() {
  const [allocationList, setAllocationList] = useState<AllocationItem[]>(initialAllocationData)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentAllocation, setCurrentAllocation] = useState<AllocationItem | null>(null)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const handleSearch = (values: AllocationSearchParams) => {
    const filtered = initialAllocationData.filter(item => {
      let match: boolean = true
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        const kwMatch =
          (item.taskName && item.taskName.toLowerCase().includes(kw)) ||
          (item.code && item.code.toLowerCase().includes(kw))
        match = match && Boolean(kwMatch)
      }
      if (values.projectCode) match = match && item.projectCode === values.projectCode
      if (values.assignee) match = match && item.assignee === values.assignee
      if (values.dateRange && values.dateRange.length === 2) {
        const [start, end] = values.dateRange
        if (start) {
          match = match && item.startDate >= start.format('YYYY-MM-DD')
        }
        if (end) {
          match = match && item.endDate <= end.format('YYYY-MM-DD')
        }
      }
      return match
    })
    setAllocationList(filtered)
    message.success(`查询到 ${filtered.length} 条记录`)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setAllocationList(initialAllocationData)
  }

  const handleView = (record: AllocationItem) => {
    setCurrentAllocation(record)
    setIsDetailModalVisible(true)
  }

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: AllocationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目编号',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 140,
      onCell: (record: AllocationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目名称',
      key: 'projectName',
      width: 220,
      render: (_: unknown, record: AllocationItem) => getProjectNameByCode(record.projectCode),
      onCell: (record: AllocationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 180,
      onCell: (record: AllocationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 100,
      render: (assignee: string) => (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: '8px' }} />
          {assignee}
        </span>
      ),
      onCell: (record: AllocationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      onCell: (record: AllocationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      onCell: (record: AllocationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: string) => (
        <Tag color={priorityColor(priority)}>{priority}</Tag>
      ),
      onCell: (record: AllocationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColor(status)}>{status}</Tag>
      ),
      onCell: (record: AllocationItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: AllocationItem) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
        </Space>
      ),
    },
  ]

  const showAddModal = () => {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const num = String(allocationList.length + 1).padStart(4, '0')
    const autoCode = `TA-${year}-${month}-${num}`
    addForm.setFieldsValue({ code: autoCode, status: '进行中' })
    setIsAddModalVisible(true)
  }

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const startDateStr = values.startDate ? values.startDate.format('YYYY-MM-DD') : ''
      const endDateStr = values.endDate ? values.endDate.format('YYYY-MM-DD') : ''
      const dateCheck = validateDateRange(startDateStr, endDateStr)
      if (!dateCheck.valid) {
        message.error(dateCheck.message || '日期校验失败')
        return
      }
      const newAllocation: AllocationItem = {
        key: Date.now().toString(),
        code: values.code,
        projectCode: values.projectCode,
        taskName: values.taskName,
        assignee: values.assignee,
        startDate: startDateStr,
        endDate: endDateStr,
        status: values.status || '进行中',
        priority: values.priority,
        description: values.description,
      }
      setAllocationList(prev => [newAllocation, ...prev])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('任务分配成功')
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentAllocation) {
        const startDateStr = values.startDate ? values.startDate.format('YYYY-MM-DD') : ''
        const endDateStr = values.endDate ? values.endDate.format('YYYY-MM-DD') : ''
        const dateCheck = validateDateRange(startDateStr, endDateStr)
        if (!dateCheck.valid) {
          message.error(dateCheck.message || '日期校验失败')
          return
        }
        setAllocationList(prev => prev.map(item =>
          item.key === currentAllocation.key ? {
            ...item,
            code: values.code,
            projectCode: values.projectCode,
            taskName: values.taskName,
            assignee: values.assignee,
            priority: values.priority,
            status: values.status,
            startDate: startDateStr,
            endDate: endDateStr,
            description: values.description,
          } : item
        ))
        setIsEditModalVisible(false)
        editForm.resetFields()
        setCurrentAllocation(null)
        message.success('修改成功')
      }
    })
  }

  const handleEdit = (record: AllocationItem) => {
    setCurrentAllocation(record)
    editForm.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
    })
    setIsEditModalVisible(true)
  }

  const handleCancel = () => {
    setIsAddModalVisible(false)
    setIsEditModalVisible(false)
    setIsDetailModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    setCurrentAllocation(null)
  }

  const projectSelectOptions = projectsData.map(p => (
    <Option key={p.code} value={p.code}>{p.code} - {p.name}</Option>
  ))

  const projectSearchOptions = projectsData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  const assigneeOptions = ASSIGNEE_OPTIONS.map(name => (
    <Option key={name} value={name}>{name}</Option>
  ))

  const detailItems = currentAllocation
    ? [
        descItem('任务编号', descText(currentAllocation.code)),
        descItem('任务名称', descText(currentAllocation.taskName)),
        descItem('项目编号', descText(currentAllocation.projectCode)),
        descItem('项目名称', descText(getProjectNameByCode(currentAllocation.projectCode))),
        descItem('负责人', descText(currentAllocation.assignee)),
        descItem('优先级', descTag(currentAllocation.priority, priorityColor)),
        descItem('状态', descTag(currentAllocation.status, statusColor)),
        descItem('开始日期', descText(currentAllocation.startDate)),
        descItem('结束日期', descText(currentAllocation.endDate)),
        descItem('任务描述', descText(currentAllocation.description)),
      ]
    : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>任务分配</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增任务</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: '16px' }} onFinish={handleSearch}>
          <Form.Item name="keyword">
            <Input placeholder="任务名称/编号" prefix={<SearchOutlined />} style={{ width: '200px' }} />
          </Form.Item>
          <Form.Item name="projectCode">
            <Select placeholder="项目名称" style={{ width: '220px' }} showSearch optionFilterProp="children">
              {projectSearchOptions}
            </Select>
          </Form.Item>
          <Form.Item name="assignee">
            <Select placeholder="负责人" style={{ width: '150px' }} allowClear>
              {assigneeOptions}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker placeholder={['开始日期', '结束日期']} />
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
          dataSource={allocationList}
          columns={columns}
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 1700 }}
          rowKey="key"
        />
      </Card>

      <Modal
        title="新增任务分配"
        open={isAddModalVisible}
        forceRender
        onOk={handleAddOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form form={addForm} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="code"
              label="任务编号"
              rules={[{ required: true, message: '请输入任务编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="系统自动生成" disabled />
            </Form.Item>
            <Form.Item
              name="taskName"
              label="任务名称"
              rules={[{ required: true, message: '请输入任务名称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入任务名称" />
            </Form.Item>
          </div>
          <Form.Item
            name="projectCode"
            label="关联项目"
            rules={[{ required: true, message: '请选择关联项目' }]}
          >
            <Select placeholder="请选择项目" showSearch optionFilterProp="children">
              {projectSelectOptions}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="assignee"
              label="负责人"
              rules={[{ required: true, message: '请选择负责人' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择负责人">
                {assigneeOptions}
              </Select>
            </Form.Item>
            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择优先级">
                <Option value="高">高</Option>
                <Option value="中">中</Option>
                <Option value="低">低</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="status"
            label="任务状态"
            rules={[{ required: true, message: '请选择任务状态' }]}
          >
            <Select placeholder="请选择任务状态">
              <Option value="待启动">待启动</Option>
              <Option value="进行中">进行中</Option>
              <Option value="即将完工">即将完工</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="startDate"
              label="开始日期"
              rules={[{ required: true, message: '请选择开始日期' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="结束日期"
              rules={[{ required: true, message: '请选择结束日期' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item
            name="description"
            label="任务描述"
          >
            <Input.TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑任务分配"
        open={isEditModalVisible}
        forceRender
        onOk={handleEditOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="code"
              label="任务编号"
              rules={[{ required: true, message: '请输入任务编号' }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="taskName"
              label="任务名称"
              rules={[{ required: true, message: '请输入任务名称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入任务名称" />
            </Form.Item>
          </div>
          <Form.Item
            name="projectCode"
            label="关联项目"
            rules={[{ required: true, message: '请选择关联项目' }]}
          >
            <Select placeholder="请选择项目" showSearch optionFilterProp="children">
              {projectSelectOptions}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="assignee"
              label="负责人"
              rules={[{ required: true, message: '请选择负责人' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择负责人">
                {assigneeOptions}
              </Select>
            </Form.Item>
            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择优先级">
                <Option value="高">高</Option>
                <Option value="中">中</Option>
                <Option value="低">低</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="status"
            label="任务状态"
            rules={[{ required: true, message: '请选择任务状态' }]}
          >
            <Select placeholder="请选择任务状态">
              <Option value="待启动">待启动</Option>
              <Option value="进行中">进行中</Option>
              <Option value="即将完工">即将完工</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="startDate"
              label="开始日期"
              rules={[{ required: true, message: '请选择开始日期' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="结束日期"
              rules={[{ required: true, message: '请选择结束日期' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item
            name="description"
            label="任务描述"
          >
            <Input.TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
        </Form>
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="任务详情"
        items={detailItems}
        onClose={handleCancel}
      />
    </div>
  )
}

export default Allocation
