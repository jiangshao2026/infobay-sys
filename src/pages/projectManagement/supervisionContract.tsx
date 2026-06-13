import { Card, Table, Button, Tag, Input, Select, DatePicker, Modal, Form, message, Space, Progress, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, WalletOutlined, EyeOutlined, CheckCircleOutlined, DownloadOutlined, PrinterOutlined, RobotOutlined } from '@ant-design/icons'
import React, { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { DocumentUploader } from '../../components/DocumentUploader'
import type { DocumentAttachment } from '../../types/projectManagement'

import initialContractData from '../../data/contracts'
import projectsData, { getProjectNameByCode } from '../../data/projects'
import { getReceivedAmountByContractCode } from '../../data/payments'
import type { ContractItem, ContractSearchParams, ContractStatus } from '../../types/projectManagement'
import { formatCurrency } from '../../utils/format'
import { validateContractAmount, validateContractDates, parseAmountFromForm, amountToWanyuan } from '../../utils/validation'
import { DetailModal, descItem, descText, descTag, descProgress, descAttachments, statusColor } from '../../components/DetailModal'
import { CompactTableCssOnly } from '../../components/CompactTable'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS, type ApprovalRecord, exportDocument, printDocument } from '../../components/ReviewFlow'
import { useUser } from '../../context/UserContext'
import { useAppData } from '../../context/AppDataContext'

const { RangePicker } = DatePicker
const { Option } = Select

function SupervisionContract() {
  const { currentUser } = useUser()
  // 从全局 Context 获取数据源
  const { contractList: globalContractList, setContractList, updateContractStatus, contractApprovalMap, addContractApproval } = useAppData()
  // 搜索条件（null 表示展示全部）
  const [searchParams, setSearchParams] = useState<ContractSearchParams | null>(null)
  // 展示列表：基于全局数据 + 搜索条件实时计算，确保状态变更后立即反映
  const displayList = useMemo(() => {
    if (!searchParams) return globalContractList
    return globalContractList.filter(item => {
      if (searchParams.keyword) {
        const kw = searchParams.keyword.toLowerCase()
        if (!item.code.toLowerCase().includes(kw) && !item.name.toLowerCase().includes(kw)) {
          return false
        }
      }
      if (searchParams.projectCode && item.projectCode !== searchParams.projectCode) {
        return false
      }
      if (searchParams.status && item.status !== searchParams.status) {
        return false
      }
      if (searchParams.signDateRange && searchParams.signDateRange[0] && searchParams.signDateRange[1]) {
        const itemDate = dayjs(item.signDate)
        const start = searchParams.signDateRange[0]
        const end = searchParams.signDateRange[1]
        if (itemDate.isBefore(start, 'day') || itemDate.isAfter(end, 'day')) {
          return false
        }
      }
      return true
    })
  }, [globalContractList, searchParams])

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentContract, setCurrentContract] = useState<ContractItem | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [fileList, setFileList] = useState<DocumentAttachment[]>([])
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [currentEditContract, setCurrentEditContract] = useState<ContractItem | null>(null)
  const [editForm] = Form.useForm()
  const [editFileList, setEditFileList] = useState<DocumentAttachment[]>([])
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)

  // 销售发起审批的弹窗状态
  const [isSalesInitiateVisible, setIsSalesInitiateVisible] = useState(false)
  const [salesInitiateForm] = Form.useForm()
  const [aiReviewing, setAiReviewing] = useState(false)
  const [aiReviewResult, setAiReviewResult] = useState<string[] | null>(null)
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('')

  const handleSearch = (values: ContractSearchParams) => {
    // 保存搜索条件，displayList 会通过 useMemo 自动重新计算
    setSearchParams(values)
  }

  const handleReset = () => {
    searchForm.resetFields()
    // 清除搜索条件，展示全部数据
    setSearchParams(null)
  }

  const handleView = (record: ContractItem) => {
    setCurrentContract(record)
    setIsDetailModalVisible(true)
  }

  const showModal = () => {
    const now = dayjs()
    const yearMonth = now.format('YYYY-MM')
    const seqNum = String(initialContractData.length + 1).padStart(4, '0')
    const newCode = `SJ-${yearMonth}-${seqNum}`
    form.setFieldsValue({ code: newCode })
    setIsModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      const formatted = { ...values }
      if (formatted.signDate && typeof formatted.signDate !== 'string') {
        formatted.signDate = dayjs(formatted.signDate).format('YYYY-MM-DD')
      }
      if (formatted.startDate && typeof formatted.startDate !== 'string') {
        formatted.startDate = dayjs(formatted.startDate).format('YYYY-MM-DD')
      }
      if (formatted.endDate && typeof formatted.endDate !== 'string') {
        formatted.endDate = dayjs(formatted.endDate).format('YYYY-MM-DD')
      }

      const amountInYuan = parseAmountFromForm(values.amount)
      const projectCode = values.projectCode
      const signDate = formatted.signDate
      const startDate = formatted.startDate
      const endDate = formatted.endDate

      const amountCheck = validateContractAmount({ amount: amountInYuan, projectCode }, projectsData)
      if (!amountCheck.valid) {
        message.error(amountCheck.message || '合同金额校验失败')
        return
      }
      const dateCheck = validateContractDates(signDate, startDate, endDate)
      if (!dateCheck.valid) {
        message.error(dateCheck.message || '日期校验失败')
        return
      }

      const newContract: ContractItem = {
        ...formatted,
        amount: amountInYuan,
        key: Date.now().toString(),
        status: '待审批',
        progress: 0,
        attachments: fileList.map(f => ({ name: f.name, url: f.url || '#' })),
      }
      setContractList([newContract, ...globalContractList])
      setIsModalVisible(false)
      form.resetFields()
      setFileList([])
      message.success('合同新增成功')
    })
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const handleEdit = (record: ContractItem) => {
    setCurrentEditContract(record)
    editForm.setFieldsValue({
      code: record.code,
      name: record.name,
      projectCode: record.projectCode,
      amount: amountToWanyuan(record.amount),
      partyA: record.partyA,
      partyB: record.partyB,
      signDate: record.signDate ? dayjs(record.signDate) : null,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
    })
    setEditFileList((record.attachments || []).map((f, i) => ({
      key: String(i),
      name: f.name,
      url: f.url,
      uploadedBy: '历史数据',
      uploadDate: '',
      type: '合同附件',
      size: 0,
    })))
    setIsEditModalVisible(true)
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentEditContract) {
        const formatted = { ...values }
        if (formatted.signDate && typeof formatted.signDate !== 'string') {
          formatted.signDate = dayjs(formatted.signDate).format('YYYY-MM-DD')
        }
        if (formatted.startDate && typeof formatted.startDate !== 'string') {
          formatted.startDate = dayjs(formatted.startDate).format('YYYY-MM-DD')
        }
        if (formatted.endDate && typeof formatted.endDate !== 'string') {
          formatted.endDate = dayjs(formatted.endDate).format('YYYY-MM-DD')
        }

        const amountInYuan = parseAmountFromForm(values.amount)
        const projectCode = values.projectCode
        const signDate = formatted.signDate
        const startDate = formatted.startDate
        const endDate = formatted.endDate

        const amountCheck = validateContractAmount({ amount: amountInYuan, projectCode }, projectsData)
        if (!amountCheck.valid) {
          message.error(amountCheck.message || '合同金额校验失败')
          return
        }
        const dateCheck = validateContractDates(signDate, startDate, endDate)
        if (!dateCheck.valid) {
          message.error(dateCheck.message || '日期校验失败')
          return
        }

        const updatedContract: ContractItem = {
          ...formatted,
          amount: amountInYuan,
          key: currentEditContract.key,
          status: currentEditContract.status,
          progress: currentEditContract.progress,
          attachments: editFileList.map((f: any) => ({ name: f.name, url: f.url || '#' })),
        }
        setContractList(globalContractList.map(item =>
          item.key === currentEditContract.key ? updatedContract : item
        ))
        setIsEditModalVisible(false)
        editForm.resetFields()
        setEditFileList([])
        setCurrentEditContract(null)
        message.success('合同修改成功')
      }
    })
  }

  const handleEditCancel = () => {
    setIsEditModalVisible(false)
    editForm.resetFields()
    setEditFileList([])
    setCurrentEditContract(null)
  }

  const handleVoid = (record: ContractItem) => {
    Modal.confirm({
      title: '确认作废',
      content: `确认作废合同「${record.name}」吗？作废后不可恢复。`,
      okText: '确认作废',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        updateContractStatus(record.key, '已作废')
        message.success('合同已作废')
      },
    })
  }

  const handleReceive = (record: ContractItem) => {
    const currentProgress = record.progress
    const newProgress = Math.min(currentProgress + 25, 100)
    Modal.confirm({
      title: '确认收款',
      content: `确认合同「${record.name}」收到一笔款项？当前进度 ${currentProgress}%，操作后进度将更新为 ${newProgress}%。`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        updateContract(record.key, {
          progress: newProgress,
          status: newProgress >= 100 ? '已完成' : record.status
        })
        message.success('收款记录已更新')
      },
    })
  }

  // 根据合同状态判断当前审批级别（1=销售发起，2=总监理工程师，3=部门经理，4=副总经理）
  const getCurrentApprovalLevel = (status: string): number => {
    switch (status) {
      case '待审批': return 1
      case '待总监理工程师审批': return 2
      case '待部门经理审批': return 3
      case '待分管副总经理审批': return 4
      default: return 0
    }
  }

  // 根据合同状态判断用户是否可以操作
  const canApprove = (status: string): boolean => {
    const level = getCurrentApprovalLevel(status)
    if (level === 0) return false
    const roles = APPROVAL_CHAINS.CONTRACT.roles || []
    const expectedRole = roles[level - 1]
    return currentUser.role === expectedRole
  }

  // 点击"发起审批"或"审批"按钮
  const handleReview = (record: ContractItem) => {
    setCurrentContract(record)
    const level = getCurrentApprovalLevel(record.status)
    if (level === 1) {
      // 销售发起审批：打开专用弹窗（含总监理工程师选择+AI审核）
      salesInitiateForm.resetFields()
      setAiReviewResult(null)
      setSelectedSupervisor('')
      setIsSalesInitiateVisible(true)
    } else {
      // 后续审批级别：打开标准审批弹窗
      setIsReviewModalVisible(true)
    }
  }

  // AI智能审核：15秒后返回模拟审核意见
  const handleAiReview = () => {
    salesInitiateForm.validateFields().then(() => {
      setAiReviewing(true)
      setAiReviewResult(null)
      setTimeout(() => {
        const results = [
          '项目首付款低于合同总金额30%，注意项目收款风险。建议增加付款保函或阶段性验收条款。',
          '违约条款甲乙双方不对等，注意项目违约风险。建议增加违约责任对等条款。',
          '监理服务范围描述过于宽泛，建议明确各阶段具体服务内容及交付物清单。',
          '合同工期与项目计划存在偏差，建议明确工期计算方式及工期延误处理机制。',
          '质量验收标准不够明确，建议补充各分项工程的验收标准与检测方法。',
        ]
        // 随机选 2-3 条审核意见
        const shuffled = results.sort(() => Math.random() - 0.5)
        const count = 2 + Math.floor(Math.random() * 2)
        setAiReviewResult(shuffled.slice(0, count))
        setAiReviewing(false)
      }, 15000) // 15秒模拟AI审核
    }).catch(() => {
      // 验证失败（例如未选择总监理工程师或未填意见）
    })
  }

  // 销售确认提交审批
  const handleSalesInitiateSubmit = () => {
    if (!currentContract) return
    const key = currentContract.key
    const values = salesInitiateForm.getFieldsValue()
    const supervisor = values.supervisor || selectedSupervisor
    const comment = values.comment || '合同条款已审核，同意提交审批。'

    // 记录销售发起的审批记录（级别1）
    const newRecord: ApprovalRecord = {
      key: `${key}-1`,
      code: `${currentContract.code}-R1`,
      level: 1,
      reviewer: currentUser.name,
      status: '通过',
      comment: `${comment}【已分配总监理工程师：${supervisor}】`,
      date: new Date().toLocaleString('zh-CN'),
    }
    addContractApproval(key, newRecord)

    // 更新合同状态为"待总监理工程师审批"
    updateContractStatus(key, '待总监理工程师审批')
    setIsSalesInitiateVisible(false)
    setAiReviewResult(null)
    message.success(`已发起审批，合同已提交至总监理工程师（${supervisor}）`)
  }

  // 标准审批提交（级别2/3/4）
  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string }) => {
    if (!currentContract) return
    const key = currentContract.key
    const status = currentContract.status
    const existingRecords = contractApprovalMap[key] || []
    const currentLevel = getCurrentApprovalLevel(status)
    const chain = APPROVAL_CHAINS.CONTRACT
    const chainLevels = chain.levels.length
    const nextStatusList = chain.nextStatus || []

    const newRecord: ApprovalRecord = {
      key: `${key}-${currentLevel}`,
      code: `${currentContract.code}-R${currentLevel}`,
      level: currentLevel,
      reviewer: payload.reviewer,
      status: payload.status,
      comment: payload.comment,
      date: new Date().toLocaleString('zh-CN'),
    }
    addContractApproval(key, newRecord)

    if (payload.status === '通过') {
      const nextStatus = nextStatusList[currentLevel - 1]
      if (currentLevel >= chainLevels || !nextStatus) {
        // 最后一级通过
        updateContractStatus(key, '已审批')
        message.success('终审通过，合同审批完成')
      } else {
        // 进入下一级
        updateContractStatus(key, nextStatus as ContractStatus)
        message.success(`审批通过，已提交至下一审批节点：${chain.levels[currentLevel] || '下一级'}`)
      }
    } else {
      updateContractStatus(key, '已驳回')
      message.success('审批已驳回')
    }
    setIsReviewModalVisible(false)
  }

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      onCell: (record: ContractItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '合同名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      onCell: (record: ContractItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目名称',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 180,
      render: (projectCode: string) => getProjectNameByCode(projectCode),
      onCell: (record: ContractItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '合同金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      render: (amount: number) => formatCurrency(amount),
      onCell: (record: ContractItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '签订日期',
      dataIndex: 'signDate',
      key: 'signDate',
      width: 120,
      onCell: (record: ContractItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '甲方',
      dataIndex: 'partyA',
      key: 'partyA',
      width: 150,
      onCell: (record: ContractItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '乙方',
      dataIndex: 'partyB',
      key: 'partyB',
      width: 120,
      onCell: (record: ContractItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number) => (
        <Progress percent={progress} size="small" style={{ maxWidth: 260 }} />
      ),
      onCell: (record: ContractItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ContractStatus) => (
        <Tag color={statusColor(status)}>{status}</Tag>
      ),
      onCell: (record: ContractItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 340,
      fixed: 'right' as const,
      render: (_: unknown, record: ContractItem) => {
        const isInApproval = getCurrentApprovalLevel(record.status) > 0
        return (
          <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>修改</Button>
            {/* 销售才能看到"发起审批" */}
            {record.status === '待审批' && currentUser.role === '销售' && (
              <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>发起审批</Button>
            )}
            {/* 待总监理工程师审批：只有总监理工程师看到"审批" */}
            {record.status === '待总监理工程师审批' && currentUser.role === '总监理工程师' && (
              <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
            )}
            {/* 待部门经理审批：只有部门经理看到"审批" */}
            {record.status === '待部门经理审批' && currentUser.role === '部门经理' && (
              <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
            )}
            {/* 待分管副总经理审批：只有副总经理看到"审批" */}
            {record.status === '待分管副总经理审批' && currentUser.role === '副总经理' && (
              <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
            )}
            {record.status !== '已作废' && record.status !== '已完成' && !isInApproval && (
              <Button type="link" danger size="small" onClick={() => handleVoid(record)}>作废</Button>
            )}
            {record.status !== '已作废' && record.status !== '已完成' && (
              <Button type="link" icon={<WalletOutlined />} size="small" onClick={() => handleReceive(record)}>收款</Button>
            )}
          </Space>
        )
      },
    },
  ]

  const detailItems = currentContract ? [
    descItem('合同编号', descText(currentContract.code)),
    descItem('合同名称', descText(currentContract.name)),
    descItem('项目名称', descText(getProjectNameByCode(currentContract.projectCode))),
    descItem('合同金额', descText(formatCurrency(currentContract.amount))),
    descItem('已收款合计', descText(formatCurrency(getReceivedAmountByContractCode(currentContract.code)))),
    descItem('甲方', descText(currentContract.partyA)),
    descItem('乙方', descText(currentContract.partyB)),
    descItem('签订日期', descText(currentContract.signDate)),
    descItem('开始日期', descText(currentContract.startDate)),
    descItem('结束日期', descText(currentContract.endDate)),
    descItem('状态', descTag(currentContract.status, statusColor)),
    descItem('执行进度', descProgress(currentContract.progress)),
    descItem('合同附件', descAttachments(currentContract.attachments)),
    descItem('审批记录', <ReviewTimeline records={getApprovalRecords(currentContract, contractApprovalMap, 'CONTRACT')} status={currentContract.status} levels={APPROVAL_CHAINS.CONTRACT.levels} />),
  ] : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>监理合同管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>新增合同</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: '16px' }} onFinish={handleSearch}>
          <Form.Item name="keyword">
            <Input placeholder="合同名称/编号" prefix={<SearchOutlined />} style={{ width: '200px' }} />
          </Form.Item>
          <Form.Item name="projectCode">
            <Select placeholder="项目名称" style={{ width: '260px' }} allowClear>
              {projectsData.map(p => (
                <Option key={p.code} value={p.code}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="合同状态" style={{ width: '150px' }} allowClear>
              <Option value="执行中">执行中</Option>
              <Option value="即将到期">即将到期</Option>
              <Option value="已完成">已完成</Option>
              <Option value="已作废">已作废</Option>
              <Option value="待审批">待审批</Option>
              <Option value="已驳回">已驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="signDateRange">
            <RangePicker placeholder={['签订开始', '签订结束']} />
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
          dataSource={displayList}
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 1800 }}
          rowKey="key"
        />
      </Card>

      <Modal
        title="新增监理合同"
        open={isModalVisible}
        forceRender
        onOk={handleOk}
        onCancel={handleCancel}
        width={700}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="code"
              label="合同编号"
              rules={[{ required: true, message: '请输入合同编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入合同编号" disabled />
            </Form.Item>
            <Form.Item
              name="name"
              label="合同名称"
              rules={[{ required: true, message: '请输入合同名称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="例如：XX项目监理合同" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="projectCode"
              label="项目名称"
              rules={[{ required: true, message: '请选择项目' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择项目">
                {projectsData.map(p => (
                  <Option key={p.code} value={p.code}>{p.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="amount"
              label="合同金额（万元）"
              rules={[{ required: true, message: '请输入合同金额' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入合同金额" suffix="万元" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="partyA"
              label="甲方"
              rules={[{ required: true, message: '请输入甲方' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入甲方" />
            </Form.Item>
            <Form.Item
              name="partyB"
              label="乙方"
              initialValue="广东亿迅科技有限公司"
              rules={[{ required: true, message: '请输入乙方' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入乙方" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="signDate"
              label="签订日期"
              rules={[{ required: true, message: '请选择签订日期' }]}
            >
              <DatePicker />
            </Form.Item>
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
          <Form.Item label="合同附件" extra="支持 PDF、DOC、XLS 等格式，可多选">
            <DocumentUploader value={fileList} onChange={(docs) => setFileList(docs)} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改监理合同"
        open={isEditModalVisible}
        forceRender
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        width={700}
      >
        <Form form={editForm} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="code"
              label="合同编号"
              rules={[{ required: true, message: '请输入合同编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入合同编号" disabled />
            </Form.Item>
            <Form.Item
              name="name"
              label="合同名称"
              rules={[{ required: true, message: '请输入合同名称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入合同名称" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="projectCode"
              label="项目名称"
              rules={[{ required: true, message: '请选择项目' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择项目">
                {projectsData.map(p => (
                  <Option key={p.code} value={p.code}>{p.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="amount"
              label="合同金额（万元）"
              rules={[{ required: true, message: '请输入合同金额' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入合同金额" suffix="万元" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="partyA"
              label="甲方"
              rules={[{ required: true, message: '请输入甲方' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入甲方" />
            </Form.Item>
            <Form.Item
              name="partyB"
              label="乙方"
              rules={[{ required: true, message: '请输入乙方' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入乙方" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="signDate"
              label="签订日期"
              rules={[{ required: true, message: '请选择签订日期' }]}
            >
              <DatePicker />
            </Form.Item>
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
          <Form.Item label="合同附件" extra="支持 PDF、DOC、XLS 等格式，可多选">
            <DocumentUploader value={editFileList} onChange={(docs) => setEditFileList(docs)} />
          </Form.Item>
        </Form>
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="合同详情"
        items={detailItems}
        onClose={() => { setIsDetailModalVisible(false); setCurrentContract(null) }}
      >
        {currentContract && (currentContract.status === '已审批' || currentContract.status === '执行中') && (
          <div style={{ textAlign: 'right', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={() => exportDocument('contractApproval', {
                code: currentContract.code,
                projectName: getProjectNameByCode(currentContract.projectCode),
                title: '监理合同审批意见书',
                body: [
                  `经评审，合同编号 ${currentContract.code}（合同名称：${currentContract.name}）合同金额符合项目预算要求，合同条款完善，甲方乙方权责清晰，监理工作范围、工期、价款及支付方式均已明确约定。`,
                  '按本公司审批流程，依次完成销售、总监理工程师、部门经理及分管副总经理四级审批，同意该合同正式签订。',
                ],
                attachments: (currentContract.attachments || []).map(a => a.name),
                approvals: getApprovalRecords(currentContract, contractApprovalMap, 'CONTRACT'),
                date: currentContract.signDate,
              })}>导出审批意见书</Button>
              <Button icon={<PrinterOutlined />} onClick={() => printDocument('contractApproval', {
                code: currentContract.code,
                projectName: getProjectNameByCode(currentContract.projectCode),
                title: '监理合同审批意见书',
                body: [
                  `经评审，合同编号 ${currentContract.code}（合同名称：${currentContract.name}）合同金额符合项目预算要求，合同条款完善，甲方乙方权责清晰，监理工作范围、工期、价款及支付方式均已明确约定。`,
                  '按本公司审批流程，依次完成销售、总监理工程师、部门经理及分管副总经理四级审批，同意该合同正式签订。',
                ],
                attachments: (currentContract.attachments || []).map(a => a.name),
                approvals: getApprovalRecords(currentContract, contractApprovalMap, 'CONTRACT'),
                date: currentContract.signDate,
              })}>打印</Button>
            </Space>
          </div>
        )}
      </DetailModal>

      <ReviewModal
        open={isReviewModalVisible}
        title="合同审批"
        reviewerOptions={APPROVAL_CHAINS.CONTRACT.reviewerOptions}
        currentUser={currentUser.name}
        onClose={() => { setIsReviewModalVisible(false) }}
        onSubmit={handleReviewSubmit}
        okText="提交审批"
      />

      {/* 销售发起审批弹窗（含总监理工程师选择+AI审核） */}
      <Modal
        title={
          <span>
            <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            发起监理合同审批 - 销售提交
          </span>
        }
        open={isSalesInitiateVisible}
        width={600}
        maskClosable={false}
        onCancel={() => { setIsSalesInitiateVisible(false); setAiReviewResult(null); setAiReviewing(false) }}
        footer={aiReviewResult ? [
          <Button key="back" onClick={() => { setIsSalesInitiateVisible(false); setAiReviewResult(null) }}>取消</Button>,
          <Button key="back2" onClick={() => { setAiReviewResult(null); }}>返回修改</Button>,
          <Button key="submit" type="primary" onClick={handleSalesInitiateSubmit}>继续提交（已阅风险提示）</Button>,
        ] : [
          <Button key="cancel" onClick={() => { setIsSalesInitiateVisible(false); setAiReviewing(false); setAiReviewResult(null) }}>取消</Button>,
          <Button key="aiCheck" type="primary" icon={<RobotOutlined />} loading={aiReviewing} onClick={handleAiReview}>
            {aiReviewing ? 'AI智能审核中...' : '提交并AI审核'}
          </Button>,
        ]}
      >
        <Form form={salesInitiateForm} layout="vertical" style={{ marginTop: 16 }}>
          {currentContract && (
            <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
              <div><strong>合同编号：</strong>{currentContract.code}</div>
              <div><strong>合同名称：</strong>{currentContract.name}</div>
              <div><strong>合同金额：</strong>{formatCurrency(currentContract.amount)}</div>
              <div><strong>当前状态：</strong>{currentContract.status}</div>
            </div>
          )}

          <Form.Item
            label="总监理工程师（必选）"
            name="supervisor"
            rules={[{ required: true, message: '请选择总监理工程师' }]}
            extra="负责本合同审批的总监理工程师"
          >
            <Select
              placeholder="请选择总监理工程师"
              onChange={setSelectedSupervisor}
              disabled={aiReviewing}
            >
              <Option value="韦江腾">韦江腾</Option>
              <Option value="赵雄飞">赵雄飞</Option>
              <Option value="许小嘉">许小嘉</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="销售意见"
            name="comment"
            rules={[{ required: true, message: '请填写销售意见' }]}
          >
            <Input.TextArea
              placeholder="请填写销售提交的审批意见，如：合同条款已审核，同意提交审批。"
              rows={3}
              disabled={aiReviewing}
            />
          </Form.Item>

          {aiReviewing && (
            <div style={{ textAlign: 'center', padding: 24, background: '#e6f7ff', borderRadius: 8, marginTop: 8 }}>
              <Spin size="large" tip="AI正在智能审核监理合同条款，请稍候..." />
            </div>
          )}

          {aiReviewResult && !aiReviewing && (
            <div style={{ marginTop: 16, padding: 16, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8 }}>
              <div style={{ fontWeight: 'bold', color: '#d46b08', marginBottom: 10, fontSize: 15 }}>
                <RobotOutlined style={{ marginRight: 8 }} />
                AI智能审核风险提示
              </div>
              <div style={{ color: '#595959' }}>
                {aiReviewResult.map((item, idx) => (
                  <div key={idx} style={{ padding: '6px 0', borderBottom: idx < aiReviewResult.length - 1 ? '1px dashed #ffd591' : 'none' }}>
                    风险 {idx + 1}：{item}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: 10, background: '#fff', borderRadius: 4, fontSize: 13, color: '#8c8c8c' }}>
                请确认是否接受上述风险并继续提交审批？继续提交后合同将进入总监理工程师审批节点。
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default SupervisionContract
