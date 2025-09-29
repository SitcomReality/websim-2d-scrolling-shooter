import { BaseWeapon } from '../BaseWeapon.js';

export class SpreadWeapon extends BaseWeapon {
    constructor(config = {}) {
        super({
            name: 'Spread Shot',
            damage: config.damage || 0.8,
            fireRate: config.fireRate || 200,
            projectileSpeed: config.projectileSpeed || 10,
            projectileColor: config.projectileColor || '#00ff00',
            spreadCount: config.spreadCount || 5,
            spreadAngle: config.spreadAngle || Math.PI / 6, // 30 degrees
            ...config
        });
        
        this.spreadCount = config.spreadCount || 5;
        this.spreadAngle = config.spreadAngle || Math.PI / 6;
    }

    createProjectiles(position, targetDirection) {
        const projectiles = [];
        const angleStep = this.spreadAngle / (this.spreadCount - 1);
        const startAngle = -this.spreadAngle / 2;

        for (let i = 0; i < this.spreadCount; i++) {
            const angle = startAngle + (i * angleStep);
            const direction = {
                x: targetDirection.x * Math.cos(angle) - targetDirection.y * Math.sin(angle),
                y: targetDirection.x * Math.sin(angle) + targetDirection.y * Math.cos(angle)
            };
            
            // Normalize direction
            const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= length;
            direction.y /= length;
            
            projectiles.push(this.createProjectile(position, direction));
        }

        return projectiles;
    }
}

