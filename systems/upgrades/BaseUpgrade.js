export class BaseUpgrade {
    constructor(config = {}) {
        this.id = config.id || this.generateId();
        this.name = config.name || 'Unknown Upgrade';
        this.description = config.description || 'No description available';
        this.rarity = config.rarity || 'common';
        this.maxLevel = config.maxLevel || 5;
        this.icon = config.icon || '⭐';
        this.tags = config.tags || [];
        this.synergies = config.synergies || [];
        this.incompatible = config.incompatible || [];
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    canBeOffered(playerState, existingUpgrades) {
        // Check level requirements
        if (this.minLevel && playerState.level < this.minLevel) return false;

        // Check for incompatible upgrades
        for (const incompatibleId of this.incompatible) {
            if (existingUpgrades.has(incompatibleId)) return false;
        }

        // Check for synergies (increase chance if synergies exist)
        let synergyBonus = 1;
        for (const synergyId of this.synergies) {
            if (existingUpgrades.has(synergyId)) {
                synergyBonus *= 1.5;
            }
        }

        // Apply rarity-based chance
        const baseChance = this.getRarityChance(this.rarity);
        const finalChance = baseChance * synergyBonus;

        return Math.random() < finalChance;
    }

    getRarityChance(rarity) {
        const chances = {
            common: 0.7,
            uncommon: 0.2,
            rare: 0.08,
            legendary: 0.02
        };
        return chances[rarity] || 0.5;
    }

    apply(player, values = {}) {
        throw new Error('apply() must be implemented by subclass');
    }

    getDisplayValues(values) {
        return values;
    }

    getLevel(existingUpgrades) {
        return existingUpgrades.get(this.id)?.count || 0;
    }

    isAtMaxLevel(existingUpgrades) {
        return this.getLevel(existingUpgrades) >= this.maxLevel;
    }
}