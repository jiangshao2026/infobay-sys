import type { ProjectRelationItem } from '../types/projectManagement'

const projectRelationsData: ProjectRelationItem[] = [
  {
    key: 'pr-1',
    code: 'PRJ-REL-2025-001',
    projectCode: 'XB2005-0037',
    projectName: '信息系统监理平台建设项目',
    ownerParty: {
      leader: { key: 'o1', name: '林建国', position: '信息中心主任', phone: '136****2211', email: 'linjg@xb.gov.cn' },
      contacts: [
        { key: 'o1c1', name: '徐晓敏', position: '项目协调员', phone: '137****3322', email: 'xuxm@xb.gov.cn' },
        { key: 'o1c2', name: '赵伟', position: '技术主管', phone: '135****4433', email: 'zhaow@xb.gov.cn' },
      ],
    },
    contractor: {
      leader: { key: 'c1', name: '黄昌明', position: '项目经理', phone: '139****5544', email: 'huangcm@buildtech.com' },
      contacts: [
        { key: 'c1c1', name: '李明辉', position: '技术负责人', phone: '138****6655', email: 'limh@buildtech.com' },
        { key: 'c1c2', name: '王晓燕', position: '开发主管', phone: '137****7766', email: 'wangxy@buildtech.com' },
      ],
    },
    supervision: {
      leader: { key: 's1', name: '韦江腾', position: '总监理工程师', phone: '138****1234', email: 'chenwq@jianli.com' },
      contacts: [
        { key: 's1c1', name: '滕海燕', position: '专业监理工程师', phone: '139****5678', email: 'chengh@jianli.com' },
        { key: 's1c2', name: '小林', position: '监理员', phone: '135****9988', email: 'xiaolin@jianli.com' },
      ],
    },
    acceptanceParty: {
      leader: { key: 'a1', name: '周文涛', position: '验收测评组长', phone: '136****8899', email: 'zhouwt@test.com' },
      contacts: [
        { key: 'a1c1', name: '孙丽', position: '测评工程师', phone: '137****9900', email: 'sunli@test.com' },
      ],
    },
    safetyParty: {
      leader: { key: 'sf1', name: '钱志刚', position: '安全测评负责人', phone: '135****1122', email: 'qanzg@safety.com' },
      contacts: [
        { key: 'sf1c1', name: '郑雪梅', position: '安全工程师', phone: '138****2233', email: 'zhengxm@safety.com' },
      ],
    },
    status: '已完善',
    lastUpdate: '2025-06-10',
  },
  {
    key: 'pr-2',
    code: 'PRJ-REL-2025-002',
    projectCode: 'XB2005-0062',
    projectName: '电子政务数据平台建设项目',
    ownerParty: {
      leader: { key: 'o2', name: '王建军', position: '信息中心副主任', phone: '137****3344', email: 'wangjj@xb.gov.cn' },
      contacts: [
        { key: 'o2c1', name: '吴静', position: '项目协调员', phone: '138****4455', email: 'wujing@xb.gov.cn' },
      ],
    },
    contractor: {
      leader: { key: 'c2', name: '张志强', position: '项目经理', phone: '139****5566', email: 'zhangzq@datatech.com' },
      contacts: [
        { key: 'c2c1', name: '刘玉梅', position: '技术负责人', phone: '135****6677', email: 'liuyumei@datatech.com' },
      ],
    },
    supervision: {
      leader: { key: 's2', name: '韦江腾', position: '总监理工程师', phone: '137****2345', email: 'liwh@jianli.com' },
      contacts: [],
    },
    acceptanceParty: {
      leader: { key: 'a2', name: '朱伟', position: '验收测评组长', phone: '136****7788', email: 'zhuw@test.com' },
      contacts: [],
    },
    safetyParty: {
      leader: undefined,
      contacts: [],
    },
    status: '待完善',
    lastUpdate: '2025-06-08',
  },
  {
    key: 'pr-3',
    code: 'PRJ-REL-2025-003',
    projectCode: 'XB2005-0089',
    projectName: '智慧政务云平台升级改造项目',
    ownerParty: {
      leader: { key: 'o3', name: '胡志强', position: '部门负责人', phone: '138****8811', email: 'huzq@xb.gov.cn' },
      contacts: [
        { key: 'o3c1', name: '何小敏', position: '业务协调员', phone: '137****9922', email: 'hexm@xb.gov.cn' },
      ],
    },
    contractor: {
      leader: { key: 'c3', name: '蒋明辉', position: '项目经理', phone: '139****1233', email: 'jiangmh@cloudtech.com' },
      contacts: [
        { key: 'c3c1', name: '邓云飞', position: '云架构师', phone: '135****3444', email: 'dengyf@cloudtech.com' },
        { key: 'c3c2', name: '傅雪梅', position: '运维负责人', phone: '136****5666', email: 'fuxm@cloudtech.com' },
      ],
    },
    supervision: {
      leader: { key: 's3', name: '黄志强', position: '总监代表', phone: '136****6789', email: 'huangzq@jianli.com' },
      contacts: [],
    },
    acceptanceParty: {
      leader: undefined,
      contacts: [],
    },
    safetyParty: {
      leader: { key: 'sf3', name: '韩志刚', position: '安全测评工程师', phone: '137****7890', email: 'hanzg@safety.com' },
      contacts: [],
    },
    status: '待完善',
    lastUpdate: '2025-06-05',
  },
  {
    key: 'pr-4',
    code: 'PRJ-REL-2025-004',
    projectCode: 'XB2005-0123',
    projectName: '政务数据治理试点项目',
    ownerParty: {
      leader: { key: 'o4', name: '魏晓峰', position: '信息中心主管', phone: '139****2020', email: 'weixf@xb.gov.cn' },
      contacts: [],
    },
    contractor: {
      leader: { key: 'c4', name: '朱明', position: '项目经理', phone: '135****3131', email: 'zhuming@datagov.com' },
      contacts: [
        { key: 'c4c1', name: '蔡晓红', position: '数据治理工程师', phone: '138****4242', email: 'caixh@datagov.com' },
      ],
    },
    supervision: {
      leader: { key: 's4', name: '滕海燕', position: '专业监理工程师', phone: '135****3456', email: 'zhouml@jianli.com' },
      contacts: [],
    },
    acceptanceParty: {
      leader: { key: 'a4', name: '廖文斌', position: '验收测评组长', phone: '136****5353', email: 'liaowb@test.com' },
      contacts: [],
    },
    safetyParty: {
      leader: undefined,
      contacts: [],
    },
    status: '待完善',
    lastUpdate: '2025-05-28',
  },
]

export default projectRelationsData
