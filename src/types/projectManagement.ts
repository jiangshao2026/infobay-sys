// ============================================================
// 项目管理模块 - 集中化类型定义（已重构）
// 说明：项目/合同/任务/付款相关接口与枚举统一在此维护
// ============================================================

// ---------- 项目 ----------
// 项目状态：未启动（新增默认值，不可手工修改）、已启动（开工申请审批通过后自动设置）、已验收（竣工验收审批通过后自动设置）
export type ProjectStatus = '未启动' | '已启动' | '已验收'
export type ProjectType =
  | '信息系统建设'
  | '平台升级改造'
  | '智慧监管平台'
  | '政务信息系统'
  | '基础设施建设'
  | '数字孪生平台'
  | '智慧警务系统'
  | '数据平台建设'
  | '智慧城市系统'
  | '医疗信息系统'
export type ProjectScale = '大型' | '中型' | '小型'

export interface ProjectItem {
  key: string
  code: string
  name: string
  type: ProjectType
  scale: ProjectScale
  status: ProjectStatus
  startDate: string
  endDate: string
  investment: number
  manager: string
  contractor: string
  supervision: string
  description?: string
  location?: string
  owner?: string
}

// ---------- 合同 ----------
export type ContractStatus = '待审批' | '待总监理工程师审批' | '待部门经理审批' | '待分管副总经理审批' | '执行中' | '即将到期' | '已完成' | '已作废' | '已驳回' | '已审批'

export interface ContractAttachment {
  name: string
  url: string
}

export interface ContractItem {
  key: string
  code: string
  name: string
  projectCode: string
  amount: number
  signDate: string
  startDate: string
  endDate: string
  partyA: string
  partyB: string
  status: ContractStatus
  progress: number
  attachments?: ContractAttachment[]
}

// ---------- 任务分配 ----------
export type AllocationStatus = '待启动' | '进行中' | '已完成' | '即将完工'
export type Priority = '高' | '中' | '低'

export interface AllocationItem {
  key: string
  code: string
  projectCode: string
  taskName: string
  assignee: string
  startDate: string
  endDate: string
  status: AllocationStatus
  priority: Priority
  description?: string
}

// ---------- 监理付款 ----------
export type PaymentStatus = '待收款' | '已收款' | '已取消'

export interface PaymentItem {
  key: string
  code: string
  contractCode: string
  contractor: string
  amount: number
  invoiceNo: string
  payDate: string
  status: PaymentStatus
  description?: string
}

// ============================================================
// 信息管理模块
// ============================================================
export type PlanStatus = '编制中' | '待审批' | '已审批' | '已执行'
export type PlanType = '监理规划' | '监理实施细则' | '专项施工方案' | '质量控制方案' | '安全控制方案' | '进度控制方案'

export interface PlanItem {
  key: string
  code: string
  projectCode: string
  type: PlanType
  title: string
  version: string
  author: string
  createDate: string
  reviewDate?: string
  status: PlanStatus
  attachments?: ContractAttachment[]
  description?: string
}

export type RuleStatus = '编制中' | '待审批' | '已审批'
export type RuleCategory = '法律法规' | '行业标准' | '企业制度' | '技术规范' | '操作规程'

export interface RuleItem {
  key: string
  code: string
  title: string
  category: RuleCategory
  publisher: string
  publishDate: string
  effectiveDate: string
  status: RuleStatus
  version: string
  attachments?: ContractAttachment[]
  description?: string
}

// ============================================================
// 质量控制模块
// ============================================================
export type QualityLevel = '一般' | '较大' | '严重' | '重大'
export type QualityStatus = '待整改' | '整改中' | '已整改' | '已复查' | '已关闭'

export interface QualityItem {
  key: string
  code: string
  projectCode: string
  location: string
  issue: string
  level: QualityLevel
  discoverDate: string
  deadline: string
  status: QualityStatus
  handler: string
  inspectionPerson: string
  rectificationPlan?: string
  rectificationResult?: string
  reviewResult?: string
  attachments?: ContractAttachment[]
}

// ============================================================
// 安全管理模块
// ============================================================
export type RiskLevel = '低' | '中' | '高' | '极高'
export type SafetyStatus = '待处理' | '处理中' | '已处理' | '已复查'
export type IncidentType = '高处坠落' | '机械伤害' | '触电' | '火灾' | '物体打击' | '坍塌' | '车辆伤害' | '其他'

export interface SafetyItem {
  key: string
  code: string
  projectCode: string
  type: IncidentType
  description: string
  location: string
  discoverDate: string
  riskLevel: RiskLevel
  status: SafetyStatus
  handler: string
  deadline: string
  rectification?: string
  attachments?: ContractAttachment[]
}

// ============================================================
// 进度控制模块
// ============================================================
export type ScheduleStatus = '正常' | '滞后' | '提前' | '已完成' | '已暂停' | '进行中'
export type PhaseType = '项目启动' | '需求分析' | '系统设计' | '开发实施' | '测试调试' | '上线部署' | '验收交付' | '运行维护'

export interface ScheduleItem {
  key: string
  code: string
  projectCode: string
  phase: PhaseType
  planStart: string
  planEnd: string
  actualStart: string
  actualEnd?: string
  planProgress: number
  actualProgress: number
  status: ScheduleStatus
  deviationDays: number
  description?: string
}

// ============================================================
// 成本控制模块
// ============================================================
export type CostCategory = '监理费' | '人工费' | '办公费' | '差旅费' | '设备费' | '材料费' | '培训费' | '其他'

export interface CostItem {
  key: string
  code: string
  projectCode: string
  category: CostCategory
  budget: number
  actual: number
  variance: number
  variancePercent: number
  remark?: string
  updateDate: string
}

// ============================================================
// 变更控制模块
// ============================================================
export type ChangeType = '设计变更' | '工程变更' | '范围变更' | '技术变更' | '材料变更' | '工艺变更' | '需求变更'
export type ChangeStatus = '待提交' | '待审批' | '已批准' | '已驳回' | '已实施' | '已关闭'
export type ChangeUrgency = '紧急' | '一般' | '低'

export interface ChangeItem {
  key: string
  code: string
  projectCode: string
  type: ChangeType
  title: string
  description: string
  reason: string
  impact: string
  applicant: string
  applyDate: string
  status: ChangeStatus
  urgency: ChangeUrgency
  costImpact?: number
  scheduleImpact?: number
  approver?: string
  approveDate?: string
  implementDate?: string
  attachments?: ContractAttachment[]
}

// ============================================================
// 验收备案模块
// ============================================================
export type AcceptanceType = '分部验收' | '分项验收' | '单位工程验收' | '竣工验收' | '专项验收'
export type AcceptanceResult = '合格' | '不合格' | '有条件合格' | '待复查' | '待验收'
export type AcceptanceStatus = '待验收' | '验收中' | '已通过' | '未通过' | '已整改'

export interface AcceptanceItem {
  key: string
  code: string
  projectCode: string
  type: AcceptanceType
  title: string
  date: string
  status: AcceptanceStatus
  result: AcceptanceResult
  inspector: string
  participants: string
  reviewComments?: string
  rectificationRequirements?: string
  attachments?: ContractAttachment[]
}

export type FilingStatus = '待归档' | '归档中' | '已归档' | '已调阅'
export type FilingType = '合同档案' | '监理档案' | '施工档案' | '设计档案' | '质量档案' | '安全档案' | '验收档案'

export interface FilingItem {
  key: string
  code: string
  projectCode: string
  type: FilingType
  title: string
  documentCount: number
  submitDate: string
  archiveDate?: string
  status: FilingStatus
  custodian: string
  location: string
  retentionPeriod: string
  attachments?: ContractAttachment[]
}

// ============================================================
// 知识库模块
// ============================================================
export type KnowledgeCategory = '规范标准' | '施工技术' | '管理流程' | '安全管理' | '质量管理' | '案例经验' | '监理指南' | '法律法规'

export interface KnowledgeItem {
  key: string
  code: string
  title: string
  category: KnowledgeCategory
  author: string
  createDate: string
  updateDate: string
  views: number
  content?: string
  summary: string
  tags: string
  attachments?: ContractAttachment[]
}

// ============================================================
// 合同管理模块（与项目管理中监理合同不同，此处为建设合同）
// ============================================================
export type ContractMgmtStatus = '待签订' | '待审批' | '一审通过' | '已审批' | '执行中' | '即将到期' | '已完成' | '已中止'

export interface ContractMgmtItem {
  key: string
  code: string
  name: string
  projectCode: string
  partyA: string
  partyB: string
  amount: number
  startDate: string
  endDate: string
  signDate: string
  status: ContractMgmtStatus
  contractType: string
  attachments?: ContractAttachment[]
}

export type PaymentMgmtStatus =
  | '待审批'
  | '一审通过'
  | '已驳回'
  | '已审批'
  | '待支付'
  | '已支付'
  | '已取消'
export type PaymentMgmtType = '预付款' | '进度款' | '结算款' | '质保金' | '其他'

export interface PaymentMgmtItem {
  key: string
  code: string
  contractCode: string
  projectCode: string
  amount: number
  payDate: string
  applyDate?: string
  payType: PaymentMgmtType
  status: PaymentMgmtStatus
  applicant: string
  contractor?: string
  applyDescription?: string
  invoiceNo?: string
  remark?: string
}

// ============================================================
// 搜索参数类型
// ============================================================
import type { Dayjs } from 'dayjs'

export interface ProjectSearchParams {
  keyword?: string
  type?: ProjectType
  status?: ProjectStatus
  dateRange?: [Dayjs, Dayjs] | null
}

export interface ContractSearchParams {
  keyword?: string
  projectCode?: string
  status?: ContractStatus
  signDateRange?: [Dayjs, Dayjs] | null
}

export interface AllocationSearchParams {
  keyword?: string
  projectCode?: string
  assignee?: string
  status?: AllocationStatus
  dateRange?: [Dayjs, Dayjs] | null
}

export interface PaymentSearchParams {
  keyword?: string
  contractCode?: string
  status?: PaymentStatus
  payDateRange?: [Dayjs, Dayjs] | null
}

export interface PlanSearchParams {
  keyword?: string
  projectCode?: string
  type?: PlanType
  status?: PlanStatus
  dateRange?: [Dayjs, Dayjs] | null
}

export interface RuleSearchParams {
  keyword?: string
  category?: RuleCategory
  status?: RuleStatus
}

export interface QualitySearchParams {
  keyword?: string
  projectCode?: string
  level?: QualityLevel
  status?: QualityStatus
  dateRange?: [Dayjs, Dayjs] | null
}

export interface SafetySearchParams {
  keyword?: string
  projectCode?: string
  type?: IncidentType
  riskLevel?: RiskLevel
  status?: SafetyStatus
}

export interface ScheduleSearchParams {
  keyword?: string
  projectCode?: string
  status?: ScheduleStatus
  phase?: PhaseType
}

export interface CostSearchParams {
  keyword?: string
  projectCode?: string
  category?: CostCategory
}

export interface ChangeSearchParams {
  keyword?: string
  projectCode?: string
  type?: ChangeType
  status?: ChangeStatus
  dateRange?: [Dayjs, Dayjs] | null
}

export interface MeetingSearchParams {
  keyword?: string
  projectCode?: string
  type?: OCMeetingType
  status?: OCMeetingStatus
}

export interface AcceptanceSearchParams {
  keyword?: string
  projectCode?: string
  type?: AcceptanceType
  status?: AcceptanceStatus
}

export interface FilingSearchParams {
  keyword?: string
  projectCode?: string
  type?: FilingType
  status?: FilingStatus
}

export interface KnowledgeSearchParams {
  keyword?: string
  category?: KnowledgeCategory
}

export interface ContractMgmtSearchParams {
  keyword?: string
  projectCode?: string
  status?: ContractMgmtStatus
}

export interface PaymentMgmtSearchParams {
  keyword?: string
  contractCode?: string
  status?: PaymentMgmtStatus
}

// ============================================================
// 通用审批流程类型
// ============================================================
export type ReviewStatus =
  | '待审批'
  | '一审中'
  | '一审通过'
  | '一审驳回'
  | '二审中'
  | '二审通过'
  | '二审驳回'
  | '终审通过'
  | '已驳回'
  | '草稿'
export type ReviewLevel = 1 | 2 | 3

export interface ApprovalRecord {
  key: string
  code: string
  level: number
  reviewer: string
  comment: string
  status: '通过' | '驳回'
  date: string
  attachment?: DocumentAttachment[]
}

// ============================================================
// 通用附件文档类型
// ============================================================
export interface DocumentAttachment {
  key: string
  name: string
  /** 文件访问路径：
   *  - 用户上传的文件：此字段为空，通过 fileId 从 IndexedDB 加载
   *  - 演示数据：此字段为 data:image/svg+xml;base64,... 内联内容
   */
  url: string
  /**
   * IndexedDB 存储 key（用户上传的文件会保存到 IndexedDB）
   * 存在此字段时优先从 IndexedDB 加载文件内容
   */
  fileId?: string
  size?: number
  uploadedBy: string
  uploadDate: string
  type?: string
}

// ============================================================
// 质量控制模块 - 扩展接口
// ============================================================
export type QCLevel = '一般' | '较严重' | '严重'
export type QCIssueLevel = '轻微' | '一般' | '较严重' | '严重'
export type QCCheckStatus = '待审批' | '一审通过' | '已审批' | '已驳回'
export type QCIssueStatus = '待整改' | '整改中' | '待复查' | '已完成' | '已驳回'
export type QCReportStatus = '草稿' | '待审批' | '一审通过' | '已审批' | '已驳回'
export type QCReportType = '周报' | '月报' | '专项报告' | '阶段报告'

export interface QualityCheckItem {
  key: string
  code: string
  projectCode: string
  title: string
  checkDate: string
  location: string
  items: string[]
  issues: string[]
  level: QCLevel
  reviewer: string
  status: QCCheckStatus
  comments: string
  attachments: DocumentAttachment[]
}

export interface QualityIssueItem {
  key: string
  code: string
  projectCode: string
  title: string
  description: string
  location: string
  level: QCIssueLevel
  discoverDate: string
  deadline: string
  handler: string
  status: QCIssueStatus
  corrective: string
  reviewer: string
  attachments: DocumentAttachment[]
}

export interface QualityReportItem {
  key: string
  code: string
  projectCode: string
  title: string
  type: QCReportType
  reportDate: string
  author: string
  summary: string
  status: QCReportStatus
  attachments: DocumentAttachment[]
}

// ============================================================
// 进度控制模块 - 扩展接口
// ============================================================
export type SCPhase =
  | '需求分析'
  | '设计'
  | '开发'
  | '测试'
  | '部署'
  | '验收'
export type SCPlanStatus = '待审批' | '一审通过' | '已审批' | '已驳回'
export type SCTrackStatus = '正常' | '滞后' | '提前' | '已完成'
export type SCReportType = '周报' | '月报' | '专项报告'
export type SCReportStatus = '待审批' | '一审通过' | '已审批' | '已驳回'

export interface SchedulePlanItem {
  key: string
  code: string
  projectCode: string
  title: string
  phase: SCPhase
  planStart: string
  planEnd: string
  responsible: string
  milestones: string[]
  status: SCPlanStatus
  attachments: DocumentAttachment[]
}

export interface ScheduleTrackItem {
  key: string
  code: string
  projectCode: string
  title: string
  phase: SCPhase
  planStart: string
  planEnd: string
  actualStart: string
  actualEnd: string
  planProgress: number
  actualProgress: number
  deviationDays: number
  reason: string
  status: SCTrackStatus
  attachments: DocumentAttachment[]
}

export interface ScheduleReportItem {
  key: string
  code: string
  projectCode: string
  title: string
  type: SCReportType
  reportDate: string
  author: string
  progressSummary: string
  issues: string
  nextPlan: string
  status: SCReportStatus
  attachments: DocumentAttachment[]
}

// ============================================================
// 成本控制模块 - 扩展接口
// ============================================================
export type CCPhase =
  | '开发费'
  | '设备费'
  | '材料费'
  | '人工费'
  | '监理费'
  | '其他'
export type CCBudgetStatus =
  | '草稿'
  | '待审批'
  | '一审中'
  | '一审通过'
  | '已审批'
  | '已驳回'
export type CCTrackStatus = '正常' | '超支' | '节约'
export type CCAnalysisStatus = '草稿' | '待审批' | '一审通过' | '已审批'

export interface CostBudgetItem {
  key: string
  code: string
  projectCode: string
  title: string
  category: CCPhase
  budgetAmount: number
  approvedAmount: number
  periodStart: string
  periodEnd: string
  status: CCBudgetStatus
  attachments: DocumentAttachment[]
}

export interface CostTrackItem {
  key: string
  code: string
  projectCode: string
  title: string
  category: CCPhase
  budgetAmount: number
  actualAmount: number
  variance: number
  variancePercent: number
  period: string
  status: CCTrackStatus
  description: string
  attachments: DocumentAttachment[]
}

export interface CostAnalysisItem {
  key: string
  code: string
  projectCode: string
  title: string
  analysisDate: string
  author: string
  budgetTotal: number
  actualTotal: number
  varianceSummary: string
  analysis: string
  suggestions: string
  status: CCAnalysisStatus
  attachments: DocumentAttachment[]
}

// ============================================================
// 变更控制模块 - 扩展接口
// ============================================================
export type CRType =
  | '范围变更'
  | '技术变更'
  | '进度变更'
  | '成本变更'
  | '其他'
export type CRStatus =
  | '草稿'
  | '待一审'
  | '一审中'
  | '一审通过'
  | '待二审'
  | '二审中'
  | '二审通过'
  | '已审批'
  | '已驳回'
  | '已执行'

export interface ChangeRequestItem {
  key: string
  code: string
  projectCode: string
  title: string
  description: string
  reason: string
  applicant: string
  applyDate: string
  type: CRType
  impactScope: string[]
  impactScheduleDays: number
  impactCost: number
  priority: '高' | '中' | '低'
  status: CRStatus
  attachments: DocumentAttachment[]
  currentLevel: number
}

// ============================================================
// 安全管理模块 - 扩展接口
// ============================================================
export type SFCheckType =
  | '日常检查'
  | '专项检查'
  | '节日检查'
  | '季节性检查'
export type SFLevel = '低' | '中' | '高' | '极高'
export type SFCheckStatus = '待审批' | '一审通过' | '已审批' | '已驳回'
export type SFTrainingStatus = '已完成' | '计划中' | '进行中'
export type SFIncidentLevel = '一般事故' | '较大事故' | '重大事故'
export type SFIncidentStatus =
  | '待处理'
  | '处理中'
  | '已处理'
  | '待审批'
  | '一审通过'
  | '已审批'
  | '已驳回'

export interface SafetyCheckItem {
  key: string
  code: string
  projectCode: string
  title: string
  checkDate: string
  location: string
  checkType: SFCheckType
  issues: string[]
  level: SFLevel
  reviewer: string
  status: SFCheckStatus
  comments?: string
  attachments: DocumentAttachment[]
}

export interface SafetyTrainingItem {
  key: string
  code: string
  projectCode: string
  title: string
  trainingDate: string
  trainer: string
  trainees: string[]
  content: string
  hours: number
  location: string
  attachments: DocumentAttachment[]
  status: SFTrainingStatus
}

export interface SafetyIncidentItem {
  key: string
  code: string
  projectCode: string
  title: string
  description: string
  incidentDate: string
  location: string
  level: SFIncidentLevel
  casualties: string
  economicLoss: number
  handler: string
  rootCause: string
  correctiveActions: string
  status: SFIncidentStatus
  attachments: DocumentAttachment[]
}

// ============================================================
// 信息管理模块 - 扩展接口
// ============================================================
export type IMDocCategory =
  | '监理规划'
  | '实施细则'
  | '合同文件'
  | '设计文件'
  | '会议纪要'
  | '其他'

export type IMDocType =
  | '实施方案'
  | '设计方案审核'
  | '试运行报告'
  | '支付申请附件'
  | '其他'

export type IMDocUploader = '承建单位' | '监理工程师'
export type IMDocStatus = '待审批' | '一审通过' | '已审批' | '已驳回'
export type IMReportType =
  | '监理周报'
  | '监理月报'
  | '专项报告'
  | '工作联系单'
  | '监理通知'
export type IMReportStatus =
  | '待审批'
  | '一审通过'
  | '已审批'
  | '已驳回'
export type IMArchiveStatus = '待归档' | '归档中' | '已归档' | '已调阅'

export interface InfoDocumentItem {
  key: string
  code: string
  projectCode: string
  title: string
  category: IMDocCategory
  type: string
  uploader: string[]
  author: string
  uploadDate: string
  version: string
  status: IMDocStatus
  description: string
  attachments: DocumentAttachment[]
  currentLevel: number
}

export interface InfoReportItem {
  key: string
  code: string
  projectCode: string
  title: string
  type: IMReportType
  reportDate: string
  author: string
  content: string
  status: IMReportStatus
  attachments: DocumentAttachment[]
}

export interface InfoArchiveItem {
  key: string
  code: string
  projectCode: string
  title: string
  category: IMDocCategory
  archiveDate: string
  archivist: string
  content: string
  location: string
  status: IMArchiveStatus
  attachments: DocumentAttachment[]
}

// ============================================================
// 组织协调模块 - 扩展接口
// ============================================================
// 五方关系人
export type RelationParty =
  | '业主方'
  | '承建方'
  | '监理方'
  | '验收测评方'
  | '安全测评方'

// 单个联系人信息
export interface RelationContact {
  key: string
  name: string          // 姓名
  position: string      // 职务
  phone: string         // 联系方式
  email?: string        // 邮箱
  remark?: string       // 备注
}

// 一方关系人（包含负责人 + 联系人列表）
export interface RelationPartyInfo {
  leader?: RelationContact       // 负责人（可空）
  contacts: RelationContact[]    // 联系人列表
}

// 项目关系人记录（以项目为单位）
export interface ProjectRelationItem {
  key: string
  code: string                    // 编号：如 PRJ-REL-2025-001
  projectCode: string             // 关联项目编号
  projectName: string             // 项目名称（冗余字段，方便表格显示）

  // 五方关系人
  ownerParty: RelationPartyInfo     // 业主方
  contractor: RelationPartyInfo    // 承建方
  supervision: RelationPartyInfo   // 监理方
  acceptanceParty: RelationPartyInfo  // 验收测评方
  safetyParty: RelationPartyInfo      // 安全测评方

  status: '已完善' | '待完善'      // 信息完整度状态
  lastUpdate: string               // 最后更新日期
  remark?: string
}

// 保留旧类型兼容（仅用于向后兼容，新逻辑不再使用）
export type OCRole = '总监' | '总监代表' | '专业监理工程师' | '监理员'
export type OCMemberStatus = '在职' | '已调走' | '已完成'

export interface TeamMemberItem {
  key: string
  code: string
  projectCode: string
  name: string
  role: OCRole
  phone: string
  email: string
  joinDate: string
  leaveDate?: string
  status: OCMemberStatus
}

export type OCMeetingType =
  | '监理例会'
  | '专题会议'
  | '技术交底'
  | '协调会议'
export type OCMeetingStatus = '已安排' | '进行中' | '已完成'
export type OCComType =
  | '工作联系单'
  | '监理通知'
  | '工程变更'
  | '口头沟通'
  | '书面函件'
export type OCComStatus = '待回复' | '已回复' | '已处理' | '已关闭'

export interface MeetingItem {
  key: string
  code: string
  projectCode: string
  title: string
  type: OCMeetingType
  meetingDate: string
  location: string
  host: string
  attendees: string[]
  topics: string[]
  decisions: string[]
  nextActions: string[]
  status: OCMeetingStatus
  attachments: DocumentAttachment[]
}

export interface CommunicationItem {
  key: string
  code: string
  projectCode: string
  title: string
  type: OCComType
  date: string
  from: string
  to: string
  content: string
  reply?: string
  status: OCComStatus
  attachments: DocumentAttachment[]
}

// ============================================================
// 验收归档模块 - 扩展接口
// ============================================================
export type ACCheckType =
  | '分项验收'
  | '分部验收'
  | '单位工程验收'
  | '专项验收'
  | '竣工验收'
export type ACResult = '合格' | '不合格' | '有条件合格' | '待复查'
export type ACCheckStatus =
  | '待安排'
  | '待验收'
  | '待审批'
  | '进行中'
  | '已完成'
  | '一审通过'
  | '已审批'
  | '已驳回'
export type ACReportStatus =
  | '草稿'
  | '待审批'
  | '一审通过'
  | '已审批'
  | '已驳回'
export type ACArchiveCategory =
  | '合同档案'
  | '监理档案'
  | '施工档案'
  | '设计档案'
  | '质量档案'
  | '安全档案'
  | '验收档案'
export type ACArchiveStatus = '待归档' | '归档中' | '已归档' | '已调阅'

export interface AcceptanceCheckItem {
  key: string
  code: string
  projectCode: string
  title: string
  type: ACCheckType
  checkDate: string
  location: string
  inspector: string
  participants: string[]
  issues: string[]
  result: ACResult
  status: ACCheckStatus
  attachments: DocumentAttachment[]
}

export interface AcceptanceReportItem {
  key: string
  code: string
  projectCode: string
  title: string
  type: ACCheckType
  reportDate: string
  author: string
  summary: string
  issues: string
  suggestions: string
  result: ACResult
  status: ACReportStatus
  attachments: DocumentAttachment[]
}

export interface FileArchiveItem {
  key: string
  code: string
  projectCode: string
  title: string
  category: ACArchiveCategory
  archiveDate: string
  archivist: string
  contentSummary: string
  status: ACArchiveStatus
  attachments: DocumentAttachment[]
}

// ============================================================
// 知识库模块 - 扩展接口
// ============================================================
export type KDCategory =
  | '技术文档'
  | '标准规范'
  | '案例库'
  | '管理制度'
  | '经验总结'

export interface KnowledgeDocItem {
  key: string
  code: string
  title: string
  category: KDCategory
  author: string
  publishDate: string
  updateDate: string
  tags: string[]
  summary: string
  views: number
  attachments: DocumentAttachment[]
  status: '草稿' | '待审批' | '已发布'
  reviews?: KDDocReview[]
}

export interface KDDocReview {
  key: string
  reviewer: string
  content: string
  timestamp: string
}

// ============================================================
// 监理师管理模块 - 扩展接口
// ============================================================
export type SPGender = '男' | '女'
export type SPEducation = '大专' | '本科' | '硕士' | '博士'
export type SPTitle = '助理工程师' | '工程师' | '高级工程师' | '教授级高工'
export type SPPosition = '监理员' | '专业监理工程师' | '总监代表' | '总监理工程师'
export type SPStatus = '在职' | '离职' | '停职' | '退休'
export type SPCertType =
  | '信息系统监理师'
  | '信息系统项目管理师'
  | '系统集成项目管理工程师'
  | '系统架构设计师'
  | '软件设计师'
  | '软件造价工程师'
  | '数据库系统工程师'
  | '系统分析师'
  | '其他'
export type SPCertStatus = '有效' | '即将到期' | '已过期' | '已注销'

export interface SupervisorItem {
  key: string
  code: string
  name: string
  gender: SPGender
  birthDate: string
  phone: string
  email: string
  idCard: string
  education: SPEducation
  major: string
  title: SPTitle
  position: SPPosition
  joinDate: string
  department: string
  status: SPStatus
  photo?: string
  description?: string
  certificates?: SPCertRef[]
}

// 嵌入在监理师信息中的证书引用（用于人员信息属性维护，支持上传附件和删除）
export interface SPCertRef {
  key: string
  type: SPCertType
  certificateNo: string
  issueDate: string
  expiryDate: string
  issueOrganization: string
  attachments?: DocumentAttachment[]
}

export interface SupervisorCertificateItem {
  key: string
  code: string
  supervisorCode: string
  name: string
  type: SPCertType
  certificateNo: string
  issueDate: string
  expiryDate: string
  issueOrganization: string
  status: SPCertStatus
  attachment?: DocumentAttachment[]
}

// ============================================================
// 审计日志模块
// ============================================================
export type AuditAction = '新增' | '编辑' | '删除' | '查询' | '审批' | '登录' | '导出' | '上传' | '下载'
export type AuditModule =
  | '项目管理' | '质量控制' | '进度控制' | '成本控制' | '变更控制'
  | '安全管理' | '信息管理' | '组织协调' | '验收归档' | '合同管理'
  | '知识库' | '监理师管理' | '系统管理' | '工作台'

export interface AuditLogItem {
  key: string
  timestamp: string
  user: string
  module: AuditModule
  action: AuditAction
  target: string       // 操作对象名称（如项目名称、合同编号）
  targetType: string   // 对象类型（如项目、合同、质量问题）
  detail: string       // 操作详情
}

// 统一导出
export * as default from './projectManagement'
