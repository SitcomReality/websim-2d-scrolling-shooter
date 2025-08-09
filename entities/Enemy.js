import { Entity } from './Entity.js';
import { Bullet } from './Bullet.js';

export class Enemy extends Entity {
    constructor(x, y, type = 'basic') {
        super(x, y, 30, 30);
        this.type = type;
        this.speed = 2;
        this.health = 1;
        this.fireRate = 2000;
        this.lastFireTime = 0;
        this.points = 10;
        
        if (type === 'fast') {
            this.speed = 4;
            this.health = 1;
            this.points = 20;
            this.color = '#ff6666';
        } else if (type === 'tank') {
            this.speed = 1;
            this.health = 3;
            this.points = 50;
            this.color = '#ff0000';
        } else {
            this.color = '#ff9900';
        }
        
        this.bullets = [];
    }
    
    update(deltaTime) {
        this.y += this.speed;
        
        // Simple AI: shoot occasionally
        if (Date.now() - this.lastFireTime > this.fireRate) {
            this.shoot();
            this.lastFireTime = Date.now();
        }
        
        // Update enemy bullets
        this.bullets.forEach(bullet => bullet.update(deltaTime));
        this.bullets = this.bullets.filter(bullet => bullet.alive);
        
        if (this.y > 620) {
            this.alive = false;
        }
    }
    
    shoot() {
        this.bullets.push(new Bullet(this.x, this.y + 20, 0, 5, '#ff0000'));
    }
    
    takeDamage(damage = 1) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
            return true;
        }
        return false;
    }
    
    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 15);
        ctx.lineTo(this.x - 15, this.y - 15);
        ctx.lineTo(this.x + 15, this.y - 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Render enemy bullets
        this.bullets.forEach(bullet => bullet.render(ctx));
    }
    
    getBullets() {
        return this.bullets;
    }
}

