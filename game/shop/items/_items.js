// Centralized item definitions split out for clarity
const _items = new Map([
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
            if (player && player.weaponComponent) {
                player.weaponComponent.setChain = player.weaponComponent.setChain || function(count, range, dmgReduction) {
                    this.chain = count;
                    this.chainRange = range;
                };
            }
            if (statSystem) {
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
            if (player && player.weaponComponent) {
                player.weaponComponent.getMultishotCount = function() {
                    return statSystem ? (statSystem.getStatValue('multishot_count') || 0) : (this.multishot || 0);
                };
            }
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
            if (statSystem) {
                try {
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
    }],

    // Duplicator Module - multi-shot on-fire upgrade
    ['duplicator_module', {
        id: 'duplicator_module',
        name: 'Duplicator Module',
        cost: 220,
        description: 'Adds extra projectiles to each shot (multishot) and registers multishot stats.',
        category: 'weapon',
        definesStats: [
            { id: 'multishot_count', name: 'Multishot Count', baseValue: 1, description: 'Extra projectiles per shot', category: 'offensive', upgradeWeight: 0.6, maxValue: 6 },
            { id: 'multishot_damage_penalty', name: 'Multishot Damage Penalty', baseValue: -0.25, description: 'Multiplier applied to extra projectile damage (negative = reduction)', category: 'offensive', upgradeWeight: 0.2, maxValue: 0 }
        ],
        dependencies: [],
        conflictsWith: [],
        onActivate: (player, { statSystem }) => {
            if (statSystem) {
                try {
                    statSystem.registerStat({ id: 'multishot_count', name: 'Multishot Count', baseValue: 1, category: 'offensive', upgradeWeight: 0.6 });
                    statSystem.registerStat({ id: 'multishot_damage_penalty', name: 'Multishot Damage Penalty', baseValue: -0.25, category: 'offensive', upgradeWeight: 0.2 });
                } catch (e) { /* ignore registration errors */ }
            }
        },
        onLoad: null
    }],

    // Flank Cannons - side-shot on-fire upgrade (fires while charging)
    ['flank_cannons', {
        id: 'flank_cannons',
        name: 'Flank Cannons',
        cost: 240,
        description: 'Fires weaker side projectiles continuously (including during charge) and registers sideshot stats.',
        category: 'weapon',
        definesStats: [
            { id: 'sideshot_damage_penalty', name: 'Sideshot Damage Penalty', baseValue: -0.25, description: 'Damage multiplier for side projectiles (negative = reduction)', category: 'offensive', upgradeWeight: 0.3, maxValue: 0 },
            { id: 'sideshot_fire_rate_multiplier', name: 'Sideshot Fire Rate Multiplier', baseValue: 0.5, description: 'Fraction of main gun rate for side shots', category: 'offensive', upgradeWeight: 0.3, maxValue: 2.0 }
        ],
        dependencies: [],
        conflictsWith: [],
        onActivate: (player, { statSystem }) => {
            if (statSystem) {
                try {
                    statSystem.registerStat({ id: 'sideshot_damage_penalty', name: 'Sideshot Damage Penalty', baseValue: -0.25, category: 'offensive', upgradeWeight: 0.3 });
                    statSystem.registerStat({ id: 'sideshot_fire_rate_multiplier', name: 'Sideshot Fire Rate Multiplier', baseValue: 0.5, category: 'offensive', upgradeWeight: 0.3 });
                } catch (e) { /* ignore registration errors */ }
            }
        },
        onLoad: null
    }]
]);

export default _items;