// Budget calculator and day management

// Update total price and remaining budget
function updateTotal(city) {
    if (city === 'tokyo') {
        let total = 0;
        const itemsList = document.getElementById('tokyo-items-list');
        itemsList.innerHTML = '';
        
        selectedTokyoItems.forEach((quantity, id) => {
            const item = commodityData.find(i => i.id === id);
            const itemTotal = item.tokyoPrice * quantity;
            total += itemTotal;
            
            // Add item to the list
            const itemRow = document.createElement('div');
            itemRow.className = 'item-row';
            
            if (tokyoShowUSD) {
                const itemTotalUSD = item.tokyoPriceUSD * quantity;
                itemRow.innerHTML = `
                    <span class="item-name-small">#${item.id} ${item.name} × ${quantity}</span>
                    <span class="item-price-small">$${itemTotalUSD.toFixed(2)}</span>
                `;
            } else {
                itemRow.innerHTML = `
                    <span class="item-name-small">#${item.id} ${item.name} × ${quantity}</span>
                    <span class="item-price-small">¥${itemTotal.toLocaleString()}</span>
                `;
            }
            itemsList.appendChild(itemRow);
        });
        
        const remaining = tokyoBudget - total;
        
        // Update displays based on currency preference
        if (tokyoShowUSD) {
            const budgetUSD = tokyoBudget / JPY_TO_USD_RATE;
            const totalUSD = total / JPY_TO_USD_RATE;
            const remainingUSD = remaining / JPY_TO_USD_RATE;
            
            document.getElementById('tokyo-starting').textContent = budgetUSD.toFixed(2);
            document.getElementById('tokyo-total').textContent = totalUSD.toFixed(2);
            document.getElementById('tokyo-remaining').textContent = remainingUSD.toFixed(2);
            
            // Update currency symbols
            updateTokyoCurrencySymbols('$');
        } else {
            document.getElementById('tokyo-starting').textContent = tokyoBudget.toLocaleString();
            document.getElementById('tokyo-total').textContent = total.toLocaleString();
            document.getElementById('tokyo-remaining').textContent = remaining.toLocaleString();
            
            // Update currency symbols
            updateTokyoCurrencySymbols('¥');
        }
        
        // Change color if budget is negative
        const remainingElement = document.querySelector('.tokyo .budget-row.remaining');
        if (remaining < 0) {
            remainingElement.style.color = 'red';
        } else {
            remainingElement.style.color = 'black';
        }
    } else {
        let total = 0;
        const itemsList = document.getElementById('nyc-items-list');
        itemsList.innerHTML = '';
        
        selectedNycItems.forEach((quantity, id) => {
            const item = commodityData.find(i => i.id === id);
            const itemTotal = item.nycPrice * quantity;
            total += itemTotal;
            
            // Add item to the list
            const itemRow = document.createElement('div');
            itemRow.className = 'item-row';
            itemRow.innerHTML = `
                <span class="item-name-small">#${item.id} ${item.name} × ${quantity}</span>
                <span class="item-price-small">$${itemTotal.toLocaleString()}</span>
            `;
            itemsList.appendChild(itemRow);
        });
        
        const remaining = nycBudget - total;
        
        document.getElementById('nyc-total').textContent = total.toFixed(2);
        document.getElementById('nyc-remaining').textContent = remaining.toFixed(2);
        
        // Change color if budget is negative
        const remainingElement = document.querySelector('.nyc .budget-row.remaining');
        if (remaining < 0) {
            remainingElement.style.color = 'red';
        } else {
            remainingElement.style.color = 'black';
        }
    }
}

// Submit day and move to next day
function submitDay(city) {
    if (city === 'tokyo') {
        // Calculate remaining budget
        let total = 0;
        selectedTokyoItems.forEach((quantity, id) => {
            const item = commodityData.find(i => i.id === id);
            total += item.tokyoPrice * quantity;
        });
        const remaining = tokyoBudget - total;
        
        // Check if game over (negative budget)
        if (remaining < 0) {
            alert(`Game Over! You ran out of money on Day ${tokyoDay}.\n\nYou spent ¥${total.toLocaleString()} but only had ¥${tokyoBudget.toLocaleString()} available.`);
            return;
        }
        
        // Check if completed 30 days
        if (tokyoDay >= MAX_DAYS) {
            alert(`Congratulations! You survived ${MAX_DAYS} days in Tokyo!\n\nFinal Budget: ¥${remaining.toLocaleString()}`);
            return;
        }
        
        // Move to next day
        tokyoDay++;
        tokyoBudget = remaining;
        
        // Clear selections
        selectedTokyoItems.clear();
        document.querySelectorAll('.tokyo .item-card.selected').forEach(card => {
            card.classList.remove('selected');
            card.querySelector('.quantity-display').textContent = '0';
        });
        
        // Update UI
        document.getElementById('tokyo-day').textContent = tokyoDay;
        
        if (tokyoShowUSD) {
            const budgetUSD = tokyoBudget / JPY_TO_USD_RATE;
            document.getElementById('tokyo-starting').textContent = budgetUSD.toFixed(2);
            updateTokyoCurrencySymbols('$');
        } else {
            document.getElementById('tokyo-starting').textContent = tokyoBudget.toLocaleString();
            updateTokyoCurrencySymbols('¥');
        }
        
        updateTotal('tokyo');
        
    } else {
        // Calculate remaining budget
        let total = 0;
        selectedNycItems.forEach((quantity, id) => {
            const item = commodityData.find(i => i.id === id);
            total += item.nycPrice * quantity;
        });
        const remaining = nycBudget - total;
        
        // Check if game over (negative budget)
        if (remaining < 0) {
            alert(`Game Over! You ran out of money on Day ${nycDay}.\n\nYou spent $${total.toFixed(2)} but only had $${nycBudget.toFixed(2)} available.`);
            return;
        }
        
        // Check if completed 30 days
        if (nycDay >= MAX_DAYS) {
            alert(`Congratulations! You survived ${MAX_DAYS} days in NYC!\n\nFinal Budget: $${remaining.toFixed(2)}`);
            return;
        }
        
        // Move to next day
        nycDay++;
        nycBudget = remaining;
        
        // Clear selections
        selectedNycItems.clear();
        document.querySelectorAll('.nyc .item-card.selected').forEach(card => {
            card.classList.remove('selected');
            card.querySelector('.quantity-display').textContent = '0';
        });
        
        // Update UI
        document.getElementById('nyc-day').textContent = nycDay;
        document.getElementById('nyc-starting').textContent = nycBudget.toFixed(2);
        updateTotal('nyc');
    }
}

