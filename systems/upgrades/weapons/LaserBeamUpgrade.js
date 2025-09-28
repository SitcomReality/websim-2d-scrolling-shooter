import { BaseUpgrade } from '../base/BaseUpgrade.js';

export class LaserBeamUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'laser_beam',
            name: 'Laser Beam',
            description: 'Fires a continuous laser beam that melts enemies',
            rarity: 'rare',
            category: 'weapon',
            tags: ['weapon', 'laser', 'beam', 'continuous', 'piercing'],
            ...config
        });

        this.beamDamage = config.beamDamage || 0.5; // per frame
        this.beamDuration = config.beamDuration || 1000; // milliseconds
        this.beamWidth = config.beamWidth || 6;
        this.beamRange = config.beamRange || 400;
        this.burnDamage = config.burnDamage || 1; // damage over time
        this.burnDuration = config.burnDuration || 2000; // milliseconds
    }

    apply(player, values = {}) {
        // Add laser beam capability to player
        if (!player.weaponModifiers) player.weaponModifiers = {};

        player.weaponModifiers.laserBeam = {
            enabled: true,
            beamDamage: values.beamDamage || this.beamDamage,
            beamDuration: this.beamDuration,
            beamWidth: this.beamWidth,
            beamRange: this.beamRange,
            burnDamage: values.burnDamage || this.burnDamage,
            burnDuration: this.burnDuration,
            isFiring: false,
            currentBeam: null
        };

        // Override shoot method to use laser beam
        const originalShoot = player.shoot.bind(player);
        player.shoot = (vx = 0, vy = -10) => {
            if (player.weaponModifiers.laserBeam?.enabled) {
                this.fireLaserBeam(player);
            } else {
                originalShoot(vx, vy);
            }
        };
    }

    fireLaserBeam(player) {
        const laserMod = player.weaponModifiers.laserBeam;

        if (laserMod.isFiring) return; // Already firing

        laserMod.isFiring = true;

        // Create laser beam
        const beam = new LaserBeam(
            player.x,
            player.y - 20,
            laserMod
        );

        if (!player.laserBeams) player.laserBeams = [];
        player.laserBeams.push(beam);
        laserMod.currentBeam = beam;

        // Stop firing after duration
        setTimeout(() => {
            laserMod.isFiring = false;
            if (laserMod.currentBeam) {
                laserMod.currentBeam.alive = false;
                laserMod.currentBeam = null;
            }
        }, laserMod.beamDuration);
    }

    getValues(rarity) {
        const baseValues = {
            beamDamage: 0.5,
            burnDamage: 1
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

export class LaserBeam {
    constructor(startX, startY, config) {
        this.startX = startX;
        this.startY = startY;
        this.config = config;
        this.alive = true;
        this.currentTime = 0;
        this.hitEnemies = new Set(); // Track enemies already hit
        this.burningEnemies = new Map(); // Track burning enemies
    }

    update(deltaTime, enemies) {
        this.currentTime += deltaTime;

        // Check for collisions with enemies
        enemies.forEach(enemy => {
            if (this.hitEnemies.has(enemy)) return; // Already hit this enemy

            if (this.intersects(enemy)) {
                // Apply immediate damage
                enemy.takeDamage(this.config.beamDamage);
                this.hitEnemies.add(enemy);

                // Apply burn effect
                if (!this.burningEnemies.has(enemy)) {
                    this.burningEnemies.set(enemy, {
                        startTime: this.currentTime,
                        damage: this.config.burnDamage,
                        interval: 500 // Apply burn damage every 500ms
                    });
                }
            }
        });

        // Update burn effects
        this.burningEnemies.forEach((burnData, enemy) => {
            if (!enemy.alive) {
                this.burningEnemies.delete(enemy);
                return;
            }

            const burnTime = this.currentTime - burnData.startTime;
            if (burnTime < this.config.burnDuration) {
                // Apply burn damage at intervals
                const intervals = Math.floor(burnTime / burnData.interval);
                const lastInterval = Math.floor((burnTime - deltaTime) / burnData.interval);

                if (intervals > lastInterval) {
                    enemy.takeDamage(burnData.damage);
                }
            } else {
                // Burn duration ended
                this.burningEnemies.delete(enemy);
            }
        });
    }

    intersects(enemy) {
        // Simple line-circle collision for laser beam
        const beamEndX = this.startX;
        const beamEndY = this.startY - this.config.beamRange;

        const dx = enemy.x - this.startX;
        const dy = enemy.y - beamEndY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if enemy is within beam width
        return distance < (this.config.beamWidth / 2 + enemy.width / 2) &&
               enemy.y < this.startY && enemy.y > beamEndY;
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();

        // Draw laser beam
        const gradient = ctx.createLinearGradient(
            this.startX, this.startY,
            this.startX, this.startY - this.config.beamRange
        );
        gradient.addColorStop(0, 'rgba(255, 0, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0.7)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.config.beamWidth;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';

        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.startX, this.startY - this.config.beamRange);
        ctx.stroke();

        // Add glow effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = this.config.beamWidth * 0.5;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.startX, this.startY - this.config.beamRange);
        ctx.stroke();

        // Draw burning effect on enemies
        this.burningEnemies.forEach((burnData, enemy) => {
            const burnTime = this.currentTime - burnData.startTime;
            const burnProgress = burnTime / this.config.burnDuration;
            const alpha = 1 - burnProgress;

            // Fire effect around enemy
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.width * (1 + burnProgress * 0.5), 0, Math.PI * 2);
            ctx.fill();

            // Small particles
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = enemy.width * (0.5 + Math.random() * 0.5);
                const x = enemy.x + Math.cos(angle) * distance;
                const y = enemy.y + Math.sin(angle) * distance;

                ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }
}