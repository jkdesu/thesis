// Game state management
let selectedTokyoItems = new Map(); // Map of itemId -> quantity
let selectedNycItems = new Map();

// Day tracking
let tokyoDay = 1;
let nycDay = 1;

// Budget tracking
let tokyoBudget = INITIAL_TOKYO_BUDGET;
let nycBudget = INITIAL_NYC_BUDGET;

// Currency display state
let tokyoShowUSD = false;

// Reset game state
function resetGameState() {
    tokyoDay = 1;
    nycDay = 1;
    tokyoBudget = INITIAL_TOKYO_BUDGET;
    nycBudget = INITIAL_NYC_BUDGET;
    selectedTokyoItems.clear();
    selectedNycItems.clear();
    tokyoShowUSD = false;
}

