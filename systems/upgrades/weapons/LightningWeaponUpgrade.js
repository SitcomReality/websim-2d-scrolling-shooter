import { BaseUpgrade } from '../base/BaseUpgrade.js';

export class LightningWeaponUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'lightning_weapon',
            name: 'Chain Lightning',
            description: 'Fires lightning that chains between enemies',
            rarity: 'rare',
            category: 'weapon',
            tags: ['weapon', 'lightning', 'chain', 'electric', 'aoe'],
            ...config
        });

        this.chainDamage = config.chainDamage || 2;
        this.chainRange = config.chainRange || 100;
        this.maxChains = config.maxChains || 3;
        this.chainDelay = config.chainDelay || 100; // milliseconds between chains
    }

    apply(player, values = {}) {
        // Add lightning weapon capability to player
        if (!player.weaponModifiers) player.weaponModifiers = {};

        player.weaponModifiers.lightningWeapon = {
            enabled: true,
            chainDamage: values.chainDamage || this.chainDamage,
            chainRange: this.chainRange,
            maxChains: this.maxChains,
            chainDelay: this.chainDelay
        };

        // Override shoot method to use lightning
        const originalShoot = player.shoot.bind(player);
        player.shoot = (vx = 0, vy = -10) => {
            if (player.weaponModifiers.lightningWeapon?.enabled) {
                this.fireLightning(player);
            } else {
                originalShoot(vx, vy);
            }
        };
    }

    fireLightning(player) {
        const enemies = window.gameInstance?.enemySpawner?.getEnemies() || [];
        if (enemies.length === 0) return;

        // Find nearest enemy to player
        let target = this.findNearestEnemy(player, enemies);
        if (!target) return;

        const lightning = new LightningChain(
            player.x,
            player.y - 20,
            target,
            player.weaponModifiers.lightningWeapon
        );

        if (!player.lightningBolts) player.lightningBolts = [];
        player.lightningBolts.push(lightning);
    }

    findNearestEnemy(player, enemies) {
        let nearest = null;
        let minDistance = Infinity;

        enemies.forEach(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance && distance <= 300) { // Max firing range
                minDistance = distance;
                nearest = enemy;
            }
        });

        return nearest;
    }

    getValues(rarity) {
        const baseValues = {
            chainDamage: 2
        };

        const multipliers = {
            common: 1,
            uncommon: 1.2,
            rare: 1.5,
            legendary: 2
        };

        const values = {};
        Object.keys(baseValues).forEach(key => {
            values[key] = Math.round(baseValues[key] * (multipliers[rarity] || 1));
        });

        return values;
    }
}

export class LightningChain {
    constructor(startX, startY, target, config) {
        this.startX = startX;
        this.startY = startY;
        this.chains = [];
        this.config = config;
        this.alive = true;
        this.currentTime = 0;
        this.duration = config.maxChains * config.chainDelay + 200; // Extra time for final chain

        // Start the chain reaction
        this.addChain(target, 0, 0);
    }

    addChain(target, chainIndex, delay) {
        setTimeout(() => {
            if (!target || !target.alive) return;

            const chain = {
                startX: chainIndex === 0 ? this.startX : this.chains[chainIndex - 1].target.x,
                startY: chainIndex === 0 ? this.startY : this.chains[chainIndex - 1].target.y,
                target: target,
                chainIndex: chainIndex,
                segments: this.generateLightningSegments(
                    chainIndex === 0 ? this.startX : this.chains[chainIndex - 1].target.x,
                    chainIndex === 0 ? this.startY : this.chains[chainIndex - 1].target.y,
                    target.x,
                    target.y
                ),
                damage: Math.max(1, this.config.chainDamage - chainIndex), // Damage decreases with each chain
                hit: false
            };

            // Apply damage to target
            if (target.takeDamage) {
                target.takeDamage(chain.damage);
                chain.hit = true;
            }

            this.chains.push(chain);

            // Find next target for chaining
            if (chainIndex < this.config.maxChains - 1) {
                const nextTarget = this.findNextChainTarget(target, chainIndex);
                if (nextTarget) {
                    this.addChain(nextTarget, chainIndex + 1, this.config.chainDelay);
                }
            }
        }, delay);
    }

    generateLightningSegments(startX, startY, endX, endY) {
        const segments = [];
        const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const numSegments = Math.max(3, Math.floor(distance / 20));

        let currentX = startX;
        let currentY = startY;

        for (let i = 0; i < numSegments; i++) {
            const progress = (i + 1) / numSegments;
            const targetX = startX + (endX - startX) * progress;
            const targetY = startY + (endY - startY) * progress;

            // Add random jitter to make it look like lightning
            const jitter = 15;
            const nextX = targetX + (Math.random() - 0.5) * jitter;
            const nextY = targetY + (Math.random() - 0.5) * jitter;

            segments.push({
                x1: currentX,
                y1: currentY,
                x2: nextX,
                y2: nextY
            });

            currentX = nextX;
            currentY = nextY;
        }

        return segments;
    }

    findNextChainTarget(previousTarget, chainIndex) {
        const enemies = window.gameInstance?.enemySpawner?.getEnemies() || [];
        let bestTarget = null;
        let bestScore = -1;

        enemies.forEach(enemy => {
            if (enemy === previousTarget) return;
            if (this.chains.some(chain => chain.target === enemy)) return; // Don't hit same enemy twice

            const dx = enemy.x - previousTarget.x;
            const dy = enemy.y - previousTarget.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.config.chainRange) {
                const score = 1 / (distance + 1); // Prefer closer targets
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = enemy;
                }
            }
        });

        return bestTarget;
    }

    update(deltaTime) {
        this.currentTime += deltaTime;
        if (this.currentTime >= this.duration) {
            this.alive = false;
        }
    }

    render(ctx) {
        this.chains.forEach(chain => {
            if (!chain.hit) return;

            ctx.save();

            // Draw lightning segments
            chain.segments.forEach((segment, index) => {
                const alpha = 1 - (chain.chainIndex * 0.2); // Fade with each chain
                const width = 3 - chain.chainIndex; // Thinner with each chain

                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                ctx.lineWidth = Math.max(1, width);
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ffff';

                ctx.beginPath();
                ctx.moveTo(segment.x1, segment.y1);
                ctx.lineTo(segment.x2, segment.y2);
                ctx.stroke();

                // Add glow effect
                if (index === 0) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                    ctx.lineWidth = Math.max(1, width - 1);
                    ctx.beginPath();
                    ctx.moveTo(segment.x1, segment.y1);
                    ctx.lineTo(segment.x2, segment.y2);
                    ctx.stroke();
                }
            });

            // Draw impact effect
            if (chain.hit) {
                const time = this.currentTime - (chain.chainIndex * this.config.chainDelay);
                if (time < 100) {
                    const progress = time / 100;
                    const radius = 10 + progress * 20;
                    const alpha = 1 - progress;

                    ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(chain.target.x, chain.target.y, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            ctx.restore();
        });
    }
}