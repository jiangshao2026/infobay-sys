const fs = require('fs');

const files = [
  'projects.ts',
  'contracts.ts',
  'quality.ts',
  'safety.ts',
  'changes.ts',
  'acceptance.ts',
  'plans.ts',
  'rules.ts',
  'knowledge.ts',
  'payments.ts',
];

console.log('=== 各数据源的 key 值与数量 ===');
files.forEach(file => {
  const content = fs.readFileSync('src/data/' + file, 'utf8');
  const keyPattern = /key:\s*(['"]?)(\w+)\1/g;
  let match;
  const keys = [];
  while ((match = keyPattern.exec(content)) !== null) {
    keys.push(match[2]);
  }
  console.log(file.padEnd(18) + ' 数量: ' + String(keys.length).padStart(3) + '  keys: [' + keys.join(', ') + ']');
});

console.log('');
console.log('=== 检查验收相关 ===');
const accContent = fs.readFileSync('src/data/acceptance.ts', 'utf8');
const accKeyPattern = /key:\s*(['"]?)(\w+)\1/g;
let accMatch;
const accKeys = [];
while ((accMatch = accKeyPattern.exec(accContent)) !== null) {
  accKeys.push(accMatch[2]);
}
console.log('acceptance.ts 中所有 key 值: [' + accKeys.join(', ') + '] 共 ' + accKeys.length + ' 个');

console.log('');
console.log('=== 检查计划文档与规则 ===');
const planContent = fs.readFileSync('src/data/plans.ts', 'utf8');
const ruleContent = fs.readFileSync('src/data/rules.ts', 'utf8');
let pm;
const planKeys = [];
const planKeyPat = /key:\s*(['"]?)(\w+)\1/g;
while ((pm = planKeyPat.exec(planContent)) !== null) planKeys.push(pm[2]);
console.log('plans.ts keys: [' + planKeys.join(', ') + '] 共 ' + planKeys.length);

let rm;
const ruleKeys = [];
while ((rm = planKeyPat.exec(ruleContent)) !== null) ruleKeys.push(rm[2]);
console.log('rules.ts keys: [' + ruleKeys.join(', ') + '] 共 ' + ruleKeys.length);

console.log('');
console.log('=== 知识库 ===');
const knowContent = fs.readFileSync('src/data/knowledge.ts', 'utf8');
let km;
const knowKeys = [];
while ((km = planKeyPat.exec(knowContent)) !== null) knowKeys.push(km[2]);
console.log('knowledge.ts keys: [' + knowKeys.join(', ') + '] 共 ' + knowKeys.length);
