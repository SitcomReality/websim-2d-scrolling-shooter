// New shop item factory - pure data + activation hooks
export class ItemFactory {
    static getAllItems() {
        return Array.from(this._items.values());
    }

    static getItem(id) {
        return this._items.get(id) || null;
    }

    // Called when a player purchases or when owned items are reapplied on load
    // itemId: string, player: Player instance, context: { statSystem, gameState }
    static activateItem(itemId, player, context = {}) {
        const item = this.getItem(itemId);
        if (!item) return false;
        try {
            // Register stats if needed (defensive: don't re-register duplicates)
            if (Array.isArray(item.definesStats) && context.statSystem) {
                item.definesStats.forEach(def => {
                    if (!context.statSystem.hasStat(def.id)) {
                        context.statSystem.registerStat(def);
                    }
                });
            }

            // Run activation logic
            if (typeof item.onActivate === 'function') {
                item.onActivate(player, context);
            }
            return true;
        } catch (e) {
            console.warn(`Failed to activate shop item ${itemId}`, e);
            return false;
        }
    }

    // Persistence helpers: save and load owned item ids from localStorage
    static saveOwned(ownedIds = [], storageKey = 'shop_owned_items') {
        try {
            localStorage.setItem(storageKey, JSON.stringify(ownedIds));
        } catch (e) { /* ignore storage errors */ }
    }

    static loadOwned(storageKey = 'shop_owned_items') {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    // Re-apply a list of owned item ids (safe to call on game load)
    static applyOwned(ownedIds = [], player, context = {}) {
        ownedIds.forEach(id => this.activateItem(id, player, context));
    }
}

/* ------------------------
   Define items (pure data)
   ------------------------ */

ItemFactory._items = new Map([
    // Chain Module - provides chain stat and enables chaining behavior
    ['chain_module', {
        id: 'chain_module',
        name: 'Chain Module',
        cost: 200,
        description: 'Allows bullets to chain between enemies and registers chain_count stat.',
        category: 'weapon',
        definesStats: [
            {
                id: 'chain_count',
                name: 'Chain Count',
                baseValue: 1,
                description: 'How many extra chains a bullet can perform',
                category: 'offensive',
                upgradeWeight: 0.6,
                maxValue: 10,
                softCap: 4
            },
            {
                id: 'chain_range',
                name: 'Chain Range',
                baseValue: 100,
                description: 'Range in pixels for chaining',
                category: 'offensive',
                upgradeWeight: 0.3,
                maxValue: 400
            }
        ],
        dependencies: [],
        conflictsWith: [],
        onActivate: (player, { statSystem }) => {
            // Ensure player's weapon component is able to read chain stats later
            if (player && player.weaponComponent) {
                // set best-effort properties that weapon systems may read
                player.weaponComponent.setChain = player.weaponComponent.setChain || function(count, range, dmgReduction) {
                    this.chain = count;
                    this.chainRange = range;
                };
            }
            // Initialize modifiers from item (gives +1 chain by default)
            if (statSystem) {
                // add a flat modifier to chain_count
                try {
                    statSystem.addModifier('chain_count', { type: 'flat', value: 1, source: 'chain_module' });
                } catch (e) { /* ignore if stat not present or already added */ }
            }
        },
        onLoad: null
    }],

    // Multishot Module - adds a multishot stat and toggles player weapon behavior
    ['multishot_module', {
        id: 'multishot_module',
        name: 'Multishot Module',
        cost: 180,
        description: 'Enables multishot and registers multishot_count stat.',
        category: 'weapon',
        definesStats: [
            {
                id: 'multishot_count',
                name: 'Multishot Count',
                baseValue: 1,
                description: 'Extra projectiles fired per shot',
                category: 'offensive',
                upgradeWeight: 0.6,
                maxValue: 5
            }
        ],
        dependencies: [],
        conflictsWith: [],
        onActivate: (player, { statSystem }) => {
            // Expose property on player's weaponComponent so firing code can read it
            if (player && player.weaponComponent) {
                player.weaponComponent.getMultishotCount = function() {
                    return statSystem ? (statSystem.getStatValue('multishot_count') || 0) : (this.multishot || 0);
                };
            }
            // Seed a small flat bonus
            if (statSystem) {
                try {
                    statSystem.addModifier('multishot_count', { type: 'flat', value: 1, source: 'multishot_module' });
                } catch (e) { /* ignore */ }
            }
        },
        onLoad: null
    }],

    // Lifesteal Implant - registers lifesteal stat and sets player.lifesteal base
    ['lifesteal_implant', {
        id: 'lifesteal_implant',
        name: 'Lifesteal Implant',
        cost: 220,
        description: 'Heals a portion of damage dealt and registers lifesteal stat.',
        category: 'defensive',
        definesStats: [
            {
                id: 'lifesteal',
                name: 'Lifesteal',
                baseValue: 0.02,
                description: 'Fraction of damage healed on hit',
                category: 'defensive',
                upgradeWeight: 0.4,
                maxValue: 0.25
            }
        ],
        dependencies: [],
        conflictsWith: [],
        onActivate: (player, { statSystem }) => {
            if (player) {
                player.lifesteal = statSystem ? statSystem.getStatValue('lifesteal') : (player.lifesteal || 0);
            }
            // Add a small percent modifier so the stat has initial value (defensive)
            if (statSystem) {
                try {
                    statSystem.addModifier('lifesteal', { type: 'percent', value: 0, source: 'lifesteal_implant' });
                } catch (e) { /* ignore */ }
            }
        },
        onLoad: null
    }],

    // Advanced Targeting Suite - registers criticalChance & criticalDamage stats
    ['targeting_suite', {
        id: 'targeting_suite',
        name: 'Targeting Suite',
        cost: 240,
        description: 'Improves critical hits by registering criticalChance and criticalDamage stats.',
        category: 'offensive',
        definesStats: [
            {
                id: 'criticalChance',
                name: 'Critical Chance',
                baseValue: 0.02,
                description: 'Chance to deal critical damage',
                category: 'offensive',
                upgradeWeight: 0.5,
                maxValue: 0.5
            },
            {
                id: 'criticalDamage',
                name: 'Critical Damage',
                baseValue: 0.5,
                description: 'Extra damage multiplier on crit',
                category: 'offensive',
                upgradeWeight: 0.5,
                maxValue: 2.0
            }
        ],
        dependencies: [],
        conflictsWith: [],
        onActivate: (player, { statSystem }) => {
            // Keep player's getters consistent with statSystem
            if (player && player.statsComponent) {
                // no-op; many systems already read from statSystem or statsComponent
            }
            if (statSystem) {
                try {
                    // grant a small flat chance bonus
                    statSystem.addModifier('criticalChance', { type: 'flat', value: 0.01, source: 'targeting_suite' });
                } catch (e) { /* ignore */ }
            }
        },
        onLoad: null
    }],

    // Mobility Frame - registers speed stat and seeds a modifier
    ['mobility_frame', {
        id: 'mobility_frame',
        name: 'Mobility Frame',
        cost: 150,
        description: 'Improves movement speed and registers speed stat (if not present).',
        category: 'mobility',
        definesStats: [
            {
                id: 'speed',
                name: 'Speed',
                baseValue: 5,
                description: 'Movement speed',
                category: 'mobility',
                upgradeWeight: 0.7,
                maxValue: 20
            }
        ],
        dependencies: [],
        conflictsWith: [],
        onActivate: (player, { statSystem }) => {
            if (statSystem) {
                try {
                    statSystem.addModifier('speed', { type: 'flat', value: 0.8, source: 'mobility_frame' });
                } catch (e) { /* ignore */ }
            } else if (player) {
                player.speed = (player.speed || 5) + 0.8;
            }
        },
        onLoad: null
    }],

    // Damage Core - registers damage stat and seeds modifier
    ['damage_core', {
        id: 'damage_core',
        name: 'Damage Core',
        cost: 200,
        description: 'Increases base damage and registers damage stat.',
        category: 'offensive',
        definesStats: [
            {
                id: 'damage',
                name: 'Damage',
                baseValue: 1,
                description: 'Bullet damage',
                category: 'offensive',
                upgradeWeight: 0.9,
                maxValue: 50
            }
        ],
        dependencies: [],
        conflictsWith: [],
        onActivate: (player, { statSystem }) => {
            if (statSystem) {
                try {
                    statSystem.addModifier('damage', { type: 'flat', value: 1, source: 'damage_core' });
                } catch (e) { /* ignore */ }
            } else if (player) {
                player.damage = (player.damage || 1) + 1;
            }
        },
        onLoad: null
    }]
]);

export default ItemFactory;