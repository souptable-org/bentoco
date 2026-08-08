const fs = require('fs');
const path = require('path');

async function downloadEfferdBlock() {
  const url = 'https://efferd.com/r/default/app-shell-3.json';
  console.log(`Fetching block manifest from ${url}...`);

  const res = await fetch(url);
  const data = await res.json();

  const targetBaseDir = path.resolve(__dirname, '../packages/admin/dashboard/src/components/blocks/app-shell-3');
  if (!fs.existsSync(targetBaseDir)) {
    fs.mkdirSync(targetBaseDir, { recursive: true });
  }

  console.log(`Installing ${data.files.length} block files to ${targetBaseDir}...`);

  for (const fileObj of data.files) {
    const filename = path.basename(fileObj.path);
    const targetFilePath = path.join(targetBaseDir, filename);
    
    fs.writeFileSync(targetFilePath, fileObj.content, 'utf8');
    console.log(`  ✓ Installed: ${filename}`);
  }

  console.log('\nSuccessfully installed @efferd/app-shell-3 block files!');
}

downloadEfferdBlock().catch(err => {
  console.error('Failed to download block:', err.message);
  process.exit(1);
});
