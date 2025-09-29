import { BaseWeapon } from '../BaseWeapon.js';

export class BurstWeapon extends BaseWeapon {
    constructor(config = {}) {
        super({
            name: 'Burst Fire',
            damage: config.damage || 1,
            fireRate: config.fireRate || 400,
            projectileSpeed: config.projectileSpeed || 10,
            projectileColor: config.projectileColor || '#ff9900',
            burstCount: config.burstCount || 3,
            burstDelay: config.burstDelay || 50,
            ...config
        });
        
        this.burstCount = config.burstCount || 3;
        this.burstDelay = config.burstDelay || 50;
        this.currentBurst = 0;
        this.burstTimer = 0;
        this.isBursting = false;
    }

    fire(position, targetDirection = { x: 0, y: -1 }) {
        const currentTime = Date.now();
        
        if (this.isBursting) {
            if (currentTime - this.burstTimer >= this.burstDelay) {
                this.bullets.push(this.createProjectile(position, targetDirection));
                this.currentBurst++;
                this.burstTimer = currentTime;
                
                if (this.currentBurst >= this.burstCount) {
                    this.isBursting = false;
                    this.lastFireTime = currentTime;
                }
            }
        } else if (this.canFire(currentTime)) {
            this.isBursting = true;
            this.currentBurst = 0;
            this.burstTimer = currentTime;
            this.bullets.push(this.createProjectile(position, targetDirection));
            this.currentBurst = 1;
        }
    }
}

