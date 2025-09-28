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
            this.upgradeSystem.playerUpgrades
        );
        this.gameState.isPausedForLevelUp = true;
        this.uiManager.showUpgradeSelection(upgradeChoices, this.upgradeSystem);

        // Ensure enemy unlocks are applied for the new level immediately
        this.enemySpawner.unlockEnemyTypes(this.gameState.level);
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
        }
    }
}