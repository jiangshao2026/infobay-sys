
// ============================================================
// 信佰监理服务管理系统 - 数据逻辑验证脚本
// ============================================================
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src', 'data');
const TARGET_PROJECTS = ['XB2005-0037', 'XB2005-0062', 'XB2005-0089', 'XB2005-0123', 'XB2005-0156', 'XB2005-0189', 'XB2005-0234', 'XB2005-0267', 'XB2005-0301', 'XB2005-0345'];

// ============================================================
// 辅助函数：从文件中提取数组数据
// ============================================================
function extractObjects(filePath, arrayVarName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const dataList = [];
  
  // 查找数组开始位置
  const pattern = new RegExp(arrayVarName + '\\s*[:=]?\\s*\\[', 'm');
  const m = content.match(pattern);
  if (!m) return [];
  
  let idx = m.index + m[0].length;
  let depth = 1;
  let objStart = -1;
  let objDepth = 0;
  
  while (idx < content.length && depth > 0) {
    const ch = content[idx];
    
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) break;
    }
    else if (ch === '{') {
      if (objDepth === 0) objStart = idx;
      objDepth++;
    }
    else if (ch === '}') {
      objDepth--;
      if (objDepth === 0 && objStart >= 0) {
        const objText = content.substring(objStart, idx + 1);
        try {
          const obj = eval('(' + objText + ')');
          dataList.push(obj);
        } catch(e) {
          // 解析失败则用正则提取关键字段
          const obj = parseObjectByRegex(objText);
          if (Object.keys(obj).length > 0) dataList.push(obj);
        }
        objStart = -1;
      }
    }
    idx++;
  }
  
  return dataList;
}

function parseObjectByRegex(text) {
  const obj = {};
  const fields = ['key','code','name','status','approvalStatus','approver','type','scale',
                   'startDate','endDate','signDate','projectCode','manager','contractor',
                   'investment','progress','amount','title','version','author','createDate',
                   'reviewDate','description','location','issue','level','discoverDate',
                   'discoveryDate','deadline','handler','inspectionPerson','rectificationPlan',
                   'rectificationResult','reviewResult','riskLevel','rectification','reason',
                   'impact','applicant','applyDate','urgency','costImpact','scheduleImpact',
                   'approver','approveDate','phase','planStart','planEnd','actualStart','actualEnd',
                   'planProgress','actualProgress','deviationDays','taskName','assignee','priority',
                   'supervision','owner'];
  
  for (const f of fields) {
    const re = new RegExp(f + '\\s*:\\s*([\'"\u201C\u201D\u2018\u2019])(.*?)\\1', '');
    const m = text.match(re);
    if (m) obj[f] = m[2];
    else {
      const numRe = new RegExp(f + '\\s*:\\s*(-?\\d+(?:\\.\\d+)?)', '');
      const nm = text.match(numRe);
      if (nm) obj[f] = nm[1];
    }
  }
  return obj;
}

// 安全加载数据 - 先用正则逐行解析（更可靠）
function loadDataByRegex(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // 找到数组定义后，逐块提取对象
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
    else if (ch === ']') {
      if (depth === 0) break;
      depth--;
    }
    else if (ch === '{' && depth === 0) {
      if (!inObj) { objStart = i; inObj = true; }
    }
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

// ============================================================
// 主逻辑
// ============================================================
console.log('\n===== 信佰监理服务管理系统 - 数据验证报告 =====');
console.log('生成时间:', new Date().toLocaleString('zh-CN'));
console.log('');

// 1. 加载项目数据
console.log('--- [1] 加载 projects.ts ---');
const projects = loadDataByRegex(path.join(SRC_DIR, 'projects.ts'));
console.log('  共加载项目:', projects.length);
const projectMap = {};
projects.forEach(p => { projectMap[p.code] = p; });

// 2. 加载合同数据
console.log('--- [2] 加载 contracts.ts ---');
const contracts = loadDataByRegex(path.join(SRC_DIR, 'contracts.ts'));
console.log('  共加载合同:', contracts.length);
const contractMap = {};
contracts.forEach(c => { contractMap[c.projectCode] = c; });

// 3. 加载其他模块数据
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
    console.log('  ' + mod + '.ts: ' + data.length + ' 条记录');
  } else {
    console.log('  ' + mod + '.ts: 文件不存在');
  }
}
console.log('');

// 4. 数据逻辑验证 - 引用一致性
console.log('--- [4] 引用一致性验证 ---');
const allReferencedProjects = new Set();
for (const mod of MODULES) {
  if (moduleData[mod]) {
    moduleData[mod].forEach(item => {
      if (item.projectCode) allReferencedProjects.add(item.projectCode);
    });
  }
}
contracts.forEach(c => { if (c.projectCode) allReferencedProjects.add(c.projectCode); });

const validCodes = new Set(projects.map(p => p.code));
const danglingRefs = [];
for (const code of allReferencedProjects) {
  if (!validCodes.has(code)) danglingRefs.push(code);
}

console.log('  projects.ts 中有效项目编号:', validCodes.size, '个');
console.log('  各模块引用的项目编号:', allReferencedProjects.size, '个');
console.log('  悬空引用:', danglingRefs.length, '个');
danglingRefs.forEach(r => console.log('    !', r, '- 未在 projects.ts 中找到'));
console.log('');

// 检查每个目标项目是否存在
console.log('  目标项目存在性检查:');
const missingProjects = [];
for (const pid of TARGET_PROJECTS) {
  const exists = validCodes.has(pid);
  const hasContract = contractMap[pid] !== undefined;
  console.log('    ' + pid + ' - 项目:' + (exists ? 'OK' : '缺失') + ', 合同:' + (hasContract ? 'OK' : '缺失'));
  if (!exists) missingProjects.push(pid);
}
console.log('');

// 5. 状态一致性验证
console.log('--- [5] 状态一致性与时间线验证 ---');
const issues = [];

for (const pid of TARGET_PROJECTS) {
  const p = projectMap[pid];
  const c = contractMap[pid];
  if (!p || !c) continue;
  
  const pStatus = p.status;
  const cStatus = c.status;
  const cProgress = parseInt(c.progress) || 0;
  
  // 状态一致性
  if (pStatus === '进行中' && cStatus !== '执行中') {
    issues.push('[' + pid + '] 项目状态="进行中" 但合同状态="' + cStatus + '"（应为"执行中"）');
  }
  if (pStatus === '待审批' && cStatus !== '待审批') {
    issues.push('[' + pid + '] 项目状态="待审批" 但合同状态="' + cStatus + '"（应为"待审批"）');
  }
  if (pStatus === '即将完工' && cProgress < 80) {
    issues.push('[' + pid + '] 项目状态="即将完工" 但合同进度仅 ' + cProgress + '%（应≥80%）');
  }
  if (pStatus === '启动阶段' && cStatus !== '待审批' && cStatus !== '执行中') {
    issues.push('[' + pid + '] 项目状态="启动阶段" 但合同状态="' + cStatus + '"（不合理）');
  }
  
  // 时间线 - 项目开始日期应 >= 合同签订日期
  const pStart = new Date(p.startDate);
  const cSign = new Date(c.signDate);
  if (!isNaN(pStart.getTime()) && !isNaN(cSign.getTime()) && pStart < cSign) {
    issues.push('[' + pid + '] 项目开始日期(' + p.startDate + ') 早于合同签订日期(' + c.signDate + ')');
  }
}

// 质量问题日期验证
if (moduleData.quality) {
  for (const q of moduleData.quality) {
    const p = projectMap[q.projectCode];
    if (!p || !p.startDate) continue;
    const discDate = new Date(q.discoverDate || q.discoveryDate || q.date || '');
    const pStart = new Date(p.startDate);
    if (!isNaN(discDate.getTime()) && !isNaN(pStart.getTime()) && discDate < pStart) {
      issues.push('[' + q.projectCode + '] 质量问题日期(' + (q.discoverDate || q.discoveryDate || q.date) + ') 早于项目开始日期(' + p.startDate + ')');
    }
  }
}

// 安全问题日期验证
if (moduleData.safety) {
  for (const s of moduleData.safety) {
    const p = projectMap[s.projectCode];
    if (!p || !p.startDate) continue;
    const discDate = new Date(s.discoverDate || s.discoveryDate || s.date || '');
    const pStart = new Date(p.startDate);
    if (!isNaN(discDate.getTime()) && !isNaN(pStart.getTime()) && discDate < pStart) {
      issues.push('[' + s.projectCode + '] 安全问题日期(' + (s.discoverDate || s.discoveryDate) + ') 早于项目开始日期(' + p.startDate + ')');
    }
  }
}

// 进度计划开始日期一致性
if (moduleData.schedule) {
  for (const s of moduleData.schedule) {
    const p = projectMap[s.projectCode];
    if (!p || !p.startDate) continue;
    const phase = s.phase || '';
    if (phase === '项目启动' || phase.indexOf('启动') >= 0) {
      const planStart = new Date(s.planStart);
      const pStart = new Date(p.startDate);
      if (!isNaN(planStart.getTime()) && !isNaN(pStart.getTime()) && 
          planStart.getTime() !== pStart.getTime()) {
        issues.push('[' + s.projectCode + '] 进度计划"' + phase + '"开始日期(' + s.planStart + ') 与项目开始日期(' + p.startDate + ') 不一致');
      }
    }
  }
}

console.log('  发现一致性问题: ' + issues.length + ' 个');
issues.forEach(iss => console.log('    ! ' + iss));
console.log('');

// 6. 监理规划/实施细则覆盖验证
console.log('--- [6] 监理规划/实施细则覆盖验证 ---');
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
  
  console.log('  [' + pid + '] 状态=' + p.status + ', 规划=' + (hasPlan ? '有' : '无') + ', 细则=' + (hasDetail ? '有' : '无') + ', 总计划文档=' + plansForProject.length + '条');
}

console.log('  文档覆盖问题: ' + docIssues.length + ' 个');
docIssues.forEach(iss => console.log('    ! ' + iss));
console.log('');

// 7. 生成汇总表格
console.log('=== 项目数据汇总表 ===');
console.log('');
// 用控制台表格格式
let header = '项目编号\t项目名称\t项目状态\t合同状态\t合同进度\t规划\t质量\t安全\t变更\t进度\t分配\t文档\t验收\t付款\t合同管理';
console.log(header);
console.log('-'.repeat(120));

for (const pid of TARGET_PROJECTS) {
  const p = projectMap[pid] || {};
  const c = contractMap[pid] || {};
  let row = pid + '\t';
  const name = (p.name || '').substring(0, 12);
  row += name + '\t';
  row += (p.status || '-') + '\t';
  row += (c.status || '-') + '\t';
  row += (c.progress || '0') + '%\t';
  for (const mod of MODULES) {
    row += (moduleCounts[mod] && moduleCounts[mod][pid] ? moduleCounts[mod][pid] : 0) + '\t';
  }
  console.log(row);
}
console.log('');

// 8. 最终问题清单
console.log('=== 验证问题清单 ===');
console.log('');
console.log('◆ 数据完整性:');
console.log('  - 悬空引用（在引用中出现但 projects.ts 无定义）:', danglingRefs.length, '个');
danglingRefs.forEach(r => console.log('    *', r));
console.log('  - 目标项目缺失（10个指定项目中未找到）:', missingProjects.length, '个');
missingProjects.forEach(r => console.log('    *', r));
console.log('');

console.log('◆ 状态/时间线一致性:', issues.length, '个问题');
issues.forEach(iss => console.log('  *', iss));
console.log('');

console.log('◆ 文档覆盖:', docIssues.length, '个问题');
docIssues.forEach(iss => console.log('  *', iss));
console.log('');

console.log('===== 数据验证结束 =====');
console.log('');
