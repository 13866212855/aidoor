const fs = require('fs');
const path = require('path');

try {
  const serverDir = path.join(__dirname, '..', '.next', 'server');
  const chunksDir = path.join(serverDir, 'chunks');
  const pagesDir = path.join(serverDir, 'pages');

  if (fs.existsSync(chunksDir)) {
    const files = fs.readdirSync(chunksDir);
    files.forEach((file) => {
      const target = path.join(serverDir, file);
      const source = path.join(chunksDir, file);
      if (!fs.existsSync(target)) {
        try {
          fs.copyFileSync(source, target);
        } catch {
          // ignore
        }
      }
    });

    if (fs.existsSync(pagesDir)) {
      const pagesChunks = path.join(pagesDir, 'chunks');
      if (!fs.existsSync(pagesChunks)) {
        try {
          fs.symlinkSync('../chunks', pagesChunks, 'dir');
        } catch {
          // ignore
        }
      }
    }
  }
} catch {
  // ignore
}
