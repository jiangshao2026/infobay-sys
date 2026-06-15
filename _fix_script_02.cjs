const fs = require('fs');

function replaceAllInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  replacements.forEach(({ oldStr, newStr }, i) => {
    // 标准化 - 用文件实际的 EOL
    const oldNorm = oldStr.split('\n').join(eol);
    if (content.includes(oldNorm)) {
      content = content.split(oldNorm).join(newStr.split('\n').join(eol));
      console.log(`  OK - #${i + 1}`);
    } else {
      console.log(`  WARN - #${i + 1} not found`);
    }
  });
  fs.writeFileSync(filePath, content);
  console.log(`DONE ${filePath}`);
}

// ===== 1. startupPage.tsx =====
replaceAllInFile(
  'd:/Trae_space/信佰监理服务管理系统/src/pages/projectManagement/startupPage.tsx',
  [
    {
      oldStr: '          <Form.Item name="attachments" label="实施方案附件">\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              maxCount={10}\n              iconRender={() => <UploadOutlined />}',
      newStr: '          <Form.Item\n            name="attachments"\n            label="实施方案附件"\n            getValueProps={(fileList) => ({ fileList })}\n          >\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              maxCount={10}\n              iconRender={() => <UploadOutlined />}',
    },
    {
      oldStr: '          <Form.Item name="attachments" label="实施方案附件（重新上传将替换原附件）">\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              maxCount={10}\n            >\n              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>\n            </Upload>\n          </Form.Item>',
      newStr: '          <Form.Item\n            name="attachments"\n            label="实施方案附件（重新上传将替换原附件）"\n            getValueProps={(fileList) => ({ fileList })}\n          >\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              maxCount={10}\n            >\n              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>\n            </Upload>\n          </Form.Item>',
    },
  ]
);

// ===== 2. plan.tsx =====
replaceAllInFile(
  'd:/Trae_space/信佰监理服务管理系统/src/pages/informationManagement/plan.tsx',
  [
    {
      oldStr: "          <Form.Item label=\"文档附件\">\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              fileList={addFileList}\n              onChange={info => setAddFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}\n            >\n              <Button icon={<UploadOutlined />}>选择文件</Button>\n            </Upload>\n          </Form.Item>",
      newStr: "          <Form.Item\n            name=\"addAttachments\"\n            label=\"文档附件\"\n            getValueProps={(fileList) => ({ fileList })}\n          >\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              fileList={addFileList}\n              onChange={info => setAddFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}\n            >\n              <Button icon={<UploadOutlined />}>选择文件</Button>\n            </Upload>\n          </Form.Item>",
    },
    {
      oldStr: "          <Form.Item label=\"文档附件\">\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              fileList={editFileList}\n              onChange={info => setEditFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}\n            >\n              <Button icon={<UploadOutlined />}>选择文件</Button>\n            </Upload>\n          </Form.Item>",
      newStr: "          <Form.Item\n            name=\"editAttachments\"\n            label=\"文档附件\"\n            getValueProps={(fileList) => ({ fileList })}\n          >\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              fileList={editFileList}\n              onChange={info => setEditFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}\n            >\n              <Button icon={<UploadOutlined />}>选择文件</Button>\n            </Upload>\n          </Form.Item>",
    },
  ]
);

// ===== 3. teamPage.tsx =====
replaceAllInFile(
  'd:/Trae_space/信佰监理服务管理系统/src/pages/organizationCoordination/teamPage.tsx',
  [
    {
      oldStr: "        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}\n      >\n        {currentItem and (",
      newStr: "        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}\n      >\n        {currentItem and (",
    },
    {
      oldStr: "        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}\n      >\n        <Form form={partyEditForm} layout=\"vertical\">",
      newStr: "        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}\n      >\n        <Form form={partyEditForm} layout=\"vertical\">",
    },
  ]
);

console.log('ALL DONE');
