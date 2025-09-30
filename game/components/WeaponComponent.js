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
}