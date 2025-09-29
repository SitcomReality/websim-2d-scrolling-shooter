import { BaseUpgrade } from '../BaseUpgrade.js';

export class HealthPickupChanceUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'healthPickupChance',
            name: 'Health Pickup Chance',
            description: 'Increases chance of health pickups from enemies',
            icon: '💚',
            maxLevel: 5,
            category: 'utility',
            rarity: 'rare',
            values: config.values || {
                common: 0.02,
                uncommon: 0.03,
                rare: 0.05,
                legendary: 0.08
            }
        });
    }
    
    apply(player, values) {
        const chanceIncrease = values.chanceIncrease || values.common;
        player.healthPickupChance = (player.healthPickupChance || 0.02) + chanceIncrease;
    }
    
    getDescription(values) {
        const chanceIncrease = values.chanceIncrease || values.common;
        const percent = Math.round(chanceIncrease * 100);
        return `+${percent}% health pickup chance`;
    }
}

