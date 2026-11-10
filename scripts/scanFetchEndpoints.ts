import fs from 'fs';
import path from 'path';

function scan(dir: string) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      scan(full);
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      lines.forEach((line, idx) => {
        const match = line.match(/fetch\s*\(\s*[`'"]\/api\/([^`'"]+)/);
        if (match) {
          const apiPath = match[1];
          if (!apiPath.startsWith('v1/') && !apiPath.startsWith('public/')) {
            console.log(`${full}:${idx + 1} -> /api/${apiPath}`);
          }
        }
      });
    }
  }
}

scan('src');
