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
                    // currentBase is shots-per-second now; invert multiplier because legacy values were lower-than-1 to speed up
                    const currentBase = def.baseValue || statSystem.getStatValue('fireRate') || 6;
                    // To keep existing upgrade value semantics (e.g. 0.9 meaning "10% faster"), divide by multiplier
                    const newBase = currentBase / multiplier;
                    statSystem.setBaseValue('fireRate', newBase);
                } else {
                    // Register stat if missing, then apply (use sensible default shots/sec)
                    statSystem.registerStat({
                        id: 'fireRate',
                        name: 'Fire Rate',
                        baseValue: 6,
                        description: 'Shots per second',
                        category: 'offensive',
                        upgradeWeight: 0.6
                    });
                    statSystem.setBaseValue('fireRate', (statSystem.getStatValue('fireRate') || 6) / multiplier);
                }
                return;
            }
        } catch (e) {
            console.warn('FireRateUpgrade: statSystem apply failed, falling back', e);
        }

        // Legacy fallback: player.fireRate used to be ms-between-shots; convert by inverting multiplier
        const currentMs = player.fireRate || 150;
        const currentSps = 1000 / currentMs;
        const newSps = currentSps / multiplier;
        player.fireRate = 1000 / newSps; // keep legacy field as ms if used elsewhere
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