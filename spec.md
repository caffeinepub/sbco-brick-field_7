# SBCO Brick Field

## Current State
App has dashboard with stat cards including 'TOTAL DUE AMOUNT' (stats.item.3) which is not clickable. Orders are stored in localStorage. Order details include customer name, phone, address, invoice number, total, paid, and auto-calculated due amounts.

## Requested Changes (Diff)

### Add
- New `DueAmountListPage` component showing customers with due > 0
- New `dueAmountList` page route in App.tsx
- Click handler on TOTAL DUE AMOUNT stat card to navigate to new page

### Modify
- App.tsx: Add `dueAmountList` to Page type, render DueAmountListPage, make TOTAL DUE AMOUNT card clickable

### Remove
- Nothing removed

## Implementation Plan
1. Create `DueAmountListPage.tsx` with:
   - Back button + title "Due Amount List"
   - Search bar filtering by customer name in real time
   - List of customer cards (due > 0 only)
   - Card layout: Customer Name (bold) + Invoice Number | Phone | Address | Due Amount (red)
   - Data sourced from localStorage orders, listens for storage events for auto-update
   - Customers with due=0 are automatically excluded
2. Update App.tsx to add the new page route and make the TOTAL DUE AMOUNT card clickable
