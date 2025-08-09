import { GameEngine } from './engine/GameEngine.js';
import { Player } from './entities/Player.js';
import { EnemySpawner } from './systems/EnemySpawner.js';
import { InputHandler } from './systems/InputHandler.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { PowerUpSystem } from './systems/PowerUpSystem.js';
import { UpgradeSystem } from './systems/UpgradeSystem.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameEngine = new GameEngine(this.canvas, this.ctx);
        
        this.isRunning = false;
        this.score = 0;
        this.health = 100;
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
        this.isPausedForLevelUp = false;
        
        this.setupUI();
        this.initializeSystems();
    }
    
    setupUI() {
        this.scoreDisplay = document.getElementById('score-display');
        this.healthFill = document.getElementById('health-fill');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        
        this.xpFill = document.getElementById('xp-fill');
        this.levelDisplay = document.getElementById('level-display');
        this.levelUpOverlay = document.getElementById('level-up-overlay');
        this.continueBtn = document.getElementById('continue-btn');
        
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        this.continueBtn.addEventListener('click', () => this.continueAfterLevelUp());
    }
    
    initializeSystems() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        this.inputHandler = new InputHandler(this.canvas);
        this.enemySpawner = new EnemySpawner(this.canvas);
        this.collisionSystem = new CollisionSystem();
        this.particleSystem = new ParticleSystem();
        this.powerUpSystem = new PowerUpSystem();
        this.upgradeSystem = new UpgradeSystem();
        
        this.gameEngine.addEntity(this.player);
    }
    
    startGame() {
        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.score = 0;
        this.health = 100;
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
        this.isPausedForLevelUp = false;
        this.gameLoop();
    }
    
    restartGame() {
        this.restartBtn.style.display = 'none';
        this.enemySpawner.reset();
        this.player.reset();
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
        this.isPausedForLevelUp = false;
        this.startGame();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        if (this.isPausedForLevelUp) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.isPausedForLevelUp) return;
        
        const deltaTime = 16.67; // 60 FPS
        
        this.player.update(deltaTime, this.inputHandler.getInputState());
        this.enemySpawner.update(deltaTime);
        this.particleSystem.update(deltaTime);
        this.powerUpSystem.update(deltaTime);
        
        const enemies = this.enemySpawner.getEnemies();
        const playerBullets = this.player.getBullets();
        
        this.collisionSystem.checkCollisions(
            this.player,
            enemies,
            playerBullets,
            this.particleSystem
        );
        
        this.score += this.collisionSystem.getScoreGained();
        this.health = Math.max(0, this.health - this.collisionSystem.getDamageTaken());
        
        // XP gain from destroying enemies
        this.xp += this.collisionSystem.getScoreGained();
        this.checkLevelUp();
        
        this.updateUI();
        
        if (this.health <= 0) {
            this.gameOver();
        }
    }
    
    checkLevelUp() {
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.xp = 0;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        this.isPausedForLevelUp = true;
        
        // Generate upgrade choices
        this.upgradeChoices = this.upgradeSystem.generateUpgradeChoices(
            this.level,
            this.upgradeSystem.playerUpgrades
        );
        
        this.showUpgradeSelection();
    }

    showUpgradeSelection() {
        this.levelUpOverlay.style.display = 'none';
        
        const overlay = document.getElementById('upgrade-selection-overlay');
        const choicesContainer = document.getElementById('upgrade-choices');
        choicesContainer.innerHTML = '';
        
        this.upgradeChoices.forEach((choice, index) => {
            const card = this.createUpgradeCard(choice, index);
            choicesContainer.appendChild(card);
        });
        
        overlay.style.display = 'flex';
    }

    createUpgradeCard(choice, index) {
        const card = document.createElement('div');
        card.className = `upgrade-card ${choice.rarity}`;
        
        const upgrade = choice.upgrade;
        const values = choice.values;
        
        let description = '';
        let valueText = '';
        
        if (upgrade.name === 'Max Health') {
            description = 'Increases your maximum health';
            valueText = `+${values.health} HP`;
        } else if (upgrade.name === 'Damage Boost') {
            description = 'Increases your bullet damage';
            valueText = `+${values.damage} Damage`;
        } else if (upgrade.name === 'Movement Speed') {
            description = 'Increases your movement speed';
            valueText = `+${values.speed} Speed`;
        } else if (upgrade.name === 'Fire Rate') {
            description = 'Increases your firing speed';
            valueText = `${Math.round((1 - values.fireRateMultiplier) * 100)}% Faster`;
        }
        
        card.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-description">${description}</div>
            <div class="upgrade-value">${valueText}</div>
            <div class="upgrade-rarity">${choice.rarity}</div>
        `;
        
        card.addEventListener('click', () => this.selectUpgrade(index));
        
        return card;
    }

    selectUpgrade(index) {
        const choice = this.upgradeChoices[index];
        this.upgradeSystem.applyUpgrade(choice, this.player);
        
        const overlay = document.getElementById('upgrade-selection-overlay');
        overlay.style.display = 'none';
        
        this.continueAfterLevelUp();
    }
    
    continueAfterLevelUp() {
        this.levelUpOverlay.style.display = 'none';
        this.isPausedForLevelUp = false;
        
        // Reset XP for next level
        this.xp = 0;
        this.updateUI();
        
        // Resume game loop
        if (this.isRunning) {
            this.gameLoop();
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render starfield background
        this.renderStarfield();
        
        this.player.render(this.ctx);
        this.enemySpawner.render(this.ctx);
        this.particleSystem.render(this.ctx);
        this.powerUpSystem.render(this.ctx);
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
    
    updateUI() {
        this.scoreDisplay.textContent = `Score: ${this.score}`;
        this.healthFill.style.width = `${(this.player.health / (this.player.maxHealth || 100)) * 100}%`;
        
        const xpPercentage = (this.xp / this.xpToNextLevel) * 100;
        this.xpFill.style.width = `${xpPercentage}%`;
        this.levelDisplay.textContent = `Level ${this.level}`;
    }
    
    gameOver() {
        this.isRunning = false;
        this.restartBtn.style.display = 'block';
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});