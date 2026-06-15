const fs = require('fs');

const startupReplacements = [
  {
    old: `          <Form.Item name="attachments" label="实施方案附件">
            <Upload
              multiple
              beforeUpload={() => false}
              maxCount={10}
              iconRender={() => <UploadOutlined />}`,
    new: `          <Form.Item
            name="attachments"
            label="实施方案附件"
            getValueProps={(fileList) => ({ fileList })}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              maxCount={10}
              iconRender={() => <UploadOutlined />}`,
  },
  {
    old: `          <Form.Item name="attachments" label="实施方案附件（重新上传将替换原附件）">
            <Upload
              multiple
              beforeUpload={() => false}
              maxCount={10}
            >
              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>
            </Upload>
          </Form.Item>`,
    new: `          <Form.Item
            name="attachments"
            label="实施方案附件（重新上传将替换原附件）"
            getValueProps={(fileList) => ({ fileList })}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              maxCount={10}
            >
              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>
            </Upload>
          </Form.Item>`,
  },
];

const planReplacements = [
  {
    old: `          <Form.Item label="文档附件">
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={addFileList}
              onChange={info => setAddFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>`,
    new: `          <Form.Item
            name="addAttachments"
            label="文档附件"
            getValueProps={(fileList) => ({ fileList })}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={addFileList}
              onChange={info => setAddFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>`,
  },
  {
    old: `          <Form.Item label="文档附件">
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={editFileList}
              onChange={info => setEditFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>`,
    new: `          <Form.Item
            name="editAttachments"
            label="文档附件"
            getValueProps={(fileList) => ({ fileList })}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={editFileList}
              onChange={info => setEditFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>`,
  },
];

const teamReplacements = [
  {
    old: `        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        {currentItem and (`,
    new: `        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {currentItem and (`,
  },
  {
    old: `        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <Form form={partyEditForm} layout="vertical">`,
    new: `        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={partyEditForm} layout="vertical">`,
  },
];

const files = {
  'src/pages/projectManagement/startupPage.tsx': startupReplacements,
  'src/pages/informationManagement/plan.tsx': planReplacements,
  'src/pages/organizationCoordination/teamPage.tsx': teamReplacements,
};

for (const [fpath, replacements] of Object.entries(files)) {
  let content = fs.readFileSync(fpath, 'utf8');
  const original = content;
  replacements.forEach((r, i) => {
    if (content.includes(r.old)) {
      content = content.replace(r.old, r.new);
      console.log(`[OK] ${fpath}: replaced #${i + 1}`);
    } else {
      console.log(`[WARN] ${fpath}: #${i + 1} not found`);
    }
  });
  if (content === original) {
    console.log(`[NOCHANGE] ${fpath}`);
  } else {
    fs.writeFileSync(fpath, content, 'utf8');
    console.log(`[DONE] ${fpath}`);
  }
}
