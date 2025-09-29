import { HealthUpgrade } from './types/HealthUpgrade.js';
import { DamageUpgrade } from './types/DamageUpgrade.js';
import { SpeedUpgrade } from './types/SpeedUpgrade.js';
import { FireRateUpgrade } from './types/FireRateUpgrade.js';
import { HealthPickupChanceUpgrade } from './types/HealthPickupChanceUpgrade.js';
import { HealthPickupAmountUpgrade } from './types/HealthPickupAmountUpgrade.js';
import { MovementUpgrade } from './types/MovementUpgrade.js';
import { UtilityUpgrade } from './types/UtilityUpgrade.js';
import { LuckUpgrade } from './types/LuckUpgrade.js';
import { CriticalChanceUpgrade } from './types/CriticalChanceUpgrade.js';
import { CriticalDamageUpgrade } from './types/CriticalDamageUpgrade.js';
import { ProceduralUpgradeSystem } from '../../systems/ProceduralUpgradeSystem.js';

export class UpgradeSystem {
    constructor(weaponFactory) {
        this.weaponFactory = weaponFactory;
        this.availableUpgrades = [
            new HealthUpgrade(),
            new DamageUpgrade(),
            new SpeedUpgrade(),
            new FireRateUpgrade(),
            new HealthPickupChanceUpgrade(),
            new HealthPickupAmountUpgrade(),
            new MovementUpgrade(),
            new UtilityUpgrade(),
            new LuckUpgrade(),
            new CriticalChanceUpgrade(),
            new CriticalDamageUpgrade()
        ];

        this.playerUpgrades = new Map();
        this.rarityWeights = {
            common: 70,
            uncommon: 20,
            rare: 8,
            legendary: 2
        };

        this.proceduralGenerator = null;
        this.proceduralChance = 0.3; // 30% chance for procedural upgrades
    }

    generateUpgradeChoices(level, playerUpgrades, luck = 1.0) {
        const choices = [];
        const available = this.getAvailableUpgrades(level, playerUpgrades);

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

    getAvailableUpgrades(level, playerUpgrades) {
        return this.availableUpgrades.filter(upgrade =>
            upgrade.canBeOffered(level, playerUpgrades)
        );
    }

    applyUpgrade(upgradeChoice, player) {
        const { upgrade, rarity, values } = upgradeChoice;
        upgrade.apply(player, values);

        if (!this.playerUpgrades.has(upgrade.name)) {
            this.playerUpgrades.set(upgrade.name, { count: 0 });
        }
        this.playerUpgrades.get(upgrade.name).count++;
    }

    createUpgradeCard(choice, index) {
        const card = document.createElement('div');
        card.className = `upgrade-card ${choice.rarity}`;

        const upgrade = choice.upgrade;
        const values = choice.values;

        let description = '';
        let valueText = '';

        if (upgrade.isProcedural) {
            // Handle procedural upgrades
            description = upgrade.getDescription(values);
            const valueKey = Object.keys(values)[0];
            const valueAmount = Object.values(values)[0];

            if (valueKey === 'damage') {
                valueText = `+${valueAmount} Damage`;
            } else if (valueKey === 'speed') {
                valueText = `+${valueAmount.toFixed(1)} Speed`;
            } else if (valueKey === 'defense') {
                valueText = `-${Math.round(valueAmount * 100)}% Damage Taken`;
            } else if (valueKey === 'luck') {
                valueText = `+${valueAmount.toFixed(1)} Luck`;
            } else if (valueKey === 'critical') {
                valueText = `+${Math.round(valueAmount * 100)}% Critical`;
            } else if (valueKey === 'lifesteal') {
                valueText = `+${Math.round(valueAmount * 100)}% Lifesteal`;
            } else if (valueKey === 'multishot') {
                valueText = `+${valueAmount} Projectiles`;
            } else if (valueKey === 'utility') {
                valueText = `+${valueAmount} Utility`;
            }
        } else {
            // Handle regular upgrades
            if (upgrade.name === 'Max Health') {
                description = 'Increases your maximum health';
                const healthIncrease = values.health || values[upgrade.id] || values.common;
                valueText = `+${healthIncrease} HP`;
            } else if (upgrade.name === 'Damage Boost') {
                description = 'Increases your bullet damage';
                const damageIncrease = values.damage || values[upgrade.id] || values.common;
                valueText = `+${damageIncrease} Damage`;
            } else if (upgrade.name === 'Movement Speed') {
                description = 'Increases your movement speed';
                const speedIncrease = values.speed || values[upgrade.id] || values.common;
                valueText = `+${speedIncrease.toFixed(1)} Speed`;
            } else if (upgrade.name === 'Fire Rate') {
                description = 'Increases your firing speed';
                const multiplier = values.fireRateMultiplier || values.fireRate || values[upgrade.id] || values.common;
                valueText = `${Math.round((1 - multiplier) * 100)}% Faster`;
            } else if (upgrade.name === 'Health Pickup Chance') {
                description = 'Increases chance of health pickups from enemies';
                const chanceIncrease = values.chanceIncrease || values[upgrade.id] || values.common;
                valueText = `+${Math.round(chanceIncrease * 100)}% Chance`;
            } else if (upgrade.name === 'Health Pickup Value') {
                description = 'Increases health restored by pickups';
                const amountIncrease = values.amountIncrease || values[upgrade.id] || values.common;
                valueText = `+${amountIncrease} Health`;
            } else if (upgrade.name === 'Utility Boost') {
                description = 'Enhances utility systems';
                const utilityBoost = values.utility || values[upgrade.id] || values.common;
                valueText = `+${utilityBoost} Utility`;
            } else if (upgrade.name === 'Luck') {
                description = 'Increases the quality of upgrade offerings';
                const luckIncrease = values.luck || values[upgrade.id] || values.common;
                valueText = `+${luckIncrease.toFixed(1)} Luck`;
            } else if (upgrade.name === 'Critical Chance') {
                description = 'Increases your chance to deal critical damage';
                const chanceIncrease = values.criticalChance || values[upgrade.id] || values.common;
                valueText = `+${Math.round(chanceIncrease * 100)}% Critical Chance`;
            } else if (upgrade.name === 'Critical Damage') {
                description = 'Increases damage dealt by critical hits';
                const damageIncrease = values.criticalDamage || values[upgrade.id] || values.common;
                valueText = `+${Math.round(damageIncrease * 100)}% Critical Damage`;
            }
        }

        card.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-description">${description}</div>
            <div class="upgrade-value">${valueText}</div>
            <div class="upgrade-rarity">${choice.rarity}</div>
        `;

        return card;
    }
}