import { BaseUpgrade } from '../BaseUpgrade.js';

export class RicochetUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'ricochet',
            name: 'Ricochet',
            description: 'Bullets bounce off walls',
            icon: '🏀',
            maxLevel: 5,
            category: 'offensive',
            rarity: 'uncommon',
            values: config.values || {
                common: 1,
                uncommon: 2,
                rare: 3,
                legendary: 5
            }
        });
    }

    apply(player, values) {
        const ricochetCount = values.ricochet || values[this.id] || values.common;
        if (player.weaponComponent) {
            player.weaponComponent.setRicochet(ricochetCount);
        } else {
            player.ricochet = ricochetCount;
        }
    }

    getDescription(values) {
        const ricochetCount = values.ricochet || values[this.id] || values.common;
        return `Bullets ricochet ${ricochetCount} times off walls`;
    }

    getValues(rarity) {
        const baseValues = this.values;
        return {
            ricochet: baseValues[rarity] || baseValues.common
        };
    }
}

