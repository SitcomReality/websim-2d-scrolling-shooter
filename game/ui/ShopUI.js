export default class ShopUI {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.overlayId = 'shop-overlay';
    }

    show(offerings = [], shopController = null) {
        this.gameState = this.uiManager.gameState;
        this.offerings = offerings || [];
        this.shopController = shopController;

        // Pause the game while shop is visible
        if (this.gameState) { this.gameState.isPausedForLevelUp = true; this.gameState.isShopVisible = true; }

        if (!document.getElementById(this.overlayId)) {
            const overlay = document.createElement('div');
            overlay.id = this.overlayId;
            overlay.innerHTML = `
                <div id="shop-panel">
                    <div id="shop-header">
                        <h2>Item Shop</h2>
                        <div>
                            <button id="shop-close">Close</button>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;align-items:flex-start;">
                        <div style="flex:1;">
                            <div id="shop-items"></div>
                        </div>
                        <div id="shop-sidebar">
                            <div id="shop-balance" style="color:#ffff00;font-weight:bold;margin-bottom:8px;">Currency: ${Math.round(this.gameState.currency || 0)}</div>
                            <div id="shop-info" style="min-height:120px;">Select an item to see details here.</div>
                        </div>
                    </div>
                    <div id="shop-footer">
                        <div style="color:#cccccc;font-size:12px;">Shop offerings rotate each time you reroll.</div>
                        <div>
                            <button id="shop-reroll">Reroll</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            overlay.querySelector('#shop-close').addEventListener('click', () => this.hide());
            overlay.querySelector('#shop-reroll').addEventListener('click', () => this.uiManager.emit('shopRerollRequested'));
        }

        this.refresh(offerings);
        document.getElementById(this.overlayId).style.display = 'flex';
    }

    refresh(offerings = []) {
        const itemsEl = document.getElementById('shop-items');
        const infoEl = document.getElementById('shop-info');
        const balanceEl = document.getElementById('shop-balance');
        if (!itemsEl || !balanceEl) return;

        balanceEl.textContent = `Currency: ${Math.round(this.gameState.currency || 0)}`;
        itemsEl.innerHTML = '';

        (offerings || []).forEach(off => {
            const card = document.createElement('div');
            card.className = 'shop-card';
            const statsList = (off.definesStats || []).map(s => `${s.name || s.id}`).join(', ');
            const behaviors = (off.description || '').replace(/\\n/g,' ');
            card.innerHTML = `
                <div class="name">${off.name}</div>
                <div class="desc">${behaviors}</div>
                <div class="meta">Cost: <span style="color:#ffff00">${off.cost}</span></div>
                <div class="tags">${off.category ? off.category.toUpperCase() : ''} ${statsList ? ' • Adds: ' + statsList : ''}</div>
                <button class="purchase">${off.cost ? `Buy (${off.cost})` : 'Buy'}</button>
            `;
            card.addEventListener('mouseenter', () => {
                if (infoEl) infoEl.innerHTML = `<div style="color:#00ffff;font-weight:bold;">${off.name}</div>
                                    <div style="margin-top:6px;color:#cccccc;">${off.description || ''}</div>
                                    <div style="margin-top:8px;color:#ffff00;">Registers stats: ${statsList || '—'}</div>
                                    <div style="margin-top:6px;color:#88ffff;">Dependencies: ${ (off.dependencies && off.dependencies.length) ? off.dependencies.join(', ') : 'None' }</div>`;
            });

            const btn = card.querySelector('button.purchase');
            btn.addEventListener('click', () => {
                this.uiManager.emit('shopPurchaseRequested', off.id);
            });

            if ((this.gameState.currency || 0) < (off.cost || 0)) {
                btn.disabled = true;
            }

            itemsEl.appendChild(card);
        });
    }

    refreshBalance() {
        const balanceEl = document.getElementById('shop-balance');
        if (balanceEl) balanceEl.textContent = `Currency: ${Math.round(this.gameState.currency || 0)}`;
    }

    hide() {
        const overlay = document.getElementById(this.overlayId);
        if (overlay) overlay.style.display = 'none';
        if (this.gameState) {
            // Unpause when shop closed
            this.gameState.isPausedForLevelUp = false;
            this.gameState.isShopVisible = false;
        }
    }
}