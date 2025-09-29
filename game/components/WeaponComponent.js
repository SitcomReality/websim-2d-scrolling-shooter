import { Bullet } from '../entities/Bullet.js';

export class WeaponComponent {
    constructor(fireRate = 150, damage = 1) {
        this.baseFireRate = fireRate;
        this.currentFireRate = fireRate;
        this.damage = damage;
        this.bullets = [];
        this.lastFireTime = 0;

        // Burst fire system
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.maxChargeTime = 5000;
        this.chargedBullets = 0;
        this.chargeRate = 1;
    }

    update(deltaTime, inputState, position) {
        if (inputState.shoot) {
            if (!this.isCharging) {
                this.isCharging = true;
                this.chargeStartTime = Date.now();
                this.chargedBullets = 0;
            }

            if (Date.now() - this.lastFireTime > this.currentFireRate) {
                this.chargedBullets += this.chargeRate;
                this.lastFireTime = Date.now();
            }

            if (Date.now() - this.chargeStartTime >= this.maxChargeTime) {
                this.releaseBurst(position);
            }
        } else {
            if (this.isCharging && this.chargedBullets > 0) {
                this.releaseBurst(position);
            } else if (!this.isCharging) {
                if (Date.now() - this.lastFireTime > this.currentFireRate) {
                    this.shoot(position);
                    this.lastFireTime = Date.now();
                }
            }
            this.isCharging = false;
        }

        this.bullets.forEach(bullet => bullet.update(deltaTime));
        this.bullets = this.bullets.filter(bullet => bullet.alive);
    }

    shoot(position, vx = 0, vy = -10) {
        const bullet = new Bullet(position.x, position.y - 20, vx, vy, '#00ffff', this.damage);
        this.bullets.push(bullet);
    }

    releaseBurst(position) {
        const numBullets = this.chargedBullets;
        for (let i = 0; i < numBullets; i++) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = 10;
            const vx = Math.sin(angle) * speed;
            const vy = -Math.cos(angle) * speed;
            this.shoot(position, vx, vy);
        }
        this.chargedBullets = 0;
        this.isCharging = false;
    }

    increaseDamage(amount) {
        this.damage += amount;
    }

    setFireRateMultiplier(multiplier) {
        this.currentFireRate = this.baseFireRate * multiplier;
    }

    getBullets() {
        return this.bullets;
    }

    clearBullets() {
        this.bullets = [];
    }
}