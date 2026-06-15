import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag, Descriptions, Row, Col, Divider, Empty } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, TeamOutlined, UserAddOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { usePersistedState } from '../../hooks/usePersistedState'
import initialData from '../../data/projectRelations'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import { statusColor, typeColor } from '../../components/DetailModal'
import type { ProjectRelationItem, RelationParty, RelationContact, RelationPartyInfo } from '../../types/projectManagement'

const { Option } = Select

// 五方关系人配置
const PARTY_CONFIG: Array<{ key: RelationParty; label: string; color: string; icon: string }> = [
  { key: '业主方', label: '业主方', color: 'blue', icon: '🏛' },
  { key: '承建方', label: '承建方', color: 'green', icon: '🏢' },
  { key: '监理方', label: '监理方', color: 'purple', icon: '🛡' },
  { key: '验收测评方', label: '验收测评方', color: 'cyan', icon: '✅' },
  { key: '安全测评方', label: '安全测评方', color: 'orange', icon: '🔒' },
]

// 辅助：判断某方信息是否已完善（至少有负责人或1个联系人）
const isPartyComplete = (p: RelationPartyInfo): boolean => {
  return !!(p.leader && p.leader.name) || (p.contacts && p.contacts.length > 0)
}

// 辅助：统计某方总联系人数（含负责人）
const countPartyMembers = (p: RelationPartyInfo): number => {
  const leaderCount = p.leader && p.leader.name ? 1 : 0
  const contactCount = p.contacts ? p.contacts.filter(c => c && c.name).length : 0
  return leaderCount + contactCount
}

// 获取某方信息
const getPartyInfo = (item: ProjectRelationItem, key: RelationParty): RelationPartyInfo => {
  switch (key) {
    case '业主方':
      return item.ownerParty
    case '承建方':
      return item.contractor
    case '监理方':
      return item.supervision
    case '验收测评方':
      return item.acceptanceParty
    case '安全测评方':
      return item.safetyParty
    default:
      return { leader: undefined, contacts: [] }
  }
}

// 更新某方信息
const updatePartyInfo = (
  item: ProjectRelationItem,
  key: RelationParty,
  newInfo: RelationPartyInfo,
): ProjectRelationItem => {
  const out = { ...item }
  switch (key) {
    case '业主方':
      out.ownerParty = newInfo; break
    case '承建方':
      out.contractor = newInfo; break
    case '监理方':
      out.supervision = newInfo; break
    case '验收测评方':
      out.acceptanceParty = newInfo; break
    case '安全测评方':
      out.safetyParty = newInfo; break
  }
  return out
}

const PartySummaryCell: React.FC<{ party: RelationPartyInfo; color: string }> = ({ party, color }) => {
  const total = countPartyMembers(party)
  if (total === 0) {
    return <Tag color="default">待补充</Tag>
  }
  const members: string[] = []
  if (party.leader && party.leader.name) {
    members.push(`${party.leader.name}（${party.leader.position || '负责人'}）`)
  }
  if (party.contacts && party.contacts.length > 0) {
    party.contacts.forEach(c => {
      if (c.name) members.push(`${c.name}（${c.position || '联系人'}）`)
    })
  }
  return (
    <div style={{ fontSize: 12, lineHeight: 1.8 }}>
      {members.slice(0, 3).map((m, i) => (
        <div key={i}>
          <Tag color={color} style={{ fontSize: 11, marginRight: 6 }}>{i === 0 ? '负责人' : '联系人'}</Tag>
          <span>{m}</span>
        </div>
      ))}
      {members.length > 3 && (
        <div style={{ color: '#999' }}>... 共 {members.length} 人</div>
      )}
    </div>
  )
}

const ProjectRelationPanel: React.FC = () => {
  const [list, setList] = usePersistedState<ProjectRelationItem[]>('org-team', initialData)
  const [isDetailVisible, setIsDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ProjectRelationItem | null>(null)

  // 维护某方信息弹窗
  const [isPartyEditVisible, setIsPartyEditVisible] = useState(false)
  const [editingParty, setEditingParty] = useState<RelationParty>('业主方')
  const [partyEditForm] = Form.useForm()

  // 新增项目记录
  const [isAddVisible, setIsAddVisible] = useState(false)
  const [addForm] = Form.useForm()

  const [searchForm] = Form.useForm()
  const [searchParams, setSearchParams] = useState<{ keyword?: string; projectCode?: string; status?: string }>({})

  const filteredList = list.filter(item => {
    if (searchParams.keyword) {
      const kw = searchParams.keyword.toLowerCase()
      if (!item.code.toLowerCase().includes(kw) && !getProjectNameByCode(item.projectCode).toLowerCase().includes(kw)) {
        return false
      }
    }
    if (searchParams.projectCode && item.projectCode !== searchParams.projectCode) return false
    if (searchParams.status && item.status !== searchParams.status) return false
    return true
  })

  const handleSearch = () => {
    searchForm.validateFields().then(values => {
      setSearchParams({ keyword: values.keyword, projectCode: values.projectCode, status: values.status })
    }).catch(() => {})
  }

  const handleReset = () => {
    searchForm.resetFields()
    setSearchParams({})
  }

  const projectOptions = initialProjectData.map(p => ({
    key: p.code,
    label: `${p.code} - ${p.name}`,
    value: p.code,
  }))

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 140,
    },
    {
      title: '项目',
      key: 'project',
      width: 260,
      render: (_: unknown, record: ProjectRelationItem) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{record.projectName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.projectCode}</div>
        </div>
      ),
    },
    {
      title: '业主方',
      key: 'ownerParty',
      width: 220,
      render: (_: unknown, record: ProjectRelationItem) => (
        <PartySummaryCell party={record.ownerParty} color="blue" />
      ),
    },
    {
      title: '承建方',
      key: 'contractor',
      width: 220,
      render: (_: unknown, record: ProjectRelationItem) => (
        <PartySummaryCell party={record.contractor} color="green" />
      ),
    },
    {
      title: '监理方',
      key: 'supervision',
      width: 220,
      render: (_: unknown, record: ProjectRelationItem) => (
        <PartySummaryCell party={record.supervision} color="purple" />
      ),
    },
    {
      title: '验收测评方',
      key: 'acceptanceParty',
      width: 200,
      render: (_: unknown, record: ProjectRelationItem) => (
        <PartySummaryCell party={record.acceptanceParty} color="cyan" />
      ),
    },
    {
      title: '安全测评方',
      key: 'safetyParty',
      width: 200,
      render: (_: unknown, record: ProjectRelationItem) => (
        <PartySummaryCell party={record.safetyParty} color="orange" />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={statusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: ProjectRelationItem) => (
        <Space size="small" wrap>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleView(record) }}>查看详情</Button>
          <Button type="link" icon={<UserAddOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleMaintain(record, '业主方') }}>维护业主方</Button>
          <Button type="link" icon={<UserAddOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleMaintain(record, '承建方') }}>维护承建方</Button>
          <Button type="link" icon={<UserAddOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleMaintain(record, '监理方') }}>维护监理方</Button>
          <Button type="link" icon={<UserAddOutlined />} size="small" onClick={() => handleMaintain(record, '验收测评方')}>维护验收方</Button>
          <Button type="link" icon={<UserAddOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleMaintain(record, '安全测评方') }}>维护安全方</Button>
          <span onClick={(e) => e.stopPropagation()}>
            <Popconfirm
              title="确定删除此项目的关系人记录？"
              onConfirm={() => handleDelete(record.key)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
            </Popconfirm>
          </span>
        </Space>
      ),
    },
  ]

  // 汇总统计
  const totalProjects = list.length
  const totalMembers = list.reduce((sum, item) => {
    const s = countPartyMembers(item.ownerParty) + countPartyMembers(item.contractor) +
      countPartyMembers(item.supervision) + countPartyMembers(item.acceptanceParty) +
      countPartyMembers(item.safetyParty)
    return sum + s
  }, 0)
  const completeCount = list.filter(i => i.status === '已完善').length

  const handleView = (record: ProjectRelationItem) => {
    setCurrentItem(record)
    setIsDetailVisible(true)
  }

  const handleMaintain = (record: ProjectRelationItem, party: RelationParty) => {
    setCurrentItem(record)
    setEditingParty(party)
    const info = getPartyInfo(record, party)
    partyEditForm.resetFields()
    partyEditForm.setFieldsValue({
      leaderName: info.leader?.name,
      leaderPosition: info.leader?.position,
      leaderPhone: info.leader?.phone,
      leaderEmail: info.leader?.email,
      contacts: info.contacts && info.contacts.length > 0
        ? info.contacts
        : [{ key: `c-${Date.now()}`, name: '', position: '', phone: '', email: '' }],
    })
    setIsPartyEditVisible(true)
  }

  const handlePartyOk = () => {
    partyEditForm.validateFields().then(values => {
      if (!currentItem) return
      const contacts: RelationContact[] = (values.contacts || [])
        .filter((c: any) => c && c.name)
        .map((c: any, idx: number) => ({
          key: c.key || `c-${Date.now()}-${idx}`,
          name: c.name,
          position: c.position || '',
          phone: c.phone || '',
          email: c.email,
          remark: c.remark,
        }))
      const leader: RelationContact | undefined = values.leaderName
        ? {
            key: currentItem.key + '-leader-' + editingParty,
            name: values.leaderName,
            position: values.leaderPosition || '',
            phone: values.leaderPhone || '',
            email: values.leaderEmail,
          }
        : undefined
      const newPartyInfo: RelationPartyInfo = { leader, contacts }

      const updated = updatePartyInfo(currentItem, editingParty, newPartyInfo)
      // 更新整体状态
      const allComplete = PARTY_CONFIG.every(p => isPartyComplete(getPartyInfo(updated, p.key)))
      updated.status = allComplete ? '已完善' : '待完善'
      updated.lastUpdate = new Date().toISOString().slice(0, 10)

      setList(prev => prev.map(i => (i.key === updated.key ? updated : i)))
      setCurrentItem(updated)
      setIsPartyEditVisible(false)
      message.success(`已更新 ${editingParty} 信息`)
    }).catch(() => {})
  }

  const handleDelete = (key: string) => {
    setList(prev => prev.filter(item => item.key !== key))
    message.success('已删除')
  }

  const handleAdd = () => {
    addForm.resetFields()
    setIsAddVisible(true)
  }

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const projectName = getProjectNameByCode(values.projectCode) || values.projectCode
      const newItem: ProjectRelationItem = {
        key: 'pr-' + Date.now(),
        code: values.code,
        projectCode: values.projectCode,
        projectName,
        ownerParty: { leader: undefined, contacts: [] },
        contractor: { leader: undefined, contacts: [] },
        supervision: { leader: undefined, contacts: [] },
        acceptanceParty: { leader: undefined, contacts: [] },
        safetyParty: { leader: undefined, contacts: [] },
        status: '待完善',
        lastUpdate: new Date().toISOString().slice(0, 10),
        remark: values.remark,
      }
      setList(prev => [newItem, ...prev])
      setIsAddVisible(false)
      message.success('已新增项目关系人记录，请逐步维护五方信息')
    }).catch(() => {})
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>项目关系人管理</h2>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            以项目为单位，维护五方（业主方、承建方、监理方、验收测评方、安全测评方）的负责人与联系人信息。
          </div>
        </div>
        <Space>
          <Tag color={typeColor()}>项目总数：{totalProjects}</Tag>
          <Tag color={statusColor('已完善')}>已完善：{completeCount}</Tag>
          <Tag color={typeColor()}>联系人数：{totalMembers}</Tag>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增项目关系人</Button>
        </Space>
      </div>

      <Card>
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="projectCode">
            <Select placeholder="所属项目" style={{ width: 220 }} allowClear showSearch optionFilterProp="children">
              {projectOptions.map(o => <Option key={o.key} value={o.value}>{o.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="已完善">已完善</Option>
              <Option value="待完善">待完善</Option>
              <Option value="新建">新建</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="项目编号/名称" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSearch}>查询</Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
        </Form>
        <Table
          columns={columns}
          dataSource={filteredList}
          size="middle"
          pagination={{ pageSize: 8, size: 'small' }}
          scroll={{ x: 1800 }}
          rowKey="key"
          onRow={(record: ProjectRelationItem) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement
              if (target.closest('button') || target.closest('.ant-popover') || target.closest('.ant-popconfirm')) return
              handleView(record)
            },
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* 查看详情 */}
      <Modal
        title="项目关系人详情"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        onOk={() => setIsDetailVisible(false)}
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={1000}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {currentItem && (
          <div>
            <Descriptions title="基本信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="编号">{currentItem.code}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColor(currentItem.status)}>{currentItem.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目名称">{currentItem.projectName}</Descriptions.Item>
              <Descriptions.Item label="项目编号">{currentItem.projectCode}</Descriptions.Item>
              <Descriptions.Item label="最后更新">{currentItem.lastUpdate}</Descriptions.Item>
              <Descriptions.Item label="备注">{currentItem.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <Row gutter={[16, 16]}>
              {PARTY_CONFIG.map(pcfg => {
                const info = getPartyInfo(currentItem, pcfg.key)
                return (
                  <Col xs={24} md={12} key={pcfg.key}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <span style={{ fontSize: 14 }}>{pcfg.icon} {pcfg.label}</span>
                          <Tag color={pcfg.color}>
                            {countPartyMembers(info)} 人
                          </Tag>
                        </Space>
                      }
                      extra={
                        <Button
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setIsDetailVisible(false)
                            handleMaintain(currentItem, pcfg.key)
                          }}
                        >
                          维护
                        </Button>
                      }
                      style={{ height: '100%' }}
                    >
                      {!info.leader && (!info.contacts || info.contacts.length === 0) ? (
                        <Empty description="暂无信息" style={{ padding: '16px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        <div>
                          {info.leader && info.leader.name && (
                            <div>
                              <div style={{ marginBottom: 6 }}>
                                <Tag color={pcfg.color}>负责人</Tag>
                                <strong>{info.leader.name}</strong>
                                <span style={{ marginLeft: 8, color: '#666' }}>{info.leader.position || '-'}</span>
                              </div>
                              <Descriptions column={1} size="small" bordered style={{ marginBottom: 8 }}>
                                <Descriptions.Item label="电话">{info.leader.phone || '-'}</Descriptions.Item>
                                <Descriptions.Item label="邮箱">{info.leader.email || '-'}</Descriptions.Item>
                                {info.leader.remark && (
                                  <Descriptions.Item label="备注">{info.leader.remark}</Descriptions.Item>
                                )}
                              </Descriptions>
                            </div>
                          )}
                          {info.contacts && info.contacts.length > 0 && (
                            <>
                              <Divider orientation="left" plain style={{ margin: '4px 0 8px' }}>
                                联系人（{info.contacts.length}）
                              </Divider>
                              {info.contacts.map((c, idx) => (
                                <div key={c.key || idx} style={{ marginBottom: 8, padding: '8px 4px', borderBottom: '1px dashed #eee' }}>
                                  <div style={{ marginBottom: 4 }}>
                                    <Tag>联系人{idx + 1}</Tag>
                                    <strong>{c.name}</strong>
                                    <span style={{ marginLeft: 8, color: '#666' }}>{c.position || '-'}</span>
                                  </div>
                                  <Descriptions column={2} size="small">
                                    <Descriptions.Item label="电话">{c.phone || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="邮箱">{c.email || '-'}</Descriptions.Item>
                                  </Descriptions>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </div>
        )}
      </Modal>

      {/* 维护某方信息 */}
      <Modal
        title={
          <span>
            <TeamOutlined /> 维护「{editingParty}」信息（项目：{currentItem?.projectName || '-'}）
          </span>
        }
        open={isPartyEditVisible}
        onOk={handlePartyOk}
        onCancel={() => setIsPartyEditVisible(false)}
        width={780}
        okText="保存"
        cancelText="取消"
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={partyEditForm} layout="vertical">
          <Card size="small" title="负责人（1人）" style={{ marginBottom: 12 }} type="inner">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="leaderName" label="姓名">
                  <Input placeholder="请输入负责人姓名" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="leaderPosition" label="职务">
                  <Input placeholder="如：项目总监/主任/负责人" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="leaderPhone" label="联系方式">
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="leaderEmail" label="邮箱">
                  <Input placeholder="请输入邮箱（可选）" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            size="small"
            title="联系人列表"
            type="inner"
            extra={
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  const current = partyEditForm.getFieldValue('contacts') || []
                  partyEditForm.setFieldsValue({
                    contacts: [...current, { key: `c-${Date.now()}`, name: '', position: '', phone: '', email: '' }],
                  })
                }}
              >
                添加联系人
              </Button>
            }
          >
            <Form.List name="contacts">
              {(fields, { remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, idx) => (
                    <Card
                      key={key}
                      size="small"
                      style={{ marginBottom: 8, border: '1px dashed #d9d9d9' }}
                      title={
                        <span>联系人 {idx + 1}</span>
                      }
                      extra={
                        <Popconfirm
                          title="删除该联系人？"
                          onConfirm={() => remove(name)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
                        </Popconfirm>
                      }
                    >
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item {...restField} name={[name, 'name']} label="姓名" rules={[{ required: true, message: '请输入姓名' }]} style={{ marginBottom: 4 }}>
                            <Input placeholder="姓名" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item {...restField} name={[name, 'position']} label="职务" style={{ marginBottom: 4 }}>
                            <Input placeholder="如：工程师/主管" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item {...restField} name={[name, 'phone']} label="电话" style={{ marginBottom: 4 }}>
                            <Input placeholder="请输入联系电话" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item {...restField} name={[name, 'email']} label="邮箱" style={{ marginBottom: 4 }}>
                            <Input placeholder="请输入邮箱（可选）" />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item {...restField} name={[name, 'remark']} label="备注" style={{ marginBottom: 0 }}>
                            <Input.TextArea rows={1} placeholder="备注（可选）" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </Modal>

      {/* 新增项目关系人记录 */}
      <Modal
        title="新增项目关系人记录"
        open={isAddVisible}
        onOk={handleAddOk}
        onCancel={() => setIsAddVisible(false)}
        width={680}
        okText="确认新增"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="code" label="记录编号" rules={[{ required: true, message: '请输入编号' }]}>
            <Input placeholder="如：PRJ-REL-2025-005" />
          </Form.Item>
          <Form.Item name="projectCode" label="选择项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" showSearch optionFilterProp="children">
              {projectOptions.map(p => (
                <Option key={p.key} value={p.value}>{p.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息（可选）" maxLength={300} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectRelationPanel
