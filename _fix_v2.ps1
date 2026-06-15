$files = @{
    'src/pages/projectManagement/startupPage.tsx' = @(
        @{
            Old = "          <Form.Item name=`"attachments`" label=`"实施方案附件`">`n            <Upload`n              multiple`n              beforeUpload={() => false}`n              maxCount={10}`n              iconRender={() => <UploadOutlined />}"
            New = "          <Form.Item`n            name=`"attachments`"`n            label=`"实施方案附件`"`n            getValueProps={(fileList) => ({ fileList })}`n          >`n            <Upload`n              multiple`n              beforeUpload={() => false}`n              maxCount={10}`n              iconRender={() => <UploadOutlined />}"
        },
        @{
            Old = "          <Form.Item name=`"attachments`" label=`"实施方案附件（重新上传将替换原附件）`">`n            <Upload`n              multiple`n              beforeUpload={() => false}`n              maxCount={10}`n            >`n              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>`n            </Upload>`n          </Form.Item>"
            New = "          <Form.Item`n            name=`"attachments`"`n            label=`"实施方案附件（重新上传将替换原附件）`"`n            getValueProps={(fileList) => ({ fileList })}`n          >`n            <Upload`n              multiple`n              beforeUpload={() => false}`n              maxCount={10}`n            >`n              <Button icon={<UploadOutlined />}>点击上传实施方案</Button>`n            </Upload>`n          </Form.Item>"
        }
    )
    'src/pages/informationManagement/plan.tsx' = @(
        @{
            Old = "          <Form.Item label=`"文档附件`">`n            <Upload`n              multiple`n              beforeUpload={() => false}`n              fileList={addFileList}`n              onChange={info => setAddFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}`n            >`n              <Button icon={<UploadOutlined />}>选择文件</Button>`n            </Upload>`n          </Form.Item>"
            New = "          <Form.Item`n            name=`"addAttachments`"`n            label=`"文档附件`"`n            getValueProps={(fileList) => ({ fileList })}`n          >`n            <Upload`n              multiple`n              beforeUpload={() => false}`n              fileList={addFileList}`n              onChange={info => setAddFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}`n            >`n              <Button icon={<UploadOutlined />}>选择文件</Button>`n            </Upload>`n          </Form.Item>"
        },
        @{
            Old = "          <Form.Item label=`"文档附件`">`n            <Upload`n              multiple`n              beforeUpload={() => false}`n              fileList={editFileList}`n              onChange={info => setEditFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}`n            >`n              <Button icon={<UploadOutlined />}>选择文件</Button>`n            </Upload>`n          </Form.Item>"
            New = "          <Form.Item`n            name=`"editAttachments`"`n            label=`"文档附件`"`n            getValueProps={(fileList) => ({ fileList })}`n          >`n            <Upload`n              multiple`n              beforeUpload={() => false}`n              fileList={editFileList}`n              onChange={info => setEditFileList(info.fileList.map(f => ({ name: f.name, url: f.url || '#', uid: f.uid })))}`n            >`n              <Button icon={<UploadOutlined />}>选择文件</Button>`n            </Upload>`n          </Form.Item>"
        }
    )
    'src/pages/organizationCoordination/teamPage.tsx' = @(
        @{
            Old = "        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}`n      >`n        {currentItem and ("
            New = "        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}`n      >`n        {currentItem and ("
        },
        @{
            Old = "        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}`n      >`n        <Form form={partyEditForm} layout=`"vertical`">"
            New = "        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}`n      >`n        <Form form={partyEditForm} layout=`"vertical`">"
        }
    )
}

foreach ($fpath in $files.Keys) {
    $content = [System.IO.File]::ReadAllText($fpath)
    $original = $content
    $replacements = $files[$fpath]
    for ($i = 0; $i -lt $replacements.Count; $i++) {
        $old = $replacements[$i].Old
        $new = $replacements[$i].New
        if ($content.Contains($old)) {
            $content = $content.Replace($old, $new)
            Write-Host "[OK] $fpath : replaced #$($i+1)"
        } else {
            Write-Host "[WARN] $fpath : #$($i+1) not found"
        }
    }
    if ($content -eq $original) {
        Write-Host "[NOCHANGE] $fpath"
    } else {
        [System.IO.File]::WriteAllText($fpath, $content)
        Write-Host "[DONE] $fpath"
    }
}
