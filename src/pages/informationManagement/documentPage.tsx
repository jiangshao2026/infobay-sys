import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag, Divider } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons'
import {  useState, useRef , useEffect } from 'react'
import dayjs from 'dayjs'
import { usePersistedState, getPersistedData } from '../../hooks/usePersistedState'
import { useUser } from '../../context/UserContext'
import { useCrossModuleData } from '../../context/CrossModuleDataContext'
import { addAuditLog } from '../../utils/auditLogger'
import initialData from '../../data/infoDocuments'
import initialProjectData, { getProjectNameByCode } from '../../data/projects'
import type { InfoDocumentItem, IMDocType, IMDocUploader, IMDocStatus, DocumentAttachment, ApprovalRecord } from '../../types/projectManagement'
import { DetailModal, descItem, descText, CompactTableCssOnly, typeColor, docStatusColor } from '../../components/DetailModal'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS, exportDocument, printDocument } from '../../components/ReviewFlow'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'

const { Option } = Select

const CHAIN = APPROVAL_CHAINS.DOCUMENT

const DOC_TYPE_OPTIONS: IMDocType[] = ['实施方案', '设计方案审核', '试运行报告', '支付申请附件', '其他']
const UPLOADER_OPTIONS: IMDocUploader[] = ['承建单位', '监理工程师']
const STATUS_OPTIONS: IMDocStatus[] = ['待审批', '一审通过', '已发布', '已驳回']

const DocumentPanel: React.FC = () => {
  const { infoDocList: list, setInfoDocList: setList } = useCrossModuleData()
  const { currentUser } = useUser()
const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('informationManagement-documentPage-approval', {})
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<InfoDocumentItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      onCell: (record: InfoDocumentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      onCell: (record: InfoDocumentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type?: IMDocType) => <Tag color={typeColor()}>{type || '其他'}</Tag>,
      onCell: (record: InfoDocumentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '上传方',
      dataIndex: 'uploader',
      key: 'uploader',
      width: 180,
      render: (uploader?: IMDocUploader[]) => (
        <Space size={4}>
          {(uploader && uploader.length > 0 ? uploader : ['未指定']).map(u => (
            <Tag key={u} color="purple">{u}</Tag>
          ))}
        </Space>
      ),
      onCell: (record: InfoDocumentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '关联项目',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 240,
      render: (code: string) => descText(getProjectNameByCode(code)),
      onCell: (record: InfoDocumentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 100,
      onCell: (record: InfoDocumentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      onCell: (record: InfoDocumentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: IMDocStatus) => <Tag color={docStatusColor(status)}>{status}</Tag>,
      onCell: (record: InfoDocumentItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: unknown, record: InfoDocumentItem) => (
        <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>查看详情</Button>
          {(record.status === '待审批' && (currentUser.role === '监理工程师' || currentUser.role === '总监理工程师')) && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
          )}
          {record.status === '一审通过' && currentUser.role === '总监理工程师' && (
            <Button type="link" icon={<CheckCircleOutlined />} size="small" onClick={() => handleReview(record)}>审批</Button>
          )}
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此文档？"
            onConfirm={() => handleDelete(record.key)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<DeleteOutlined />} size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleView = (record: InfoDocumentItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: InfoDocumentItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      uploadDate: record.uploadDate ? dayjs(record.uploadDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const deletedItem = list.find(item => item.key === key)
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
    if (deletedItem) {
      addAuditLog(currentUser.name, '信息管理', '删除', deletedItem.title, '信息管理文档', `删除文档：${deletedItem.title}（编号：${deletedItem.code}）`)
    }
  }

  const handleReview = (record: InfoDocumentItem) => {
    setCurrentItem(record)
    setIsReviewModalVisible(true)
  }

  const showAddModal = () => {
    addForm.resetFields()
    addForm.setFieldsValue({
      status: '待审批' as IMDocStatus,
      type: '其他' as IMDocType,
      uploader: ['承建单位'] as IMDocUploader[],
      version: 'V1.0',
    })
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = [], existingLevel?: number): InfoDocumentItem => ({
    key,
    code: values.code,
    projectCode: values.projectCode,
    title: values.title || '',
    category: values.category || '其他',
    type: values.type as IMDocType,
    uploader: values.uploader as IMDocUploader[],
    author: values.author,
    uploadDate: values.uploadDate ? values.uploadDate.format('YYYY-MM-DD') : '',
    version: values.version || 'V1.0',
    status: values.status as IMDocStatus,
    description: values.description,
    attachments: values.attachments || existingAttachments,
    currentLevel: existingLevel ?? 0,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      const newItem: InfoDocumentItem = normalize(values, Date.now().toString(), [])
      setList(prev => { const r = [newItem, ...prev]; return r })
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功')
      addAuditLog(currentUser.name, '信息管理', '新增', values.title || values.code, '信息管理文档', `新增文档：${values.title}（编号：${values.code}）`)
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentItem) {
        setList(prev => { const r = prev.map(item =>
          item.key === currentItem.key ? normalize(values, currentItem.key, currentItem.attachments, currentItem.currentLevel) : item
        ); return r })
        setIsEditModalVisible(false)
        editForm.resetFields()
        setCurrentItem(null)
        message.success('修改成功')
        addAuditLog(currentUser.name, '信息管理', '编辑', currentItem.title, '信息管理文档', `编辑文档：${currentItem.title}（编号：${currentItem.code}）`)
      }
    })
  }

  const handleSearch = () => {
    searchForm.validateFields().then(values => {
      let filtered = list.filter(item => {
        let match = true
        if (values.keyword) {
          const kw = values.keyword.toLowerCase()
          match = match && (
            item.code.toLowerCase().includes(kw) ||
            item.title.toLowerCase().includes(kw) ||
            item.author.toLowerCase().includes(kw)
          )
        }
        if (values.projectCode) {
          match = match && item.projectCode === values.projectCode
        }
        if (values.status) {
          match = match && item.status === values.status
        }
        if (values.type) {
          match = match && item.type === values.type
        }
        if (values.uploader) {
          match = match && (item.uploader || []).includes(values.uploader)
        }
        return match
      })
      setList(filtered)
      message.success(`查询到 ${filtered.length} 条记录`)
    }).catch(() => {})
  }

  const handleReset = () => {
    searchForm.resetFields()
    setList(getPersistedData<InfoDocumentItem[]>('info-doc') ?? list)
  }

  const handleCancel = () => {
    setIsAddModalVisible(false)
    setIsEditModalVisible(false)
    setIsDetailModalVisible(false)
    setIsReviewModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    setCurrentItem(null)
  }

  // 2 级审批链提交逻辑：监理工程师审核 → 总监理工程师审批
  const handleReviewSubmit = (payload: { status: '通过' | '驳回'; comment: string; reviewer: string }) => {
    if (!currentItem) return
    const key = currentItem.key
    const existingRecords = approvalMap[key] || []
    const nextLevel = (existingRecords.length + 1)

    const newRecord: ApprovalRecord = {
      key: `${key}-${nextLevel}`,
      code: `${currentItem.code}-R${nextLevel}`,
      level: nextLevel,
      reviewer: payload.reviewer,
      comment: payload.comment,
      status: payload.status,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
    const updatedRecords = [...existingRecords, newRecord]
    setApprovalMap(prev => ({ ...prev, [key]: updatedRecords }))

    if (payload.status === '驳回') {
      setList(prev => { const r = prev.map(item => item.key === key ? { ...item, status: '已驳回' as IMDocStatus, currentLevel: nextLevel } : item); return r })
      message.success('已驳回')
      addAuditLog(currentUser.name, '信息管理', '审批', currentItem.title, '信息管理文档', `驳回文档：${currentItem.title}（编号：${currentItem.code}）`)
    } else {
      // 通过：若达到 2 级终态 -> 已发布；否则 -> 一审通过
      const isFinal = nextLevel >= CHAIN.levels.length
      setList(prev => { const r = prev.map(item => item.key === key
        ? { ...item, status: (isFinal ? '已发布' : '一审通过') as IMDocStatus, currentLevel: nextLevel }
        : item); return r })
      message.success(isFinal ? '审批完成，文档已发布' : '一审通过，等待总监理工程师终审')
      addAuditLog(currentUser.name, '信息管理', '审批', currentItem.title, '信息管理文档', `审批文档：${currentItem.title}（编号：${currentItem.code}），状态：${isFinal ? '已发布' : '一审通过'}`)
    }
    setIsReviewModalVisible(false)
    setCurrentItem(null)
  }

  const projectOptions = initialProjectData.map(p => (
    <Option key={p.code} value={p.code}>{p.name}</Option>
  ))

  // 监理审核意见文档 - 生成 body 内容
  const buildSupervisionOpinionBody = (item: InfoDocumentItem): string[] => {
    const projectName = getProjectNameByCode(item.projectCode)
    const uploaderText = (item.uploader && item.uploader.length > 0) ? item.uploader.join('、') : '未指定'
    const approvals = getApprovalRecords(item, approvalMap, 'DOCUMENT')
    const level1 = approvals.find(r => r.level === 1)
    const level2 = approvals.find(r => r.level === 2)

    const paragraphs: string[] = []
    paragraphs.push(`一、文档基本信息`)
    paragraphs.push(`文档编号：${item.code}`)
    paragraphs.push(`文档标题：${item.title}`)
    paragraphs.push(`文档类型：${item.type || '其他'}`)
    paragraphs.push(`上传方：${uploaderText}`)
    paragraphs.push(`版本：${item.version}，上传日期：${item.uploadDate}`)
    paragraphs.push(`关联项目：${projectName}（项目编号：${item.projectCode}）`)
    if (item.description) {
      paragraphs.push(`文档说明：${item.description}`)
    }
    paragraphs.push(`二、监理工程师审核意见`)
    if (level1) {
      paragraphs.push(`审核人：${level1.reviewer}`)
      paragraphs.push(`审核日期：${level1.date}`)
      paragraphs.push(`审核结果：${level1.status}`)
      paragraphs.push(`审核意见：${level1.comment}`)
    } else {
      paragraphs.push(`暂无监理工程师审核记录。`)
    }
    paragraphs.push(`三、总监理工程师审批意见`)
    if (level2) {
      paragraphs.push(`审批人：${level2.reviewer}`)
      paragraphs.push(`审批日期：${level2.date}`)
      paragraphs.push(`审批结果：${level2.status}`)
      paragraphs.push(`审批意见：${level2.comment}`)
    } else {
      paragraphs.push(`暂无总监理工程师审批记录。`)
    }
    paragraphs.push(`四、结论`)
    if (item.status === '已发布') {
      paragraphs.push(`本项目文档经监理工程师审核及总监理工程师审批，内容完备、符合监理规范要求，同意发布。`)
    } else if (item.status === '已驳回') {
      paragraphs.push(`本项目文档在审批过程中被驳回，请承建单位按审批意见修改后重新提交。`)
    } else if (item.status === '一审通过') {
      paragraphs.push(`本项目已通过一审，尚处于审批流程中，请总监理工程师完成终审。`)
    } else {
      paragraphs.push(`本项目文档待发起审批。`)
    }
    return paragraphs
  }

  const handleExportOpinion = (item: InfoDocumentItem) => {
    const body = buildSupervisionOpinionBody(item)
    const approvals = getApprovalRecords(item, approvalMap, 'DOCUMENT')
    exportDocument('supervisionOpinion', {
      code: `${item.code}-意见`,
      projectName: getProjectNameByCode(item.projectCode),
      title: '监理审核意见',
      subtitle: item.title,
      body,
      attachments: (item.attachments || []).map(a => a.name),
      approvals,
      date: item.uploadDate,
    })
    message.success('已导出监理审核意见')
  }

  const handlePrintOpinion = (item: InfoDocumentItem) => {
    const body = buildSupervisionOpinionBody(item)
    const approvals = getApprovalRecords(item, approvalMap, 'DOCUMENT')
    printDocument('supervisionOpinion', {
      code: `${item.code}-意见`,
      projectName: getProjectNameByCode(item.projectCode),
      title: '监理审核意见',
      subtitle: item.title,
      body,
      attachments: (item.attachments || []).map(a => a.name),
      approvals,
      date: item.uploadDate,
    })
  }

  const renderFormBody = (isEdit: boolean) => {
    const form = isEdit ? editForm : addForm
    return (
      <Form form={form} layout="vertical">
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]} style={{ flex: 1 }}>
            <Input placeholder="请输入编号" />
          </Form.Item>
          <Form.Item name="version" label="版本" rules={[{ required: true, message: '请输入版本' }]} style={{ flex: 1 }}>
            <Input placeholder="如 V1.0" />
          </Form.Item>
        </div>
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="请输入标题" />
        </Form.Item>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="projectCode" label="关联项目" rules={[{ required: true, message: '请选择项目' }]} style={{ flex: 2 }}>
            <Select placeholder="请选择项目" showSearch optionFilterProp="children">
              {projectOptions}
            </Select>
          </Form.Item>
          <Form.Item name="uploadDate" label="上传日期" rules={[{ required: true, message: '请选择上传日期' }]} style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="type" label="文档类型" rules={[{ required: true, message: '请选择文档类型' }]} style={{ flex: 1 }}>
            <Select placeholder="请选择文档类型">
              {DOC_TYPE_OPTIONS.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="uploader" label="上传方" rules={[{ required: true, message: '请选择上传方' }]} style={{ flex: 1 }}>
            <Select mode="multiple" placeholder="可多选" allowClear>
              {UPLOADER_OPTIONS.map(u => (
                <Option key={u} value={u}>{u}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="author" label="作者" rules={[{ required: true, message: '请输入作者' }]} style={{ flex: 1 }}>
            <Input placeholder="请输入作者" />
          </Form.Item>
        </div>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select placeholder="请选择状态">
            {STATUS_OPTIONS.map(s => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="description" label="说明">
          <Input.TextArea rows={3} placeholder="请输入说明/备注" maxLength={500} showCount />
        </Form.Item>
        <Form.Item name="attachments" label="附件">
          <DocumentUploader />
        </Form.Item>
      </Form>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>文档管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增文档</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="projectCode">
            <Select placeholder="项目" style={{ width: 220 }} allowClear showSearch optionFilterProp="children">
              {projectOptions}
            </Select>
          </Form.Item>
          <Form.Item name="type">
            <Select placeholder="文档类型" style={{ width: 150 }} allowClear>
              {DOC_TYPE_OPTIONS.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="uploader">
            <Select placeholder="上传方" style={{ width: 140 }} allowClear>
              {UPLOADER_OPTIONS.map(u => (
                <Option key={u} value={u}>{u}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              {STATUS_OPTIONS.map(s => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（编号/标题/作者）" prefix={<SearchOutlined />} style={{ width: 260 }} />
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
          dataSource={list}
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 1700 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增文档" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={760} okText="确定" cancelText="取消">
        {renderFormBody(false)}
      </Modal>

      <Modal title="编辑文档" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={760} okText="确定" cancelText="取消">
        {renderFormBody(true)}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="文档详情"
        width={880}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const approvalRecords = getApprovalRecords(currentItem, approvalMap, 'DOCUMENT')
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('标题', descText(currentItem.title)),
            descItem('文档类型', <Tag color={typeColor()}>{currentItem.type || '其他'}</Tag>),
            descItem('上传方', (
              <Space size={4}>
                {((currentItem.uploader && currentItem.uploader.length > 0) ? currentItem.uploader : ['未指定']).map(u => (
                  <Tag key={u} color="purple">{u}</Tag>
                ))}
              </Space>
            )),
            descItem('关联项目', descText(getProjectNameByCode(currentItem.projectCode))),
            descItem('作者', descText(currentItem.author)),
            descItem('版本', descText(currentItem.version)),
            descItem('上传日期', descText(currentItem.uploadDate)),
            descItem('状态', <Tag color={docStatusColor(currentItem.status)}>{currentItem.status}</Tag>),
            descItem('说明', descText(currentItem.description || '—')),
          ]
          items.push(descItem('附件列表', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          items.push(descItem('审批记录（2 级审批：监理工程师审核 → 总监理工程师审批）', (
            <ReviewTimeline
              records={approvalRecords}
              status={currentItem.status}
              levels={CHAIN.levels}
            />
          )))
          items.push(descItem('监理审核意见文件', (
            <div>
              <div style={{ color: '#555', fontSize: 13, marginBottom: 8 }}>
                系统依据文档信息 + 2 级审批记录自动生成《监理审核意见》，可导出或打印。
              </div>
              <Space>
                <Button icon={<DownloadOutlined />} onClick={() => handleExportOpinion(currentItem)}>导出监理审核意见</Button>
                <Button icon={<PrinterOutlined />} onClick={() => handlePrintOpinion(currentItem)}>打印监理审核意见</Button>
                {(currentUser.role === '监理工程师' || currentUser.role === '总监理工程师') && (
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { setIsDetailModalVisible(false); handleReview(currentItem) }}>提交审批</Button>
                )}
              </Space>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ background: '#fafafa', padding: 12, border: '1px dashed #ddd', fontSize: 13, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                {buildSupervisionOpinionBody(currentItem).join('\n')}
              </div>
            </div>
          )))
          return items
        })()}
      />

      <ReviewModal
        open={isReviewModalVisible}
        title="发起审批（监理工程师审核 / 总监理工程师审批）"
        onClose={handleCancel}
        onSubmit={handleReviewSubmit}
        reviewerOptions={CHAIN.reviewerOptions}
        okText="提交审批"
      
        currentUser={currentUser.name}
      />
    </div>
  )
}

export default DocumentPanel
