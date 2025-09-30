import { GameEngine } from './GameEngine.js';
import { Player } from './entities/Player.js';
import { EnemySpawner } from './systems/EnemySpawner.js';
import { InputHandler } from './systems/InputHandler.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { PowerUpSystem } from './systems/PowerUpSystem.js';
import { UpgradeSystem } from './upgrades/UpgradeSystem.js';
import { UIManager } from './managers/UIManager.js';
import { GameState } from './GameState.js';
import { GameLoopManager } from './managers/GameLoopManager.js';
import { SidePanelManager } from './managers/SidePanelManager.js';
import { LevelUpManager } from './managers/LevelUpManager.js';
import { StatShopManager } from './managers/StatShopManager.js';
import { WeaponFactory } from './weapons/WeaponFactory.js';
import { WeaponUnlockUpgrade } from './upgrades/types/WeaponUnlockUpgrade.js';
import { MovementSystem } from './systems/MovementSystem.js';
import { UtilitySystem } from './systems/UtilitySystem.js';
import { MovementUpgrade } from './upgrades/types/MovementUpgrade.js';
import { UtilityUpgrade } from './upgrades/types/UtilityUpgrade.js';
import { LuckUpgrade } from './upgrades/types/LuckUpgrade.js';
import { SynergySystem } from './systems/SynergySystem.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = new GameState();
        this.uiManager = new UIManager(this.gameState);
        this.gameEngine = new GameEngine(this.canvas, this.ctx);
        
        this.player = new Player(400, 500, new WeaponFactory());
        this.enemySpawner = new EnemySpawner(this.canvas);
        this.inputHandler = new InputHandler(this.canvas);
        this.collisionSystem = new CollisionSystem();
        this.particleSystem = new ParticleSystem();
        this.powerUpSystem = new PowerUpSystem();
        this.weaponFactory = new WeaponFactory();
        this.upgradeSystem = new UpgradeSystem(this.weaponFactory);
        this.synergySystem = new SynergySystem();
        
        this.movementSystem = new MovementSystem();
        this.utilitySystem = new UtilitySystem();
        
        // Register player movement with MovementSystem so position updates correctly
        // (will be updated once player is created below)
        
        // Update upgrade system to include new upgrades
        this.upgradeSystem.availableUpgrades.push(new MovementUpgrade());
        this.upgradeSystem.availableUpgrades.push(new UtilityUpgrade());
        this.upgradeSystem.availableUpgrades.push(new LuckUpgrade());
        
        this.sidePanelManager = new SidePanelManager(this.player, this.enemySpawner);
        this.levelUpManager = new LevelUpManager(this.gameState, this.uiManager, this.upgradeSystem, this.player, this.enemySpawner);
        this.statShopManager = new StatShopManager(this.gameState, this.player);
        
        // dynamic import to avoid load-order issues — initialize asynchronously
        import('./shop/ShopSystem.js').then(mod => {
            try {
                this.shopSystem = new (mod.default)(this.gameState);
                // load persisted owned items into shop (best-effort)
                if (this.shopSystem && typeof this.shopSystem.loadPersistedOwned === 'function') {
                    const owned = this.shopSystem.loadPersistedOwned();
                    if (owned && owned.length) this.shopSystem.loadOwnedItems(owned, this.player);
                }
            } catch (e) {
                console.warn('Failed to initialize ShopSystem', e);
            }
        }).catch(err => console.warn('Failed to import ShopSystem', err));
        
        this.gameLoopManager = new GameLoopManager(this);
        
        // Ensure MovementSystem knows about the player's movement component and bounds
        this.movementSystem.registerEntity('player', this.player.movementComponent);
        this.movementSystem.setBounds('player', 0, this.canvas.width, 0, this.canvas.height);
        
        // Make game instance globally available for weapon systems
        window.gameInstance = this;
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.uiManager.on('start', () => this.startGame());
        this.uiManager.on('restart', () => this.restartGame());
        this.uiManager.on('continue', () => this.levelUpManager.continueAfterLevelUp());
        this.uiManager.on('upgradeSelected', (index) => this.levelUpManager.handleUpgradeSelection(index));
        this.uiManager.on('rerollUpgrades', () => this.handleReroll());
        this.uiManager.on('openStatShop', () => {
            if (this.statShopManager) this.statShopManager.show();
        });
        
        // Dev panel events
        this.uiManager.on('devLevelUp', () => this.handleDevLevelUp());
        this.uiManager.on('devHeal', () => this.handleDevHeal());
        this.uiManager.on('devMaxXP', () => this.handleDevMaxXP());
        this.uiManager.on('devKillAll', () => this.handleDevKillAll());
        
        // Update side panels
        this.sidePanelManager.updateSidePanels();
        
        this.uiManager.on('shopPurchaseRequested', (itemId) => {
            // Attempt purchase via ShopSystem then notify UI
            if (this.shopSystem) {
                const result = this.shopSystem.purchaseItem(itemId, this.player);
                if (result && result.success) {
                    // update UI and show confirmation briefly
                    this.uiManager.update();
                    const overlay = document.getElementById('shop-overlay');
                    const info = document.getElementById('shop-info');
                    if (info) info.innerHTML = `<div style="color:#ffff00;font-weight:bold;">${itemId} acquired!</div>`;
                    // refresh offerings in UI
                    const offerings = this.shopSystem.getOfferings();
                    this.uiManager.showShop(offerings, this.shopSystem);
                } else {
                    // show reason in info
                    const info = document.getElementById('shop-info');
                    if (info) info.textContent = `Purchase failed: ${result.reason || 'unknown'}`;
                }
            }
        });

        this.uiManager.on('shopRerollRequested', () => {
            if (!this.shopSystem) return;
            const seed = this.gameState.shopSeed || Date.now();
            const res = this.shopSystem.rerollOfferings(seed, this.shopSystem.getOwned(), { levelIndex: this.gameState.level });
            if (res && res.success) {
                // update UI with new offerings and update currency display
                this.uiManager.showShop(res.offerings || this.shopSystem.getOfferings(), this.shopSystem);
                this.uiManager.update();
            } else {
                const info = document.getElementById('shop-info');
                if (info) info.textContent = `Reroll failed: ${res.reason || 'insufficient funds'}`;
            }
        });
    }
    
    handleReroll() {
        const playerLuck = this.player.luck || 1.0;
        const rerollResult = this.upgradeSystem.performReroll(this.gameState.xp, playerLuck);
        
        if (rerollResult && rerollResult.success) {
            // Deduct XP cost
            this.gameState.xp -= rerollResult.cost;
            
            // Generate new upgrade choices
            const newChoices = this.upgradeSystem.generateUpgradeChoices(
                this.gameState.level,
                this.upgradeSystem.playerUpgrades,
                playerLuck
            );
            
            // Show new choices
            this.uiManager.showUpgradeSelection(newChoices, this.upgradeSystem);
            
            // Update UI to reflect XP change
            this.uiManager.update();
        }
    }
    
    handleDevLevelUp() {
        // Force instant level up
        this.gameState.xp = this.gameState.xpToNextLevel;
        this.levelUpManager.handleLevelUp();
    }
    
    handleDevHeal() {
        // Full heal
        this.gameState.health = this.gameState.maxHealth || 100;
        this.player.health = this.gameState.health;
        this.uiManager.update();
    }
    
    handleDevMaxXP() {
        // Set XP to max for current level
        this.gameState.xp = this.gameState.xpToNextLevel - 1;
        this.uiManager.update();
    }
    
    handleDevKillAll() {
        // Kill all enemies on screen
        const enemies = this.enemySpawner.getEnemies();
        enemies.forEach(enemy => {
            enemy.alive = false;
            this.gameState.score += enemy.points;
            this.gameState.xp += enemy.points;
            this.particleSystem.createExplosion(enemy.x, enemy.y);
        });
        this.uiManager.update();
    }
    
    startGame() {
        this.gameState.reset();
        this.gameState.isRunning = true;
        this.uiManager.hideStartButton();
        this.resetGame();
        this.sidePanelManager.updateSidePanels();
        this.gameLoopManager.start();
    }
    
    restartGame() {
        this.gameState.reset();
        this.gameState.isRunning = true;
        this.uiManager.hideRestartButton();
        this.resetGame();
        this.sidePanelManager.updateSidePanels();
        this.gameLoopManager.start();
    }
    
    resetGame() {
        this.player.reset();
        this.enemySpawner.reset();
        this.particleSystem.particles = [];
        this.powerUpSystem.powerUps = [];
        this.upgradeSystem.playerUpgrades.clear();
        this.synergySystem.reset();
        this.movementSystem.reset();
        this.utilitySystem.reset();
    }
    
    update(deltaTime) {
        const inputState = this.inputHandler.getInputState();
        
        // Update movement system
        this.movementSystem.update(deltaTime, inputState);
        
        // Update utility system
        this.utilitySystem.update(deltaTime);
        
        this.player.update(deltaTime, inputState);
        
        // Pass player level to enemy spawner
        this.enemySpawner.update(deltaTime, this.gameState.level);
        this.particleSystem.update(deltaTime);
        this.powerUpSystem.update(deltaTime);
        
        // Update collision system
        this.collisionSystem.gameState = this.gameState;
        this.collisionSystem.checkCollisions(
            this.player,
            this.enemySpawner.getEnemies(),
            this.player.getBullets(),
            this.particleSystem,
            this.powerUpSystem
        );
        
        const previousHealth = this.gameState.health;
        const previousXP = this.gameState.xp;
        
        // Update score and XP
        this.gameState.score += this.collisionSystem.getScoreGained();
        this.gameState.xp += this.collisionSystem.getScoreGained();
        
        // Update player health from game state
        this.player.health = this.gameState.health;
        
        // Check for damage
        const damageTaken = this.collisionSystem.getDamageTaken();
        if (damageTaken > 0) {
            this.gameState.health = Math.max(0, this.gameState.health - damageTaken);
            this.player.health = this.gameState.health;
        }
        
        // Check for level up
        if (this.gameState.xp >= this.gameState.xpToNextLevel) {
            this.levelUpManager.handleLevelUp();
        }
        
        // Check for damage
        this.gameState.health -= this.collisionSystem.getDamageTaken();
        
        // Update player health from game state
        this.player.health = this.gameState.health;
        this.player.maxHealth = this.gameState.maxHealth || 100;
        
        // Trigger animations for changes
        if (this.gameState.health !== previousHealth) {
            this.uiManager.animateHealthBar();
        }
        
        if (this.gameState.xp !== previousXP) {
            this.uiManager.animateXPBar();
        }
        
        if (this.gameState.health <= 0) {
            this.gameState.isRunning = false;
            this.uiManager.showGameOver();
        }
        
        // Check power-up collisions
        this.powerUpSystem.checkPlayerCollision(this.player);
        
        // Check for synergies
        this.synergySystem.checkSynergies(this.upgradeSystem.playerUpgrades, this.player);
        
        // Update UI with current health values
        this.gameState.health = this.player.health;
        this.gameState.maxHealth = this.player.maxHealth || 100;
        this.uiManager.update();
        
        // Update damage text system
        this.collisionSystem.getDamageTextSystem().update(deltaTime);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render game objects
        this.enemySpawner.render(this.ctx);
        this.player.render(this.ctx);
        this.particleSystem.render(this.ctx);
        this.powerUpSystem.render(this.ctx);
        
        // Render damage text
        this.collisionSystem.getDamageTextSystem().render(this.ctx);
    }
    
    switchPlayerWeapon(weaponType) {
        if (this.player && this.player.weaponComponent) {
            this.player.weaponComponent.switchWeapon(weaponType);
        }
    }
}