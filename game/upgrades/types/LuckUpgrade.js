import { BaseUpgrade } from '../BaseUpgrade.js';

export class LuckUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'luck',
            name: 'Luck',
            description: 'Increases the quality of upgrade offerings',
            icon: '🍀',
            maxLevel: 5,
            category: 'utility',
            rarity: 'uncommon',
            values: config.values || {
                common: 0.2,
                uncommon: 0.3,
                rare: 0.4,
                legendary: 0.6
            }
        });
    }

    apply(player, values) {
        const luckIncrease = values.luck || values[this.id] || values.common;
        player.luck = (player.luck || 1.0) + luckIncrease;
    }

    getDescription(values) {
        const luckIncrease = values.luck || values[this.id] || values.common;
        return `Increases luck by ${luckIncrease.toFixed(1)}`;
    }

    getValues(rarity) {
        const baseValues = this.values;
        return {
            luck: baseValues[rarity] || baseValues.common
        };
    }
}