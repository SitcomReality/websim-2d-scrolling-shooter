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
        const multiplier = values.fireRateMultiplier || values.fireRate || values[this.id] || values.common;

        // Prefer central StatSystem as single source of truth
        try {
            const statSystem = player && player.statSystem ? player.statSystem : null;
            if (statSystem && typeof statSystem.getDefinition === 'function') {
                const def = statSystem.getDefinition('fireRate');
                if (def) {
                    // Adjust the registered base value by multiplier
                    const currentBase = def.baseValue || statSystem.getStatValue('fireRate') || 150;
                    statSystem.setBaseValue('fireRate', currentBase * multiplier);
                } else {
                    // Register stat if somehow missing, then apply multiplier
                    statSystem.registerStat({
                        id: 'fireRate',
                        name: 'Fire Rate',
                        baseValue: 150,
                        description: 'Milliseconds between shots',
                        category: 'offensive',
                        upgradeWeight: 0.6
                    });
                    statSystem.setBaseValue('fireRate', (statSystem.getStatValue('fireRate') || 150) * multiplier);
                }
                return;
            }
        } catch (e) {
            // fall through to legacy fallback if statSystem operations fail
            console.warn('FireRateUpgrade: statSystem apply failed, falling back', e);
        }

        // Legacy fallback for systems still reading player.fireRate directly
        player.fireRate = (player.fireRate || 150) * multiplier;
    }
    
    getDescription(values) {
        const multiplier = values.fireRateMultiplier || values.fireRate || values[this.id] || values.common;
        const percent = Math.round((1 - multiplier) * 100);
        return `Increases fire rate by ${percent}%`;
    }
    
    getValues(rarity) {
        const baseValues = this.values;
        return {
            fireRateMultiplier: baseValues[rarity] || baseValues.common
        };
    }
}