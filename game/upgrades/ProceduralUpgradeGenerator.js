export class ProceduralUpgradeGenerator {
    constructor() {
        this.upgradeTemplates = new Map();
        this.rarityMultipliers = {
            common: 1.0,
            uncommon: 1.5,
            rare: 2.0,
            legendary: 3.0
        };

        this.initializeTemplates();
    }

    initializeTemplates() {
        // Damage-based upgrades
        this.upgradeTemplates.set('damage', {
            name: 'Damage',
            description: 'Increases your damage output',
            icon: '⚔️',
            category: 'offensive',
            baseValue: 1,
            variance: 0.5,
            maxLevel: 10,
            scaling: 'linear'
        });

        // Speed-based upgrades
        this.upgradeTemplates.set('speed', {
            name: 'Speed',
            description: 'Increases movement speed',
            icon: '💨',
            category: 'mobility',
            baseValue: 0.5,
            variance: 0.3,
            maxLevel: 8,
            scaling: 'linear'
        });

        // Defense-based upgrades
        this.upgradeTemplates.set('defense', {
            name: 'Defense',
            description: 'Reduces damage taken',
            icon: '🛡️',
            category: 'defensive',
            baseValue: 0.1,
            variance: 0.05,
            maxLevel: 6,
            scaling: 'exponential'
        });

        // Utility-based upgrades
        this.upgradeTemplates.set('utility', {
            name: 'Utility',
            description: 'Improves utility systems',
            icon: '🔧',
            category: 'utility',
            baseValue: 1,
            variance: 0.5,
            maxLevel: 5,
            scaling: 'linear'
        });

        // Luck-based upgrades
        this.upgradeTemplates.set('luck', {
            name: 'Luck',
            description: 'Increases luck stat',
            icon: '🍀',
            category: 'utility',
            baseValue: 0.2,
            variance: 0.1,
            maxLevel: 5,
            scaling: 'linear'
        });

        // Special upgrades
        this.upgradeTemplates.set('critical', {
            name: 'Critical Strike',
            description: 'Chance for critical hits',
            icon: '💥',
            category: 'offensive',
            baseValue: 0.05,
            variance: 0.02,
            maxLevel: 5,
            scaling: 'exponential'
        });

        this.upgradeTemplates.set('lifesteal', {
            name: 'Life Steal',
            description: 'Heal on damage dealt',
            icon: '💉',
            category: 'defensive',
            baseValue: 0.02,
            variance: 0.01,
            maxLevel: 4,
            scaling: 'linear'
        });

        this.upgradeTemplates.set('multishot', {
            name: 'Multishot',
            description: 'Fire multiple projectiles',
            icon: '🔫',
            category: 'offensive',
            baseValue: 1,
            variance: 0,
            maxLevel: 3,
            scaling: 'linear'
        });
    }

    // new small LCG for deterministic behavior when seed provided
    _lcg(seed = 1) {
        let state = seed >>> 0;
        return {
            next() {
                state = (1664525 * state + 1013904223) >>> 0;
                return state / 0xFFFFFFFF;
            },
            nextRange(min, max) {
                return Math.floor(this.next() * (max - min + 1)) + min;
            },
            pick(array) {
                if (!array || array.length === 0) return null;
                return array[this.nextRange(0, array.length - 1)];
            }
        };
    }

    // signature now accepts optional seed and statSystem to generate dynamic stat-based upgrades
    generateUpgrade(playerLevel, luck = 1.0, seed = null, statSystem = null) {
        // deterministic RNG: prefer provided seed, else fallback to time-based
        const seedInt = seed ? (typeof seed === 'number' ? Math.floor(seed) : String(seed).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) : (Date.now() & 0x7fffffff);
        const rng = this._lcg(seedInt + Math.floor(playerLevel * 997) + Math.floor((luck-1)*1000));

        // If a statSystem is provided, try to produce a stat-based procedural upgrade
        let statBased = null;
        try {
            if (statSystem && typeof statSystem.getUpgradableStats === 'function') {
                const allUpgradable = statSystem.getUpgradableStats(); // array of stat defs
                // filter and weight by upgradeWeight and category balance
                const pool = [];
                const categoryCounts = {};
                allUpgradable.forEach(s => {
                    const weight = Math.max(0, s.upgradeWeight || 0.01);
                    // push the stat into pool proportional to weight (clamped)
                    const entries = Math.max(1, Math.floor(weight * 10));
                    for (let i=0;i<entries;i++) pool.push(s);
                });

                // avoid offering too many from same category - we will cap usage per generation
                const maxDynamicPerCard = 2;
                if (pool.length > 0) {
                    // pick one template stat for this upgrade
                    const picked = rng.pick(pool);
                    if (picked) {
                        // create a values object either flat or percent depending on stat typical scale
                        const base = picked.baseValue || 1;
                        // decide flat vs percent variety
                        const usePercent = (picked.baseValue !== 0) && Math.abs(picked.baseValue) < 1 && rng.next() > 0.5;
                        const magnitude = usePercent ? (0.05 + rng.next() * 0.15) : Math.max( (base * 0.2), (base >= 1 ? Math.round(Math.max(1, base * (0.2 + rng.next()*0.6))) : 1) );
                        const key = picked.id;
                        const values = {};
                        values[key] = usePercent ? Number((magnitude).toFixed(3)) : Number((magnitude).toFixed(2));

                        statBased = {
                            id: `${picked.id}_proc_${Date.now().toString(36)}_${Math.floor(rng.next()*1000)}`,
                            name: `${picked.name} Boost`,
                            description: `Improves ${picked.name} (${picked.category || 'stat'})`,
                            icon: picked.icon || '⭐',
                            category: picked.category || 'dynamic',
                            rarity: this.rollRarity(playerLevel, luck),
                            values,
                            templateId: picked.id
                        };
                    }
                }
            }
        } catch (e) {
            // if stat-based path fails, fall back to template-based
            statBased = null;
        }

        if (statBased) return statBased;

        // fallback to original random template behavior (unchanged)
        const templates = Array.from(this.upgradeTemplates.values());
        const template = templates[Math.floor(rng.next() * templates.length)];

        const rarity = this.rollRarity(playerLevel, luck);

        const values = this.calculateValues(template, rarity, playerLevel);

        const upgradeId = `${template.name.toLowerCase().replace(/\s+/g, '')}_${Date.now()}`;

        return {
            id: upgradeId,
            name: template.name,
            description: template.description,
            icon: template.icon,
            category: template.category,
            rarity: rarity,
            values: values,
            maxLevel: template.maxLevel,
            templateId: template.name.toLowerCase().replace(/\s+/g, '')
        };
    }

    // generateChoices now can accept optional statSystem, seed and respects cap on dynamic stats per offering
    generateUpgradeChoices(playerLevel, count = 3, luck = 1.0, seed = null, statSystem = null) {
        const choices = [];
        const usedTemplates = new Set();

        // deterministic RNG for the choice set
        const seedInt = seed ? (typeof seed === 'number' ? Math.floor(seed) : String(seed).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) : (Date.now() & 0x7fffffff);
        const rng = this._lcg(seedInt + playerLevel * 7919 + Math.floor((luck-1)*100));

        const dynamicCap = Math.min(2, count - 1); // at most 2 dynamic stats per offering
        let dynamicCount = 0;

        for (let i = 0; i < count; i++) {
            let upgrade = null;

            // try to produce a dynamic/stat-based upgrade when we haven't hit cap and statSystem exists
            if (statSystem && dynamicCount < dynamicCap && rng.next() < 0.6) {
                const statUpgrade = this.generateUpgrade(playerLevel, luck, seedInt + i, statSystem);
                if (statUpgrade && statUpgrade.templateId && statUpgrade.templateId.startsWith(statUpgrade.templateId)) {
                    choices.push({ upgrade: new (function(){return { isProcedural:true, getDescription:()=>statUpgrade.description, id: statUpgrade.id, name: statUpgrade.name, getValues:()=>statUpgrade.values, isDynamic:true }} )(), rarity: statUpgrade.rarity, values: statUpgrade.values });
                    dynamicCount++;
                    continue;
                }
            }

            // else fall back to earlier generate flow
            let attempts = 0;
            let candidate = null;
            while (attempts < 8 && !candidate) {
                attempts++;
                const maybe = this.generateUpgrade(playerLevel, luck, seedInt + i + attempts);
                if (!usedTemplates.has(maybe.templateId)) {
                    candidate = maybe;
                }
            }
            if (!candidate) candidate = this.generateUpgrade(playerLevel, luck, seedInt + i);
            usedTemplates.add(candidate.templateId || candidate.id);
            choices.push({ upgrade: new (function(){return { isProcedural:true, getDescription:()=>candidate.description, id: candidate.id, name: candidate.name, getValues:()=>candidate.values }} )(), rarity: candidate.rarity, values: candidate.values });
        }

        return choices;
    }

    rollRarity(playerLevel, luck) {
        const baseWeights = {
            common: 70,
            uncommon: 20,
            rare: 8,
            legendary: 2
        };

        // Adjust weights based on player level and luck
        const levelBonus = Math.min(playerLevel * 2, 20);
        const luckBonus = (luck - 1) * 15;

        const modifiedWeights = {
            common: Math.max(10, baseWeights.common - levelBonus - luckBonus),
            uncommon: Math.min(40, baseWeights.uncommon + levelBonus * 0.5 + luckBonus * 0.3),
            rare: Math.min(30, baseWeights.rare + levelBonus * 0.3 + luckBonus * 0.4),
            legendary: Math.min(25, baseWeights.legendary + levelBonus * 0.2 + luckBonus * 0.3)
        };

        // Normalize weights
        const total = Object.values(modifiedWeights).reduce((a, b) => a + b, 0);
        const roll = Math.random() * total;

        let cumulative = 0;
        for (const [rarity, weight] of Object.entries(modifiedWeights)) {
            cumulative += weight;
            if (roll <= cumulative) return rarity;
        }

        return 'common';
    }

    calculateValues(template, rarity, playerLevel) {
        const multiplier = this.rarityMultipliers[rarity];
        const levelMultiplier = 1 + (playerLevel - 1) * 0.1; // 10% increase per level

        let baseValue = template.baseValue * multiplier * levelMultiplier;

        // Add variance
        const variance = template.variance * multiplier;
        const randomFactor = 1 + (Math.random() - 0.5) * variance;

        let finalValue = baseValue * randomFactor;

        // Apply scaling
        if (template.scaling === 'exponential') {
            finalValue *= Math.pow(1.1, playerLevel - 1);
        }

        // Round based on value size
        if (finalValue < 1) {
            finalValue = Math.round(finalValue * 100) / 100;
        } else if (finalValue < 10) {
            finalValue = Math.round(finalValue * 10) / 10;
        } else {
            finalValue = Math.round(finalValue);
        }

        return {
            [template.name.toLowerCase().replace(/\s+/g, '')]: finalValue
        };
    }

    getRarityColor(rarity) {
        const colors = {
            common: '#cccccc',
            uncommon: '#00ff00',
            rare: '#0080ff',
            legendary: '#ff00ff'
        };
        return colors[rarity] || colors.common;
    }

    getRarityName(rarity) {
        return rarity.charAt(0).toUpperCase() + rarity.slice(1);
    }
}