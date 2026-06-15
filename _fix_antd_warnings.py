startup_replacements = [
    (
        '          <Form.Item name="attachments" label="实施方案附件">\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              maxCount={10}\n              iconRender={() => <UploadOutlined />}',
        '          <Form.Item\n            name="attachments"\n            label="实施方案附件"\n            getValueProps={(fileList) => ({ fileList })}\n          >\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              maxCount={10}\n              iconRender={() => <UploadOutlined />}',
    ),
    (
        '          <Form.Item name="attachments" label="实施方案附件（重新上传将替换原附件）">\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              maxCount={10}\n            >\n              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>\n            </Upload>\n          </Form.Item>',
        '          <Form.Item\n            name="attachments"\n            label="实施方案附件（重新上传将替换原附件）"\n            getValueProps={(fileList) => ({ fileList })}\n          >\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              maxCount={10}\n            >\n              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>\n            </Upload>\n          </Form.Item>',
    ),
]

plan_replacements = [
    (
        '          <Form.Item label="文档附件">\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              fileList={addFileList}\n              onChange={info => setAddFileList(info.fileList.map(f => ({ name: f.name, url: f.url || \'#\', uid: f.uid })))}\n            >\n              <Button icon={<UploadOutlined />}>选择文件</Button>\n            </Upload>\n          </Form.Item>',
        '          <Form.Item\n            name="addAttachments"\n            label="文档附件"\n            getValueProps={(fileList) => ({ fileList })}\n          >\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              fileList={addFileList}\n              onChange={info => setAddFileList(info.fileList.map(f => ({ name: f.name, url: f.url || \'#\', uid: f.uid })))}\n            >\n              <Button icon={<UploadOutlined />}>选择文件</Button>\n            </Upload>\n          </Form.Item>',
    ),
    (
        '          <Form.Item label="文档附件">\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              fileList={editFileList}\n              onChange={info => setEditFileList(info.fileList.map(f => ({ name: f.name, url: f.url || \'#\', uid: f.uid })))}\n            >\n              <Button icon={<UploadOutlined />}>选择文件</Button>\n            </Upload>\n          </Form.Item>',
        '          <Form.Item\n            name="editAttachments"\n            label="文档附件"\n            getValueProps={(fileList) => ({ fileList })}\n          >\n            <Upload\n              multiple\n              beforeUpload={() => false}\n              fileList={editFileList}\n              onChange={info => setEditFileList(info.fileList.map(f => ({ name: f.name, url: f.url || \'#\', uid: f.uid })))}\n            >\n              <Button icon={<UploadOutlined />}>选择文件</Button>\n            </Upload>\n          </Form.Item>',
    ),
]

team_replacements = [
    (
        "        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}\n      >\n        {currentItem and (",
        "        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}\n      >\n        {currentItem and (",
    ),
    (
        "        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}\n      >\n        <Form form={partyEditForm} layout=\"vertical\">",
        "        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}\n      >\n        <Form form={partyEditForm} layout=\"vertical\">",
    ),
]

files = {
    'src/pages/projectManagement/startupPage.tsx': startup_replacements,
    'src/pages/informationManagement/plan.tsx': plan_replacements,
    'src/pages/organizationCoordination/teamPage.tsx': team_replacements,
}

for fpath, replacements in files.items():
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for idx, (old, new) in enumerate(replacements):
        if old in content:
            content = content.replace(old, new, 1)
            print(f'[OK] {fpath}: replaced #{idx + 1}')
        else:
            print(f'[WARN] {fpath}: #{idx + 1} not found')
    if content == original:
        print(f'[NOCHANGE] {fpath}')
    else:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'[DONE] {fpath}')
