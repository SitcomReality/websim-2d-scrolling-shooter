export default class StatBinder {
    constructor(component) {
        this.component = component;
        this._bound = false;
    }

    bindToPlayer(player) {
        const statSystem = this.component.statSystem || (player && player.statSystem ? player.statSystem : null);
        if (!statSystem || this._bound) return;
        this._bound = true;
        statSystem.on('statChanged', (statId, oldVal, newVal) => {
            if (!this.component.currentWeapon) return;
            if (statId === 'damage' && typeof newVal === 'number') {
                try { this.component.currentWeapon.damage = newVal; } catch (e) {}
            } else if (statId === 'fireRate' && typeof newVal === 'number') {
                try { this.component.currentWeapon.fireRate = 1000 / Math.max(0.0001, newVal); } catch (e) {}
            }
            // other stats intentionally handled at projectile creation time via statSystem reads
        });
    }
}