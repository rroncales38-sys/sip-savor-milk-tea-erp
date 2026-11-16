// Sip & Savor ERP simulation. Plain JavaScript, data saved in the browser (localStorage).
const KEY = "sipsavor-erp-v2";
const peso = n => "₱" + Math.round(n).toLocaleString("en-PH");
let S = load();   // S = whole system state
let cart = {};    // productId -> qty
let view = "dashboard";

function fresh() {
  const st = { ingredients: JSON.parse(JSON.stringify(SEED.ingredients)), sales: [], pos: [], journal: [], seq: 1 };
  // Demo history for the past 6 days so the dashboard chart is not empty (daily summaries, no item detail)
  [14200, 15800, 13900, 16500, 19800, 24300].forEach((total, i) => {
    const ago = 6 - i, d = new Date(Date.now() - ago * 86400000), cogs = total * 0.33;
    st.sales.push({ no: "D" + ago, total, cogs, method: "Cash", time: d.getTime(), lines: {} });
    st.journal.push({ n: 0, t: d.toLocaleString("en-PH"), desc: "Daily sales summary (demo history)", dr: "Cash", cr: "Sales", amt: total });
  });
  return st;
}
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { return fresh(); } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
const ing = id => S.ingredients.find(i => i.id === id);
const prod = id => SEED.products.find(p => p.id === id);
const low = i => i.stock < i.reorder;
function toast(msg, err) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.className = "show" + (err ? " err" : "");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.className = "", 2600);
}
function post(desc, dr, cr, amt) { S.journal.unshift({ n: S.journal.length + 1, t: new Date().toLocaleString("en-PH"), desc, dr, cr, amt }); }

// ---- POS: pay = deduct ingredients by recipe (BOM) + post journal entries ----
function checkout(method) {
  const items = Object.entries(cart);
  if (!items.length) return toast("Add at least one drink first.", true);
  const need = {};
  items.forEach(([id, q]) => Object.entries(prod(id).bom).forEach(([k, g]) => need[k] = (need[k] || 0) + g * q));
  const short = Object.keys(need).filter(k => ing(k).stock < need[k]);
  if (short.length) return toast("Not enough stock: " + short.map(k => ing(k).name).join(", ") + ". Request a purchase.", true);
  let total = 0, cogs = 0;
  items.forEach(([id, q]) => total += prod(id).price * q);
  Object.entries(need).forEach(([k, q]) => { ing(k).stock -= q; cogs += q * ing(k).cost; });
  const no = String(S.seq++).padStart(5, "0");
  S.sales.push({ no, total, cogs, method, time: Date.now(), lines: Object.assign({}, cart) });
  post("Sale #" + no + " (" + method + ")", method, "Sales", total);
  post("Cost of goods, sale #" + no, "COGS", "Inventory", cogs);
  cart = {}; save(); render();
  toast("Order #" + no + " paid by " + method + ": " + peso(total) + ". Stock deducted automatically.");
}

// ---- Views ----
function viewPOS() {
  const total = Object.entries(cart).reduce((s, [id, q]) => s + prod(id).price * q, 0);
  const lines = Object.entries(cart).map(([id, q]) => `<div class="line"><span>${q}× ${prod(id).name}</span><span>${peso(prod(id).price * q)}
    <button data-action="minus" data-id="${id}" aria-label="Remove one">−</button></span></div>`).join("") || '<p class="empty">Tap a drink to start an order.</p>';
  return `<h2>Point of Sale</h2><div class="pos">
    <div class="tiles">${SEED.products.map(p => `<button class="tile" style="background:${p.color}" data-action="add" data-id="${p.id}"><b>${p.name}</b>${peso(p.price)}</button>`).join("")}</div>
    <aside class="ticket"><h3>Order #${String(S.seq).padStart(5, "0")}</h3>${lines}
      <div class="total"><span>TOTAL</span><span>${peso(total)}</span></div>
      <button class="pay cash" data-action="pay" data-m="Cash">Pay – Cash</button>
      <button class="pay gcash" data-action="pay" data-m="GCash">Pay – GCash</button></aside></div>`;
}
function viewInventory() {
  return `<h2>Inventory Overview</h2><div class="wrap"><table><tr><th>Ingredient</th><th>On hand</th><th>Reorder point</th><th>Status</th><th></th></tr>
  ${S.ingredients.map(i => {
    const pending = S.pos.some(p => p.ing === i.id && p.status === "Requested");
    return `<tr><td>${i.name}</td><td>${Math.round(i.stock).toLocaleString()} ${i.unit}</td><td>${i.reorder.toLocaleString()} ${i.unit}</td>
    <td><span class="tag ${low(i) ? "low" : "ok"}">${low(i) ? "Low" : "OK"}</span></td>
    <td>${low(i) && !pending ? `<button class="act" data-action="request" data-id="${i.id}">Request purchase</button>` : pending ? "Requested" : ""}</td></tr>`;
  }).join("")}</table></div><p class="note">Items below the reorder point are flagged. Selling a drink reduces stock using its recipe.</p>`;
}
function viewPurchasing() {
  const rows = S.pos.map(p => `<tr><td>PO-${String(p.id).padStart(3, "0")}</td><td>${ing(p.ing).name}</td><td>${p.qty.toLocaleString()} ${ing(p.ing).unit}</td><td>${peso(p.amount)}</td>
    <td><span class="tag ${p.status === "Requested" ? "req" : "rec"}">${p.status}</span></td>
    <td>${p.status === "Requested" ? `<button class="act" data-action="receive" data-id="${p.id}">Receive goods</button>` : p.paid ? "Paid" : `<button class="act" data-action="paybill" data-id="${p.id}">Pay supplier</button>`}</td></tr>`).join("");
  return `<h2>Purchasing</h2>${rows ? `<div class="wrap"><table><tr><th>PO</th><th>Item</th><th>Quantity</th><th>Amount</th><th>Status</th><th></th></tr>${rows}</table></div>` : '<p class="empty">No purchase orders yet. Request one from Inventory when an item is low.</p>'}
  <p class="note">Flow: request, receive goods (stock goes up, bill is recorded), pay supplier.</p>`;
}
function viewAccounting() {
  const sales = S.sales.reduce((s, x) => s + x.total, 0), cogs = S.sales.reduce((s, x) => s + x.cogs, 0);
  const due = S.pos.filter(p => p.status === "Received" && !p.paid).reduce((s, p) => s + p.amount, 0);
  const k = (t, v, c) => `<div class="kpi" style="--c:${c}"><small>${t}</small><b>${peso(v)}</b></div>`;
  const rows = S.journal.slice(0, 15).map(j => `<tr><td>${j.t}</td><td>${j.desc}</td><td>${j.dr}</td><td>${j.cr}</td><td>${peso(j.amt)}</td></tr>`).join("");
  return `<h2>Accounting Dashboard</h2><div class="kpis">${k("Total Sales", sales, "#7A9E6B")}${k("Cost of Goods", cogs, "#C8873A")}${k("Gross Profit", sales - cogs, "#5B86A8")}${k("Payables Due", due, "#9B7FB5")}</div>
  <h2>Journal Entries (latest 15)</h2>${rows ? `<div class="wrap"><table><tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Amount</th></tr>${rows}</table></div>` : '<p class="empty">No entries yet. Complete a sale in Point of Sale.</p>'}`;
}
function sameDay(t, d) { return new Date(t).toDateString() === d.toDateString(); }
function viewDashboard() {
  const k = (t, v, c) => `<div class="kpi" style="--c:${c}"><small>${t}</small><b>${v}</b></div>`;
  const now = new Date(), today = S.sales.filter(x => sameDay(x.time, now));
  const days = [6, 5, 4, 3, 2, 1, 0].map(n => { const d = new Date(Date.now() - n * 86400000);
    return { label: d.toLocaleDateString("en-US", { weekday: "short" }), v: S.sales.filter(x => sameDay(x.time, d)).reduce((s, x) => s + x.total, 0) }; });
  const max = Math.max(...days.map(d => d.v), 1);
  const lowItems = S.ingredients.filter(low);
  const due = S.pos.filter(p => p.status === "Received" && !p.paid).reduce((s, p) => s + p.amount, 0);
  return `<h2>Dashboard</h2><div class="kpis">${k("Today's Sales", peso(today.reduce((s, x) => s + x.total, 0)), "#7A9E6B")}${k("Orders Today", today.length, "#C8873A")}
    ${k("Low-Stock Items", lowItems.length, "#C0504D")}${k("Payables Due", peso(due), "#9B7FB5")}</div>
  <h2>Sales, last 7 days</h2><div class="chart">${days.map(d => `<div class="col"><span>${d.v ? peso(d.v) : "–"}</span><div class="cbar" style="height:${d.v / max * 100}%"></div><small>${d.label}</small></div>`).join("")}</div>
  <h2>Needs attention</h2>${lowItems.length ? `<p>${lowItems.map(i => `<span class="tag low">${i.name}</span>`).join(" ")}</p><p class="note">Open Inventory to request a purchase.</p>` : '<p class="empty">All ingredients are above their reorder points.</p>'}
  <p class="note">The first six days are demo history; today's bar grows as you complete sales.</p>`;
}
function viewReports() {
  const sales = S.sales.reduce((s, x) => s + x.total, 0), cogs = S.sales.reduce((s, x) => s + x.cogs, 0);
  const byP = {}, byM = {};
  S.sales.forEach(x => { byM[x.method] = (byM[x.method] || 0) + x.total;
    Object.entries(x.lines || {}).forEach(([id, q]) => { const r = byP[id] = byP[id] || { q: 0, rev: 0 }; r.q += q; r.rev += q * prod(id).price; }); });
  const prows = Object.entries(byP).sort((a, b) => b[1].rev - a[1].rev).map(([id, r]) => `<tr><td>${prod(id).name}</td><td>${r.q}</td><td>${peso(r.rev)}</td></tr>`).join("");
  const val = S.ingredients.reduce((s, i) => s + i.stock * i.cost, 0);
  return `<h2>Reports</h2><button class="act" data-action="csv">Download sales report (CSV)</button>
  <h2 class="sub">Profit summary</h2><div class="wrap"><table><tr><th>Total sales</th><th>Cost of goods</th><th>Gross profit</th><th>Margin</th></tr>
    <tr><td>${peso(sales)}</td><td>${peso(cogs)}</td><td>${peso(sales - cogs)}</td><td>${sales ? Math.round((sales - cogs) / sales * 100) : 0}%</td></tr></table></div>
  <h2 class="sub">Sales by product</h2>${prows ? `<div class="wrap"><table><tr><th>Product</th><th>Cups sold</th><th>Revenue</th></tr>${prows}</table></div>` : '<p class="empty">No product sales yet. Complete a sale in Point of Sale.</p>'}
  <h2 class="sub">Sales by payment method</h2><div class="wrap"><table><tr><th>Method</th><th>Amount</th></tr>${Object.entries(byM).map(([m, v]) => `<tr><td>${m}</td><td>${peso(v)}</td></tr>`).join("")}</table></div>
  <h2 class="sub">Inventory value</h2><p>Stock on hand is worth <b>${peso(val)}</b> at cost.</p>`;
}
function downloadCSV() {
  const rows = [["Date", "Sale no", "Payment", "Total (PHP)", "Cost of goods (PHP)"]].concat(S.sales.map(x => [new Date(x.time).toLocaleString("en-PH"), x.no, x.method, Math.round(x.total), Math.round(x.cogs)]));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => '"' + c + '"').join(",")).join("\n")], { type: "text/csv" }));
  a.download = "sales-report.csv"; a.click(); toast("Sales report downloaded.");
}
const VIEWS = { dashboard: viewDashboard, pos: viewPOS, inventory: viewInventory, purchasing: viewPurchasing, accounting: viewAccounting, reports: viewReports };
const TITLES = { dashboard: "Dashboard", pos: "Point of Sale", inventory: "Inventory", purchasing: "Purchasing", accounting: "Accounting", reports: "Reports" };
function render() {
  document.getElementById("view").innerHTML = VIEWS[view]();
  document.getElementById("page-title").textContent = TITLES[view];
  document.querySelectorAll("#menu [data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === view));
}

// ---- Click handling ----
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const id = b.dataset.id, a = b.dataset.action;
  if (b.dataset.view) { view = b.dataset.view; return render(); }
  if (a === "add") cart[id] = (cart[id] || 0) + 1;
  else if (a === "minus") { cart[id]--; if (cart[id] <= 0) delete cart[id]; }
  else if (a === "pay") return checkout(b.dataset.m);
  else if (a === "csv") return downloadCSV();
  else if (a === "request") {
    const i = ing(id), qty = i.reorder * 2;
    S.pos.push({ id: S.pos.length + 1, ing: id, qty, amount: qty * i.cost, status: "Requested", paid: false });
    toast("Purchase request created for " + i.name + ".");
  } else if (a === "receive") {
    const p = S.pos.find(x => x.id == id); ing(p.ing).stock += p.qty; p.status = "Received";
    post("Goods received: " + ing(p.ing).name, "Inventory", "Accounts Payable", p.amount); toast("Goods received. Stock updated and supplier bill recorded.");
  } else if (a === "paybill") {
    const p = S.pos.find(x => x.id == id); p.paid = true;
    post("Supplier paid: PO-" + String(p.id).padStart(3, "0"), "Accounts Payable", "Cash", p.amount); toast("Supplier bill paid.");
  } else if (a === "reset") {
    if (!confirm("Reset all demo data to the starting values?")) return;
    S = fresh(); cart = {}; toast("Demo data reset.");
  } else return;
  save(); render();
});
render();