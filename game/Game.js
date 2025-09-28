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
import { GameLoopManager } from './GameLoopManager.js';
import { SidePanelManager } from './SidePanelManager.js';
import { LevelUpManager } from './LevelUpManager.js';

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
        
        this.sidePanelManager = new SidePanelManager(this.player, this.enemySpawner);
        this.levelUpManager = new LevelUpManager(this.gameState, this.uiManager, this.upgradeSystem, this.player, this.enemySpawner);
        this.gameLoopManager = new GameLoopManager(this);
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.uiManager.on('start', () => this.startGame());
        this.uiManager.on('restart', () => this.restartGame());
        this.uiManager.on('continue', () => this.levelUpManager.continueAfterLevelUp());
        this.uiManager.on('upgradeSelected', (index) => this.levelUpManager.handleUpgradeSelection(index));
        
        // Add dev panel events
        this.uiManager.on('devLevelUp', () => this.handleDevLevelUp());
        this.uiManager.on('devMaxHealth', () => this.handleDevMaxHealth());
        this.uiManager.on('devGodMode', () => this.handleDevGodMode());
        this.uiManager.on('devClearEnemies', () => this.handleDevClearEnemies());
        
        // Update side panels
        this.sidePanelManager.updateSidePanels();
    }

    // Dev panel handlers
    handleDevLevelUp() {
        // Force level up by setting XP to max
        this.gameState.xp = this.gameState.xpToNextLevel;
        this.levelUpManager.handleLevelUp();
    }

    handleDevMaxHealth() {
        // Set player health to max
        this.player.health = this.player.maxHealth || 100;
        this.gameState.health = this.player.health;
        this.uiManager.update();
    }

    handleDevGodMode() {
        // Toggle invulnerability
        this.player.invulnerable = !this.player.invulnerable;
        const btn = document.getElementById('dev-god-mode');
        if (btn) {
            btn.textContent = this.player.invulnerable ? 'Disable God Mode' : 'God Mode';
            btn.style.background = this.player.invulnerable 
                ? 'linear-gradient(135deg, #00ff00, #00aa00)' 
                : 'linear-gradient(135deg, #660000, #880000)';
        }
    }

    handleDevClearEnemies() {
        // Clear all enemies
        this.enemySpawner.enemies = [];
        if (this.particleSystem) {
            // Add some particle effects for visual feedback
            for (let i = 0; i < 50; i++) {
                this.particleSystem.createExplosion(
                    Math.random() * this.canvas.width,
                    Math.random() * this.canvas.height
                );
            }
        }
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
}