export class UpgradeSystem {
    constructor() {
        this.availableUpgrades = [
            new HealthUpgrade(),
            new DamageUpgrade(),
            new SpeedUpgrade(),
            new FireRateUpgrade(),
            new HealthPickupChanceUpgrade(),
            new HealthPickupAmountUpgrade()
        ];
        
        this.playerUpgrades = new Map();
        this.rarityWeights = {
            common: 70,
            uncommon: 20,
            rare: 8,
            legendary: 2
        };
    }
    
    generateUpgradeChoices(level, playerUpgrades) {
        const choices = [];
        const available = this.getAvailableUpgrades(level, playerUpgrades);
        
        for (let i = 0; i < Math.min(4, available.length); i++) {
            const upgrade = available[Math.floor(Math.random() * available.length)];
            const rarity = this.rollRarity();
            const values = upgrade.getValues(rarity);
            choices.push({
                upgrade: upgrade,
                rarity: rarity,
                values: values
            });
        }
        
        return choices;
    }
    
    getAvailableUpgrades(level, playerUpgrades) {
        return this.availableUpgrades.filter(upgrade => 
            upgrade.canBeOffered(level, playerUpgrades)
        );
    }
    
    rollRarity() {
        const total = Object.values(this.rarityWeights).reduce((a, b) => a + b, 0);
        const roll = Math.random() * total;
        
        let cumulative = 0;
        for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
            cumulative += weight;
            if (roll <= cumulative) return rarity;
        }
        return 'common';
    }
    
    applyUpgrade(upgradeChoice, player) {
        const { upgrade, rarity, values } = upgradeChoice;
        
        // Apply upgrade using the new component system
        player.applyUpgrade(values);
        
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

// Import upgrade types
import { HealthUpgrade } from '../game/upgrades/types/HealthUpgrade.js';
import { DamageUpgrade } from '../game/upgrades/types/DamageUpgrade.js';
import { SpeedUpgrade } from '../game/upgrades/types/SpeedUpgrade.js';
import { FireRateUpgrade } from '../game/upgrades/types/FireRateUpgrade.js';
import { HealthPickupChanceUpgrade } from '../game/upgrades/types/HealthPickupChanceUpgrade.js';
import { HealthPickupAmountUpgrade } from '../game/upgrades/types/HealthPickupAmountUpgrade.js';