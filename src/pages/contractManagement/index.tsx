import { Card, Table, Button, Tag, Input, Select, DatePicker, Modal, Form, message, Space, Row, Col } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'

import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import { contractMgmtData, paymentMgmtData, initialContractApprovalMap } from '../../data/contractMgmt'
import type {
  ContractMgmtItem,
  ContractMgmtStatus,
  ContractMgmtSearchParams,
  DocumentAttachment,
  ApprovalRecord,
} from '../../types/projectManagement'
import { formatCurrency, parseWanyuan } from '../../utils/format'
import { DetailModal, descItem, descText, descTag, statusColor, descAttachments, CompactTableCssOnly } from '../../components/DetailModal'
import { DocumentUploader } from '../../components/DocumentUploader'
import AttachmentPreview from '../../components/AttachmentPreview'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'

import { usePersistedState } from '../../hooks/usePersistedState'
const { Option } = Select

function ContractManagement() {
  const { currentUser } = useUser()
  const [contractList, setContractList] = usePersistedState<ContractMgmtItem[]>('contractmgmt-main', contractMgmtData)
  const [searchResult, setSearchResult] = useState<ContractMgmtItem[] | null>(null)
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('contractmgmt-main-approval', initialContractApprovalMap)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ContractMgmtItem | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [currentEditItem, setCurrentEditItem] = useState<ContractMgmtItem | null>(null)
  const [editFileList, setEditFileList] = useState<DocumentAttachment[]>([])
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const handleSearch = (values: ContractMgmtSearchParams) => {
    const filtered = contractList.filter(item => {
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        if (
          !item.code.toLowerCase().includes(kw) &&
          !item.name.toLowerCase().includes(kw) &&
          !getProjectNameByCode(item.projectCode).toLowerCase().includes(kw)
        ) {
          return false
        }
      }
      if (values.projectCode && item.projectCode !== values.projectCode) {
        return false
      }
      if (values.status && item.status !== values.status) {
        return false
      }
      return true
    })
    setSearchResult(filtered)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setSearchResult(null)
  }

  const handleView = (record: ContractMgmtItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleReview = (record: ContractMgmtItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string }) => {
    if (!currentItem) return
    const key = currentItem.key
    const existingRecords = approvalMap[key] || []
    const nextLevel = currentItem.status === '一审通过' ? 2 : (existingRecords.length + 1)
    const newRecord: ApprovalRecord = {
      key: `${key}-r${nextLevel}-${Date.now()}`,
      code: `${currentItem.code}-R${nextLevel}`,
      level: nextLevel,
      reviewer: payload.reviewer,
      comment: payload.comment,
      status: payload.status,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
    setApprovalMap(prev => ({ ...prev, [key]: [...existingRecords, newRecord] }))
    if (payload.status === '驳回') {
      setContractList(prev => prev.map(item => item.key === key ? { ...item, status: '待审批' as ContractMgmtStatus } : item))
      message.success('已驳回，返回待审批')
      addAuditLog(currentUser.name, '合同管理', '审批', currentItem.code, '建设合同', '驳回，返回待审批')
    } else {
      const newStatus: ContractMgmtStatus = currentItem.status === '待审批' ? '一审通过' : '已审批'
      setContractList(prev => prev.map(item => item.key === key ? { ...item, status: newStatus } : item))
      message.success(newStatus === '已审批' ? '终审已通过' : '一审通过，等待总监理工程师终审')
      addAuditLog(currentUser.name, '合同管理', '审批', currentItem.code, '建设合同', newStatus === '已审批' ? '终审已通过' : '一审通过')
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const showModal = () => {
    form.resetFields()
    const seqNum = String(contractMgmtData.length + 1).padStart(3, '0')
    form.setFieldsValue({
      code: `HT-${dayjs().format('YYYY')}-${seqNum}`,
      status: '待审批',
    })
    setIsModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      const newItem: ContractMgmtItem = {
        key: dayjs().valueOf().toString(),
        code: values.code,
        name: values.name,
        projectCode: values.projectCode,
        partyA: values.partyA,
        partyB: values.partyB,
        amount: parseWanyuan(values.amount),
        signDate: values.signDate
          ? dayjs(values.signDate).format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
        startDate: values.startDate
          ? dayjs(values.startDate).format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
        endDate: values.endDate
          ? dayjs(values.endDate).format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
        status: values.status as ContractMgmtStatus,
        contractType: values.contractType || '系统集成合同',
      }
      const updated = [newItem, ...contractList]
      setContractList(updated)
      setIsModalVisible(false)
      form.resetFields()
      message.success('建设合同新增成功')
      addAuditLog(currentUser.name, '合同管理', '新增', values.name, '建设合同', `新增建设合同：${values.name}，编号：${values.code}，金额：${values.amount}万元`)
    })
  }

  const showEditModal = (record: ContractMgmtItem) => {
    setCurrentEditItem(record)
    editForm.setFieldsValue({
      key: record.key,
      code: record.code,
      name: record.name,
      projectCode: record.projectCode,
      partyA: record.partyA,
      partyB: record.partyB,
      amount: (record.amount / 10000).toFixed(2),
      signDate: record.signDate ? dayjs(record.signDate) : null,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      status: record.status,
      contractType: record.contractType,
    })
    setEditFileList((record.attachments || []).map(a => ({ name: a.name, url: a.url })))
    setIsEditModalVisible(true)
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (!currentEditItem) return
      const updatedItem: ContractMgmtItem = {
        ...currentEditItem,
        code: values.code,
        name: values.name,
        projectCode: values.projectCode,
        partyA: values.partyA,
        partyB: values.partyB,
        amount: parseWanyuan(values.amount),
        signDate: dayjs(values.signDate).format('YYYY-MM-DD'),
        startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
        status: values.status as ContractMgmtStatus,
        contractType: values.contractType,
        attachments: editFileList.map(f => ({ name: f.name, url: f.url || '#' })) as any,
      }
      const updated = contractList.map(c => (c.key === currentEditItem.key ? updatedItem : c))
      setContractList(updated)
      setIsEditModalVisible(false)
      setCurrentEditItem(null)
      message.success('建设合同编辑成功')
      addAuditLog(currentUser.name, '合同管理', '编辑', currentEditItem.name, '建设合同', `编辑建设合同：${currentEditItem.name}，编号：${currentEditItem.code}`)
    })
  }

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '合同名称',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目名称',
      dataIndex: 'projectCode',
      key: 'projectName',
      width: 240,
      render: (code: string) => getProjectNameByCode(code),
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '甲方',
      dataIndex: 'partyA',
      key: 'partyA',
      width: 180,
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '乙方',
      dataIndex: 'partyB',
      key: 'partyB',
      width: 200,
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '合同金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount: number) => formatCurrency(amount),
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '签订日期',
      dataIndex: 'signDate',
      key: 'signDate',
      width: 110,
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 110,
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 110,
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '类型',
      dataIndex: 'contractType',
      key: 'contractType',
      width: 150,
      onCell: (record: ContractMgmtItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: ContractMgmtItem) => {
        return (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => showEditModal(record)}>
            编辑
          </Button>
          {record.status === '待审批' && (currentUser.role === '监理工程师' || currentUser.role === '总监理工程师') && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>
              审批
            </Button>
          )}
          {record.status === '一审通过' && currentUser.role === '总监理工程师' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>
              审批
            </Button>
          )}
        </Space>
      )},
    },
  ]

  return (
    <div>
      <CompactTableCssOnly />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>建设合同管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          新增合同
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
            <Input placeholder="合同编号/名称/项目" prefix={<SearchOutlined />} style={{ width: 220 }} allowClear />
          </Form.Item>
          <Form.Item name="projectCode">
            <Select placeholder="选择项目" style={{ width: 200 }} allowClear>
              {initialProjectData.map(p => (
                <Option key={p.code} value={p.code}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="选择状态" style={{ width: 140 }} allowClear>
              <Option value="待审批">待审批</Option>
              <Option value="一审通过">一审通过</Option>
              <Option value="已审批">已审批</Option>
              <Option value="执行中">执行中</Option>
              <Option value="已驳回">已驳回</Option>
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
          dataSource={searchResult ?? contractList}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          rowKey="key"
          scroll={{ x: 1800 }}
        />
      </Card>

      <DetailModal
        open={isDetailModalVisible}
        title="建设合同详情"
        width={760}
        onClose={() => setIsDetailModalVisible(false)}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('合同编号', descText(currentItem.code)),
            descItem('合同名称', descText(currentItem.name)),
            descItem('关联项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('甲方', descText(currentItem.partyA)),
            descItem('乙方', descText(currentItem.partyB)),
            descItem('合同金额', descText(formatCurrency(currentItem.amount))),
            descItem('签订日期', descText(currentItem.signDate)),
            descItem('开始日期', descText(currentItem.startDate)),
            descItem('结束日期', descText(currentItem.endDate)),
            descItem('状态', descTag(currentItem.status, statusColor)),
            descItem('合同类型', descText(currentItem.contractType)),
            descItem('合同附件', <AttachmentPreview attachments={currentItem.attachments as any} />),
          ]
          // 审批记录时间线
          items.push(
            descItem(
              '审批记录',
              <ReviewTimeline
                records={getApprovalRecords(currentItem, approvalMap, 'PROJECT')}
                status={currentItem.status}
                levels={APPROVAL_CHAINS.PROJECT.levels}
              />,
            ),
          )
          return items
        })()}
      />

      <Modal
        title="新增建设合同"
        open={isModalVisible}
        forceRender
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={720}
        okText="确认新增"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="合同编号" rules={[{ required: true, message: '请输入合同编号' }]}>
                <Input placeholder="如：HT-2025-007" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="合同名称" rules={[{ required: true, message: '请输入合同名称' }]}>
                <Input placeholder="请输入合同名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="projectCode" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
                <Select placeholder="请选择项目">
                  {initialProjectData.map(p => (
                    <Option key={p.code} value={p.code}>
                      {p.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="合同金额（万元）"
                rules={[{ required: true, message: '请输入合同金额' }]}
              >
                <Input placeholder="请输入金额（万元）" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="partyA" label="甲方" rules={[{ required: true, message: '请输入甲方' }]}>
                <Input placeholder="请输入甲方名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="partyB" label="乙方" rules={[{ required: true, message: '请输入乙方' }]}>
                <Input placeholder="请输入乙方名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="signDate" label="签订日期" rules={[{ required: true, message: '请选择签订日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="startDate" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="endDate" label="结束日期" rules={[{ required: true, message: '请选择结束日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select placeholder="请选择状态">
                  <Option value="待审批">待审批</Option>
                  <Option value="一审通过">一审通过</Option>
                  <Option value="已审批">已审批</Option>
                  <Option value="执行中">执行中</Option>
                  <Option value="已驳回">已驳回</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contractType" label="合同类型">
                <Input placeholder="如：系统集成合同" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="编辑建设合同"
        open={isEditModalVisible}
        forceRender
        onOk={handleEditOk}
        onCancel={() => setIsEditModalVisible(false)}
        width={720}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="合同编号" rules={[{ required: true, message: '请输入合同编号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="合同名称" rules={[{ required: true, message: '请输入合同名称' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="projectCode" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
                <Select>
                  {initialProjectData.map(p => (
                    <Option key={p.code} value={p.code}>
                      {p.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="合同金额（万元）" rules={[{ required: true, message: '请输入金额' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="partyA" label="甲方" rules={[{ required: true, message: '请输入甲方' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="partyB" label="乙方" rules={[{ required: true, message: '请输入乙方' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="signDate" label="签订日期" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="startDate" label="开始日期" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="endDate" label="结束日期" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  <Option value="待审批">待审批</Option>
                  <Option value="一审通过">一审通过</Option>
                  <Option value="已审批">已审批</Option>
                  <Option value="执行中">执行中</Option>
                  <Option value="已驳回">已驳回</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contractType" label="合同类型">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="合同附件">
            <DocumentUploader
              value={editFileList}
              onChange={(docs) => setEditFileList(docs)}
            />
          </Form.Item>
        </Form>
      </Modal>

      <ReviewModal
        open={isReviewModalVisible}
        title="合同审批"
        onClose={() => { setIsReviewModalVisible(false); setCurrentItem(null) }}
        onSubmit={handleReviewSubmit}
        reviewerOptions={APPROVAL_CHAINS.PROJECT.reviewerOptions}
        currentUser={currentUser.name}
        okText="提交审批"
      />
    </div>
  )
}

export default ContractManagement
