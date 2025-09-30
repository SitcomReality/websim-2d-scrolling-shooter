import { ProceduralUpgradeGenerator } from '../procedural/ProceduralUpgradeGenerator.js';
import { BaseUpgrade } from '../game/upgrades/BaseUpgrade.js';

export class ProceduralUpgradeSystem extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'procedural',
            name: 'Procedural Upgrade',
            description: 'A dynamically generated upgrade',
            icon: '',
            maxLevel: 10,
            category: 'procedural',
            rarity: config.rarity || 'common',
            values: config.values || {}
        });

        this.generator = new ProceduralUpgradeGenerator();
        this.isProcedural = true;

        // Override with procedural data if provided
        if (config.proceduralData) {
            this.name = config.proceduralData.name;
            this.description = config.proceduralData.description;
            this.icon = config.proceduralData.icon;
            this.category = config.proceduralData.category;
            this.rarity = config.proceduralData.rarity;
            this.values = config.proceduralData.values;
            this.maxLevel = config.proceduralData.maxLevel;
        }
    }

    apply(player, values) {
        // Apply the procedural upgrade effects
        const upgradeValue = Object.values(values)[0];
        const upgradeKey = Object.keys(values)[0];

        switch (upgradeKey) {
            case 'damage':
                player.damage = (player.damage || 1) + upgradeValue;
                break;
            case 'speed':
                player.speed = (player.speed || 5) + upgradeValue;
                break;
            case 'defense':
                player.defense = (player.defense || 0) + upgradeValue;
                break;
            case 'utility':
                if (player.utilityComponent) {
                    player.utilityComponent.addUtility('procedural', {
                        name: 'Procedural Utility',
                        cooldown: 10000 - (upgradeValue * 1000),
                        duration: 3000 + (upgradeValue * 500)
                    });
                }
                break;
            case 'luck':
                player.luck = (player.luck || 1.0) + upgradeValue;
                break;
            case 'critical':
                player.criticalChance = (player.criticalChance || 0) + upgradeValue;
                break;
            case 'lifesteal':
                player.lifesteal = (player.lifesteal || 0) + upgradeValue;
                break;
            case 'multishot':
                if (player.weaponComponent) {
                    player.weaponComponent.setMultishot(upgradeValue);
                }
                break;
        }
    }

    getDescription(values) {
        const upgradeKey = Object.keys(values)[0];
        const upgradeValue = Object.values(values)[0];

        switch (upgradeKey) {
            case 'damage':
                return `Increases damage by ${upgradeValue}`;
            case 'speed':
                return `Increases speed by ${upgradeValue.toFixed(1)}`;
            case 'defense':
                return `Reduces damage taken by ${Math.round(upgradeValue * 100)}%`;
            case 'utility':
                return `Improves utility systems by ${upgradeValue}`;
            case 'luck':
                return `Increases luck by ${upgradeValue.toFixed(1)}`;
            case 'critical':
                return `Critical hit chance +${Math.round(upgradeValue * 100)}%`;
            case 'lifesteal':
                return `Lifesteal +${Math.round(upgradeValue * 100)}%`;
            case 'multishot':
                return `Fire ${upgradeValue} additional projectiles`;
            default:
                return this.description;
        }
    }

    getValues(rarity) {
        // Return the procedural values directly
        return this.values;
    }

    canBeOffered(playerState, upgradeState) {
        // Procedural upgrades can always be offered
        return true;
    }
}