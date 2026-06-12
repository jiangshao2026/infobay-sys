import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import CheckPanel from './checkPage'
import TrainingPanel from './trainingPage'
import IncidentPanel from './incidentPage'

const items: TabsProps['items'] = [
  {
    key: 'check',
    label: '安全检查',
    children: <CheckPanel />,
  },
  {
    key: 'training',
    label: '安全培训',
    children: <TrainingPanel />,
  },
  {
    key: 'incident',
    label: '安全事故',
    children: <IncidentPanel />,
  },
]

function SafetyManagement() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="check" items={items} size="large" />
    </Card>
  )
}

export default SafetyManagement
