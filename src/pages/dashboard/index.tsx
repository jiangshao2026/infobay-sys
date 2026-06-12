import { Card, Row, Col, Statistic, Table, Tag, Progress } from 'antd'
import {
  FolderOpenOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  AlertOutlined,
  DiffOutlined,
  CheckCircleOutlined,
  BookOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'

import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import supervisionContractData from '../../data/contracts'
import qualityData from '../../data/quality'
import { safetyData } from '../../data/safety'
import changeData from '../../data/changes'
import { acceptanceData, filingData } from '../../data/acceptance'
import planData from '../../data/plans'
import ruleData from '../../data/rules'
import knowledgeData from '../../data/knowledge'
import { contractMgmtData, paymentMgmtData } from '../../data/contractMgmt'
import { formatCurrency } from '../../utils/format'
import { statusColor, CompactTableCssOnly } from '../../components/DetailModal'
import { useUser } from '../../context/UserContext'

type TodoItem = {
  key: string
  category: string
  title: string
  status: string
  projectName: string
  date: string
  priority: string
  desc: string
}

function Dashboard() {
  const { currentUser } = useUser()
  const [today] = useState(dayjs().format('YYYY年MM月DD日 dddd'))

  const projectCount = initialProjectData.length
  const supervisionContractCount = supervisionContractData.length
  const buildContractCount = contractMgmtData.length
  const qualityIssueCount = qualityData.length
  const safetyIssueCount = safetyData.length
  const changeCount = changeData.length
  const acceptanceCount = acceptanceData.length
  const filingCount = filingData.length
  const planCount = planData.length
  const ruleCount = ruleData.length
  const knowledgeCount = knowledgeData.length
  const docTotal = planCount + ruleCount
  const totalContractCount = supervisionContractCount + buildContractCount

  const inProgressProjects = initialProjectData.filter(
    p => p.status === '进行中' || p.status === '启动阶段'
  )
  const pendingAcceptanceProjects = initialProjectData.filter(
    p => p.status === '即将完工' || p.status === '进行中'
  )
  const pendingPaymentAmount = paymentMgmtData
    .filter(p => p.status === '待支付')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingChangeCount = changeData.filter(
    c => c.status === '待审批' || c.status === '待提交'
  ).length

  const recentProjects = inProgressProjects.slice(0, 6).map((p, idx) => ({
    ...p,
    progress: Math.round(30 + idx * 10 + (idx % 2 === 0 ? 0 : 5)),
  }))

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name', width: 340 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 260,
      render: (progress: number) => <Progress percent={progress} size="small" />,
    },
    {
      title: '项目金额',
      dataIndex: 'investment',
      key: 'investment',
      width: 180,
      render: (amount: number) => formatCurrency(amount),
    },
  ]

  const todoItems: TodoItem[] = [
    ...qualityData
      .filter(q => q.status === '待整改' || q.status === '整改中')
      .map(q => ({
        key: 'q-' + q.key,
        category: '质量问题',
        title: q.issue,
        status: q.status,
        projectName: getProjectNameByCode(q.projectCode),
        date: q.discoverDate,
        priority: q.level,
        desc: q.location + ' - 责任人：' + q.handler,
      })),
    ...safetyData
      .filter(s => s.status === '待处理' || s.status === '处理中')
      .map(s => ({
        key: 's-' + s.key,
        category: '安全隐患',
        title: s.description,
        status: s.status,
        projectName: getProjectNameByCode(s.projectCode),
        date: s.discoverDate,
        priority: s.riskLevel,
        desc: s.location + ' - 责任人：' + s.handler,
      })),
    ...changeData
      .filter(c => c.status === '待审批')
      .map(c => ({
        key: 'c-' + c.key,
        category: '变更申请',
        title: c.title,
        status: c.status,
        projectName: getProjectNameByCode(c.projectCode),
        date: c.applyDate,
        priority: c.urgency,
        desc: c.type + ' - 申请人：' + c.applicant,
      })),
    ...acceptanceData
      .filter(a => a.status === '待验收' || a.status === '验收中')
      .map(a => ({
        key: 'a-' + a.key,
        category: '验收事项',
        title: a.title,
        status: a.status,
        projectName: getProjectNameByCode(a.projectCode),
        date: a.date,
        priority: a.result,
        desc: a.type + ' - 验收人：' + a.inspector,
      })),
  ]

  const categoryColor = (category: string): string => {
    switch (category) {
      case '质量问题':
        return 'volcano'
      case '安全隐患':
        return 'red'
      case '变更申请':
        return 'orange'
      case '验收事项':
        return 'blue'
      default:
        return 'default'
    }
  }

  const todoColumns = [
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (category: string) => <Tag color={categoryColor(category)}>{category}</Tag>,
    },
    { title: '标题', dataIndex: 'title', key: 'title', width: 300 },
    { title: '关联项目', dataIndex: 'projectName', key: 'projectName', width: 280 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    { title: '优先级/级别', dataIndex: 'priority', key: 'priority', width: 100 },
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '说明', dataIndex: 'desc', key: 'desc', width: 280 },
  ]

  const blueIcon = <FolderOpenOutlined style={{ color: '#1890ff' }} />
  const greenIcon = <FileTextOutlined style={{ color: '#52c41a' }} />
  const orangeIcon = <CheckCircleOutlined style={{ color: '#faad14' }} />
  const redIcon = <SafetyCertificateOutlined style={{ color: '#f5222d' }} />
  const purpleIcon = <DiffOutlined style={{ color: '#722ed1' }} />
  const cyanIcon = <BookOutlined style={{ color: '#13c2c2' }} />
  const pinkIcon = <FileTextOutlined style={{ color: '#eb2f96' }} />
  const fireIcon = <BulbOutlined style={{ color: '#fa541c' }} />

  return (
    <div>
      <CompactTableCssOnly />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>欢迎回来，{currentUser.name}</h2>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>今天是 {today}，这里是您的监理工作总览。</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Statistic title="当前监督项目" value={projectCount} suffix="个" valueStyle={{ color: '#1890ff' }} />
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="项目总数" value={projectCount} suffix="个" prefix={blueIcon} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="监理合同数" value={totalContractCount} suffix="份" prefix={greenIcon} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="质量问题数" value={qualityIssueCount} suffix="条" prefix={orangeIcon} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="安全隐患数" value={safetyIssueCount} suffix="条" prefix={redIcon} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="变更申请数" value={changeCount} suffix="条" prefix={purpleIcon} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="验收备案数" value={acceptanceCount + filingCount} suffix="条" prefix={cyanIcon} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="文档总数" value={docTotal} suffix="份" prefix={pinkIcon} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="知识条目数" value={knowledgeCount} suffix="条" prefix={fireIcon} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中项目"
              value={inProgressProjects.length}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待验收项目"
              value={pendingAcceptanceProjects.length}
              suffix="个"
              valueStyle={{ color: '#13c2c2' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待支付金额"
              value={formatCurrency(pendingPaymentAmount)}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审批变更"
              value={pendingChangeCount}
              suffix="条"
              valueStyle={{ color: '#f5222d' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="近期项目进度" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          dataSource={recentProjects}
          columns={projectColumns}
          pagination={false}
          rowKey="key"
        />
      </Card>

      <Card title={'待处理事项（共 ' + todoItems.length + ' 条）'}>
        <Table
          size="small"
          dataSource={todoItems}
          columns={todoColumns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          rowKey="key"
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  )
}

export default Dashboard
