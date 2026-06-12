import { Card, Table, Button, Tag, Input, Select, DatePicker, Modal, Form, message, Space, Progress } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, WalletOutlined, EyeOutlined, CheckCircleOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons'
import { useState } from 'react'
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

const { RangePicker } = DatePicker
const { Option } = Select

function SupervisionContract() {
  const [contractList, setContractList] = useState<ContractItem[]>(initialContractData)
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
  const [approvalMap, setApprovalMap] = useState<Record<string, ApprovalRecord[]>>({})

  const handleSearch = (values: ContractSearchParams) => {
    const filtered = initialContractData.filter(item => {
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        if (!item.code.toLowerCase().includes(kw) && !item.name.toLowerCase().includes(kw)) {
          return false
        }
      }
      if (values.projectCode && item.projectCode !== values.projectCode) {
        return false
      }
      if (values.status && item.status !== values.status) {
        return false
      }
      if (values.signDateRange && values.signDateRange[0] && values.signDateRange[1]) {
        const itemDate = dayjs(item.signDate)
        const start = values.signDateRange[0]
        const end = values.signDateRange[1]
        if (itemDate.isBefore(start, 'day') || itemDate.isAfter(end, 'day')) {
          return false
        }
      }
      return true
    })
    setContractList(filtered)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setContractList(initialContractData)
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
      setContractList(prev => [newContract, ...prev])
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
        setContractList(prev => prev.map(item =>
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
        setContractList(prev => prev.map(item =>
          item.key === record.key ? { ...item, status: '已作废' } : item
        ))
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
        setContractList(prev => prev.map(item =>
          item.key === record.key ? {
            ...item,
            progress: newProgress,
            status: newProgress >= 100 ? '已完成' : item.status
          } : item
        ))
        message.success('收款记录已更新')
      },
    })
  }

  const handleReview = (record: ContractItem) => {
    setCurrentContract(record)
    setIsReviewModalVisible(true)
  }

  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string }) => {
    if (!currentContract) return
    const key = currentContract.key
    const existingRecords = approvalMap[key] || []
    const completedCount = existingRecords.length
    const chainLevels = APPROVAL_CHAINS.CONTRACT.levels.length
    const nextLevel = completedCount + 1
    const newRecord: ApprovalRecord = {
      key: `${key}-${nextLevel}`,
      code: `${currentContract.code}-R${nextLevel}`,
      level: nextLevel,
      reviewer: payload.reviewer,
      status: payload.status,
      comment: payload.comment,
      date: new Date().toLocaleString('zh-CN'),
    }
    setApprovalMap(prev => ({ ...prev, [key]: [...existingRecords, newRecord] }))
    if (payload.status === '通过') {
      if (nextLevel >= chainLevels) {
        setContractList(prev => prev.map(item => item.key === key ? { ...item, status: '已审批' as ContractStatus } : item))
        message.success('终审通过，合同审批完成')
      } else {
        message.success(`第 ${nextLevel} 级审批通过，进入下一级`)
      }
    } else {
      setContractList(prev => prev.map(item => item.key === key ? { ...item, status: '已驳回' as ContractStatus } : item))
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
      render: (_: unknown, record: ContractItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>修改</Button>
          {record.status === '待审批' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>发起审批</Button>
          )}
          {record.status !== '已作废' && record.status !== '已完成' && (
            <Button type="link" danger size="small" onClick={() => handleVoid(record)}>作废</Button>
          )}
          {record.status !== '已作废' && record.status !== '已完成' && (
            <Button type="link" icon={<WalletOutlined />} size="small" onClick={() => handleReceive(record)}>收款</Button>
          )}
        </Space>
      ),
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
    descItem('审批记录', <ReviewTimeline records={getApprovalRecords(currentContract, approvalMap, 'CONTRACT')} status={currentContract.status} levels={APPROVAL_CHAINS.CONTRACT.levels} />),
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
          dataSource={contractList}
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
                approvals: getApprovalRecords(currentContract, approvalMap, 'CONTRACT'),
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
                approvals: getApprovalRecords(currentContract, approvalMap, 'CONTRACT'),
                date: currentContract.signDate,
              })}>打印</Button>
            </Space>
          </div>
        )}
      </DetailModal>

      <ReviewModal
        open={isReviewModalVisible}
        title="发起审批"
        reviewerOptions={APPROVAL_CHAINS.CONTRACT.reviewerOptions}
        onClose={() => { setIsReviewModalVisible(false) }}
        onSubmit={handleReviewSubmit}
        okText="提交审批"
      />
    </div>
  )
}

export default SupervisionContract
