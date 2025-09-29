import { PlayerComponent } from './PlayerComponent.js';

export class BurstFireComponent extends PlayerComponent {
    constructor(player) {
        super(player);
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.maxChargeTime = 5000;
        this.chargedBullets = 0;
        this.chargeRate = 1;
    }

    startCharging() {
        if (!this.isCharging) {
            this.isCharging = true;
            this.chargeStartTime = Date.now();
            this.chargedBullets = 0;
        }
    }

    stopCharging() {
        this.isCharging = false;
    }

    update(deltaTime) {
        if (this.isCharging && this.player.weaponComponent?.canFire()) {
            this.chargedBullets += this.chargeRate;
        }

        // Auto release after max charge time
        if (this.isCharging && Date.now() - this.chargeStartTime >= this.maxChargeTime) {
            this.releaseBurst();
        }
    }

    releaseBurst() {
        if (!this.player.weaponComponent || this.chargedBullets === 0) return;

        const numBullets = this.chargedBullets;
        for (let i = 0; i < numBullets; i++) {
            const angle = (Math.random() - 0.5) * Math.PI; // -90 to +90 degrees
            const speed = 10;
            const vx = Math.sin(angle) * speed;
            const vy = -Math.cos(angle) * speed;

            this.player.weaponComponent.fire(this.player.x, this.player.y, { x: vx, y: vy });
        }

        this.chargedBullets = 0;
        this.isCharging = false;
    }

    getChargeRatio() {
        if (!this.isCharging) return 0;
        return Math.min((Date.now() - this.chargeStartTime) / this.maxChargeTime, 1);
    }

    reset() {
        this.isCharging = false;
        this.chargedBullets = 0;
    }
}