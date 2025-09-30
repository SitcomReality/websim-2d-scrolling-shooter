import { Enemy } from '../../entities/Enemy.js';

export class EnemySpawner {
    constructor(canvas) {
        this.canvas = canvas;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnRate = 2000; // 2 seconds
        this.lastSpawnTime = 0;
        this.unlockedTypes = ['basic'];
    }

    update(deltaTime, playerLevel) {
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer > this.spawnRate) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            
            if (!enemy.alive || enemy.y > 620) {
                this.enemies.splice(i, 1);
            }
        }

        // Unlock enemy types based on player level
        this.unlockEnemyTypes(playerLevel);
    }

    spawnEnemy() {
        const availableTypes = this.unlockedTypes;
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const x = Math.random() * (this.canvas.width - 60) + 30;
        this.enemies.push(new Enemy(x, -30, type));
    }

    getEnemies() {
        return this.enemies;
    }

    reset() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.unlockedTypes = ['basic'];
    }

    unlockEnemyTypes(playerLevel) {
        const unlockOrder = ['basic', 'fast', 'zigzag', 'tank'];
        
        // Calculate how many types should be unlocked
        const typesToUnlock = Math.min(playerLevel, unlockOrder.length);
        
        // Update unlocked types to include only up to the current level
        this.unlockedTypes = unlockOrder.slice(0, typesToUnlock);
    }
}