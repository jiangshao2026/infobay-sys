import { Card, Table, Tag, Space, Button, Input, Select, DatePicker, Modal, Descriptions, message, Popconfirm, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined, ClearOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import { CompactTableCssOnly } from '../../components/DetailModal'
import type { AuditLogItem, AuditAction, AuditModule } from '../../types/projectManagement'

const { Option } = Select
const { RangePicker } = DatePicker

const STORAGE_KEY = 'sys-audit-log'

/** 初始模拟审计日志 — 与实际演示数据衔接 */
const initialAuditLogs: AuditLogItem[] = (() => {
  const d = (days: number) => {
    const date = new Date(Date.now() - days * 86400000)
    return date.toLocaleString('zh-CN', { hour12: false })
  }
  return [
    // ===== 系统管理 =====
    { key: 'log_init_1', timestamp: d(0), user: '韦江腾', module: '系统管理', action: '登录', target: '系统', targetType: '登录', detail: '用户登录系统' },
    { key: 'log_init_2', timestamp: d(0), user: '滕海燕', module: '系统管理', action: '登录', target: '系统', targetType: '登录', detail: '用户登录系统' },

    // ===== 项目管理 =====
    { key: 'log_init_3', timestamp: d(0), user: '韦江腾', module: '项目管理', action: '新增', target: '广东省市场监管局信息化项目(2025年第二批)', targetType: '项目', detail: '新增项目，编号XB2005-0037，信息系统建设，大型，投资2860万元，建设单位：广东省信息中心' },
    { key: 'log_init_4', timestamp: d(1), user: '韦江腾', module: '项目管理', action: '编辑', target: '广东省海洋综合执法总队综合指挥中心升级改造项目', targetType: '项目', detail: '更新项目进度至60%，调整里程碑计划中设备安装调试阶段结束日期' },

    // ===== 合同管理 =====
    { key: 'log_init_5', timestamp: d(1), user: '李建华', module: '合同管理', action: '新增', target: '广东省市场监管局信息化项目监理合同', targetType: '建设合同', detail: '新增监理合同，合同编号SJ-2025-0012，金额128.7万元，甲方：广东省市场监督管理局' },
    { key: 'log_init_6', timestamp: d(1), user: '王小平', module: '合同管理', action: '审批', target: '广东省海洋综合执法总队综合指挥中心升级改造项目监理合同', targetType: '建设合同', detail: '审批通过，合同编号SJ-2025-0025，金额78.5万元，项目周期2025.02-2026.01' },
    { key: 'log_init_7', timestamp: d(2), user: '许琰芳', module: '合同管理', action: '新增', target: '"赣数智"一体化平台项目监理合同', targetType: '建设合同', detail: '新增监理合同，合同编号SJ-2025-0073，金额65.8万元，甲方：江西省统计局' },

    // ===== 质量控制 =====
    { key: 'log_init_8', timestamp: d(2), user: '韦江腾', module: '质量控制', action: '审批', target: 'QC-2025-001 市场主体登记系统功能验收检查', targetType: '质量检查', detail: '一审通过，审批意见：整体功能良好，首页响应时间需优化后复查' },
    { key: 'log_init_9', timestamp: d(2), user: '滕海燕', module: '质量控制', action: '新增', target: 'QI-2025-002 信用评分模型结果偏差', targetType: '问题整改', detail: '发现信用监管平台评分模型结果偏差超15%，需重新校准模型，紧急程度：较严重' },
    { key: 'log_init_10', timestamp: d(3), user: '韦江腾', module: '质量控制', action: '编辑', target: 'QI-2025-001 首页加载性能不符合设计要求', targetType: '问题整改', detail: '更新整改状态为"整改中"，整改措施：拆分包体积优化+接口缓存与数据库查询优化' },

    // ===== 进度控制 =====
    { key: 'log_init_11', timestamp: d(3), user: '韦江腾', module: '进度控制', action: '新增', target: 'SP-2025-001 市场主体登记系统上线阶段计划', targetType: '进度计划', detail: '创建上线阶段计划，涵盖系统测试(15天)、数据迁移(10天)、用户培训(5天)、正式上线(3天)' },
    { key: 'log_init_12', timestamp: d(3), user: '梁育境', module: '进度控制', action: '编辑', target: '广东省市场监管局信息化项目(2025年第二批)', targetType: '进度跟踪', detail: '更新本周进度报告，系统开发完成85%，正在进行接口联调测试' },

    // ===== 成本控制 =====
    { key: 'log_init_13', timestamp: d(4), user: '王华', module: '成本控制', action: '审批', target: 'CB-2025-001 市场监管局信息系统开发费用预算', targetType: '成本预算', detail: '审批通过，预算总额1650万元，涵盖系统开发、测试、部署及培训费用' },
    { key: 'log_init_14', timestamp: d(4), user: '滕海燕', module: '成本控制', action: '编辑', target: '广东省市场监管局信息化项目(2025年第二批)', targetType: '成本跟踪', detail: '更新预算执行率至52.3%，累计支出863万元，剩余预算787万元' },

    // ===== 变更控制 =====
    { key: 'log_init_15', timestamp: d(4), user: '滕海燕', module: '变更控制', action: '新增', target: 'CR-2025-001 信用监管平台数据库分库分表架构调整', targetType: '变更申请', detail: '申请将原单体数据库架构调整为分库分表架构以支撑未来3年数据增长，预计影响工期15天' },
    { key: 'log_init_16', timestamp: d(5), user: '王小平', module: '变更控制', action: '审批', target: 'CR-2025-001 信用监管平台数据库分库分表架构调整', targetType: '变更申请', detail: '审批通过，增加预算80万元，工期延长15天，技术方案可行' },

    // ===== 安全管理 =====
    { key: 'log_init_17', timestamp: d(5), user: '韦江腾', module: '安全管理', action: '新增', target: 'SC-2025-001 市场监管局信息中心机房日常安全检查', targetType: '安全检查', detail: '完成信息中心机房日常安全检查，发现2项问题：灭火器检查记录不完整、UPS状态指示灯异常' },
    { key: 'log_init_18', timestamp: d(5), user: '韦江腾', module: '安全管理', action: '审批', target: 'ST-2025-001 信息系统安全与等保培训', targetType: '安全培训', detail: '审批完成信息系统安全与等保培训，培训学时8学时，培训监理团队共8人' },
    { key: 'log_init_19', timestamp: d(6), user: '韦江腾', module: '安全管理', action: '新增', target: 'SI-2025-001 大屏显示系统花屏事件', targetType: '安全事故', detail: '报告综合指挥中心大屏显示系统花屏事件，原因：显示控制盒散热不良导致短暂故障，经济损失约5000元' },

    // ===== 信息管理 =====
    { key: 'log_init_20', timestamp: d(6), user: '滕海燕', module: '信息管理', action: '上传', target: 'qc1-1-QC-2025-001-现场检查记录表.pdf', targetType: '文档', detail: '上传市场主体登记系统功能验收检查相关附件：现场检查记录表' },
    { key: 'log_init_21', timestamp: d(6), user: '韦江腾', module: '信息管理', action: '新增', target: '2025年5月监理月报', targetType: '报告', detail: '编制5月份监理月报，汇总项目进度完成62%、质量问题3项已整改2项、成本支出863万元' },

    // ===== 组织协调 =====
    { key: 'log_init_22', timestamp: d(7), user: '韦江腾', module: '组织协调', action: '新增', target: '2025年6月第1周监理例会', targetType: '会议管理', detail: '召开监理例会，参会人员：建设单位、承建单位、监理单位三方，讨论首页性能整改方案及本周进度安排' },

    // ===== 验收归档 =====
    { key: 'log_init_23', timestamp: d(7), user: '赵雄飞', module: '验收归档', action: '审批', target: 'AC-2025-001 综合指挥中心大屏显示系统分项验收', targetType: '验收检查', detail: '分项验收通过，大屏显示系统功能、性能指标均符合设计要求，可进入下一阶段施工' },

    // ===== 监理师管理 =====
    { key: 'log_init_24', timestamp: d(7), user: '韦江腾', module: '监理师管理', action: '编辑', target: '梁育境', targetType: '监理师', detail: '更新监理师岗位信息，新增"监理工程师"任职资格记录' },

    // ===== 知识库 =====
    { key: 'log_init_25', timestamp: d(8), user: '韦江腾', module: '知识库', action: '新增', target: '信息系统监理验收规范(2025版)', targetType: '知识文档', detail: '上传信息系统监理验收规范文档，分类：标准规范，用于指导项目验收工作' },
  ]
})()

/** 从 localStorage 读取审计日志（合并初始演示数据 + 运行时产生的日志） */
function loadLogs(): AuditLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as AuditLogItem[]
      // 合并初始演示数据与运行时日志：以 key 去重，运行时日志在前
      const existingKeys = new Set(stored.map(l => l.key))
      const missingInitial = initialAuditLogs.filter(l => !existingKeys.has(l.key))
      if (missingInitial.length > 0) {
        const merged = [...stored, ...missingInitial]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        return merged
      }
      return stored
    }
    // 首次访问时写入初始数据
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAuditLogs))
    return initialAuditLogs
  } catch {
    return []
  }
}

/** 颜色映射 */
const actionColor: Record<string, string> = {
  '新增': 'green', '编辑': 'blue', '删除': 'red',
  '查询': 'cyan', '审批': 'purple', '登录': 'geekblue',
  '导出': 'orange', '上传': 'lime', '下载': 'gold',
}

function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>(loadLogs)
  const [filteredLogs, setFilteredLogs] = useState<AuditLogItem[]>(loadLogs)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterModule, setFilterModule] = useState<string>('')
  const [filterAction, setFilterAction] = useState<string>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [detailItem, setDetailItem] = useState<AuditLogItem | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)

  /** 刷新数据 */
  const refresh = () => {
    const data = loadLogs()
    setLogs(data)
    applyFilters(data, searchKeyword, filterModule, filterAction, dateRange)
  }

  /** 应用过滤条件 */
  const applyFilters = (
    source: AuditLogItem[],
    keyword: string,
    module: string,
    action: string,
    range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
  ) => {
    let result = source
    if (keyword) {
      const kw = keyword.toLowerCase()
      result = result.filter(item =>
        item.user.toLowerCase().includes(kw) ||
        item.target.toLowerCase().includes(kw) ||
        item.targetType.toLowerCase().includes(kw) ||
        item.detail.toLowerCase().includes(kw)
      )
    }
    if (module) result = result.filter(item => item.module === module)
    if (action) result = result.filter(item => item.action === action)
    if (range && range[0] && range[1]) {
      const start = range[0].format('YYYY-MM-DD')
      const end = range[1].format('YYYY-MM-DD')
      result = result.filter(item => {
        const d = item.timestamp.slice(0, 10)
        return d >= start && d <= end
      })
    }
    setFilteredLogs(result)
  }

  const handleSearch = () => applyFilters(logs, searchKeyword, filterModule, filterAction, dateRange)
  const handleReset = () => {
    setSearchKeyword('')
    setFilterModule('')
    setFilterAction('')
    setDateRange(null)
    setFilteredLogs(logs)
  }

  const handleClearAll = () => {
    localStorage.removeItem(STORAGE_KEY)
    message.success('审计日志已清空')
    refresh()
  }

  const handleViewDetail = (item: AuditLogItem) => {
    setDetailItem(item)
    setDetailVisible(true)
  }

  const modules: AuditModule[] = [
    '项目管理', '质量控制', '进度控制', '成本控制', '变更控制',
    '安全管理', '信息管理', '组织协调', '验收归档', '合同管理',
    '知识库', '监理师管理', '系统管理', '工作台',
  ]
  const actions: AuditAction[] = ['新增', '编辑', '删除', '查询', '审批', '登录', '导出', '上传', '下载']

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{v}</span>,
    },
    { title: '操作人', dataIndex: 'user', key: 'user', width: 90 },
    {
      title: '功能模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (v: string) => <Tag color="cyan">{v}</Tag>,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 90,
      render: (v: AuditAction) => <Tag color={actionColor[v] || 'default'}>{v}</Tag>,
    },
    { title: '对象类型', dataIndex: 'targetType', key: 'targetType', width: 100 },
    { title: '对象名称', dataIndex: 'target', key: 'target', width: 200, ellipsis: true },
    { title: '操作详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: AuditLogItem) => (
        <Tooltip title="查看详情">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
        </Tooltip>
      ),
    },
  ]

  return (
    <div>
      <CompactTableCssOnly />
      <Card
        title={<><SearchOutlined /> 操作日志 / 审计追踪</>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refresh}>刷新</Button>
            <Popconfirm
              title="确定要清空所有审计日志吗？"
              description="此操作不可撤销，已清空的日志无法恢复"
              okText="确定清空"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={handleClearAll}
            >
              <Button danger icon={<ClearOutlined />}>清空日志</Button>
            </Popconfirm>
          </Space>
        }
        styles={{ body: { padding: 16 } }}
      >
        {/* 搜索栏 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Input
            placeholder="搜索操作人、对象名称、详情…"
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select
            placeholder="选择模块"
            style={{ width: 130 }}
            value={filterModule || undefined}
            onChange={v => setFilterModule(v || '')}
            allowClear
          >
            {modules.map(m => <Option key={m} value={m}>{m}</Option>)}
          </Select>
          <Select
            placeholder="选择操作"
            style={{ width: 120 }}
            value={filterAction || undefined}
            onChange={v => setFilterAction(v || '')}
            allowClear
          >
            {actions.map(a => <Option key={a} value={a}>{a}</Option>)}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={dates => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
          />
          <Button type="primary" onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </div>

        {/* 数据统计 */}
        <div style={{ color: '#999', fontSize: 13, marginBottom: 12 }}>
          共 {filteredLogs.length} 条操作记录
        </div>

        {/* 表格 */}
        <Table
          size="small"
          dataSource={filteredLogs}
          columns={columns}
          rowKey="key"
          scroll={{ x: 900 }}
          pagination={{ pageSize: 20, showSizeChanger: false, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="操作日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button type="primary" onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={700}
      >
        {detailItem && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="操作时间">{detailItem.timestamp}</Descriptions.Item>
            <Descriptions.Item label="操作人">{detailItem.user}</Descriptions.Item>
            <Descriptions.Item label="功能模块">
              <Tag color="cyan">{detailItem.module}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="操作类型">
              <Tag color={actionColor[detailItem.action] || 'default'}>{detailItem.action}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="对象类型">{detailItem.targetType}</Descriptions.Item>
            <Descriptions.Item label="对象名称">{detailItem.target}</Descriptions.Item>
            <Descriptions.Item label="操作详情">{detailItem.detail}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default AuditLogPage