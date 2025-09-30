export class StatShopManager {
    constructor(gameState, player) {
        this.gameState = gameState;
        this.player = player;
        this.container = null;
        this._createOverlay();
    }

    _createOverlay() {
        this.container = document.createElement('div');
        this.container.id = 'stat-shop-overlay';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.display = 'none';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.background = 'rgba(0,0,0,0.8)';
        this.container.style.zIndex = '2000';
        this.container.innerHTML = `
            <div id="stat-shop" style="background:#001122;border:2px solid #00ffff;border-radius:8px;padding:20px;width:640px;color:#00ffff;font-family:Arial;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h2 style="color:#ffff00;margin:0;">Stat Shop</h2>
                    <div>
                        <button id="stat-shop-close" style="padding:6px 10px;border-radius:6px;border:none;cursor:pointer;background:#ff0066;color:#fff;">Close</button>
                    </div>
                </div>
                <div id="stat-shop-balance" style="color:#ffff00;margin-bottom:10px;">XP: ${Math.round(this.gameState.xp)}</div>
                <div id="stat-shop-items" style="display:flex;gap:12px;flex-wrap:wrap;"></div>
                <div style="margin-top:14px;color:#cccccc;font-size:12px;">Phase 1: Buy buttons are placeholders that deduct XP and apply simple stat increments.</div>
            </div>
        `;
        document.body.appendChild(this.container);

        this.container.querySelector('#stat-shop-close').addEventListener('click', () => this.hide());

        this._itemsContainer = this.container.querySelector('#stat-shop-items');
        this._balanceEl = this.container.querySelector('#stat-shop-balance');

        this._renderItems();
    }

    _renderItems() {
        // Phase 1 items (minimal, per spec)
        const items = [
            { id: 'health', name: 'Max Health +5', cost: 30, apply: () => { this.player.maxHealth = (this.player.maxHealth || 100) + 5; } },
            { id: 'damage', name: 'Damage +1', cost: 50, apply: () => { if (this.player.weaponComponent) this.player.increaseDamage(1); else this.player.damage = (this.player.damage || 1) + 1; } },
            { id: 'speed', name: 'Speed +0.5', cost: 40, apply: () => { this.player.increaseSpeed(0.5); } },
            { id: 'lifesteal', name: 'Lifesteal +2%', cost: 60, apply: () => { this.player.lifesteal = (this.player.lifesteal || 0) + 0.02; } }
        ];

        this._itemsContainer.innerHTML = '';
        items.forEach(item => {
            const node = document.createElement('div');
            node.style.background = 'rgba(0,255,255,0.06)';
            node.style.border = '1px solid rgba(0,255,255,0.2)';
            node.style.borderRadius = '6px';
            node.style.padding = '10px';
            node.style.width = '140px';
            node.style.display = 'flex';
            node.style.flexDirection = 'column';
            node.style.gap = '8px';
            node.innerHTML = `
                <div style="font-weight:bold;color:#00ffff;">${item.name}</div>
                <div style="color:#cccccc;font-size:13px;">Cost: ${item.cost} XP</div>
                <button data-id="${item.id}" style="padding:6px;border-radius:6px;border:none;cursor:pointer;background:#00ffff;color:#000;font-weight:bold;">Buy</button>
            `;
            const btn = node.querySelector('button');
            btn.addEventListener('click', () => {
                if (this.gameState.xp >= item.cost) {
                    this.gameState.xp -= item.cost;
                    item.apply();
                    // update displayed balance and UI
                    this._balanceEl.textContent = `XP: ${Math.round(this.gameState.xp)}`;
                    if (window.gameInstance && window.gameInstance.uiManager) window.gameInstance.uiManager.update();
                    if (window.gameInstance && window.gameInstance.sidePanelManager) window.gameInstance.sidePanelManager.updateSidePanels();
                } else {
                    // visual feedback: briefly flash
                    btn.style.transform = 'translateY(-1px)';
                    setTimeout(() => btn.style.transform = '', 120);
                }
            });
            this._itemsContainer.appendChild(node);
        });
    }

    show() {
        if (!this.container) return;
        this._balanceEl.textContent = `XP: ${Math.round(this.gameState.xp)}`;
        this.container.style.display = 'flex';
    }

    hide() {
        if (!this.container) return;
        this.container.style.display = 'none';
    }
}

export default StatShopManager;