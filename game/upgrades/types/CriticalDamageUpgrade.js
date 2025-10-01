import { BaseUpgrade } from '../BaseUpgrade.js';

export class CriticalDamageUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'criticalDamage',
            name: 'Critical Damage',
            description: 'Increases damage dealt by critical hits',
            icon: '💥',
            maxLevel: 5,
            category: 'offensive',
            rarity: 'rare',
            values: config.values || {
                common: 0.25,
                uncommon: 0.35,
                rare: 0.5,
                legendary: 0.75
            }
        });
    }

    apply(player, values) {
        const damageIncrease = values.criticalDamage || values[this.id] || values.common;
        // Apply via central StatSystem only
        const statSystem = player && player.statSystem;
        if (!statSystem || typeof statSystem.getStatValue !== 'function') {
            throw new Error('CriticalDamageUpgrade.apply: player.statSystem is required');
        }
        const current = statSystem.getStatValue('criticalDamage') || 0;
        statSystem.setBaseValue('criticalDamage', current + damageIncrease);
    }

    getDescription(values) {
        const damageIncrease = values.criticalDamage || values[this.id] || values.common;
        const percent = Math.round(damageIncrease * 100);
        return `+${percent}% critical hit damage`;
    }

    getValues(rarity) {
        const baseValues = this.values;
        return {
            criticalDamage: baseValues[rarity] || baseValues.common
        };
    }
}