const fs = require('fs');
const path = 'd:/Trae_space/信佰监理服务管理系统/src/pages/projectManagement/startupPage.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);
const eol = content.includes('\r\n') ? '\r\n' : '\n';

// Count occurrences of 'label="实施方案附件"'
let count = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('label="实施方案附件"')) {
    count++;
    console.log('Line', i + 1, ':', lines[i].trim());
  }
}
console.log('Total occurrences:', count);

// Change the second occurrence (the edit modal one) to include longer text
// Both of the two "attachments" lines should be at positions ~606 and ~694
// We need to find the second one by checking it's in "edit" section.
// Strategy: the edit form contains "maxCount={10}" right after without extra Upload props.
// The add form has more lines like iconRender and itemRender which the edit doesn't.
// Simpler approach: just count occurrences - 2nd "attachments" label is the edit one.

let occurIndex = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('label="实施方案附件"') && !lines[i].includes('重新上传')) {
    occurIndex++;
    if (occurIndex === 2) {
      lines[i] = lines[i].replace('label="实施方案附件"', 'label="实施方案附件（重新上传将替换原附件）"');
      console.log('Changed line', i + 1, 'to:', lines[i].trim());
      break;
    }
  }
}

fs.writeFileSync(path, lines.join(eol));
console.log('Done');
