import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import RequestPanel from './requestPage'
import ReviewPanel from './reviewPage'
import RecordPanel from './recordPage'

const items: TabsProps['items'] = [
  {
    key: 'request',
    label: '变更申请',
    children: <RequestPanel />,
  },
  {
    key: 'review',
    label: '变更审批',
    children: <ReviewPanel />,
  },
  {
    key: 'record',
    label: '变更记录',
    children: <RecordPanel />,
  },
]

function ChangeControl() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="request" items={items} size="large" />
    </Card>
  )
}

export default ChangeControl
