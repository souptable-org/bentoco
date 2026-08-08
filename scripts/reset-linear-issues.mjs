import https from 'https';

const apiKey = 'lin_api_5Kd4w9wrNzTsaEWyFIqRsD9DPPGAwXq8xZia31ey';
const teamId = '21e7033d-9368-4854-9403-4805e5b7ede9';

function graphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: 'api.linear.app',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const issuesToCreate = [
  {
    title: '[P1] Touch Target Violation on Header & Table Icon Controls',
    priority: 1,
    labelIds: ['41dc1c9f-f48d-4404-9570-845be1d7a384', '6b4c178e-12e1-4e4c-afdc-45e406a98aba', '4eb9afa3-1430-45a6-b232-02308e2ff62b'],
    description: 'Primary controls are set to 32px (size-8), failing WCAG 2.5.5 touch target minimums (44x44px).\n\nLocation: packages/admin/dashboard (app-header.tsx, theme-toggle.tsx, nav-user.tsx)\nFix: Expand hit area to minimum 44px (min-h-11 min-w-11) while preserving visual styling.'
  },
  {
    title: '[P1] Global Scrollbar Suppression (* selector)',
    priority: 1,
    labelIds: ['41dc1c9f-f48d-4404-9570-845be1d7a384', '6b4c178e-12e1-4e4c-afdc-45e406a98aba'],
    description: 'scrollbar-width: none is applied globally to *, making page scroll positions hard to discover.\n\nLocation: packages/admin/dashboard/src/index.css (lines 89-100)\nFix: Scope scrollbar suppression strictly to agency shell containers rather than global document *.'
  },
  {
    title: '[P1] Missing Screen Reader Disclosure for New-Tab Admin Open',
    priority: 1,
    labelIds: ['41dc1c9f-f48d-4404-9570-845be1d7a384', '6b4c178e-12e1-4e4c-afdc-45e406a98aba', 'cca35fbf-32aa-4e26-b312-ca56ef93d6fd'],
    description: 'Merchant admin Open action opens in a new tab without ARIA disclosure.\n\nLocation: agency-dashboard-view.tsx, agency-store-switcher.tsx\nFix: Add aria-label or visible text indicating (opens in new tab).'
  },
  {
    title: '[P1] Header Control Cluster Overflow on Mobile Viewports',
    priority: 1,
    labelIds: ['41dc1c9f-f48d-4404-9570-845be1d7a384', '6b4c178e-12e1-4e4c-afdc-45e406a98aba', '4eb9afa3-1430-45a6-b232-02308e2ff62b'],
    description: 'Search trigger, store switcher, theme toggle, and user avatar crowd small viewports without responsive collapse.\n\nLocation: packages/admin/dashboard (app-header.tsx)\nFix: Collapse theme toggle under user avatar menu on small viewports and allow store switcher to truncate cleanly.'
  },
  {
    title: '[P2] Status Badges Bypassing Design Tokens',
    priority: 2,
    labelIds: ['ed78b922-6e4b-4ea3-b6fc-88c28d1a57ff', '6b4c178e-12e1-4e4c-afdc-45e406a98aba', 'fd0432b0-8081-4624-9789-dfb732b25f31'],
    description: 'Hardcoded Tailwind utility colors (emerald-*, amber-*, rose-*) are used instead of design tokens.\n\nLocation: agency-dashboard-view.tsx (statusBadgeClass)\nFix: Map badge styles to @bentoco/ui-preset design system tokens (ui-tag-green, ui-tag-orange, ui-tag-red).'
  },
  {
    title: '[P2] Missing prefers-reduced-motion Policy',
    priority: 2,
    labelIds: ['ed78b922-6e4b-4ea3-b6fc-88c28d1a57ff', '6b4c178e-12e1-4e4c-afdc-45e406a98aba'],
    description: 'Transitions run without respecting user OS reduced motion settings.\n\nLocation: Agency sidebar & shell layout (packages/admin/dashboard)\nFix: Add @media (prefers-reduced-motion: reduce) scoping to disable shell layout animations.'
  },
  {
    title: '[P2] Unwired Log Out Control',
    priority: 2,
    labelIds: ['41dc1c9f-f48d-4404-9570-845be1d7a384', '6b4c178e-12e1-4e4c-afdc-45e406a98aba'],
    description: 'Log out menu item has no attached handler or behavior.\n\nLocation: nav-user.tsx\nFix: Wire up authentication log out logic or temporarily hide until auth endpoints are connected.'
  },
  {
    title: '[P2] Non-Semantic Card Titles in Dashboard Grid',
    priority: 2,
    labelIds: ['ed78b922-6e4b-4ea3-b6fc-88c28d1a57ff', '6b4c178e-12e1-4e4c-afdc-45e406a98aba', 'fd0432b0-8081-4624-9789-dfb732b25f31'],
    description: 'CardTitle renders as a <div>, creating weak document outline for heading navigation.\n\nLocation: card.tsx / agency-dashboard-view.tsx\nFix: Allow CardTitle to accept as="h2" / as="h3".'
  },
  {
    title: '[P2] Platform Accelerator Hint Hardcoded to macOS (⌘K)',
    priority: 2,
    labelIds: ['ed78b922-6e4b-4ea3-b6fc-88c28d1a57ff', '6b4c178e-12e1-4e4c-afdc-45e406a98aba'],
    description: 'Command palette search hint displays ⌘K unconditionally.\n\nLocation: app-header.tsx\nFix: Dynamically render Ctrl+K for Windows/Linux platforms.'
  },
  {
    title: '[P3] Full TTF Font Payloads',
    priority: 3,
    labelIds: ['7f5ce551-510f-4056-b53e-ca38f61012b9', '6b4c178e-12e1-4e4c-afdc-45e406a98aba'],
    description: 'TTF fonts are loaded directly instead of compressed .woff2 files.\n\nLocation: packages/admin/dashboard/src/index.css\nFix: Convert font assets to WOFF2 format for optimized payload size.'
  },
  {
    title: '[P3] Design Token Bridge Documentation Sync',
    priority: 3,
    labelIds: ['ed78b922-6e4b-4ea3-b6fc-88c28d1a57ff', 'fd0432b0-8081-4624-9789-dfb732b25f31', '6b4c178e-12e1-4e4c-afdc-45e406a98aba'],
    description: 'Ensure all Medusa design tokens map 1:1 to shadcn component wrappers in the admin dashboard.\n\nLocation: packages/design-system/ui-preset'
  }
];

async function resetAndRecreate() {
  console.log('Fetching all existing issues...');
  const listRes = await graphql('{ issues(includeArchived: true) { nodes { id identifier title } } }');
  const existingNodes = listRes.data?.issues?.nodes || [];

  for (const issue of existingNodes) {
    console.log(`Deleting ${issue.identifier}...`);
    await graphql('mutation DeleteIssue($id: String!) { issueDelete(id: $id) { success } }', { id: issue.id });
  }

  console.log('Resetting team issue counter to 0...');
  await graphql('mutation ResetTeam($id: String!) { teamUpdate(id: $id, input: { issueCount: 0 }) { success } }', { id: teamId });

  console.log('Recreating 11 issues starting from BEN-1...');
  for (const item of issuesToCreate) {
    const res = await graphql('mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { identifier title url } } }', {
      input: {
        teamId,
        title: item.title,
        priority: item.priority,
        labelIds: item.labelIds,
        description: item.description
      }
    });
    const created = res.data?.issueCreate?.issue;
    if (created) {
      console.log(`Created: ${created.identifier} - ${created.title}`);
    } else {
      console.error(`Failed to create ${item.title}:`, JSON.stringify(res));
    }
  }
}

resetAndRecreate().catch(console.error);
