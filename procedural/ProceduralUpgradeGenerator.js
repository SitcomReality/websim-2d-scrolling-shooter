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

    generateUpgrade(playerLevel, luck = 1.0) {
        // Select a random template
        const templates = Array.from(this.upgradeTemplates.values());
        const template = templates[Math.floor(Math.random() * templates.length)];

        // Determine rarity based on player level and luck
        const rarity = this.rollRarity(playerLevel, luck);

        // Calculate values based on template and rarity
        const values = this.calculateValues(template, rarity, playerLevel);

        // Create unique ID
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

    generateUpgradeChoices(playerLevel, count = 3, luck = 1.0) {
        const choices = [];
        const usedTemplates = new Set();

        for (let i = 0; i < count; i++) {
            let upgrade = this.generateUpgrade(playerLevel, luck);

            // Ensure we don't get duplicate templates in the same selection
            let attempts = 0;
            while (usedTemplates.has(upgrade.templateId) && attempts < 10) {
                upgrade = this.generateUpgrade(playerLevel, luck);
                attempts++;
            }

            usedTemplates.add(upgrade.templateId);
            choices.push(upgrade);
        }

        return choices;
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