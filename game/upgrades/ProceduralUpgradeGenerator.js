import { proceduralTemplates, rarityMultipliers, initializeProceduralTemplates } from './ProceduralUpgradeTemplates.js';

export class ProceduralUpgradeGenerator {
    constructor() {
        // ensure templates are initialized
        initializeProceduralTemplates();
        this.upgradeTemplates = proceduralTemplates;
        this.rarityMultipliers = rarityMultipliers;
    }

    // small deterministic LCG for internal use
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

    // signature accepts optional seed and statSystem to generate dynamic stat-based upgrades
    generateUpgrade(playerLevel, luck = 1.0, seed = null, statSystem = null) {
        const seedInt = seed ? (typeof seed === 'number' ? Math.floor(seed) : String(seed).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) : (Date.now() & 0x7fffffff);
        const rng = this._lcg(seedInt + Math.floor(playerLevel * 997) + Math.floor((luck-1)*1000));

        // Try stat-based upgrade when statSystem provided
        let statBased = null;
        try {
            if (statSystem && typeof statSystem.getUpgradableStats === 'function') {
                const allUpgradable = statSystem.getUpgradableStats(); // array of stat defs
                const pool = [];
                allUpgradable.forEach(s => {
                    const weight = Math.max(0, s.upgradeWeight || 0.01);
                    const entries = Math.max(1, Math.floor(weight * 10));
                    for (let i=0;i<entries;i++) pool.push(s);
                });

                if (pool.length > 0) {
                    const picked = rng.pick(pool);
                    if (picked) {
                        const base = picked.baseValue || 1;
                        const usePercent = (picked.baseValue !== 0) && Math.abs(picked.baseValue) < 1 && rng.next() > 0.5;
                        const magnitude = usePercent ? (0.05 + rng.next() * 0.15) : Math.max((base * 0.2), (base >= 1 ? Math.round(Math.max(1, base * (0.2 + rng.next()*0.6))) : 1));
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
            statBased = null;
        }

        if (statBased) return statBased;

        // Fallback to template-based selection
        const templates = Array.from(this.upgradeTemplates.values());
        const template = templates[Math.floor(rng.next() * templates.length)];

        const rarity = this.rollRarity(playerLevel, luck);

        const values = this.calculateValues(template, rarity, playerLevel);

        const upgradeId = `${template.id || template.name.toLowerCase().replace(/\s+/g, '')}_${Date.now()}`;

        return {
            id: upgradeId,
            name: template.name,
            description: template.description,
            icon: template.icon,
            category: template.category,
            rarity: rarity,
            values: values,
            maxLevel: template.maxLevel,
            templateId: template.id || template.name.toLowerCase().replace(/\s+/g, '')
        };
    }

    // generateUpgradeChoices — deterministic-ish choice set with no duplicate templateIds
    generateUpgradeChoices(playerLevel, count = 3, luck = 1.0, seed = null, statSystem = null) {
        const choices = [];
        const usedTemplates = new Set();

        const seedInt = seed ? (typeof seed === 'number' ? Math.floor(seed) : String(seed).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) : (Date.now() & 0x7fffffff);
        const rng = this._lcg(seedInt + playerLevel * 7919 + Math.floor((luck-1)*100));

        const dynamicCap = Math.min(2, count - 1);
        let dynamicCount = 0;

        for (let i = 0; i < count; i++) {
            // Try dynamic/stat-based when under cap
            if (statSystem && dynamicCount < dynamicCap && rng.next() < 0.6) {
                const statUpgrade = this.generateUpgrade(playerLevel, luck, seedInt + i, statSystem);
                if (statUpgrade && statUpgrade.templateId && !usedTemplates.has(statUpgrade.templateId)) {
                    usedTemplates.add(statUpgrade.templateId);
                    choices.push({ upgrade: this._wrapProcedural(statUpgrade), rarity: statUpgrade.rarity, values: statUpgrade.values });
                    dynamicCount++;
                    continue;
                }
            }

            // Otherwise pick from templates avoiding duplicates
            let attempts = 0;
            let candidate = null;
            while (attempts < 12 && !candidate) {
                attempts++;
                const maybe = this.generateUpgrade(playerLevel, luck, seedInt + i + attempts);
                const tid = maybe.templateId || maybe.id;
                if (!usedTemplates.has(tid)) candidate = maybe;
            }
            if (!candidate) candidate = this.generateUpgrade(playerLevel, luck, seedInt + i);
            usedTemplates.add(candidate.templateId || candidate.id);
            choices.push({ upgrade: this._wrapProcedural(candidate), rarity: candidate.rarity, values: candidate.values });
        }

        return choices;
    }

    // small helper to wrap a procedural-like object so callers can treat it similar to ProceduralUpgradeSystem instances
    _wrapProcedural(data) {
        return {
            isProcedural: true,
            id: data.id,
            name: data.name,
            getDescription: () => data.description,
            getValues: () => data.values
        };
    }

    rollRarity(playerLevel, luck) {
        const baseWeights = {
            common: 70,
            uncommon: 20,
            rare: 8,
            legendary: 2
        };

        const levelBonus = Math.min(playerLevel * 2, 20);
        const luckBonus = (luck - 1) * 15;

        const modifiedWeights = {
            common: Math.max(10, baseWeights.common - levelBonus - luckBonus),
            uncommon: Math.min(40, baseWeights.uncommon + levelBonus * 0.5 + luckBonus * 0.3),
            rare: Math.min(30, baseWeights.rare + levelBonus * 0.3 + luckBonus * 0.4),
            legendary: Math.min(25, baseWeights.legendary + levelBonus * 0.2 + luckBonus * 0.3)
        };

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
        const multiplier = this.rarityMultipliers[rarity] || 1;
        const levelMultiplier = 1 + (playerLevel - 1) * 0.1;

        let baseValue = (template.baseValue || 1) * multiplier * levelMultiplier;

        const variance = (template.variance || 0) * multiplier;
        const randomFactor = 1 + (Math.random() - 0.5) * variance;

        let finalValue = baseValue * randomFactor;

        if (template.scaling === 'exponential') {
            finalValue *= Math.pow(1.1, playerLevel - 1);
        }

        if (finalValue < 1) {
            finalValue = Math.round(finalValue * 100) / 100;
        } else if (finalValue < 10) {
            finalValue = Math.round(finalValue * 10) / 10;
        } else {
            finalValue = Math.round(finalValue);
        }

        const key = (template.id || template.name || 'value').toLowerCase().replace(/\s+/g, '');

        return {
            [key]: finalValue
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

export { ProceduralUpgradeGenerator as default };