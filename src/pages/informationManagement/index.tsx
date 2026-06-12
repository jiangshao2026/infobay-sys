import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import PlanPanel from './plan'
import DocumentPanel from './documentPage'
import ReportPanel from './reportPage'
import ArchivePanel from './archivePage'

const items: TabsProps['items'] = [
  {
    key: 'plan',
    label: '监理规划',
    children: <PlanPanel />,
  },
  {
    key: 'document',
    label: '文档管理',
    children: <DocumentPanel />,
  },
  {
    key: 'report',
    label: '报告管理',
    children: <ReportPanel />,
  },
  {
    key: 'archive',
    label: '资料归档',
    children: <ArchivePanel />,
  },
]

function InformationManagement() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="plan" items={items} size="large" />
    </Card>
  )
}

export default InformationManagement
