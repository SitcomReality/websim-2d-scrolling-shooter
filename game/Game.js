import { GameEngine } from '../engine/GameEngine.js';
import { Player } from '../entities/Player.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { InputHandler } from '../systems/InputHandler.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { PowerUpSystem } from '../systems/PowerUpSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { UIManager } from './UIManager.js';
import { GameState } from './GameState.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = new GameState();
        this.uiManager = new UIManager(this.gameState);
        this.gameEngine = new GameEngine(this.canvas, this.ctx);
        
        this.player = new Player(400, 500);
        this.enemySpawner = new EnemySpawner(this.canvas);
        this.inputHandler = new InputHandler(this.canvas);
        this.collisionSystem = new CollisionSystem();
        this.particleSystem = new ParticleSystem();
        this.powerUpSystem = new PowerUpSystem();
        this.upgradeSystem = new UpgradeSystem();
        
        this.lastTime = 0;
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.uiManager.on('start', () => this.startGame());
        this.uiManager.on('restart', () => this.restartGame());
        this.uiManager.on('continue', () => this.continueAfterLevelUp());
        this.uiManager.on('upgradeSelected', (index) => this.handleUpgradeSelection(index));
    }
    
    startGame() {
        this.gameState.reset();
        this.gameState.isRunning = true;
        this.uiManager.hideStartButton();
        this.resetGame();
        this.gameLoop();
    }
    
    restartGame() {
        this.gameState.reset();
        this.gameState.isRunning = true;
        this.uiManager.hideRestartButton();
        this.resetGame();
        this.gameLoop();
    }
    
    resetGame() {
        this.player.reset();
        this.enemySpawner.reset();
        this.particleSystem.particles = [];
        this.powerUpSystem.powerUps = [];
    }
    
    continueAfterLevelUp() {
        this.gameState.isPausedForLevelUp = false;
        this.gameState.levelUpDelayTimer = 0;
        this.uiManager.hideLevelUp();
        
        const upgradeChoices = this.upgradeSystem.generateUpgradeChoices(
            this.gameState.level,
            this.upgradeSystem.playerUpgrades
        );
        
        this.uiManager.showUpgradeSelection(upgradeChoices, this.upgradeSystem);
    }
    
    handleUpgradeSelection(index) {
        const choices = this.uiManager.upgradeChoices;
        if (choices[index]) {
            this.upgradeSystem.applyUpgrade(choices[index], this.player);
            this.uiManager.hideUpgradeSelection();
            this.gameState.isPausedForLevelUp = false;
        }
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameState.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.gameState.isPausedForLevelUp) {
            this.update(deltaTime);
            this.render();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        const inputState = this.inputHandler.getInputState();
        this.player.update(deltaTime, inputState);
        
        // Pass player level to enemy spawner
        this.enemySpawner.update(deltaTime, this.gameState.level);
        this.particleSystem.update(deltaTime);
        this.powerUpSystem.update(deltaTime);
        
        // Update collision system
        this.collisionSystem.checkCollisions(
            this.player,
            this.enemySpawner.getEnemies(),
            this.player.getBullets(),
            this.particleSystem,
            this.powerUpSystem
        );
        
        // Update score and XP
        this.gameState.score += this.collisionSystem.getScoreGained();
        this.gameState.xp += this.collisionSystem.getScoreGained();
        
        // Check for level up
        if (this.gameState.xp >= this.gameState.xpToNextLevel) {
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
        }
        
        // Check for damage
        this.gameState.health -= this.collisionSystem.getDamageTaken();
        if (this.gameState.health <= 0) {
            this.gameState.isRunning = false;
            this.uiManager.showGameOver();
        }
        
        // Check power-up collisions
        this.powerUpSystem.checkPlayerCollision(this.player);
        
        // Update UI
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
}