import { Card, Row, Col, Statistic, Progress, Tabs, Tag, Button, Empty, Descriptions } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  FileTextOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import initialProjectData from '../../data/projects'
import qualityChecksData from '../../data/qualityChecks'
import qualityIssuesData from '../../data/qualityIssues'
import qualityReportsData from '../../data/qualityReports'
import schedulePlansData from '../../data/schedulePlans'
import scheduleTracksData from '../../data/scheduleTracks'
import scheduleReportsData from '../../data/scheduleReports'
import costBudgetsData from '../../data/costBudgets'
import costTracksData from '../../data/costTracks'
import costAnalysesData from '../../data/costAnalyses'
import changeRequestsData from '../../data/changeRequests'
import safetyChecksData from '../../data/safetyChecks'
import safetyTrainingsData from '../../data/safetyTrainings'
import safetyIncidentsData from '../../data/safetyIncidents'
import infoDocumentsData from '../../data/infoDocuments'
import infoReportsData from '../../data/infoReports'
import infoArchivesData from '../../data/infoArchives'
import teamMembersData from '../../data/teamMembers'
import meetingsData from '../../data/meetings'
import communicationsData from '../../data/communications'
import acceptanceChecksData from '../../data/acceptanceChecks'
import acceptanceReportsData from '../../data/acceptanceReports'
import fileArchivesData from '../../data/fileArchives'
import type { ProjectItem } from '../../types/projectManagement'
import { formatCurrency } from '../../utils/format'
import { scaleColor, typeColor, statusColor, levelColor, categoryColor } from '../../components/DetailModal'

const { TabPane } = Tabs

function ProjectOverview() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectItem | null>(null)

  useEffect(() => {
    const found = initialProjectData.find(p => p.code === code)
    setProject(found || null)
  }, [code])

  if (!project) {
    return (
      <Card>
        <Empty description="未找到项目信息">
          <Button type="primary" onClick={() => navigate('/project/list')}>返回项目列表</Button>
        </Empty>
      </Card>
    )
  }

  // ============== 各模块按项目筛选 ==============
  const qualityChecks = qualityChecksData.filter(d => d.projectCode === project.code)
  const qualityIssues = qualityIssuesData.filter(d => d.projectCode === project.code)
  const qualityReports = qualityReportsData.filter(d => d.projectCode === project.code)
  const schedulePlans = schedulePlansData.filter(d => d.projectCode === project.code)
  const scheduleTracks = scheduleTracksData.filter(d => d.projectCode === project.code)
  const scheduleReports = scheduleReportsData.filter(d => d.projectCode === project.code)
  const costBudgets = costBudgetsData.filter(d => d.projectCode === project.code)
  const costTracks = costTracksData.filter(d => d.projectCode === project.code)
  const costAnalyses = costAnalysesData.filter(d => d.projectCode === project.code)
  const changeRequests = changeRequestsData.filter(d => d.projectCode === project.code)
  const safetyChecks = safetyChecksData.filter(d => d.projectCode === project.code)
  const safetyTrainings = safetyTrainingsData.filter(d => d.projectCode === project.code)
  const safetyIncidents = safetyIncidentsData.filter(d => d.projectCode === project.code)
  const infoDocuments = infoDocumentsData.filter(d => d.projectCode === project.code)
  const infoReports = infoReportsData.filter(d => d.projectCode === project.code)
  const infoArchives = infoArchivesData.filter(d => d.projectCode === project.code)
  const teamMembers = teamMembersData.filter(d => d.projectCode === project.code)
  const meetings = meetingsData.filter(d => d.projectCode === project.code)
  const communications = communicationsData.filter(d => d.projectCode === project.code)
  const acceptanceChecks = acceptanceChecksData.filter(d => d.projectCode === project.code)
  const acceptanceReports = acceptanceReportsData.filter(d => d.projectCode === project.code)
  const fileArchives = fileArchivesData.filter(d => d.projectCode === project.code)

  // ============== 统计计算 ==============
  const pendingQuality = qualityIssues.filter(i => i.status !== '已完成').length
  const pendingChanges = changeRequests.filter(c => !['已审批','已驳回','已执行'].includes(c.status)).length
  const openSafety = safetyIncidents.filter(i => i.status !== '已处理' && i.status !== '已归档').length
  const totalBudget = costBudgets.reduce((s, c) => s + (c.budgetAmount || 0), 0)
  const totalActual = costTracks.reduce((s, c) => s + (c.actualAmount || 0), 0)
  const avgProgress = scheduleTracks.length > 0
    ? Math.round(scheduleTracks.reduce((s, t) => s + (t.actualProgress || 0), 0) / scheduleTracks.length)
    : 0

  // ============== 小列表渲染辅助 ==============
  return (
    <div>
      {/* 顶部项目信息卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={16}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <FolderOpenOutlined style={{ fontSize: 28, color: '#1890ff', marginRight: 12 }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{project.name}</div>
                <div style={{ color: '#999', fontSize: 13 }}>项目编号：{project.code}</div>
              </div>
            </div>
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" style={{ marginTop: 8 }}>
              <Descriptions.Item label="项目类型">{project.type}</Descriptions.Item>
              <Descriptions.Item label="项目规模"><Tag color={scaleColor(project.scale)}>{project.scale}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColor(project.status)}>{project.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="审批状态"><Tag color={statusColor(project.approvalStatus)}>{project.approvalStatus}</Tag></Descriptions.Item>
              <Descriptions.Item label="总投资">{formatCurrency(project.investment)}</Descriptions.Item>
              <Descriptions.Item label="项目经理">{project.manager}</Descriptions.Item>
              <Descriptions.Item label="建设单位">{project.owner || '-'}</Descriptions.Item>
              <Descriptions.Item label="监理单位">{project.supervision}</Descriptions.Item>
              <Descriptions.Item label="项目周期">
                {project.startDate} ~ {project.endDate}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card>
                  <Statistic title="预算总额" value={formatCurrency(totalBudget)} prefix={<WalletOutlined />} />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic title="实际支出" value={formatCurrency(totalActual)} valueStyle={{ color: totalActual > totalBudget && totalBudget > 0 ? '#cf1322' : '#389e0d' }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic title="整体进度" value={avgProgress} suffix="%" valueStyle={{}} />
                  <Progress percent={avgProgress} size="small" style={{ marginTop: 6 }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic title="待处理问题" value={pendingQuality + openSafety + pendingChanges} valueStyle={{ color: '#fa8c16' }} />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    质量{pendingQuality} · 安全{openSafety} · 变更{pendingChanges}
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 四控三管一协调 Tabs */}
      <Card>
        <Tabs defaultActiveKey="quality">
          <TabPane tab={<span><CheckCircleOutlined />质量控制</span>} key="quality">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card size="small" title="质量检查" extra={<Tag color={typeColor()}>{qualityChecks.length} 项</Tag>}>
                  {qualityChecks.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    qualityChecks.slice(0, 5).map((q, idx) => (
                      <div key={q.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13 }}>{q.title}</span>
                          <Tag color={levelColor(q.level)}>{q.level}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{q.checkDate} · 检查人：{q.reviewer}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="问题整改" extra={<Tag color={pendingQuality > 0 ? statusColor('待整改') : statusColor('已完成')}>{pendingQuality} 项待处理</Tag>}>
                  {qualityIssues.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    qualityIssues.slice(0, 5).map((q, idx) => (
                      <div key={q.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13 }}>{q.title}</span>
                          <Tag color={statusColor(q.status)}>{q.status}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>责任人：{q.handler} · 截止{q.deadline}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="质量报告" extra={<Tag color={typeColor()}>{qualityReports.length} 项</Tag>}>
                  {qualityReports.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    qualityReports.slice(0, 5).map((q, idx) => (
                      <div key={q.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13 }}>{q.title}</span>
                          <Tag color={q.status === '已发布' ? 'green' : 'blue'}>{q.status}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{q.reportDate} · {q.author}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><ClockCircleOutlined />进度控制</span>} key="schedule">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card size="small" title="进度计划" extra={<Tag color={typeColor()}>{schedulePlans.length} 项</Tag>}>
                  {schedulePlans.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    schedulePlans.slice(0, 5).map((p, idx) => (
                      <div key={p.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{p.phase} · {p.planStart} ~ {p.planEnd}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="进度跟踪" extra={<Tag color={typeColor()}>{scheduleTracks.length} 项</Tag>}>
                  {scheduleTracks.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    scheduleTracks.slice(0, 5).map((t, idx) => (
                      <div key={t.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{t.phase}</span>
                          <Tag color={t.status === '正常' ? 'green' : t.status === '滞后' ? 'red' : 'blue'}>{t.status}</Tag>
                        </div>
                        <Progress percent={t.actualProgress || 0} size="small" style={{ marginTop: 6 }} />
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>偏差 {t.deviationDays} 天</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="进度报告" extra={<Tag color={typeColor()}>{scheduleReports.length} 项</Tag>}>
                  {scheduleReports.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    scheduleReports.slice(0, 5).map((r, idx) => (
                      <div key={r.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{r.reportDate} · {r.type} · {r.author}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><WalletOutlined />成本控制</span>} key="cost">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card size="small" title="成本预算" extra={<Tag color={typeColor()}>{costBudgets.length} 项</Tag>}>
                  {costBudgets.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    costBudgets.slice(0, 5).map((b, idx) => (
                      <div key={b.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13 }}>{b.title}</span>
                          <Tag color={categoryColor()}>{b.category}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>预算 {formatCurrency(b.budgetAmount)}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="成本跟踪" extra={<Tag color={typeColor()}>{costTracks.length} 项</Tag>}>
                  {costTracks.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    costTracks.slice(0, 5).map((t, idx) => {
                      const over = (t.actualAmount || 0) > (t.budgetAmount || 0)
                      return (
                        <div key={t.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13 }}>{t.title}</span>
                            <Tag color={over ? levelColor('严重') : statusColor('已完成')}>{t.status}</Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            预算 {formatCurrency(t.budgetAmount)} / 实际 {formatCurrency(t.actualAmount)}
                          </div>
                        </div>
                      )
                    })
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="成本分析" extra={<Tag color={typeColor()}>{costAnalyses.length} 项</Tag>}>
                  {costAnalyses.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    costAnalyses.slice(0, 5).map((a, idx) => (
                      <div key={a.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{a.analysisDate} · {a.author}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><HistoryOutlined />变更控制</span>} key="change">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <Card size="small" title="变更申请" extra={<Tag color={pendingChanges > 0 ? 'orange' : 'green'}>{changeRequests.length} 项，{pendingChanges} 项待处理</Tag>}>
                  {changeRequests.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    changeRequests.slice(0, 6).map((c, idx) => (
                      <div key={c.key} style={{ padding: '8px 4px', borderBottom: idx < 5 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13 }}>{c.title}</span>
                          <Tag color={c.priority === '高' ? 'red' : c.priority === '中' ? 'orange' : 'green'}>{c.priority}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          {c.type} · 影响工期 {c.impactScheduleDays} 天 / 金额 {formatCurrency(c.impactCost)} · {c.status}
                        </div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="变更流程">
                  <Descriptions column={1}>
                    <Descriptions.Item label="总申请数">{changeRequests.length} 项</Descriptions.Item>
                    <Descriptions.Item label="已审批">{changeRequests.filter(c => c.status === '已审批').length} 项</Descriptions.Item>
                    <Descriptions.Item label="已执行">{changeRequests.filter(c => c.status === '已执行').length} 项</Descriptions.Item>
                    <Descriptions.Item label="待处理">{changeRequests.filter(c => !['已审批','已驳回','已执行'].includes(c.status)).length} 项</Descriptions.Item>
                    <Descriptions.Item label="累计影响工期">{changeRequests.reduce((s, c) => s + (c.impactScheduleDays || 0), 0)} 天</Descriptions.Item>
                    <Descriptions.Item label="累计影响金额">{formatCurrency(changeRequests.reduce((s, c) => s + (c.impactCost || 0), 0))}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><SafetyCertificateOutlined />安全管理</span>} key="safety">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card size="small" title="安全检查" extra={<Tag color="geekblue">{safetyChecks.length} 项</Tag>}>
                  {safetyChecks.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    safetyChecks.slice(0, 5).map((c, idx) => (
                      <div key={c.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{c.checkDate} · {c.location} · {c.level}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="安全培训" extra={<Tag color="geekblue">{safetyTrainings.length} 项</Tag>}>
                  {safetyTrainings.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    safetyTrainings.slice(0, 5).map((t, idx) => (
                      <div key={t.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{t.trainingDate} · 培训师：{t.trainer} · {t.hours} 小时</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="安全事故" extra={<Tag color={openSafety > 0 ? 'red' : 'green'}>{safetyIncidents.length} 起，{openSafety} 起处理中</Tag>}>
                  {safetyIncidents.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    safetyIncidents.slice(0, 5).map((i, idx) => (
                      <div key={i.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13 }}>{i.title}</span>
                          <Tag color="red">{i.level}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{i.incidentDate} · 处理人：{i.handler} · {i.status}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><FileTextOutlined />信息管理</span>} key="info">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card size="small" title="文档管理" extra={<Tag color="geekblue">{infoDocuments.length} 项</Tag>}>
                  {infoDocuments.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    infoDocuments.slice(0, 5).map((d, idx) => (
                      <div key={d.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{d.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{d.category} · {d.uploadDate} · {d.author}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="报告管理" extra={<Tag color="geekblue">{infoReports.length} 项</Tag>}>
                  {infoReports.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    infoReports.slice(0, 5).map((r, idx) => (
                      <div key={r.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{r.type} · {r.reportDate} · {r.author}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="资料归档" extra={<Tag color="geekblue">{infoArchives.length} 项</Tag>}>
                  {infoArchives.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    infoArchives.slice(0, 5).map((a, idx) => (
                      <div key={a.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{a.category} · {a.archiveDate} · {a.archivist}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><TeamOutlined />组织协调</span>} key="org">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card size="small" title="团队成员" extra={<Tag color="geekblue">{teamMembers.length} 项</Tag>}>
                  {teamMembers.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    teamMembers.slice(0, 5).map((m, idx) => (
                      <div key={m.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13 }}>{m.name}</span>
                          <Tag color="blue">{m.role}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{m.phone}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="会议管理" extra={<Tag color="geekblue">{meetings.length} 项</Tag>}>
                  {meetings.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    meetings.slice(0, 5).map((m, idx) => (
                      <div key={m.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{m.meetingDate} · {m.type} · {m.host}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="沟通记录" extra={<Tag color={communications.filter(c => c.status === '待回复').length > 0 ? 'orange' : 'green'}>{communications.length} 项</Tag>}>
                  {communications.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    communications.slice(0, 5).map((c, idx) => (
                      <div key={c.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13 }}>{c.title}</span>
                          <Tag color={c.status === '待回复' ? 'orange' : 'green'}>{c.status}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{c.date} · {c.from} → {c.to}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><CheckCircleOutlined />验收归档</span>} key="accept">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card size="small" title="验收检查" extra={<Tag color="geekblue">{acceptanceChecks.length} 项</Tag>}>
                  {acceptanceChecks.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    acceptanceChecks.slice(0, 5).map((a, idx) => (
                      <div key={a.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13 }}>{a.title}</span>
                          <Tag color={a.result === '合格' ? 'green' : 'red'}>{a.result}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{a.type} · {a.checkDate}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="验收报告" extra={<Tag color="geekblue">{acceptanceReports.length} 项</Tag>}>
                  {acceptanceReports.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    acceptanceReports.slice(0, 5).map((r, idx) => (
                      <div key={r.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{r.reportDate} · {r.author} · {r.status}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="归档管理" extra={<Tag color="geekblue">{fileArchives.length} 项</Tag>}>
                  {fileArchives.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" /> : (
                    fileArchives.slice(0, 5).map((f, idx) => (
                      <div key={f.key} style={{ padding: '8px 4px', borderBottom: idx < 4 ? '1px dashed #eee' : 'none' }}>
                        <div style={{ fontSize: 13 }}>{f.title}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{f.category} · {f.archiveDate} · {f.archivist}</div>
                      </div>
                    ))
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default ProjectOverview
