const fs = require('fs');

function detectEol(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function replaceByKeyword(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  const eol = detectEol(content);
  const lines = content.split(/\r?\n/);
  let totalReplaced = 0;

  for (let r = 0; r < replacements.length; r++) {
    const { keyword, buildNew } = replacements[r];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(keyword)) {
        const newLines = buildNew(lines[i], eol);
        const parts = newLines.split(eol);
        lines.splice(i, 1, ...parts);
        i += parts.length - 1;
        totalReplaced++;
        break; // one match per replacement rule
      }
    }
  }
  fs.writeFileSync(filePath, lines.join(eol));
  console.log(`  replaced ${totalReplaced} time(s) - ${filePath}`);
}

// ========= 1. startupPage.tsx =========
// Need to replace these two lines with multi-line form.item
// Line like: `          <Form.Item name="attachments" label="实施方案附件">`
// Line like: `          <Form.Item name="attachments" label="实施方案附件（重新上传将替换原附件）">`

console.log('Fixing startupPage.tsx...');
replaceByKeyword(
  'd:/Trae_space/信佰监理服务管理系统/src/pages/projectManagement/startupPage.tsx',
  [
    {
      // Match the first attachments Form.Item (without "重新上传")
      keyword: 'name="attachments" label="',
      buildNew: (line, eol) => {
        // Determine if this is the "重新上传" variant (the second form)
        if (line.includes('重新上传') || line.includes('实施方案附件（')) {
          return [
            '          <Form.Item',
            '            name="attachments"',
            '            label="实施方案附件（重新上传将替换原附件）"',
            '            getValueProps={(fileList) => ({ fileList })}',
            '          >',
          ].join(eol);
        }
        // First form item (simpler label)
        return [
          '          <Form.Item',
          '            name="attachments"',
          '            label="实施方案附件"',
          '            getValueProps={(fileList) => ({ fileList })}',
          '          >',
        ].join(eol);
      },
    },
  ]
);

// Do a second pass to fix the SECOND occurrence
// Wait, the "first pass" uses break after first match - we need to do all matches with different logic
console.log('Fixing startupPage.tsx second pass...');

// Alternative: do both in one run
let content = fs.readFileSync('d:/Trae_space/信佰监理服务管理系统/src/pages/projectManagement/startupPage.tsx', 'utf8');
const eol1 = content.includes('\r\n') ? '\r\n' : '\n';
let lines = content.split(/\r?\n/);
let countStart = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('name="attachments"') && lines[i].includes('label="')) {
    if (lines[i].includes('重新上传')) {
      lines.splice(i, 1,
        '          <Form.Item',
        '            name="attachments"',
        '            label="实施方案附件（重新上传将替换原附件）"',
        '            getValueProps={(fileList) => ({ fileList })}',
        '          >'
      );
      i += 4;
      countStart++;
    } else {
      lines.splice(i, 1,
        '          <Form.Item',
        '            name="attachments"',
        '            label="实施方案附件"',
        '            getValueProps={(fileList) => ({ fileList })}',
        '          >'
      );
      i += 4;
      countStart++;
    }
  }
}
fs.writeFileSync('d:/Trae_space/信佰监理服务管理系统/src/pages/projectManagement/startupPage.tsx', lines.join(eol1));
console.log(`  startupPage.tsx fixed ${countStart} lines`);

// ========= 2. plan.tsx =========
// The two lines: <Form.Item label="文档附件">
// They should be given distinct names based on context.
// But earlier _fix_script_02.cjs may have already processed plan.tsx with some partial changes.
// Let's look first.

console.log('Fixing plan.tsx...');
let planContent = fs.readFileSync('d:/Trae_space/信佰监理服务管理系统/src/pages/informationManagement/plan.tsx', 'utf8');
const planEol = planContent.includes('\r\n') ? '\r\n' : '\n';
let planLines = planContent.split(/\r?\n/);
let planReplaced = 0;
// Find the two <Form.Item label="文档附件"> lines
for (let i = 0; i < planLines.length; i++) {
  // If line already has name=..., we may have modified it in a previous run; skip
  if (planLines[i].includes('name="addAttachments"') || planLines[i].includes('name="editAttachments"')) {
    continue;
  }
  if (planLines[i].includes('<Form.Item') && planLines[i].includes('文档附件') && !planLines[i].includes('name=')) {
    const name = planReplaced === 0 ? 'addAttachments' : 'editAttachments';
    planLines.splice(i, 1,
      '          <Form.Item',
      `            name="${name}"`,
      '            label="文档附件"',
      '            getValueProps={(fileList) => ({ fileList })}',
      '          >'
    );
    i += 4;
    planReplaced++;
  }
}
fs.writeFileSync('d:/Trae_space/信佰监理服务管理系统/src/pages/informationManagement/plan.tsx', planLines.join(planEol));
console.log(`  plan.tsx fixed ${planReplaced} lines`);

// ========= 3. teamPage.tsx =========
console.log('Fixing teamPage.tsx...');
let teamContent = fs.readFileSync('d:/Trae_space/信佰监理服务管理系统/src/pages/organizationCoordination/teamPage.tsx', 'utf8');
const teamEol = teamContent.includes('\r\n') ? '\r\n' : '\n';
let teamLines = teamContent.split(/\r?\n/);
let teamReplaced = 0;
for (let i = 0; i < teamLines.length; i++) {
  if (teamLines[i].trim() === "bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}") {
    teamLines[i] = "        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}";
    teamReplaced++;
  }
}
fs.writeFileSync('d:/Trae_space/信佰监理服务管理系统/src/pages/organizationCoordination/teamPage.tsx', teamLines.join(teamEol));
console.log(`  teamPage.tsx fixed ${teamReplaced} lines`);

console.log('ALL DONE');
