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
    }

