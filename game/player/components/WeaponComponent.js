import { PlayerComponent } from './PlayerComponent.js';
import { Bullet } from '../../entities/Bullet.js';

export class WeaponComponent extends PlayerComponent {
    constructor(player) {
        super(player);
        this.damage = 1;
        this.fireRate = 150; // milliseconds
        this.lastFireTime = 0;
        this.bullets = [];
    }

    update(deltaTime) {
        // Update bullets
        this.bullets.forEach(bullet => bullet.update(deltaTime));
        this.bullets = this.bullets.filter(bullet => bullet.alive);
    }

    canFire() {
        return Date.now() - this.lastFireTime > this.fireRate;
    }

    fire(x, y, direction = { x: 0, y: -1 }) {
        if (!this.canFire()) return;

        const speed = 10;
        const vx = direction.x * speed;
        const vy = direction.y * speed;

        this.bullets.push(new Bullet(x, y - 20, vx, vy, '#00ffff', this.damage));
        this.lastFireTime = Date.now();
    }

    applyUpgrade(upgradeData) {
        if (upgradeData.damage) {
            this.damage += upgradeData.damage;
        }
        if (upgradeData.fireRateMultiplier) {
            this.fireRate *= upgradeData.fireRateMultiplier;
        }
    }

    reset() {
        this.bullets = [];
        this.lastFireTime = 0;
    }

    getBullets() {
        return this.bullets;
    }

    render(ctx) {
        this.bullets.forEach(bullet => bullet.render(ctx));
    }
}