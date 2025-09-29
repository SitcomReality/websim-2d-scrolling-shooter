import { BaseUpgrade } from '../BaseUpgrade.js';

export class DamageUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'damage',
            name: 'Damage Boost',
            description: 'Increases your bullet damage',
            icon: '⚔️',
            maxLevel: 5,
            category: 'offensive',
            rarity: 'common',
            values: config.values || {
                common: 1,
                uncommon: 2,
                rare: 3,
                legendary: 5
            }
        });
    }
    
    apply(player, values) {
        const damageIncrease = values.damage || values[this.id] || values.common;
        player.damage = (player.damage || 1) + damageIncrease;
    }
    
    getDescription(values) {
        const damageIncrease = values.damage || values[this.id] || values.common;
        return `Increases damage by ${damageIncrease}`;
    }
    
    getValues(rarity) {
        const baseValues = this.values;
        return {
            damage: baseValues[rarity] || baseValues.common
        };
    }
}