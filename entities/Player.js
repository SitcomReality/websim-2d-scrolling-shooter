import { Entity } from './Entity.js';
import { Bullet } from './Bullet.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.speed = 5;
        this.bullets = [];
        this.fireRate = 150; // milliseconds
        this.lastFireTime = 0;
        this.color = '#00ffff';
    }
    
    update(deltaTime, inputState) {
        // Movement
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        if (inputState.left) this.velocity.x = -this.speed;
        if (inputState.right) this.velocity.x = this.speed;
        if (inputState.up) this.velocity.y = -this.speed;
        if (inputState.down) this.velocity.y = this.speed;
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Keep player in bounds
        this.x = Math.max(20, Math.min(780, this.x));
        this.y = Math.max(20, Math.min(580, this.y));
        
        // Shooting
        if (inputState.shoot && Date.now() - this.lastFireTime > this.fireRate) {
            this.shoot();
            this.lastFireTime = Date.now();
        }
        
        // Update bullets
        this.bullets.forEach(bullet => bullet.update(deltaTime));
        this.bullets = this.bullets.filter(bullet => bullet.alive);
    }
    
    shoot() {
        this.bullets.push(new Bullet(this.x, this.y - 20, 0, -10));
    }
    
    render(ctx) {
        // Render player ship
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 20);
        ctx.lineTo(this.x - 20, this.y + 20);
        ctx.lineTo(this.x, this.y + 10);
        ctx.lineTo(this.x + 20, this.y + 20);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Render bullets
        this.bullets.forEach(bullet => bullet.render(ctx));
    }
    
    getBullets() {
        return this.bullets;
    }
    
    reset() {
        this.x = 400;
        this.y = 500;
        this.bullets = [];
        this.alive = true;
    }
}

