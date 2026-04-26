// Commodity data from CSV
const commodityData = [
    { id: 1, name: "Subway Sandwich (Italian B.L.T)", tokyoPrice: 740, tokyoPriceUSD: 4.72, nycPrice: 8.49 },
    { id: 2, name: "McDonald's Big Mac", tokyoPrice: 480, tokyoPriceUSD: 3.06, nycPrice: 6.69 },
    { id: 3, name: "Coca Cola Zero (1 Bottle)", tokyoPrice: 180, tokyoPriceUSD: 1.15, nycPrice: 2.7 },
    { id: 4, name: "Burger King Whopper", tokyoPrice: 590, tokyoPriceUSD: 3.76, nycPrice: 7.69 },
    { id: 5, name: "Starbucks Tall Black Coffee", tokyoPrice: 445, tokyoPriceUSD: 2.84, nycPrice: 4.63 },
    { id: 6, name: "Starbucks Tall Latte", tokyoPrice: 550, tokyoPriceUSD: 3.51, nycPrice: 5.61 },
    { id: 7, name: "Starbucks Cheesecake", tokyoPrice: 550, tokyoPriceUSD: 3.51, nycPrice: 7.6 },
    { id: 8, name: "Domino's Medium Cheese Pizza", tokyoPrice: 1180, tokyoPriceUSD: 7.52, nycPrice: 12.99 },
    { id: 9, name: "TacoBell CrunchWrap", tokyoPrice: 670, tokyoPriceUSD: 4.27, nycPrice: 9.02 },
    { id: 10, name: "1 pack of Rice", tokyoPrice: 1300, tokyoPriceUSD: 8.29, nycPrice: 21 },
    { id: 11, name: "Evian 500ml Water Bottle", tokyoPrice: 220, tokyoPriceUSD: 1.40, nycPrice: 2.52 },
    { id: 12, name: "Dozen Eggs", tokyoPrice: 450, tokyoPriceUSD: 2.87, nycPrice: 6.3 },
    { id: 13, name: "Salmon", tokyoPrice: 670, tokyoPriceUSD: 4.27, nycPrice: 9.99 },
    { id: 14, name: "White Bread Loaf", tokyoPrice: 200, tokyoPriceUSD: 1.27, nycPrice: 4.5 },
    { id: 15, name: "1 Banana", tokyoPrice: 96, tokyoPriceUSD: 0.96, nycPrice: 2.49 },
    { id: 16, name: "Chicken Breast", tokyoPrice: 300, tokyoPriceUSD: 1.91, nycPrice: 11 },
    { id: 17, name: "Beer (Asahi)", tokyoPrice: 500, tokyoPriceUSD: 3.19, nycPrice: 7 },
    { id: 18, name: "Marlboro Gold Cigarettes (pack)", tokyoPrice: 600, tokyoPriceUSD: 3.82, nycPrice: 21 },
    { id: 19, name: "Red Bull (250ml Can)", tokyoPrice: 190, tokyoPriceUSD: 1.21, nycPrice: 2.37 },
    { id: 20, name: "Shampoo (Head & Shoulders 250ml)", tokyoPrice: 1156, tokyoPriceUSD: 7.37, nycPrice: 7.89 },
    { id: 21, name: "Shampoo (Pantene 250ml)", tokyoPrice: 1300, tokyoPriceUSD: 8.29, nycPrice: 6.19 },
    { id: 22, name: "Uniqlo HeatTech", tokyoPrice: 2990, tokyoPriceUSD: 19.06, nycPrice: 29.9 },
    { id: 23, name: "Uniqlo White T-Shirt", tokyoPrice: 990, tokyoPriceUSD: 6.31, nycPrice: 14.9 },
    { id: 24, name: "Airpods", tokyoPrice: 39800, tokyoPriceUSD: 253.69, nycPrice: 249 },
    { id: 25, name: "iPhone 17 Pro", tokyoPrice: 179800, tokyoPriceUSD: 1146.05, nycPrice: 1099 },
    { id: 26, name: "Phone Bill", tokyoPrice: 2000, tokyoPriceUSD: 12.75, nycPrice: 70 },
    { id: 27, name: "Rent (1 Bedroom)", tokyoPrice: 170000, tokyoPriceUSD: 1083.58, nycPrice: 3000 },
    { id: 28, name: "Utility Fee", tokyoPrice: 15000, tokyoPriceUSD: 95.61, nycPrice: 200 },
    { id: 29, name: "Transit (Subway Ride)", tokyoPrice: 190, tokyoPriceUSD: 1.21, nycPrice: 2.9 },
    { id: 30, name: "Museum Ticket Price", tokyoPrice: 3800, tokyoPriceUSD: 24.22, nycPrice: 50 }
];

// Constants
const JPY_TO_USD_RATE = 156.9; // Exchange rate from CSV data
const INITIAL_TOKYO_BUDGET = 201200; // Starting budget after rent & utilities
const INITIAL_NYC_BUDGET = 2247;
const MAX_DAYS = 30;

