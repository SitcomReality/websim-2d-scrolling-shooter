export default function FallbackWeapon(weaponType, config = {}) {
    const weaponConfigs = {
        single: { name: 'Single Shot', damage: 1, fireRate: 150, projectileSpeed: 10, projectileColor: '#00ffff' },
        burst: { name: 'Burst Fire', damage: 1, fireRate: 400, projectileSpeed: 10, projectileColor: '#ff9900', burstCount: 3, burstDelay: 50 },
        spread: { name: 'Spread Shot', damage: 0.8, fireRate: 200, projectileSpeed: 10, projectileColor: '#00ff00', spreadCount: 5, spreadAngle: Math.PI / 6 },
        rapid: { name: 'Rapid Fire', damage: 0.6, fireRate: 60, projectileSpeed: 12, projectileColor: '#ffff00' },
        homing: { name: 'Homing Missile', damage: 2, fireRate: 300, projectileSpeed: 8, projectileColor: '#ff00ff', turnSpeed: 0.05 }
    };

    const weaponConfig = weaponConfigs[weaponType] || weaponConfigs.single;
    const cfg = { ...weaponConfig, ...config };
    return {
        ...cfg,
        lastFireTime: 0,
        bullets: [],
        update: function(deltaTime) {
            this.bullets.forEach(bullet => {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                if (bullet.x < -10 || bullet.x > 810 || bullet.y < -10 || bullet.y > 610) bullet.alive = false;
            });
            this.bullets = this.bullets.filter(b => b.alive);
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