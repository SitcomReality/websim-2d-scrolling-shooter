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
        this.gameEngine = new GameEngine(this.canvas, this.ctx);
        
        this.gameState = new GameState();
        this.uiManager = new UIManager(this.gameState);
        
        this.initializeSystems();
        this.setupEventListeners();
    }
    
    initializeSystems() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        this.inputHandler = new InputHandler(this.canvas);
        this.enemySpawner = new EnemySpawner(this.canvas);
        this.collisionSystem = new CollisionSystem();
        this.particleSystem = new ParticleSystem();
        this.powerUpSystem = new PowerUpSystem();
        this.powerUpSystem.player = this.player;
        this.upgradeSystem = new UpgradeSystem();
        
        this.gameEngine.addEntity(this.player);
    }
    
    setupEventListeners() {
        this.uiManager.on('start', () => this.startGame());
        this.uiManager.on('restart', () => this.restartGame());
        this.uiManager.on('continue', () => this.continueAfterLevelUp());
        this.uiManager.on('upgradeSelected', (index) => this.selectUpgrade(index));
    }
    
    startGame() {
        this.gameState.reset();
        this.gameState.isRunning = true;
        this.gameLoop();
    }
    
    restartGame() {
        this.gameState.reset();
        this.enemySpawner.reset();
        this.player.reset();
        this.startGame();
    }
    
    gameLoop() {
        if (!this.gameState.isRunning) return;
        if (this.gameState.isPausedForLevelUp) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState.isPausedForLevelUp) {
            this.updatePauseAnimations();
            return;
        }
        
        const deltaTime = 16.67;
        
        if (this.gameState.isLevelUpPending) {
            this.updateLevelUpDelay(deltaTime);
            this.updatePauseAnimations();
            return;
        }
        
        this.updateGameLogic(deltaTime);
        this.checkGameOver();
    }
    
    updateGameLogic(deltaTime) {
        this.player.update(deltaTime, this.inputHandler.getInputState());
        this.enemySpawner.update(deltaTime);
        this.particleSystem.update(deltaTime);
        this.collisionSystem.getDamageTextSystem().update(deltaTime);
        this.powerUpSystem.update(deltaTime);
        
        const enemies = this.enemySpawner.getEnemies();
        const playerBullets = this.player.getBullets();
        
        this.collisionSystem.checkCollisions(
            this.player,
            enemies,
            playerBullets,
            this.particleSystem,
            this.powerUpSystem
        );
        
        this.gameState.score += this.collisionSystem.getScoreGained();
        this.gameState.health = Math.max(0, this.gameState.health - this.collisionSystem.getDamageTaken());
        this.gameState.xp += this.collisionSystem.getScoreGained();
        
        this.powerUpSystem.checkPlayerCollision(this.player);
        this.checkLevelUp();
        
        this.uiManager.update();
    }
    
    updateLevelUpDelay(deltaTime) {
        this.gameState.levelUpDelayTimer -= deltaTime;
        if (this.gameState.levelUpDelayTimer <= 0) {
            this.showUpgradeSelection();
            this.gameState.isLevelUpPending = false;
        }
    }
    
    updatePauseAnimations() {
        const deltaTime = 16.67;
        this.particleSystem.update(deltaTime);
        this.collisionSystem.getDamageTextSystem().update(deltaTime);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderStarfield();
        
        this.player.render(this.ctx);
        this.enemySpawner.render(this.ctx);
        this.particleSystem.render(this.ctx);
        this.upgradeSystem.render(this.ctx);
        this.collisionSystem.getDamageTextSystem().render(this.ctx);
    }
    
    renderStarfield() {
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 100; i++) {
            const seed = i * 73;
            const x = (seed * 997) % this.canvas.width;
            const y = (Date.now() * 0.05 + seed * 23) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    checkLevelUp() {
        if (this.gameState.xp >= this.gameState.xpToNextLevel && !this.gameState.isLevelUpPending) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.gameState.level++;
        this.gameState.xp = 0;
        this.gameState.xpToNextLevel = Math.floor(this.gameState.xpToNextLevel * 1.5);
        this.gameState.isLevelUpPending = true;
        this.gameState.levelUpDelayTimer = 500;
        this.player.invulnerable = true;
    }
    
    showUpgradeSelection() {
        this.player.invulnerable = false;
        this.gameState.isPausedForLevelUp = true;
        
        const upgradeChoices = this.upgradeSystem.generateUpgradeChoices(
            this.gameState.level,
            this.upgradeSystem.playerUpgrades
        );
        
        this.uiManager.showUpgradeSelection(upgradeChoices, this.upgradeSystem);
    }
    
    selectUpgrade(index) {
        const choice = this.uiManager.upgradeChoices[index];
        this.upgradeSystem.applyUpgrade(choice, this.player);
        this.continueAfterLevelUp();
    }
    
    continueAfterLevelUp() {
        this.gameState.isPausedForLevelUp = false;
        this.gameState.xp = 0;
        this.uiManager.update();
        
        if (this.gameState.isRunning) {
            this.gameLoop();
        }
    }
    
    checkGameOver() {
        if (this.gameState.health <= 0 && !this.gameState.isLevelUpPending) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameState.isRunning = false;
        this.uiManager.showGameOver();
    }
}