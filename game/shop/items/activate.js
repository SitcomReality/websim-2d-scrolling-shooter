// Activation and persistence helpers for shop items (extracted from monolith)
import _items from './_items.js';

function _registerStatsIfNeeded(itemDef, statSystem = null) {
    if (!Array.isArray(itemDef.definesStats) || !statSystem) return;
    itemDef.definesStats.forEach(def => {
        try {
            if (!statSystem.hasStat(def.id)) {
                statSystem.registerStat(def);
            }
        } catch (e) {
            // ignore registration errors (defensive)
        }
    });
}

export function activateItem(itemId, player, context = {}) {
    const item = _items.get(itemId);
    if (!item) return false;
    try {
        // Register stats defensively
        if (Array.isArray(item.definesStats) && context.statSystem) {
            _registerStatsIfNeeded(item, context.statSystem);
        }

        // Run activation logic if provided
        if (typeof item.onActivate === 'function') {
            item.onActivate(player, context);
        }
        return true;
    } catch (e) {
        console.warn(`Failed to activate shop item ${itemId}`, e);
        return false;
    }
}

export function saveOwned(ownedIds = [], storageKey = 'shop_owned_items') {
    try {
        localStorage.setItem(storageKey, JSON.stringify(ownedIds));
        return true;
    } catch (e) {
        return false;
    }
}

export function loadOwned(storageKey = 'shop_owned_items') {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

export function applyOwned(ownedIds = [], player, context = {}) {
    (Array.isArray(ownedIds) ? ownedIds : Array.from(ownedIds || [])).forEach(id => {
        try {
            const it = _items.get(id);
            if (!it) return;
            if (Array.isArray(it.definesStats) && context.statSystem) {
                it.definesStats.forEach(def => {
                    try {
                        if (!context.statSystem.hasStat(def.id)) context.statSystem.registerStat(def);
                    } catch(e){}
                });
            }
            if (typeof it.onActivate === 'function') {
                it.onActivate(player, context);
            }
        } catch (e) {
            console.warn('Failed to apply owned item', id, e);
        }
    });
}