import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import TeamPanel from './teamPage'
import MeetingPanel from './meetingPage'
import CommunicationPanel from './communicationPage'

const items: TabsProps['items'] = [
  {
    key: 'team',
    label: '项目关系人',
    children: <TeamPanel />,
  },
  {
    key: 'meeting',
    label: '会议管理',
    children: <MeetingPanel />,
  },
  {
    key: 'communication',
    label: '沟通记录',
    children: <CommunicationPanel />,
  },
]

function OrganizationCoordination() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="team" items={items} size="large" />
    </Card>
  )
}

export default OrganizationCoordination
