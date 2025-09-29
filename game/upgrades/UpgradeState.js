export class UpgradeState {
    constructor() {
        this.upgrades = new Map();
        this.upgradeLevels = new Map();
    }
    
    addUpgrade(upgradeId, level = 1) {
        this.upgrades.set(upgradeId, (this.upgrades.get(upgradeId) || 0) + 1);
        this.upgradeLevels.set(upgradeId, level);
    }
    
    getUpgradeLevel(upgradeId) {
        return this.upgrades.get(upgradeId) || 0;
    }
    
    getUpgradeData(upgradeId) {
        return {
            level: this.getUpgradeLevel(upgradeId),
            data: this.upgradeLevels.get(upgradeId) || {}
        };
    }
    
    hasUpgrade(upgradeId) {
        return this.upgrades.has(upgradeId);
    }
    
    clear() {
        this.upgrades.clear();
        this.upgradeLevels.clear();
    }
}

