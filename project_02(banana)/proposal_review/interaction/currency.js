// Currency toggle functionality for Tokyo

// Update Tokyo currency symbols in calculator
function updateTokyoCurrencySymbols(symbol) {
    const startingSymbol = document.getElementById('tokyo-starting-symbol');
    const totalSymbol = document.getElementById('tokyo-total-symbol');
    const remainingSymbol = document.getElementById('tokyo-remaining-symbol');
    
    if (startingSymbol) startingSymbol.textContent = symbol;
    if (totalSymbol) totalSymbol.textContent = symbol;
    if (remainingSymbol) remainingSymbol.textContent = symbol;
}

// Toggle Tokyo currency display between JPY and USD
function toggleTokyoCurrency() {
    tokyoShowUSD = !tokyoShowUSD;
    
    // Update button text
    const toggleBtn = document.getElementById('tokyo-currency-toggle');
    if (tokyoShowUSD) {
        toggleBtn.textContent = 'Show prices in JPY';
    } else {
        toggleBtn.textContent = 'Show prices in USD';
    }
    
    // Update all Tokyo item prices
    const tokyoCards = document.querySelectorAll('.item-card[data-city="tokyo"]');
    tokyoCards.forEach(card => {
        const itemId = parseInt(card.dataset.id);
        const item = commodityData.find(i => i.id === itemId);
        const priceElement = card.querySelector('.item-price');
        
        if (tokyoShowUSD) {
            priceElement.textContent = `$${item.tokyoPriceUSD.toFixed(2)}`;
        } else {
            priceElement.textContent = `¥${item.tokyoPrice.toLocaleString()}`;
        }
    });
    
    // Update budget calculator
    updateTotal('tokyo');
}

// Reset currency to JPY
function resetCurrencyToJPY() {
    tokyoShowUSD = false;
    
    const toggleBtn = document.getElementById('tokyo-currency-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = 'Show prices in USD';
    }
    
    // Reset Tokyo prices to JPY
    const tokyoCards = document.querySelectorAll('.item-card[data-city="tokyo"]');
    tokyoCards.forEach(card => {
        const itemId = parseInt(card.dataset.id);
        const item = commodityData.find(i => i.id === itemId);
        const priceElement = card.querySelector('.item-price');
        priceElement.textContent = `¥${item.tokyoPrice.toLocaleString()}`;
    });
    
    updateTokyoCurrencySymbols('¥');
}

