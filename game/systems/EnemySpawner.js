import { Enemy } from '../entities/Enemy.js';

export class EnemySpawner {
    constructor(canvas) {
        this.canvas = canvas;
        this.enemies = [];
        this.spawnRate = 2000; // milliseconds
        this.lastSpawnTime = 0;
        this.wave = 1;
        
        // Progressive enemy unlock system
        this.enemyTypes = ['basic', 'fast', 'zigzag', 'tank'];
        this.unlockedTypes = ['basic']; // Start with only basic
        this.unlockLevel = 2; // First unlock happens at level 2
    }
    
    update(deltaTime, playerLevel) {
        // Unlock new enemy types based on player level
        this.unlockEnemyTypes(playerLevel);
        
        // Increase spawn rate based on level
        this.updateSpawnRate(playerLevel);
        
        // Spawn new enemies
        if (Date.now() - this.lastSpawnTime > this.spawnRate) {
            this.spawnEnemy(playerLevel);
            this.lastSpawnTime = Date.now();
        }
        
        // Update existing enemies
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        this.enemies = this.enemies.filter(enemy => enemy.alive);
    }
    
    unlockEnemyTypes(playerLevel) {
        const unlockOrder = ['basic', 'fast', 'zigzag', 'tank'];
        
        // Calculate how many types should be unlocked (including basic)
        const typesToUnlock = Math.min(playerLevel, unlockOrder.length);
        
        // Update unlocked types
        this.unlockedTypes = unlockOrder.slice(0, typesToUnlock);
    }
    
    updateSpawnRate(playerLevel) {
        // Linear decrease in spawn rate as level increases
        // Base: 2000ms, decreases by 100ms per level, minimum 500ms
        this.spawnRate = Math.max(500, 2000 - (playerLevel - 1) * 100);
    }
    
    spawnEnemy(playerLevel) {
        const x = Math.random() * (this.canvas.width - 60) + 30;
        const type = this.getRandomEnemyType();
        
        this.enemies.push(new Enemy(x, -30, type));
    }
    
    getRandomEnemyType() {
        // Only select from unlocked types
        const randomIndex = Math.floor(Math.random() * this.unlockedTypes.length);
        return this.unlockedTypes[randomIndex];
    }
    
    render(ctx) {
        this.enemies.forEach(enemy => enemy.render(ctx));
    }
    
    getEnemies() {
        return this.enemies;
    }
    
    reset() {
        this.enemies = [];
        this.wave = 1;
        this.spawnRate = 2000;
        this.unlockedTypes = ['basic'];
    }
}