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
                    // currentBase is shots-per-second now; to make "multiplier < 1 => faster" invert multiplier when applying
                    const currentBase = def.baseValue || statSystem.getStatValue('fireRate') || 20;
                    // e.g. multiplier 0.9 (intend 10% faster) => newBase = currentBase / 0.9
                    statSystem.setBaseValue('fireRate', currentBase / multiplier);
                } else {
                    // Register stat if somehow missing, then apply multiplier (assume default 20 sps)
                    statSystem.registerStat({
                        id: 'fireRate',
                        name: 'Fire Rate',
                        baseValue: 20,
                        description: 'Shots per second',
                        category: 'offensive',
                        upgradeWeight: 0.6
                    });
                    statSystem.setBaseValue('fireRate', (statSystem.getStatValue('fireRate') || 20) / multiplier);
                }
                return;
            }
        } catch (e) {
            // fall through to legacy fallback if statSystem operations fail
            console.warn('FireRateUpgrade: statSystem apply failed, falling back', e);
        }

        // Legacy fallback for systems still reading player.fireRate directly
        // convert existing ms-based value to shots/sec, apply inverse multiplier, then convert back to ms
        const currentMs = player.fireRate || 150;
        const currentSps = 1000 / currentMs;
        const newSps = currentSps / multiplier;
        player.fireRate = 1000 / newSps;
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