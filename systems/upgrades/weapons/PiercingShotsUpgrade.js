import { BaseUpgrade } from '../base/BaseUpgrade.js';
import { Bullet } from '../../../entities/Bullet.js';

export class PiercingShotsUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'piercing_shots',
            name: 'Piercing Shots',
            description: 'Bullets pierce through enemies, hitting multiple targets',
            rarity: 'uncommon',
            category: 'weapon',
            tags: ['weapon', 'projectile', 'piercing', 'multi-target'],
            ...config
        });

        this.pierceCount = config.pierceCount || 3;
        this.pierceDamageReduction = config.pierceDamageReduction || 0.8; // Damage multiplier after each pierce
        this.pierceRange = config.pierceRange || 1.2; // Range multiplier
        this.armorPiercing = config.armorPiercing || 0.5; // Reduces enemy damage resistance
    }

    apply(player, values = {}) {
        // Add piercing shots capability to player
        if (!player.weaponModifiers) player.weaponModifiers = {};

        player.weaponModifiers.piercingShots = {
            enabled: true,
            pierceCount: this.pierceCount,
            pierceDamageReduction: this.pierceDamageReduction,
            pierceRange: this.pierceRange,
            armorPiercing: values.armorPiercing || this.armorPiercing
        };

        // Override bullet creation to use piercing bullets
        const originalShoot = player.shoot.bind(player);
        player.shoot = (vx = 0, vy = -10) => {
            if (player.weaponModifiers.piercingShots?.enabled) {
                this.firePiercingBullet(player, vx, vy);
            } else {
                originalShoot(vx, vy);
            }
        };
    }

    firePiercingBullet(player, vx, vy) {
        const bullet = new PiercingBullet(
            player.x,
            player.y - 20,
            vx,
            vy,
            '#00ff88',
            player.damage || 1,
            player.weaponModifiers.piercingShots
        );

        if (!player.piercingBullets) player.piercingBullets = [];
        player.piercingBullets.push(bullet);
    }

    getValues(rarity) {
        const baseValues = {
            armorPiercing: 0.5
        };

        const multipliers = {
            common: 1,
            uncommon: 1.2,
            rare: 1.5,
            legendary: 2
        };

        const values = {};
        Object.keys(baseValues).forEach(key => {
            values[key] = baseValues[key] * (multipliers[rarity] || 1);
        });

        return values;
    }
}

export class PiercingBullet extends Bullet {
    constructor(x, y, vx, vy, color, damage, config) {
        super(x, y, vx, vy, color, damage);
        this.config = config;
        this.piercedEnemies = new Set();
        this.currentDamage = damage;
        this.originalColor = color;
        this.alive = true;
    }

    update(deltaTime, enemies) {
        // Normal bullet movement
        this.x += this.vx;
        this.y += this.vy;

        // Check collision with enemies
        for (let enemy of enemies) {
            if (this.piercedEnemies.has(enemy)) continue; // Already hit this enemy

            if (this.intersects(enemy)) {
                // Apply armor piercing
                const effectiveDamage = this.currentDamage * (1 + this.config.armorPiercing);

                if (enemy.takeDamage(effectiveDamage)) {
                    // Enemy died, still counts as pierce
                    this.piercedEnemies.add(enemy);
                    this.onPierce();
                } else {
                    // Enemy survived, definitely pierced
                    this.piercedEnemies.add(enemy);
                    this.onPierce();
                }

                // Check if we've reached pierce limit
                if (this.piercedEnemies.size >= this.config.pierceCount) {
                    this.alive = false;
                    return;
                }
            }
        }

        // Check boundaries
        if (this.x < -10 || this.x > 810 || this.y < -10 || this.y > 610) {
            this.alive = false;
        }
    }

    onPierce() {
        // Reduce damage for next enemy
        this.currentDamage *= this.config.pierceDamageReduction;

        // Change color to indicate reduced damage
        const alpha = Math.max(0.3, 1 - (this.piercedEnemies.size / this.config.pierceCount) * 0.7);
        this.color = this.adjustColorAlpha(this.originalColor, alpha);

        // Add visual effect for piercing
        this.createPierceEffect();
    }

    createPierceEffect() {
        // This could be expanded to create particle effects, sounds, etc.
        // For now, we'll just make the bullet glow brighter briefly
        this.glowIntensity = 1.5;
        setTimeout(() => {
            this.glowIntensity = 1;
        }, 100);
    }

    adjustColorAlpha(color, alpha) {
        // Convert hex color to RGBA with given alpha
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();

        // Enhanced visual for piercing bullet
        const glowIntensity = this.glowIntensity || 1;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15 * glowIntensity;
        ctx.shadowColor = this.color;

        // Draw bullet with trail effect
        const trailLength = 8;
        const alpha = parseFloat(this.color.match(/[\\d.]+/g)[3] || 1);

        for (let i = 0; i < trailLength; i++) {
            const trailAlpha = alpha * (1 - i / trailLength) * 0.5;
            const trailX = this.x - this.vx * (i / 2);
            const trailY = this.y - this.vy * (i / 2);

            ctx.globalAlpha = trailAlpha;
            ctx.fillRect(trailX - 2, trailY - 5, 4, 10);
        }

        // Main bullet
        ctx.globalAlpha = alpha;
        ctx.fillRect(this.x - 2, this.y - 5, 4, 10);

        // Core highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(this.x - 1, this.y - 3, 2, 6);

        ctx.restore();
    }
}