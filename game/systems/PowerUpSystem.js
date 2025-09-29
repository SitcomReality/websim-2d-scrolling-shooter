import { Entity } from '../entities/Entity.js';

export class PowerUpSystem {
    constructor() {
        this.powerUps = [];
        this.spawnRate = 10000; // 10 seconds
        this.lastSpawnTime = 0;
    }
    
    update(deltaTime) {
        if (Date.now() - this.lastSpawnTime > this.spawnRate) {
            // Implementation for power-ups
        }
        
        this.powerUps.forEach(powerUp => powerUp.update(deltaTime));
        this.powerUps = this.powerUps.filter(powerUp => powerUp.alive);
    }
    
    spawnPowerUp() {
        // Implementation for power-ups
    }
    
    spawnHealthPickup(x, y) {
        const healthAmount = 5; // Fixed amount
        this.powerUps.push(new HealthPickup(x, y, healthAmount));
    }
    
    render(ctx) {
        this.powerUps.forEach(powerUp => powerUp.render(ctx));
    }
    
    checkPlayerCollision(player) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (powerUp.intersects(player)) {
                powerUp.apply(player);
                this.powerUps.splice(i, 1);
            }
        }
    }
}

class HealthPickup extends Entity {
    constructor(x, y, healthAmount = 5) {
        super(x, y, 20, 20);
        this.speed = 1.2;
        this.color = '#00ff00';
        this.value = healthAmount;
    }
    
    update(deltaTime) {
        this.y += this.speed;
        
        if (this.y > 620) {
            this.alive = false;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Draw cross symbol
        ctx.fillRect(this.x - 2, this.y - 10, 4, 20);
        ctx.fillRect(this.x - 10, this.y - 2, 20, 4);
        
        // Draw glow effect
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
    apply(player) {
        const maxHealth = 100; // Default max health
        const healthAmount = this.value;
        player.health = Math.min(player.health + healthAmount, maxHealth);
    }
}