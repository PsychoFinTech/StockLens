# Design Specification: Typography & Colors Premium Redesign

## Goal
Redesign the typography, color system, and layout aesthetics of StockLens to feel premium, branded, and highly readable. This specifically addresses issues with fonts appearing too small, blurry, or low-contrast, replacing them with a crisp, high-contrast Swiss-Alabaster editorial theme.

---

## Design System & Tokens

### 1. Typography Hierarchy
* **UI/Headers/Labels**: `Plus Jakarta Sans` or `Inter` (sans-serif)
  * Page Headers: `font-bold text-2xl tracking-tight text-slate-800`
  * Card Titles: `font-bold text-xs uppercase tracking-wider text-slate-500` (improves contrast and size compared to old light gray)
  * UI Buttons: `font-semibold text-sm text-slate-700`
* **Financial Data & Numbers**: `JetBrains Mono` (monospace)
  * Values (Prices, Ratios, Caps): `font-bold text-lg text-slate-900` or `text-xl`/`text-2xl` depending on card prominence.
  * Weight is kept at `font-bold` (700) or `font-semibold` (600) to ensure subpixels align crisply and prevent thin-line font blurriness.
* **Font Smoothing (CSS)**:
  * Apply `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;` globally.

### 2. Color Palette
* **Page Canvas Background**: Soft Alabaster/Cream `#f7f6f2` (removes the clinical gray-50 look)
* **Card Panels**: Crisp White `#ffffff` with a soft sand-gray border `#e8e6e1` (instead of standard gray lines)
* **Primary Brand Accent (Emerald)**: `#047857` (Deep emerald green for buttons, positive changes, active indicators)
* **Negative Accent (Rose)**: `#be123c` (High-contrast red for declines)
* **Text Neutrals**:
  * Headings & Primary Values: Slate-900 `#0f172a`
  * Body & Medium Emphasis: Slate-800 `#1e293b`
  * Secondary Labels: Slate-500 `#64748b`

### 3. Card Elevation & Spacing
* Cards: Rounded corners `rounded-xl` or `rounded-2xl` with a soft border and subtle shadow:
  * `bg-white border border-[#e8e6e1] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200`
* Dense layout with structured grid cells for clear data alignment.

---

## Proposed Changes

### Component: Style Foundations
#### [MODIFY] [index.css](file:///c:/Users/CGS_Computer/OneDrive/Desktop/coding%20projects/src/index.css)
* Set page body background to `#f7f6f2`.
* Add global font rendering optimizations.
* Configure custom Tailwind v4 theme colors and font definitions if needed.

### Component: App Wrapper
#### [MODIFY] [App.tsx](file:///c:/Users/CGS_Computer/OneDrive/Desktop/coding%20projects/src/App.tsx)
* Update main container class to use the new soft background.
* Adjust footer styling for high-contrast typography.

### Component: Core Pages
#### [MODIFY] [CompanyPage.tsx](file:///c:/Users/CGS_Computer/OneDrive/Desktop/coding%20projects/src/pages/CompanyPage.tsx)
* **Navigate Report Tabs**: Style active state with white background, solid border, and bold text.
* **Price Summary**: Restructure sub-cards to use rounded borders, medium-slate titles, and bold monospace values.
* **Company Essentials**: Update the 4x4 metrics grid. Cells will use `#fafaf9` hover backgrounds, slate-600 uppercase labels, and bold JetBrains Mono values.
* **FAQ Accordion**: Set proper padding, increase font size/contrast of questions, and style answer backgrounds.
* **Corporate Bulletins Feed**: Polish news card cards with high-contrast dates, bold titles, and subtle hover scale.
* **Sector Peers / Index Presence**: Align text size, font weight, and borders with the new premium guidelines.

#### [MODIFY] [MarketDashboardPage.tsx](file:///c:/Users/CGS_Computer/OneDrive/Desktop/coding%20projects/src/pages/MarketDashboardPage.tsx)
* Redesign index cards, movers tables, and sector cards to match the new high-contrast, premium aesthetic.

#### [MODIFY] [ScreenerPage.tsx](file:///c:/Users/CGS_Computer/OneDrive/Desktop/coding%20projects/src/pages/ScreenerPage.tsx)
* Upgrade layout, search inputs, pagination buttons, and tabular equity list styling.

#### [MODIFY] [WatchlistPage.tsx](file:///c:/Users/CGS_Computer/OneDrive/Desktop/coding%20projects/src/pages/WatchlistPage.tsx)
* Style watchlist grid, seed assets buttons, and user dashboard elements.

---

## Verification Plan

### Manual Verification
* Access the running application at `http://localhost:3000` after making changes.
* Verify typography sizes, weights, and anti-aliasing in both normal and high-DPI displays.
* Test that text is sharp, high contrast, and perfectly legible.
