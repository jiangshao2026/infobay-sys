const fs = require('fs');

function detectEol(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function replaceAtLine(filePath, lineMatcher, replacementBuilder) {
  let content = fs.readFileSync(filePath, 'utf8');
  const eol = detectEol(content);
  const lines = content.split(/\r?\n/);
  let replaced = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lineMatcher(lines[i], i)) {
      const result = replacementBuilder(lines, i, eol);
      if (result.newLines !== undefined) {
        // Replace a range of lines with newLines
        lines.splice(i, result.count, ...result.newLines);
        i += result.newLines.length - 1;
      } else if (result.newLine !== undefined) {
        lines[i] = result.newLine;
      }
      replaced++;
    }
  }
  fs.writeFileSync(filePath, lines.join(eol));
  console.log(`  replaced ${replaced} time(s) - ${filePath}`);
}

// ========= 1. startupPage.tsx =========
// 把包含 `name="attachments" label="实施方案附件"` 的整行替换
// 这里使用中文的行匹配 - 因为我们看到 JSON.stringify 中的 "实施方案附件"
// 实际上是正确的 UTF-8 中文
const startupTarget1 = 'name="attachments" label="实施方案附件"';
const startupTarget2 = 'name="attachments" label="实施方案附件（重新上传将替换原附件）"';

replaceAtLine(
  'd:/Trae_space/信佰监理服务管理系统/src/pages/projectManagement/startupPage.tsx',
  (line) => line.includes(startupTarget1),
  (lines, i, eol) => {
    return {
      newLines: [
        '          <Form.Item',
        '            name="attachments"',
        '            label="实施方案附件"',
        '            getValueProps={(fileList) => ({ fileList })}',
        '          >',
      ],
      count: 1,
    };
  }
);

replaceAtLine(
  'd:/Trae_space/信佰监理服务管理系统/src/pages/projectManagement/startupPage.tsx',
  (line) => line.includes(startupTarget2),
  (lines, i, eol) => {
    return {
      newLines: [
        '          <Form.Item',
        '            name="attachments"',
        '            label="实施方案附件（重新上传将替换原附件）"',
        '            getValueProps={(fileList) => ({ fileList })}',
        '          >',
      ],
      count: 1,
    };
  }
);

// ========= 2. plan.tsx =========
// 第 458 行附近：<Form.Item label="文档附件"> (没有 name)
// 第 568 行附近：<Form.Item label="文档附件"> (没有 name)
// 这两处均是单行 <Form.Item label="文档附件"> 需要替换为多行带 name + getValueProps
// 为了区分，我们给它们不同的 name，如 "addAttachments" 和 "editAttachments"

// 第一次出现（第 458 行附近）
let planCounter = 0;
replaceAtLine(
  'd:/Trae_space/信佰监理服务管理系统/src/pages/informationManagement/plan.tsx',
  (line) => {
    const match = line.trim() === '<Form.Item label="文档附件">';
    return match;
  },
  (lines, i, eol) => {
    planCounter++;
    const name = planCounter === 1 ? 'addAttachments' : 'editAttachments';
    return {
      newLines: [
        '          <Form.Item',
        `            name="${name}"`,
        '            label="文档附件"',
        '            getValueProps={(fileList) => ({ fileList })}',
        '          >',
      ],
      count: 1,
    };
  }
);

// ========= 3. teamPage.tsx =========
// 第 357 行：bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
// 第 466 行：bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}

replaceAtLine(
  'd:/Trae_space/信佰监理服务管理系统/src/pages/organizationCoordination/teamPage.tsx',
  (line) => line.trim() === "bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}",
  (lines, i, eol) => {
    return {
      newLine: "        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}",
    };
  }
);

console.log('ALL DONE');
