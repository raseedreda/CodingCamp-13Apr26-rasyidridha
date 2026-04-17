(function () {
  // ── State ──────────────────────────────────────────────────────────────────

  const AppState = {
    transactions: [],
    spendLimit: null,
    sortOrder: 'default',
    theme: 'light',
    chart: null,
  };

  // ── Constants ──────────────────────────────────────────────────────────────

  const CATEGORY_COLORS = {
    Food:      '#FF6384',
    Transport: '#36A2EB',
    Fun:       '#FFCE56',
  };

  // ── Local Storage helpers ──────────────────────────────────────────────────

  function saveTransactions() {
    try {
      localStorage.setItem('ebv_transactions', JSON.stringify(AppState.transactions));
    } catch (_) {
      // Storage unavailable — continue in-memory
    }
  }

  function saveSpendLimit() {
    try {
      if (AppState.spendLimit === null) {
        localStorage.removeItem('ebv_spend_limit');
      } else {
        localStorage.setItem('ebv_spend_limit', String(AppState.spendLimit));
      }
    } catch (_) {
      // Storage unavailable — continue in-memory
    }
  }

  function saveTheme() {
    try {
      localStorage.setItem('ebv_theme', AppState.theme);
    } catch (_) {
      // Storage unavailable — continue in-memory
    }
  }

  function loadState() {
    try {
      // Guard: check Local Storage is accessible
      if (typeof localStorage === 'undefined' || localStorage === null) {
        console.warn('Local Storage is unavailable.');
        return;
      }

      // Transactions
      const rawTransactions = localStorage.getItem('ebv_transactions');
      if (rawTransactions !== null) {
        try {
          AppState.transactions = JSON.parse(rawTransactions);
        } catch (_) {
          // Corrupt data — discard and clear
          AppState.transactions = [];
          localStorage.removeItem('ebv_transactions');
        }
      }

      // Spend limit
      const rawLimit = localStorage.getItem('ebv_spend_limit');
      if (rawLimit !== null) {
        const parsed = parseFloat(rawLimit);
        if (!isNaN(parsed)) {
          AppState.spendLimit = parsed;
        }
      }

      // Theme
      const rawTheme = localStorage.getItem('ebv_theme');
      if (rawTheme === 'light' || rawTheme === 'dark') {
        AppState.theme = rawTheme;
      }
    } catch (err) {
      console.warn('Failed to load state from Local Storage:', err);
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  /**
   * Validates the transaction form fields.
   *
   * @param {{ name?: string, amount?: string|number, category?: string }} [fields]
   *   Optional object with field values. If omitted, values are read from the DOM.
   * @returns {{ valid: true } | { valid: false, errors: string[] }}
   */
  function validateTransactionForm(fields) {
    let name, amount, category;

    if (fields !== undefined) {
      name     = fields.name;
      amount   = fields.amount;
      category = fields.category;
    } else {
      const nameEl     = document.getElementById('item-name');
      const amountEl   = document.getElementById('item-amount');
      const categoryEl = document.getElementById('item-category');
      name     = nameEl     ? nameEl.value     : '';
      amount   = amountEl   ? amountEl.value   : '';
      category = categoryEl ? categoryEl.value : '';
    }

    const errors = [];

    // Validate name: must be non-empty and not whitespace-only
    if (typeof name !== 'string' || name.trim() === '') {
      errors.push('Item name is required.');
    }

    // Validate amount: must be numeric and positive (> 0)
    const parsedAmount = Number(amount);
    if (amount === '' || amount === null || amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.push('Amount must be a positive number.');
    }

    // Validate category: must not be empty string
    if (typeof category !== 'string' || category === '') {
      errors.push('Please select a category.');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Validates a spend limit value.
   *
   * @param {*} value - The value to validate (typically from an input field).
   * @returns {{ valid: true } | { valid: false, error: string }}
   */
  function validateSpendLimit(value) {
    const parsed = Number(value);
    if (value === '' || value === null || value === undefined || isNaN(parsed) || parsed <= 0) {
      return { valid: false, error: 'Spend limit must be a positive number.' };
    }
    return { valid: true };
  }

  // ── Pure helpers ───────────────────────────────────────────────────────────

  /**
   * Returns the sum of all transaction amounts, or 0 for an empty array.
   * @param {Array} transactions
   * @returns {number}
   */
  function computeBalance(transactions) {
    return transactions.reduce(function (sum, t) { return sum + t.amount; }, 0);
  }

  /**
   * Returns an object mapping each category to the sum of its transaction amounts.
   * @param {Array} transactions
   * @returns {Object}
   */
  function aggregateByCategory(transactions) {
    return transactions.reduce(function (acc, t) {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  }

  /**
   * Returns a sorted shallow copy of transactions for the given sort order.
   * Never mutates the input array.
   * @param {Array} transactions
   * @param {string} sortOrder
   * @returns {Array}
   */
  function sortTransactions(transactions, sortOrder) {
    const copy = transactions.slice();
    switch (sortOrder) {
      case 'amount-asc':
        copy.sort(function (a, b) { return a.amount - b.amount; });
        break;
      case 'amount-desc':
        copy.sort(function (a, b) { return b.amount - a.amount; });
        break;
      case 'category-az':
        copy.sort(function (a, b) { return a.category < b.category ? -1 : a.category > b.category ? 1 : 0; });
        break;
      default: // 'default': ascending createdAt
        copy.sort(function (a, b) { return a.createdAt - b.createdAt; });
        break;
    }
    return copy;
  }

  /**
   * Returns a Set of transaction IDs whose category total exceeds spendLimit.
   * Returns an empty Set when spendLimit is null.
   * @param {Array} transactions
   * @param {number|null} spendLimit
   * @returns {Set}
   */
  function computeOverLimitIds(transactions, spendLimit) {
    if (spendLimit === null) return new Set();
    const totals = aggregateByCategory(transactions);
    return new Set(
      transactions
        .filter(function (t) { return totals[t.category] > spendLimit; })
        .map(function (t) { return t.id; })
    );
  }

  // ── Render functions ───────────────────────────────────────────────────────

  function renderBalance() {
    const el = document.getElementById('balance-display');
    if (el) {
      const total = computeBalance(AppState.transactions);
      el.textContent = '$' + total.toFixed(2);
    }
  }

  function renderList() {
    const listEl      = document.getElementById('transaction-list');
    const emptyEl     = document.getElementById('empty-state');
    if (!listEl) return;

    const sorted      = sortTransactions(AppState.transactions, AppState.sortOrder);
    const overLimitIds = computeOverLimitIds(AppState.transactions, AppState.spendLimit);

    listEl.innerHTML = '';

    if (sorted.length === 0) {
      if (emptyEl) emptyEl.style.display = '';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    sorted.forEach(function (t) {
      const li = document.createElement('li');
      if (overLimitIds.has(t.id)) li.classList.add('over-limit');

      li.innerHTML =
        '<span class="transaction-name">'     + escapeHtml(t.name)     + '</span>' +
        '<span class="transaction-amount">$'  + t.amount.toFixed(2)    + '</span>' +
        '<span class="transaction-category">' + escapeHtml(t.category) + '</span>' +
        '<button class="transaction-delete" data-id="' + escapeHtml(t.id) + '" aria-label="Delete ' + escapeHtml(t.name) + '">Delete</button>';

      listEl.appendChild(li);
    });
  }

  function renderChart() {
    const canvas      = document.getElementById('spending-chart');
    const placeholder = document.getElementById('chart-placeholder');

    if (!canvas) return;

    const totals = aggregateByCategory(AppState.transactions);
    const labels = Object.keys(totals);
    const data   = labels.map(function (l) { return totals[l]; });

    if (labels.length === 0) {
      canvas.style.display      = 'none';
      if (placeholder) {
        placeholder.style.display = '';
        placeholder.textContent   = 'No transactions yet.';
      }
      return;
    }

    canvas.style.display = '';
    if (placeholder) placeholder.style.display = 'none';

    const colors = labels.map(function (l) { return CATEGORY_COLORS[l] || '#cccccc'; });

    if (typeof Chart === 'undefined') {
      if (placeholder) {
        placeholder.style.display = '';
        placeholder.textContent   = 'Chart unavailable.';
      }
      canvas.style.display = 'none';
      return;
    }

    if (AppState.chart === null) {
      AppState.chart = new Chart(canvas, {
        type: 'pie',
        data: {
          labels:   labels,
          datasets: [{ data: data, backgroundColor: colors }],
        },
      });
    } else {
      AppState.chart.data.labels                    = labels;
      AppState.chart.data.datasets[0].data          = data;
      AppState.chart.data.datasets[0].backgroundColor = colors;
      AppState.chart.update();
    }
  }

  function renderAll() {
    renderBalance();
    renderList();
    renderChart();
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Core transaction actions ───────────────────────────────────────────────

  /**
   * Validates the form, creates a new transaction, persists it, re-renders,
   * and resets the form fields.
   *
   * @param {string} name
   * @param {string|number} amount
   * @param {string} category
   */
  function addTransaction(name, amount, category) {
    const formErrorEl = document.getElementById('form-error');

    const validation = validateTransactionForm({ name: name, amount: amount, category: category });

    if (!validation.valid) {
      if (formErrorEl) formErrorEl.textContent = validation.errors.join(' ');
      return;
    }

    const transaction = {
      id:        (typeof crypto !== 'undefined' && crypto.randomUUID)
                   ? crypto.randomUUID()
                   : Date.now().toString(),
      name:      String(name).trim(),
      amount:    Number(amount),
      category:  category,
      createdAt: Date.now(),
    };

    AppState.transactions.push(transaction);
    saveTransactions();
    renderAll();

    // Clear form fields and reset focus
    const nameEl     = document.getElementById('item-name');
    const amountEl   = document.getElementById('item-amount');
    const categoryEl = document.getElementById('item-category');

    if (nameEl)     { nameEl.value     = ''; }
    if (amountEl)   { amountEl.value   = ''; }
    if (categoryEl) { categoryEl.value = ''; }
    if (nameEl)     { nameEl.focus(); }

    // Clear any previous form error
    if (formErrorEl) formErrorEl.textContent = '';
  }

  /**
   * Removes the transaction with the given id, persists, and re-renders.
   * @param {string} id
   */
  function deleteTransaction(id) {
    AppState.transactions = AppState.transactions.filter(function (t) { return t.id !== id; });
    saveTransactions();
    renderAll();
  }

  // ── Spend limit and sort ───────────────────────────────────────────────────

  function setSpendLimit(value) {
    const limitErrorEl = document.getElementById('limit-error');
    const validation   = validateSpendLimit(value);

    if (!validation.valid) {
      if (limitErrorEl) limitErrorEl.textContent = validation.error;
      return;
    }

    AppState.spendLimit = Number(value);
    saveSpendLimit();
    renderAll();
    if (limitErrorEl) limitErrorEl.textContent = '';
  }

  function setSortOrder(order) {
    AppState.sortOrder = order;
    renderList();
  }

  function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    saveTheme();
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = AppState.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    loadState();

    // Apply restored theme
    document.documentElement.setAttribute('data-theme', AppState.theme);
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.textContent = AppState.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';

    // Restore spend limit input
    const limitInput = document.getElementById('spend-limit-input');
    if (limitInput && AppState.spendLimit !== null) limitInput.value = AppState.spendLimit;

    // Restore sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = AppState.sortOrder;

    renderAll();

    // ── Event listeners ──────────────────────────────────────────────────────

    const form = document.getElementById('transaction-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const nameEl     = document.getElementById('item-name');
        const amountEl   = document.getElementById('item-amount');
        const categoryEl = document.getElementById('item-category');
        addTransaction(
          nameEl     ? nameEl.value     : '',
          amountEl   ? amountEl.value   : '',
          categoryEl ? categoryEl.value : ''
        );
      });
    }

    const setLimitBtn = document.getElementById('set-limit-btn');
    if (setLimitBtn) {
      setLimitBtn.addEventListener('click', function () {
        const limitInput = document.getElementById('spend-limit-input');
        setSpendLimit(limitInput ? limitInput.value : '');
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        setSortOrder(sortSelect.value);
      });
    }

    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    const transactionList = document.getElementById('transaction-list');
    if (transactionList) {
      transactionList.addEventListener('click', function (e) {
        const id = e.target.dataset.id;
        if (id) deleteTransaction(id);
      });
    }

    // Clear errors on input
    ['item-name', 'item-amount', 'item-category'].forEach(function (elId) {
      const el = document.getElementById(elId);
      if (el) {
        el.addEventListener('input', function () {
          const errEl = document.getElementById('form-error');
          if (errEl) errEl.textContent = '';
        });
      }
    });

    const limitInputEl = document.getElementById('spend-limit-input');
    if (limitInputEl) {
      limitInputEl.addEventListener('input', function () {
        const errEl = document.getElementById('limit-error');
        if (errEl) errEl.textContent = '';
      });
    }
  }

  // Kick off the app
  init();

})();
