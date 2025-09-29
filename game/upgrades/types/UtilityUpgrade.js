import { BaseUpgrade } from '../BaseUpgrade.js';

export class UtilityUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'utility',
            name: 'Utility Boost',
            description: 'Enhances utility systems',
            icon: '🔧',
            maxLevel: 5,
            category: 'utility',
            rarity: 'rare',
            values: config.values || {
                common: 1,
                uncommon: 2,
                rare: 3,
                legendary: 5
            }
        });
    }

    apply(player, values) {
        const utilityBoost = values.utility || values[this.id] || values.common;
        if (player.utilitySystem && player.utilityComponent) {
            // Apply utility system enhancements
            player.utilityComponent.addUtility('boost', {
                name: 'Speed Boost',
                cooldown: 10000 - (utilityBoost * 1000),
                duration: 3000 + (utilityBoost * 500),
                onActivate: () => {
                    if (player.movementComponent) {
                        player.movementComponent.setSpeedMultiplier(1.5);
                    }
                },
                onDeactivate: () => {
                    if (player.movementComponent) {
                        player.movementComponent.setSpeedMultiplier(1.0);
                    }
                }
            });
        }
    }

    getDescription(values) {
        const utilityBoost = values.utility || values[this.id] || values.common;
        return `Improves utility systems by ${utilityBoost}`;
    }

    getValues(rarity) {
        const baseValues = this.values;
        return {
            utility: baseValues[rarity] || baseValues.common
        };
    }
}