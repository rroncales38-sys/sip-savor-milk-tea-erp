// Seed (starting) data for the simulation. Edit freely: names, prices, stock, recipes.
// Units are base units: g, ml, pcs. "cost" is peso cost per base unit.
const SEED = {
  ingredients: [
    { id: "tea",     name: "Black tea leaves",   unit: "g",   stock: 4200, reorder: 3000, cost: 0.60 },
    { id: "creamer", name: "Non-dairy creamer",  unit: "g",   stock: 6500, reorder: 5000, cost: 0.20 },
    { id: "syrup",   name: "Brown sugar syrup",  unit: "ml",  stock: 8000, reorder: 5000, cost: 0.10 },
    { id: "pearls",  name: "Tapioca pearls",     unit: "g",   stock: 2100, reorder: 4000, cost: 0.15 },
    { id: "taro",    name: "Taro powder",        unit: "g",   stock: 1200, reorder: 2000, cost: 0.50 },
    { id: "matcha",  name: "Matcha powder",      unit: "g",   stock: 1800, reorder: 1000, cost: 1.20 },
    { id: "milk",    name: "Fresh milk",         unit: "ml",  stock: 9000, reorder: 5000, cost: 0.07 },
    { id: "cups",    name: "16oz cups",          unit: "pcs", stock: 220,  reorder: 300,  cost: 3.50 }
  ],
  // bom = Bill of Materials: ingredient used per cup
  products: [
    { id: "p1", name: "Classic Milk Tea",  price: 95,  color: "#7A9E6B", bom: { tea: 8, creamer: 30, syrup: 25, cups: 1 } },
    { id: "p2", name: "Taro Milk Tea",     price: 110, color: "#9B7FB5", bom: { taro: 35, creamer: 30, cups: 1 } },
    { id: "p3", name: "Wintermelon",       price: 95,  color: "#C8873A", bom: { tea: 6, syrup: 40, cups: 1 } },
    { id: "p4", name: "Matcha Latte",      price: 120, color: "#7A9E6B", bom: { matcha: 6, milk: 180, cups: 1 } },
    { id: "p5", name: "Brown Sugar Boba",  price: 125, color: "#5C3D2E", bom: { pearls: 60, syrup: 40, milk: 150, cups: 1 } },
    { id: "p6", name: "Okinawa",           price: 115, color: "#C8873A", bom: { tea: 8, creamer: 30, syrup: 30, cups: 1 } }
  ]
};