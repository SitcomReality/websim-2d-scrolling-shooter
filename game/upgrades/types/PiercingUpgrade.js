import { BaseUpgrade } from '../BaseUpgrade.js';

export class PiercingUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'piercing',
            name: 'Piercing',
            description: 'Bullets pierce through enemies',
            icon: '🔫',
            maxLevel: 5,
            category: 'offensive',
            rarity: 'rare',
            values: config.values || {
                common: 1,
                uncommon: 2,
                rare: 3,
                legendary: 5
            }
        });
    }

    apply(player, values) {
        const piercingCount = values.piercing || values[this.id] || values.common;
        if (player.weaponComponent) {
            player.weaponComponent.setPiercing(piercingCount);
        } else {
            player.piercing = piercingCount;
        }
    }

    getDescription(values) {
        const piercingCount = values.piercing || values[this.id] || values.common;
        return `Bullets pierce ${piercingCount} additional enemies`;
    }

    getValues(rarity) {
        const baseValues = this.values;
        return {
            piercing: baseValues[rarity] || baseValues.common
        };
    }
}