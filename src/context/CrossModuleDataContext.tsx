import React, { createContext, useContext, type ReactNode } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'
import type {
  ProjectItem, QualityIssueItem, SafetyCheckItem, SafetyIncidentItem,
  ChangeRequestItem, AcceptanceCheckItem, InfoDocumentItem, KnowledgeDocItem,
  ContractMgmtItem, PaymentMgmtItem,
} from '../types/projectManagement'
import initialProjectData from '../data/projects'
import qualityIssuesData from '../data/qualityIssues'
import safetyChecksData from '../data/safetyChecks'
import safetyIncidentsData from '../data/safetyIncidents'
import changeRequestsData from '../data/changeRequests'
import acceptanceChecksData from '../data/acceptanceChecks'
import infoDocuments from '../data/infoDocuments'
import knowledgeDocs from '../data/knowledgeDocs'
import { contractMgmtData, paymentMgmtData } from '../data/contractMgmt'

// ==================== Context 类型定义 ====================
interface CrossModuleDataValue {
  // 项目
  projectList: ProjectItem[]
  setProjectList: React.Dispatch<React.SetStateAction<ProjectItem[]>>
  // 建设合同
  contractMgmtList: ContractMgmtItem[]
  setContractMgmtList: React.Dispatch<React.SetStateAction<ContractMgmtItem[]>>
  // 支付
  paymentList: PaymentMgmtItem[]
  setPaymentList: React.Dispatch<React.SetStateAction<PaymentMgmtItem[]>>
  // 质量问题
  qualityIssueList: QualityIssueItem[]
  setQualityIssueList: React.Dispatch<React.SetStateAction<QualityIssueItem[]>>
  // 安全检查
  safetyCheckList: SafetyCheckItem[]
  setSafetyCheckList: React.Dispatch<React.SetStateAction<SafetyCheckItem[]>>
  // 安全事故
  safetyIncidentList: SafetyIncidentItem[]
  setSafetyIncidentList: React.Dispatch<React.SetStateAction<SafetyIncidentItem[]>>
  // 变更申请
  changeRequestList: ChangeRequestItem[]
  setChangeRequestList: React.Dispatch<React.SetStateAction<ChangeRequestItem[]>>
  // 验收检查
  acceptCheckList: AcceptanceCheckItem[]
  setAcceptCheckList: React.Dispatch<React.SetStateAction<AcceptanceCheckItem[]>>
  // 文档
  infoDocList: InfoDocumentItem[]
  setInfoDocList: React.Dispatch<React.SetStateAction<InfoDocumentItem[]>>
  // 知识库
  knowledgeDocList: KnowledgeDocItem[]
  setKnowledgeDocList: React.Dispatch<React.SetStateAction<KnowledgeDocItem[]>>
}

const CrossModuleDataContext = createContext<CrossModuleDataValue | null>(null)

// ==================== Provider ====================
export function CrossModuleDataProvider({ children }: { children: ReactNode }) {
  const [projectList, setProjectList] = usePersistedState<ProjectItem[]>('project-list', initialProjectData)
  const [contractMgmtList, setContractMgmtList] = usePersistedState<ContractMgmtItem[]>('contractmgmt-main', contractMgmtData)
  const [paymentList, setPaymentList] = usePersistedState<PaymentMgmtItem[]>('contractmgmt-pay', paymentMgmtData)
  const [qualityIssueList, setQualityIssueList] = usePersistedState<QualityIssueItem[]>('quality-issue', qualityIssuesData)
  const [safetyCheckList, setSafetyCheckList] = usePersistedState<SafetyCheckItem[]>('safety-check', safetyChecksData)
  const [safetyIncidentList, setSafetyIncidentList] = usePersistedState<SafetyIncidentItem[]>('safety-incident', safetyIncidentsData)
  const [changeRequestList, setChangeRequestList] = usePersistedState<ChangeRequestItem[]>('change-request', changeRequestsData)
  const [acceptCheckList, setAcceptCheckList] = usePersistedState<AcceptanceCheckItem[]>('accept-check', acceptanceChecksData)
  const [infoDocList, setInfoDocList] = usePersistedState<InfoDocumentItem[]>('info-doc', infoDocuments)
  const [knowledgeDocList, setKnowledgeDocList] = usePersistedState<KnowledgeDocItem[]>('knowledge-docs', knowledgeDocs)

  const value: CrossModuleDataValue = {
    projectList, setProjectList,
    contractMgmtList, setContractMgmtList,
    paymentList, setPaymentList,
    qualityIssueList, setQualityIssueList,
    safetyCheckList, setSafetyCheckList,
    safetyIncidentList, setSafetyIncidentList,
    changeRequestList, setChangeRequestList,
    acceptCheckList, setAcceptCheckList,
    infoDocList, setInfoDocList,
    knowledgeDocList, setKnowledgeDocList,
  }

  return (
    <CrossModuleDataContext.Provider value={value}>
      {children}
    </CrossModuleDataContext.Provider>
  )
}

// ==================== Hook ====================
export function useCrossModuleData(): CrossModuleDataValue {
  const ctx = useContext(CrossModuleDataContext)
  if (!ctx) {
    throw new Error('useCrossModuleData must be used within a CrossModuleDataProvider')
  }
  return ctx
}