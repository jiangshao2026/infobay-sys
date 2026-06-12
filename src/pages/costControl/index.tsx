import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import BudgetPanel from './budgetPage'
import TrackPanel from './trackPage'
import AnalysisPanel from './analysisPage'

const items: TabsProps['items'] = [
  {
    key: 'budget',
    label: '成本预算',
    children: <BudgetPanel />,
  },
  {
    key: 'track',
    label: '成本跟踪',
    children: <TrackPanel />,
  },
  {
    key: 'analysis',
    label: '成本分析',
    children: <AnalysisPanel />,
  },
]

function CostControl() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="budget" items={items} size="large" />
    </Card>
  )
}

export default CostControl
