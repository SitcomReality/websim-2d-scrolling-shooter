export class StatShopManager {
    constructor(gameState, player) {
        this.gameState = gameState;
        this.player = player;
        this.container = null;
        this._createOverlay();

        // Track purchased levels per stat in Phase 2
        this.upgradeLevels = new Map(); // key -> level (number)
        this.maxLevels = {
            health: 5, damage: 5, speed: 5, lifesteal: 5
        };
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
        // Defensive: ensure maps/objects exist so subsequent code can't throw
        if (!this.upgradeLevels) this.upgradeLevels = new Map();
        if (!this.maxLevels) this.maxLevels = { health: 5, damage: 5, speed: 5, lifesteal: 5 };

        // Phase 1 items (minimal, per spec)
        const items = [
            { id: 'health', name: 'Max Health', base: 5, cost: 30, apply: (lvl) => { this.player.setMaxHealth((this.player.maxHealth || 100) + (this.baseValue('health') * lvl)); } },
            { id: 'damage', name: 'Damage', base: 1, cost: 50, apply: (lvl) => { if (this.player.weaponComponent) this.player.increaseDamage(this.baseValue('damage') * lvl); else this.player.damage = (this.player.damage || 1) + (this.baseValue('damage') * lvl); } },
            { id: 'speed', name: 'Speed', base: 0.5, cost: 40, apply: (lvl) => { this.player.increaseSpeed(this.baseValue('speed') * lvl); } },
            { id: 'lifesteal', name: 'Lifesteal', base: 0.02, cost: 60, apply: (lvl) => { this.player.lifesteal = (this.player.lifesteal || 0) + (this.baseValue('lifesteal') * lvl); } }
        ];

        this._itemsContainer.innerHTML = '';
        items.forEach(item => {
            const currentLevel = (this.upgradeLevels && typeof this.upgradeLevels.get === 'function') ? (this.upgradeLevels.get(item.id) || 0) : 0;
            const maxLevel = (this.maxLevels && typeof this.maxLevels[item.id] !== 'undefined') ? this.maxLevels[item.id] : 5;
            const nextLevel = currentLevel + 1;
            const scaledCost = Math.round(item.cost * (1 + currentLevel * 0.25)); // cost scales per level
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
                <div style="font-weight:bold;color:#00ffff;">${item.name} ${currentLevel > 0 ? `(Lv ${currentLevel})` : ''}</div>
                <div style="color:#cccccc;font-size:13px;">Next: +${(item.base).toString().replace(/^0\./,'0.')} ${item.id === 'lifesteal' ? '(fraction)' : ''}</div>
                <div style="color:#cccccc;font-size:13px;">Cost: ${scaledCost} XP</div>
                <button data-id="${item.id}" style="padding:6px;border-radius:6px;border:none;cursor:pointer;background:#00ffff;color:#000;font-weight:bold;">Buy</button>
            `;
            const btn = node.querySelector('button');

            const updateButtonState = () => {
                const level = this.upgradeLevels.get(item.id) || 0;
                if (level >= maxLevel) {
                    btn.disabled = true;
                    btn.textContent = 'Maxed';
                    btn.style.background = '#444';
                    btn.style.color = '#ccc';
                } else if (this.gameState.xp < scaledCost) {
                    btn.disabled = true;
                    btn.textContent = `Need ${scaledCost} XP`;
                } else {
                    btn.disabled = false;
                    btn.textContent = `Buy (${scaledCost} XP)`;
                    btn.style.background = '#00ffff';
                    btn.style.color = '#000';
                }
            };

            updateButtonState();

            btn.addEventListener('click', () => {
                const level = this.upgradeLevels.get(item.id) || 0;
                if (level >= maxLevel) return;
                if (this.gameState.xp >= scaledCost) {
                    this.gameState.xp -= scaledCost;
                    // increment level
                    this.upgradeLevels.set(item.id, level + 1);
                    // apply the item's effect scaled by 1 (apply only incremental change)
                    item.apply(1);
                    // update balance display and UI
                    this._balanceEl.textContent = `XP: ${Math.round(this.gameState.xp)}`;
                    // rerender items to refresh costs/levels
                    this._renderItems();
                    if (window.gameInstance && window.gameInstance.uiManager) window.gameInstance.uiManager.update();
                    if (window.gameInstance && window.gameInstance.sidePanelManager) window.gameInstance.sidePanelManager.updateSidePanels();
                } else {
                    btn.style.transform = 'translateY(-1px)';
                    setTimeout(() => btn.style.transform = '', 120);
                }
            });
            this._itemsContainer.appendChild(node);
        });
    }

    // helper to return base incremental value by id
    baseValue(id) {
        const map = { health: 5, damage: 1, speed: 0.5, lifesteal: 0.02 };
        return map[id] || 1;
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