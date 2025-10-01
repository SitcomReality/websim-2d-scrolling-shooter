export class BaseWeapon {
    constructor(config = {}) {
        this.name = config.name || 'Base Weapon';
        this.damage = config.damage || 1;
        this.fireRate = config.fireRate || 150;
        this.projectileSpeed = config.projectileSpeed || 10;
        this.projectileColor = config.projectileColor || '#00ffff';
        this.lastFireTime = 0;
        this.bullets = [];
        this.piercing = config.piercing || 0;
        this.chain = config.chain || 0;
        this.chainRange = config.chainRange || 100;
        this.chainDamageReduction = config.chainDamageReduction || 0.7;
        this.penetration = config.penetration || 0;
        this.ricochet = config.ricochet || 0;
    }

    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    fire(position, targetDirection = { x: 0, y: -1 }) {
        const currentTime = Date.now();
        if (!this.canFire(currentTime)) return;

        const projectiles = this.createProjectiles(position, targetDirection);
        // Ensure crit resolution is applied to every produced projectile so all fire paths (including auto-fire)
        // use the owner's statSystem for crit chance/damage determination.
        projectiles.forEach(p => this._resolveCritical(p));
        this.bullets.push(...projectiles);
        this.lastFireTime = currentTime;
    }

    createProjectiles(position, targetDirection) {
        return [this.createProjectile(position, targetDirection)];
    }

    createProjectile(position, direction, damage = null, color = null) {
        const vx = direction.x * this.projectileSpeed;
        const vy = direction.y * this.projectileSpeed;

        let finalDamage = damage || this.damage;
        let finalColor = color || this.projectileColor;
        
        // Prefer owner.statSystem values (single source of truth), fallback to legacy globals
        const player = (this.owner) ? this.owner : (window.gameInstance && window.gameInstance.player ? window.gameInstance.player : null);
        if (player) {
            // Prefer StatSystem values (single source of truth), fallback to statsComponent or legacy props
            const critChance = (player.statSystem && player.statSystem.getStatValue('criticalChance')) ??
                               (player.statsComponent && player.statsComponent.getCriticalChance && player.statsComponent.getCriticalChance()) ??
                               (player.criticalChance || 0.01);
            const critDamage = (player.statSystem && player.statSystem.getStatValue('criticalDamage')) ??
                               (player.statsComponent && player.statsComponent.getCriticalDamage && player.statsComponent.getCriticalDamage()) ??
                               (player.criticalDamage || 0.5);
            const baseDamage = (player.statSystem && player.statSystem.getStatValue('damage')) || (damage || this.damage);

            if (Math.random() < critChance) {
                finalDamage = baseDamage * (1 + critDamage);
                finalColor = '#ffff00';
            } else {
                finalDamage = baseDamage;
            }
        }

        return {
            x: position.x,
            y: position.y,
            vx: vx,
            vy: vy,
            damage: finalDamage,
            color: finalColor,
            alive: true,
            width: 4,
            height: 10,
            isCritical: finalColor === '#ffff00',
            piercing: this.piercing,
            chain: this.chain,
            chainRange: this.chainRange,
            chainDamageReduction: this.chainDamageReduction,
            penetration: this.penetration,
            ricochet: this.ricochet,
            hitTargets: [],
            remainingChains: this.chain,
            remainingRicochets: this.ricochet
        };
    }

    // Centralized crit resolution: uses owner.statSystem (preferred) or fallbacks to set damage/color/isCritical
    _resolveCritical(projectile) {
        try {
            const player = (this.owner) ? this.owner : (window.gameInstance && window.gameInstance.player ? window.gameInstance.player : null);
            if (!player) return;

            const statSystem = player.statSystem || null;
            const critChance = statSystem ? (statSystem.getStatValue('criticalChance') || 0) :
                              (player.statsComponent && player.statsComponent.getCriticalChance ? player.statsComponent.getCriticalChance() : (player.criticalChance || 0));
            const critDamage = statSystem ? (statSystem.getStatValue('criticalDamage') || 0) :
                              (player.statsComponent && player.statsComponent.getCriticalDamage ? player.statsComponent.getCriticalDamage() : (player.criticalDamage || 0));
            const baseDamage = statSystem ? (statSystem.getStatValue('damage') || projectile.damage || this.damage) : (player.damage || projectile.damage || this.damage);

            if (Math.random() < (critChance || 0)) {
                projectile.damage = baseDamage * (1 + (critDamage || 0));
                projectile.color = '#ffff00';
                projectile.isCritical = true;
            } else {
                projectile.damage = baseDamage;
                projectile.isCritical = false;
            }
        } catch (e) {
            // silent fallback
        }
    }

    update(deltaTime) {
        this.bullets.forEach(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            // Handle ricochet
            if (bullet.ricochet > 0 && bullet.remainingRicochets > 0) {
                if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
                    bullet.remainingRicochets--;
                    
                    // Reverse direction based on which edge was hit
                    if (bullet.x < 0 || bullet.x > 800) {
                        bullet.vx = -bullet.vx;
                        bullet.x = bullet.x < 0 ? 0 : 800;
                    }
                    if (bullet.y < 0 || bullet.y > 600) {
                        bullet.vy = -bullet.vy;
                        bullet.y = bullet.y < 0 ? 0 : 600;
                    }
                }
            }

            // Remove bullets that go off screen
            if (bullet.x < -10 || bullet.x > 810 || bullet.y < -10 || bullet.y > 610) {
                bullet.alive = false;
            }
        });

        this.bullets = this.bullets.filter(bullet => bullet.alive);
    }

    render(ctx) {
        this.bullets.forEach(bullet => {
            ctx.save();
            ctx.fillStyle = bullet.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = bullet.color;
            ctx.fillRect(bullet.x - bullet.width/2, bullet.y - bullet.height/2, bullet.width, bullet.height);
            ctx.restore();
        });
    }

    getBullets() {
        return this.bullets;
    }

    clearBullets() {
        this.bullets = [];
    }

    increaseDamage(amount) {
        this.damage += amount;
    }

    setFireRateMultiplier(multiplier) {
        this.fireRate = this.fireRate * multiplier;
    }

    setPiercing(count) {
        this.piercing = count;
    }

    setChain(count, range = 100, damageReduction = 0.7) {
        this.chain = count;
        this.chainRange = range;
        this.chainDamageReduction = damageReduction;
    }

    setPenetration(count) {
        this.penetration = count;
    }

    setRicochet(count) {
        this.ricochet = count;
    }
}