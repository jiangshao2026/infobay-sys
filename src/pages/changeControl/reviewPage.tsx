import { Card, Table, Button, Space, Input, Select, Form, message, Tag } from 'antd'
import { SearchOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import initialData from '../../data/changeRequests'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { ChangeRequestItem, CRStatus, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS } from '../../components/ReviewFlow'
import { DocumentList } from '../../components/DocumentUploader'
import { formatCurrency } from '../../utils/format'

const { Option } = Select

const changeStatusColor = (status: string): string => {
  switch (status) {
    case '草稿':
      return 'default'
    case '待一审':
      return 'gold'
    case '一审中':
      return 'cyan'
    case '一审通过':
      return 'blue'
    case '待二审':
      return 'purple'
    case '二审中':
      return 'magenta'
    case '二审通过':
      return 'geekblue'
    case '已审批':
      return 'green'
    case '已驳回':
      return 'volcano'
    case '已执行':
      return 'lime'
    default:
      return 'gray'
  }
}

const nextStatusMap: Record<string, CRStatus> = {
  '草稿': '待一审',
  '待一审': '一审中',
  '一审中': '一审通过',
  '一审通过': '待二审',
  '待二审': '二审中',
  '二审中': '二审通过',
  '二审通过': '已审批',
}

const getLevelFromStatus = (status: string): number => {
  const levelMap: Record<string, number> = {
    '待一审': 1,
    '一审中': 1,
    '一审通过': 1,
    '待二审': 2,
    '二审中': 2,
    '二审通过': 2,
    '已审批': 3,
    '已驳回': 1,
    '已执行': 3,
  }
  return levelMap[status] || 0
}

const isPendingStatus = (status: string): boolean => {
  const pendingList = ['草稿', '待一审', '一审中', '一审通过', '待二审', '二审中', '二审通过']
  return pendingList.includes(status)
}

interface ReviewPageProps {}

const ReviewPanel: React.FC<ReviewPageProps> = () => {
  const [list, setList] = useState<ChangeRequestItem[]>(initialData.filter(item => isPendingStatus(item.status)))
  const [approvalMap, setApprovalMap] = useState<Record<string, ApprovalRecord[]>>({})
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ChangeRequestItem | null>(null)
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '项目',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 280,
      render: (code: string) => descText(getProjectNameByCode(code)),
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '变更类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '当前级别',
      dataIndex: 'currentLevel',
      key: 'currentLevel',
      width: 100,
      render: (_: unknown, record: ChangeRequestItem) => {
        const lvl = record.currentLevel || getLevelFromStatus(record.status)
        return descText(`第${lvl}级`)
      },
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 90,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '申请日期',
      dataIndex: 'applyDate',
      key: 'applyDate',
      width: 110,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '影响金额',
      dataIndex: 'impactCost',
      key: 'impactCost',
      width: 130,
      render: (v: number) => <span style={{ fontWeight: 600, color: v > 0 ? '#f5222d' : '#52c41a' }}>{formatCurrency(v)}</span>,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CRStatus) => <Tag color={changeStatusColor(status)}>{status}</Tag>,
      onCell: (record: ChangeRequestItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: ChangeRequestItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看</Button>
          {isPendingStatus(record.status) && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
          )}
        </Space>
      ),
    },
  ]

  const handleView = (record: ChangeRequestItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleReview = (record: ChangeRequestItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const handleSearch = () => {
    searchForm.validateFields().then(values => {
      let filtered = initialData.filter(item => isPendingStatus(item.status)).filter(item => {
        let match = true
        if (values.keyword) {
          const kw = values.keyword.toLowerCase()
          match = match && (
            item.code.toLowerCase().includes(kw) ||
            item.title.toLowerCase().includes(kw) ||
            item.applicant.toLowerCase().includes(kw)
          )
        }
        if (values.projectCode) {
          match = match && item.projectCode === values.projectCode
        }
        if (values.status) {
          match = match && item.status === values.status
        }
        return match
      })
      setList(filtered)
      message.success(`查询到 ${filtered.length} 条记录`)
    }).catch(() => {})
  }

  const handleReset = () => {
    searchForm.resetFields()
    setList(initialData.filter(item => isPendingStatus(item.status)))
  }

  const handleCancel = () => {
    setIsDetailModalVisible(false)
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string }) => {
    if (!currentItem) return
    const key = currentItem.key
    const existingRecords = approvalMap[key] || []
    const currentLevel = currentItem.currentLevel || getLevelFromStatus(currentItem.status)
    const newRecord: ApprovalRecord = {
      key: `${key}-${currentLevel}`,
      code: `${currentItem.code}-R${currentLevel}`,
      level: currentLevel,
      reviewer: payload.reviewer,
      comment: payload.comment,
      status: payload.status,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
    setApprovalMap(prev => ({ ...prev, [key]: [...existingRecords, newRecord] }))

    if (payload.status === '驳回') {
      const updated = initialData.map(item => item.key === key ? { ...item, status: '已驳回' as CRStatus } : item)
      setList(updated.filter(item => isPendingStatus(item.status)))
      message.success('已驳回')
    } else {
      const nextStatus = nextStatusMap[currentItem.status] || '已审批'
      const updated = initialData.map(item =>
        item.key === key ? { ...item, status: nextStatus, currentLevel: getLevelFromStatus(nextStatus) } : item
      )
      setList(updated.filter(item => isPendingStatus(item.status)))
      message.success('审批已提交')
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>变更审批工作台</h2>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="projectCode">
            <Select placeholder="项目" style={{ width: 220 }} allowClear showSearch optionFilterProp="children">
              {projectOptions}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 130 }} allowClear>
              <Option value="草稿">草稿</Option>
              <Option value="待一审">待一审</Option>
              <Option value="一审中">一审中</Option>
              <Option value="一审通过">一审通过</Option>
              <Option value="待二审">待二审</Option>
              <Option value="二审中">二审中</Option>
              <Option value="二审通过">二审通过</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/申请人）" prefix={<SearchOutlined />} style={{ width: 280 }} />
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
          scroll={{ x: 1800 }}
          rowKey="key"
        />
      </Card>

      <DetailModal
        open={isDetailModalVisible}
        title="变更申请详情"
        width={820}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('所属项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('标题', descText(currentItem.title)),
            descItem('变更类型', descText(currentItem.type)),
            descItem('申请人', descText(currentItem.applicant)),
            descItem('申请日期', descText(currentItem.applyDate)),
            descItem('影响工期', <span style={{ fontWeight: 600 }}>{currentItem.impactScheduleDays > 0 ? `+${currentItem.impactScheduleDays}` : currentItem.impactScheduleDays} 天</span>),
            descItem('影响金额', <span style={{ fontWeight: 600 }}>{formatCurrency(currentItem.impactCost)}</span>),
            descItem('状态', <Tag color={changeStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            currentItem.description ? descItem('变更描述', descText(currentItem.description)) : null,
            currentItem.reason ? descItem('变更原因', descText(currentItem.reason)) : null,
          ].filter(Boolean) as any[]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          items.push(descItem('审批记录', <ReviewTimeline records={getApprovalRecords(currentItem, approvalMap, 'PROJECT')} status={currentItem.status} levels={APPROVAL_CHAINS.PROJECT.levels} />))
          return items
        })()}
      />

      <ReviewModal
        open={isReviewModalVisible}
        title="审批操作"
        onClose={handleCancel}
        onSubmit={handleReviewSubmit}
        reviewerOptions={APPROVAL_CHAINS.PROJECT.reviewerOptions}
        okText="提交审批"
      />
    </div>
  )
}

export default ReviewPanel
