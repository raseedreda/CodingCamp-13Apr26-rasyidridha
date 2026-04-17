# Requirements Document

## Feature: Expense & Budget Visualizer

---

### Requirement 1: Add Transactions

**User Story:** As a user, I want to add expense transactions with a name, amount, and category, so that I can track my spending.

#### Acceptance Criteria

1. WHEN a user submits the transaction form THEN the system SHALL add a new transaction to the list with the provided name, amount, and category
2. WHEN a user submits the form THEN the system SHALL assign a unique ID and a timestamp to the new transaction
3. WHEN a user submits an empty or whitespace-only item name THEN the system SHALL reject the submission and display an inline validation error
4. WHEN a user submits a non-positive or non-numeric amount THEN the system SHALL reject the submission and display an inline validation error
5. WHEN a user submits without selecting a category THEN the system SHALL reject the submission and display an inline validation error
6. WHEN a transaction is successfully added THEN the system SHALL clear the form inputs and reset focus to the name field

---

### Requirement 2: View and Delete Transactions

**User Story:** As a user, I want to view all my transactions in a list and delete individual ones, so that I can manage my expense history.

#### Acceptance Criteria

1. WHEN the app loads THEN the system SHALL display all stored transactions in the transaction list
2. WHEN there are no transactions THEN the system SHALL display an empty-state message
3. WHEN a user clicks the delete button on a transaction card THEN the system SHALL remove that transaction from the list and update all dependent UI (balance, chart, highlights)
4. WHEN a transaction is displayed THEN the system SHALL show the item name, amount, category, and a delete button

---

### Requirement 3: Balance Display

**User Story:** As a user, I want to see my total spending balance, so that I know how much I have spent overall.

#### Acceptance Criteria

1. WHEN the app loads THEN the system SHALL display the sum of all transaction amounts as the total balance
2. WHEN a transaction is added THEN the system SHALL update the balance to reflect the new total
3. WHEN a transaction is deleted THEN the system SHALL update the balance to reflect the new total
4. WHEN there are no transactions THEN the system SHALL display a balance of $0.00

---

### Requirement 4: Pie Chart Visualisation

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. WHEN there are transactions THEN the system SHALL render a Chart.js pie chart showing spending aggregated by category
2. WHEN a transaction is added or deleted THEN the system SHALL update the chart to reflect the current category totals
3. WHEN there are no transactions THEN the system SHALL hide the chart and display a placeholder message
4. WHEN the chart is rendered THEN the system SHALL use distinct colours for each category (Food, Transport, Fun)

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions and settings to be saved between sessions, so that I do not lose my data when I close the browser.

#### Acceptance Criteria

1. WHEN a transaction is added THEN the system SHALL immediately persist it to Local Storage under the key `ebv_transactions`
2. WHEN a transaction is deleted THEN the system SHALL immediately update Local Storage to reflect the removal
3. WHEN the app loads THEN the system SHALL restore all transactions from Local Storage
4. WHEN the spend limit is set THEN the system SHALL persist it to Local Storage under the key `ebv_spend_limit`
5. WHEN the theme is toggled THEN the system SHALL persist the selected theme to Local Storage under the key `ebv_theme`
6. WHEN the app loads THEN the system SHALL restore the spend limit and theme from Local Storage

---

### Requirement 6: Sort Transactions

**User Story:** As a user, I want to sort my transaction list, so that I can view my expenses in a meaningful order.

#### Acceptance Criteria

1. WHEN a user selects a sort order THEN the system SHALL re-render the transaction list in the selected order
2. WHEN sorting is applied THEN the system SHALL NOT mutate the underlying stored transaction array
3. WHEN the sort order is "default" THEN the system SHALL display transactions in insertion order (oldest first)
4. WHEN the sort order is "amount-asc" or "amount-desc" THEN the system SHALL sort by transaction amount
5. WHEN the sort order is "category-az" THEN the system SHALL sort transactions alphabetically by category name

---

### Requirement 7: Spend Limit and Over-Limit Highlighting

**User Story:** As a user, I want to set a per-category spend limit and see which transactions push a category over that limit, so that I can stay within my budget.

#### Acceptance Criteria

1. WHEN a user enters a positive number in the spend limit field and confirms THEN the system SHALL set that value as the active spend limit
2. WHEN a spend limit is active and a category's total exceeds it THEN the system SHALL apply a visual highlight (`.over-limit` class) to all transactions in that category
3. WHEN a category's total does not exceed the spend limit THEN the system SHALL NOT apply the `.over-limit` highlight to transactions in that category
4. WHEN the spend limit is changed THEN the system SHALL re-evaluate and update all highlights immediately
5. WHEN a user enters a non-positive or non-numeric spend limit THEN the system SHALL reject it and display an inline validation error

---

### Requirement 8: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light mode, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN a user clicks the theme toggle button THEN the system SHALL switch between light and dark mode
2. WHEN the theme changes THEN the system SHALL update the `data-theme` attribute on `<html>` to match the selected theme
3. WHEN the app loads THEN the system SHALL apply the last saved theme preference from Local Storage
4. WHEN no theme preference is stored THEN the system SHALL default to light mode

---

### Requirement 9: Responsive Layout

**User Story:** As a user, I want the app to work well on both mobile and desktop screens, so that I can use it on any device.

#### Acceptance Criteria

1. WHEN the viewport is 320px–428px wide THEN the system SHALL display a single-column mobile layout
2. WHEN the viewport is 1024px or wider THEN the system SHALL display an expanded desktop layout
3. WHEN the layout changes between breakpoints THEN the system SHALL maintain full functionality and readability
