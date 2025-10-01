import ChargeComponent from './ChargeComponent.js';
import FallbackWeapon from './weapon/FallbackWeapon.js';
import ProjectileFactory from './weapon/ProjectileFactory.js';
import StatBinder from './weapon/StatBinder.js';
import FiringLogic from './weapon/FiringLogic.js';

export class WeaponComponent {
    constructor(weaponFactory, weaponType = 'single', config = {}) {
        this.weaponFactory = weaponFactory;
        this.statSystem = config.statSystem || null;

        // create or fallback
        if (weaponFactory && typeof weaponFactory.createWeapon === 'function') {
            this.currentWeapon = weaponFactory.createWeapon(weaponType, config);
        } else {
            this.currentWeapon = FallbackWeapon(weaponType, config);
        }

        this.weaponType = weaponType;
        this.owner = null;
        this._statBound = false;

        this.chargeComponent = new ChargeComponent({
            maxChargeTime: config.maxChargeTime || 5000,
            maxStoredShots: config.maxStoredShots || 20,
            chargeRate: config.chargeRate || 1
        });

        this.chargedBullets = 0;
        this.maxChargeTime = this.chargeComponent.base.maxChargeTime || (config.maxChargeTime || 5000);

        // bind stat helper for easier testing & separation
        this._statBinder = new StatBinder(this);
        this._firingLogic = new FiringLogic(this);
    }

    bindToPlayer(player) {
        this.owner = player;
        if (this.currentWeapon) this.currentWeapon.owner = player;
        this._statBinder.bindToPlayer(player);
    }

    update(deltaTime, inputState, position) {
        this._firingLogic.update(deltaTime, inputState, position);
        this.chargedBullets = this.chargeComponent.getStoredShots();
        if (this.currentWeapon && typeof this.currentWeapon.update === 'function') {
            this.currentWeapon.update(deltaTime);
        }
    }

    switchWeapon(weaponType, config = {}) {
        if (this.currentWeapon) {
            const currentDamage = this.currentWeapon.damage;
            const currentFireRate = this.currentWeapon.fireRate;
            if (this.weaponFactory && typeof this.weaponFactory.createWeapon === 'function') {
                this.currentWeapon = this.weaponFactory.createWeapon(weaponType, {
                    damage: currentDamage,
                    fireRate: currentFireRate,
                    ...config
                });
            } else {
                this.currentWeapon = FallbackWeapon(weaponType, {
                    damage: currentDamage,
                    fireRate: currentFireRate,
                    ...config
                });
            }
            this.weaponType = weaponType;
            if (this.owner) this.currentWeapon.owner = this.owner;
        }
    }

    increaseDamage(amount) {
        if (this.currentWeapon) this.currentWeapon.increaseDamage(amount);
    }

    setFireRateMultiplier(multiplier) {
        if (this.currentWeapon) this.currentWeapon.setFireRateMultiplier(multiplier);
    }

    setChain(count, range = 100, damageReduction = 0.7) {
        if (this.currentWeapon && typeof this.currentWeapon.setChain === 'function') {
            this.currentWeapon.setChain(count, range, damageReduction);
        } else if (this.currentWeapon) {
            this.currentWeapon.chain = count;
            this.currentWeapon.chainRange = range;
            this.currentWeapon.chainDamageReduction = damageReduction;
        }
    }

    getBullets() {
        return this.currentWeapon ? (this.currentWeapon.getBullets ? this.currentWeapon.getBullets() : this.currentWeapon.bullets || []) : [];
    }

    clearBullets() {
        if (this.currentWeapon && typeof this.currentWeapon.clearBullets === 'function') {
            this.currentWeapon.clearBullets();
        } else if (this.currentWeapon) {
            this.currentWeapon.bullets = [];
        }
    }

    getCurrentWeaponType() { return this.weaponType; }
    getCurrentWeapon() { return this.currentWeapon; }

    render(ctx) {
        if (this.currentWeapon && typeof this.currentWeapon.render === 'function') {
            this.currentWeapon.render(ctx);
            return;
        }
        const bullets = this.getBullets();
        bullets.forEach(bullet => {
            ctx.save();
            ctx.fillStyle = bullet.color || '#00ffff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = bullet.color || '#00ffff';
            ctx.fillRect(bullet.x - (bullet.width || 4) / 2, bullet.y - (bullet.height || 10) / 2, bullet.width || 4, bullet.height || 10);
            ctx.restore();
        });
    }

    _createProjectileFromWeapon(position, direction) {
        return ProjectileFactory.create(this, position, direction);
    }
}