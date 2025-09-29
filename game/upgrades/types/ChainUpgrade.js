import { BaseUpgrade } from '../BaseUpgrade.js';

export class ChainUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'chain',
            name: 'Chain Lightning',
            description: 'Bullets chain to nearby enemies',
            icon: '⚡',
            maxLevel: 5,
            category: 'offensive',
            rarity: 'legendary',
            values: config.values || {
                common: { chains: 1, range: 100, damageReduction: 0.7 },
                uncommon: { chains: 2, range: 120, damageReduction: 0.6 },
                rare: { chains: 3, range: 150, damageReduction: 0.5 },
                legendary: { chains: 4, range: 200, damageReduction: 0.4 }
            }
        });
    }

    apply(player, values) {
        const chainData = values.chain || values[this.id] || values.common;
        if (player.weaponComponent) {
            player.weaponComponent.setChain(
                chainData.chains,
                chainData.range,
                chainData.damageReduction
            );
        } else {
            player.chain = chainData.chains;
            player.chainRange = chainData.range;
            player.chainDamageReduction = chainData.damageReduction;
        }
    }

    getDescription(values) {
        const chainData = values.chain || values[this.id] || values.common;
        return `Chains ${chainData.chains} times to enemies within ${chainData.range}px`;
    }

    getValues(rarity) {
        const baseValues = this.values;
        return {
            chain: baseValues[rarity] || baseValues.common
        };
    }
}