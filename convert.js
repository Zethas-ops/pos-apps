import fs from 'fs';
import path from 'path';
import { transformSync } from 'esbuild';

function walkDir(dir, callback) { //test push
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(path.join(dir, f));
    }
  });
}

const rootDir = process.cwd();

walkDir(rootDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    if (filePath.includes('vite.config.ts') || filePath.includes('server.ts') || filePath.includes('src') || filePath.includes('server')) {
      const ext = path.extname(filePath);
      const isTsx = ext === '.tsx';
      const newExt = isTsx ? '.jsx' : '.js';
      const newFilePath = filePath.slice(0, -ext.length) + newExt;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      try {
        let result = transformSync(content, {
          loader: isTsx ? 'tsx' : 'ts',
          format: 'esm',
          target: 'esnext',
          jsx: 'preserve'
        });
        
        let code = result.code;
        code = code.replace(/\.tsx?(['"])/g, (match, p1) => {
          return match.includes('x') ? `.jsx${p1}` : `.js${p1}`;
        });
        
        fs.writeFileSync(newFilePath, code);
        fs.unlinkSync(filePath);
        console.log(`Converted ${filePath} to ${newFilePath}`);
      } catch (e) {
        console.error(`Failed to convert ${filePath}:`, e);
      }
    }
  }
});
