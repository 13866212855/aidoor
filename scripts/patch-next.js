const fs = require('fs');
const path = require('path');

const entryBaseTargets = [
  'node_modules/next/dist/server/app-render/entry-base.js',
  'node_modules/next/dist/esm/server/app-render/entry-base.js',
];

for (const relPath of entryBaseTargets) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace SegmentViewNode and SegmentViewStateNode defaults with pass-through functions
    content = content.replace(
      /let SegmentViewNode\s*=\s*\(\)\s*=>\s*null;/g,
      'let SegmentViewNode = (props) => (props ? props.children : null);'
    );
    content = content.replace(
      /let SegmentViewStateNode\s*=\s*\(\)\s*=>\s*null;/g,
      'let SegmentViewStateNode = (props) => (props ? props.children : null);'
    );

    // Prevent loading client-side devtools segment-explorer-node in Webpack dev mode
    content = content.replace(
      /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*'development'\s*\)\s*\{\s*const mod\s*=\s*require\('\.\.\/\.\.\/next-devtools\/userspace\/app\/segment-explorer-node'\);/g,
      "if (process.env.NODE_ENV === 'development' && process.env.TURBOPACK) {\n    const mod = require('../../next-devtools/userspace/app/segment-explorer-node');"
    );

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`[patch-next] Successfully patched ${relPath}`);
  }
}

// Patch image-component to always use fetchPriority (camelCase)
const imageTargets = [
  'node_modules/next/dist/client/image-component.js',
  'node_modules/next/dist/esm/client/image-component.js',
];

for (const relPath of imageTargets) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(
      /function getDynamicProps\(fetchPriority\)\s*\{[\s\S]*?return\s*\{\s*fetchpriority:\s*fetchPriority\s*\};\s*\}/g,
      'function getDynamicProps(fetchPriority) { return { fetchPriority }; }'
    );
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`[patch-next] Successfully patched ${relPath}`);
  }
}

// Recursively find and patch all react-dom and next-server files containing "Invalid DOM property"
function findFiles(dir, matchStr, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.git' && entry.name !== '.next') {
        findFiles(res, matchStr, fileList);
      }
    } else if (entry.name.endsWith('.js')) {
      try {
        const str = fs.readFileSync(res, 'utf8');
        if (str.includes(matchStr)) {
          fileList.push(res);
        }
      } catch (_) {}
    }
  }
  return fileList;
}

const targetFiles = findFiles(
  path.join(__dirname, '..', 'node_modules'),
  'Invalid DOM property'
);

console.log(`[patch-next] Found ${targetFiles.length} files containing Invalid DOM property warnings`);

for (const filePath of targetFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Guard validateProperty definition if unminified
  if (content.includes('function validateProperty(') && !content.includes('fetchpriority_suppressed')) {
    content = content.replace(
      /function validateProperty\(([^)]*)\)\s*\{/g,
      'function validateProperty($1) { /* fetchpriority_suppressed */ if (arguments[1] && (arguments[1] === "fetchpriority" || arguments[1] === "fetchPriority" || (typeof arguments[1] === "string" && arguments[1].toLowerCase() === "fetchpriority"))) return true;'
    );
    changed = true;
  }

  // 2. Patch console.error call for "Invalid DOM property"
  // Format A: Unminified
  // console.error("Invalid DOM property `%s`. Did you mean `%s`?", name, lowerCasedName)
  const unminifiedRegex = /console\.error\(\s*["']Invalid DOM property `%s`\. Did you mean `%s`\?["']\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
  if (unminifiedRegex.test(content)) {
    content = content.replace(
      unminifiedRegex,
      '($1 !== "fetchpriority" && $1 !== "fetchPriority" && console.error("Invalid DOM property `%s`. Did you mean `%s`?", $1, $2))'
    );
    changed = true;
  }

  // Format B: Minified (e.g., app-page.runtime.dev.js)
  // return console.error("Invalid DOM property `%s`. Did you mean `%s`?",name,lowerCasedName),warnedProperties[name]=!0
  const minifiedRegex = /return console\.error\(["']Invalid DOM property `%s`\. Did you mean `%s`\?["'],([a-zA-Z0-9_$]+),([a-zA-Z0-9_$]+)\),([a-zA-Z0-9_$]+)\[\1\]=!0/g;
  if (minifiedRegex.test(content)) {
    content = content.replace(
      minifiedRegex,
      'return ($1 !== "fetchpriority" && $1 !== "fetchPriority" && console.error("Invalid DOM property `%s`. Did you mean `%s`?",$1,$2)),$3[$1]=!0'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    const rel = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`[patch-next] Successfully patched ${rel}`);
  }
}

// Clear .next cache to ensure patched react-dom is picked up fresh
const cacheDir = path.join(__dirname, '..', '.next', 'cache');
if (fs.existsSync(cacheDir)) {
  try {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('[patch-next] Cleared .next/cache directory');
  } catch (err) {
    console.warn('[patch-next] Could not remove .next/cache:', err.message);
  }
}
