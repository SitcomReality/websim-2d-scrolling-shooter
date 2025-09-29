export class BaseWeapon {
    constructor(config = {}) {
        this.name = config.name || 'Base Weapon';
        this.damage = config.damage || 1;
        this.fireRate = config.fireRate || 150;
        this.projectileSpeed = config.projectileSpeed || 10;
        this.projectileColor = config.projectileColor || '#00ffff';
        this.lastFireTime = 0;
        this.bullets = [];
    }

    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    fire(position, targetDirection = { x: 0, y: -1 }) {
        const currentTime = Date.now();
        if (!this.canFire(currentTime)) return;

        const projectiles = this.createProjectiles(position, targetDirection);
        this.bullets.push(...projectiles);
        this.lastFireTime = currentTime;
    }

    createProjectiles(position, targetDirection) {
        // Override in subclasses for specific firing patterns
        return [this.createProjectile(position, targetDirection)];
    }

    createProjectile(position, direction, damage = null, color = null) {
        const vx = direction.x * this.projectileSpeed;
        const vy = direction.y * this.projectileSpeed;

        // Check for critical hit
        let finalDamage = damage || this.damage;
        let finalColor = color || this.projectileColor;
        
        if (window.gameInstance && window.gameInstance.player) {
            const player = window.gameInstance.player;
            const critChance = player.statsComponent ? 
                player.statsComponent.getCriticalChance() : 
                (player.criticalChance || 0.01);
            const critDamage = player.statsComponent ? 
                player.statsComponent.getCriticalDamage() : 
                (player.criticalDamage || 0.5);

            if (Math.random() < critChance) {
                finalDamage = (damage || this.damage) * (1 + critDamage);
                finalColor = '#ffff00'; // Yellow for critical hits
            }
        }

        return {
            x: position.x,
            y: position.y,
            vx: vx,
            vy: vy,
            damage: finalDamage,
            color: finalColor,
            alive: true,
            width: 4,
            height: 10,
            isCritical: finalColor === '#ffff00'
        };
    }

    update(deltaTime) {
        this.bullets.forEach(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            // Remove bullets that go off screen
            if (bullet.x < -10 || bullet.x > 810 || bullet.y < -10 || bullet.y > 610) {
                bullet.alive = false;
            }
        });

        this.bullets = this.bullets.filter(bullet => bullet.alive);
    }

    render(ctx) {
        this.bullets.forEach(bullet => {
            ctx.save();
            ctx.fillStyle = bullet.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = bullet.color;
            ctx.fillRect(bullet.x - bullet.width/2, bullet.y - bullet.height/2, bullet.width, bullet.height);
            ctx.restore();
        });
    }

    getBullets() {
        return this.bullets;
    }

    clearBullets() {
        this.bullets = [];
    }

    increaseDamage(amount) {
        this.damage += amount;
    }

    setFireRateMultiplier(multiplier) {
        this.fireRate = this.fireRate * multiplier;
    }
}