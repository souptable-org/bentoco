# Merchant Guide — Theme Config Editor & Theme Lifecycle

Welcome to the Bentoco Storefront Theme Engine. As a merchant or agency operator, you can customize your storefront branding, typography, color scheme, trust promises, and homepage sections with zero code required.

---

## 1. The Theme Editor (`/store/editor`)

The Theme Editor provides a live 3-column configuration experience:
- **Left Sidebar**: Choose between design sections (Radius, Fonts, Colours, Logo, Banners, Promises, Categories).
- **Middle Inspector**: Adjust specific controls (e.g. radius step, light/dark color palettes, custom logos, curated product sections).
- **Right Viewport**: Live interactive preview iframe reflecting your draft changes in real time.

---

## 2. Draft vs. Published Lifecycle (Trust & Safety)

To ensure your customers never see incomplete or mid-edit design changes, Bentoco separates **Draft** edits from your **Live Storefront**:

| Action | What It Does | Customer Impact |
|--------|--------------|-----------------|
| **Save draft** | Saves your current edits to your store's draft profile in the database. | **Zero impact.** Customers continue seeing your previously published theme. |
| **Preview** | The live editor iframe automatically appends `?preview=1` to render your saved draft. | **Zero impact.** Only operators in the editor see draft changes. |
| **Publish** | Promotes your saved draft to the live storefront and archives your previous live theme into history. | **Live immediately.** Customer traffic sees your new branding & theme. |
| **Discard** | Reverts your current draft back to match your active published theme. | **Zero impact.** Clears unpublished draft changes. |
| **Rollback** | Restores your previous published theme snapshot from history. | **Live immediately.** Restores your store's previous look. |

---

## 3. Status Badges in Store Hub (`/store`)

When visiting your Store Theme Hub in the admin dashboard:
- **Unpublished draft** (Orange badge): You have saved edits in the Theme Editor that have not yet been published to live customers.
- **Published** (Green badge): Your live customer storefront is up to date with your published theme configuration.

---

## 4. Best Practices for Merchants

1. **Test in Preview**: Use the interactive iframe preview and mobile/tablet device switches before hitting **Publish**.
2. **Use High-Resolution SVGs**: Upload SVG files for your logo icon and wordmark for crisp rendering across high-DPI displays.
3. **Curate Homepage Product Sections**: Select manual product IDs or native Medusa categories to display featured product carousels directly on your homepage.
