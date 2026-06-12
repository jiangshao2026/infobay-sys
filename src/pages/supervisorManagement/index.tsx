import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import SupervisorPanel from './supervisorPage'
import CertificatePanel from './certificatePage'

const items: TabsProps['items'] = [
  {
    key: 'supervisor',
    label: '监理师信息',
    children: <SupervisorPanel />,
  },
  {
    key: 'certificate',
    label: '资质证书',
    children: <CertificatePanel />,
  },
]

function SupervisorManagement() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="supervisor" items={items} size="large" />
    </Card>
  )
}

export default SupervisorManagement
