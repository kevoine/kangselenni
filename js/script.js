// BudgetBuddy: shared beginner-friendly JavaScript for all pages.
const STORAGE_KEY = "budgetBuddyData";
const today = new Date().toISOString().slice(0, 10);
const money = (amount) => "₱" + Number(amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved || { allowances: [], expenses: [], walletStart: 0, walletTransactions: [] };
  } catch (error) {
    return { allowances: [], expenses: [], walletStart: 0, walletTransactions: [] };
  }
}
let data = loadData();
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function allowanceFor(date) { return data.allowances.find(item => item.date === date); }
function expensesFor(date) { return data.expenses.filter(item => item.date === date); }
function total(items) { return items.reduce((sum, item) => sum + Number(item.amount), 0); }
function walletBalance() {
  return Number(data.walletStart || 0) + data.walletTransactions.reduce((sum, item) => sum + (item.type === "Add" ? Number(item.amount) : -Number(item.amount)), 0);
}
function showMessage(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", isError);
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function formatDate(date) {
  if (!date) return "—";
  return new Date(date + "T12:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function setEmpty(emptyId, hasItems) {
  const el = document.getElementById(emptyId);
  if (el) el.classList.toggle("hidden", hasItems);
}
function addRowActions(id, type) {
  return `<div class="table-actions"><button class="small-button" data-action="edit" data-type="${type}" data-id="${id}">Edit</button><button class="small-button delete" data-action="delete" data-type="${type}" data-id="${id}">Delete</button></div>`;
}
function renderDashboard() {
  const allowance = allowanceFor(today)?.amount || 0;
  const spent = total(expensesFor(today));
  const remaining = Number(allowance) - spent;
  document.getElementById("todayAllowance").textContent = money(allowance);
  document.getElementById("todayExpenses").textContent = money(spent);
  document.getElementById("todayRemaining").textContent = money(remaining);
  document.getElementById("walletBalance").textContent = money(walletBalance());
  const percent = allowance > 0 ? Math.min(100, Math.round(spent / allowance * 100)) : 0;
  document.getElementById("todayPercent").textContent = percent + "%";
  document.getElementById("todayDonut").style.background = `conic-gradient(var(--chambray) ${percent * 3.6}deg, var(--blush) 0deg 360deg)`;
  document.getElementById("spendingCaption").textContent = allowance > 0 ? `${money(spent)} spent out of ${money(allowance)} today.` : "Add an allowance and expenses to see your progress.";
  const recent = [...data.expenses].sort((a, b) => b.created - a.created).slice(0, 5);
  const list = document.getElementById("recentTransactions");
  list.innerHTML = recent.length ? recent.map(item => `<div class="transaction-item"><span class="transaction-icon">◈</span><div class="transaction-main"><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.category)} · ${formatDate(item.date)}</small></div><span class="transaction-amount">${money(item.amount)}</span></div>`).join("") : `<p class="empty-state">No transactions yet. Add an expense to get started.</p>`;
}
let editingAllowance = null;
function renderAllowances() {
  const sorted = [...data.allowances].sort((a, b) => b.date.localeCompare(a.date));
  const rows = document.getElementById("allowanceRows");
  rows.innerHTML = sorted.map(item => `<tr><td>${formatDate(item.date)}</td><td>${money(item.amount)}</td><td>${addRowActions(item.id, "allowance")}</td></tr>`).join("");
  setEmpty("allowanceEmpty", sorted.length > 0);
  const current = allowanceFor(today);
  document.getElementById("currentAllowance").textContent = money(current?.amount || 0);
  document.getElementById("currentAllowanceDate").textContent = current ? formatDate(current.date) : "No allowance saved for today";
  document.getElementById("allowanceRemaining").textContent = money(Number(current?.amount || 0) - total(expensesFor(today)));
}
function resetAllowanceForm() {
  editingAllowance = null;
  document.getElementById("allowanceForm").reset();
  document.getElementById("allowanceDate").value = today;
  document.getElementById("allowanceFormTitle").textContent = "Add New Allowance";
  document.getElementById("allowanceSubmit").textContent = "Save Allowance";
  document.getElementById("allowanceCancel").classList.add("hidden");
}
function initAllowance() {
  document.getElementById("allowanceDate").value = today;
  document.getElementById("allowanceForm").addEventListener("submit", event => {
    event.preventDefault();
    const amount = Number(document.getElementById("allowanceAmount").value);
    const date = document.getElementById("allowanceDate").value;
    if (!Number.isFinite(amount) || amount <= 0 || !date) return showMessage("allowanceMessage", "Enter a valid amount and date.", true);
    const existing = data.allowances.find(item => item.date === date && item.id !== editingAllowance);
    if (existing) return showMessage("allowanceMessage", "An allowance already exists for this date. Edit that entry instead.", true);
    if (editingAllowance) {
      const item = data.allowances.find(item => item.id === editingAllowance);
      if (item) { item.amount = amount; item.date = date; }
    } else data.allowances.push({ id: makeId(), amount, date });
    saveData(); resetAllowanceForm(); renderAllowances(); showMessage("allowanceMessage", "Allowance saved successfully.");
  });
  document.getElementById("allowanceCancel").addEventListener("click", resetAllowanceForm);
  document.getElementById("allowanceRows").addEventListener("click", event => handleRowAction(event, "allowance"));
  renderAllowances();
}
let editingExpense = null;
function renderExpenses() {
  const sorted = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
  document.getElementById("expenseRows").innerHTML = sorted.map(item => `<tr><td>${escapeHTML(item.name)}${item.notes ? `<br><span class="small-muted">${escapeHTML(item.notes)}</span>` : ""}</td><td>${escapeHTML(item.category)}</td><td>${money(item.amount)}</td><td>${formatDate(item.date)}</td><td>${addRowActions(item.id, "expense")}</td></tr>`).join("");
  setEmpty("expenseEmpty", sorted.length > 0);
  document.getElementById("expenseCount").textContent = `${sorted.length} record${sorted.length === 1 ? "" : "s"}`;
  const selectedDate = document.getElementById("expenseDate").value || today;
  document.getElementById("expenseTotal").textContent = money(total(expensesFor(selectedDate)));
  document.getElementById("expenseRemaining").textContent = money(Number(allowanceFor(selectedDate)?.amount || 0) - total(expensesFor(selectedDate)));
}
function resetExpenseForm() {
  editingExpense = null;
  document.getElementById("expenseForm").reset();
  document.getElementById("expenseDate").value = today;
  document.getElementById("expenseFormTitle").textContent = "Add Expense";
  document.getElementById("expenseSubmit").textContent = "Add Expense";
  document.getElementById("expenseCancel").classList.add("hidden");
  renderExpenses();
}
function initExpenses() {
  document.getElementById("expenseDate").value = today;
  document.getElementById("expenseDate").addEventListener("change", renderExpenses);
  document.getElementById("expenseForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = document.getElementById("expenseName").value.trim();
    const amount = Number(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;
    const date = document.getElementById("expenseDate").value;
    const notes = document.getElementById("expenseNotes").value.trim();
    if (!name || !Number.isFinite(amount) || amount <= 0 || !date) return showMessage("expenseMessage", "Enter a name, valid positive amount, and date.", true);
    const item = { name, amount, category, date, notes };
    if (editingExpense) {
      const old = data.expenses.find(exp => exp.id === editingExpense);
      if (old) Object.assign(old, item);
    } else data.expenses.push({ ...item, id: makeId(), created: Date.now() });
    saveData(); resetExpenseForm(); showMessage("expenseMessage", "Expense saved successfully.");
  });
  document.getElementById("expenseCancel").addEventListener("click", resetExpenseForm);
  document.getElementById("expenseRows").addEventListener("click", event => handleRowAction(event, "expense"));
  renderExpenses();
}
function initWallet() {
  document.getElementById("walletStarting").value = data.walletStart || "";
  document.getElementById("walletStartForm").addEventListener("submit", event => {
    event.preventDefault();
    const amount = Number(document.getElementById("walletStarting").value);
    if (!Number.isFinite(amount) || amount < 0) return showMessage("walletStartMessage", "Enter a valid starting balance.", true);
    data.walletStart = amount; saveData(); renderWallet(); showMessage("walletStartMessage", "Starting balance saved.");
  });
  [["walletAddForm", "walletAddAmount", "walletAddName", "Add", "walletAddMessage"], ["walletSpendForm", "walletSpendAmount", "walletSpendName", "Spend", "walletSpendMessage"]].forEach(([formId, amountId, nameId, type, messageId]) => {
    document.getElementById(formId).addEventListener("submit", event => {
      event.preventDefault();
      const amount = Number(document.getElementById(amountId).value);
      const name = document.getElementById(nameId).value.trim();
      if (!Number.isFinite(amount) || amount <= 0 || !name) return showMessage(messageId, "Enter a name and valid positive amount.", true);
      if (type === "Spend" && amount > walletBalance()) return showMessage(messageId, "Not enough tracked wallet balance.", true);
      data.walletTransactions.push({ id: makeId(), name, amount, type, date: today, created: Date.now() });
      saveData(); event.target.reset(); renderWallet(); showMessage(messageId, type === "Add" ? "Money added successfully." : "Wallet spending recorded.");
    });
  });
  renderWallet();
}
function renderWallet() {
  document.getElementById("walletCurrent").textContent = money(walletBalance());
  const sorted = [...data.walletTransactions].sort((a, b) => b.created - a.created);
  document.getElementById("walletRows").innerHTML = sorted.map(item => `<tr><td>${escapeHTML(item.name)}</td><td>${item.type === "Add" ? "Money added" : "Money spent"}</td><td>${item.type === "Add" ? "+" : "−"}${money(item.amount)}</td><td>${formatDate(item.date)}</td></tr>`).join("");
  setEmpty("walletEmpty", sorted.length > 0);
  const activity = total(data.walletTransactions);
  document.getElementById("walletActivityFill").style.width = (activity ? Math.min(100, activity / (activity + Number(data.walletStart || 0)) * 100) : 0) + "%";
}
let summaryMode = "week";
function periodDates(date) {
  const selected = new Date(date + "T12:00:00");
  if (summaryMode === "month") {
    return { start: new Date(selected.getFullYear(), selected.getMonth(), 1), end: new Date(selected.getFullYear(), selected.getMonth() + 1, 0) };
  }
  const day = (selected.getDay() + 6) % 7;
  const start = new Date(selected); start.setDate(selected.getDate() - day);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return { start, end };
}
function dateKey(date) { return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0"); }
function renderSummary() {
  const date = document.getElementById("summaryDate").value || today;
  const { start, end } = periodDates(date);
  const startKey = dateKey(start), endKey = dateKey(end);
  const expenses = data.expenses.filter(item => item.date >= startKey && item.date <= endKey);
  const allowances = data.allowances.filter(item => item.date >= startKey && item.date <= endKey);
  const spent = total(expenses), received = total(allowances);
  document.getElementById("summaryAllowance").textContent = money(received);
  document.getElementById("summaryExpenses").textContent = money(spent);
  document.getElementById("summaryRemaining").textContent = money(received - spent);
  document.getElementById("summaryCount").textContent = `${expenses.length} record${expenses.length === 1 ? "" : "s"}`;
  const rows = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
  document.getElementById("summaryRows").innerHTML = rows.map(item => `<tr><td>${escapeHTML(item.name)}</td><td>${escapeHTML(item.category)}</td><td>${money(item.amount)}</td><td>${formatDate(item.date)}</td></tr>`).join("");
  setEmpty("summaryEmpty", rows.length > 0);
  const categories = ["Food", "Transportation", "School Supplies", "Personal Wants", "Bills", "Others"];
  const colors = ["#7A9CB3", "#d9a4a5", "#8aa997", "#b7a5c8", "#d6b17a", "#b4ada5"];
  const sums = categories.map(category => ({ category, amount: total(expenses.filter(item => item.category === category)) }));
  document.getElementById("categoryBars").innerHTML = sums.map((item, index) => `<div class="category-row"><span>${item.category === "School Supplies" ? "School" : item.category === "Personal Wants" ? "Wants" : item.category}</span><div class="bar-track"><div class="bar-fill" style="width:${spent ? item.amount / spent * 100 : 0}%;background:${colors[index]}"></div></div><span class="category-amount">${money(item.amount)}</span></div>`).join("");
  const percent = received ? Math.min(100, Math.round(spent / received * 100)) : 0;
  document.getElementById("summaryPercent").textContent = percent + "%";
  document.getElementById("summaryDonut").style.background = `conic-gradient(var(--chambray) ${percent * 3.6}deg,var(--blush) 0deg 360deg)`;
  document.getElementById("summaryCaption").textContent = expenses.length ? `${money(spent)} spent from ${money(received)} allowance in this period.` : "No spending recorded for this period.";
}
function handleRowAction(event, type) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id, action = button.dataset.action;
  const collection = type === "allowance" ? data.allowances : data.expenses;
  const item = collection.find(entry => entry.id === id);
  if (!item) return;
  if (action === "delete") {
    if (!confirm("Delete this entry?")) return;
    if (type === "allowance") data.allowances = data.allowances.filter(entry => entry.id !== id);
    else data.expenses = data.expenses.filter(entry => entry.id !== id);
    saveData(); type === "allowance" ? renderAllowances() : renderExpenses();
    showMessage(type === "allowance" ? "allowanceMessage" : "expenseMessage", "Entry deleted.");
  } else if (type === "allowance") {
    editingAllowance = id;
    document.getElementById("allowanceAmount").value = item.amount;
    document.getElementById("allowanceDate").value = item.date;
    document.getElementById("allowanceFormTitle").textContent = "Edit Allowance";
    document.getElementById("allowanceSubmit").textContent = "Update Allowance";
    document.getElementById("allowanceCancel").classList.remove("hidden");
    document.getElementById("allowanceAmount").focus();
  } else {
    editingExpense = id;
    document.getElementById("expenseName").value = item.name;
    document.getElementById("expenseAmount").value = item.amount;
    document.getElementById("expenseCategory").value = item.category;
    document.getElementById("expenseDate").value = item.date;
    document.getElementById("expenseNotes").value = item.notes || "";
    document.getElementById("expenseFormTitle").textContent = "Edit Expense";
    document.getElementById("expenseSubmit").textContent = "Update Expense";
    document.getElementById("expenseCancel").classList.remove("hidden");
    document.getElementById("expenseName").focus();
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle"), nav = document.getElementById("mainNav");
  toggle?.addEventListener("click", () => { const open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", String(open)); });
  const page = document.body.dataset.page;
  if (page === "dashboard") renderDashboard();
  if (page === "allowance") initAllowance();
  if (page === "expenses") initExpenses();
  if (page === "wallet") initWallet();
  if (page === "summary") {
    document.getElementById("summaryDate").value = today;
    document.getElementById("weekButton").addEventListener("click", () => { summaryMode = "week"; document.getElementById("weekButton").classList.add("selected"); document.getElementById("monthButton").classList.remove("selected"); renderSummary(); });
    document.getElementById("monthButton").addEventListener("click", () => { summaryMode = "month"; document.getElementById("monthButton").classList.add("selected"); document.getElementById("weekButton").classList.remove("selected"); renderSummary(); });
    document.getElementById("summaryDate").addEventListener("change", renderSummary);
    renderSummary();
  }
});
