import { Enemy } from '../game/entities/Enemy.js';

export class EnemySpawner {
    constructor(canvas) {
        this.canvas = canvas;
        this.enemies = [];
        this.spawnRate = 2000; // milliseconds
        this.lastSpawnTime = 0;
        this.wave = 1; // Initialize wave counter
        
        // Fixed progressive enemy unlock system
        this.enemyTypes = ['basic', 'fast', 'zigzag', 'tank'];
        this.unlockedTypes = ['basic']; // Start with only basic
    }
    
    update(deltaTime, playerLevel) {
        // Ensure we have a valid player level
        const level = Math.max(1, playerLevel || 1);
        
        // Unlock new enemy types based on player level
        this.unlockEnemyTypes(level);
        
        // Update spawn rate based on level
        this.updateSpawnRate(level);
        
        // Spawn new enemies
        if (Date.now() - this.lastSpawnTime > this.spawnRate) {
            this.spawnEnemy();
            this.lastSpawnTime = Date.now();
        }
        
        // Update existing enemies
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        this.enemies = this.enemies.filter(enemy => enemy.alive);
        
        // Increase difficulty over time
        this.spawnRate = Math.max(500, 2000 - this.wave * 100);
    }
    
    updateSpawnRate(playerLevel) {
        // Update spawn rate based on player level
        this.spawnRate = Math.max(500, 2000 - playerLevel * 100);
    }
    
    unlockEnemyTypes(playerLevel) {
        const unlockOrder = ['basic', 'fast', 'zigzag', 'tank'];
        
        // Calculate how many types should be unlocked
        const typesToUnlock = Math.min(playerLevel, unlockOrder.length);
        
        // Update unlocked types to include only up to the current level
        this.unlockedTypes = unlockOrder.slice(0, typesToUnlock);
    }
    
    spawnEnemy() {
        const x = Math.random() * (this.canvas.width - 60) + 30;
        const type = this.getRandomEnemyType();
        
        this.enemies.push(new Enemy(x, -30, type));
        
        // Increase wave counter
        if (this.enemies.length === 0) {
            this.wave++;
        }
    }
    
    getRandomEnemyType() {
        // Only select from unlocked types
        if (this.unlockedTypes.length === 0) {
            return 'basic'; // Fallback
        }
        
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
        this.spawnRate = 2000;
        this.unlockedTypes = ['basic'];
        this.wave = 1;
    }
}