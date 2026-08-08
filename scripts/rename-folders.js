const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const FOLDER_RENAMES = [
  { old: 'packages/medusa', new: 'packages/bentoco' },
  { old: 'packages/medusa-telemetry', new: 'packages/bentoco-telemetry' },
  { old: 'packages/medusa-test-utils', new: 'packages/bentoco-test-utils' },
  { old: 'packages/cli/create-medusa-app', new: 'packages/cli/create-bentoco-app' },
  { old: 'packages/cli/medusa-cli', new: 'packages/cli/bentoco-cli' }
];

console.log('--- Starting Directory Renaming (medusa -> bentoco) ---');

// 1. Rename Folders
for (const item of FOLDER_RENAMES) {
  const oldPath = path.join(ROOT_DIR, item.old);
  const newPath = path.join(ROOT_DIR, item.new);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${item.old} -> ${item.new}`);
  } else {
    console.log(`Skipped (not found): ${item.old}`);
  }
}

// 2. Update Root package.json Workspaces
const rootPkgPath = path.join(ROOT_DIR, 'package.json');
if (fs.existsSync(rootPkgPath)) {
  let content = fs.readFileSync(rootPkgPath, 'utf8');
  content = content.replaceAll('"packages/medusa"', '"packages/bentoco"');
  content = content.replaceAll('"packages/medusa-test-utils"', '"packages/bentoco-test-utils"');
  fs.writeFileSync(rootPkgPath, content, 'utf8');
  console.log('Updated root package.json workspace paths.');
}

console.log('Directory renaming completed successfully.');
