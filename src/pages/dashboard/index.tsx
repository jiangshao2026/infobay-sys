import { Card, Row, Col, Statistic, Table, Tag, Progress, Modal, Descriptions, Button, Space, Pagination } from 'antd'
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
  EyeOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

import { useCrossModuleData } from '../../context/CrossModuleDataContext'
import { getProjectNameByCode } from '../../data/projects'
import fileArchivesData from '../../data/fileArchives'
import { formatCurrency } from '../../utils/format'
import { statusColor, CompactTableCssOnly } from '../../components/DetailModal'
import { useUser } from '../../context/UserContext'
import { useAppData } from '../../context/AppDataContext'

type TodoItem = {
  key: string
  category: string
  title: string
  status: string
  projectName: string
  date: string
  priority: string
  desc: string
  source: any
}

function Dashboard() {
  const { currentUser } = useUser()
  const { contractList: supervisionContractList } = useAppData()
  const navigate = useNavigate()
  const [today] = useState(dayjs().format('YYYY年MM月DD日 dddd'))

  // ==================== 数据统计（跨模块共享数据 — 通过 Context 实时同步） ====================
  const {
    projectList, contractMgmtList, paymentList,
    qualityIssueList, safetyCheckList, safetyIncidentList,
    changeRequestList, acceptCheckList, infoDocList, knowledgeDocList,
  } = useCrossModuleData()

  const projectCount = projectList.length                         // 项目总数
  const inProgressProjects = projectList.filter(p => p.status === '已启动')   // 已启动（进行中）
  const acceptedProjects = projectList.filter(p => p.status === '已验收')      // 已验收
  const notStartedProjects = projectList.filter(p => p.status === '未启动')    // 未启动
  const supervisionContractCount = supervisionContractList.length         // 监理合同
  const buildContractCount = contractMgmtList.length                       // 建设合同
  const totalContractCount = supervisionContractCount + buildContractCount  // 合同总数
  const qualityIssueCount = qualityIssueList.length                       // 质量问题
  const safetyIssueCount = safetyIncidentList.length + safetyCheckList.length   // 安全隐患
  const changeCount = changeRequestList.length                             // 变更申请
  const acceptanceCount = acceptCheckList.length                       // 验收
  const filingCount = fileArchivesData.length                               // 归档
  const docTotal = infoDocList.length                                     // 文档
  const knowledgeCount = knowledgeDocList.length                               // 知识条目

  // 监理合同待审批（区分已审批/已完成/待审批状态）
  const pendingApprovalContracts = supervisionContractList.filter((c: any) => c.status === '待审批')
  const approvedContracts = supervisionContractList.filter((c: any) => c.status === '已审批' || c.status === '已完成')

  // 建设合同待审批
  const pendingApprovalBuildContracts = contractMgmtList.filter((c: any) => c.status === '待审批' || c.status === '待一审' || c.status === '一审中')

  // 支付管理（待支付）：二审"已审批"但尚未实际付款的支付单
  const pendingPayments = paymentList.filter((p: any) => p.status === '已审批')
  const pendingPaymentAmount = pendingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  // 待审批变更
  const pendingChanges = changeRequestList.filter((c: any) =>
    c.status === '待审批' || c.status === '一审通过' || c.status === '待提交' || c.status === '待一审' || c.status === '一审中'
  )

  // 待验收项目 = 已启动项目中有待验收检查记录（这里简化：已启动项目中存在待审批验收检查记录的项目）
  const pendingAcceptanceProjectCodes = new Set(
    acceptCheckList
      .filter((a: any) => a.status === '待审批' || a.status === '进行中' || a.status === '待安排')
      .map((a: any) => a.projectCode)
  )
  const pendingAcceptanceProjects = projectList.filter(p => pendingAcceptanceProjectCodes.has(p.code))

  // ==================== 弹窗状态 ====================
  const [listModal, setListModal] = useState<{ open: boolean; title: string; columns: any[]; data: any[]; page: number; listType?: string }>({
    open: false,
    title: '',
    columns: [],
    data: [],
    page: 1,
    listType: undefined,
  })

  const [projectDetailModal, setProjectDetailModal] = useState<{ open: boolean; project: any }>({
    open: false,
    project: null,
  })

  const [todoDetailModal, setTodoDetailModal] = useState<{ open: boolean; item: TodoItem | null }>({
    open: false,
    item: null,
  })

  const closeListModal = () => setListModal(prev => ({ ...prev, open: false }))
  const closeProjectDetail = () => setProjectDetailModal({ open: false, project: null })
  const closeTodoDetail = () => setTodoDetailModal({ open: false, item: null })

  const navigateToTodoSource = (item: TodoItem) => {
    const routes: Record<string, string> = {
      '质量问题': '/quality/issue',
      '安全隐患': '/safety/incident',
      '安全检查': '/safety/check',
      '变更申请': '/change/request',
      '验收事项': '/acceptance/check',
      '监理合同': '/project/supervision-contract',
      '建设合同': '/contract/list',
      '支付申请': '/contract/payment',
    }
    const route = routes[item.category]
    if (route) {
      navigate(route)
    }
  }

  const listTypeRoutes: Record<string, string> = {
    '项目': '/project/list',
    '监理合同': '/project/supervision-contract',
    '质量问题': '/quality/issue',
    '安全隐患': '/safety/incident',
    '变更申请': '/change/request',
    '验收': '/acceptance/check',
    '文档': '/information/document',
    '知识库': '/knowledge/doc',
    '待支付': '/contract/payment',
  }

  const navigateToListSource = (listType?: string) => {
    if (listType && listTypeRoutes[listType]) {
      closeListModal()
      navigate(listTypeRoutes[listType])
    }
  }

  // ==================== 各类别列表展示 ====================
  const showProjectList = () => {
    const columns = [
      { title: '项目编号', dataIndex: 'code', key: 'code', width: 140 },
      { title: '项目名称', dataIndex: 'name', key: 'name', width: 320 },
      { title: '类型', dataIndex: 'type', key: 'type', width: 140 },
      { title: '规模', dataIndex: 'scale', key: 'scale', width: 80 },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag> },
      { title: '负责人', dataIndex: 'manager', key: 'manager', width: 100 },
      { title: '投资金额', dataIndex: 'investment', key: 'investment', width: 140, render: (v: number) => formatCurrency(v) },
      { title: '建设周期', dataIndex: 'startDate', key: 'period', width: 220, render: (_: string, row: any) => row.startDate + ' ~ ' + row.endDate },
      { title: '建设单位', dataIndex: 'owner', key: 'owner', width: 200 },
    ]
    setListModal({ open: true, page: 1, title: '项目列表（共 ' + projectCount + ' 个）', columns, data: projectList, listType: '项目' })
  }

  const showContractList = () => {
    const columns = [
      { title: '合同编号', dataIndex: 'code', key: 'code', width: 140 },
      { title: '合同名称', dataIndex: 'name', key: 'name', width: 320 },
      { title: '关联项目', dataIndex: 'projectCode', key: 'pc', width: 200, render: (v: string) => getProjectNameByCode(v) },
      { title: '建设单位', dataIndex: 'partyA', key: 'partyA', width: 200 },
      { title: '承建单位', dataIndex: 'partyB', key: 'partyB', width: 200 },
      { title: '合同金额', dataIndex: 'amount', key: 'amount', width: 140, render: (v: number) => formatCurrency(v) },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag> },
      { title: '签订日期', dataIndex: 'signDate', key: 'signDate', width: 120 },
    ]
    setListModal({ open: true, page: 1, title: '监理合同列表（共 ' + supervisionContractCount + ' 份）', columns, data: supervisionContractList, listType: '监理合同' })
  }

  const showQualityList = () => {
    const columns = [
      { title: '编号', dataIndex: 'code', key: 'code', width: 120 },
      { title: '问题标题', dataIndex: 'title', key: 'title', width: 320 },
      { title: '级别', dataIndex: 'level', key: 'level', width: 80, render: (v: string) => <Tag color={v === '严重' || v === '较严重' ? 'red' : 'orange'}>{v}</Tag> },
      { title: '关联项目', dataIndex: 'projectCode', key: 'pc', width: 200, render: (v: string) => getProjectNameByCode(v) },
      { title: '发现位置', dataIndex: 'location', key: 'loc', width: 200 },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      { title: '责任人', dataIndex: 'handler', key: 'handler', width: 100 },
      { title: '整改期限', dataIndex: 'deadline', key: 'deadline', width: 120 },
      { title: '发现日期', dataIndex: 'discoverDate', key: 'discoverDate', width: 120 },
    ]
    setListModal({ open: true, page: 1, title: '质量问题列表（共 ' + qualityIssueList.length + ' 条）', columns, data: qualityIssueList, listType: '质量问题' })
  }

  const showSafetyList = () => {
    const allSafety = [
      ...safetyIncidentList.map((s: any) => ({ ...s, category: '安全事故', level: s.level, handler: s.handler, date: s.incidentDate, _rowKey: 'si-' + s.key })),
      ...safetyCheckList.map((c: any) => ({ ...c, category: '安全检查', level: c.level, handler: c.reviewer, date: c.checkDate, _rowKey: 'sc-' + c.key })),
    ]
    const columns = [
      { title: '编号', dataIndex: 'code', key: 'code', width: 120 },
      { title: '类型', dataIndex: 'category', key: 'cat', width: 100, render: (v: string) => <Tag color={v === '安全事故' ? 'red' : 'blue'}>{v}</Tag> },
      { title: '标题', dataIndex: 'title', key: 'title', width: 340 },
      { title: '等级', dataIndex: 'level', key: 'level', width: 100, render: (v: string) => <Tag color="volcano">{v}</Tag> },
      { title: '关联项目', dataIndex: 'projectCode', key: 'pc', width: 200, render: (v: string) => getProjectNameByCode(v) },
      { title: '位置', dataIndex: 'location', key: 'loc', width: 220 },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      { title: '责任人/检查人', dataIndex: 'handler', key: 'handler', width: 120 },
      { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    ]
    setListModal({ open: true, page: 1, title: '安全隐患列表（共 ' + allSafety.length + ' 条）', columns, data: allSafety, listType: '安全隐患' })
  }

  const showChangeList = () => {
    const columns = [
      { title: '编号', dataIndex: 'code', key: 'code', width: 120 },
      { title: '变更标题', dataIndex: 'title', key: 'title', width: 320 },
      { title: '变更类型', dataIndex: 'type', key: 'type', width: 120 },
      { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100, render: (v: string) => <Tag color={v === '高' ? 'red' : 'orange'}>{v}</Tag> },
      { title: '关联项目', dataIndex: 'projectCode', key: 'pc', width: 200, render: (v: string) => getProjectNameByCode(v) },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
      { title: '影响成本', dataIndex: 'impactCost', key: 'impactCost', width: 140, render: (v: number) => v ? formatCurrency(v) : '-' },
      { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate', width: 120 },
    ]
    setListModal({ open: true, page: 1, title: '变更申请列表（共 ' + changeRequestList.length + ' 条）', columns, data: changeRequestList, listType: '变更申请' })
  }

  const showKnowledgeList = () => {
    const columns = [
      { title: '编号', dataIndex: 'code', key: 'code', width: 140 },
      { title: '标题', dataIndex: 'title', key: 'title', width: 320 },
      { title: '分类', dataIndex: 'category', key: 'category', width: 120, render: (v: string) => <Tag color="purple">{v}</Tag> },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      { title: '作者', dataIndex: 'author', key: 'author', width: 120 },
      { title: '阅读量', dataIndex: 'views', key: 'views', width: 100 },
      { title: '标签', dataIndex: 'tags', key: 'tags', width: 240, render: (tags: string[]) => tags && tags.slice(0, 3).map((t: string) => <Tag key={t} color="cyan">{t}</Tag>) },
      { title: '更新日期', dataIndex: 'updateDate', key: 'updateDate', width: 120 },
    ]
    setListModal({ open: true, page: 1, title: '知识库条目列表（共 ' + knowledgeDocList.length + ' 条）', columns, data: knowledgeDocList, listType: '知识库' })
  }

  const showAcceptanceList = () => {
    const allAcceptance = [
      ...acceptCheckList.map((a: any) => ({ ...a, aType: '验收检查', inspector: a.inspector, date: a.checkDate, result: a.result, _rowKey: 'ac-' + a.key })),
      ...fileArchivesData.map((f: any) => ({ ...f, aType: '档案归档', inspector: f.archivist, date: f.archiveDate, result: f.category, _rowKey: 'fa-' + f.key })),
    ]
    const columns = [
      { title: '编号', dataIndex: 'code', key: 'code', width: 120 },
      { title: '标题', dataIndex: 'title', key: 'title', width: 320 },
      { title: '类型', dataIndex: 'aType', key: 'at', width: 100, render: (v: string) => <Tag color={v === '验收检查' ? 'blue' : 'cyan'}>{v}</Tag> },
      { title: '关联项目', dataIndex: 'projectCode', key: 'pc', width: 200, render: (v: string) => getProjectNameByCode(v) },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag> },
      { title: '验收人/归档人', dataIndex: 'inspector', key: 'inspector', width: 120 },
      { title: '结果/类别', dataIndex: 'result', key: 'result', width: 120 },
      { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    ]
    setListModal({ open: true, page: 1, title: '验收与备案列表（共 ' + allAcceptance.length + ' 条）', columns, data: allAcceptance, listType: '验收' })
  }

  const showDocList = () => {
    const columns = [
      { title: '编号', dataIndex: 'code', key: 'code', width: 140 },
      { title: '文档标题', dataIndex: 'title', key: 'title', width: 340 },
      { title: '文档分类', dataIndex: 'category', key: 'cat', width: 120, render: (v: string) => <Tag color="geekblue">{v}</Tag> },
      { title: '文档类型', dataIndex: 'type', key: 'type', width: 160 },
      { title: '关联项目', dataIndex: 'projectCode', key: 'pc', width: 160, render: (v: string) => (v ? getProjectNameByCode(v) : '-') },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag> },
      { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
      { title: '作者', dataIndex: 'author', key: 'author', width: 120 },
      { title: '发布日期', dataIndex: 'uploadDate', key: 'ud', width: 120 },
    ]
    setListModal({ open: true, page: 1, title: '文档列表（共 ' + infoDocList.length + ' 份）', columns, data: infoDocList, listType: '文档' })
  }

  const showInProgressProjectList = () => {
    const columns = [
      { title: '项目编号', dataIndex: 'code', key: 'code', width: 140 },
      { title: '项目名称', dataIndex: 'name', key: 'name', width: 320 },
      { title: '类型', dataIndex: 'type', key: 'type', width: 140 },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag> },
      { title: '负责人', dataIndex: 'manager', key: 'manager', width: 100 },
      { title: '投资金额', dataIndex: 'investment', key: 'investment', width: 140, render: (v: number) => formatCurrency(v) },
      { title: '建设周期', dataIndex: 'startDate', key: 'period', width: 220, render: (_: string, row: any) => row.startDate + ' ~ ' + row.endDate },
    ]
    setListModal({ open: true, page: 1, title: '进行中项目列表（共 ' + inProgressProjects.length + ' 个）', columns, data: inProgressProjects, listType: '项目' })
  }

  const showPendingAcceptanceList = () => {
    const columns = [
      { title: '项目编号', dataIndex: 'code', key: 'code', width: 140 },
      { title: '项目名称', dataIndex: 'name', key: 'name', width: 320 },
      { title: '类型', dataIndex: 'type', key: 'type', width: 140 },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag> },
      { title: '负责人', dataIndex: 'manager', key: 'manager', width: 100 },
      { title: '投资金额', dataIndex: 'investment', key: 'investment', width: 140, render: (v: number) => formatCurrency(v) },
    ]
    setListModal({ open: true, page: 1, title: '待验收项目列表（共 ' + pendingAcceptanceProjects.length + ' 个）', columns, data: pendingAcceptanceProjects, listType: '项目' })
  }

  const showPendingPaymentList = () => {
    const filtered = paymentList.filter((p: any) => p.status === '已审批')
    const columns = [
      { title: '支付编号', dataIndex: 'code', key: 'code', width: 140 },
      { title: '合同编号', dataIndex: 'contractCode', key: 'contractCode', width: 160 },
      {
        title: '项目名称',
        dataIndex: 'projectCode',
        key: 'projectCode',
        width: 280,
        render: (v: string) => getProjectNameByCode(v),
      },
      { title: '款项类型', dataIndex: 'payType', key: 'payType', width: 100 },
      { title: '申请金额', dataIndex: 'amount', key: 'amount', width: 140, render: (v: number) => formatCurrency(v) },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      { title: '申请单位', dataIndex: 'contractor', key: 'contractor', width: 220 },
      { title: '计划支付日期', dataIndex: 'payDate', key: 'payDate', width: 140 },
      { title: '备注', dataIndex: 'remark', key: 'remark', width: 220 },
    ]
    setListModal({ open: true, page: 1, title: '待支付金额列表（共 ' + filtered.length + ' 条）', columns, data: filtered, listType: '待支付' })
  }

  const showPendingChangeList = () => {
    const pendingChanges = changeRequestList.filter((c: any) =>
      c.status === '待审批' || c.status === '待一审' || c.status === '一审中' || c.status === '一审通过' || c.status === '待提交'
    )
    const columns = [
      { title: '变更编号', dataIndex: 'code', key: 'code', width: 120 },
      { title: '变更标题', dataIndex: 'title', key: 'title', width: 320 },
      { title: '变更类型', dataIndex: 'type', key: 'type', width: 120 },
      { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100, render: (v: string) => <Tag color={v === '高' ? 'red' : 'orange'}>{v}</Tag> },
      { title: '关联项目', dataIndex: 'projectCode', key: 'pc', width: 200, render: (v: string) => getProjectNameByCode(v) },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
      { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate', width: 120 },
    ]
    setListModal({ open: true, page: 1, title: '待审批变更列表（共 ' + pendingChanges.length + ' 条）', columns, data: pendingChanges, listType: '变更申请' })
  }

  // ==================== 近期项目进度（基于实际建设周期计算） ====================
  const computeProjectProgress = (start: string, end: string): number => {
    const s = dayjs(start)
    const e = dayjs(end)
    const now = dayjs()
    if (!s.isValid() || !e.isValid()) return 0
    const total = e.diff(s, 'day')
    if (total <= 0) return 100
    if (now.isBefore(s)) return 5
    if (now.isAfter(end)) return 100
    const elapsed = now.diff(s, 'day')
    return Math.min(100, Math.max(5, Math.round((elapsed / total) * 100)))
  }

  // 已启动项目按建设周期计算真实进度；已验收项目为 100%
  const recentProjects = inProgressProjects.slice(0, 8).map((p: any) => ({
    ...p,
    progress: computeProjectProgress(p.startDate, p.endDate),
  }))
  const acceptedProjectDetails = acceptedProjects.map((p: any) => ({ ...p, progress: 100 }))

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name', width: 340 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag> },
    { title: '进度', dataIndex: 'progress', key: 'progress', width: 260, render: (progress: number) => <Progress percent={progress} size="small" /> },
    { title: '项目金额', dataIndex: 'investment', key: 'investment', width: 180, render: (amount: number) => formatCurrency(amount) },
  ]

  // ==================== 待处理事项（来自各模块的真实待处理数据） ====================
  const todoItems: TodoItem[] = [
    // 质量问题：待整改 / 整改中
    ...qualityIssueList
      .filter((q: any) => q.status === '待整改' || q.status === '整改中')
      .map((q: any) => ({
        key: 'q-' + q.key,
        category: '质量问题',
        title: q.title,
        status: q.status,
        projectName: getProjectNameByCode(q.projectCode),
        date: q.discoverDate,
        priority: q.level,
        desc: q.location + ' - 责任人：' + q.handler,
        source: q,
      })),
    // 安全隐患：待处理 / 处理中
    ...safetyIncidentList
      .filter((s: any) => s.status === '待处理' || s.status === '处理中')
      .map((s: any) => ({
        key: 'si-' + s.key,
        category: '安全隐患',
        title: s.title,
        status: s.status,
        projectName: getProjectNameByCode(s.projectCode),
        date: s.incidentDate,
        priority: s.level,
        desc: s.location + ' - 责任人：' + s.handler,
        source: s,
      })),
    // 安全检查：待审批
    ...safetyCheckList
      .filter((sc: any) => sc.status === '待审批' || sc.status === '一审中')
      .map((sc: any) => ({
        key: 'sc-' + sc.key,
        category: '安全检查',
        title: sc.title,
        status: sc.status,
        projectName: getProjectNameByCode(sc.projectCode),
        date: sc.checkDate,
        priority: sc.level,
        desc: sc.location + ' - 检查人：' + sc.reviewer,
        source: sc,
      })),
    // 变更申请：待审批 / 待一审 / 一审中 / 一审通过
    ...changeRequestList
      .filter((c: any) => c.status === '待审批' || c.status === '待一审' || c.status === '一审中' || c.status === '一审通过' || c.status === '待提交')
      .map((c: any) => ({
        key: 'c-' + c.key,
        category: '变更申请',
        title: c.title,
        status: c.status,
        projectName: getProjectNameByCode(c.projectCode),
        date: c.applyDate,
        priority: c.priority,
        desc: c.type + ' - 申请人：' + c.applicant,
        source: c,
      })),
    // 验收检查：待审批 / 进行中 / 待安排
    ...acceptCheckList
      .filter((a: any) => a.status === '待审批' || a.status === '进行中' || a.status === '待安排' || a.status === '待验收')
      .map((a: any) => ({
        key: 'a-' + a.key,
        category: '验收事项',
        title: a.title,
        status: a.status,
        projectName: getProjectNameByCode(a.projectCode),
        date: a.checkDate,
        priority: a.result || '待检查',
        desc: a.type + ' - 验收人：' + a.inspector,
        source: a,
      })),
    // 监理合同：待审批
    ...supervisionContractList
      .filter((c: any) => c.status === '待审批' || c.status === '待总监理工程师审批' || c.status === '待部门经理审批' || c.status === '待分管副总经理审批')
      .map((c: any) => ({
        key: 'j-' + c.key,
        category: '监理合同',
        title: c.name,
        status: c.status,
        projectName: getProjectNameByCode(c.projectCode),
        date: c.signDate,
        priority: '正常',
        desc: c.partyA + ' - 金额：' + formatCurrency(c.amount),
        source: c,
      })),
    // 建设合同（contractMgmtList）：待审批 / 一审中 / 一审通过
    ...contractMgmtList
      .filter((c: any) => c.status === '待审批' || c.status === '待一审' || c.status === '一审中')
      .map((c: any) => ({
        key: 'b-' + c.key,
        category: '建设合同',
        title: c.name,
        status: c.status,
        projectName: getProjectNameByCode(c.projectCode),
        date: c.signDate,
        priority: '正常',
        desc: c.type + ' - 金额：' + formatCurrency(c.amount),
        source: c,
      })),
    // 支付管理：二审已审批但尚未实际付款
    ...paymentList
      .filter((p: any) => p.status === '已审批')
      .map((p: any) => ({
        key: 'p-' + p.key,
        category: '支付申请',
        title: (p.type || '进度款') + ' - ' + (p.remark || ''),
        status: p.status,
        projectName: getProjectNameByCode(p.projectCode),
        date: p.payDate,
        priority: '正常',
        desc: '金额：' + formatCurrency(p.amount) + '（' + (p.contractor || '') + '）',
        source: p,
      })),
  ]

  const categoryColor = (category: string): string => {
    switch (category) {
      case '质量问题':
        return 'volcano'
      case '安全隐患':
        return 'red'
      case '安全检查':
        return 'geekblue'
      case '变更申请':
        return 'orange'
      case '验收事项':
        return 'blue'
      case '监理合同':
        return 'purple'
      case '建设合同':
        return 'magenta'
      case '支付申请':
        return 'cyan'
      default:
        return 'default'
    }
  }

  const todoColumns = [
    { title: '类型', dataIndex: 'category', key: 'category', width: 110, render: (category: string) => <Tag color={categoryColor(category)}>{category}</Tag> },
    { title: '标题', dataIndex: 'title', key: 'title', width: 300 },
    { title: '关联项目', dataIndex: 'projectName', key: 'projectName', width: 280 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag> },
    { title: '优先级/级别', dataIndex: 'priority', key: 'priority', width: 120 },
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '说明', dataIndex: 'desc', key: 'desc', width: 240 },
  ]

  // ==================== 图标 ====================
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>欢迎回来，{currentUser.name}</h2>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>今天是 {today}，这里是您的监理工作总览。</p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Statistic title="项目总数" value={projectCount} suffix="个" valueStyle={{ color: '#1890ff' }} />
            <Statistic title="进行中" value={inProgressProjects.length} suffix="个" valueStyle={{ color: '#52c41a' }} />
            <Statistic title="已验收" value={acceptedProjects.length} suffix="个" valueStyle={{ color: '#13c2c2' }} />
            <Statistic title="未启动" value={notStartedProjects.length} suffix="个" valueStyle={{ color: '#8c8c8c' }} />
            <Statistic title="待处理事项" value={todoItems.length} suffix="项" valueStyle={{ color: '#fa8c16' }} />
          </div>
        </div>
      </Card>

      {/* 第一排统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card
            hoverable
            onClick={showProjectList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic title="项目总数" value={projectCount} suffix="个" prefix={blueIcon} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={showContractList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic title="监理合同数" value={supervisionContractCount} suffix="份" prefix={greenIcon} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={showQualityList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic title="质量问题数" value={qualityIssueCount} suffix="条" prefix={orangeIcon} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={showSafetyList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic title="安全隐患数" value={safetyIssueCount} suffix="条" prefix={redIcon} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={showChangeList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic title="变更申请数" value={changeCount} suffix="条" prefix={purpleIcon} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={showAcceptanceList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic title="验收备案数" value={acceptanceCount + filingCount} suffix="条" prefix={cyanIcon} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={showDocList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic title="文档总数" value={docTotal} suffix="份" prefix={pinkIcon} valueStyle={{ color: '#eb2f96' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={showKnowledgeList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic title="知识条目数" value={knowledgeCount} suffix="条" prefix={fireIcon} valueStyle={{ color: '#fa541c' }} />
          </Card>
        </Col>
      </Row>

      {/* 第二排统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card
            hoverable
            onClick={showInProgressProjectList}
            style={{ cursor: 'pointer' }}
          >
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
          <Card
            hoverable
            onClick={showPendingAcceptanceList}
            style={{ cursor: 'pointer' }}
          >
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
          <Card
            hoverable
            onClick={showPendingPaymentList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="待支付金额"
              value={formatCurrency(pendingPaymentAmount)}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={showPendingChangeList}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="待审批变更"
              value={pendingChanges.length}
              suffix="条"
              valueStyle={{ color: '#f5222d' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 近期项目进度 */}
      <Card title="近期项目进度" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          dataSource={recentProjects}
          columns={projectColumns}
          pagination={false}
          rowKey="key"
          onRow={(record: any) => ({ onClick: () => setProjectDetailModal({ open: true, project: record }), cursor: 'pointer', })}
        />
      </Card>

      {/* 待处理事项 */}
      <Card title={'待处理事项（共 ' + todoItems.length + ' 条）'}>
        <Table
          size="small"
          dataSource={todoItems}
          columns={todoColumns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          rowKey="key"
          scroll={{ x: 1600 }}
          onRow={(record: TodoItem) => ({ onClick: () => setTodoDetailModal({ open: true, item: record }), style: { cursor: 'pointer' } })}
        />
      </Card>

      {/* 列表弹窗 */}
      <Modal
        title={listModal.title}
        open={listModal.open}
        onOk={closeListModal}
        onCancel={closeListModal}
        width="90%"
        style={{ top: 30 }}
        footer={null}
      >
        <Table
          size="small"
          columns={listModal.columns}
          dataSource={listModal.data.slice((listModal.page - 1) * 10, listModal.page * 10)}
          rowKey={(record: any) => record._rowKey || record.code || String(record.key) || Math.random().toString()}
          pagination={false}
          scroll={{ x: 1400 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <Pagination
            current={listModal.page}
            pageSize={10}
            total={listModal.data.length}
            onChange={(page: number) => setListModal(prev => ({ ...prev, page }))}
            showSizeChanger={false}
          />
          <Space>
            {listModal.listType && (
              <Button type="link" icon={<EyeOutlined />} onClick={() => navigateToListSource(listModal.listType)}>
                前往模块处理
              </Button>
            )}
            <Button type="primary" onClick={closeListModal}>关闭</Button>
          </Space>
        </div>
      </Modal>

      {/* 项目详情弹窗 */}
      <Modal
        title="项目详情"
        open={projectDetailModal.open}
        onOk={closeProjectDetail}
        onCancel={closeProjectDetail}
        width={900}
        footer={[
          <Button key="overview" type="link" icon={<EyeOutlined />} onClick={() => {
            if (projectDetailModal.project) {
              closeProjectDetail()
              navigate('/project/overview/' + projectDetailModal.project.code)
            }
          }}>
            查看项目总览
          </Button>,
          <Button key="close" type="primary" onClick={closeProjectDetail}>
            关闭
          </Button>,
        ]}
      >
        {projectDetailModal.project && (
          <>
            <Descriptions
              title={projectDetailModal.project.name}
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="项目编号">{projectDetailModal.project.code}</Descriptions.Item>
              <Descriptions.Item label="项目类型">{projectDetailModal.project.type}</Descriptions.Item>
              <Descriptions.Item label="项目规模">{projectDetailModal.project.scale}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={statusColor(projectDetailModal.project.status)}>{projectDetailModal.project.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目负责人">{projectDetailModal.project.manager}</Descriptions.Item>
              <Descriptions.Item label="项目投资金额">{formatCurrency(projectDetailModal.project.investment)}</Descriptions.Item>
              <Descriptions.Item label="开始日期">{projectDetailModal.project.startDate}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{projectDetailModal.project.endDate}</Descriptions.Item>
              <Descriptions.Item label="建设地点">{projectDetailModal.project.location}</Descriptions.Item>
              <Descriptions.Item label="建设单位">{projectDetailModal.project.owner}</Descriptions.Item>
              <Descriptions.Item label="承建单位">{projectDetailModal.project.contractor}</Descriptions.Item>
              <Descriptions.Item label="监理单位">{projectDetailModal.project.supervision}</Descriptions.Item>
              <Descriptions.Item label="项目简介" span={2}>
                {projectDetailModal.project.description}
              </Descriptions.Item>
            </Descriptions>

            {projectDetailModal.project.progress !== undefined && (
              <Descriptions title="项目进度" bordered column={1} size="small">
                <Descriptions.Item label="当前进度">
                  <Progress percent={projectDetailModal.project.progress} status="active" />
                </Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Modal>

      {/* 待处理事项详情弹窗 */}
      <Modal
        title="事项详情"
        open={todoDetailModal.open}
        onOk={closeTodoDetail}
        onCancel={closeTodoDetail}
        width={900}
        footer={[
          <Button key="close" onClick={closeTodoDetail}>
            关闭
          </Button>,
          <Button key="goto" type="primary" icon={<EyeOutlined />} onClick={() => {
            if (todoDetailModal.item) navigateToTodoSource(todoDetailModal.item)
            closeTodoDetail()
          }}>
            前往处理
          </Button>,
        ]}
      >
        {todoDetailModal.item && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={categoryColor(todoDetailModal.item.category)}>{todoDetailModal.item.category}</Tag>
              <Tag color={statusColor(todoDetailModal.item.status)}>{todoDetailModal.item.status}</Tag>
              <Tag>{todoDetailModal.item.priority}</Tag>
            </Space>

            <Descriptions title={todoDetailModal.item.title} bordered column={2} size="small">
              <Descriptions.Item label="关联项目">{todoDetailModal.item.projectName}</Descriptions.Item>
              <Descriptions.Item label="日期">{todoDetailModal.item.date}</Descriptions.Item>

              {/* 质量问题详情 */}
              {todoDetailModal.item.category === '质量问题' && (
                <>
                  <Descriptions.Item label="问题编号">{todoDetailModal.item.source.code}</Descriptions.Item>
                  <Descriptions.Item label="发现位置">{todoDetailModal.item.source.location}</Descriptions.Item>
                  <Descriptions.Item label="问题级别">{todoDetailModal.item.source.level}</Descriptions.Item>
                  <Descriptions.Item label="责任人">{todoDetailModal.item.source.handler}</Descriptions.Item>
                  <Descriptions.Item label="整改期限">{todoDetailModal.item.source.deadline}</Descriptions.Item>
                  <Descriptions.Item label="检查人">{todoDetailModal.item.source.inspectionPerson}</Descriptions.Item>
                  <Descriptions.Item label="整改方案" span={2}>
                    {todoDetailModal.item.source.rectificationPlan}
                  </Descriptions.Item>
                  <Descriptions.Item label="整改结果" span={2}>
                    {todoDetailModal.item.source.rectificationResult || '待整改'}
                  </Descriptions.Item>
                  <Descriptions.Item label="复查结果" span={2}>
                    {todoDetailModal.item.source.reviewResult || '未复查'}
                  </Descriptions.Item>
                </>
              )}

              {/* 安全隐患详情 */}
              {todoDetailModal.item.category === '安全隐患' && (
                <>
                  <Descriptions.Item label="隐患编号">{todoDetailModal.item.source.code}</Descriptions.Item>
                  <Descriptions.Item label="发现位置">{todoDetailModal.item.source.location}</Descriptions.Item>
                  <Descriptions.Item label="风险等级">{todoDetailModal.item.source.riskLevel}</Descriptions.Item>
                  <Descriptions.Item label="责任人">{todoDetailModal.item.source.handler}</Descriptions.Item>
                  <Descriptions.Item label="整改期限">{todoDetailModal.item.source.deadline}</Descriptions.Item>
                  <Descriptions.Item label="检查人">{todoDetailModal.item.source.inspector}</Descriptions.Item>
                  <Descriptions.Item label="整改要求" span={2}>
                    {todoDetailModal.item.source.requirement || todoDetailModal.item.source.rectificationPlan || '详见整改通知书'}
                  </Descriptions.Item>
                  <Descriptions.Item label="整改措施" span={2}>
                    {todoDetailModal.item.source.rectificationResult || todoDetailModal.item.source.reviewResult || '处理中'}
                  </Descriptions.Item>
                </>
              )}

              {/* 变更申请详情 */}
              {todoDetailModal.item.category === '变更申请' && (
                <>
                  <Descriptions.Item label="变更编号">{todoDetailModal.item.source.code}</Descriptions.Item>
                  <Descriptions.Item label="变更类型">{todoDetailModal.item.source.type}</Descriptions.Item>
                  <Descriptions.Item label="申请人">{todoDetailModal.item.source.applicant}</Descriptions.Item>
                  <Descriptions.Item label="紧急程度">{todoDetailModal.item.source.urgency}</Descriptions.Item>
                  <Descriptions.Item label="变更原因" span={2}>
                    {todoDetailModal.item.source.reason || '详见变更申请文档'}
                  </Descriptions.Item>
                  <Descriptions.Item label="变更内容" span={2}>
                    {todoDetailModal.item.source.content || todoDetailModal.item.source.description || '详见变更申请文档'}
                  </Descriptions.Item>
                  <Descriptions.Item label="影响分析" span={2}>
                    {todoDetailModal.item.source.impact || '详见影响分析报告'}
                  </Descriptions.Item>
                </>
              )}

              {/* 验收事项详情 */}
              {todoDetailModal.item.category === '验收事项' && (
                <>
                  <Descriptions.Item label="验收编号">{todoDetailModal.item.source.code}</Descriptions.Item>
                  <Descriptions.Item label="验收类型">{todoDetailModal.item.source.type}</Descriptions.Item>
                  <Descriptions.Item label="验收人">{todoDetailModal.item.source.inspector}</Descriptions.Item>
                  <Descriptions.Item label="验收结果">{todoDetailModal.item.source.result}</Descriptions.Item>
                  <Descriptions.Item label="整改要求" span={2}>
                    {todoDetailModal.item.source.rectification || todoDetailModal.item.source.description || '详见验收报告'}
                  </Descriptions.Item>
                </>
              )}

              {/* 监理合同详情 */}
              {todoDetailModal.item.category === '监理合同' && (
                <>
                  <Descriptions.Item label="合同编号">{todoDetailModal.item.source.code}</Descriptions.Item>
                  <Descriptions.Item label="建设单位">{todoDetailModal.item.source.partyA}</Descriptions.Item>
                  <Descriptions.Item label="承建单位">{todoDetailModal.item.source.partyB}</Descriptions.Item>
                  <Descriptions.Item label="合同金额">{formatCurrency(todoDetailModal.item.source.amount)}</Descriptions.Item>
                  <Descriptions.Item label="签订日期">{todoDetailModal.item.source.signDate}</Descriptions.Item>
                  <Descriptions.Item label="项目名称">{getProjectNameByCode(todoDetailModal.item.source.projectCode)}</Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>
                    {todoDetailModal.item.source.description || todoDetailModal.item.source.remark || '—'}
                  </Descriptions.Item>
                </>
              )}

              {/* 建设合同详情 */}
              {todoDetailModal.item.category === '建设合同' && (
                <>
                  <Descriptions.Item label="合同编号">{todoDetailModal.item.source.code}</Descriptions.Item>
                  <Descriptions.Item label="合同类型">{todoDetailModal.item.source.type}</Descriptions.Item>
                  <Descriptions.Item label="建设单位">{todoDetailModal.item.source.partyA}</Descriptions.Item>
                  <Descriptions.Item label="承建单位">{todoDetailModal.item.source.partyB}</Descriptions.Item>
                  <Descriptions.Item label="合同金额">{formatCurrency(todoDetailModal.item.source.amount)}</Descriptions.Item>
                  <Descriptions.Item label="签订日期">{todoDetailModal.item.source.signDate}</Descriptions.Item>
                  <Descriptions.Item label="关联项目">{getProjectNameByCode(todoDetailModal.item.source.projectCode)}</Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>
                    {todoDetailModal.item.source.remark || todoDetailModal.item.source.description || '—'}
                  </Descriptions.Item>
                </>
              )}

              {/* 支付申请详情 */}
              {todoDetailModal.item.category === '支付申请' && (
                <>
                  <Descriptions.Item label="支付编号">{todoDetailModal.item.source.code}</Descriptions.Item>
                  <Descriptions.Item label="关联项目">{getProjectNameByCode(todoDetailModal.item.source.projectCode)}</Descriptions.Item>
                  <Descriptions.Item label="支付类型">{todoDetailModal.item.source.type || todoDetailModal.item.source.payType || '进度款'}</Descriptions.Item>
                  <Descriptions.Item label="申请金额">{formatCurrency(todoDetailModal.item.source.amount)}</Descriptions.Item>
                  <Descriptions.Item label="计划支付">{todoDetailModal.item.source.payDate}</Descriptions.Item>
                  <Descriptions.Item label="施工单位">{todoDetailModal.item.source.contractor}</Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>
                    {todoDetailModal.item.source.remark || todoDetailModal.item.source.description || '—'}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Dashboard
