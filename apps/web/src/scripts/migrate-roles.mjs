import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const apiDir = path.join(scriptDirectory, '../app/api');

walkDir(apiDir, (filePath) => {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace: allowedRoles: PERMISSIONS.resource.action
    // With: permission: { resource: 'resource', action: 'action' }
    const newContent = content.replace(
      /allowedRoles:\s*PERMISSIONS\.([a-zA-Z0-9_]+)\.(read|write)/g,
      "permission: { resource: '$1', action: '$2' }"
    );
    
    if (content !== newContent) {
      console.log('Updated:', filePath);
      fs.writeFileSync(filePath, newContent);
    }
  }
});
