import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import CheckPanel from './checkPage'
import IssuePanel from './issuePage'
import ReportPanel from './reportPage'

const items: TabsProps['items'] = [
  {
    key: 'check',
    label: '质量检查',
    children: <CheckPanel />,
  },
  {
    key: 'issue',
    label: '问题整改',
    children: <IssuePanel />,
  },
  {
    key: 'report',
    label: '质量报告',
    children: <ReportPanel />,
  },
]

function QualityControl() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="check" items={items} size="large" />
    </Card>
  )
}

export default QualityControl
