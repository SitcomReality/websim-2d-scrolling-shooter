export class BaseCharge {
    constructor(config = {}) {
        this.maxChargeTime = config.maxChargeTime || 5000; // ms
        this.maxStoredShots = config.maxStoredShots || 20;
        this.chargeRate = config.chargeRate || 1; // shots per 100ms equivalent scale
        this.reset();
    }

    reset() {
        this.isCharging = false;
        this.chargeStart = 0;
        this.storedShots = 0;
        this.lastAccrual = 0;
    }

    start() {
        if (!this.isCharging) {
            this.isCharging = true;
            this.chargeStart = Date.now();
            this.lastAccrual = Date.now();
        }
    }

    stop() {
        const released = this.release();
        this.reset();
        return released;
    }

    update() {
        if (!this.isCharging) return null;

        const now = Date.now();
        const elapsed = now - this.chargeStart;
        const sinceAccrual = now - this.lastAccrual;

        // Accrue stored shots over time (simple linear accrual)
        if (sinceAccrual >= 100) {
            const accrualCount = Math.floor((sinceAccrual / 100) * this.chargeRate);
            if (accrualCount > 0) {
                this.storedShots = Math.min(this.maxStoredShots, this.storedShots + accrualCount);
                this.lastAccrual = now;
            }
        }

        // Auto-release if max time reached
        if (elapsed >= this.maxChargeTime) {
            return this.release();
        }

        return null;
    }

    release() {
        if (!this.isCharging && this.storedShots === 0) return null;
        const shots = Math.max(1, this.storedShots); // ensure at least one if something stored
        const result = {
            count: shots,
            // clears stored on release; caller receives count and handles projectile creation
        };
        // clear stored shots
        this.storedShots = 0;
        this.isCharging = false;
        this.chargeStart = 0;
        this.lastAccrual = 0;
        return result;
    }

    getStoredShots() {
        return this.storedShots;
    }

    getChargeProgress() {
        if (!this.isCharging) return 0;
        return Math.min(1, (Date.now() - this.chargeStart) / this.maxChargeTime);
    }
}

export default BaseCharge;