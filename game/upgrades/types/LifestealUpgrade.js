export class LifestealUpgrade {
    constructor(config = {}) {
        this.id = 'lifesteal';
        this.name = 'Lifesteal';
        this.description = 'Heals a portion of damage dealt as health';
        this.icon = '💉';
        this.maxLevel = 5;
        this.category = 'defensive';
        this.rarity = config.rarity || 'rare';
        this.values = config.values || {
            common: 0.02,
            uncommon: 0.03,
            rare: 0.05,
            legendary: 0.08
        };
    }

    apply(player, values) {
        const amount = values.lifesteal || values[this.id] || values.common || 0;
        player.lifesteal = (player.lifesteal || 0) + amount;
    }

    getDescription(values) {
        const amount = values.lifesteal || values[this.id] || values.common || 0;
        return `Heals ${Math.round(amount * 100)}% of damage dealt`;
    }

    getValues(rarity) {
        const base = this.values;
        return { lifesteal: base[rarity] || base.common };
    }

    canBeOffered(playerState, upgradeState) {
        // Default: always offerable until max level reached if tracking via UpgradeState is used
        if (upgradeState && typeof upgradeState.getUpgradeLevel === 'function') {
            return upgradeState.getUpgradeLevel(this.id) < this.maxLevel;
        }
        return true;
    }
}

export default LifestealUpgrade;