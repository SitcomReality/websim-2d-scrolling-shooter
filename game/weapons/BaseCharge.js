export class BaseCharge {
    constructor(config = {}) {
        // maxChargeTime is no longer the authoritative limit for stored shots;
        // maxStoredShots is used to determine when charge is 'full'
        this.maxChargeTime = config.maxChargeTime || 5000; // kept for backward compatibility (auto-release fallback)
        this.maxStoredShots = config.maxStoredShots || 20;
        // chargeRate: how many "stored shots" accrue per 100ms
        this.chargeRate = config.chargeRate || 1;
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

        // Accrue stored shots over time using chargeRate (shots per 100ms)
        if (sinceAccrual >= 100) {
            const accrualCount = Math.floor((sinceAccrual / 100) * this.chargeRate);
            if (accrualCount > 0) {
                this.storedShots = Math.min(this.maxStoredShots, this.storedShots + accrualCount);
                this.lastAccrual = now;
            }
        }

        // Auto-release if max time reached (fallback), or if we've reached maxStoredShots
        if (elapsed >= this.maxChargeTime || this.storedShots >= this.maxStoredShots) {
            return this.release();
        }

        return null;
    }

    release() {
        if (!this.isCharging && this.storedShots === 0) return null;
        const shots = Math.max(1, this.storedShots); // ensure at least one
        const result = {
            count: shots
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
        // progress relative to maxStoredShots (0..1)
        return Math.min(1, this.storedShots / Math.max(1, this.maxStoredShots));
    }
}

export default BaseCharge;