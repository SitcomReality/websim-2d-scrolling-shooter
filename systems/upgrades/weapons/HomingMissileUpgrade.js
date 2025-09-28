import { BaseUpgrade } from '../base/BaseUpgrade.js';

export class HomingMissileUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'homing_missile',
            name: 'Homing Missiles',
            description: 'Fires missiles that track enemies',
            rarity: 'uncommon',
            category: 'weapon',
            tags: ['weapon', 'projectile', 'homing', 'missile'],
            ...config
        });

        this.homingStrength = config.homingStrength || 0.02;
        this.missileSpeed = config.missileSpeed || 4;
        this.turnRate = config.turnRate || 0.05;
    }

    apply(player, values = {}) {
        // Add homing missile capability to player
        if (!player.weaponModifiers) player.weaponModifiers = {};

        player.weaponModifiers.homingMissiles = {
            enabled: true,
            homingStrength: this.homingStrength,
            missileSpeed: this.missileSpeed,
            turnRate: this.turnRate,
            damage: values.damage || 2,
            explosionRadius: values.explosionRadius || 30
        };

        // Override shoot method to use homing missiles
        const originalShoot = player.shoot.bind(player);
        player.shoot = (vx = 0, vy = -10) => {
            if (player.weaponModifiers.homingMissiles?.enabled) {
                this.fireHomingMissile(player);
            } else {
                originalShoot(vx, vy);
            }
        };
    }

    fireHomingMissile(player) {
        const missile = new HomingMissile(
            player.x,
            player.y - 20,
            player.weaponModifiers.homingMissiles
        );

        if (!player.missiles) player.missiles = [];
        player.missiles.push(missile);
    }

    getValues(rarity) {
        const baseValues = {
            damage: 2,
            explosionRadius: 30
        };

        const multipliers = {
            common: 1,
            uncommon: 1.2,
            rare: 1.5,
            legendary: 2
        };

        const values = {};
        Object.keys(baseValues).forEach(key => {
            values[key] = Math.round(baseValues[key] * (multipliers[rarity] || 1));
        });

        return values;
    }
}

export class HomingMissile {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = -config.missileSpeed;
        this.width = 8;
        this.height = 16;
        this.damage = config.damage;
        this.homingStrength = config.homingStrength;
        this.turnRate = config.turnRate;
        this.explosionRadius = config.explosionRadius;
        this.alive = true;
        this.target = null;
        this.trail = [];
        this.maxTrailLength = 10;
    }

    update(deltaTime, enemies) {
        // Find nearest enemy
        if (!this.target || !this.target.alive) {
            this.target = this.findNearestEnemy(enemies);
        }

        // Apply homing
        if (this.target && this.target.alive) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const angle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(this.vy, this.vx);

            let angleDiff = angle - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            const turnAmount = Math.min(Math.abs(angleDiff), this.turnRate);
            const turnDirection = angleDiff > 0 ? 1 : -1;

            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const newAngle = currentAngle + turnDirection * turnAmount;

            this.vx = Math.cos(newAngle) * speed;
            this.vy = Math.sin(newAngle) * speed;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Update trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Check boundaries
        if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 650) {
            this.alive = false;
        }
    }

    findNearestEnemy(enemies) {
        let nearest = null;
        let minDistance = Infinity;

        enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        });

        return nearest;
    }

    checkCollision(enemies) {
        for (let enemy of enemies) {
            if (this.intersects(enemy)) {
                enemy.takeDamage(this.damage);
                this.alive = false;
                return { hit: true, x: this.x, y: this.y };
            }
        }
        return { hit: false };
    }

    intersects(other) {
        const dx = Math.abs(this.x - other.x);
        const dy = Math.abs(this.y - other.y);
        return dx < (this.width + other.width) / 2 && dy < (this.height + other.height) / 2;
    }

    render(ctx) {
        // Draw trail
        ctx.save();
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff6600';

        ctx.beginPath();
        this.trail.forEach((point, index) => {
            const alpha = (index + 1) / this.trail.length;
            ctx.globalAlpha = alpha * 0.5;
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();

        // Draw missile
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff9900';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff9900';

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);

        // Missile body
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 3);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Missile fins
        ctx.fillStyle = '#cc6600';
        ctx.fillRect(-this.width / 2, this.height / 3, this.width / 3, this.height / 6);
        ctx.fillRect(this.width / 6, this.height / 3, this.width / 3, this.height / 6);

        ctx.restore();
        ctx.restore();
    }
}