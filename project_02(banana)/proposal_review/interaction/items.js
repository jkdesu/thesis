// Item rendering and quantity management

// Render all commodity items
function renderItems() {
    const tokyoContainer = document.getElementById('tokyo-items');
    const nycContainer = document.getElementById('nyc-items');

    commodityData.forEach(item => {
        // Tokyo item
        const tokyoCard = createItemCard(item, 'tokyo');
        tokyoContainer.appendChild(tokyoCard);

        // NYC item
        const nycCard = createItemCard(item, 'nyc');
        nycContainer.appendChild(nycCard);
    });
}

// Create item card
function createItemCard(item, city) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.id = item.id;
    card.dataset.city = city;

    const img = document.createElement('img');
    const imgSuffix = city === 'tokyo' ? 'JP' : 'US';
    img.src = `assets_${imgSuffix}/${item.id}${imgSuffix}.png`;
    img.alt = item.name;
    img.onerror = function() {
        this.style.display = 'none';
    };

    const info = document.createElement('div');
    info.className = 'item-info';

    const number = document.createElement('div');
    number.className = 'item-number';
    number.textContent = `#${item.id}`;

    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = item.name;

    const price = document.createElement('div');
    price.className = 'item-price';
    price.dataset.itemId = item.id;
    if (city === 'tokyo') {
        if (tokyoShowUSD) {
            price.textContent = `$${item.tokyoPriceUSD.toFixed(2)}`;
        } else {
            price.textContent = `¥${item.tokyoPrice.toLocaleString()}`;
        }
    } else {
        price.textContent = `$${item.nycPrice.toLocaleString()}`;
    }

    // Quantity controls
    const quantityControls = document.createElement('div');
    quantityControls.className = 'quantity-controls';
    
    const minusBtn = document.createElement('button');
    minusBtn.className = 'quantity-btn';
    minusBtn.textContent = '-';
    minusBtn.onclick = (e) => {
        e.stopPropagation();
        changeQuantity(item.id, city, -1);
    };
    
    const quantityDisplay = document.createElement('span');
    quantityDisplay.className = 'quantity-display';
    quantityDisplay.textContent = '0';
    quantityDisplay.dataset.itemId = item.id;
    
    const plusBtn = document.createElement('button');
    plusBtn.className = 'quantity-btn';
    plusBtn.textContent = '+';
    plusBtn.onclick = (e) => {
        e.stopPropagation();
        changeQuantity(item.id, city, 1);
    };
    
    quantityControls.appendChild(minusBtn);
    quantityControls.appendChild(quantityDisplay);
    quantityControls.appendChild(plusBtn);

    info.appendChild(number);
    info.appendChild(name);
    info.appendChild(price);
    info.appendChild(quantityControls);

    card.appendChild(img);
    card.appendChild(info);

    return card;
}

// Change quantity of an item
function changeQuantity(itemId, city, change) {
    const card = document.querySelector(`.item-card[data-id="${itemId}"][data-city="${city}"]`);
    const quantityDisplay = card.querySelector('.quantity-display');
    
    if (city === 'tokyo') {
        let currentQty = selectedTokyoItems.get(itemId) || 0;
        let newQty = Math.max(0, currentQty + change);
        
        if (newQty === 0) {
            selectedTokyoItems.delete(itemId);
            card.classList.remove('selected');
        } else {
            selectedTokyoItems.set(itemId, newQty);
            card.classList.add('selected');
        }
        
        quantityDisplay.textContent = newQty;
        updateTotal('tokyo');
    } else {
        let currentQty = selectedNycItems.get(itemId) || 0;
        let newQty = Math.max(0, currentQty + change);
        
        if (newQty === 0) {
            selectedNycItems.delete(itemId);
            card.classList.remove('selected');
        } else {
            selectedNycItems.set(itemId, newQty);
            card.classList.add('selected');
        }
        
        quantityDisplay.textContent = newQty;
        updateTotal('nyc');
    }
}

