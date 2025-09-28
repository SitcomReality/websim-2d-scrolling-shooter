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

        // Generate upgrade choices using the new upgrade system
        const upgradeChoices = this.upgradeSystem.generateUpgradeChoices(
            {
                level: this.gameState.level,
                score: this.gameState.score,
                health: this.gameState.health,
                maxHealth: this.gameState.maxHealth
            },
            this.upgradeSystem.playerUpgrades,
            4 // Request 4 choices
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

        // Generate upgrade choices
        const upgradeChoices = this.upgradeSystem.generateUpgradeChoices(
            {
                level: this.gameState.level,
                score: this.gameState.score,
                health: this.gameState.health,
                maxHealth: this.gameState.maxHealth
            },
            this.upgradeSystem.playerUpgrades,
            4
        );

        this.gameState.isPausedForLevelUp = true;
        this.uiManager.showUpgradeSelection(upgradeChoices, this.upgradeSystem);

        // Ensure enemy unlocks are applied for the new level before updating panels
        this.enemySpawner.unlockEnemyTypes(this.gameState.level);
    }

    handleUpgradeSelection(index) {
        const choices = this.uiManager.upgradeChoices;
        if (choices[index]) {
            // Ensure we're passing the upgrade object correctly
            const upgradeChoice = choices[index];
            if (upgradeChoice && upgradeChoice.upgrade) {
                this.upgradeSystem.applyUpgrade(upgradeChoice, this.player);
                this.uiManager.hideUpgradeSelection();
                this.gameState.isPausedForLevelUp = false;
            } else {
                console.error('Invalid upgrade choice:', upgradeChoice);
            }
        }
    }
}