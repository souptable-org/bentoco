const http = require('https');

const API_KEY = 'lin_api_5Kd4w9wrNzTsaEWyFIqRsD9DPPGAwXq8xZia31ey';
const TEAM_ID = '21e7033d-9368-4854-9403-4805e5b7ede9';

const phaseLabels = [
  { name: 'phase:p1-codebase-detachment', color: '#EB5757', description: 'Phase 1: Codebase Detachment & Monorepo Cleanup' },
  { name: 'phase:p2-multi-tenancy-rls', color: '#EB5757', description: 'Phase 2: Multi-Tenancy Engine & PostgreSQL RLS' },
  { name: 'phase:p3-order-state-machine-otp', color: '#EB5757', description: 'Phase 3: Indian Order State Machine & COD OTP Engine' },
  { name: 'phase:p4-byog-whatsapp-engine', color: '#EB5757', description: 'Phase 4: Bring Your Own Gateway (BYOG) & WhatsApp Infrastructure' }
];

function sendGraphQL(query, variables) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const req = http.request('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const mutation = `
mutation CreateLabel($input: IssueLabelCreateInput!) {
  issueLabelCreate(input: $input) {
    success
    issueLabel {
      id
      name
    }
  }
}
`;

async function main() {
  for (const label of phaseLabels) {
    try {
      const res = await sendGraphQL(mutation, {
        input: {
          name: label.name,
          color: label.color,
          description: label.description,
          teamId: TEAM_ID
        }
      });
      if (res.data && res.data.issueLabelCreate && res.data.issueLabelCreate.success) {
        console.log(`[SUCCESS] Created label: ${label.name}`);
      } else {
        console.log(`[ERROR] Failed to create label ${label.name}:`, JSON.stringify(res));
      }
    } catch (err) {
      console.error(`[EXCEPT] Error creating label ${label.name}:`, err.message);
    }
  }
}

main();
