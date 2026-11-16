# Sip & Savor Milk Tea – ERP Simulation Website

Course: IS 112 – Enterprise Resource Planning
Project: ERP Implementation Simulation for a Local Milk-Tea Shop

## Folder structure
```
milk-tea-erp/
├── index.html      page layout (title bar, side menu, content area)
├── css/style.css   design (brown / cream / caramel theme from our mock-ups)
├── js/data.js      starting data: ingredients, stock, prices, recipes (BOM)
├── js/app.js       system logic: dashboard, POS, inventory, purchasing, accounting, reports
└── README.md       this file
```

## How to run
Double-click `index.html`. No installation or internet is needed.

## What it demonstrates (integration between modules)
1. **Dashboard** – today's sales, orders, low-stock items, payables, and a 7-day sales chart.
2. **Point of Sale** – tap drinks, pay by Cash or GCash.
3. **Inventory** – each sale deducts ingredients automatically using the recipe (BOM). Items under the reorder point show "Low".
4. **Purchasing** – request a purchase, receive goods (stock increases), pay the supplier.
5. **Accounting** – sales, cost of goods, gross profit, payables, and journal entries post automatically.
6. **Reports** – profit summary, sales by product and payment method, inventory value, CSV download.

Data is stored in the browser (localStorage). Use "Reset demo data" to start over.
The first six days on the dashboard are demo history. All names, prices and quantities are simulated for academic purposes.