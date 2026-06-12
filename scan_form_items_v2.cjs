const fs = require('fs');
const path = require('path');
const pagesDir = path.resolve(__dirname, 'src/pages');

function walk(dir, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, list);
    else if (f.endsWith('.tsx')) list.push(p);
  }
  return list;
}

function findTagClose(text, startOffset) {
  let braceDepth = 0;
  let inSingle = false, inDouble = false, inBacktick = false;
  for (let i = startOffset; i < text.length; i++) {
    const c = text[i];
    if (inSingle) {
      if (c === "'" && text[i-1] !== '\\') inSingle = false;
      continue;
    }
    if (inDouble) {
      if (c === '"' && text[i-1] !== '\\') inDouble = false;
      continue;
    }
    if (inBacktick) {
      if (c === '`' && text[i-1] !== '\\') inBacktick = false;
      continue;
    }
    if (c === "'") { inSingle = true; continue; }
    if (c === '"') { inDouble = true; continue; }
    if (c === '`') { inBacktick = true; continue; }
    if (c === '{') { braceDepth++; continue; }
    if (c === '}') { braceDepth--; continue; }
    if (c === '>' && braceDepth === 0) { return i; }
  }
  return -1;
}

function analyzeFormItemAt(fileContent, startPos) {
  const tagEnd = findTagClose(fileContent, startPos);
  if (tagEnd === -1) return null;
  if (fileContent[tagEnd - 1] === '/') return null;

  const tagContent = fileContent.substring(startPos, tagEnd + 1);
  if (!/\bname=/.test(tagContent)) return null;

  let depth = 1;
  let pos = tagEnd + 1;
  while (pos < fileContent.length) {
    const nextOpen = fileContent.indexOf('<Form.Item', pos);
    const nextClose = fileContent.indexOf('</Form.Item>', pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      const innerTagEnd = findTagClose(fileContent, nextOpen);
      if (innerTagEnd > 0 && fileContent[innerTagEnd - 1] !== '/') depth++;
      pos = innerTagEnd > 0 ? innerTagEnd + 1 : nextOpen + 1;
    } else {
      depth--;
      if (depth === 0) {
        return {
          inner: fileContent.substring(tagEnd + 1, nextClose),
          openTag: tagContent,
          closeEnd: nextClose + '</Form.Item>'.length
        };
      }
      pos = nextClose + 1;
    }
  }
  return null;
}

function findDirectChildren(inner) {
  const children = [];
  let i = 0;
  while (i < inner.length) {
    if (/\s/.test(inner[i])) { i++; continue; }

    if (inner[i] === '<') {
      const tagMatch = inner.substring(i).match(/^<(\/?)([A-Za-z][A-Za-z0-9.]*)/);
      if (!tagMatch) { i++; continue; }
      if (tagMatch[1] === '/') return children;
      const tagName = tagMatch[2];
      const tagEnd = findTagClose(inner, i);
      if (tagEnd === -1) return children;
      if (inner[tagEnd - 1] === '/') {
        children.push({ type: 'tag', name: tagName });
        i = tagEnd + 1;
        continue;
      }
      let tagDepth = 1;
      let j = tagEnd + 1;
      while (j < inner.length && tagDepth > 0) {
        if (inner[j] === '<' && inner[j+1] === '/') {
          const m = inner.substring(j).match(/^<\/[A-Za-z][A-Za-z0-9.]*>/);
          if (m) { tagDepth--; j += m[0].length; continue; }
        }
        if (inner[j] === '<') {
          const m = inner.substring(j).match(/^<([A-Za-z][A-Za-z0-9.]*)/);
          if (m) {
            const te = findTagClose(inner, j);
            if (te > 0 && inner[te - 1] !== '/') tagDepth++;
            j = te > 0 ? te + 1 : j + 1;
            continue;
          }
        }
        if (inner[j] === '{') {
          let b = 1; j++;
          while (j < inner.length && b > 0) {
            if (inner[j] === '{') b++;
            else if (inner[j] === '}') b--;
            else if (inner[j] === '"' || inner[j] === "'" || inner[j] === '`') {
              const quote = inner[j]; j++;
              while (j < inner.length && inner[j] !== quote) j++;
            }
            j++;
          }
          continue;
        }
        j++;
      }
      children.push({ type: 'tag', name: tagName });
      i = j;
      continue;
    }

    if (inner[i] === '{') {
      let braceDepth = 1;
      let j = i + 1;
      while (j < inner.length && braceDepth > 0) {
        if (inner[j] === '{') braceDepth++;
        else if (inner[j] === '}') braceDepth--;
        else if (inner[j] === '"' || inner[j] === "'" || inner[j] === '`') {
          const quote = inner[j]; j++;
          while (j < inner.length && inner[j] !== quote) j++;
        }
        j++;
      }
      children.push({
        type: 'expression',
        content: inner.substring(i + 1, j - 1).replace(/\s+/g, ' ').trim().substring(0, 120)
      });
      i = j;
      continue;
    }

    const textMatch = inner.substring(i).match(/^[^<{}\s][^<{]*/);
    if (textMatch) {
      const txt = textMatch[0].trim();
      if (txt.length > 0) children.push({ type: 'text', content: txt.substring(0, 100) });
      i += textMatch[0].length;
      continue;
    }
    i++;
  }
  return children;
}

function getLineNumber(content, pos) {
  return content.substring(0, pos).split('\n').length;
}

const files = walk(pagesDir);
const multiChildViolations = [];
const layoutContainerViolations = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let pos = 0;
  while (pos < content.length) {
    const found = content.indexOf('<Form.Item', pos);
    if (found === -1) break;

    const result = analyzeFormItemAt(content, found);
    if (result) {
      const children = findDirectChildren(result.inner);
      const tagChildren = children.filter(c => c.type === 'tag');

      if (children.length > 1 && tagChildren.length >= 1) {
        const lineNum = getLineNumber(content, found);
        multiChildViolations.push({
          file, line: lineNum,
          formItemLine: result.openTag.replace(/\s+/g, ' ').trim().substring(0, 200),
          children,
          innerPreview: result.inner.substring(0, 400).replace(/\s+/g, ' ').trim()
        });
      }

      if (children.length === 1 && children[0].type === 'tag') {
        const layoutContainers = ['Row', 'Col', 'Space', 'Card', 'div', 'Divider', 'Fragment'];
        if (layoutContainers.includes(children[0].name)) {
          const lineNum = getLineNumber(content, found);
          layoutContainerViolations.push({
            file, line: lineNum,
            formItemLine: result.openTag.replace(/\s+/g, ' ').trim().substring(0, 200),
            childName: children[0].name,
            innerPreview: result.inner.substring(0, 300).replace(/\s+/g, ' ').trim()
          });
        }
      }

      pos = result.closeEnd;
    } else {
      pos = found + 1;
    }
  }
}

console.log('');
console.log('========== 高优先级：Form.Item 带 name 但有多个直接子元素（一定触发 antd 警告） ==========');
console.log('');
console.log('总数:', multiChildViolations.length);
for (const v of multiChildViolations) {
  const relPath = path.relative(pagesDir, v.file).replace(/\\/g, '/');
  console.log('');
  console.log('  [src/pages/' + relPath + ':' + v.line + ']');
  console.log('  标签: ' + v.formItemLine);
  console.log('  直接子元素:');
  for (const c of v.children) {
    if (c.type === 'tag') console.log('    - <' + c.name + '> (JSX 标签)');
    else if (c.type === 'expression') console.log('    - {' + c.content.substring(0, 80) + '} (表达式)');
    else if (c.type === 'text') console.log('    - "' + c.content.substring(0, 80) + '" (文本)');
  }
  console.log('  代码预览: ' + v.innerPreview.substring(0, 250));
}

console.log('');
console.log('========== 中优先级：Form.Item 带 name 单一子元素是布局容器（Form 可能无法正常接管） ==========');
console.log('');
console.log('总数:', layoutContainerViolations.length);
for (const v of layoutContainerViolations) {
  const relPath = path.relative(pagesDir, v.file).replace(/\\/g, '/');
  console.log('');
  console.log('  [src/pages/' + relPath + ':' + v.line + ']');
  console.log('  标签: ' + v.formItemLine);
  console.log('  子元素类型: <' + v.childName + '>');
  console.log('  代码预览: ' + v.innerPreview.substring(0, 250));
}

console.log('');
console.log('分析完成。');
