import type { SafetyTrainingItem, DocumentAttachment } from '../types/projectManagement'

const att = (seed: string): DocumentAttachment[] => [
  {
    key: `${seed}-1`,
    name: `${seed}-培训资料.zip`,
    url: `#${seed}-1`,
    size: 2456000,
    uploadedBy: '培训讲师',
    uploadDate: '2025-05-15 09:00:00',
    type: 'application/zip',
  },
]

const initialData: SafetyTrainingItem[] = [
  {
    key: 'st-1',
    code: 'ST-2025-001',
    projectCode: 'XB2005-0037',
    title: '信息系统安全与等保培训',
    trainingDate: '2025-05-15',
    trainer: '外部安全顾问',
    trainees: ['韦江腾', '滕海燕', '张建华', '监理团队共8人'],
    content: '等保2.0要求、信息安全管理制度、应急响应流程',
    hours: 8,
    location: '广州市天河区 - 培训室A',
    attachments: att('st1'),
    status: '已完成',
  },
  {
    key: 'st-2',
    code: 'ST-2025-002',
    projectCode: 'XB2005-0062',
    title: '海上执法安全作业培训',
    trainingDate: '2025-04-22',
    trainer: '内部安全主管',
    trainees: ['韦江腾', '运维团队共6人'],
    content: '登船作业流程、安全防护装备使用、海上应急通信',
    hours: 6,
    location: '广州市越秀区 - 指挥中心',
    attachments: att('st2'),
    status: '已完成',
  },
  {
    key: 'st-3',
    code: 'ST-2025-003',
    projectCode: 'XB2005-0156',
    title: '数据中心运维人员安全培训',
    trainingDate: '2025-06-18',
    trainer: '安全部门',
    trainees: ['张建华', '运维团队共12人'],
    content: '机房日常安全、电气安全、消防应急演练',
    hours: 4,
    location: '广州市越秀区 - 政务云机房',
    attachments: att('st3'),
    status: '计划中',
  },
  {
    key: 'st-4',
    code: 'ST-2025-004',
    projectCode: 'XB2005-0234',
    title: '情报指挥中心信息安全培训',
    trainingDate: '2025-07-10',
    trainer: '外部安全顾问',
    trainees: ['刘雪峰', '情报指挥团队共15人'],
    content: '涉密信息管理、通信安全规范、突发事件应急处置',
    hours: 8,
    location: '广州市天河区 - 指挥中心',
    attachments: att('st4'),
    status: '进行中',
  },
]

export default initialData
