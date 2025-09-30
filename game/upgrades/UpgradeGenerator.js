import { ProceduralUpgradeSystem } from '../../systems/ProceduralUpgradeSystem.js';

export class UpgradeGenerator {
    constructor(rarityWeights) {
        this.rarityWeights = rarityWeights;
        this.proceduralGenerator = null;
        this.proceduralChance = 0.3; // 30% chance for procedural upgrades
    }

    generateUpgradeChoices(availableUpgrades, level, playerUpgrades, luck = 1.0) {
        const choices = [];
        const available = availableUpgrades.filter(upgrade =>
            upgrade.canBeOffered(level, playerUpgrades)
        );

        // Mix of regular and procedural upgrades
        const proceduralCount = Math.random() < this.proceduralChance ? Math.floor(Math.random() * 2) + 1 : 0;
        const regularCount = Math.min(4 - proceduralCount, available.length);

        // Add regular upgrades
        for (let i = 0; i < regularCount; i++) {
            const upgrade = available[Math.floor(Math.random() * available.length)];
            const rarity = this.rollRarityWithLuck(luck);
            const values = upgrade.getValues(rarity);
            choices.push({
                upgrade: upgrade,
                rarity: rarity,
                values: values
            });
        }

        // Add procedural upgrades
        for (let i = 0; i < proceduralCount; i++) {
            const proceduralUpgrade = this.generateProceduralUpgrade(level, luck);
            if (proceduralUpgrade) {
                choices.push(proceduralUpgrade);
            }
        }

        return choices;
    }

    generateProceduralUpgrade(playerLevel, luck) {
        if (!this.proceduralGenerator) {
            this.proceduralGenerator = new ProceduralUpgradeSystem();
        }

        const proceduralData = this.proceduralGenerator.generator.generateUpgrade(playerLevel, luck);
        const proceduralUpgrade = new ProceduralUpgradeSystem({
            proceduralData: proceduralData
        });

        return {
            upgrade: proceduralUpgrade,
            rarity: proceduralData.rarity,
            values: proceduralData.values
        };
    }

    rollRarityWithLuck(luck) {
        // Apply luck modifier to rarity weights
        const modifiedWeights = {
            common: Math.max(10, this.rarityWeights.common - (luck - 1) * 15),
            uncommon: Math.min(40, this.rarityWeights.uncommon + (luck - 1) * 8),
            rare: Math.min(25, this.rarityWeights.rare + (luck - 1) * 4),
            legendary: Math.min(25, this.rarityWeights.legendary + (luck - 1) * 3)
        };

        // Normalize weights to ensure they sum to 100
        const total = Object.values(modifiedWeights).reduce((a, b) => a + b, 0);
        const normalizedWeights = {};
        for (const [rarity, weight] of Object.entries(modifiedWeights)) {
            normalizedWeights[rarity] = (weight / total) * 100;
        }

        const roll = Math.random() * total;

        let cumulative = 0;
        for (const [rarity, weight] of Object.entries(normalizedWeights)) {
            cumulative += weight;
            if (roll <= cumulative) return rarity;
        }
        return 'common';
    }
}