import fs from 'fs';
import path from 'path';

function inspectDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      inspectDir(full);
    } else if (/\.(tsx|ts)$/.test(f)) {
      const content = fs.readFileSync(full, 'utf-8');
      if (content.includes('nav-compare') || content.includes('nav-community') ||
          content.includes('/compare') || content.includes('/community') ||
          content.includes('对比评测') || content.includes('社区交流')) {
        console.log(`[FOUND in ${full}]`);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (/compare|community|对比评测|社区交流/i.test(l)) {
            console.log(`  Line ${idx + 1}: ${l.trim().slice(0, 100)}`);
          }
        });
      }
    }
  }
}

console.log('--- Inspecting src/components/layout ---');
inspectDir('src/components/layout');

console.log('\n--- Inspecting src/components/home ---');
inspectDir('src/components/home');

console.log('\n--- Inspecting src/pages/HomePage.tsx ---');
if (fs.existsSync('src/pages/HomePage.tsx')) {
  const hp = fs.readFileSync('src/pages/HomePage.tsx', 'utf-8');
  hp.split('\n').forEach((l, idx) => {
    if (/compare|community|对比评测|社区交流/i.test(l)) {
      console.log(`  Line ${idx + 1}: ${l.trim().slice(0, 100)}`);
    }
  });
}
