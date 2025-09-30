export class WeaponComponent {
    constructor(weaponFactory, weaponType = 'single', config = {}) {
        this.weaponFactory = weaponFactory;
        this.currentWeapon = this.weaponFactory.createWeapon(weaponType, config);
        this.weaponType = weaponType;
    }

    update(deltaTime, inputState, position) {
        if (inputState.shoot && this.currentWeapon) {
            this.currentWeapon.fire(position);
        }

        if (this.currentWeapon) {
            this.currentWeapon.update(deltaTime);
        }
    }

    switchWeapon(weaponType, config = {}) {
        if (this.currentWeapon) {
            // Preserve some stats from current weapon
            const currentDamage = this.currentWeapon.damage;
            const currentFireRate = this.currentWeapon.fireRate;
            
            this.currentWeapon = this.weaponFactory.createWeapon(weaponType, {
                damage: currentDamage,
                fireRate: currentFireRate,
                ...config
            });
            
            this.weaponType = weaponType;
        }
    }

    increaseDamage(amount) {
        if (this.currentWeapon) {
            this.currentWeapon.increaseDamage(amount);
        }
    }

    setFireRateMultiplier(multiplier) {
        if (this.currentWeapon) {
            this.currentWeapon.setFireRateMultiplier(multiplier);
        }
    }

    getBullets() {
        return this.currentWeapon ? this.currentWeapon.getBullets() : [];
    }

    clearBullets() {
        if (this.currentWeapon) {
            this.currentWeapon.clearBullets();
        }
    }

    getCurrentWeaponType() {
        return this.weaponType;
    }

    getCurrentWeapon() {
        return this.currentWeapon;
    }
}