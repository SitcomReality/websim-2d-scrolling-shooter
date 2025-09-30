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
        // Phase 2: currency & collection
        this.currencyKey = 'statShop_currency';
        this.collectionKey = 'statShop_collection';
        this.currency = Math.round(this.gameState.xp || 0);
        this.collection = new Map(JSON.parse(localStorage.getItem(this.collectionKey) || '[]'));
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
            <div id="stat-shop" style="background:#001122;border:2px solid #00ffff;border-radius:8px;padding:20px;width:760px;color:#00ffff;font-family:Arial;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h2 style="color:#ffff00;margin:0;">Stat Shop</h2>
                    <div>
                        <button id="stat-shop-close" style="padding:6px 10px;border-radius:6px;border:none;cursor:pointer;background:#ff0066;color:#fff;">Close</button>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                    <div style="flex:1;">
                        <div id="stat-shop-balance" style="color:#ffff00;margin-bottom:10px;">XP: ${Math.round(this.currency)}</div>
                        <div id="stat-shop-items" style="display:flex;gap:12px;flex-wrap:wrap;"></div>
                    </div>
                    <div style="width:240px;background:rgba(0,255,255,0.02);border:1px solid rgba(0,255,255,0.06);padding:10px;border-radius:6px;">
                        <h3 style="color:#00ffff;margin-top:0;">Collection</h3>
                        <div id="stat-shop-collection" style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow:auto;"></div>
                        <div style="margin-top:10px;color:#cccccc;font-size:12px;">Collected items persist between sessions.</div>
                    </div>
                </div>
                <div style="margin-top:12px;color:#cccccc;font-size:12px;">Phase 2: Currency & Collection - purchases deduct XP and can add items to your collection.</div>
            </div>
        `;

        this.container.querySelector('#stat-shop-close').addEventListener('click', () => this.hide());

        this._itemsContainer = this.container.querySelector('#stat-shop-items');
        this._balanceEl = this.container.querySelector('#stat-shop-balance');
        this._collectionContainer = this.container.querySelector('#stat-shop-collection');

        this._renderItems();
        this._renderCollection();
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
                // Phase 2 purchase uses shop currency (mirrors gameState.xp but stores separately)
                if (this.currency >= scaledCost) {
                    this.currency -= scaledCost;
                    this.gameState.xp = Math.round(this.currency); // keep gameState in sync for UI elsewhere
                    // increment level
                    this.upgradeLevels.set(item.id, level + 1);
                    // apply the item's effect scaled by 1 (apply only incremental change)
                    item.apply(1);
                    // update balance display and UI
                    this._balanceEl.textContent = `XP: ${Math.round(this.currency)}`;
                    localStorage.setItem(this.currencyKey, JSON.stringify(this.currency));

                    // rerender items to refresh costs/levels
                    this._renderItems();
                    if (window.gameInstance && window.gameInstance.uiManager) window.gameInstance.uiManager.update();
                    if (window.gameInstance && window.gameInstance.sidePanelManager) window.gameInstance.sidePanelManager.updateSidePanels();
                    // add a collectible entry for this purchase (one per stat per level)
                    this._addToCollection(item.id, item.name, level + 1);
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

    // Phase 2: collection helpers
    _addToCollection(id, name, level) {
        const key = `${id}_lv${level}`;
        if (this.collection.has(key)) return;
        this.collection.set(key, { id, name, level, acquiredAt: Date.now() });
        this._persistCollection();
        this._renderCollection();
    }

    _persistCollection() {
        try {
            const arr = Array.from(this.collection.entries());
            localStorage.setItem(this.collectionKey, JSON.stringify(arr));
        } catch (e) { /* ignore storage errors */ }
    }

    _renderCollection() {
        if (!this._collectionContainer) return;
        this._collectionContainer.innerHTML = '';
        if (this.collection.size === 0) {
            const empty = document.createElement('div');
            empty.style.color = '#888';
            empty.textContent = 'No collected items yet.';
            this._collectionContainer.appendChild(empty);
            return;
        }
        Array.from(this.collection.values()).forEach(entry => {
            const node = document.createElement('div');
            node.style.display = 'flex';
            node.style.justifyContent = 'space-between';
            node.style.alignItems = 'center';
            node.style.padding = '6px';
            node.style.border = '1px solid rgba(0,255,255,0.04)';
            node.style.borderRadius = '4px';
            node.innerHTML = `<div style="color:#00ffff;font-size:13px;">${entry.name} <span style="color:#ffff00;font-weight:bold;">Lv ${entry.level}</span></div>
                              <div style="color:#cccccc;font-size:12px;">${new Date(entry.acquiredAt).toLocaleDateString()}</div>`;
            this._collectionContainer.appendChild(node);
        });
    }

    // Keep currency in sync with gameState when shop opened externally
    show() {
        if (!this.container) return;
        // initialize currency from persisted value or gameState.xp
        const persisted = localStorage.getItem(this.currencyKey);
        if (persisted !== null) this.currency = Math.round(JSON.parse(persisted));
        else this.currency = Math.round(this.gameState.xp || 0);
        this._balanceEl.textContent = `XP: ${Math.round(this.currency)}`;
        this.container.style.display = 'flex';
        this._renderCollection();
    }

    hide() {
        if (!this.container) return;
        this.container.style.display = 'none';
    }
}

export default StatShopManager;