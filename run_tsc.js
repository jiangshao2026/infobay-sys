const { execSync } = require('child_process');
try {
  const output = execSync('npx tsc --noEmit', {
    stdio: 'pipe',
    encoding: 'utf-8',
    cwd: __dirname
  });
  console.log('=== TypeScript Check Result ===');
  console.log('Status: PASSED - no type errors');
  console.log('Exit code: 0');
} catch (e) {
  console.log('=== TypeScript Check Result ===');
  console.log('Status: FAILED');
  if (e.stdout) {
    console.log('Errors:');
    console.log(e.stdout);
  } else if (e.stderr) {
    console.log('Stderr:');
    console.log(e.stderr);
  } else {
    console.log(e.message);
  }
}
