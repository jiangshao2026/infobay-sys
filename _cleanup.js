const fs = require('fs');
const path = require('path');

function rimraf(p) {
  let attempts = 0;
  const maxAttempts = 5;
  function tryDelete() {
    try {
      if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true });
      }
      return true;
    } catch (e) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('Failed to delete ' + p + ': ' + e.message);
        return false;
      }
      try { fs.chmodSync(p, 0o777); } catch (_) {}
      return tryDelete();
    }
  }
  return tryDelete();
}

const nm = path.join(__dirname, 'node_modules');
const pl = path.join(__dirname, 'package-lock.json');
console.log('Removing node_modules...');
rimraf(nm);
console.log('Removing package-lock.json...');
try { if (fs.existsSync(pl)) fs.unlinkSync(pl); } catch (e) { console.error(e.message); }
console.log('Cleanup complete.