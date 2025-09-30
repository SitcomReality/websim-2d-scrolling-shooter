import ChargeComponent from './ChargeComponent.js';

export class WeaponComponent {
    constructor(weaponFactory, weaponType = 'single', config = {}) {
        this.weaponFactory = weaponFactory;
        
        // Create initial weapon - handle cases where factory might not have createWeapon method
        if (weaponFactory && typeof weaponFactory.createWeapon === 'function') {
            this.currentWeapon = weaponFactory.createWeapon(weaponType, config);
        } else if (weaponFactory && typeof weaponFactory === 'function') {
            // Handle direct WeaponFactory class
            this.currentWeapon = weaponFactory.createWeapon(weaponType, config);
        } else {
            // Fallback - create a basic weapon
            this.currentWeapon = this.createFallbackWeapon(weaponType, config);
        }
        
        this.weaponType = weaponType;

        // Charge component handles storing shots while the fire key is held
        this.chargeComponent = new ChargeComponent({
            maxChargeTime: config.maxChargeTime || 5000,
            maxStoredShots: config.maxStoredShots || 20,
            chargeRate: config.chargeRate || 1
        });

        // Exposed charging state for UI / Player render
        // No duplicated state here — ChargeComponent is authoritative.
        this.chargedBullets = 0;
        this.maxChargeTime = this.chargeComponent.base.maxChargeTime || (config.maxChargeTime || 5000);
    }

    createFallbackWeapon(weaponType, config = {}) {
        // Basic fallback weapon creation
        const weaponConfigs = {
            single: { name: 'Single Shot', damage: 1, fireRate: 150, projectileSpeed: 10, projectileColor: '#00ffff' },
            burst: { name: 'Burst Fire', damage: 1, fireRate: 400, projectileSpeed: 10, projectileColor: '#ff9900', burstCount: 3, burstDelay: 50 },
            spread: { name: 'Spread Shot', damage: 0.8, fireRate: 200, projectileSpeed: 10, projectileColor: '#00ff00', spreadCount: 5, spreadAngle: Math.PI / 6 },
            rapid: { name: 'Rapid Fire', damage: 0.6, fireRate: 60, projectileSpeed: 12, projectileColor: '#ffff00' },
            homing: { name: 'Homing Missile', damage: 2, fireRate: 300, projectileSpeed: 8, projectileColor: '#ff00ff', turnSpeed: 0.05 }
        };

        const weaponConfig = weaponConfigs[weaponType] || weaponConfigs.single;
        return {
            ...weaponConfig,
            ...config,
            lastFireTime: 0,
            bullets: [],
            update: function(deltaTime) {
                this.bullets.forEach(bullet => {
                    bullet.x += bullet.vx;
                    bullet.y += bullet.vy;
                    if (bullet.x < -10 || bullet.x > 810 || bullet.y < -10 || bullet.y > 610) {
                        bullet.alive = false;
                    }
                });
                this.bullets = this.bullets.filter(bullet => bullet.alive);
            },
            fire: function(position, targetDirection = { x: 0, y: -1 }) {
                const currentTime = Date.now();
                if (currentTime - this.lastFireTime >= this.fireRate) {
                    this.bullets.push({
                        x: position.x,
                        y: position.y,
                        vx: targetDirection.x * this.projectileSpeed,
                        vy: targetDirection.y * this.projectileSpeed,
                        damage: this.damage,
                        color: this.projectileColor,
                        alive: true,
                        width: 4,
                        height: 10
                    });
                    this.lastFireTime = currentTime;
                }
            },
            getBullets: function() { return this.bullets; },
            clearBullets: function() { this.bullets = []; },
            increaseDamage: function(amount) { this.damage += amount; },
            setFireRateMultiplier: function(multiplier) { this.fireRate = this.fireRate * multiplier; }
        };
    }

    update(deltaTime, inputState, position) {
        // Delegate charging controls to ChargeComponent entirely.
        if (inputState.shoot) {
            // start charging if not already
            if (!this.chargeComponent.isCharging()) {
                this.chargeComponent.startCharging();
            }
        } else {
            // on release, stopCharging returns release data when shots are released
            if (this.chargeComponent.isCharging()) {
                const release = this.chargeComponent.stopCharging();
                if (release && this.currentWeapon) {
                    const count = release.count;
                    for (let i = 0; i < count; i++) {
                        const angle = (Math.random() * Math.PI) - (Math.PI / 2);
                        const dir = { x: Math.sin(angle), y: -Math.cos(angle) };
                        const len = Math.hypot(dir.x, dir.y) || 1;
                        dir.x /= len; dir.y /= len;
                        const proj = this._createProjectileFromWeapon(position, dir);
                        proj.vx += (Math.random() - 0.5) * 1.5;
                        proj.vy += (Math.random() - 0.5) * 1.5;
                        if (!this.currentWeapon.bullets) this.currentWeapon.bullets = [];
                        this.currentWeapon.bullets.push(proj);
                    }
                }
            } else {
                // not charging: normal auto-fire
                if (this.currentWeapon) {
                    this.currentWeapon.fire(position);
                }
            }
        }

        // process auto-release (e.g. max charge timeout) from ChargeComponent
        const autoRelease = this.chargeComponent.update();
        if (autoRelease && this.currentWeapon) {
            const count = autoRelease.count;
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() * Math.PI) - (Math.PI / 2);
                const dir = { x: Math.sin(angle), y: -Math.cos(angle) };
                const len = Math.hypot(dir.x, dir.y) || 1;
                dir.x /= len; dir.y /= len;
                const proj = this._createProjectileFromWeapon(position, dir);
                proj.vx += (Math.random() - 0.5) * 1.5;
                proj.vy += (Math.random() - 0.5) * 1.5;
                if (!this.currentWeapon.bullets) this.currentWeapon.bullets = [];
                this.currentWeapon.bullets.push(proj);
            }
            // if still holding shoot, restart charging automatically
            if (inputState.shoot) {
                this.chargeComponent.startCharging();
            }
        }

        // Update exposed charged bullets count for UI feedback
        this.chargedBullets = this.chargeComponent.getStoredShots();

         if (this.currentWeapon) {
             this.currentWeapon.update(deltaTime);
         }
    }

    switchWeapon(weaponType, config = {}) {
        if (this.currentWeapon) {
            // Preserve some stats from current weapon
            const currentDamage = this.currentWeapon.damage;
            const currentFireRate = this.currentWeapon.fireRate;
            
            if (this.weaponFactory && typeof this.weaponFactory.createWeapon === 'function') {
                this.currentWeapon = this.weaponFactory.createWeapon(weaponType, {
                    damage: currentDamage,
                    fireRate: currentFireRate,
                    ...config
                });
            } else {
                this.currentWeapon = this.createFallbackWeapon(weaponType, {
                    damage: currentDamage,
                    fireRate: currentFireRate,
                    ...config
                });
            }
            
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

    setChain(count, range = 100, damageReduction = 0.7) {
        if (this.currentWeapon && typeof this.currentWeapon.setChain === 'function') {
            this.currentWeapon.setChain(count, range, damageReduction);
        } else if (this.currentWeapon) {
            // provide best-effort support for fallback weapon objects
            this.currentWeapon.chain = count;
            this.currentWeapon.chainRange = range;
            this.currentWeapon.chainDamageReduction = damageReduction;
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

    render(ctx) {
        if (this.currentWeapon && typeof this.currentWeapon.render === 'function') {
            // Use weapon's own render if available (e.g. BaseWeapon subclasses)
            this.currentWeapon.render(ctx);
            return;
        }

        // Fallback: draw plain bullet objects
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

    // Helper: create a projectile that works for weapon instances or fallback weapon objects
    _createProjectileFromWeapon(position, direction) {
        // If weapon exposes createProjectile (BaseWeapon subclasses), use it
        if (this.currentWeapon && typeof this.currentWeapon.createProjectile === 'function') {
            return this.currentWeapon.createProjectile(position, direction);
        }

        // Fallback: synthesize a projectile object using common properties
        const speed = (this.currentWeapon && this.currentWeapon.projectileSpeed) || 10;
        const damage = (this.currentWeapon && this.currentWeapon.damage) || 1;
        const color = (this.currentWeapon && this.currentWeapon.projectileColor) || '#00ffff';

        return {
            x: position.x,
            y: position.y,
            vx: direction.x * speed,
            vy: direction.y * speed,
            damage: damage,
            color: color,
            alive: true,
            width: (this.currentWeapon && this.currentWeapon.bulletWidth) || 4,
            height: (this.currentWeapon && this.currentWeapon.bulletHeight) || 10,
            piercing: (this.currentWeapon && this.currentWeapon.piercing) || 0,
            chain: (this.currentWeapon && this.currentWeapon.chain) || 0,
            chainRange: (this.currentWeapon && this.currentWeapon.chainRange) || 100,
            chainDamageReduction: (this.currentWeapon && this.currentWeapon.chainDamageReduction) || 0.7,
            penetration: (this.currentWeapon && this.currentWeapon.penetration) || 0,
            ricochet: (this.currentWeapon && this.currentWeapon.ricochet) || 0,
            hitTargets: [],
            remainingChains: (this.currentWeapon && this.currentWeapon.chain) || 0,
            remainingRicochets: (this.currentWeapon && this.currentWeapon.ricochet) || 0
        };
    }
}