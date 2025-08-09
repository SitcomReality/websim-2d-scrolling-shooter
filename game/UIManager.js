    showLevelUp(level) {
        // Skip the level up overlay entirely
        const upgradeChoices = this.upgradeSystem.generateUpgradeChoices(
            level,
            this.upgradeSystem.playerUpgrades
        );
        this.showUpgradeSelection(upgradeChoices, this.upgradeSystem);
    }

