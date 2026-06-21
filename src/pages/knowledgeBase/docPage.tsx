import { Card, Table, Button, Space, Input, Select, DatePicker, Modal, Form, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import initialData, { initialKnowledgeApprovalMap } from '../../data/knowledgeDocs'
import type { KnowledgeDocItem, KDDocReview, DocumentAttachment } from '../../types/projectManagement'
import { usePersistedState } from '../../hooks/usePersistedState'
import { DetailModal, descItem, descText, CompactTableCssOnly, categoryColor, docStatusColor } from '../../components/DetailModal'
import { DocumentUploader, DocumentList } from '../../components/DocumentUploader'
import { ReviewModal, ReviewTimeline, getApprovalRecords, APPROVAL_CHAINS, type ApprovalRecord, exportDocument, printDocument } from '../../components/ReviewFlow'
import { useUser } from '../../context/UserContext'
import { addAuditLog } from '../../utils/auditLogger'

const { Option } = Select
const { TextArea } = Input

const categoryOptions: KDCategory[] = ['技术文档', '标准规范', '案例库', '管理制度', '经验总结']

interface DocPanelProps {
  defaultCategory?: KDCategory
}

// ============================================================
// 审批权限逻辑
//  - 状态：草稿 / 待审批 / 一审通过 / 已发布
//  - 任意角色可"新增"知识文档（默认状态：待审批）
//  - 状态=待审批：知识管理员(韦江腾 / 总监理工程师角色) 可见"审批"按钮
//  - 状态=一审通过：副总经理(王小平) 可见"审批"按钮
//  - 状态=已发布：仅"查看详情/点评"按钮
// ============================================================

const CHAIN = APPROVAL_CHAINS.KNOWLEDGE

function canApproveAtLevel(role: string, level: number): boolean {
  // levels 从 1 开始
  const chainRole = CHAIN.roles?.[level - 1]
  if (!chainRole) return false
  // 当前用户 role 与审批链节点所需 role 匹配
  if (role === '副总经理') return true
  return role === '总监理工程师'
}

function computeNextApprovalLevel(status: string): number | null {
  // 状态为"待审批"时，处于第一级审批
  // 状态为"一审通过"时，处于第二级审批
  if (status === '待审批') return 1
  if (status === '一审通过') return 2
  return null
}

const DocPanel: React.FC<DocPanelProps> = ({ defaultCategory }) => {
  const [list, setList] = usePersistedState<KnowledgeDocItem[]>('knowledge-docs', initialData)
  const { currentUser } = useUser()
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<KnowledgeDocItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [reviewForm] = Form.useForm()
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<KnowledgeDocItem | null>(null)
  const [approvalMap, setApprovalMap] = usePersistedState<Record<string, ApprovalRecord[]>>('knowledge-docs-approval', initialKnowledgeApprovalMap)
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false)
  const [approvalTarget, setApprovalTarget] = useState<KnowledgeDocItem | null>(null)
  const [approvalLevel, setApprovalLevel] = useState<number>(1)

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      onCell: (record: KnowledgeDocItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      onCell: (record: KnowledgeDocItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (c: string) => <Tag color={categoryColor()}>{c}</Tag>,
      onCell: (record: KnowledgeDocItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 110,
      onCell: (record: KnowledgeDocItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '发布日期',
      dataIndex: 'publishDate',
      key: 'publishDate',
      width: 110,
      onCell: (record: KnowledgeDocItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '更新日期',
      dataIndex: 'updateDate',
      key: 'updateDate',
      width: 110,
      onCell: (record: KnowledgeDocItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <Space size={4} wrap style={{ display: 'flex' }}>
          {(tags || []).map((t, i) => <Tag key={i} color="geekblue">{t}</Tag>)}
        </Space>
      ),
      onCell: (record: KnowledgeDocItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '阅读次数',
      dataIndex: 'views',
      key: 'views',
      width: 90,
      onCell: (record: KnowledgeDocItem) => ({
        onClick: () => handleView(record),
        style: { cursor: 'pointer' },
      }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={docStatusColor(s || '草稿')}>{s || '草稿'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: KnowledgeDocItem) => {
        const actions: React.ReactNode[] = []
        actions.push(
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            查看详情
          </Button>
        )
        // 动态审批按钮：根据状态 + 当前用户角色
        const nextLevel = computeNextApprovalLevel(record.status || '')
        if (nextLevel !== null) {
          const canApprove = nextLevel === 1
            ? currentUser.role === '总监理工程师' || currentUser.name === '韦江腾'
            : currentUser.role === '副总经理' || currentUser.name === '王小平'
          if (canApprove) {
            actions.push(
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                size="small"
                onClick={() => handleOpenApproval(record)}
              >
                {nextLevel === 1 ? '初审' : '终审'}
              </Button>
            )
          }
        }
        // 草稿状态允许编辑/发起审批
        if (!record.status || record.status === '草稿') {
          actions.push(
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )
        }
        // 点评按钮（仅已发布的文档允许点评，体现"发布后才能被评价"）
        if (record.status === '已发布') {
          actions.push(
            <Button type="link" size="small" onClick={() => handleOpenReview(record)}>
              点评
            </Button>
          )
        }
        actions.push(
          <Popconfirm
            title="确定删除此文档？"
            onConfirm={() => handleDelete(record.key)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<DeleteOutlined />} size="small" danger>删除</Button>
          </Popconfirm>
        )
        return <Space size="small" style={{ display: 'flex', flexWrap: 'wrap' }}>{actions}</Space>
      },
    },
  ]

  const handleView = (record: KnowledgeDocItem) => {
    setCurrentItem(record)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (record: KnowledgeDocItem) => {
    setCurrentItem(record)
    editForm.setFieldsValue({
      ...record,
      tags: record.tags?.join('\n') || '',
      publishDate: record.publishDate ? dayjs(record.publishDate) : null,
      updateDate: record.updateDate ? dayjs(record.updateDate) : null,
      attachments: record.attachments || [],
    })
    setIsEditModalVisible(true)
  }

  const handleDelete = (key: string) => {
    const deletedItem = list.find(item => item.key === key)
    setList(prev => { const r = prev.filter(item => item.key !== key); return r })
    message.success('删除成功')
    if (deletedItem) {
      addAuditLog(currentUser.name, '知识库', '删除', deletedItem.title, '知识文档', `删除知识文档：${deletedItem.title}`)
    }
  }

  const showAddModal = () => {
    addForm.resetFields()
    addForm.setFieldsValue({ category: defaultCategory || '技术文档' })
    setIsAddModalVisible(true)
  }

  const normalize = (values: any, key: string, existingAttachments: DocumentAttachment[] = [], existingViews: number = 0, existingReviews: KDDocReview[] = []): KnowledgeDocItem => ({
    key,
    code: values.code,
    title: values.title || '',
    category: values.category as KDCategory,
    author: values.author || '',
    publishDate: values.publishDate ? values.publishDate.format('YYYY-MM-DD') : '',
    updateDate: values.updateDate ? values.updateDate.format('YYYY-MM-DD') : '',
    tags: values.tags ? String(values.tags).split(/\r?\n|,|、/).filter(Boolean) : [],
    summary: values.summary || '',
    views: existingViews || 0,
    attachments: values.attachments || existingAttachments,
    status: (values.status as '草稿' | '待审批' | '已发布') || '待审批',
    reviews: existingReviews,
  })

  const handleAddOk = () => {
    addForm.validateFields().then(values => {
      // 新文档：默认状态为"待审批"，作者写入当前用户
      const author = values.author || currentUser.name
      const newItem: KnowledgeDocItem = normalize(
        { ...values, author, status: '待审批' },
        Date.now().toString(),
        [],
        0,
        []
      )
      setList(prev => [newItem, ...prev])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success('新增成功，文档已进入待审批状态')
      addAuditLog(currentUser.name, '知识库', '新增', newItem.title, '知识文档', `新增知识文档：${newItem.title}`)
    })
  }

  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      if (currentItem) {
        setList(prev => { const r = prev.map(item =>
          item.key === currentItem.key ? normalize(values, currentItem.key, currentItem.attachments, currentItem.views, currentItem.reviews || []) : item
        ); return r })
        setIsEditModalVisible(false)
        editForm.resetFields()
        setCurrentItem(null)
        message.success('修改成功')
        if (currentItem) {
          addAuditLog(currentUser.name, '知识库', '编辑', currentItem.title, '知识文档', `编辑知识文档：${currentItem.title}`)
        }
      }
    })
  }

  const handleSearch = () => {
    searchForm.validateFields().then(values => {
      let filtered = list.filter(item => {
        let match = true
        if (values.keyword) {
          const kw = values.keyword.toLowerCase()
          const tagMatch = (item.tags || []).some(t => t.toLowerCase().includes(kw))
          match = match && (
            item.code.toLowerCase().includes(kw) ||
            item.title.toLowerCase().includes(kw) ||
            item.author.toLowerCase().includes(kw) ||
            tagMatch
          )
        }
        if (values.category) {
          match = match && item.category === values.category
        }
        return match
      })
      setList(filtered)
      message.success(`查询到 ${filtered.length} 条记录`)
    }).catch(() => {})
  }

  const handleReset = () => {
    searchForm.resetFields()
    setList([...list])
  }

  const handleCancel = () => {
    setIsAddModalVisible(false)
    setIsEditModalVisible(false)
    setIsDetailModalVisible(false)
    setIsReviewModalVisible(false)
    addForm.resetFields()
    editForm.resetFields()
    reviewForm.resetFields()
    setCurrentItem(null)
    setReviewTarget(null)
  }

  const handleOpenApproval = (record: KnowledgeDocItem) => {
    const level = computeNextApprovalLevel(record.status || '')
    setApprovalTarget(record)
    if (level !== null) {
      setApprovalLevel(level)
    }
    setIsApprovalModalVisible(true)
  }

  const handleApprovalSubmit = (payload: { status: string; comment: string; reviewer: string }) => {
    if (!approvalTarget) return
    const existingRecords = approvalMap[approvalTarget.key] || []
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const newRecord: ApprovalRecord = {
      key: `${approvalTarget.key}-${approvalLevel}`,
      code: `${approvalTarget.code || approvalTarget.key}-R${approvalLevel}`,
      level: approvalLevel,
      reviewer: payload.reviewer || currentUser.name,
      status: payload.status as '通过' | '驳回',
      comment: payload.comment,
      date: now,
    }
    const updatedRecords = [...existingRecords, newRecord]
    const newApprovalMap = { ...approvalMap, [approvalTarget.key]: updatedRecords }
    setApprovalMap(newApprovalMap)

    let newStatus: string = approvalTarget.status || '待审批'
    if (payload.status === '驳回') {
      newStatus = CHAIN.rejectedStatus // '待审批'
    } else if (approvalLevel >= CHAIN.levels.length) {
      newStatus = CHAIN.finalApprovedStatus // '已发布'
    } else {
      newStatus = CHAIN.inProgressStatus || '一审通过'
    }

    const updatedItem: KnowledgeDocItem = { ...approvalTarget, status: newStatus as any }
    setList(prev => prev.map(item => (item.key === approvalTarget.key ? updatedItem : item)))
    setIsApprovalModalVisible(false)
    message.success(`审批已提交，当前状态：${newStatus}`)
    addAuditLog(currentUser.name, '知识库', '审批', approvalTarget.title, '知识文档', `审批知识文档「${approvalTarget.title}」，结果：${payload.status}，当前状态：${newStatus}`)
  }

  const handleOpenReview = (record: KnowledgeDocItem) => {
    setReviewTarget(record)
    reviewForm.resetFields()
    setIsReviewModalVisible(true)
  }

  const handleReviewOk = () => {
    reviewForm.validateFields().then(values => {
      if (reviewTarget && values.content?.trim()) {
        const newReview: KDDocReview = {
          key: Date.now().toString(),
          reviewer: values.reviewer || currentUser.name,
          content: values.content.trim(),
          timestamp: new Date().toLocaleString('zh-CN'),
        }
        const updatedReviews = [...(reviewTarget.reviews || []), newReview]
        const updatedTarget = { ...reviewTarget, reviews: updatedReviews }
        setList(prev => prev.map(item =>
          item.key === reviewTarget.key ? updatedTarget : item
        ))
        if (currentItem && currentItem.key === reviewTarget.key) {
          setCurrentItem(updatedTarget)
        }
        setReviewTarget(updatedTarget)
        reviewForm.resetFields()
        setIsReviewModalVisible(false)
        message.success('点评发表成功')
        if (reviewTarget) {
          addAuditLog(currentUser.name, '知识库', '编辑', reviewTarget.title, '知识文档', `对知识文档「${reviewTarget.title}」发表点评`)
        }
      }
    })
  }

  const renderFormBody = (isEdit: boolean) => (
    <Form form={isEdit ? editForm : addForm} layout="vertical" initialValues={{ category: defaultCategory || '技术文档' as KDCategory }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="code" label="编号" rules={[{ required: true, message: '请输入编号' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入编号" />
        </Form.Item>
        <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]} style={{ flex: 1 }}>
          <Select placeholder="请选择分类">
            {categoryOptions.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
        </Form.Item>
      </div>
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
        <Input placeholder="请输入标题" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="author" label="作者" rules={[{ required: true, message: '请输入作者' }]} style={{ flex: 1 }}>
          <Input placeholder="请输入作者" />
        </Form.Item>
        <Form.Item name="publishDate" label="发布日期" rules={[{ required: true, message: '请选择发布日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="updateDate" label="更新日期" rules={[{ required: true, message: '请选择更新日期' }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <Form.Item name="tags" label="标签（每行一个，或用逗号/顿号分隔）">
        <TextArea rows={2} placeholder="例如：监理、信息系统" />
      </Form.Item>
      <Form.Item name="summary" label="内容摘要">
        <TextArea rows={3} placeholder="请输入内容摘要" />
      </Form.Item>
      <Form.Item name="attachments" label="附件（知识文档文件）">
        <DocumentUploader />
      </Form.Item>
    </Form>
  )

  // 审批记录（若 approvalMap 未记录则按状态动态推算默认条目）
  const approvalRecords = currentItem
    ? getApprovalRecords(
        { key: currentItem.key, code: currentItem.code, status: currentItem.status || '' },
        approvalMap,
        'KNOWLEDGE'
      )
    : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>知识库文档管理{defaultCategory ? ` · ${defaultCategory}` : ''}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>新增知识文档</Button>
      </div>
      <Card>
        <CompactTableCssOnly />
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="category">
            <Select placeholder="分类" style={{ width: 140 }} allowClear>
              {categoryOptions.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="关键字（标题/标签/作者）" prefix={<SearchOutlined />} style={{ width: 280 }} />
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
          scroll={{ x: 1600 }}
          rowKey="key"
        />
      </Card>

      <Modal title="新增知识文档" open={isAddModalVisible} forceRender onOk={handleAddOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(false)}
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          提示：新增文档将自动进入"待审批"状态，由知识管理员（韦江腾）初审，再由副总经理（王小平）终审后发布。
        </div>
      </Modal>

      <Modal title="编辑知识文档" open={isEditModalVisible} forceRender onOk={handleEditOk} onCancel={handleCancel} width={720} okText="确定" cancelText="取消">
        {renderFormBody(true)}
        {currentItem && currentItem.reviews && currentItem.reviews.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>📝 用户点评 ({currentItem.reviews.length})</div>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {currentItem.reviews.map(r => (
                <div key={r.key} style={{ padding: 8, marginBottom: 6, background: '#fafafa', borderRadius: 4, fontSize: 13 }}>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#1677ff' }}>{r.reviewer}</span>
                    <span style={{ margin: '0 8px' }}>|</span>
                    <span>{r.timestamp}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{r.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <DetailModal
        open={isDetailModalVisible}
        title="知识文档详情"
        width={860}
        onClose={handleCancel}
        items={(() => {
          if (!currentItem) return []
          const items = [
            descItem('编号', descText(currentItem.code)),
            descItem('标题', descText(currentItem.title)),
            descItem('分类', <Tag color="blue">{currentItem.category}</Tag>),
            descItem('作者', descText(currentItem.author)),
            descItem('发布日期', descText(currentItem.publishDate)),
            descItem('更新日期', descText(currentItem.updateDate)),
            descItem('阅读次数', descText(String(currentItem.views))),
            currentItem.tags && currentItem.tags.length > 0
              ? descItem('标签', (
                <Space size={4} wrap>
                  {currentItem.tags.map((t, i) => <Tag key={i} color="geekblue">{t}</Tag>)}
                </Space>
              ))
              : null,
            descItem('内容摘要', descText(currentItem.summary)),
          ].filter(Boolean) as any[]
          items.push(descItem('附件清单', <DocumentList documents={currentItem.attachments || []} showDownload={false} />))
          items.push(descItem('状态', <Tag color={docStatusColor(currentItem.status || '草稿')}>{currentItem.status || '草稿'}</Tag>))
          // 审批记录（核心）
          items.push(descItem('审批记录', (
            <ReviewTimeline
              records={approvalRecords}
              status={currentItem.status || '草稿'}
              levels={CHAIN.levels}
            />
          )))
          // 导出 / 打印 仅在已发布状态可用
          if ((currentItem.status || '草稿') === '已发布') {
            items.push(descItem('导出 / 打印', (
              <Space>
                <Button size="small" onClick={() => exportDocument('general', {
                  title: currentItem.title,
                  code: currentItem.code,
                  projectName: '知识库文档',
                  body: [currentItem.summary || '已发布文档'],
                  approvals: approvalRecords,
                })}>导出文档</Button>
                <Button size="small" onClick={() => printDocument('general', {
                  title: currentItem.title,
                  code: currentItem.code,
                  projectName: '知识库文档',
                  body: [currentItem.summary || '已发布文档'],
                  approvals: approvalRecords,
                })}>打印</Button>
              </Space>
            )))
          }
          // 详情弹窗中展示点评信息：仅"已发布"状态显示，待审批/一审通过不展示点评
          if (currentItem.status === '已发布') {
            if (currentItem.reviews && currentItem.reviews.length > 0) {
              const reviewBlock = (
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {currentItem.reviews.map((r, idx) => (
                    <div key={r.key} style={{ padding: 10, marginBottom: 8, background: '#fafafa', borderRadius: 6, fontSize: 13, border: '1px solid #f0f0f0' }}>
                      <div style={{ color: '#666', marginBottom: 6, fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: '#1677ff' }}>{idx + 1}. {r.reviewer}</span>
                        <span style={{ margin: '0 8px' }}>|</span>
                        <span>{r.timestamp}</span>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', color: '#333', lineHeight: 1.6 }}>{r.content}</div>
                    </div>
                  ))}
                </div>
              )
              items.push(descItem(`📝 用户点评 (${currentItem.reviews.length})`, reviewBlock))
            } else {
              items.push(descItem('📝 用户点评', <span style={{ color: '#999', fontSize: 13 }}>暂无点评，快来发表第一条吧！</span>))
            }
          } else {
            items.push(descItem('📝 用户点评', <span style={{ color: '#999', fontSize: 13 }}>文档尚未发布，待审批通过后将开放点评功能。</span>))
          }
          return items
        })()}
      />

      <Modal
        title={`发表点评 - ${reviewTarget?.title || ''}`}
        open={isReviewModalVisible}
        forceRender
        onOk={handleReviewOk}
        onCancel={handleCancel}
        width={640}
        okText="发表点评"
        cancelText="取消"
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="reviewer" label="点评人" rules={[{ required: true, message: '请输入点评人姓名' }]}>
            <Input placeholder={currentUser.name || '请输入您的姓名或昵称'} maxLength={30} />
          </Form.Item>
          <Form.Item name="content" label="点评内容" rules={[{ required: true, message: '请输入点评内容' }]}>
            <TextArea rows={5} placeholder="请分享您对该文档的看法、建议或补充（最多500字）" maxLength={500} />
          </Form.Item>
        </Form>
        {reviewTarget && reviewTarget.reviews && reviewTarget.reviews.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>历史点评 ({reviewTarget.reviews.length})</div>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {reviewTarget.reviews.map(r => (
                <div key={r.key} style={{ padding: 8, marginBottom: 6, background: '#fafafa', borderRadius: 4, fontSize: 13 }}>
                  <div style={{ color: '#666', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: '#1677ff' }}>{r.reviewer}</span>
                    <span style={{ margin: '0 8px' }}>|</span>
                    <span>{r.timestamp}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{r.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ReviewModal
        open={isApprovalModalVisible}
        title={`知识文档${approvalLevel === 1 ? '初审' : '终审'} - ${approvalTarget?.title || ''}`}
        onClose={() => setIsApprovalModalVisible(false)}
        onSubmit={handleApprovalSubmit}
        currentUser={currentUser.name}
        reviewerOptions={CHAIN.reviewerOptions}
      />
    </div>
  )
}

export default DocPanel
