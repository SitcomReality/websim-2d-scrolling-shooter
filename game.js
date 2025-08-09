import { GameEngine } from './engine/GameEngine.js';
import { Player } from './entities/Player.js';
import { EnemySpawner } from './systems/EnemySpawner.js';
import { InputHandler } from './systems/InputHandler.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { PowerUpSystem } from './systems/PowerUpSystem.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameEngine = new GameEngine(this.canvas, this.ctx);
        
        this.isRunning = false;
        this.score = 0;
        this.health = 100;
        
        this.setupUI();
        this.initializeSystems();
    }
    
    setupUI() {
        this.scoreDisplay = document.getElementById('score-display');
        this.healthFill = document.getElementById('health-fill');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    initializeSystems() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        this.inputHandler = new InputHandler(this.canvas);
        this.enemySpawner = new EnemySpawner(this.canvas);
        this.collisionSystem = new CollisionSystem();
        this.particleSystem = new ParticleSystem();
        this.powerUpSystem = new PowerUpSystem();
        
        this.gameEngine.addEntity(this.player);
    }
    
    startGame() {
        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.score = 0;
        this.health = 100;
        this.gameLoop();
    }
    
    restartGame() {
        this.restartBtn.style.display = 'none';
        this.enemySpawner.reset();
        this.player.reset();
        this.startGame();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
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
        
        this.updateUI();
        
        if (this.health <= 0) {
            this.gameOver();
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
            const x = (i * 73) % this.canvas.width;
            const y = (Date.now() * 0.05 + i * 50) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    updateUI() {
        this.scoreDisplay.textContent = `Score: ${this.score}`;
        this.healthFill.style.width = `${this.health}%`;
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

