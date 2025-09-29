import { BaseUpgrade } from '../BaseUpgrade.js';

export class MovementUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'movement',
            name: 'Movement Speed',
            description: 'Increases your movement speed',
            icon: '💨',
            maxLevel: 5,
            category: 'mobility',
            rarity: 'common',
            values: config.values || {
                common: 0.5,
                uncommon: 0.8,
                rare: 1.2,
                legendary: 1.8
            }
        });
    }

    apply(player, values) {
        const speedIncrease = values.movement || values[this.id] || values.common;
        if (player.movementSystem && player.movementComponent) {
            player.movementComponent.increaseSpeed(speedIncrease);
        } else {
            player.speed = (player.speed || 5) + speedIncrease;
        }
    }

    getDescription(values) {
        const speedIncrease = values.movement || values[this.id] || values.common;
        return `Increases speed by ${speedIncrease.toFixed(1)}`;
    }

    getValues(rarity) {
        const baseValues = this.values;
        return {
            movement: baseValues[rarity] || baseValues.common
        };
    }
}