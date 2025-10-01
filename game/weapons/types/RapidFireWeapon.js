import { BaseWeapon } from '../BaseWeapon.js';

export class RapidFireWeapon extends BaseWeapon {
    constructor(config = {}) {
        super({
            name: 'Rapid Fire',
            damage: config.damage || 0.6,
            fireRate: config.fireRate || 60,
            projectileSpeed: config.projectileSpeed || 12,
            projectileColor: config.projectileColor || '#ffff00',
            ...config
        });
    }

    createProjectile(position, direction, damage = null, color = null) {
        // ensure owner-based damage resolution happens in BaseWeapon
        const projectile = super.createProjectile(position, direction, damage, color);
        projectile.width = 3;
        projectile.height = 8;
        return projectile;
    }
}