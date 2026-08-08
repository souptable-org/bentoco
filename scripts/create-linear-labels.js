const http = require('https');

const API_KEY = 'lin_api_5Kd4w9wrNzTsaEWyFIqRsD9DPPGAwXq8xZia31ey';
const TEAM_ID = '21e7033d-9368-4854-9403-4805e5b7ede9';

const labels = [
  { name: 'mode:agency', color: '#4EA7FC', description: 'Agency Mode (agency.bentoco.com)' },
  { name: 'mode:merchant', color: '#BB87FC', description: 'Merchant Mode (app.bentoco.com)' },
  { name: 'infra:rls-tenancy', color: '#F2994A', description: 'Single-DB multi-tenancy & PostgreSQL RLS' },
  { name: 'module:agency:client-switcher', color: '#56CCF2', description: 'Multi-store roster & header tenant context switcher' },
  { name: 'module:agency:uid-transfer', color: '#56CCF2', description: '1-click UID handshake & store ownership transfer' },
  { name: 'module:agency:per-site-billing', color: '#56CCF2', description: 'Centralized per-active-site agency invoicing' },
  { name: 'module:agency:rbac', color: '#56CCF2', description: 'AGENCY_OWNER vs AGENCY_MEMBER access control' },
  { name: 'module:engine:cod-otp', color: '#27AE60', description: 'WhatsApp 4-digit OTP & COD confirmation' },
  { name: 'module:engine:prepaid-flip', color: '#27AE60', description: 'Instant UPI Intent & COD to Prepaid flip' },
  { name: 'module:engine:byog', color: '#27AE60', description: 'Bring Your Own Gateway credentials adapter' },
  { name: 'module:engine:whatsapp-evolution', color: '#27AE60', description: 'Evolution API Baileys QR Linked Devices' },
  { name: 'module:engine:communications-wallet', color: '#27AE60', description: 'Prepaid WhatsApp message credit balance & ledger' },
  { name: 'module:engine:indian-gst', color: '#27AE60', description: 'Indian GST engine CGST SGST IGST in Paisa' },
  { name: 'module:engine:logistics', color: '#27AE60', description: 'Shiprocket & Delhivery AWB & tracking' },
  { name: 'feature:pincode-checker', color: '#F2C94C', description: 'Pincode delivery & COD availability widget' },
  { name: 'feature:smart-address', color: '#F2C94C', description: '6-digit Pincode City & State auto-complete' },
  { name: 'feature:whatsapp-reviews', color: '#F2C94C', description: 'Post-delivery WhatsApp photo review collector' },
  { name: 'feature:whatsapp-support-widget', color: '#F2C94C', description: 'Floating native WhatsApp support chat button' },
  { name: 'feature:rto-returns-portal', color: '#F2C94C', description: 'Self-serve exchange & returns portal' },
  { name: 'feature:post-purchase-upsell', color: '#F2C94C', description: 'Post-checkout upsell modal & in-cart bumps' },
  { name: 'feature:shopify-importer', color: '#F2C94C', description: '1-click Shopify CSV catalog importer' }, { name: 'feature:meta-google-catalog', color: '#F2C94C', description: 'Auto-syncing XML feed for Meta CAPI & Google' },
  { name: 'feature:micro-affiliates', color: '#F2C94C', description: 'Influencer tracking link & discount generator' },
  { name: 'app:storefront', color: '#9B51E0', description: 'Next.js 4G Edge storefront app' },
  { name: 'app:admin', color: '#9B51E0', description: 'Dual-mode React Admin Dashboard' },
  { name: 'package:core-flows', color: '#9B51E0', description: 'Medusa workflow engine packages' },
  { name: 'package:design-system', color: '#9B51E0', description: 'UI component library' },
  { name: 'phase:p5-admin-dualmode', color: '#EB5757', description: 'Phase 5: Dual-mode admin & agency RBAC' },
  { name: 'phase:p6-storefront-theme', color: '#EB5757', description: 'Phase 6: Next.js Storefront & DESIGN.md compiler' },
  { name: 'phase:p7-native-apps', color: '#EB5757', description: 'Phase 7: Logistics & Native Apps' },
  { name: 'phase:p8-hardening', color: '#EB5757', description: 'Phase 8: Production hardening & launch' },
  { name: 'type:security', color: '#E040FB', description: 'Security RLS policies & encryption' },
  { name: 'type:performance', color: '#00E676', description: 'Sub-1s page load & SQL optimizations' }
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
  for (const label of labels) {
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
