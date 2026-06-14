import { useState, useEffect } from 'react'
import { Layout as AntLayout, Menu, Avatar, Button, theme, Space, Modal, message, Form, Input } from 'antd'
import {
  DashboardOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  RestOutlined,
  SafetyCertificateOutlined,
  FileSearchOutlined,
  TeamOutlined,
  CiOutlined,
  BookOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useUser } from '../context/UserContext'
import { AppDataProvider } from '../context/AppDataContext'
import { Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom'
import Dashboard from '../pages/dashboard'
// 项目管理
import ProjectManagement from '../pages/projectManagement'
import ProjectOverview from '../pages/projectManagement/overview'
import Allocation from '../pages/projectManagement/allocation'
import SupervisionContract from '../pages/projectManagement/supervisionContract'
import SupervisionPayment from '../pages/projectManagement/supervisionPayment'
import StartupPage from '../pages/projectManagement/startupPage'
import Plan from '../pages/informationManagement/plan'
// 质量控制
import QualityCheck from '../pages/qualityControl/checkPage'
import QualityIssue from '../pages/qualityControl/issuePage'
import QualityReport from '../pages/qualityControl/reportPage'
// 进度控制
import SchedulePlan from '../pages/scheduleControl/planPage'
import ScheduleTrack from '../pages/scheduleControl/trackPage'
import ScheduleReport from '../pages/scheduleControl/reportPage'
// 成本控制
import CostBudget from '../pages/costControl/budgetPage'
import CostTrack from '../pages/costControl/trackPage'
import CostAnalysis from '../pages/costControl/analysisPage'
// 变更控制
import ChangeRequest from '../pages/changeControl/requestPage'
import ChangeReview from '../pages/changeControl/reviewPage'
import ChangeRecord from '../pages/changeControl/recordPage'
// 合同管理
import ContractManagement from '../pages/contractManagement'
import ContractPayment from '../pages/contractManagement/payment'
// 安全管理
import SafetyCheck from '../pages/safetyManagement/checkPage'
import SafetyTraining from '../pages/safetyManagement/trainingPage'
import SafetyIncident from '../pages/safetyManagement/incidentPage'
// 信息管理
import InfoDocument from '../pages/informationManagement/documentPage'
import InfoReport from '../pages/informationManagement/reportPage'
import InfoArchive from '../pages/informationManagement/archivePage'
// 组织协调
import OrgTeam from '../pages/organizationCoordination/teamPage'  // 内容已重写为 ProjectRelationPanel
import OrgMeeting from '../pages/organizationCoordination/meetingPage'
import OrgCommunication from '../pages/organizationCoordination/communicationPage'
// 验收归档
import AcceptanceCheck from '../pages/acceptanceFiling/checkPage'
import AcceptanceReport from '../pages/acceptanceFiling/reportPage'
import AcceptanceFile from '../pages/acceptanceFiling/filePage'
// 知识库
import KnowledgeDoc from '../pages/knowledgeBase/docPage'
import KnowledgeQA from '../pages/knowledgeBase/qaPage'
// 监理师管理
import SupervisorList from '../pages/supervisorManagement/supervisorPage'
import SupervisorCert from '../pages/supervisorManagement/certificatePage'
// 系统管理
import SettingOutlined from '@ant-design/icons/SettingOutlined'
import OrganizationPage from '../pages/systemManagement/organizationPage'
import UserPage from '../pages/systemManagement/userPage'
import PermissionPage from '../pages/systemManagement/permissionPage'
import DataPage from '../pages/systemManagement/dataPage'

const { Header, Sider, Content } = AntLayout

// 菜单项：一级菜单+子菜单
const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">工作台</Link>, path: '/dashboard' },
  {
    key: '/project',
    icon: <FolderOpenOutlined />,
    label: '项目管理',
    children: [
      { key: '/project/list', label: <Link to="/project/list">项目列表</Link> },
      { key: '/project/supervision-contract', label: <Link to="/project/supervision-contract">监理合同</Link> },
      { key: '/project/allocation', label: <Link to="/project/allocation">任务分配</Link> },
      { key: '/project/plan', label: <Link to="/project/plan">监理规划</Link> },
      { key: '/project/startup', label: <Link to="/project/startup">项目启动</Link> },
      { key: '/project/supervision-payment', label: <Link to="/project/supervision-payment">合同收款</Link> },
    ],
  },
  {
    key: '/quality',
    icon: <CheckCircleOutlined />,
    label: '质量控制',
    children: [
      { key: '/quality/check', label: <Link to="/quality/check">质量检查</Link> },
      { key: '/quality/issue', label: <Link to="/quality/issue">问题整改</Link> },
      { key: '/quality/report', label: <Link to="/quality/report">质量报告</Link> },
    ],
  },
  {
    key: '/schedule',
    icon: <ClockCircleOutlined />,
    label: '进度控制',
    children: [
      { key: '/schedule/plan', label: <Link to="/schedule/plan">进度计划</Link> },
      { key: '/schedule/track', label: <Link to="/schedule/track">进度跟踪</Link> },
      { key: '/schedule/report', label: <Link to="/schedule/report">进度报告</Link> },
    ],
  },
  {
    key: '/cost',
    icon: <WalletOutlined />,
    label: '成本控制',
    children: [
      { key: '/cost/budget', label: <Link to="/cost/budget">成本预算</Link> },
      { key: '/cost/track', label: <Link to="/cost/track">成本跟踪</Link> },
      { key: '/cost/analysis', label: <Link to="/cost/analysis">成本分析</Link> },
    ],
  },
  {
    key: '/change',
    icon: <RestOutlined />,
    label: '变更控制',
    children: [
      { key: '/change/request', label: <Link to="/change/request">变更申请</Link> },
      { key: '/change/review', label: <Link to="/change/review">变更审批</Link> },
      { key: '/change/record', label: <Link to="/change/record">变更记录</Link> },
    ],
  },
  {
    key: '/safety',
    icon: <SafetyCertificateOutlined />,
    label: '安全管理',
    children: [
      { key: '/safety/check', label: <Link to="/safety/check">安全检查</Link> },
      { key: '/safety/training', label: <Link to="/safety/training">安全培训</Link> },
      { key: '/safety/incident', label: <Link to="/safety/incident">安全事故</Link> },
    ],
  },
  {
    key: '/information',
    icon: <FileSearchOutlined />,
    label: '信息管理',
    children: [
      { key: '/information/document', label: <Link to="/information/document">文档管理</Link> },
      { key: '/information/report', label: <Link to="/information/report">报告管理</Link> },
      { key: '/information/archive', label: <Link to="/information/archive">资料归档</Link> },
    ],
  },
  {
    key: '/organization',
    icon: <TeamOutlined />,
    label: '组织协调',
    children: [
      { key: '/organization/team', label: <Link to="/organization/team">项目关系人</Link> },
      { key: '/organization/meeting', label: <Link to="/organization/meeting">会议管理</Link> },
      { key: '/organization/communication', label: <Link to="/organization/communication">沟通记录</Link> },
    ],
  },
  {
    key: '/acceptance',
    icon: <CiOutlined />,
    label: '验收归档',
    children: [
      { key: '/acceptance/check', label: <Link to="/acceptance/check">验收检查</Link> },
      { key: '/acceptance/report', label: <Link to="/acceptance/report">验收报告</Link> },
      { key: '/acceptance/file', label: <Link to="/acceptance/file">归档管理</Link> },
    ],
  },
  {
    key: '/contract',
    icon: <WalletOutlined />,
    label: '合同管理',
    children: [
      { key: '/contract/list', label: <Link to="/contract/list">合同列表</Link> },
      { key: '/contract/payment', label: <Link to="/contract/payment">合同支付</Link> },
    ],
  },
  {
    key: '/supervisor',
    icon: <UserOutlined />,
    label: '监理师管理',
    children: [
      { key: '/supervisor/list', label: <Link to="/supervisor/list">监理师信息</Link> },
      { key: '/supervisor/certificate', label: <Link to="/supervisor/certificate">资质证书</Link> },
    ],
  },
  {
    key: '/knowledge',
    icon: <BookOutlined />,
    label: '知识库',
    children: [
      { key: '/knowledge/doc', label: <Link to="/knowledge/doc">知识文档</Link> },
      { key: '/knowledge/qa', label: <Link to="/knowledge/qa">智能问答</Link> },
    ],
  },
  {
    key: '/system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/system/organization', label: <Link to="/system/organization">组织管理</Link> },
      { key: '/system/user', label: <Link to="/system/user">用户管理</Link> },
      { key: '/system/permission', label: <Link to="/system/permission">权限管理</Link> },
      { key: '/system/data', label: <Link to="/system/data">数据管理</Link> },
    ],
  },
]

function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const { currentUser, login } = useUser()
  const [loginModalVisible, setLoginModalVisible] = useState(false)
  const [loginForm] = Form.useForm()

  // 注入左侧菜单区滚动条样式（确保 Chrome/Edge/Safari 也能看到滚动条）
  useEffect(() => {
    const styleId = 'sidebar-scrollbar-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        .sidebar-menu-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-menu-scroll::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
        .sidebar-menu-scroll::-webkit-scrollbar-thumb {
          background: #d9d9d9;
          border-radius: 3px;
        }
        .sidebar-menu-scroll::-webkit-scrollbar-thumb:hover {
          background: #bfbfbf;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // 根据 pathname 计算当前选中的 key
  const selectedKey = (() => {
    const p = location.pathname
    if (p.startsWith('/project/overview')) return '/project/list'
    return p
  })()

  // 初始展开 key：根据当前路由自动展开对应一级菜单
  const getInitialOpenKey = () => {
    const p = location.pathname
    const top = '/' + p.split('/')[1]
    if (['/project', '/quality', '/schedule', '/cost', '/change', '/safety', '/information', '/organization', '/acceptance', '/contract', '/knowledge', '/supervisor', '/system'].includes(top)) {
      return top
    }
    return ''
  }

  // 受控展开状态：同一时刻只展开一个一级菜单（初始值根据当前路由）
  const [openKeys, setOpenKeys] = useState<string[]>(
    getInitialOpenKey() ? [getInitialOpenKey()] : []
  )

  // 路由变化时，自动展开当前路径对应的一级菜单（同时收起其他）
  useEffect(() => {
    const key = getInitialOpenKey()
    if (key) {
      setOpenKeys([key])
    }
  }, [location.pathname])

  return (
    <AppDataProvider>
      <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={180}
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #f0f0f0',
          overflow: 'hidden',
        }}
      >
        {/* Logo 区：固定在顶部，不随菜单滚动 */}
        <div style={{ flexShrink: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
          <img src="/logo.png" alt="信佰" style={{ maxHeight: 40, maxWidth: '100%', objectFit: 'contain' }} />
        </div>
        {/* 菜单区：独立滚动容器（明确高度 + 强制滚动条） */}
        <div
          className="sidebar-menu-scroll"
          style={{
            height: 'calc(100vh - 64px)',
            overflowY: 'scroll',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            openKeys={openKeys}
            onOpenChange={(keys) => {
              // 只保留最后一个展开的一级菜单：自动收起之前展开的
              if (keys.length === 0) {
                setOpenKeys([])
              } else {
                // antd 的 onOpenChange keys 包含"所有当前展开的 keys"；
                // 我们只保留最后一个（即用户新点击的），实现"只展开当前"
                const lastKey = keys[keys.length - 1]
                setOpenKeys([lastKey])
              }
            }}
            style={{ borderRight: 0, background: '#fff' }}
            items={menuItems as any}
            onClick={(e) => {
              if (e.key && !e.key.startsWith('/project/overview')) {
                // Link 已处理跳转；此处保留兜底
              }
            }}
          />
        </div>
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? 80 : 180, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            gap: 16,
          }}
        >
          {/* 左侧：折叠按钮 */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 48, height: 64, flexShrink: 0 }}
          />

          {/* 中间：系统标题（楷体 / 深墨蓝 / 大字号） */}
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '3px',
              color: '#0a1b3d',
              fontFamily: '"楷体_GB2312", "KaiTi_GB2312", "STKaiti", "KaiTi", "SimSun", serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            广东信佰监理服务管理系统
          </div>

          {/* 右侧：用户信息 —— 点击弹出登录窗口 */}
          <div
            style={{ flexShrink: 0 }}
          >
            <Space
              style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
              onClick={() => setLoginModalVisible(true)}
            >
              <Avatar style={{ background: token.colorPrimary, fontWeight: 600 }}>{currentUser.avatarText}</Avatar>
              <span style={{ color: '#333' }}>{currentUser.name}</span>
              <span style={{ color: '#999', fontSize: 12 }}>{currentUser.role}</span>
            </Space>
          </div>
        </Header>

        {/* 登录弹窗 */}
        <Modal
          title="用户登录"
          open={loginModalVisible}
          onCancel={() => setLoginModalVisible(false)}
          onOk={async () => {
            try {
              const values = await loginForm.validateFields()
              const result = login(values.username, values.password)
              if (result.ok) {
                message.success('登录成功')
                setLoginModalVisible(false)
                loginForm.resetFields()
                navigate('/dashboard')
                setOpenKeys([])
              } else {
                message.error(result.message || '登录失败')
              }
            } catch (_) {}
          }}
          okText="登录"
          cancelText="取消"
          width={420}
        >
          <Form
            form={loginForm}
            layout="vertical"
            onFinish={async () => {
              try {
                const values = await loginForm.validateFields()
                const result = login(values.username, values.password)
                if (result.ok) {
                  message.success('登录成功')
                  setLoginModalVisible(false)
                  loginForm.resetFields()
                  navigate('/dashboard')
                  setOpenKeys([])
                } else {
                  message.error(result.message || '登录失败')
                }
              } catch (_) {}
            }}
          >
            <Form.Item
              label="用户名（姓名）"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户姓名" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" onPressEnter={() => loginForm.submit()} />
            </Form.Item>
          </Form>
        </Modal>
        <Content style={{ margin: '16px', minHeight: 'calc(100vh - 96px)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* 项目管理 */}
            <Route path="/project/list" element={<ProjectManagement />} />
            <Route path="/project/startup" element={<StartupPage />} />
            <Route path="/project/overview/:code" element={<ProjectOverview />} />
            <Route path="/project/allocation" element={<Allocation />} />
            <Route path="/project/plan" element={<Plan />} />
            <Route path="/project/supervision-contract" element={<SupervisionContract />} />
            <Route path="/project/supervision-payment" element={<SupervisionPayment />} />
            {/* 质量控制 */}
            <Route path="/quality" element={<QualityCheck />} />
            <Route path="/quality/check" element={<QualityCheck />} />
            <Route path="/quality/issue" element={<QualityIssue />} />
            <Route path="/quality/report" element={<QualityReport />} />
            {/* 进度控制 */}
            <Route path="/schedule" element={<SchedulePlan />} />
            <Route path="/schedule/plan" element={<SchedulePlan />} />
            <Route path="/schedule/track" element={<ScheduleTrack />} />
            <Route path="/schedule/report" element={<ScheduleReport />} />
            {/* 成本控制 */}
            <Route path="/cost" element={<CostBudget />} />
            <Route path="/cost/budget" element={<CostBudget />} />
            <Route path="/cost/track" element={<CostTrack />} />
            <Route path="/cost/analysis" element={<CostAnalysis />} />
            {/* 变更控制 */}
            <Route path="/change" element={<ChangeRequest />} />
            <Route path="/change/request" element={<ChangeRequest />} />
            <Route path="/change/review" element={<ChangeReview />} />
            <Route path="/change/record" element={<ChangeRecord />} />
            {/* 安全管理 */}
            <Route path="/safety" element={<SafetyCheck />} />
            <Route path="/safety/check" element={<SafetyCheck />} />
            <Route path="/safety/training" element={<SafetyTraining />} />
            <Route path="/safety/incident" element={<SafetyIncident />} />
            {/* 信息管理 */}
            <Route path="/information" element={<InfoDocument />} />
            <Route path="/information/document" element={<InfoDocument />} />
            <Route path="/information/report" element={<InfoReport />} />
            <Route path="/information/archive" element={<InfoArchive />} />
            {/* 组织协调 */}
            <Route path="/organization" element={<OrgTeam />} />
            <Route path="/organization/team" element={<OrgTeam />} />
            <Route path="/organization/meeting" element={<OrgMeeting />} />
            <Route path="/organization/communication" element={<OrgCommunication />} />
            {/* 验收归档 */}
            <Route path="/acceptance" element={<AcceptanceCheck />} />
            <Route path="/acceptance/check" element={<AcceptanceCheck />} />
            <Route path="/acceptance/report" element={<AcceptanceReport />} />
            <Route path="/acceptance/file" element={<AcceptanceFile />} />
            {/* 合同管理 */}
            <Route path="/contract" element={<ContractManagement />} />
            <Route path="/contract/list" element={<ContractManagement />} />
            <Route path="/contract/payment" element={<ContractPayment />} />
            {/* 知识库 */}
            <Route path="/knowledge" element={<KnowledgeDoc />} />
            <Route path="/knowledge/doc" element={<KnowledgeDoc />} />
            <Route path="/knowledge/qa" element={<KnowledgeQA />} />
            {/* 监理师管理 */}
            <Route path="/supervisor" element={<SupervisorList />} />
            <Route path="/supervisor/list" element={<SupervisorList />} />
            <Route path="/supervisor/certificate" element={<SupervisorCert />} />
            {/* 系统管理 */}
            <Route path="/system" element={<DataPage />} />
            <Route path="/system/organization" element={<OrganizationPage />} />
            <Route path="/system/user" element={<UserPage />} />
            <Route path="/system/permission" element={<PermissionPage />} />
            <Route path="/system/data" element={<DataPage />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
    </AppDataProvider>
  )
}

export default Layout
