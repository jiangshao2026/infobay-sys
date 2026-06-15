const fs = require('fs');
const path = 'd:/Trae_space/信佰监理服务管理系统/src/pages/projectManagement/startupPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const EOL = content.includes('\r\n') ? '\r\n' : '\n';

// 精确到行 - 1：单行替换
const targetLine = content;

const line1_old = '          <Form.Item name="attachments" label="实施方案附件">';
const line1_new = '          <Form.Item\n            name="attachments"\n            label="实施方案附件"\n            getValueProps={(fileList) => ({ fileList })}\n          >';

const line2_old = '          <Form.Item name="attachments" label="实施方案附件（重新上传将替换原附件）">';
const line2_new = '          <Form.Item\n            name="attachments"\n            label="实施方案附件（重新上传将替换原附件）"\n            getValueProps={(fileList) => ({ fileList })}\n          >';

if (content.includes(line1_old)) {
  content = content.split(line1_old).join(line1_new);
  console.log('OK startup fix 1');
} else {
  console.log('WARN startup fix 1 NOT FOUND');
}

if (content.includes(line2_old)) {
  content = content.split(line2_old).join(line2_new);
  console.log('OK startup fix 2');
} else {
  console.log('WARN startup fix 2 NOT FOUND');
}

fs.writeFileSync(path, content);
console.log('DONE startupPage.tsx');
