import { Card, Table, Button, Tag, Input, InputNumber, Select, DatePicker, Modal, Form, message, Space, Row, Col, Divider } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, DeleteOutlined, SafetyCertificateOutlined, PrinterOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'

import { getProjectNameByCode } from '../../data/projects'
import { contractMgmtData, paymentMgmtData, initialPaymentApprovalMap } from '../../data/contractMgmt'
import type {
  PaymentMgmtItem,
  PaymentMgmtStatus,
  PaymentMgmtType,
  PaymentMgmtSearchParams,
  ContractMgmtItem,
  ApprovalRecord,
} from '../../types/projectManagement'
import { formatCurrency, parseWanyuan } from '../../utils/format'
import { statusColor, CompactTableCssOnly } from '../../components/DetailModal'
import {
  ReviewModal,
  ReviewTimeline,
  getApprovalRecords,
  APPROVAL_CHAINS,
  exportDocument,
  printDocument,
  type DocumentKind,
} from '../../components/ReviewFlow'

import { usePersistedState } from '../../hooks/usePersistedState'
import { useCrossModuleData } from '../../context/CrossModuleDataContext'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'
const { Option } = Select

function PaymentManagement() {
  const { currentUser } = useUser()
  const { paymentList, setPaymentList } = useCrossModuleData()
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('contractManagement-payment-approval', initialPaymentApprovalMap)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<PaymentMgmtItem | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [currentEditItem, setCurrentEditItem] = useState<PaymentMgmtItem | null>(null)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<PaymentMgmtItem | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const payTypeColor = (type: string): string => {
    switch (type) {
      case '预付款':
        return 'blue'
      case '进度款':
        return 'green'
      case '结算款':
        return 'orange'
      case '质保金':
        return 'purple'
      default:
        return 'default'
    }
  }

  const updatePaymentStatus = (key: string, status: PaymentMgmtStatus) => {
    setPaymentList(prev => {
      const next = prev.map(p => (p.key === key ? { ...p, status } : p))
      return next
    })
    if (currentItem && currentItem.key === key) {
      setCurrentItem({ ...currentItem, status })
    }
  }

  const handleSearch = (values: PaymentMgmtSearchParams) => {
    const filtered = paymentList.filter(item => {
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        if (
          !item.code.toLowerCase().includes(kw) &&
          !item.contractCode.toLowerCase().includes(kw) &&
          !getProjectNameByCode(item.projectCode).toLowerCase().includes(kw)
        ) {
          return false
        }
      }
      if (values.contractCode && item.contractCode !== values.contractCode) {
        return false
      }
      if (values.status && item.status !== values.status) {
        return false
      }
      return true
    })
    setPaymentList(filtered)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setPaymentList([...paymentList])
  }

  const handleView = (record: PaymentMgmtItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const showModal = () => {
    form.resetFields()
    const seqNum = String(allDataRef.current.length + 1).padStart(3, '0')
    form.setFieldsValue({
      code: `PAY-${dayjs().format('YYYYMM')}-${seqNum}`,
      status: '待审批',
      payType: '进度款',
      applyDate: dayjs(),
      applicant: '滕海燕',
    })
    setIsModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      const contract: ContractMgmtItem | undefined = contractMgmtData.find(
        c => c.code === values.contractCode
      )
      const newItem: PaymentMgmtItem = {
        key: dayjs().valueOf().toString(),
        code: values.code,
        contractCode: values.contractCode,
        projectCode: contract ? contract.projectCode : values.projectCode || '',
        amount: parseWanyuan(values.amount),
        payDate: values.payDate ? dayjs(values.payDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        applyDate: values.applyDate ? dayjs(values.applyDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        payType: values.payType as PaymentMgmtType,
        status: (values.status as PaymentMgmtStatus) || '待审批',
        applicant: values.applicant || '滕海燕',
        contractor: values.contractor || '',
        applyDescription: values.applyDescription || '',
        invoiceNo: values.invoiceNo,
        remark: values.remark,
      }
      const updated = [newItem, ...paymentList]
      setPaymentList(updated)
      setIsModalVisible(false)
      form.resetFields()
      message.success('支付申请已提交，等待审批')
      addAuditLog(currentUser.name, '合同管理', '新增', values.code, '支付申请', `新增支付申请：${values.code}，金额：${values.amount}万元`)
    })
  }

  const showEditModal = (record: PaymentMgmtItem) => {
    setCurrentEditItem(record)
    editForm.setFieldsValue({
      key: record.key,
      code: record.code,
      contractCode: record.contractCode,
      amount: (record.amount / 10000).toFixed(2),
      payDate: record.payDate ? dayjs(record.payDate) : null,
      applyDate: record.applyDate ? dayjs(record.applyDate) : null,
      payType: record.payType,
      status: record.status,
      applicant: record.applicant,
      contractor: record.contractor,
      applyDescription: record.applyDescription,
      invoiceNo: record.invoiceNo,
      remark: record.remark,
    })
    setIsEditModalVisible(true)
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (!currentEditItem) return
      const contract: ContractMgmtItem | undefined = contractMgmtData.find(
        c => c.code === values.contractCode
      )
      const updatedItem: PaymentMgmtItem = {
        ...currentEditItem,
        code: values.code,
        contractCode: values.contractCode,
        projectCode: contract ? contract.projectCode : currentEditItem.projectCode,
        amount: parseWanyuan(values.amount),
        payDate: dayjs(values.payDate).format('YYYY-MM-DD'),
        applyDate: values.applyDate ? dayjs(values.applyDate).format('YYYY-MM-DD') : currentEditItem.applyDate,
        payType: values.payType as PaymentMgmtType,
        status: values.status as PaymentMgmtStatus,
        applicant: values.applicant,
        contractor: values.contractor,
        applyDescription: values.applyDescription,
        invoiceNo: values.invoiceNo,
        remark: values.remark,
      }
      const updated = paymentList.map(p => (p.key === currentEditItem.key ? updatedItem : p))
      setPaymentList(updated)
      setIsEditModalVisible(false)
      setCurrentEditItem(null)
      message.success('支付记录编辑成功')
      addAuditLog(currentUser.name, '合同管理', '编辑', currentEditItem.code, '支付申请', `编辑支付申请：${currentEditItem.code}`)
    })
  }

  const handleDelete = (record: PaymentMgmtItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除支付申请 ${record.code} 吗？`,
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        const updated = paymentList.filter(p => p.key !== record.key)
        setPaymentList(updated)
        message.success('已删除')
        addAuditLog(currentUser.name, '合同管理', '删除', record.code, '支付申请', `删除支付申请：${record.code}`)
      },
    })
  }

  // ---------- 审批逻辑（参照质量检查模块模式） ----------

  const handleReview = (record: PaymentMgmtItem) => {
    setReviewTarget(record)
    setIsReviewModalVisible(true)
  }

  const getNextReviewLevel = (records: ApprovalRecord[]): number => {
    const chain = APPROVAL_CHAINS.PAYMENT
    const passedCount = records.filter(r => r.status === '通过').length
    return Math.min(passedCount + 1, chain.levels.length)
  }

  const handleReviewSubmit = (payload: {
    status: '通过' | '驳回'
    comment: string
    reviewer: string
  }) => {
    if (!reviewTarget) return
    const key = reviewTarget.key
    const existingRecords = approvalMap[key] || []
    const nextLevel = reviewTarget.status === '一审通过' ? 2 : (existingRecords.length + 1)
    const newRecord: ApprovalRecord = {
      key: `${key}-r${nextLevel}-${Date.now()}`,
      code: `${reviewTarget.code}-R${nextLevel}`,
      level: nextLevel,
      reviewer: payload.reviewer,
      comment: payload.comment,
      status: payload.status,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
    setApprovalMap(prev => ({ ...prev, [key]: [...existingRecords, newRecord] }))

    if (payload.status === '驳回') {
      setPaymentList(prev => prev.map(item => item.key === key ? { ...item, status: '待审批' as PaymentMgmtStatus } : item))
      message.success('已驳回，返回待审批')
      addAuditLog(currentUser.name, '合同管理', '审批', reviewTarget.code, '支付申请', '驳回，返回待审批')
    } else {
      const newStatus: PaymentMgmtStatus = reviewTarget.status === '待审批' ? '一审通过' : '已审批'
      setPaymentList(prev => prev.map(item => item.key === key ? { ...item, status: newStatus } : item))
      message.success(newStatus === '已审批' ? '终审已通过' : '一审通过，等待总监理工程师终审')
      addAuditLog(currentUser.name, '合同管理', '审批', reviewTarget.code, '支付申请', newStatus === '已审批' ? '终审已通过' : '一审通过')
    }
    setIsReviewModalVisible(false)
    setReviewTarget(null)
  }

  const handleMarkPaid = () => {
    if (!currentItem) return
    Modal.confirm({
      title: '标记为已支付',
      content: `确认将支付申请 ${currentItem.code} 标记为"已支付"？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        updatePaymentStatus(currentItem.key, '已支付')
        message.success('已标记为已支付')
        addAuditLog(currentUser.name, '合同管理', '编辑', currentItem.code, '支付申请', '标记为已支付')
      },
    })
  }

  // ---------- 支付意见文档 ----------
  const buildDocumentContext = (item: PaymentMgmtItem) => {
    const records = getApprovalRecords(item, approvalMap, 'PAYMENT', item.applyDate || item.payDate)
    return {
      kind: 'paymentOpinion' as DocumentKind,
      ctx: {
        code: `PO-${item.code}`,
        projectName: getProjectNameByCode(item.projectCode),
        contractRef: `${item.contractCode}（${item.payType}）`,
        title: '工程款支付意见',
        subtitle: item.payType,
        body: [
          `根据 ${item.contractCode || '合同'} 约定及项目实际进度，现对承建单位 ${item.contractor || '（未填写）'} 提出的 ${item.payType} 支付申请进行审核。`,
          `申请金额：人民币 ${formatCurrency(item.amount)} 元。`,
          item.applyDescription ? `申请说明：${item.applyDescription}` : '承建单位按合同约定提交了支付申请及相关资料。',
          `经监理工程师审核及总监理工程师审批，该笔支付申请资料齐全、金额与合同进度相符，同意按合同约定支付。`,
          `本意见作为工程款支付的监理审核依据，具体支付金额以财务最终核定为准。`,
        ],
        approvals: records,
        date: item.applyDate || item.payDate,
      },
    }
  }

  const handleExportOpinion = (item: PaymentMgmtItem) => {
    const { kind, ctx } = buildDocumentContext(item)
    exportDocument(kind, ctx)
    message.success('支付意见已导出')
    addAuditLog(currentUser.name, '合同管理', '导出', item.code, '支付申请', '导出支付意见书')
  }

  const handlePrintOpinion = (item: PaymentMgmtItem) => {
    const { kind, ctx } = buildDocumentContext(item)
    printDocument(kind, ctx)
  }

  // ---------- 表格 ----------
  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 160,
    },
    {
      title: '承建单位',
      dataIndex: 'contractor',
      key: 'contractor',
      width: 220,
      render: (text: string) => text || '—',
    },
    {
      title: '合同编号',
      dataIndex: 'contractCode',
      key: 'contractCode',
      width: 140,
    },
    {
      title: '项目名称',
      dataIndex: 'projectCode',
      key: 'projectName',
      width: 240,
      render: (code: string) => getProjectNameByCode(code),
    },
    {
      title: '支付类型',
      dataIndex: 'payType',
      key: 'payType',
      width: 100,
      render: (type: string) => <Tag color={payTypeColor(type)}>{type}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: '申请日期',
      dataIndex: 'applyDate',
      key: 'applyDate',
      width: 110,
      render: (d?: string, rec?: PaymentMgmtItem) => d || (rec?.payDate),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record: PaymentMgmtItem) => (
        <Space size="small" wrap>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleView(record); }}>
            查看
          </Button>
          {(record.status === '待审批' && (currentUser.role === '监理工程师' || currentUser.role === '总监理工程师')) && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              size="small"
              onClick={(e) => { e.stopPropagation(); handleReview(record); }}
            >
              审批
            </Button>
          )}
          {record.status === '一审通过' && currentUser.role === '总监理工程师' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              size="small"
              onClick={(e) => { e.stopPropagation(); handleReview(record); }}
            >
              审批
            </Button>
          )}
          <Button type="link" icon={<EditOutlined />} size="small" onClick={(e) => { e.stopPropagation(); showEditModal(record); }}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleDelete(record); }}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // ---------- 详情弹窗内容 ----------
  const renderDetailBody = () => {
    if (!currentItem) return null
    const chain = APPROVAL_CHAINS.PAYMENT
    const records = getApprovalRecords(currentItem, approvalMap, 'PAYMENT', currentItem.applyDate || currentItem.payDate)

    return (
      <div>
        <Divider orientation="left" plain style={{ marginTop: 0 }}>基本信息</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ padding: '6px 0' }}>
              <b>支付编号：</b>
              {currentItem.code}
            </div>
            <div style={{ padding: '6px 0' }}>
              <b>关联项目：</b>
              {getProjectNameByCode(currentItem.projectCode)}
            </div>
            <div style={{ padding: '6px 0' }}>
              <b>承建单位：</b>
              {currentItem.contractor || '—'}
            </div>
            <div style={{ padding: '6px 0' }}>
              <b>申请说明：</b>
              {currentItem.applyDescription || '—'}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '6px 0' }}>
              <b>合同编号：</b>
              {currentItem.contractCode}
            </div>
            <div style={{ padding: '6px 0' }}>
              <b>支付类型：</b>
              <Tag color={payTypeColor(currentItem.payType)}>{currentItem.payType}</Tag>
            </div>
            <div style={{ padding: '6px 0' }}>
              <b>金额：</b>
              <span style={{ color: '#fa541c', fontWeight: 600 }}>{formatCurrency(currentItem.amount)} 元</span>
            </div>
            <div style={{ padding: '6px 0' }}>
              <b>申请日期：</b>
              {currentItem.applyDate || currentItem.payDate}
            </div>
            <div style={{ padding: '6px 0' }}>
              <b>申请人：</b>
              {currentItem.applicant || '—'}
            </div>
            <div style={{ padding: '6px 0' }}>
              <b>当前状态：</b>
              <Tag color={statusColor(currentItem.status)}>{currentItem.status}</Tag>
            </div>
          </Col>
        </Row>

        <Divider orientation="left" plain>审批流程</Divider>
        <ReviewTimeline levels={chain.levels} records={records} status={currentItem.status} />

        <Divider orientation="left" plain>支付意见文件</Divider>
        <Card
          size="small"
          style={{ background: '#fafafa', border: '1px dashed #d9d9d9' }}
          title={<><SafetyCertificateOutlined /> 工程款支付意见（预览）</>}
          extra={
            <Space>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleExportOpinion(currentItem)}
              >
                导出支付意见
              </Button>
              <Button
                size="small"
                icon={<PrinterOutlined />}
                onClick={() => handlePrintOpinion(currentItem)}
              >
                打印
              </Button>
            </Space>
          }
        >
          <div style={{ lineHeight: 1.9, fontSize: 13, color: '#333' }}>
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              工程款支付意见
            </div>
            <div style={{ textAlign: 'center', color: '#888', marginBottom: 16, fontSize: 12 }}>
              编号：PO-{currentItem.code} · 签发日期：{currentItem.applyDate || currentItem.payDate}
            </div>
            <div><b>项目名称：</b>{getProjectNameByCode(currentItem.projectCode)}</div>
            <div><b>合同/文件：</b>{currentItem.contractCode}（{currentItem.payType}）</div>
            <div style={{ textIndent: '2em', marginTop: 12 }}>
              根据 {currentItem.contractCode || '合同'} 约定及项目实际进度，现对承建单位 {currentItem.contractor || '（未填写）'} 提出的 {currentItem.payType} 支付申请进行审核。
            </div>
            <div style={{ textIndent: '2em' }}>
              申请金额：人民币 <b style={{ color: '#fa541c' }}>{formatCurrency(currentItem.amount)} 元</b>。
            </div>
            {currentItem.applyDescription && (
              <div style={{ textIndent: '2em' }}>申请说明：{currentItem.applyDescription}</div>
            )}
            <div style={{ textIndent: '2em' }}>
              经监理工程师审核及总监理工程师审批，该笔支付申请资料齐全、金额与合同进度相符，同意按合同约定支付。
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <CompactTableCssOnly />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>建设合同支付</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          新增支付申请
        </Button>
      </div>

      <Card>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16, flexWrap: 'wrap', rowGap: 12 }}
        >
          <Form.Item name="keyword">
            <Input placeholder="编号/合同编号/项目" prefix={<SearchOutlined />} style={{ width: 220 }} allowClear />
          </Form.Item>
          <Form.Item name="contractCode">
            <Select placeholder="选择合同" style={{ width: 200 }} allowClear>
              {contractMgmtData.map(c => (
                <Option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="选择状态" style={{ width: 140 }} allowClear>
              <Option value="待审批">待审批</Option>
              <Option value="审批中">审批中</Option>
              <Option value="已驳回">已驳回</Option>
              <Option value="已审批">已审批</Option>
              <Option value="待支付">待支付</Option>
              <Option value="已支付">已支付</Option>
              <Option value="已取消">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item name="payType">
            <Select placeholder="选择类型" style={{ width: 140 }} allowClear>
              <Option value="预付款">预付款</Option>
              <Option value="进度款">进度款</Option>
              <Option value="结算款">结算款</Option>
              <Option value="质保金">质保金</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          size="small"
          dataSource={paymentList}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          rowKey="key"
          scroll={{ x: 1700 }}
          onRow={(record: PaymentMgmtItem) => ({
            onClick: () => handleView(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal
        title="支付申请详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        onOk={() => setIsDetailModalVisible(false)}
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={900}
        forceRender
      >
        {renderDetailBody()}
      </Modal>

      <Modal
        title="新增支付申请（监理工程师代承建单位录入）"
        open={isModalVisible}
        forceRender
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={760}
        okText="提交申请"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="支付编号" rules={[{ required: true, message: '请输入支付编号' }]}>
                <Input placeholder="如：PAY-202506-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contractCode" label="合同编号" rules={[{ required: true, message: '请选择合同' }]}>
                <Select placeholder="选择关联合同">
                  {contractMgmtData.map(c => (
                    <Option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contractor" label="承建单位" rules={[{ required: true, message: '请输入承建单位' }]}>
                <Input placeholder="请输入承建单位名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applicant" label="申请人/录入人">
                <Input placeholder="默认：监理工程师" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="申请金额（万元）" rules={[{ required: true, message: '请输入金额' }]}>
                <InputNumber placeholder="请输入金额" min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payType" label="支付类型" rules={[{ required: true, message: '请选择支付类型' }]}>
                <Select placeholder="选择支付类型">
                  <Option value="预付款">预付款</Option>
                  <Option value="进度款">进度款</Option>
                  <Option value="结算款">结算款</Option>
                  <Option value="质保金">质保金</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applyDate" label="申请日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payDate" label="预计支付日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="invoiceNo" label="发票号">
                <Input placeholder="请输入发票号（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select placeholder="选择状态">
                  <Option value="待审批">待审批</Option>
                  <Option value="审批中">审批中</Option>
                  <Option value="已驳回">已驳回</Option>
                  <Option value="已审批">已审批</Option>
                  <Option value="待支付">待支付</Option>
                  <Option value="已支付">已支付</Option>
                  <Option value="已取消">已取消</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="applyDescription" label="申请说明">
                <Input.TextArea rows={3} placeholder="请输入支付申请说明（如：完成进度、对应工作内容等）" maxLength={500} showCount />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="备注信息（可选）" maxLength={200} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="编辑支付申请"
        open={isEditModalVisible}
        forceRender
        onOk={handleEditOk}
        onCancel={() => setIsEditModalVisible(false)}
        width={760}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="支付编号" rules={[{ required: true, message: '请输入支付编号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contractCode" label="合同编号" rules={[{ required: true, message: '请选择合同' }]}>
                <Select placeholder="选择关联合同">
                  {contractMgmtData.map(c => (
                    <Option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contractor" label="承建单位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applicant" label="申请人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="金额（万元）" rules={[{ required: true, message: '请输入金额' }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payType" label="支付类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="预付款">预付款</Option>
                  <Option value="进度款">进度款</Option>
                  <Option value="结算款">结算款</Option>
                  <Option value="质保金">质保金</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applyDate" label="申请日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payDate" label="支付日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="invoiceNo" label="发票号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  <Option value="待审批">待审批</Option>
                  <Option value="审批中">审批中</Option>
                  <Option value="已驳回">已驳回</Option>
                  <Option value="已审批">已审批</Option>
                  <Option value="待支付">待支付</Option>
                  <Option value="已支付">已支付</Option>
                  <Option value="已取消">已取消</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="applyDescription" label="申请说明">
                <Input.TextArea rows={3} maxLength={500} showCount />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} maxLength={200} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <ReviewModal
        open={isReviewModalVisible}
        title="支付申请审批"
        onClose={() => {
          setIsReviewModalVisible(false)
          setReviewTarget(null)
        }}
        onSubmit={handleReviewSubmit}
        reviewerOptions={APPROVAL_CHAINS.PAYMENT.reviewerOptions}
        currentUser={currentUser.name}
        okText="提交审批意见"
      />
    </div>
  )
}

export default PaymentManagement
export { PaymentManagement }