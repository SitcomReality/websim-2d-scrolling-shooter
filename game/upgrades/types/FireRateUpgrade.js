import { BaseUpgrade } from '../BaseUpgrade.js';

export class FireRateUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'fireRate',
            name: 'Fire Rate',
            description: 'Increases your firing speed',
            icon: '🔥',
            maxLevel: 5,
            category: 'offensive',
            rarity: 'uncommon',
            values: config.values || {
                common: 0.9,
                uncommon: 0.85,
                rare: 0.8,
                legendary: 0.7
            }
        });
    }
    
    apply(player, values) {
        const multiplier = values.fireRateMultiplier || values.common;
        player.fireRate = (player.fireRate || 150) * multiplier;
    }
    
    getDescription(values) {
        const multiplier = values.fireRateMultiplier || values.common;
        const percent = Math.round((1 - multiplier) * 100);
        return `Increases fire rate by ${percent}%`;
    }
}

