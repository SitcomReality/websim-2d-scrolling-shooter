import ItemFactory from './ItemFactory.js';

/* Simple seedable LCG RNG */
class LCG {
    constructor(seed = 1) {
        // ensure integer seed
        this.m = 0x80000000; // 2^31
        this.a = 1103515245;
        this.c = 12345;
        this.state = seed ? seed >>> 0 : 1;
    }
    nextInt() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }
    nextFloat() {
        return this.nextInt() / (this.m - 1);
    }
    nextRange(min, max) {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }
    pick(array) {
        if (!array || array.length === 0) return null;
        return array[this.nextRange(0, array.length - 1)];
    }
}

/* ShopSystem
   Responsibilities:
   - deterministic generation of offerings via seeded LCG
   - purchase, reroll, loadOwnedItems, saveOwned
*/
export class ShopSystem {
    constructor(gameState, options = {}) {
        this.gameState = gameState;
        this.itemFactory = ItemFactory;
        this.baseRerollCost = options.baseRerollCost || 10;
        this.rerollGrowth = options.rerollGrowth || 1.35;
        this.offerSize = options.offerSize || 4;
        this.categoriesRotation = options.categoriesRotation || ['weapon','offensive','defensive','mobility','utility'];
        this.currentOfferings = []; // array of item objects { id, cost, meta... }
        this.ownedItemIds = new Set();
        this.rerollCount = 0;
        this.lastSeedMeta = null;
    }

    // deterministic seed builder: combine seeds and context safely into integer
    _buildSeed(seed, context = {}) {
        // context may include levelIndex, wave, rerollCount
        let s = (typeof seed === 'number' ? Math.floor(seed) : (String(seed).split('').reduce((a,c)=>a+c.charCodeAt(0),0) || 1));
        s ^= (context.levelIndex || 0) * 9973;
        s ^= (context.wave || 0) * 7919;
        s ^= (this.rerollCount || 0) * 65537;
        s = (s >>> 0) || 1;
        return s;
    }

    // Generate deterministic offerings given seed and owned items; returns array of item data
    generateOfferings(seed, playerOwnedItems = [], context = {}) {
        // reconcile owned items
        playerOwnedItems = Array.isArray(playerOwnedItems) ? playerOwnedItems : Array.from(playerOwnedItems || []);
        this.ownedItemIds = new Set(playerOwnedItems);

        const seedInt = this._buildSeed(seed, context);
        const rng = new LCG(seedInt);

        // list of candidate items (data objects)
        const all = this.itemFactory.getAllItems ? this.itemFactory.getAllItems() : [];
        const available = all.filter(it => {
            if (!it || !it.id) return false;
            // if already owned, skip from offered pool (shop shouldn't offer already owned items)
            if (this.ownedItemIds.has(it.id)) return false;
            return true;
        });

        // category rotation: pick a starting category offset using rng
        const catOffset = rng.nextRange(0, Math.max(0, this.categoriesRotation.length - 1));
        const categoriesOrder = [];
        for (let i = 0; i < this.categoriesRotation.length; i++) {
            categoriesOrder.push(this.categoriesRotation[(catOffset + i) % this.categoriesRotation.length]);
        }

        const selected = [];
        const usedIds = new Set();

        // helper to test conflicts between candidate and already selected
        const conflictsWithSelected = (candidate) => {
            if (!candidate || !candidate.conflictsWith) return false;
            for (const sel of selected) {
                if (!sel) continue;
                if (candidate.conflictsWith.includes(sel.id)) return true;
                if (sel.conflictsWith && sel.conflictsWith.includes(candidate.id)) return true;
            }
            return false;
        };

        // fill slots trying to rotate categories for variety
        let attempts = 0;
        let catIndex = 0;
        while (selected.length < this.offerSize && attempts < available.length * 4) {
            attempts++;
            // choose category for this slot
            const desiredCategory = categoriesOrder[catIndex % categoriesOrder.length];
            catIndex++;
            // filter by desiredCategory first, fallback to any
            const bucket = available.filter(it => {
                if (usedIds.has(it.id)) return false;
                // respect category if exists
                if (it.category && desiredCategory) {
                    if (it.category === desiredCategory) return true;
                }
                return false;
            });

            const pool = bucket.length > 0 ? bucket : available.filter(it => !usedIds.has(it.id));
            if (pool.length === 0) break;

            const pick = rng.pick(pool);
            if (!pick || usedIds.has(pick.id)) continue;
            if (conflictsWithSelected(pick)) continue;

            usedIds.add(pick.id);

            // determine cost (can be derived from item.cost or fallback)
            const baseCost = typeof pick.cost === 'number' ? pick.cost : (Math.max(20, Math.round((pick.definesStats?.length || 0) * 60)));
            // scale cost slightly by RNG to add variety but deterministic
            const costVariance = 0.85 + rng.nextFloat() * 0.5; // 0.85 - 1.35
            const cost = Math.max(1, Math.round(baseCost * costVariance));

            selected.push({
                id: pick.id,
                name: pick.name,
                description: pick.description,
                cost,
                category: pick.category || 'misc',
                definesStats: pick.definesStats || [],
                conflictsWith: pick.conflictsWith || [],
                dependencies: pick.dependencies || []
            });
        }

        this.currentOfferings = selected;
        this.lastSeedMeta = { seed, context, seedInt };
        return this.currentOfferings.slice();
    }

    // Attempt to purchase an item by id for the player; returns { success, reason }
    purchaseItem(itemId, player) {
        const offering = this.currentOfferings.find(it => it.id === itemId);
        if (!offering) return { success: false, reason: 'not_found' };
        const cost = offering.cost || 0;

        // Ensure currency is tracked on gameState.currency (fallback to xp)
        if (!this.gameState) return { success: false, reason: 'no_gamestate' };
        const currency = typeof this.gameState.currency === 'number' ? this.gameState.currency : (this.gameState.xp || 0);

        if (currency < cost) return { success: false, reason: 'insufficient_funds' };

        // check dependencies
        if (Array.isArray(offering.dependencies) && offering.dependencies.length > 0) {
            for (const dep of offering.dependencies) {
                if (!this.ownedItemIds.has(dep)) return { success: false, reason: 'missing_dependency' };
            }
        }

        // deduct currency
        this.gameState.currency = Math.max(0, currency - cost);

        // mark owned
        this.ownedItemIds.add(itemId);
        this._persistOwned();

        // call activation via ItemFactory (best-effort)
        try {
            ItemFactory.activateItem(itemId, player, { statSystem: player && player.statSystem, gameState: this.gameState });
        } catch (e) {
            console.warn('Shop activation failed for', itemId, e);
        }

        // remove offering from current list
        this.currentOfferings = this.currentOfferings.filter(it => it.id !== itemId);

        // Persist overall game/save state if SaveLoadManager is available globally
        try {
            const saveManager = (window.gameInstance && window.gameInstance.saveLoadManager) ? window.gameInstance.saveLoadManager : null;
            if (saveManager && typeof saveManager.save === 'function') saveManager.save();
        } catch (e) { /* ignore save errors */ }

        // return success
        return { success: true };
    }

    // Reroll offerings for a cost that scales with rerollCount
    rerollOfferings(seed, playerOwnedItems = [], context = {}) {
        const cost = Math.floor(this.baseRerollCost * Math.pow(this.rerollGrowth, this.rerollCount));
        const currency = typeof this.gameState.currency === 'number' ? this.gameState.currency : (this.gameState.xp || 0);
        if (currency < cost) return { success: false, reason: 'insufficient_funds', cost };

        // Deduct and increment reroll count
        this.gameState.currency = Math.max(0, currency - cost);
        this.rerollCount++;

        // persist reroll count to gameState for SaveLoadManager
        this.gameState.rerollCount = this.rerollCount;

        // regenerate with same seed but updated rerollCount influences seed
        const offerings = this.generateOfferings(seed, playerOwnedItems, context);

        // Persist overall game/save state if SaveLoadManager is available globally
        try {
            const saveManager = (window.gameInstance && window.gameInstance.saveLoadManager) ? window.gameInstance.saveLoadManager : null;
            if (saveManager && typeof saveManager.save === 'function') saveManager.save();
        } catch (e) { /* ignore save errors */ }

        return { success: true, cost, offerings };
    }

    // Load owned items (e.g., on game load) and activate them on player
    loadOwnedItems(itemIds = [], player) {
        if (!Array.isArray(itemIds)) itemIds = Array.from(itemIds || []);
        itemIds.forEach(id => {
            this.ownedItemIds.add(id);
            try {
                ItemFactory.activateItem(id, player, { statSystem: player && player.statSystem, gameState: this.gameState });
            } catch (e) {
                console.warn('Failed to activate owned item on load', id, e);
            }
        });
        this._persistOwned();
    }

    // Save owned items to localStorage (simple persistence)
    _persistOwned(storageKey = 'shop_owned_items_v2') {
        try {
            const arr = Array.from(this.ownedItemIds);
            localStorage.setItem(storageKey, JSON.stringify(arr));
        } catch (e) { /* ignore */ }
    }

    // Load persisted owned items from localStorage
    loadPersistedOwned(storageKey = 'shop_owned_items_v2') {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            parsed.forEach(id => this.ownedItemIds.add(id));
            return parsed;
        } catch (e) {
            return [];
        }
    }

    // Expose current offerings and owned list
    getOfferings() {
        return this.currentOfferings.slice();
    }

    getOwned() {
        return Array.from(this.ownedItemIds);
    }

    getRerollCost() {
        return Math.floor(this.baseRerollCost * Math.pow(this.rerollGrowth, this.rerollCount));
    }

    resetRerolls() {
        this.rerollCount = 0;
    }
}

export default ShopSystem;