import { BaseWeapon } from '../BaseWeapon.js';

export class SingleShotWeapon extends BaseWeapon {
    constructor(config = {}) {
        super({
            name: 'Single Shot',
            damage: config.damage || 1,
            fireRate: config.fireRate || 150,
            projectileSpeed: config.projectileSpeed || 10,
            projectileColor: config.projectileColor || '#00ffff',
            ...config
        });
    }

    createProjectiles(position, targetDirection) {
        return [this.createProjectile(position, targetDirection)];
    }
}

