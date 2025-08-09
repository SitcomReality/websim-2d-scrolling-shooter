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
        this.damage = 1;
        this.invulnerable = false;
    }
    
    update(deltaTime, inputState) {
        if (!this.invulnerable) {
            // Movement
            this.velocity.x = 0;
            this.velocity.y = 0;
            
            if (inputState.left) this.velocity.x = -(this.speed || 5);
            if (inputState.right) this.velocity.x = this.speed || 5;
            if (inputState.up) this.velocity.y = -(this.speed || 5);
            if (inputState.down) this.velocity.y = this.speed || 5;
            
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            
            // Keep player in bounds
            this.x = Math.max(20, Math.min(780, this.x));
            this.y = Math.max(20, Math.min(580, this.y));
            
            // Shooting
            if (inputState.shoot && Date.now() - this.lastFireTime > (this.fireRate || 150)) {
                this.shoot();
                this.lastFireTime = Date.now();
            }
        }
        
        // Always update bullets
        this.bullets.forEach(bullet => bullet.update(deltaTime));
        this.bullets = this.bullets.filter(bullet => bullet.alive);
    }
    
    shoot() {
        const damage = this.damage || 1;
        this.bullets.push(new Bullet(this.x, this.y - 20, 0, -10, '#00ffff', damage));
    }
    
    render(ctx) {
        // Render player ship
        ctx.save();
        
        if (this.invulnerable) {
            // Flashing effect when invulnerable
            const flash = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.globalAlpha = 0.7 + flash * 0.3;
        }
        
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