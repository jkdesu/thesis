// Price Volatility Simulation - Show one price at a time
// Alternates between Tokyo and NYC prices for the same item

let currentItemIndex = 0;
let currentCity = 'tokyo'; // 'tokyo' or 'nyc'
let isPlaying = false;
let animationInterval = null;
const ANIMATION_SPEED = 2000; // 2 seconds per price view

// Store reaction data for each item
let itemReactions = {};

// Open volatility panel
function openVolatility() {
    document.getElementById('intro-panel').classList.add('hidden');
    document.getElementById('volatility-panel').classList.remove('hidden');
    currentItemIndex = 0;
    currentCity = 'tokyo';
    updateVolatilityDisplay();
    startAutoPlay();
}

// Close volatility panel
function closeVolatility() {
    stopAutoPlay();
    
    // Stop face tracking if active
    if (typeof stopFaceTracking === 'function') {
        stopFaceTracking();
    }
    
    // Log reaction summary if any reactions were recorded
    if (Object.keys(itemReactions).length > 0) {
        console.log('Reaction Summary:', itemReactions);
        const maxReactionItem = Object.entries(itemReactions)
            .sort((a, b) => b[1] - a[1])[0];
        if (maxReactionItem) {
            const item = commodityData.find(i => i.id === parseInt(maxReactionItem[0]));
            console.log(`Highest reaction: ${item?.name} with ${maxReactionItem[1].toFixed(1)}% change`);
        }
    }
    
    itemReactions = {};
    
    document.getElementById('volatility-panel').classList.add('hidden');
    document.getElementById('intro-panel').classList.remove('hidden');
}

// Update the volatility display for current item and city
function updateVolatilityDisplay() {
    const item = commodityData[currentItemIndex];
    const totalItems = commodityData.length;
    
    // Capture baseline for face tracking when switching to new price
    if (typeof captureBaseline === 'function') {
        if (typeof getReactionData === 'function') {
            const reactionData = getReactionData();
            if (reactionData.peak > 0) {
                const key = `${item.id}_${currentCity}`;
                itemReactions[key] = reactionData.peak;
            }
        }
        captureBaseline();
    }
    
    // Update progress indicator
    document.getElementById('volatility-progress').textContent = `${currentItemIndex + 1} / ${totalItems}`;
    
    // Update progress bar
    const progressPercent = ((currentItemIndex + 1) / totalItems) * 100;
    document.getElementById('volatility-progress-bar').style.width = `${progressPercent}%`;
    
    // Update item name
    document.getElementById('volatility-item-name').textContent = item.name;
    
    // Get elements
    const card = document.getElementById('volatility-card');
    const img = document.getElementById('volatility-img');
    const priceMain = document.getElementById('volatility-price');
    const priceSub = document.getElementById('volatility-price-converted');
    const cityIndicator = document.getElementById('volatility-city-indicator');
    const diffElement = document.getElementById('volatility-difference');
    
    // Fade out first
    card.classList.remove('animate-in');
    card.classList.add('fade-out');
    
    setTimeout(() => {
        // Update content based on current city
        if (currentCity === 'tokyo') {
            img.src = `assets_JP/${item.id}JP.png`;
            img.alt = item.name;
            priceMain.textContent = `¥${item.tokyoPrice.toLocaleString()}`;
            priceSub.textContent = `($${item.tokyoPriceUSD.toFixed(2)})`;
            cityIndicator.textContent = 'Tokyo';
            diffElement.classList.add('hidden');
        } else {
            img.src = `assets_US/${item.id}US.png`;
            img.alt = item.name;
            priceMain.textContent = `$${item.nycPrice.toFixed(2)}`;
            priceSub.textContent = '';
            cityIndicator.textContent = 'New York City';
            
            // Show difference after NYC price
            showPriceDifference(item);
        }
        
        // Fade in
        card.classList.remove('fade-out');
        void card.offsetWidth; // Trigger reflow
        card.classList.add('animate-in');
    }, 200);
    
    // Update navigation dots
    updateNavigationDots();
}

// Show price difference
function showPriceDifference(item) {
    const priceDiffUSD = item.nycPrice - item.tokyoPriceUSD;
    const priceDiffPercent = ((item.nycPrice - item.tokyoPriceUSD) / item.tokyoPriceUSD) * 100;
    
    const diffElement = document.getElementById('volatility-difference');
    const diffValueElement = document.getElementById('volatility-diff-value');
    const diffPercentElement = document.getElementById('volatility-diff-percent');
    
    if (priceDiffUSD > 0) {
        diffElement.className = 'volatility-difference nyc-expensive';
        diffValueElement.textContent = `NYC costs $${Math.abs(priceDiffUSD).toFixed(2)} more`;
        diffPercentElement.textContent = `+${Math.abs(priceDiffPercent).toFixed(0)}%`;
    } else if (priceDiffUSD < 0) {
        diffElement.className = 'volatility-difference tokyo-expensive';
        diffValueElement.textContent = `Tokyo costs $${Math.abs(priceDiffUSD).toFixed(2)} more`;
        diffPercentElement.textContent = `+${Math.abs(priceDiffPercent).toFixed(0)}%`;
    } else {
        diffElement.className = 'volatility-difference same-price';
        diffValueElement.textContent = 'Same price!';
        diffPercentElement.textContent = '';
    }
}

// Advance to next view (toggle city or next item)
function advanceView() {
    if (currentCity === 'tokyo') {
        // Switch to NYC for same item
        currentCity = 'nyc';
    } else {
        // Move to next item, start with Tokyo
        currentCity = 'tokyo';
        currentItemIndex = (currentItemIndex + 1) % commodityData.length;
    }
    updateVolatilityDisplay();
}

// Navigate to next item (skip to next item's Tokyo)
function nextItem() {
    currentCity = 'tokyo';
    currentItemIndex = (currentItemIndex + 1) % commodityData.length;
    updateVolatilityDisplay();
}

// Navigate to previous item
function prevItem() {
    currentCity = 'tokyo';
    currentItemIndex = (currentItemIndex - 1 + commodityData.length) % commodityData.length;
    updateVolatilityDisplay();
}

// Go to specific item
function goToItem(index) {
    currentItemIndex = index;
    currentCity = 'tokyo';
    updateVolatilityDisplay();
    if (isPlaying) {
        stopAutoPlay();
        startAutoPlay();
    }
}

// Start auto-play animation
function startAutoPlay() {
    if (!isPlaying) {
        isPlaying = true;
        updatePlayButton();
        animationInterval = setInterval(advanceView, ANIMATION_SPEED);
    }
}

// Stop auto-play animation
function stopAutoPlay() {
    if (isPlaying) {
        isPlaying = false;
        updatePlayButton();
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
    }
}

// Toggle play/pause
function togglePlayPause() {
    if (isPlaying) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

// Update play button appearance
function updatePlayButton() {
    const playBtn = document.getElementById('volatility-play-btn');
    if (isPlaying) {
        playBtn.innerHTML = '⏸ Pause';
        playBtn.classList.add('playing');
    } else {
        playBtn.innerHTML = '▶ Play';
        playBtn.classList.remove('playing');
    }
}

// Create navigation dots
function createNavigationDots() {
    const dotsContainer = document.getElementById('volatility-dots');
    dotsContainer.innerHTML = '';
    
    commodityData.forEach((item, index) => {
        const dot = document.createElement('button');
        dot.className = 'volatility-dot';
        dot.setAttribute('aria-label', `Go to item ${index + 1}: ${item.name}`);
        dot.onclick = () => goToItem(index);
        dotsContainer.appendChild(dot);
    });
}

function updateNavigationDots() {
    const dots = document.querySelectorAll('.volatility-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentItemIndex);
    });
}

// Initialize volatility panel
function initVolatility() {
    createNavigationDots();
}
