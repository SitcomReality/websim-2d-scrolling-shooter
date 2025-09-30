import { GameEngine } from '../GameEngine.js';
import { Player } from '../entities/Player.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { InputHandler } from '../systems/InputHandler.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { PowerUpSystem } from '../systems/PowerUpSystem.js';
import { UpgradeSystem } from '../upgrades/UpgradeSystem.js';
import { UIManager } from '../managers/UIManager.js';
import { GameState } from '../GameState.js';
import { GameLoopManager } from '../managers/GameLoopManager.js';
import { SidePanelManager } from '../managers/SidePanelManager.js';
import { LevelUpManager } from '../managers/LevelUpManager.js';
import { StatShopManager } from '../managers/StatShopManager.js';
import { SaveLoadManager } from '../managers/SaveLoadManager.js';
import { WeaponFactory } from '../weapons/WeaponFactory.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { UtilitySystem } from '../systems/UtilitySystem.js';
import { MovementUpgrade } from '../upgrades/types/MovementUpgrade.js';
import { UtilityUpgrade } from '../upgrades/types/UtilityUpgrade.js';
import { LuckUpgrade } from '../upgrades/types/LuckUpgrade.js';
import { SynergySystem } from '../systems/SynergySystem.js';
import { RunManager } from '../managers/RunManager.js';

export async function setupGameInstance(game) {
    // Core canvas/context and state
    game.canvas = document.getElementById('game-canvas');
    game.ctx = game.canvas.getContext('2d');
    game.gameState = new GameState();
    game.uiManager = new UIManager(game.gameState);
    game.gameEngine = new GameEngine(game.canvas, game.ctx);

    // Core systems and factories
    game.weaponFactory = new WeaponFactory();
    game.player = new Player(400, 500, game.weaponFactory);
    game.enemySpawner = new EnemySpawner(game.canvas);
    game.inputHandler = new InputHandler(game.canvas);
    game.collisionSystem = new CollisionSystem();
    game.particleSystem = new ParticleSystem();
    game.powerUpSystem = new PowerUpSystem();
    game.upgradeSystem = new UpgradeSystem(game.weaponFactory);
    game.synergySystem = new SynergySystem();

    game.movementSystem = new MovementSystem();
    game.utilitySystem = new UtilitySystem();

    // Add extra upgrades (legacy/extensions)
    game.upgradeSystem.availableUpgrades.push(new MovementUpgrade());
    game.upgradeSystem.availableUpgrades.push(new UtilityUpgrade());
    game.upgradeSystem.availableUpgrades.push(new LuckUpgrade());

    game.sidePanelManager = new SidePanelManager(game.player, game.enemySpawner);
    game.levelUpManager = new LevelUpManager(game.gameState, game.uiManager, game.upgradeSystem, game.player, game.enemySpawner);
    game.statShopManager = new StatShopManager(game.gameState, game.player);

    // RunManager and ShopSystem (dynamic)
    game.runManager = new RunManager(game);

    try {
        const mod = await import('../shop/ShopSystem.js');
        game.shopSystem = new (mod.default)(game.gameState);
        if (game.shopSystem && typeof game.shopSystem.loadPersistedOwned === 'function') {
            const owned = game.shopSystem.loadPersistedOwned();
            if (owned && owned.length) game.shopSystem.loadOwnedItems(owned, game.player);
        }
    } catch (e) {
        console.warn('Failed to initialize ShopSystem', e);
        game.shopSystem = null;
    }

    // Save/load manager
    game.saveLoadManager = new SaveLoadManager(game.gameState, game.player, game.shopSystem || null, game.player ? game.player.statSystem : null);

    // Expose globally (some modules expect window.gameInstance)
    window.gameInstance = game;
    window.gameInstance.saveLoadManager = game.saveLoadManager;

    // If shop loaded later, attach to save manager
    (async () => {
        try {
            const mod = await import('../shop/ShopSystem.js');
            if (mod && mod.default && game.shopSystem) {
                game.saveLoadManager.shopSystem = game.shopSystem;
            }
        } catch (e) { /* ignore */ }
    })();

    // Attempt to auto-load saved run
    try {
        game.saveLoadManager.statSystem = game.player ? game.player.statSystem : null;
        const loaded = game.saveLoadManager.load();
        if (loaded && game.uiManager) game.uiManager.update();
    } catch (e) {
        console.warn('Auto-load failed', e);
    }

    game.gameLoopManager = new GameLoopManager(game);

    // Movement registration & bounds
    try {
        game.movementSystem.registerEntity('player', game.player.movementComponent);
        game.movementSystem.setBounds('player', 0, game.canvas.width, 0, game.canvas.height);
    } catch (e) { /* ignore */ }

    // Initial UI and panels
    try { game.sidePanelManager.updateSidePanels(); } catch(e){}

    // Show RunManager overlay at startup
    try { game.runManager.show(); } catch(e){ console.warn('Failed to show RunManager', e); }

    return game;
}