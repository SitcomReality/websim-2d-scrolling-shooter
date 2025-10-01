export function bindGameEvents(game) {
    // UI manager events
    game.uiManager.on('start', () => game.startGame && game.startGame());
    game.uiManager.on('restart', () => game.restartGame && game.restartGame());
    game.uiManager.on('continue', () => game.levelUpManager && game.levelUpManager.continueAfterLevelUp());
    game.uiManager.on('upgradeSelected', (index) => game.levelUpManager && game.levelUpManager.handleUpgradeSelection(index));
    game.uiManager.on('rerollUpgrades', () => game.handleReroll && game.handleReroll());
    game.uiManager.on('openStatShop', () => { if (game.statShopManager) game.statShopManager.show(); });

    // Dev panel events
    game.uiManager.on('devLevelUp', () => game.handleDevLevelUp && game.handleDevLevelUp());
    game.uiManager.on('devHeal', () => game.handleDevHeal && game.handleDevHeal());
    game.uiManager.on('devMaxXP', () => game.handleDevMaxXP && game.handleDevMaxXP());
    game.uiManager.on('devKillAll', () => game.handleDevKillAll && game.handleDevKillAll());

    // Toggle XP gain on/off
    game.uiManager.on('devToggleXP', () => {
        if (!game.gameState) return;
        game.gameState.disableXPGain = !game.gameState.disableXPGain;
        // update button text for clarity
        const btn = document.getElementById('disable-xp-btn');
        if (btn) {
            btn.textContent = game.gameState.disableXPGain ? 'Enable XP Gain' : 'Disable XP Gain';
            btn.style.background = game.gameState.disableXPGain ? '#444' : 'linear-gradient(135deg, #ff0066, #cc0052)';
        }
    });

    // Shop interactions
    game.uiManager.on('shopPurchaseRequested', (itemId) => {
        if (game.shopSystem) {
            const result = game.shopSystem.purchaseItem(itemId, game.player);
            if (result && result.success) {
                game.uiManager.update();
                const info = document.getElementById('shop-info');
                if (info) info.innerHTML = `<div style="color:#ffff00;font-weight:bold;">${itemId} acquired!</div>`;
                const offerings = game.shopSystem.getOfferings();
                game.uiManager.showShop(offerings, game.shopSystem);
            } else {
                const info = document.getElementById('shop-info');
                if (info) info.textContent = `Purchase failed: ${result ? result.reason : 'unknown'}`;
            }
        }
    });

    game.uiManager.on('shopRerollRequested', () => {
        if (!game.shopSystem) return;
        const seed = game.gameState.shopSeed || Date.now();
        const res = game.shopSystem.rerollOfferings(seed, game.shopSystem.getOwned(), { levelIndex: game.gameState.level });
        if (res && res.success) {
            game.uiManager.showShop(res.offerings || game.shopSystem.getOfferings(), game.shopSystem);
            game.uiManager.update();
        } else {
            const info = document.getElementById('shop-info');
            if (info) info.textContent = `Reroll failed: ${res ? res.reason : 'insufficient funds'}`;
        }
    });

    // Dev: give currency
    game.uiManager.on('devGiveCurrency', () => {
        if (game.gameState) {
            game.gameState.currency = (game.gameState.currency || 0) + 1000;
            if (game.uiManager) game.uiManager.update();
        }
    });
}