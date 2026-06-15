const fs = require('fs');
const path = 'd:/Trae_space/信佰监理服务管理系统/src/pages/projectManagement/startupPage.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

// Print lines around 605, 690
console.log('Line 604:'); console.log('  -', JSON.stringify(lines[603]));
console.log('Line 605:'); console.log('  -', JSON.stringify(lines[604]));
console.log('Line 606:'); console.log('  -', JSON.stringify(lines[605]));
console.log('Line 688:'); console.log('  -', JSON.stringify(lines[687]));
console.log('Line 689:'); console.log('  -', JSON.stringify(lines[688]));
console.log('Line 690:'); console.log('  -', JSON.stringify(lines[689]));

console.log();
console.log('Line 604 chars:');
for (let j = 0; j < Math.min(80, lines[603].length); j++) {
  const ch = lines[603][j];
  console.log('  ', j, ch, ch.charCodeAt(0).toString(16));
}

console.log();
console.log('Does line 604 contain "attachments"?', lines[603].includes('attachments'));
console.log('Does line 605 contain "attachments"?', lines[604].includes('attachments'));
console.log('Does line 605:'); console.log('  ', lines[604]);
console.log();
console.log('trim equal:', lines[604].trim());
console.log();
console.log('Substring 10-50:', lines[604].substring(10, 50));
