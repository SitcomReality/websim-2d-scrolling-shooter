import { BaseUpgrade } from '../BaseUpgrade.js';

export class CriticalChanceUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'criticalChance',
            name: 'Critical Chance',
            description: 'Increases your chance to deal critical damage',
            icon: '🎯',
            maxLevel: 5,
            category: 'offensive',
            rarity: 'uncommon',
            values: config.values || {
                common: 0.02,
                uncommon: 0.03,
                rare: 0.04,
                legendary: 0.06
            }
        });
    }

    apply(player, values) {
        const chanceIncrease = values.criticalChance || values[this.id] || values.common;
        if (player.statsComponent) {
            player.statsComponent.increaseCriticalChance(chanceIncrease);
        } else {
            player.criticalChance = (player.criticalChance || 0.01) + chanceIncrease;
        }
    }

    getDescription(values) {
        const chanceIncrease = values.criticalChance || values[this.id] || values.common;
        const percent = Math.round(chanceIncrease * 100);
        return `+${percent}% critical hit chance`;
    }

    getValues(rarity) {
        const baseValues = this.values;
        return {
            criticalChance: baseValues[rarity] || baseValues.common
        };
    }
}