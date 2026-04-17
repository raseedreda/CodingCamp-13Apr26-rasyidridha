# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a single-page, client-side expense tracker using plain HTML, CSS, and vanilla JavaScript. The app is structured as three files (`index.html`, `css/styles.css`, `js/app.js`), uses Chart.js via CDN for pie chart visualisation, and persists all data to Local Storage. Implementation follows a unidirectional data flow: User Action → State Mutation → Storage Sync → UI Re-render.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` at the project root with the full semantic markup described in the design
  - Include the Chart.js CDN `<script>` tag in `<head>` or before `</body>`
  - Add all required element IDs: `theme-toggle`, `balance-display`, `transaction-form`, `item-name`, `item-amount`, `item-category`, `form-error`, `spend-limit-input`, `set-limit-btn`, `limit-error`, `spending-chart`, `chart-placeholder`, `sort-select`, `transaction-list`, `empty-state`
  - Set `data-theme="light"` on `<html>` as the default
  - Add `role="alert"` and `aria-live="polite"` to `#form-error` and `#limit-error`
  - Add `aria-label="Transaction history"` to `#transaction-list`
  - Create empty `css/styles.css` and `js/app.js` files
  - _Requirements: 2.1, 2.2, 3.4, 4.3, 8.4, 9.1_

- [x] 2. Implement CSS foundation — layout, theming, and responsive breakpoints
  - [x] 2.1 Define CSS custom properties and theme variables
    - Declare all colour tokens on `:root` for light mode (backgrounds, text, borders, accent colours)
    - Declare overrides on `[data-theme="dark"]` for dark mode colours
    - Include a variable for the `.over-limit` highlight colour
    - _Requirements: 8.1, 8.2_

  - [x] 2.2 Implement base layout and component styles
    - Style `<header>`, `<main>`, and all `<section>` elements using Flexbox for the main column
    - Style the transaction form row (inputs, select, submit button)
    - Style the spend limit row (input, button)
    - Style `#balance-display`, `#chart-section`, `#list-section`, and `#sort-controls`
    - Style `<ul>` and `<li>` transaction cards (name, amount, category, delete button)
    - Style `#empty-state` and `#chart-placeholder` (hidden by default when content is present)
    - Define `.over-limit` class with the highlight styling
    - _Requirements: 2.4, 7.2, 7.3_

  - [x] 2.3 Add responsive media queries
    - Add `@media (max-width: 428px)` rules for single-column mobile layout
    - Add `@media (min-width: 1024px)` rules for expanded desktop layout (e.g., CSS Grid for form row)
    - Ensure all sections remain readable and functional at both breakpoints
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 3. Implement AppState, constants, and Local Storage helpers
  - [x] 3.1 Define AppState and constants in `js/app.js`
    - Declare the `AppState` object with fields: `transactions: []`, `spendLimit: null`, `sortOrder: 'default'`, `theme: 'light'`, `chart: null`
    - Declare the `CATEGORY_COLORS` map: `{ Food: '#FF6384', Transport: '#36A2EB', Fun: '#FFCE56' }`
    - Wrap all code in an IIFE to keep global scope clean
    - _Requirements: 4.4_

  - [x] 3.2 Implement Local Storage helper functions
    - Implement `saveTransactions()` — serialise `AppState.transactions` to `ebv_transactions` with `try/catch`
    - Implement `saveSpendLimit()` — write `AppState.spendLimit` to `ebv_spend_limit` with `try/catch`
    - Implement `saveTheme()` — write `AppState.theme` to `ebv_theme` with `try/catch`
    - Implement `loadState()` — read and parse all three keys; handle corrupt JSON by discarding and clearing the key; log a console warning if Local Storage is unavailable
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 3.3 Write property test for transaction persistence round-trip
    - **Property 6: Transaction persistence round-trip**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ]* 3.4 Write property test for spend limit persistence round-trip
    - **Property 14: Spend limit persistence round-trip**
    - **Validates: Requirements 5.4, 5.6**

- [x] 4. Checkpoint — verify file structure and storage helpers
  - Ensure all three files exist and are linked correctly (HTML references CSS and JS)
  - Ensure `loadState()` and save helpers run without errors in the browser console
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement validation functions
  - [x] 5.1 Implement `validateTransactionForm()`
    - Return `{ valid: false, errors }` if name is empty or whitespace-only (error: "Item name is required.")
    - Return `{ valid: false, errors }` if amount is non-positive or non-numeric (error: "Amount must be a positive number.")
    - Return `{ valid: false, errors }` if category is empty string (error: "Please select a category.")
    - Return `{ valid: true }` when all fields pass
    - _Requirements: 1.3, 1.4, 1.5_

  - [ ]* 5.2 Write property test for whitespace-only names rejected
    - **Property 2: Whitespace-only and empty names are rejected**
    - **Validates: Requirements 1.3**

  - [ ]* 5.3 Write property test for non-positive amounts rejected
    - **Property 3: Non-positive amounts are rejected**
    - **Validates: Requirements 1.4**

  - [x] 5.4 Implement `validateSpendLimit(value)`
    - Return `{ valid: false, error: "Spend limit must be a positive number." }` for zero, negative, or non-numeric input
    - Return `{ valid: true }` for positive numeric input
    - _Requirements: 7.5_

  - [ ]* 5.5 Write property test for invalid spend limit values rejected
    - **Property 12: Invalid spend limit values are rejected**
    - **Validates: Requirements 7.5**

- [ ] 6. Implement core transaction logic and pure helper functions
  - [x] 6.1 Implement `addTransaction(name, amount, category)`
    - Call `validateTransactionForm()`; if invalid, display errors in `#form-error` and return early
    - Create a new transaction object with `id` (via `crypto.randomUUID()` or `Date.now().toString()`), trimmed `name`, numeric `amount`, `category`, and `createdAt: Date.now()`
    - Push to `AppState.transactions`, call `saveTransactions()`, call `renderAll()`
    - Clear `#item-name`, `#item-amount`, `#item-category` and set focus to `#item-name`
    - Clear `#form-error`
    - _Requirements: 1.1, 1.2, 1.6_

  - [ ]* 6.2 Write property test for transaction addition grows list with unique identity
    - **Property 1: Transaction addition grows the list with unique identity**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 6.3 Write property test for form cleared after successful transaction addition
    - **Property 4: Form is cleared after successful transaction addition**
    - **Validates: Requirements 1.6**

  - [x] 6.4 Implement `deleteTransaction(id)`
    - Filter `AppState.transactions` to remove the transaction with the matching `id`
    - Call `saveTransactions()`, call `renderAll()`
    - _Requirements: 2.3, 3.3_

  - [ ]* 6.5 Write property test for delete removes exactly one transaction
    - **Property 7: Delete removes exactly one transaction**
    - **Validates: Requirements 2.3, 3.3**

  - [x] 6.6 Implement `computeBalance(transactions)` pure helper
    - Return the sum of all `amount` values; return `0` for an empty array
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.7 Write property test for balance equals sum of all transaction amounts
    - **Property 5: Balance equals sum of all transaction amounts**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [x] 6.8 Implement `aggregateByCategory(transactions)` pure helper
    - Return an object mapping each category to the sum of its transaction amounts
    - _Requirements: 4.1, 4.2_

  - [ ]* 6.9 Write property test for category totals correctly aggregated
    - **Property 9: Category totals are correctly aggregated**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 6.10 Implement `sortTransactions(transactions, sortOrder)` pure helper
    - Operate on a shallow copy — never mutate the input array
    - `'default'`: sort by `createdAt` ascending
    - `'amount-asc'`: sort by `amount` ascending
    - `'amount-desc'`: sort by `amount` descending
    - `'category-az'`: sort by `category` lexicographically
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.11 Write property test for sorting correct and non-mutating
    - **Property 10: Sorting is correct and does not mutate stored data**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

  - [x] 6.12 Implement `computeOverLimitIds(transactions, spendLimit)` pure helper
    - Return a `Set` of transaction IDs whose category total exceeds `spendLimit`
    - Return an empty `Set` when `spendLimit` is `null`
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]* 6.13 Write property test for spend limit highlighting consistency
    - **Property 11: Spend limit highlighting consistency**
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [ ] 7. Checkpoint — verify core logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement render functions
  - [x] 8.1 Implement `renderBalance()`
    - Read `computeBalance(AppState.transactions)` and update `#balance-display` with the formatted value (e.g., `$0.00`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 8.2 Implement `renderList()`
    - Call `sortTransactions(AppState.transactions, AppState.sortOrder)` to get the display copy
    - Call `computeOverLimitIds(AppState.transactions, AppState.spendLimit)` to get the over-limit set
    - Clear `#transaction-list` and rebuild `<li>` elements for each transaction
    - Each `<li>` must show: item name, formatted amount, category, and a delete button with the transaction ID as a data attribute
    - Apply `.over-limit` class to `<li>` elements whose ID is in the over-limit set
    - Show `#empty-state` when the list is empty; hide it otherwise
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 7.2, 7.3, 7.4_

  - [ ]* 8.3 Write property test for transaction card renders all required fields
    - **Property 8: Transaction card renders all required fields**
    - **Validates: Requirements 2.4**

  - [x] 8.4 Implement `renderChart()`
    - Aggregate transactions by category using `aggregateByCategory()`
    - If no transactions exist: hide `#spending-chart`, show `#chart-placeholder`, and return
    - If `AppState.chart` is `null` and `Chart` is available: create a new `Chart` instance on `#spending-chart` (type `'pie'`) and store it in `AppState.chart`
    - If `AppState.chart` already exists: update `chart.data.labels`, `chart.data.datasets[0].data`, and call `chart.update()`
    - If `Chart` constructor is unavailable: show `"Chart unavailable."` in `#chart-placeholder`
    - Show `#spending-chart` and hide `#chart-placeholder` when transactions exist
    - Use `CATEGORY_COLORS` for dataset background colours
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 8.5 Implement `renderAll()`
    - Call `renderBalance()`, `renderList()`, `renderChart()` in sequence
    - _Requirements: 2.3, 3.2, 3.3, 4.2_

- [x] 9. Implement state-mutating action functions and theme toggle
  - [x] 9.1 Implement `setSpendLimit(value)`
    - Call `validateSpendLimit(value)`; if invalid, display error in `#limit-error` and return early
    - Set `AppState.spendLimit` to the parsed numeric value, call `saveSpendLimit()`, call `renderAll()`
    - Clear `#limit-error` on success
    - _Requirements: 7.1, 7.4, 7.5_

  - [x] 9.2 Implement `setSortOrder(order)`
    - Set `AppState.sortOrder` to the selected value, call `renderList()` only (balance and chart are unaffected)
    - _Requirements: 6.1, 6.2_

  - [x] 9.3 Implement `toggleTheme()`
    - Flip `AppState.theme` between `'light'` and `'dark'`
    - Set `document.documentElement.setAttribute('data-theme', AppState.theme)`
    - Call `saveTheme()`
    - Update the `#theme-toggle` button label to reflect the new state
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 9.4 Write property test for theme toggle round-trip and DOM synchronisation
    - **Property 13: Theme toggle round-trip and DOM synchronisation**
    - **Validates: Requirements 8.1, 8.2**

- [x] 10. Implement `init()` and wire all event listeners
  - [x] 10.1 Implement `init()`
    - Call `loadState()` to populate `AppState` from Local Storage
    - Apply the restored theme: set `document.documentElement.setAttribute('data-theme', AppState.theme)` and update the toggle button label
    - Populate `#spend-limit-input` with the current `AppState.spendLimit` if set
    - Set `#sort-select` value to `AppState.sortOrder`
    - Call `renderAll()` to build the initial UI
    - _Requirements: 2.1, 3.1, 5.3, 5.6, 8.3, 8.4_

  - [x] 10.2 Attach event listeners
    - `#transaction-form` `submit` → call `addTransaction()` with current field values (prevent default)
    - `#set-limit-btn` `click` → call `setSpendLimit()` with `#spend-limit-input` value
    - `#sort-select` `change` → call `setSortOrder()` with the selected value
    - `#theme-toggle` `click` → call `toggleTheme()`
    - `#transaction-list` `click` (event delegation) → if target has a delete data attribute, call `deleteTransaction(id)`
    - Clear `#form-error` on `input` events for `#item-name`, `#item-amount`, `#item-category`
    - Clear `#limit-error` on `input` event for `#spend-limit-input`
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.3, 6.1, 7.1, 8.1_

  - [x] 10.3 Call `init()` at the bottom of the IIFE (or via `DOMContentLoaded`)
    - _Requirements: 2.1, 5.3, 5.6, 8.3_

- [x] 11. Final checkpoint — full integration verification
  - Open `index.html` directly in a browser (no server required)
  - Verify: add a transaction → list updates, balance updates, chart updates
  - Verify: delete a transaction → all dependent UI updates
  - Verify: set a spend limit → `.over-limit` highlights appear on correct cards
  - Verify: sort dropdown changes list order without affecting stored data
  - Verify: theme toggle switches appearance and persists across page reload
  - Verify: page reload restores all transactions, spend limit, and theme from Local Storage
  - Verify: mobile layout at 375px and desktop layout at 1280px
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical milestones
- Property tests validate universal correctness properties (Properties 1–14 from the design)
- Unit tests validate specific scenarios and edge cases (see design Testing Strategy section)
- All pure helper functions (`computeBalance`, `aggregateByCategory`, `sortTransactions`, `computeOverLimitIds`) should be extracted to make them independently testable without a DOM
