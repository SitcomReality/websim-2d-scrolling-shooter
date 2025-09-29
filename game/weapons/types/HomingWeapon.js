import { BaseWeapon } from '../BaseWeapon.js';

export class HomingWeapon extends BaseWeapon {
    constructor(config = {}) {
        super({
            name: 'Homing Missile',
            damage: config.damage || 2,
            fireRate: config.fireRate || 300,
            projectileSpeed: config.projectileSpeed || 8,
            projectileColor: config.projectileColor || '#ff00ff',
            turnSpeed: config.turnSpeed || 0.05,
            ...config
        });

        this.turnSpeed = config.turnSpeed || 0.05;
        this.homingRange = config.homingRange || 300;
    }

    update(deltaTime) {
        // Update homing behavior
        this.bullets.forEach(bullet => {
            if (bullet.alive && window.gameInstance) {
                const enemies = window.gameInstance.enemySpawner.getEnemies();
                const target = this.findNearestEnemy(bullet, enemies);

                if (target) {
                    const dx = target.x - bullet.x;
                    const dy = target.y - bullet.y;
                    const angle = Math.atan2(dy, dx);

                    const currentAngle = Math.atan2(bullet.vy, bullet.vx);
                    let newAngle = currentAngle + this.turnSpeed * Math.sign(angle - currentAngle);

                    bullet.vx = Math.cos(newAngle) * this.projectileSpeed;
                    bullet.vy = Math.sin(newAngle) * this.projectileSpeed;
                }

                bullet.x += bullet.vx;
                bullet.y += bullet.vy;

                if (bullet.x < -10 || bullet.x > 810 || bullet.y < -10 || bullet.y > 610) {
                    bullet.alive = false;
                }
            }

            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            if (bullet.x < -10 || bullet.x > 810 || bullet.y < -10 || bullet.y > 610) {
                bullet.alive = false;
            }
        });

        this.bullets = this.bullets.filter(bullet => bullet.alive);
    }

    findNearestEnemy(projectile, enemies) {
        let nearest = null;
        let minDistance = this.homingRange;

        enemies.forEach(enemy => {
            const dx = enemy.x - projectile.x;
            const dy = enemy.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        });

        return nearest;
    }

    createProjectile(position, direction, damage = null, color = null) {
        const projectile = super.createProjectile(position, direction, damage, color);
        projectile.width = 6;
        projectile.height = 12;
        return projectile;
    }
}