export class BaseUpgrade {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.icon = config.icon || '';
        this.maxLevel = config.maxLevel || 5;
        this.category = config.category || 'general';
        this.rarity = config.rarity || 'common';
        this.values = config.values || {};
    }
    
    canBeOffered(playerState, upgradeState) {
        const currentLevel = upgradeState.getUpgradeLevel(this.id);
        return currentLevel < this.maxLevel;
    }
    
    apply(player, values) {
        throw new Error('Apply method must be implemented by subclass');
    }
    
    getDescription(values) {
        return this.description;
    }
    
    getDisplayValues(values) {
        return values;
    }
    
    getValues(rarity) {
        // Default implementation - override in subclasses for custom logic
        if (this.values[rarity]) {
            return { [this.id]: this.values[rarity] };
        }
        return this.values;
    }
}