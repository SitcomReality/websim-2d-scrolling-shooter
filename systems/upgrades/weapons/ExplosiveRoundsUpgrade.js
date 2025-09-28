import { BaseUpgrade } from '../base/BaseUpgrade.js';

export class ExplosiveRoundsUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'explosive_rounds',
            name: 'Explosive Rounds',
            description: 'Bullets explode on impact, damaging nearby enemies',
            rarity: 'rare',
            category: 'weapon',
            tags: ['weapon', 'explosive', 'aoe', 'damage'],
            ...config
        });

        this.explosionRadius = config.explosionRadius || 60;
        this.explosionDamage = config.explosionDamage || 1;
        this.knockback = config.knockback || 0.5;
    }

    apply(player, values = {}) {
        // Add explosive rounds capability to player
        if (!player.weaponModifiers) player.weaponModifiers = {};

        player.weaponModifiers.explosiveRounds = {
            enabled: true,
            explosionRadius: this.explosionRadius,
            explosionDamage: values.explosionDamage || this.explosionDamage,
            knockback: this.knockback
        };

        // Override bullet creation to use explosive bullets
        const originalShoot = player.shoot.bind(player);
        player.shoot = (vx = 0, vy = -10) => {
            if (player.weaponModifiers.explosiveRounds?.enabled) {
                this.fireExplosiveBullet(player, vx, vy);
            } else {
                originalShoot(vx, vy);
            }
        };
    }

    fireExplosiveBullet(player, vx, vy) {
        const bullet = new ExplosiveBullet(
            player.x,
            player.y - 20,
            vx,
            vy,
            '#ff6600',
            player.damage || 1,
            player.weaponModifiers.explosiveRounds
        );

        if (!player.explosiveBullets) player.explosiveBullets = [];
        player.explosiveBullets.push(bullet);
    }

    getValues(rarity) {
        const baseValues = {
            explosionDamage: 1,
            explosionRadius: 60
        };

        const multipliers = {
            common: 1,
            uncommon: 1.3,
            rare: 1.7,
            legendary: 2.5
        };

        const values = {};
        Object.keys(baseValues).forEach(key => {
            values[key] = Math.round(baseValues[key] * (multipliers[rarity] || 1));
        });

        return values;
    }
}

export class ExplosiveBullet {
    constructor(x, y, vx, vy, color, damage, config) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 6;
        this.height = 10;
        this.color = color;
        this.damage = damage;
        this.explosionRadius = config.explosionRadius;
        this.explosionDamage = config.explosionDamage;
        this.knockback = config.knockback;
        this.alive = true;
        this.hasExploded = false;
        this.explosionTime = 0;
        this.explosionDuration = 300;
    }

    update(deltaTime, enemies) {
        if (this.hasExploded) {
            this.explosionTime += deltaTime;
            if (this.explosionTime >= this.explosionDuration) {
                this.alive = false;
            }
            return;
        }

        // Normal bullet movement
        this.x += this.vx;
        this.y += this.vy;

        // Check collision with enemies
        for (let enemy of enemies) {
            if (this.intersects(enemy)) {
                enemy.takeDamage(this.damage);
                this.explode(enemies);
                return;
            }
        }

        // Check boundaries
        if (this.x < -10 || this.x > 810 || this.y < -10 || this.y > 610) {
            this.alive = false;
        }
    }

    explode(enemies) {
        this.hasExploded = true;

        // Damage enemies in radius
        enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.explosionRadius) {
                // Damage based on distance from explosion center
                const damageMultiplier = 1 - (distance / this.explosionRadius);
                const damage = Math.round(this.explosionDamage * damageMultiplier);

                if (damage > 0) {
                    enemy.takeDamage(damage);
                }

                // Apply knockback
                if (this.knockback > 0 && distance > 0) {
                    const knockbackForce = this.knockback * damageMultiplier;
                    const angle = Math.atan2(dy, dx);
                    enemy.x += Math.cos(angle) * knockbackForce * 10;
                    enemy.y += Math.sin(angle) * knockbackForce * 10;
                }
            }
        });
    }

    intersects(other) {
        const dx = Math.abs(this.x - other.x);
        const dy = Math.abs(this.y - other.y);
        return dx < (this.width + other.width) / 2 && dy < (this.height + other.height) / 2;
    }

    render(ctx) {
        if (this.hasExploded) {
            this.renderExplosion(ctx);
        } else {
            this.renderBullet(ctx);
        }
    }

    renderBullet(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;

        // Draw explosive bullet with glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderExplosion(ctx) {
        const progress = this.explosionTime / this.explosionDuration;
        const radius = this.explosionRadius * (1 - progress * 0.3);
        const alpha = 1 - progress;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Outer explosion ring
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff6600';

        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner explosion
        ctx.fillStyle = '#ffaa00';
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Shockwave effect
        if (progress < 0.5) {
            const shockwaveRadius = radius * (1 + progress);
            ctx.strokeStyle = '#ffaa00';
            ctx.globalAlpha = alpha * 0.5;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}