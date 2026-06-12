import { Card, Table, Button, Input, Select, Form, message, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import supervisors from '../../data/supervisors'
import certificates from '../../data/supervisorCertificates'
import type { SupervisorItem, SupervisorCertificateItem, SPCertType, SPCertStatus } from '../../types/projectManagement'
import { CompactTableCssOnly, statusColor, typeColor } from '../../components/DetailModal'

const { Option } = Select

// 合并证书来源：1) 独立证书管理列表（certificates） 2) 嵌入在监理师信息中的证书（supervisors[*].certificates）
interface MergedCertRow {
  key: string
  certificateNo: string
  type: SPCertType | string
  supervisorCode: string
  supervisorName: string
  issueDate: string
  expiryDate: string
  issueOrganization: string
  status: SPCertStatus | '未登记状态'
  source: '独立证书' | '人员属性'
}

const certTypeOptions: SPCertType[] = ['信息系统监理师', '信息系统项目管理师', '系统集成项目管理工程师', '系统架构设计师', '软件设计师', '软件造价工程师', '数据库系统工程师', '系统分析师', '其他']

const computeStatus = (expiryDate: string): SPCertStatus | '未登记状态' => {
  if (!expiryDate) return '有效'
  const today = new Date()
  const exp = new Date(expiryDate)
  const diffDays = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return '已过期'
  if (diffDays <= 90) return '即将到期'
  return '有效'
}

const CertificateQueryPanel: React.FC = () => {
  const [searchForm] = Form.useForm()
  const [filters, setFilters] = useState<{ keyword?: string; type?: string; status?: string }>({})

  const mergedData = useMemo<MergedCertRow[]>(() => {
    const rows: MergedCertRow[] = []
    supervisors.forEach((s: SupervisorItem) => {
      if (s.certificates && s.certificates.length > 0) {
        s.certificates.forEach(c => {
          rows.push({
            key: `sp-${s.code}-${c.key}`,
            certificateNo: c.certificateNo,
            type: c.type,
            supervisorCode: s.code,
            supervisorName: s.name,
            issueDate: c.issueDate,
            expiryDate: c.expiryDate,
            issueOrganization: c.issueOrganization,
            status: computeStatus(c.expiryDate),
            source: '人员属性',
          })
        })
      }
    })
    certificates.forEach((c: SupervisorCertificateItem) => {
      const sup = supervisors.find((s: SupervisorItem) => s.code === c.supervisorCode)
      rows.push({
        key: `ic-${c.code}`,
        certificateNo: c.certificateNo,
        type: c.type,
        supervisorCode: c.supervisorCode,
        supervisorName: sup ? sup.name : c.supervisorCode,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        issueOrganization: c.issueOrganization,
        status: c.status || computeStatus(c.expiryDate),
        source: '独立证书',
      })
    })
    return rows
  }, [])

  const filteredData = useMemo(() => {
    return mergedData.filter(row => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        if (!(
          row.supervisorName.toLowerCase().includes(kw) ||
          row.supervisorCode.toLowerCase().includes(kw) ||
          row.certificateNo.toLowerCase().includes(kw) ||
          row.issueOrganization.toLowerCase().includes(kw)
        )) return false
      }
      if (filters.type && row.type !== filters.type) return false
      if (filters.status && row.status !== filters.status) return false
      return true
    })
  }, [mergedData, filters])

  const handleSearch = () => {
    searchForm.validateFields().then(values => {
      setFilters({ keyword: values.keyword, type: values.type, status: values.status })
      message.success(`查询到 ${filteredData.length} 条证书记录`)
    }).catch(() => {})
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
  }

  // 统计
  const stats = useMemo(() => {
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    mergedData.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + 1
      byStatus[r.status] = (byStatus[r.status] || 0) + 1
    })
    return { total: mergedData.length, byType, byStatus }
  }, [mergedData])

  const columns = [
    { title: '所属监理师', dataIndex: 'supervisorName', key: 'supervisorName', width: 120, fixed: 'left' as const },
    { title: '编号', dataIndex: 'supervisorCode', key: 'supervisorCode', width: 110 },
    { title: '证书类型', dataIndex: 'type', key: 'type', width: 180, render: (t: string) => <Tag color={typeColor()}>{t}</Tag> },
    { title: '证书编号', dataIndex: 'certificateNo', key: 'certificateNo', width: 180 },
    { title: '颁发日期', dataIndex: 'issueDate', key: 'issueDate', width: 110 },
    { title: '有效期至', dataIndex: 'expiryDate', key: 'expiryDate', width: 110 },
    { title: '颁发机构', dataIndex: 'issueOrganization', key: 'issueOrganization', width: 180 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110, render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag> },
    { title: '数据来源', dataIndex: 'source', key: 'source', width: 110, render: (s: string) => <Tag color={typeColor()}>{s}</Tag> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>证书查询</h2>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>证书总数</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{stats.byStatus['有效'] || 0}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>有效证书</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#faad14' }}>{stats.byStatus['即将到期'] || 0}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>即将到期</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>{stats.byStatus['已过期'] || 0}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>已过期</div>
          </div>
        </div>
      </Card>

      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="type">
            <Select placeholder="证书类型" style={{ width: 180 }} allowClear>
              {certTypeOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              {['有效', '即将到期', '已过期', '已注销'].map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="姓名/监理师编号/证书编号/颁发机构" prefix={<SearchOutlined />} style={{ width: 360 }} />
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
          dataSource={filteredData}
          size="small"
          pagination={{ pageSize: 10, size: 'small', showTotal: (t: number) => `共 ${t} 条` }}
          scroll={{ x: 1350 }}
          rowKey="key"
        />
      </Card>
    </div>
  )
}

export default CertificateQueryPanel
