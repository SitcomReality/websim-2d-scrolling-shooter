import { Entity } from './Entity.js';

export class Bullet extends Entity {
    constructor(x, y, vx, vy, color = '#00ffff') {
        super(x, y, 4, 10);
        this.velocity.x = vx;
        this.velocity.y = vy;
        this.color = color;
    }
    
    update(deltaTime) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        if (this.x < -10 || this.x > 810 || this.y < -10 || this.y > 610) {
            this.alive = false;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - 2, this.y - 5, 4, 10);
        ctx.restore();
    }
}

