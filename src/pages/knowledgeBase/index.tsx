import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import DocPanel from './docPage'
import KnowledgeQAPanel from './qaPage'

const items: TabsProps['items'] = [
  {
    key: 'tech',
    label: '技术文档',
    children: <DocPanel defaultCategory="技术文档" />,
  },
  {
    key: 'standard',
    label: '标准规范',
    children: <DocPanel defaultCategory="标准规范" />,
  },
  {
    key: 'case',
    label: '案例库',
    children: <DocPanel defaultCategory="案例库" />,
  },
  {
    key: 'management',
    label: '管理制度',
    children: <DocPanel defaultCategory="管理制度" />,
  },
  {
    key: 'qa',
    label: '智能问答',
    children: <KnowledgeQAPanel />,
  },
]

function KnowledgeBase() {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Tabs defaultActiveKey="tech" items={items} size="large" />
    </Card>
  )
}

export default KnowledgeBase
