import { Enemy } from '../entities/Enemy.js';

export class EnemySpawner {
    constructor(canvas) {
        this.canvas = canvas;
        this.enemies = [];
        this.spawnRate = 2000; // milliseconds
        this.lastSpawnTime = 0;
        this.wave = 1;
    }
    
    update(deltaTime) {
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
        const rand = Math.random();
        if (rand < 0.7) return 'basic';
        if (rand < 0.9) return 'fast';
        return 'tank';
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
    }
}

