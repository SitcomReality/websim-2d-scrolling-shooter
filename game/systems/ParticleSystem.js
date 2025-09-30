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

    createSuction(x, y, intensity = 0.5) {
        const count = Math.max(2, Math.round(6 * intensity));
        const lifetime = 400 + Math.round(600 * intensity);

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Spawn close at low intensity; as intensity increases allow particles to spawn farther away
            const distance = 10 + Math.random() * (40 + intensity * 120);
            const sx = x + Math.cos(angle) * distance;
            const sy = y + Math.sin(angle) * distance - 20;
            const speed = 0.5 + intensity * 2.0 + Math.random() * 0.5;
            this.particles.push(new SuctionParticle(sx, sy, x, y, speed, lifetime));
        }
    }
    
    spawnPowerUp() {
        // Implementation for power-ups
    }
    
    spawnHealthPickup(x, y) {
        const healthAmount = 5; // Fixed amount
        this.powerUps.push(new HealthPickup(x, y, healthAmount));
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

class SuctionParticle {
    constructor(x, y, targetX, targetY, speed = 1, lifetime = 800) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.alive = true;
        // Reduce max suction particle size by 50%
        this.size = (2 + Math.random() * 3) * 0.5;
        this.color = `rgba(0, 200, 255, ${0.6 + Math.random() * 0.4})`;
        this.vx = 0;
        this.vy = 0;
    }

    update(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const accel = (this.speed * (1 + (1 - (this.lifetime / this.maxLifetime)))) * (deltaTime / 16);

        this.vx += (dx / dist) * accel;
        this.vy += (dy / dist) * accel;

        this.vx *= 0.98;
        this.vy *= 0.98;

        this.x += this.vx;
        this.y += this.vy;

        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) this.alive = false;

        if (Math.hypot(this.targetX - this.x, this.targetY - this.y) < 6) {
            this.alive = false;
        }
    }

    render(ctx) {
        const alpha = Math.max(0, this.lifetime / this.maxLifetime);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}