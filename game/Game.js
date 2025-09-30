import { setupGameInstance } from './bootstrap/GameSetup.js';
import { bindGameEvents } from './managers/GameBindings.js';

export class Game {
    constructor() {
        // Delegate heavy setup to bootstrap module and bind events separately
        setupGameInstance(this).then((g) => {
            try { bindGameEvents(g); } catch (e) { console.warn('Binding failed', e); }
        }).catch(e => console.error('Game setup failed', e));
    }
    
    bindEvents() {
        // kept for backward compatibility if someone calls it directly; primary binding happens in GameBindings
        console.warn('Game.bindEvents() is deprecated; bindings are performed by GameBindings.bindGameEvents');
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
        // Use RunManager to start a fresh run (ensures full reset & no stat bleed)
        if (this.runManager) {
            this.runManager.startNewRun();
            return;
        }

        // fallback behavior (existing)
        this.gameState.reset();
        this.gameState.isRunning = true;
        // legacy start button removed - UI entry handled by RunManager
        this.resetGame();
        this.sidePanelManager.updateSidePanels();
        this.gameLoopManager.start();
    }
    
    restartGame() {
        // When restarting mid-session, treat as new run (clear saved run)
        if (this.runManager) {
            this.runManager.startNewRun();
            return;
        }

        // fallback
        this.gameState.reset();
        this.gameState.isRunning = true;
        // legacy restart button removed - no-op
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

            // Stop loop and show run menu marking saved run ended
            try {
                if (this.runManager) {
                    this.runManager.showAfterGameOver();
                } else {
                    // fallback: stop loop
                    this.gameLoopManager.stop();
                    this.runManager && this.runManager.show();
                }
            } catch (e) {
                console.warn('Error handling game over run flow', e);
            }
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