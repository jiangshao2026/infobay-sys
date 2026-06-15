import { useState } from 'react'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import initialProjectData from '../../data/projects'
import type { ProjectItem } from '../../types/projectManagement'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Popconfirm,
  Tag,
  Descriptions,
  Upload,
  List,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  PaperClipOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import {
  ReviewModal,
  ReviewTimeline,
  getApprovalRecords,
  APPROVAL_CHAINS,
  exportDocument,
  printDocument,
  type ApprovalRecord,
} from '../../components/ReviewFlow'

const { Option } = Select

interface StartupItem {
  key: string
  code: string
  projectCode: string
  projectName: string
  applicant: string
  planDate: string
  estimatedDays: number
  description: string
  attachments: { name: string; url: string }[]
  status: '待审批' | '审批中' | '已审批' | '已驳回'
  approvals?: ApprovalRecord[]
  createTime: string
}

const initialData: StartupItem[] = [
  {
    key: 's1',
    code: 'KG-2025-001',
    projectCode: 'XB2005-0037',
    projectName: '广东省市场监管局信息化项目（2025年第二批）',
    applicant: '广东省信息中心',
    planDate: '2025-03-15',
    estimatedDays: 470,
    description: '承建单位已完成施工组织设计、专项方案编制及人员、材料、设备进场准备工作，申请于2025-03-15正式开工。',
    attachments: [
      { name: '施工组织设计.pdf', url: '#' },
      { name: '专项施工方案.docx', url: '#' },
      { name: '人员及设备清单.xlsx', url: '#' },
    ],
    status: '已审批',
    approvals: [
      {
        key: 's1-r1',
        code: 'KG-2025-001-R1',
        level: 1,
        reviewer: '监理工程师-张明',
        status: '通过',
        comment: '开工条件已具备，实施方案可行，同意开工。',
        date: '2025-03-10 10:20:00',
      },
      {
        key: 's1-r2',
        code: 'KG-2025-001-R2',
        level: 2,
        reviewer: '总监理工程师-韦江腾',
        status: '通过',
        comment: '已复核开工准备工作，同意签发开工令。',
        date: '2025-03-12 09:15:00',
      },
    ],
    createTime: '2025-03-08 14:00:00',
  },
  {
    key: 's2',
    code: 'KG-2025-002',
    projectCode: 'XB2005-0062',
    projectName: '广东省海洋综合执法总队综合指挥中心升级改造项目',
    applicant: '广东省海洋与渔业信息中心',
    planDate: '2025-02-01',
    estimatedDays: 365,
    description: '承建单位已完成升级改造方案评审及进场准备，申请于2025-02-01正式开工。',
    attachments: [
      { name: '升级改造实施方案.pdf', url: '#' },
      { name: '设备进场清单.pdf', url: '#' },
    ],
    status: '已审批',
    approvals: [
      {
        key: 's2-r1',
        code: 'KG-2025-002-R1',
        level: 1,
        reviewer: '监理工程师-王晓',
        status: '通过',
        comment: '开工条件已具备，方案可行，同意提交总监审批。',
        date: '2025-01-25 11:00:00',
      },
      {
        key: 's2-r2',
        code: 'KG-2025-002-R2',
        level: 2,
        reviewer: '总监理工程师-韦江腾',
        status: '通过',
        comment: '已复核，同意签发开工令。',
        date: '2025-01-28 09:30:00',
      },
    ],
    createTime: '2025-01-20 10:00:00',
  },
  {
    key: 's3',
    code: 'KG-2025-003',
    projectCode: 'XB2005-0156',
    projectName: '广东省政务服务和数据管理局数字政府基础设施（2025年）项目',
    applicant: '广东省数字政府建设运营中心',
    planDate: '2025-01-10',
    estimatedDays: 720,
    description: '承建单位已完成需求分析、总体设计及进场准备，现申请正式开工。',
    attachments: [
      { name: '项目实施计划书.pdf', url: '#' },
      { name: '总体设计方案.pdf', url: '#' },
    ],
    status: '已审批',
    approvals: [
      {
        key: 's3-r1',
        code: 'KG-2025-003-R1',
        level: 1,
        reviewer: '监理工程师-周宁',
        status: '通过',
        comment: '开工条件已具备，实施方案可行，同意提交总监审批。',
        date: '2025-01-05 14:20:00',
      },
      {
        key: 's3-r2',
        code: 'KG-2025-003-R2',
        level: 2,
        reviewer: '总监理工程师-韦江腾',
        status: '通过',
        comment: '已复核开工准备工作，同意签发开工令。',
        date: '2025-01-08 10:00:00',
      },
    ],
    createTime: '2025-01-03 09:30:00',
  },
  {
    key: 's4',
    code: 'KG-2025-004',
    projectCode: 'XB2005-0267',
    projectName: '江西省统计局"赣数智"一体化平台项目',
    applicant: '江西省统计信息中心',
    planDate: '2025-05-20',
    estimatedDays: 420,
    description: '承建单位已完成平台架构设计及人员进场准备，申请正式开工。',
    attachments: [
      { name: '平台架构设计说明书.pdf', url: '#' },
      { name: '人员及资源配置清单.xlsx', url: '#' },
    ],
    status: '已审批',
    approvals: [
      {
        key: 's4-r1',
        code: 'KG-2025-004-R1',
        level: 1,
        reviewer: '监理工程师-黄伟',
        status: '通过',
        comment: '开工条件已具备，实施方案可行，同意提交总监审批。',
        date: '2025-05-15 10:00:00',
      },
      {
        key: 's4-r2',
        code: 'KG-2025-004-R2',
        level: 2,
        reviewer: '总监理工程师-韦江腾',
        status: '通过',
        comment: '已复核，同意签发开工令。',
        date: '2025-05-18 09:30:00',
      },
    ],
    createTime: '2025-05-10 15:00:00',
  },
  {
    key: 's6',
    code: 'KG-2025-006',
    projectCode: 'XB2005-0089',
    projectName: '广西智慧海洋监管服务平台建设项目',
    applicant: '广西壮族自治区海洋局',
    planDate: '2025-06-10',
    estimatedDays: 570,
    description: '承建单位已完成海洋监管服务平台的需求梳理与方案编制，申请于2025-06-10正式开工。',
    attachments: [
      { name: '智慧海洋平台建设方案.pdf', url: '#' },
      { name: '人员及设备清单.xlsx', url: '#' },
    ],
    status: '已审批',
    approvals: [
      {
        key: 's6-r1',
        code: 'KG-2025-006-R1',
        level: 1,
        reviewer: '监理工程师-滕海燕',
        status: '通过',
        comment: '开工条件已具备，实施方案可行，同意提交总监审批。',
        date: '2025-06-05 10:00:00',
      },
      {
        key: 's6-r2',
        code: 'KG-2025-006-R2',
        level: 2,
        reviewer: '总监理工程师-韦江腾',
        status: '通过',
        comment: '已复核，同意签发开工令。',
        date: '2025-06-07 10:00:00',
      },
    ],
    createTime: '2025-06-03 09:00:00',
  },
  {
    key: 's7',
    code: 'KG-2025-007',
    projectCode: 'XB2005-0123',
    projectName: '广州市民政局2025年升级改造项目',
    applicant: '广州市民政信息中心',
    planDate: '2025-04-20',
    estimatedDays: 255,
    description: '承建单位已完成民政业务系统升级改造的前期准备工作，申请正式开工。',
    attachments: [
      { name: '民政系统升级改造方案.pdf', url: '#' },
      { name: '安全技术方案.pdf', url: '#' },
    ],
    status: '已审批',
    approvals: [
      {
        key: 's7-r1',
        code: 'KG-2025-007-R1',
        level: 1,
        reviewer: '监理工程师-滕海燕',
        status: '通过',
        comment: '开工条件已具备，方案可行。',
        date: '2025-04-16 10:00:00',
      },
      {
        key: 's7-r2',
        code: 'KG-2025-007-R2',
        level: 2,
        reviewer: '总监理工程师-韦江腾',
        status: '通过',
        comment: '已复核，同意签发开工令。',
        date: '2025-04-18 09:30:00',
      },
    ],
    createTime: '2025-04-12 09:00:00',
  },
  {
    key: 's8',
    code: 'KG-2024-005',
    projectCode: 'XB2005-0189',
    projectName: '广东省韩江流域潮州供水枢纽数字孪生平台建设（2024年）项目',
    applicant: '广东省水利厅',
    planDate: '2024-08-15',
    estimatedDays: 380,
    description: '承建单位已完成数字孪生平台需求及方案评审，申请于2024-08-15正式开工。',
    attachments: [
      { name: '数字孪生平台建设方案.pdf', url: '#' },
      { name: '数据治理及仿真需求说明书.pdf', url: '#' },
    ],
    status: '已审批',
    approvals: [
      {
        key: 's8-r1',
        code: 'KG-2024-005-R1',
        level: 1,
        reviewer: '监理工程师-滕海燕',
        status: '通过',
        comment: '开工条件已具备，符合水利项目管理要求。',
        date: '2024-08-10 10:00:00',
      },
      {
        key: 's8-r2',
        code: 'KG-2024-005-R2',
        level: 2,
        reviewer: '总监理工程师-韦江腾',
        status: '通过',
        comment: '已复核，同意签发开工令。',
        date: '2024-08-12 09:30:00',
      },
    ],
    createTime: '2024-08-08 14:00:00',
  },
  {
    key: 's9',
    code: 'KG-2025-009',
    projectCode: 'XB2005-0345',
    projectName: '顺德区医疗健康信息系统一体化建设项目',
    applicant: '佛山市顺德区卫生健康局',
    planDate: '2025-06-01',
    estimatedDays: 670,
    description: '承建单位已完成医疗健康信息系统一体化建设的前期准备工作，申请正式开工。',
    attachments: [
      { name: '医疗健康信息系统建设方案.pdf', url: '#' },
      { name: '数据安全与隐私保护方案.pdf', url: '#' },
    ],
    status: '已审批',
    approvals: [
      {
        key: 's9-r1',
        code: 'KG-2025-009-R1',
        level: 1,
        reviewer: '监理工程师-滕海燕',
        status: '通过',
        comment: '开工条件已具备，实施方案可行。',
        date: '2025-05-26 10:00:00',
      },
      {
        key: 's9-r2',
        code: 'KG-2025-009-R2',
        level: 2,
        reviewer: '总监理工程师-韦江腾',
        status: '通过',
        comment: '已复核，同意签发开工令。',
        date: '2025-05-28 09:30:00',
      },
    ],
    createTime: '2025-05-22 09:00:00',
  },
]

const STATUS_COLORS: Record<StartupItem['status'], string> = {
  待审批: 'orange',
  审批中: 'blue',
  已审批: 'green',
  已驳回: 'red',
}

function StartupPage() {
  const { currentUser } = useUser()
  const [data, setData] = usePersistedState<StartupItem[]>('project-startup', initialData)
  const [projectData, setProjectData] = usePersistedState<ProjectItem[]>('project-list', initialProjectData)
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('projectManagement-startupPage-approval', {})
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()

  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<StartupItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const filteredData = data.filter(item => {
    const kw = keyword.trim().toLowerCase()
    const matchKeyword =
      !kw ||
      item.projectName.toLowerCase().includes(kw) ||
      item.projectCode.toLowerCase().includes(kw) ||
      item.code.toLowerCase().includes(kw) ||
      item.applicant.toLowerCase().includes(kw)
    const matchStatus = !statusFilter || item.status === statusFilter
    return matchKeyword && matchStatus
  })

  const handleView = (record: StartupItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    addForm.setFieldsValue({ planDate: null })
    setIsAddModalVisible(true)
  }

  const handleEdit = (record: StartupItem) => {
    if (record.status === '已审批' || record.status === '审批中') {
      message.warning('当前状态下不可编辑')
      return
    }
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      planDate: record.planDate ? dayjs(record.planDate) : null,
    })
    setIsEditModalVisible(true)
  }

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const files: UploadFile[] = values.attachments || []
      const attachmentList = files.map(f => ({
        name: f.name,
        url: f.url || '#',
      }))
      const seq = String(data.length + 1).padStart(3, '0')
      const year = new Date().getFullYear()
      const newItem: StartupItem = {
        key: `s${Date.now()}`,
        code: `KG-${year}-${seq}`,
        projectCode: values.projectCode,
        projectName: values.projectName,
        applicant: values.applicant,
        planDate: values.planDate ? values.planDate.format('YYYY-MM-DD') : '',
        estimatedDays: Number(values.estimatedDays) || 0,
        description: values.description || '',
        attachments: attachmentList,
        status: '待审批',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }
      setData(prev => [newItem, ...prev])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('开工申请已创建')
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (!currentItem) return
      const files: UploadFile[] = values.attachments || []
      const attachmentList = files.map(f => ({
        name: f.name,
        url: f.url || '#',
      }))
      setData(prev =>
        prev.map(item =>
          item.key === currentItem.key
            ? {
                ...item,
                projectCode: values.projectCode,
                projectName: values.projectName,
                applicant: values.applicant,
                planDate: values.planDate ? values.planDate.format('YYYY-MM-DD') : item.planDate,
                estimatedDays: Number(values.estimatedDays) || item.estimatedDays,
                description: values.description || item.description,
                attachments: attachmentList.length > 0 ? attachmentList : item.attachments,
              }
            : item
        )
      )
      setIsEditModalVisible(false)
      editForm.resetFields()
      setCurrentItem(null)
      message.success('修改成功')
    })
  }

  const handleDelete = (key: string) => {
    setData(prev => prev.filter(item => item.key !== key))
    message.success('已删除')
  }

  const handleStartReview = (record: StartupItem) => {
    if (record.status === '已审批') {
      message.warning('当前状态无需再次发起审批')
      return
    }
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const handleReviewSubmit = (payload: {
    status: '通过' | '驳回'
    comment: string
    reviewer: string
  }) => {
    if (!currentItem) return
    const chain = APPROVAL_CHAINS.STARTUP
    const currentLevels = (currentItem.approvals || []).length
    const newLevel = currentLevels + 1
    const isLast = newLevel >= chain.levels.length
    const newRecord: ApprovalRecord = {
      key: `${currentItem.key}-r${newLevel}`,
      code: `${currentItem.code}-R${newLevel}`,
      level: newLevel,
      reviewer: payload.reviewer,
      status: payload.status,
      comment: payload.comment,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }

    let nextStatus: StartupItem['status'] = currentItem.status
    if (payload.status === '驳回') {
      nextStatus = '已驳回'
    } else if (isLast) {
      nextStatus = '已审批'
    } else {
      nextStatus = '审批中'
    }

    const updatedApprovals = [...(currentItem.approvals || []), newRecord]
    const updatedKey = currentItem.key
    setData(prev =>
      prev.map(item =>
        item.key === updatedKey
          ? { ...item, status: nextStatus, approvals: updatedApprovals }
          : item
      )
    )
    setApprovalMap(prev => ({ ...prev, [updatedKey]: updatedApprovals }))
    setCurrentItem(prev =>
      prev && prev.key === updatedKey
        ? { ...prev, status: nextStatus, approvals: updatedApprovals }
        : prev
    )
    setIsReviewModalVisible(false)

    // 项目启动模块与项目列表状态联动：当开工申请最终审批通过后，自动将对应项目状态更新为"已启动"
    if (nextStatus === '已审批') {
      setProjectData(prev =>
        prev.map(p =>
          p.code === currentItem.projectCode ? { ...p, status: '已启动' } : p
        )
      )
      message.success(`审批已提交，当前状态：${nextStatus}，项目状态已同步为"已启动"`)
    } else {
      message.success(`审批已提交，当前状态：${nextStatus}`)
    }
  }

  const getDocContext = (item: StartupItem) => {
    const records = getApprovalRecords(
      { key: item.key, code: item.code, status: item.status },
      approvalMap,
      'STARTUP',
      item.planDate
    )
    const finalRecords = (item.approvals && item.approvals.length > 0) || records.length > 0
      ? (item.approvals && item.approvals.length > 0 ? item.approvals : records)
      : []
    return {
      kind: 'startupOrder' as const,
      ctx: {
        code: item.code,
        projectName: item.projectName,
        contractRef: `项目编号：${item.projectCode}`,
        title: '工程开工令',
        subtitle: `承建单位：${item.applicant}`,
        body: [
          `根据监理合同及相关法规要求，经监理工程师对承建单位提交的开工申请及实施方案进行审核，现依据审批意见签发本开工令。`,
          `项目名称：${item.projectName}`,
          `承建单位：${item.applicant}`,
          `计划开工日期：${item.planDate}`,
          `工期：${item.estimatedDays} 天`,
          `开工说明：${item.description || '—'}`,
          `开工条件已具备，同意于 ${item.planDate} 正式开工，承建单位应严格按批准的实施方案组织施工，确保工程质量、安全与进度。`,
        ],
        attachments: item.attachments.map(a => a.name),
        approvals: finalRecords,
        date: item.planDate || dayjs().format('YYYY-MM-DD'),
      },
    }
  }

  const columns = [
    {
      title: '开工令编号',
      dataIndex: 'code',
      key: 'code',
      width: 140,
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 260,
    },
    {
      title: '承建单位',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 200,
    },
    {
      title: '计划开工日期',
      dataIndex: 'planDate',
      key: 'planDate',
      width: 130,
    },
    {
      title: '工期（天）',
      dataIndex: 'estimatedDays',
      key: 'estimatedDays',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: StartupItem['status']) => (
        <Tag color={STATUS_COLORS[status]}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right' as const,
      render: (_: unknown, record: StartupItem) => {
        const canStartReview = record.status === '待审批' || record.status === '已驳回'
        const canContinueReview = record.status === '审批中'
        return (
          <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Button type="link" icon={<EyeOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleView(record); }}>
              查看
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
              disabled={record.status === '已审批' || record.status === '审批中'}
            >
              编辑
            </Button>
            {(canStartReview || canContinueReview) && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="small"
                onClick={(e) => { e.stopPropagation(); handleStartReview(record); }}
              >
                {canContinueReview ? '继续审批' : '发起审批'}
              </Button>
            )}
            <Popconfirm
              title="确定删除此开工申请？"
              onConfirm={() => handleDelete(record.key)}
              okText="确定"
              cancelText="取消"
              disabled={record.status === '已审批' || record.status === '审批中'}
            >
              <Button
                type="link"
                icon={<DeleteOutlined />}
                size="small"
                danger
                disabled={record.status === '已审批' || record.status === '审批中'}
                onClick={(e) => e.stopPropagation()}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
          项目启动 / 开工申请管理
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
          新增开工申请
        </Button>
      </div>

      <Card>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Input
            placeholder="项目编号/名称/开工令编号模糊搜索"
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={value => setStatusFilter(value)}
            allowClear
          >
            <Option value="待审批">待审批</Option>
            <Option value="审批中">审批中</Option>
            <Option value="已审批">已审批</Option>
            <Option value="已驳回">已驳回</Option>
          </Select>
          <Button onClick={() => { setKeyword(''); setStatusFilter(undefined) }}>
            重置
          </Button>
        </div>

        <Table
          columns={columns as any}
          dataSource={filteredData}
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
          rowKey="key"
          scroll={{ x: 1250 }}
          onRow={(record: StartupItem) => ({
            onClick: () => handleView(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* 新增 */}
      <Modal
        title="新增开工申请"
        open={isAddModalVisible}
        forceRender
        onOk={handleAddOk}
        onCancel={() => setIsAddModalVisible(false)}
        width={620}
        okText="保存"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="projectCode"
            label="项目编号"
            rules={[{ required: true, message: '请输入项目编号' }]}
          >
            <Input placeholder="如 PRJ-2025-010" />
          </Form.Item>
          <Form.Item
            name="projectName"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="applicant"
            label="承建单位"
            rules={[{ required: true, message: '请输入承建单位' }]}
          >
            <Input placeholder="请输入承建单位名称" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="planDate"
              label="计划开工日期"
              rules={[{ required: true, message: '请选择计划开工日期' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="estimatedDays"
              label="预计工期（天）"
              rules={[{ required: true, message: '请输入工期' }]}
              style={{ flex: 1 }}
            >
              <Input type="number" placeholder="如 180" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="开工说明">
            <Input.TextArea rows={3} placeholder="请输入开工说明" />
          </Form.Item>
          <Form.Item
            name="attachments"
            label="实施方案附件"
            getValueProps={(fileList) => ({ fileList })}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              maxCount={10}
              iconRender={() => <UploadOutlined />}
              itemRender={(originNode, file) => (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    background: '#fafafa',
                    border: '1px solid #eee',
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                >
                  <PaperClipOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                  <span style={{ flex: 1 }}>{file.name}</span>
                  {originNode}
                </div>
              )}
            >
              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑 */}
      <Modal
        title="编辑开工申请"
        open={isEditModalVisible}
        forceRender
        onOk={handleEditOk}
        onCancel={() => { setIsEditModalVisible(false); setCurrentItem(null) }}
        width={620}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="projectCode"
            label="项目编号"
            rules={[{ required: true, message: '请输入项目编号' }]}
          >
            <Input placeholder="请输入项目编号" />
          </Form.Item>
          <Form.Item
            name="projectName"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="applicant"
            label="承建单位"
            rules={[{ required: true, message: '请输入承建单位' }]}
          >
            <Input placeholder="请输入承建单位名称" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="planDate"
              label="计划开工日期"
              rules={[{ required: true, message: '请选择计划开工日期' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="estimatedDays"
              label="预计工期（天）"
              rules={[{ required: true, message: '请输入工期' }]}
              style={{ flex: 1 }}
            >
              <Input type="number" placeholder="如 180" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="开工说明">
            <Input.TextArea rows={3} placeholder="请输入开工说明" />
          </Form.Item>
          <Form.Item
            name="attachments"
            label="实施方案附件（重新上传将替换原附件）"
            getValueProps={(fileList) => ({ fileList })}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              maxCount={10}
            >
              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="开工申请详情"
        open={isDetailModalVisible}
        onCancel={() => { setIsDetailModalVisible(false); setCurrentItem(null) }}
        footer={
          currentItem ? (
            <Space>
              <Button
                onClick={() => {
                  const { kind, ctx } = getDocContext(currentItem)
                  exportDocument(kind, ctx)
                }}
              >
                导出开工令
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  const { kind, ctx } = getDocContext(currentItem)
                  printDocument(kind, ctx)
                }}
              >
                打印开工令
              </Button>
              <Button onClick={() => { setIsDetailModalVisible(false); setCurrentItem(null) }}>
                关闭
              </Button>
            </Space>
          ) : null
        }
        width={760}
        destroyOnHidden
      >
        {currentItem && (
          <div>
            <Descriptions
              title="开工申请信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="开工令编号">{currentItem.code}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_COLORS[currentItem.status]}>{currentItem.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目编号">{currentItem.projectCode}</Descriptions.Item>
              <Descriptions.Item label="项目名称">{currentItem.projectName}</Descriptions.Item>
              <Descriptions.Item label="承建单位">{currentItem.applicant}</Descriptions.Item>
              <Descriptions.Item label="计划开工日期">{currentItem.planDate}</Descriptions.Item>
              <Descriptions.Item label="预计工期">{currentItem.estimatedDays} 天</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentItem.createTime}</Descriptions.Item>
              <Descriptions.Item label="开工说明" span={2}>
                {currentItem.description || '—'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>实施方案附件：</div>
              {currentItem.attachments && currentItem.attachments.length > 0 ? (
                <List
                  size="small"
                  bordered
                  dataSource={currentItem.attachments}
                  renderItem={item => (
                    <List.Item>
                      <Space>
                        <PaperClipOutlined style={{ color: '#1890ff' }} />
                        <a href={item.url} target="_blank" rel="noreferrer">
                          {item.name}
                        </a>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ color: '#999' }}>暂无附件</div>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>审批流程：</div>
              <ReviewTimeline
                levels={APPROVAL_CHAINS.STARTUP.levels}
                records={getApprovalRecords(
                  { key: currentItem.key, code: currentItem.code, status: currentItem.status },
                  approvalMap,
                  'STARTUP',
                  currentItem.planDate
                ).length > 0
                  ? getApprovalRecords(
                      { key: currentItem.key, code: currentItem.code, status: currentItem.status },
                      approvalMap,
                      'STARTUP',
                      currentItem.planDate
                    )
                  : currentItem.approvals}
                status={currentItem.status}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 审批弹窗 */}
      <ReviewModal
        open={isReviewModalVisible}
        title="开工申请审批"
        onClose={() => { setIsReviewModalVisible(false); setCurrentItem(null) }}
        onSubmit={handleReviewSubmit}
        reviewerOptions={APPROVAL_CHAINS.STARTUP.reviewerOptions}
        currentUser={currentUser?.name}
        defaultReviewer={(() => {
          const chain = APPROVAL_CHAINS.STARTUP
          const level = (currentItem?.approvals?.length || 0) + 1
          return chain.reviewers[level - 1] || chain.reviewerOptions[0]
        })()}
      />
    </div>
  )
}

export default StartupPage
