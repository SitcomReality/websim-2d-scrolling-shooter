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
        // Apply via central StatSystem only
        const statSystem = player && player.statSystem;
        if (!statSystem || typeof statSystem.getStatValue !== 'function') {
            throw new Error('CriticalChanceUpgrade.apply: player.statSystem is required');
        }
        const current = statSystem.getStatValue('criticalChance') || 0;
        statSystem.setBaseValue('criticalChance', current + chanceIncrease);
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