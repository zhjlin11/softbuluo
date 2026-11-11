import fs from 'fs';
import path from 'path';

function searchInDir(dir: string, pattern: RegExp) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchInDir(fullPath, pattern);
    } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (pattern.test(line)) {
          console.log(`${fullPath}:${idx + 1}: ${line.trim().slice(0, 100)}`);
        }
      });
    }
  }
}

console.log('=== Checking server/tests/ and scripts/ for nav assertions ===');
searchInDir('server/tests', /navLinks|navItems|nav-compare|nav-community|对比评测|社区交流|9.*(频道|栏目)/i);
searchInDir('scripts', /navLinks|navItems|nav-compare|nav-community|对比评测|社区交流|9.*(频道|栏目)/i);
