const fs = require('fs');
const path = 'd:/Codebuddy_space/信佰监理服务管理系统/src/pages/informationManagement/documentPage.tsx';

let content = fs.readFileSync(path, 'utf8');

// Change 1: STATUS_OPTIONS - replace '审批中' with '一审通过'
// Change 2: handleReviewSubmit comment and status
// Change 3: handleReviewSubmit message
// Change 4: buildSupervisionOpinionBody condition and text
// Change 5: Approval button logic (more complex, handle separately)
// Change 6: Detail modal submit button

// 1. STATUS_OPTIONS
content = content.replace(
  "const STATUS_OPTIONS: IMDocStatus[] = ['待审批', '审批中', '已发布', '已驳回']",
  "const STATUS_OPTIONS: IMDocStatus[] = ['待审批', '一审通过', '已发布', '已驳回']"
);

// 2. handleReviewSubmit comment
content = content.replace(
  '// 通过：若达到 2 级终态 -> 已发布；否则 -> 审批中',
  '// 通过：若达到 2 级终态 -> 已发布；否则 -> 一审通过'
);

// 3. handleReviewSubmit status transition
content = content.replace(
  "status: (isFinal ? '已发布' : '审批中') as IMDocStatus",
  "status: (isFinal ? '已发布' : '一审通过') as IMDocStatus"
);

// 4. handleReviewSubmit message
content = content.replace(
  "'已通过一级审批，进入下一级'",
  "'一审通过，等待总监理工程师终审'"
);

// 5. Approval button logic
const oldBtnBlock = "          {record.status !== '已发布' && record.status !== '已驳回' && (\n            <Button type=\"link\" icon={<CheckCircleOutlined />} size=\"small\" onClick={() => handleReview(record)}>{record.status === '审批中' ? '审批' : '发起审批'}</Button>\n          )}";
const newBtnBlock = "          {(record.status === '待审批' && (currentUser.role === '监理工程师' || currentUser.role === '总监理工程师')) && (\n            <Button type=\"link\" icon={<CheckCircleOutlined />} size=\"small\" onClick={() => handleReview(record)}>审批</Button>\n          )}\n          {record.status === '一审通过' && currentUser.role === '总监理工程师' && (\n            <Button type=\"link\" icon={<CheckCircleOutlined />} size=\"small\" onClick={() => handleReview(record)}>审批</Button>\n          )}";
content = content.replace(oldBtnBlock, newBtnBlock);

// 6. Detail modal submit button
const oldDetailBtn = "                {currentItem.status === '待审批' && (\n                  <Button type=\"primary\" icon={<CheckCircleOutlined />} onClick={() => { setIsDetailModalVisible(false); handleReview(currentItem) }}>{record.status === '审批中' ? '审批' : '发起审批'}</Button>\n                )}";
const newDetailBtn = "                {(currentUser.role === '监理工程师' || currentUser.role === '总监理工程师') && (\n                  <Button type=\"primary\" icon={<CheckCircleOutlined />} onClick={() => { setIsDetailModalVisible(false); handleReview(currentItem) }}>提交审批</Button>\n                )}";
content = content.replace(oldDetailBtn, newDetailBtn);

// 7. buildSupervisionOpinionBody condition
content = content.replace(
  "    } else if (item.status === '审批中') {",
  "    } else if (item.status === '审批中' || item.status === '一审通过') {"
);

// 8. buildSupervisionOpinionBody text
content = content.replace(
  "      paragraphs.push(`本项目文档尚处于审批流程中，请按进度完成后续审批。`)",
  "      paragraphs.push(`本项目已通过一审，尚处于审批流程中，请总监理工程师完成终审。`)"
);

fs.writeFileSync(path, content, 'utf8');
console.log('File updated successfully with all changes.');
