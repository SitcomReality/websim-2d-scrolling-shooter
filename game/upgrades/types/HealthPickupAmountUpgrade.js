import { BaseUpgrade } from '../BaseUpgrade.js';

export class HealthPickupAmountUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'healthPickupAmount',
            name: 'Health Pickup Value',
            description: 'Increases health restored by pickups',
            icon: '💝',
            maxLevel: 5,
            category: 'utility',
            rarity: 'uncommon',
            values: config.values || {
                common: 3,
                uncommon: 5,
                rare: 7,
                legendary: 10
            }
        });
    }
    
    apply(player, values) {
        const amountIncrease = values.amountIncrease || values[this.id] || values.common;
        player.healthPickupAmount = (player.healthPickupAmount || 5) + amountIncrease;
    }
    
    getDescription(values) {
        const amountIncrease = values.amountIncrease || values[this.id] || values.common;
        return `+${amountIncrease} health per pickup`;
    }
    
    getValues(rarity) {
        const baseValues = this.values;
        return {
            amountIncrease: baseValues[rarity] || baseValues.common
        };
    }
}