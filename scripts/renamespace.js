const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  '.yarn',
  '.next',
  '.turbo',
  'coverage',
  'build'
]);

const EXTENSIONS = new Set([
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.cjs',
  '.mjs',
  '.md',
  '.yml',
  '.yaml'
]);

let modifiedCount = 0;
let totalFilesScanned = 0;

function processFile(filePath) {
  totalFilesScanned++;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('@bentoco/')) {
      const updated = content.replaceAll('@bentoco/', '@bentoco/');
      fs.writeFileSync(filePath, updated, 'utf8');
      modifiedCount++;
      console.log(`Updated: ${path.relative(ROOT_DIR, filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        walkDir(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.has(ext) || entry.name.startsWith('_tsconfig')) {
        processFile(fullPath);
      }
    }
  }
}

console.log('Starting monorepo re-namespacing (@bentoco/ -> @bentoco/)...');
walkDir(ROOT_DIR);
console.log(`Finished. Scanned ${totalFilesScanned} files. Modified ${modifiedCount} files.`);
