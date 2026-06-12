import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, DashboardOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import initialProjectData from '../../data/projects'
import type { ProjectItem, ProjectSearchParams } from '../../types/projectManagement'
import { formatCurrency } from '../../utils/format'
import { validateDateRange, parseAmountFromForm, amountToWanyuan } from '../../utils/validation'
import { DetailModal, descItem, descText, descTag, scaleColor, statusColor } from '../../components/DetailModal'
import { CompactTableCssOnly } from '../../components/CompactTable'

const { RangePicker } = DatePicker
const { Option } = Select

function ProjectManagement() {
  const navigate = useNavigate()
  const [projectData, setProjectData] = useState<ProjectItem[]>(initialProjectData)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentProject, setCurrentProject] = useState<ProjectItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '项目编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: ProjectItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      onCell: (record: ProjectItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      onCell: (record: ProjectItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目规模',
      dataIndex: 'scale',
      key: 'scale',
      width: 90,
      render: (scale: string) => descTag(scale, scaleColor),
      onCell: (record: ProjectItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => descTag(status, statusColor),
      onCell: (record: ProjectItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '审批状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 110,
      render: (approvalStatus: string) => descTag(approvalStatus, statusColor),
      onCell: (record: ProjectItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '总投资',
      dataIndex: 'investment',
      key: 'investment',
      width: 90,
      render: (investment: number) => formatCurrency(investment),
      onCell: (record: ProjectItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目经理',
      dataIndex: 'manager',
      key: 'manager',
      width: 90,
      onCell: (record: ProjectItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: unknown, record: ProjectItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<DashboardOutlined />} size="small" onClick={() => navigate(`/project/overview/${record.code}`)} style={{ fontWeight: 500 }}>总览</Button>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.approvalStatus === '待审批' && (
            <>
              <Button type="primary" size="small" onClick={() => handleApprove(record)}>审批通过</Button>
              <Button danger size="small" onClick={() => handleReject(record)}>驳回</Button>
            </>
          )}
          <Popconfirm
            title="确定删除此项目？"
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

  const handleView = (record: ProjectItem) => {
    setCurrentProject(record)
    setIsDetailModalVisible(true)
  }

  const handleApprove = (record: ProjectItem) => {
    Modal.confirm({
      title: '确认审批通过',
      content: `确认通过项目「${record.name}」的审批？`,
      okText: '确认通过',
      cancelText: '取消',
      onOk: () => {
        setProjectData(prev => prev.map(item =>
          item.key === record.key ? { ...item, approvalStatus: '已通过', approver: '管理员' } : item
        ))
        message.success('审批通过')
      },
    })
  }

  const handleReject = (record: ProjectItem) => {
    Modal.confirm({
      title: '确认驳回',
      content: `确认驳回项目「${record.name}」的审批？`,
      okText: '确认驳回',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setProjectData(prev => prev.map(item =>
          item.key === record.key ? { ...item, approvalStatus: '已驳回', approver: '管理员' } : item
        ))
        message.success('已驳回')
      },
    })
  }

  const handleEdit = (record: ProjectItem) => {
    setCurrentProject(record)
    editForm.setFieldsValue({
      ...record,
      investment: amountToWanyuan(record.investment),
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    setProjectData(prev => prev.filter(item => item.key !== key))
    message.success('删除成功')
  }

  const showAddModal = () => {
    setIsAddModalVisible(true)
  }

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const startStr = values.startDate ? values.startDate.format('YYYY-MM-DD') : ''
      const endStr = values.endDate ? values.endDate.format('YYYY-MM-DD') : ''
      const dateCheck = validateDateRange(startStr, endStr)
      if (!dateCheck.valid) {
        message.error(dateCheck.message || '日期校验失败')
        return
      }
      const newProject: ProjectItem = {
        ...values,
        key: Date.now().toString(),
        investment: parseAmountFromForm(values.investment),
        startDate: startStr,
        endDate: endStr,
        approvalStatus: '待审批',
        approver: '',
      }
      setProjectData(prev => [newProject, ...prev])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentProject) {
        const startStr = values.startDate ? values.startDate.format('YYYY-MM-DD') : ''
        const endStr = values.endDate ? values.endDate.format('YYYY-MM-DD') : ''
        const dateCheck = validateDateRange(startStr, endStr)
        if (!dateCheck.valid) {
          message.error(dateCheck.message || '日期校验失败')
          return
        }
        setProjectData(prev => prev.map(item =>
          item.key === currentProject.key ? {
            ...values,
            key: currentProject.key,
            investment: parseAmountFromForm(values.investment),
            startDate: startStr,
            endDate: endStr,
            approvalStatus: currentProject.approvalStatus,
            approver: currentProject.approver,
          } : item
        ))
        setIsEditModalVisible(false)
        editForm.resetFields()
        setCurrentProject(null)
        message.success('修改成功')
      }
    })
  }

  const handleSearch = (values: ProjectSearchParams) => {
    let filtered = initialProjectData.filter(item => {
      let match = true
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        match = match && (item.name.toLowerCase().includes(kw) || item.code.toLowerCase().includes(kw))
      }
      if (values.type) {
        match = match && item.type === values.type
      }
      if (values.status) {
        match = match && item.status === values.status
      }
      if (values.approvalStatus) {
        match = match && item.approvalStatus === values.approvalStatus
      }
      if (values.dateRange && values.dateRange.length === 2) {
        const [start, end] = values.dateRange
        if (start && item.startDate) {
          match = match && item.startDate >= start.format('YYYY-MM-DD')
        }
        if (end && item.endDate) {
          match = match && item.endDate <= end.format('YYYY-MM-DD')
        }
      }
      return match
    })
    setProjectData(filtered)
    message.success(`查询到 ${filtered.length} 条记录`)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setProjectData(initialProjectData)
  }

  const handleCancel = () => {
    setIsAddModalVisible(false)
    setIsEditModalVisible(false)
    setIsDetailModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    setCurrentProject(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>项目管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增项目</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: '16px' }} onFinish={handleSearch}>
          <Form.Item name="keyword">
            <Input placeholder="项目名称/编号" prefix={<SearchOutlined />} style={{ width: '200px' }} />
          </Form.Item>
          <Form.Item name="type">
            <Select placeholder="项目类型" style={{ width: '150px' }}>
              <Option value="信息系统建设">信息系统建设</Option>
              <Option value="平台升级改造">平台升级改造</Option>
              <Option value="智慧监管平台">智慧监管平台</Option>
              <Option value="政务信息系统">政务信息系统</Option>
              <Option value="基础设施建设">基础设施建设</Option>
              <Option value="数字孪生平台">数字孪生平台</Option>
              <Option value="智慧警务系统">智慧警务系统</Option>
              <Option value="数据平台建设">数据平台建设</Option>
              <Option value="智慧城市系统">智慧城市系统</Option>
              <Option value="医疗信息系统">医疗信息系统</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="项目状态" style={{ width: '150px' }} allowClear>
              <Option value="启动阶段">启动阶段</Option>
              <Option value="进行中">进行中</Option>
              <Option value="即将完工">即将完工</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="approvalStatus">
            <Select placeholder="审批状态" style={{ width: '130px' }} allowClear>
              <Option value="待审批">待审批</Option>
              <Option value="已通过">已通过</Option>
              <Option value="已驳回">已驳回</Option>
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
          columns={columns}
          dataSource={projectData}
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 1550 }}
          rowKey="key"
        />
      </Card>

      <Modal
        title="新增项目"
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
              label="项目编号"
              rules={[{ required: true, message: '请输入项目编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入项目编号" />
            </Form.Item>
            <Form.Item
              name="name"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="type"
              label="项目类型"
              rules={[{ required: true, message: '请选择项目类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择项目类型">
                <Option value="信息系统建设">信息系统建设</Option>
                <Option value="平台升级改造">平台升级改造</Option>
                <Option value="智慧监管平台">智慧监管平台</Option>
                <Option value="政务信息系统">政务信息系统</Option>
                <Option value="基础设施建设">基础设施建设</Option>
                <Option value="数字孪生平台">数字孪生平台</Option>
                <Option value="智慧警务系统">智慧警务系统</Option>
                <Option value="数据平台建设">数据平台建设</Option>
                <Option value="智慧城市系统">智慧城市系统</Option>
                <Option value="医疗信息系统">医疗信息系统</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="scale"
              label="项目规模"
              rules={[{ required: true, message: '请选择项目规模' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择项目规模">
                <Option value="大型">大型</Option>
                <Option value="中型">中型</Option>
                <Option value="小型">小型</Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="investment"
              label="总投资（万元）"
              rules={[{ required: true, message: '请输入总投资' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入总投资（万元）" />
            </Form.Item>
            <Form.Item
              name="manager"
              label="项目经理"
              rules={[{ required: true, message: '请输入项目经理' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入项目经理" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="contractor"
              label="施工单位"
              rules={[{ required: true, message: '请输入施工单位' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入施工单位" />
            </Form.Item>
            <Form.Item
              name="supervision"
              label="监理单位"
              initialValue="广东信佰工程咨询有限公司"
              rules={[{ required: true, message: '请输入监理单位' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入监理单位" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="startDate"
              label="开始日期"
              rules={[{ required: true, message: '请选择开始日期' }]}
            >
              <DatePicker />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="结束日期"
              rules={[{ required: true, message: '请选择结束日期' }]}
            >
              <DatePicker />
            </Form.Item>
          </div>
          <Form.Item
            name="location"
            label="项目地点"
          >
            <Input placeholder="请输入项目地点" />
          </Form.Item>
          <Form.Item
            name="owner"
            label="建设单位"
          >
            <Input placeholder="请输入建设单位" />
          </Form.Item>
          <Form.Item
            name="description"
            label="项目描述"
          >
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑项目"
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
              label="项目编号"
              rules={[{ required: true, message: '请输入项目编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入项目编号" />
            </Form.Item>
            <Form.Item
              name="name"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="type"
              label="项目类型"
              rules={[{ required: true, message: '请选择项目类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择项目类型">
                <Option value="信息系统建设">信息系统建设</Option>
                <Option value="平台升级改造">平台升级改造</Option>
                <Option value="智慧监管平台">智慧监管平台</Option>
                <Option value="政务信息系统">政务信息系统</Option>
                <Option value="基础设施建设">基础设施建设</Option>
                <Option value="数字孪生平台">数字孪生平台</Option>
                <Option value="智慧警务系统">智慧警务系统</Option>
                <Option value="数据平台建设">数据平台建设</Option>
                <Option value="智慧城市系统">智慧城市系统</Option>
                <Option value="医疗信息系统">医疗信息系统</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="scale"
              label="项目规模"
              rules={[{ required: true, message: '请选择项目规模' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择项目规模">
                <Option value="大型">大型</Option>
                <Option value="中型">中型</Option>
                <Option value="小型">小型</Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="investment"
              label="总投资（万元）"
              rules={[{ required: true, message: '请输入总投资' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入总投资（万元）" />
            </Form.Item>
            <Form.Item
              name="manager"
              label="项目经理"
              rules={[{ required: true, message: '请输入项目经理' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入项目经理" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="contractor"
              label="施工单位"
              rules={[{ required: true, message: '请输入施工单位' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入施工单位" />
            </Form.Item>
            <Form.Item
              name="supervision"
              label="监理单位"
              rules={[{ required: true, message: '请输入监理单位' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入监理单位" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="startDate"
              label="开始日期"
              rules={[{ required: true, message: '请选择开始日期' }]}
            >
              <DatePicker />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="结束日期"
              rules={[{ required: true, message: '请选择结束日期' }]}
            >
              <DatePicker />
            </Form.Item>
          </div>
          <Form.Item
            name="location"
            label="项目地点"
          >
            <Input placeholder="请输入项目地点" />
          </Form.Item>
          <Form.Item
            name="owner"
            label="建设单位"
          >
            <Input placeholder="请输入建设单位" />
          </Form.Item>
          <Form.Item
            name="description"
            label="项目描述"
          >
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
        </Form>
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="项目详情"
        onClose={() => { setIsDetailModalVisible(false); setCurrentProject(null) }}
        items={(() => {
          if (!currentProject) return []
          const list = [
            descItem('项目编号', descText(currentProject.code)),
            descItem('项目名称', descText(currentProject.name)),
            descItem('项目类型', descText(currentProject.type)),
            descItem('项目规模', descTag(currentProject.scale, scaleColor)),
            descItem('项目状态', descTag(currentProject.status, statusColor)),
            descItem('审批状态', descTag(currentProject.approvalStatus, statusColor)),
            currentProject.approver ? descItem('审批人', descText(currentProject.approver)) : null,
            descItem('总投资', descText(formatCurrency(currentProject.investment))),
            descItem('项目经理', descText(currentProject.manager)),
            descItem('施工单位', descText(currentProject.contractor)),
            descItem('监理单位', descText(currentProject.supervision)),
            descItem('开始日期', descText(currentProject.startDate)),
            descItem('结束日期', descText(currentProject.endDate)),
            descItem('项目地点', descText(currentProject.location)),
            descItem('建设单位', descText(currentProject.owner)),
            currentProject.description ? descItem('项目描述', descText(currentProject.description)) : null,
          ]
          return list.filter(Boolean) as any
        })()}
      />
    </div>
  )
}

export default ProjectManagement
