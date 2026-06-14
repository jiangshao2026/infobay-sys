import { Card, Table, Button, Tag, Input, Select, DatePicker, Modal, Form, message, Space } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined, WalletOutlined } from '@ant-design/icons'
import {  useState, useMemo, useRef , useEffect } from 'react'
import dayjs from 'dayjs'

import type { PaymentItem, PaymentStatus, PaymentSearchParams } from '../../types/projectManagement'
import initialPaymentData from '../../data/payments'
import contractsData from '../../data/contracts'
import { getProjectNameByCode } from '../../data/projects'
import { formatCurrency } from '../../utils/format'
import { validatePaymentTotal, validateDateRange, parseAmountFromForm } from '../../utils/validation'
import { DetailModal, descItem, descText, descTag, statusColor } from '../../components/DetailModal'
import { CompactTableCssOnly } from '../../components/CompactTable'

import { usePersistedState } from '../../hooks/usePersistedState'
const { RangePicker } = DatePicker

const generatePaymentCode = (): string => {
  const year = dayjs().format('YYYY')
  const seq = Math.floor(Math.random() * 9000) + 1000
  return `PAY-${year}-${seq}`
}

const generateInvoiceCode = (): string => {
  const year = dayjs().format('YYYY')
  const seq = Math.floor(Math.random() * 9000) + 1000
  return `INV-${year}-${seq}`
}

function SupervisionPayment() {
  const [paymentList, setPaymentList] = usePersistedState<PaymentItem[]>('project-spay', initialPaymentData)
const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentPayment, setCurrentPayment] = useState<PaymentItem | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  const handleView = (record: PaymentItem) => {
    setCurrentPayment(record)
    setIsDetailModalVisible(true)
  }

  const showModal = () => {
    form.setFieldsValue({
      code: generatePaymentCode(),
      invoiceNo: generateInvoiceCode(),
    })
    setIsModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      const newAmount = parseAmountFromForm(values.amount)
      if (newAmount <= 0) {
        message.error('支付金额必须大于 0')
        return
      }

      const totalCheck = validatePaymentTotal(values.contractCode, newAmount, paymentList, contractsData)
      if (!totalCheck.valid) {
        message.error(totalCheck.message || '累计付款校验失败')
        return
      }

      const newPayment: PaymentItem = {
        key: Date.now().toString(),
        code: values.code,
        invoiceNo: values.invoiceNo,
        contractCode: values.contractCode,
        contractor: values.contractor,
        amount: newAmount,
        payDate: values.payDate ? values.payDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        status: '待收款',
        description: values.description,
      }
      setPaymentList(prev => {
        const next = [newPayment, ...prev]
        return next
      })
      setIsModalVisible(false)
      form.resetFields()
      message.success('支付申请已提交（状态：待收款）')
    })
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const handleConfirmReceive = (record: PaymentItem) => {
    Modal.confirm({
      title: '确认收款',
      content: `确认记录「${record.code}」的款项已收到？金额：${formatCurrency(record.amount)}`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setPaymentList(prev => {
          const next = prev.map(item =>
            item.key === record.key
              ? { ...item, status: '已收款' as PaymentStatus, payDate: dayjs().format('YYYY-MM-DD') }
              : item
          )
          return next
        })
        message.success('收款确认成功')
      },
    })
  }

  const getProjectNameByContract = (contractCode: string): string => {
    const contract = contractsData.find(c => c.code === contractCode)
    if (!contract) return '—'
    return getProjectNameByCode(contract.projectCode)
  }

  const handleSearch = (values: PaymentSearchParams) => {
    if (values.payDateRange && values.payDateRange.length === 2) {
      const [start, end] = values.payDateRange
      const check = validateDateRange(
        start ? start.format('YYYY-MM-DD') : '',
        end ? end.format('YYYY-MM-DD') : ''
      )
      if (!check.valid) {
        message.error(check.message)
        return
      }
    }

    const filtered = paymentList.filter(item => {
      let match = true
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        match = match && (item.code.toLowerCase().includes(kw) || item.invoiceNo.toLowerCase().includes(kw))
      }
      if (values.contractCode) match = match && item.contractCode === values.contractCode
      if (values.status) match = match && item.status === values.status
      if (values.payDateRange && values.payDateRange.length === 2) {
        const [start, end] = values.payDateRange
        if (start && item.payDate) match = match && item.payDate >= start.format('YYYY-MM-DD')
        if (end && item.payDate) match = match && item.payDate <= end.format('YYYY-MM-DD')
      }
      return match
    })
    setPaymentList(filtered)
    message.success(`查询到 ${filtered.length} 条记录`)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setPaymentList([...paymentList])
  }

  const detailItems = useMemo(() => {
    if (!currentPayment) return []
    return [
      descItem('支付编号', descText(currentPayment.code)),
      descItem('合同编号', descText(currentPayment.contractCode)),
      descItem('项目名称', descText(getProjectNameByContract(currentPayment.contractCode))),
      descItem('承建单位', descText(currentPayment.contractor)),
      descItem(
        '支付金额',
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
          {formatCurrency(currentPayment.amount)}
        </span>
      ),
      descItem('发票编号', descText(currentPayment.invoiceNo)),
      descItem('支付日期', descText(currentPayment.payDate)),
      descItem('状态', descTag(currentPayment.status, statusColor)),
      descItem('备注说明', descText(currentPayment.description)),
    ]
  }, [currentPayment])

  const columns = [
    {
      title: '支付编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
    },
    {
      title: '合同编号',
      dataIndex: 'contractCode',
      key: 'contractCode',
      width: 140,
    },
    {
      title: '项目名称',
      key: 'projectName',
      width: 220,
      render: (_: unknown, record: PaymentItem) => getProjectNameByContract(record.contractCode),
    },
    {
      title: '承建单位',
      dataIndex: 'contractor',
      key: 'contractor',
      width: 200,
    },
    {
      title: '支付金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold' }}>{formatCurrency(amount)}</span>
      ),
    },
    {
      title: '发票编号',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      width: 140,
    },
    {
      title: '支付日期',
      dataIndex: 'payDate',
      key: 'payDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PaymentStatus) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: PaymentItem) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleView(record); }}>
            查看
          </Button>
          {record.status === '待收款' && (
            <Button type="primary" icon={<WalletOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleConfirmReceive(record); }}>
              确认收款
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>监理支付管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          新增支付
        </Button>
      </div>

      <Card>
        <Form form={searchForm} layout="inline" style={{ marginBottom: '16px' }} onFinish={handleSearch}>
          <Form.Item name="keyword">
            <Input placeholder="支付编号/发票编号" prefix={<SearchOutlined />} style={{ width: '200px' }} />
          </Form.Item>
          <Form.Item name="contractCode">
            <Select placeholder="合同编号" allowClear style={{ width: '220px' }}>
              {contractsData.map(contract => (
                <Select.Option key={contract.code} value={contract.code}>
                  {contract.code} - {getProjectNameByCode(contract.projectCode)} 监理合同
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="支付状态" allowClear style={{ width: '140px' }}>
              <Select.Option value="待收款">待收款</Select.Option>
              <Select.Option value="已收款">已收款</Select.Option>
              <Select.Option value="已取消">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="payDateRange">
            <RangePicker placeholder={['支付开始', '支付结束']} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
        </Form>

        <CompactTableCssOnly />
        <Table
          columns={columns}
          dataSource={paymentList}
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 1450 }}
          rowKey="key"
          onRow={(record: PaymentItem) => ({
            onClick: () => handleView(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal
        title="新增支付申请"
        open={isModalVisible}
        forceRender
        onOk={handleOk}
        onCancel={handleCancel}
        width={640}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="code"
              label="支付编号"
              rules={[{ required: true, message: '请输入支付编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入支付编号" />
            </Form.Item>
            <Form.Item
              name="invoiceNo"
              label="发票编号"
              rules={[{ required: true, message: '请输入发票编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入发票编号" />
            </Form.Item>
          </div>
          <Form.Item
            name="contractCode"
            label="关联合同"
            rules={[{ required: true, message: '请选择关联合同' }]}
          >
            <Select placeholder="请选择监理合同" showSearch optionFilterProp="children">
              {contractsData.map(contract => (
                <Select.Option key={contract.code} value={contract.code}>
                  {contract.code} - {getProjectNameByCode(contract.projectCode)} 监理合同（{formatCurrency(contract.amount)}）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="contractor"
            label="承建单位"
            rules={[{ required: true, message: '请输入承建单位' }]}
          >
            <Input placeholder="请输入承建单位名称" />
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="amount"
              label="支付金额（万元）"
              rules={[{ required: true, message: '请输入支付金额' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="如：32.18" suffix="万元" />
            </Form.Item>
            <Form.Item
              name="payDate"
              label="支付日期"
              rules={[{ required: true, message: '请选择支付日期' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="备注说明">
            <Input.TextArea rows={3} placeholder="请输入备注说明" />
          </Form.Item>
        </Form>
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="支付详情"
        items={detailItems}
        width={700}
        onClose={() => {
          setIsDetailModalVisible(false)
          setCurrentPayment(null)
        }}
      />
    </div>
  )
}

export default SupervisionPayment
