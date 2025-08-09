export class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                Math.random() * 1000 + 500
            ));
        }
    }
    
    update(deltaTime) {
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => particle.alive);
    }
    
    render(ctx) {
        this.particles.forEach(particle => particle.render(ctx));
    }
}

class Particle {
    constructor(x, y, vx, vy, lifetime) {
        this.x = x;
        this.y = y;
        this.velocity = { x: vx, y: vy };
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.alive = true;
        this.color = `hsl(${Math.random() * 60}, 100%, 50%)`;
    }
    
    update(deltaTime) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.1; // Gravity
        
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.restore();
    }
}

