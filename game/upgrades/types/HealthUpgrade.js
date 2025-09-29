import { BaseUpgrade } from '../BaseUpgrade.js';

export class HealthUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'health',
            name: 'Max Health',
            description: 'Increases your maximum health',
            icon: '❤️',
            maxLevel: 5,
            category: 'defensive',
            rarity: 'common',
            values: config.values || {
                common: 5,
                uncommon: 7,
                rare: 9,
                legendary: 12
            }
        });
    }

    apply(player, values) {
        const healthIncrease = values.health || values[this.id] || values.common;
        player.maxHealth = (player.maxHealth || 100) + healthIncrease;
        player.health = Math.min(player.health, player.maxHealth);

        // Update game state
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.maxHealth = player.maxHealth;
            window.gameInstance.gameState.health = player.health;
        }
    }

    getDescription(values) {
        const healthIncrease = values.health || values[this.id] || values.common;
        return `Increases max health by ${healthIncrease} HP`;
    }
    
    getValues(rarity) {
        const baseValues = this.values;
        return {
            health: baseValues[rarity] || baseValues.common
        };
    }
}