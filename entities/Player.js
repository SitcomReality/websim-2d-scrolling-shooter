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
        
        // Burst fire system
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.maxChargeTime = 5000; // 5 seconds
        this.chargedBullets = 0;
        this.chargeRate = 1; // bullets per fireRate interval
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
            
            // Handle charging/burst firing
            if (inputState.shoot) {
                // Start or continue charging
                if (!this.isCharging) {
                    this.isCharging = true;
                    this.chargeStartTime = Date.now();
                    this.chargedBullets = 0;
                }
                
                // Add bullets to charge
                if (Date.now() - this.lastFireTime > (this.fireRate || 150)) {
                    this.chargedBullets += this.chargeRate;
                    this.lastFireTime = Date.now();
                }
                
                // Auto release after max charge time
                if (Date.now() - this.chargeStartTime >= this.maxChargeTime) {
                    this.releaseBurst();
                }
            } else {
                // Release burst and resume normal firing
                if (this.isCharging && this.chargedBullets > 0) {
                    this.releaseBurst();
                } else if (!this.isCharging) {
                    // Normal continuous firing
                    if (Date.now() - this.lastFireTime > (this.fireRate || 150)) {
                        this.shoot();
                        this.lastFireTime = Date.now();
                    }
                }
                
                this.isCharging = false;
            }
        }
        
        // Always update bullets
        this.bullets.forEach(bullet => bullet.update(deltaTime));
        this.bullets = this.bullets.filter(bullet => bullet.alive);
    }
    
    shoot(vx = 0, vy = -10) {
        const damage = this.damage || 1;
        this.bullets.push(new Bullet(this.x, this.y - 20, vx, vy, '#00ffff', damage));
    }
    
    releaseBurst() {
        // Release all charged bullets in a 180-degree spread
        const numBullets = this.chargedBullets;
        for (let i = 0; i < numBullets; i++) {
            const angle = (Math.random() - 0.5) * Math.PI; // -90 to +90 degrees
            const speed = 10;
            const vx = Math.sin(angle) * speed;
            const vy = -Math.cos(angle) * speed;
            this.shoot(vx, vy);
        }
        
        this.chargedBullets = 0;
        this.isCharging = false;
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
        
        // Show charge indicator when charging
        if (this.isCharging && this.chargedBullets > 0) {
            const chargeRatio = Math.min((Date.now() - this.chargeStartTime) / this.maxChargeTime, 1);
            const radius = 20 + chargeRatio * 10;
            const alpha = 0.3 + chargeRatio * 0.4;
            
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Show bullet count
            ctx.fillStyle = '#00ffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.chargedBullets, this.x, this.y + 5);
        }
        
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
        this.isCharging = false;
        this.chargedBullets = 0;
    }
}