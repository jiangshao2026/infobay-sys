import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import CheckPanel from './checkPage'
import ReportPanel from './reportPage'
import FilePanel from './filePage'

const items: TabsProps['items'] = [
  {
    key: 'check',
    label: '验收检查',
    children: <CheckPanel />,
  },
  {
    key: 'report',
    label: '验收报告',
    children: <ReportPanel />,
  },
  {
    key: 'file',
    label: '归档管理',
    children: <FilePanel />,
  },
]

function AcceptanceFiling() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="check" items={items} size="large" />
    </Card>
  )
}

export default AcceptanceFiling
