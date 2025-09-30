export class LevelUpManager {
    constructor(gameState, uiManager, upgradeSystem, player, enemySpawner) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.upgradeSystem = upgradeSystem;
        this.player = player;
        this.enemySpawner = enemySpawner;
    }
    
    handleLevelUp() {
        this.gameState.level++;
        this.gameState.xp = 0;
        this.gameState.xpToNextLevel = Math.floor(this.gameState.xpToNextLevel * 1.5);

        // Go directly to upgrade selection
        const upgradeChoices = this.upgradeSystem.generateUpgradeChoices(
            this.gameState.level,
            this.upgradeSystem.playerUpgrades,
            this.player.luck || 1.0 // Pass luck stat
        );
        this.gameState.isPausedForLevelUp = true;
        this.uiManager.showUpgradeSelection(upgradeChoices, this.upgradeSystem);

        // Ensure enemy unlocks are applied for the new level immediately
        this.enemySpawner.unlockEnemyTypes(this.gameState.level);

        // After upgrade overlay is shown, listen for its close and then open shop
        // We'll open shop after a short delay to allow upgrade selection flow to occur.
        // Listen once for upgrade selection close via UIManager events.
        const openShopOnce = () => {
            // prepare shop offerings via ShopSystem if present, else no-op UI still shows
            if (window.gameInstance && window.gameInstance.shopSystem) {
                // deterministic seed from gameState (fallback to timestamp)
                const seed = window.gameInstance.gameState.shopSeed || Date.now();
                const offerings = window.gameInstance.shopSystem.generateOfferings(seed, window.gameInstance.shopSystem.getOwned(), { levelIndex: this.gameState.level });
                this.uiManager.showShop(offerings, window.gameInstance.shopSystem);
            } else {
                this.uiManager.showShop([], null);
            }
            // detach after one use
            this.uiManager.off('upgradeSelected', openShopOnce);
        };

        // attach event when player picks an upgrade or closes upgrade overlay, show shop afterwards
        this.uiManager.on('upgradeSelected', openShopOnce);
    }

    continueAfterLevelUp() {
        this.gameState.isPausedForLevelUp = false;
        this.gameState.levelUpDelayTimer = 0;
        this.uiManager.hideLevelUp();

        const upgradeChoices = this.upgradeSystem.generateUpgradeChoices(
            this.gameState.level,
            this.upgradeSystem.playerUpgrades
        );

        this.gameState.isPausedForLevelUp = true;
        this.uiManager.showUpgradeSelection(upgradeChoices, this.upgradeSystem);

        // Ensure enemy unlocks are applied for the new level before updating panels
        this.enemySpawner.unlockEnemyTypes(this.gameState.level);
    }

    handleUpgradeSelection(index) {
        const choices = this.uiManager.upgradeChoices;
        if (choices[index]) {
            this.upgradeSystem.applyUpgrade(choices[index], this.player);
            this.uiManager.hideUpgradeSelection();
            this.gameState.isPausedForLevelUp = false;
            // Refresh side panels so ship stats reflect the applied upgrade
            if (window.gameInstance && window.gameInstance.sidePanelManager) {
                window.gameInstance.sidePanelManager.updateSidePanels();
            }
        }
    }
}