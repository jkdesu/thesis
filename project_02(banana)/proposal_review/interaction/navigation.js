// Navigation and city selection functionality

// Select city and start game
function selectCity(city) {
    // Reset game state for new game
    resetGameState();
    
    // Reset currency toggle button
    const toggleBtn = document.getElementById('tokyo-currency-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = 'Show prices in USD';
    }
    
    // Reset currency symbols
    updateTokyoCurrencySymbols('¥');
    
    // Reset all quantity displays
    document.querySelectorAll('.quantity-display').forEach(display => {
        display.textContent = '0';
    });
    document.querySelectorAll('.item-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Hide intro panel and show navbar
    document.getElementById('intro-panel').classList.add('hidden');
    document.getElementById('navbar').classList.remove('hidden');
    
    const container = document.querySelector('.container');
    container.classList.add('with-nav');
    
    const tokyoSection = document.querySelector('.city-section.tokyo');
    const nycSection = document.querySelector('.city-section.nyc');
    const calculators = document.querySelectorAll('.budget-calculator');
    const currencyToggle = document.getElementById('tokyo-currency-toggle');
    
    if (city === 'tokyo') {
        container.classList.add('single-city');
        nycSection.classList.add('hidden');
        tokyoSection.style.borderRight = 'none';
        // Show calculator for single city mode
        calculators.forEach(calc => calc.classList.remove('hidden'));
        // Show currency toggle
        if (currencyToggle) currencyToggle.style.display = 'block';
    } else if (city === 'nyc') {
        container.classList.add('single-city');
        tokyoSection.classList.add('hidden');
        // Show calculator for single city mode
        calculators.forEach(calc => calc.classList.remove('hidden'));
        // Hide currency toggle
        if (currencyToggle) currencyToggle.style.display = 'none';
    } else if (city === 'both') {
        // Show both cities for comparison
        container.classList.remove('single-city');
        tokyoSection.classList.remove('hidden');
        nycSection.classList.remove('hidden');
        tokyoSection.style.borderRight = '2px solid black';
        // Hide calculators in comparison mode
        calculators.forEach(calc => calc.classList.add('hidden'));
        // Show currency toggle in comparison mode
        if (currencyToggle) currencyToggle.style.display = 'block';
    }
}

// Return to landing page
function returnToLanding() {
    // Show intro panel and hide navbar
    document.getElementById('intro-panel').classList.remove('hidden');
    document.getElementById('navbar').classList.add('hidden');
    
    const container = document.querySelector('.container');
    container.classList.remove('with-nav');
    
    // Reset game state
    resetGameState();
    
    // Reset currency
    resetCurrencyToJPY();
    
    // Reset selections and quantities
    document.querySelectorAll('.item-card.selected').forEach(card => {
        card.classList.remove('selected');
        card.querySelector('.quantity-display').textContent = '0';
    });
    
    // Reset UI
    document.getElementById('tokyo-day').textContent = '1';
    document.getElementById('nyc-day').textContent = '1';
    document.getElementById('tokyo-starting').textContent = '201,200';
    document.getElementById('nyc-starting').textContent = '2,247.00';
    
    // Reset totals
    updateTotal('tokyo');
    updateTotal('nyc');
    
    // Reset colors
    document.querySelector('.tokyo .budget-row.remaining').style.color = 'black';
    document.querySelector('.nyc .budget-row.remaining').style.color = 'black';
    
    // Reset city view
    const tokyoSection = document.querySelector('.city-section.tokyo');
    const nycSection = document.querySelector('.city-section.nyc');
    container.classList.remove('single-city');
    tokyoSection.classList.remove('hidden');
    nycSection.classList.remove('hidden');
    tokyoSection.style.borderRight = '2px solid black';
    
    // Show calculators again
    document.querySelectorAll('.budget-calculator').forEach(calc => {
        calc.classList.remove('hidden');
    });
}

