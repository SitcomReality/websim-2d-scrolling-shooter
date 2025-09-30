import BaseCharge from '../weapons/BaseCharge.js';

export class ChargeComponent {
    constructor(config = {}) {
        this.base = new BaseCharge({
            maxChargeTime: config.maxChargeTime || 5000,
            maxStoredShots: config.maxStoredShots || 20,
            chargeRate: config.chargeRate || 1
        });

        this.modifyOnStart = null;
        this.modifyOnRelease = null;
    }

    startCharging() {
        if (this.modifyOnStart) this.modifyOnStart(this.base);
        this.base.start();
    }

    stopCharging() {
        const released = this.base.stop();
        if (released && this.modifyOnRelease) this.modifyOnRelease(released, this.base);
        return released;
    }

    update() {
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