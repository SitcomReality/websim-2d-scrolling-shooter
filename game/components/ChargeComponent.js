import BaseCharge from '../weapons/BaseCharge.js';

export class ChargeComponent {
    constructor(config = {}) {
        // accept optional statSystem to derive dynamic charge parameters
        this.statSystem = config.statSystem || null;

        this.base = new BaseCharge({
            maxChargeTime: config.maxChargeTime || 5000,
            maxStoredShots: config.maxStoredShots || 20,
            chargeRate: config.chargeRate || 1 // will be recalculated from statSystem if present
        });

        this.modifyOnStart = null;
        this.modifyOnRelease = null;

        // initialize from statSystem if available
        this._applyStatDerivedValues();
    }

    _applyStatDerivedValues() {
        try {
            if (!this.statSystem) return;
            const fireRate = this.statSystem.getStatValue('fireRate') || 150; // ms per shot
            const chargeSpeed = this.statSystem.getStatValue('chargeSpeed') || 1.0; // multiplier
            const maxChargeShots = Math.max(1, Math.round(this.statSystem.getStatValue('maxCharge') || 5));

            // derive chargeRate as "shots per 100ms" proportional to (1000/fireRate) * chargeSpeed
            const shotsPerSecond = (1000 / Math.max(1, fireRate)) * chargeSpeed;
            const shotsPer100ms = shotsPerSecond / 10;
            this.base.chargeRate = Math.max(0.01, shotsPer100ms);

            // set max stored shots from stat
            this.base.maxStoredShots = maxChargeShots;
        } catch (e) {
            // fail silently
        }
    }

    // expose method to refresh derived values (call when stats change)
    refreshFromStats() {
        this._applyStatDerivedValues();
    }

    startCharging() {
        // refresh derived values right before start to ensure current stats used
        this._applyStatDerivedValues();
        if (this.modifyOnStart) this.modifyOnStart(this.base);
        this.base.start();
    }

    stopCharging() {
        const released = this.base.stop();
        if (released && this.modifyOnRelease) this.modifyOnRelease(released, this.base);
        return released;
    }

    update() {
        // allow dynamic refresh each update in case stats changed mid-charge (cheap)
        this._applyStatDerivedValues();
        return this.base.update();
    }

    isCharging() {
        return this.base.isCharging;
    }

    getStoredShots() {
        return this.base.getStoredShots();
    }

    getChargeProgress() {
        return this.base.getChargeProgress();
    }

    reset() {
        this.base.reset();
    }
}

export default ChargeComponent;