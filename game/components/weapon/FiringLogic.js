export default class FiringLogic {
    constructor(component) {
        this.component = component;
    }

    _emitProjectiles(count, position) {
        // Delegate charged release behavior to the active weapon so different weapons can implement unique patterns/synergies.
        try {
            const weapon = this.component.currentWeapon;
            if (weapon && typeof weapon.fireChargedRelease === 'function') {
                weapon.fireChargedRelease(count, position);
                return;
            }
        } catch (e) {
            // fall through to fallback below if delegation fails
        }

        // Fallback: approximate previous behavior using factory if weapon doesn't implement release
        for (let i = 0; i < count; i++) {
            const angle = (Math.random() * Math.PI) - (Math.PI / 2);
            const dir = { x: Math.sin(angle), y: -Math.cos(angle) };
            const len = Math.hypot(dir.x, dir.y) || 1;
            dir.x /= len; dir.y /= len;
            const proj = this.component._createProjectileFromWeapon(position, dir);
            proj.vx += (Math.random() - 0.5) * 1.5;
            proj.vy += (Math.random() - 0.5) * 1.5;
            if (!this.component.currentWeapon.bullets) this.component.currentWeapon.bullets = [];
            this.component.currentWeapon.bullets.push(proj);
        }
    }

    update(deltaTime, inputState, position) {
        const cc = this.component.chargeComponent;
        if (inputState.shoot) {
            if (!cc.isCharging()) cc.startCharging();
        } else {
            if (cc.isCharging()) {
                const release = cc.stopCharging();
                if (release && this.component.currentWeapon) {
                    this._emitProjectiles(release.count, position);
                }
            } else {
                if (this.component.currentWeapon) {
                    if (this.component.owner) this.component.currentWeapon.owner = this.component.owner;
                    if (typeof this.component.currentWeapon.fire === 'function') {
                        this.component.currentWeapon.fire(position);
                    }
                }
            }
        }

        const autoRelease = cc.update();
        if (autoRelease && this.component.currentWeapon) {
            this._emitProjectiles(autoRelease.count, position);
            // Do NOT auto-restart charging when the button remains held.
            // Recharging must require the player to release and then press again.
        }
    }
}