const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src', 'data');
const TARGET_PROJECTS = ['XB2005-0037', 'XB2005-0062', 'XB2005-0089', 'XB2005-0123', 'XB2005-0156', 'XB2005-0189', 'XB2005-0234', 'XB2005-0267', 'XB2005-0301', 'XB2005-0345'];

function parseObjectByRegex(text) {
  const obj = {};
  const fields = ['key','code','name','status','approvalStatus','approver','type','scale',
                   'startDate','endDate','signDate','projectCode','manager','contractor',
                   'investment','progress','amount','title','version','author','createDate',
                   'reviewDate','description','location','issue','level','discoverDate',
                   'discoveryDate','deadline','handler','inspectionPerson','rectificationPlan',
                   'rectificationResult','reviewResult','riskLevel','rectification','reason',
                   'impact','applicant','applyDate','urgency','costImpact','scheduleImpact',
                   'approveDate','phase','planStart','planEnd','actualStart','actualEnd',
                   'planProgress','actualProgress','deviationDays','taskName','assignee','priority',
                   'supervision','owner'];
  for (const f of fields) {
    const re = new RegExp(f + '\\\\s*:\\\\s*([\\'"\\u201C\\u201D])([^\\'"\\u201C\\u201D]*)\\1', '');
    const m = text.match(re);
    if (m) obj[f] = m[2];
    else {
      const numRe = new RegExp(f + '\\\\s*:\\\\s*(-?\\\\d+(?:\\\\.\\\\d+)?)', '');
      const nm = text.match(numRe);
      if (nm) obj[f] = nm[1];
    }
  }
  return obj;
}

function loadDataByRegex(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const startIdx = content.indexOf('[', content.indexOf('='));
  if (startIdx < 0) return [];
  const objects = [];
  let i = startIdx + 1;
  let depth = 0;
  let inObj = false;
  let objStart = -1;
  while (i < content.length) {
    const ch = content[i];
    if (ch === '[') { if (!inObj) depth++; }
    else if (ch === ']') { if (depth === 0) break; depth--; }
    else if (ch === '{' && depth === 0) { if (!inObj) { objStart = i; inObj = true; } }
    else if (ch === '}' && depth === 0) {
      if (inObj) {
        const objText = content.substring(objStart, i + 1);
        const obj = parseObjectByRegex(objText);
        if (Object.keys(obj).length > 0) objects.push(obj);
        inObj = false;
      }
    }
    i++;
  }
  return objects;
}

console.log('\\n===== 信佰监理服务管理系统 - 数据验证报告 =====');
console.log('生成时间:', new Date().toLocaleString('zh-CN'));
console.log('');

const projects = loadDataByRegex(path.join(SRC_DIR, 'projects.ts'));
console.log('--- [1] projects.ts: 加载', projects.length, '个项目 ---');
const projectMap = {};
projects.forEach(p => { projectMap[p.code] = p; });

const contracts = loadDataByRegex(path.join(SRC_DIR, 'contracts.ts'));
console.log('--- [2] contracts.ts: 加载', contracts.length, '个合同 ---');
const contractMap = {};
contracts.forEach(c => { contractMap[c.projectCode] = c; });

const MODULES = ['plans', 'quality', 'safety', 'changes', 'schedule', 'allocations', 'infoDocuments', 'acceptance', 'payments', 'contractMgmt'];
const moduleData = {};
const moduleCounts = {};
console.log('--- [3] 加载各模块数据 ---');
for (const mod of MODULES) {
  const modPath = path.join(SRC_DIR, mod + '.ts');
  if (fs.existsSync(modPath)) {
    const data = loadDataByRegex(modPath);
    moduleData[mod] = data;
    const counts = {};
    data.forEach(item => {
      const pid = item.projectCode;
      if (pid) counts[pid] = (counts[pid] || 0) + 1;
    });
    moduleCounts[mod] = counts;
    console.log('  ' + mod + '.ts: ' + data.length + ' 条');
  } else {
    console.log('  ' + mod + '.ts: 文件不存在');
  }
}
console.log('');

console.log('--- [4] 引用一致性验证 ---');
const allReferencedProjects = new Set();
for (const mod of MODULES) {
  if (moduleData[mod]) moduleData[mod].forEach(item => { if (item.projectCode) allReferencedProjects.add(item.projectCode); });
}
contracts.forEach(c => { if (c.projectCode) allReferencedProjects.add(c.projectCode); });
const validCodes = new Set(projects.map(p => p.code));
const danglingRefs = [];
for (const code of allReferencedProjects) {
  if (!validCodes.has(code)) danglingRefs.push(code);
}
console.log('  projects.ts 中有效项目编号:', validCodes.size);
console.log('  各模块引用项目编号:', allReferencedProjects.size);
console.log('  悬空引用:', danglingRefs.length, '个');
danglingRefs.forEach(r => console.log('    !', r));
console.log('');
console.log('  目标项目存在性检查:');
const missingProjects = [];
for (const pid of TARGET_PROJECTS) {
  const exists = validCodes.has(pid);
  const hasContract = contractMap[pid] !== undefined;
  console.log('    ' + pid + ' - 项目:' + (exists ? 'OK' : '缺失') + ', 合同:' + (hasContract ? 'OK' : '缺失'));
  if (!exists) missingProjects.push(pid);
}
console.log('');

console.log('--- [5] 状态一致性与时间线验证 ---');
const issues = [];
for (const pid of TARGET_PROJECTS) {
  const p = projectMap[pid];
  const c = contractMap[pid];
  if (!p || !c) continue;
  const pStatus = p.status;
  const cStatus = c.status;
  const cProgress = parseInt(c.progress) || 0;
  if (pStatus === '进行中' && cStatus !== '执行中') issues.push('[' + pid + '] 项目="进行中" 合同="' + cStatus + '"(应为执行中)');
  if (pStatus === '待审批' && cStatus !== '待审批') issues.push('[' + pid + '] 项目="待审批" 合同="' + cStatus + '"(应为待审批)');
  if (pStatus === '即将完工' && cProgress < 80) issues.push('[' + pid + '] 项目="即将完工" 合同进度仅' + cProgress + '%(应80%)');
  if (pStatus === '启动阶段' && cStatus !== '待审批' && cStatus !== '执行中') issues.push('[' + pid + '] 项目="启动阶段" 合同="' + cStatus + '"(不合理)');
  const pStart = new Date(p.startDate);
  const cSign = new Date(c.signDate);
  if (!isNaN(pStart.getTime()) && !isNaN(cSign.getTime()) && pStart < cSign) issues.push('[' + pid + '] 项目开始(' + p.startDate + ') 早于合同签订(' + c.signDate + ')');
}
if (moduleData.quality) {
  for (const q of moduleData.quality) {
    const p = projectMap[q.projectCode];
    if (!p || !p.startDate) continue;
    const d = new Date(q.discoverDate || q.discoveryDate || q.date || '');
    const ps = new Date(p.startDate);
    if (!isNaN(d.getTime()) && !isNaN(ps.getTime()) && d < ps) issues.push('[' + q.projectCode + '] 质量问题(' + (q.discoverDate||q.discoveryDate) + ') 早于项目开始(' + p.startDate + ')');
  }
}
if (moduleData.safety) {
  for (const s of moduleData.safety) {
    const p = projectMap[s.projectCode];
    if (!p || !p.startDate) continue;
    const d = new Date(s.discoverDate || s.discoveryDate || '');
    const ps = new Date(p.startDate);
    if (!isNaN(d.getTime()) && !isNaN(ps.getTime()) && d < ps) issues.push('[' + s.projectCode + '] 安全问题(' + (s.discoverDate||s.discoveryDate) + ') 早于项目开始(' + p.startDate + ')');
  }
}
if (moduleData.schedule) {
  for (const s of moduleData.schedule) {
    const p = projectMap[s.projectCode];
    if (!p || !p.startDate) continue;
    const phase = s.phase || '';
    if (phase.indexOf('启动') >= 0) {
      const pl = new Date(s.planStart);
      const ps = new Date(p.startDate);
      if (!isNaN(pl.getTime()) && !isNaN(ps.getTime()) && pl.getTime() !== ps.getTime()) issues.push('[' + s.projectCode + '] 进度计划"' + phase + '"开始(' + s.planStart + ') 与项目开始(' + p.startDate + ') 不一致');
    }
  }
}
console.log('  一致性问题:', issues.length, '个');
issues.forEach(iss => console.log('    ! ' + iss));
console.log('');

console.log('--- [6] 监理规划/实施细则覆盖 ---');
const docIssues = [];
for (const pid of TARGET_PROJECTS) {
  const p = projectMap[pid];
  if (!p) continue;
  const plansForProject = (moduleData.plans || []).filter(pl => pl.projectCode === pid);
  const hasPlan = plansForProject.some(pl => (pl.type || '').indexOf('规划') >= 0);
  const hasDetail = plansForProject.some(pl => (pl.type || '').indexOf('细则') >= 0);
  if (p.status === '进行中') {
    if (!hasPlan) docIssues.push('[' + pid + '] 进行中项目缺少监理规划');
    if (!hasDetail) docIssues.push('[' + pid + '] 进行中项目缺少监理实施细则');
  }
  if (p.status === '启动阶段') {
    if (!hasPlan && plansForProject.length === 0) docIssues.push('[' + pid + '] 启动阶段项目无监理规划编制');
  }
  console.log('  [' + pid + '] 状态=' + p.status + ', 规划=' + (hasPlan ? '有' : '无') + ', 细则=' + (hasDetail ? '有' : '无') + ', 计划文档=' + plansForProject.length);
}
console.log('  文档覆盖问题:', docIssues.length, '个');
docIssues.forEach(iss => console.log('    ! ' + iss));
console.log('');

console.log('=== 项目数据汇总表 ===');
console.log('');
console.log('项目编号|项目名称|项目状态|合同状态|进度%|规划|质量|安全|变更|进度|分配|文档|验收|付款|合同管理');
for (const pid of TARGET_PROJECTS) {
  const p = projectMap[pid] || {};
  const c = contractMap[pid] || {};
  let row = pid + '|' + (p.name || '').substring(0,18) + '|' + (p.status || '-') + '|' + (c.status || '-') + '|' + (c.progress || '0');
  for (const mod of MODULES) row += '|' + (moduleCounts[mod] && moduleCounts[mod][pid] ? moduleCounts[mod][pid] : 0);
  console.log(row);
}
console.log('');

console.log('=== 最终问题清单 ===');
console.log(' 数据完整性:');
console.log('  - 悬空引用:', danglingRefs.length, '个', danglingRefs.join(', '));
console.log('  - 目标项目缺失:', missingProjects.length, '个', missingProjects.join(', '));
console.log(' 状态/时间线一致性:', issues.length, '个');
issues.forEach(iss => console.log('  *', iss));
console.log(' 文档覆盖:', docIssues.length, '个');
docIssues.forEach(iss => console.log('  *', iss));
console.log('');
console.log('===== 数据验证结束 =====');
