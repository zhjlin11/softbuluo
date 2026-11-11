import fs from 'fs';
import path from 'path';

function searchInDir(dir: string, pattern: RegExp, results: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'dist-server', 'backups', 'brain'].includes(entry.name)) continue;
      searchInDir(fullPath, pattern, results);
    } else if (entry.isFile() && /\.(tsx?|jsx?|json|html)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (pattern.test(line)) {
          results.push(`${fullPath}:${idx + 1}: ${line.trim().slice(0, 120)}`);
        }
      });
    }
  }
}

const compareResults: string[] = [];
searchInDir('src', /对比评测|\/compare\b/, compareResults);

const communityResults: string[] = [];
searchInDir('src', /社区交流|\/community\b/, communityResults);

console.log('=== 对比评测 /compare 在 src/ 下的匹配项 (' + compareResults.length + ') ===');
compareResults.forEach(r => console.log(r));

console.log('\n=== 社区交流 /community 在 src/ 下的匹配项 (' + communityResults.length + ') ===');
communityResults.forEach(r => console.log(r));
