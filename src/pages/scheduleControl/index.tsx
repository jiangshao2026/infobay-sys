import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import PlanPanel from './planPage'
import TrackPanel from './trackPage'
import ReportPanel from './reportPage'

const items: TabsProps['items'] = [
  {
    key: 'plan',
    label: '进度计划',
    children: <PlanPanel />,
  },
  {
    key: 'track',
    label: '进度跟踪',
    children: <TrackPanel />,
  },
  {
    key: 'report',
    label: '进度报告',
    children: <ReportPanel />,
  },
]

function ScheduleControl() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="plan" items={items} size="large" />
    </Card>
  )
}

export default ScheduleControl
