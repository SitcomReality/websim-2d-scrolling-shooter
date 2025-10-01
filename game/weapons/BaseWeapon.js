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
        // Base single projectile; if owner's statSystem provides multishot, emit extra projectiles.
        const primary = this.createProjectile(position, targetDirection);
        const projectiles = [primary];

        const player = this.owner;
        const statSystem = player && player.statSystem ? player.statSystem : null;
        if (statSystem) {
            const msCount = Math.max(0, Math.round(statSystem.getStatValue('multishot_count') || 0));
            const msPenalty = typeof statSystem.getStatValue('multishot_damage_penalty') === 'number' ? statSystem.getStatValue('multishot_damage_penalty') : -0.25;
            // create extra projectiles offset horizontally
            for (let i = 0; i < msCount; i++) {
                const offset = (i + 1) * 6; // horizontal spacing
                // left and right for each count
                const leftDir = { x: targetDirection.x, y: targetDirection.y };
                const rightDir = { x: targetDirection.x, y: targetDirection.y };
                const leftProj = this.createProjectile({ x: position.x - offset, y: position.y }, leftDir, primary.damage * (1 + msPenalty), primary.color);
                const rightProj = this.createProjectile({ x: position.x + offset, y: position.y }, rightDir, primary.damage * (1 + msPenalty), primary.color);
                projectiles.push(leftProj, rightProj);
            }
        }

        return projectiles;
    }

    createProjectile(position, direction, damage = null, color = null) {
        const vx = direction.x * this.projectileSpeed;
        const vy = direction.y * this.projectileSpeed;

        let finalDamage = damage || this.damage;
        let finalColor = color || this.projectileColor;
        
        // Use owner's statSystem only (no legacy/global fallbacks)
        const player = this.owner;
        const statSystem = player.statSystem;
        if (!statSystem) throw new Error('BaseWeapon.createProjectile: owner.statSystem is required');

        const critChance = statSystem.getStatValue('criticalChance');
        const critDamage = statSystem.getStatValue('criticalDamage');
        const baseDamage = statSystem.getStatValue('damage');

        if (Math.random() < critChance) {
            finalDamage = (baseDamage !== undefined ? baseDamage : finalDamage) * (1 + critDamage);
            finalColor = '#ffff00';
        } else {
            finalDamage = (baseDamage !== undefined ? baseDamage : finalDamage);
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
        // Use owner.statSystem exclusively; throw if missing to surface integration issues
        const player = this.owner;
        if (!player || !player.statSystem) throw new Error('BaseWeapon._resolveCritical: owner.statSystem is required');

        const statSystem = player.statSystem;
        const critChance = statSystem.getStatValue('criticalChance');
        const critDamage = statSystem.getStatValue('criticalDamage');
        const baseDamage = statSystem.getStatValue('damage');

        if (Math.random() < critChance) {
            projectile.damage = (baseDamage !== undefined ? baseDamage : projectile.damage) * (1 + critDamage);
            projectile.color = '#ffff00';
            projectile.isCritical = true;
        } else {
            projectile.damage = (baseDamage !== undefined ? baseDamage : projectile.damage);
            projectile.isCritical = false;
        }
    }

    // Charged-release default: fire the weapon's normal projectile pattern `count` times with a short stagger so charge feels like a barrage.
    fireChargedRelease(count = 1, position = { x: 0, y: 0 }) {
        const staggerMs = 40; // small delay between each volley for satisfying rhythm
        for (let i = 0; i < count; i++) {
            // schedule each volley; use closure to capture i
            setTimeout(() => {
                try {
                    const projectiles = this.createProjectiles ? this.createProjectiles(position, { x: 0, y: -1 }) : [this.createProjectile(position, { x: 0, y: -1 })];
                    projectiles.forEach(p => {
                        // ensure critical resolution consistent with weapon rules
                        try { this._resolveCritical(p); } catch (e) { /* allow resolution issues to surface during dev if statSystem missing */ }
                        if (!this.bullets) this.bullets = [];
                        this.bullets.push(p);
                    });
                } catch (e) {
                    // ensure errors don't break game loop; log for debugging
                    console.warn('fireChargedRelease failed', e);
                }
            }, i * staggerMs);
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