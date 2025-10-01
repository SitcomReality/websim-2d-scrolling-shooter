import { DamageTextSystem } from './DamageTextSystem.js';

export class CollisionSystem {
    constructor() {
        this.scoreGained = 0;
        this.damageTaken = 0;
        this.damageTextSystem = new DamageTextSystem();

        // Tuning for drops (Phase 2)
        this.dropConfig = {
            dropChance: 0.5, // base chance an enemy drops currency
            shardByType: { basic: [1,3], fast: [2,5], zigzag: [2,6], tank: [4,10] }
        };
    }
    
    // Helper: bullets are plain objects so provide bounding-box collision check
    bulletIntersectsEntity(bullet, entity) {
        const bLeft = bullet.x - (bullet.width || 2) / 2;
        const bRight = bullet.x + (bullet.width || 2) / 2;
        const bTop = bullet.y - (bullet.height || 8) / 2;
        const bBottom = bullet.y + (bullet.height || 8) / 2;

        const e = entity.getBounds();
        return bLeft < e.right && bRight > e.left && bTop < e.bottom && bBottom > e.top;
    }
    
    checkCollisions(player, enemies, playerBullets, particleSystem, powerUpSystem) {
        this.scoreGained = 0;
        this.damageTaken = 0;
        
        // Player bullets vs enemies
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const bullet = playerBullets[i];
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (this.bulletIntersectsEntity(bullet, enemy)) {
                    const damage = bullet.damage || 1;
                    
                    // Handle piercing
                    if (bullet.piercing > 0) {
                        if (!bullet.hitTargets) bullet.hitTargets = [];
                        if (bullet.hitTargets.includes(enemy)) continue;
                        bullet.hitTargets.push(enemy);
                        bullet.piercing--;
                    } else {
                        bullet.alive = false;
                    }

                    // Apply lifesteal: heal a fraction of damage dealt (reads from StatSystem or fallbacks)
                    try {
                        const lifesteal = (player && player.statSystem && typeof player.statSystem.getStatValue === 'function')
                            ? (player.statSystem.getStatValue('lifesteal') || 0)
                            : (player.lifesteal || 0);
                        if (lifesteal > 0 && player) {
                            const healAmount = damage * lifesteal;
                            if (typeof player.heal === 'function') {
                                player.heal(healAmount);
                            } else if (player.health !== undefined) {
                                const maxH = (player.maxHealth !== undefined) ? player.maxHealth : (window.gameInstance?.gameState?.maxHealth || 100);
                                player.health = Math.min(maxH, (player.health || 0) + healAmount);
                                if (window.gameInstance && window.gameInstance.gameState) window.gameInstance.gameState.health = player.health;
                            }
                        }
                    } catch (e) {
                        // fail silently to avoid breaking collision loop
                    }
                    
                    if (enemy.takeDamage(damage)) {
                        enemies.splice(j, 1);
                        this.scoreGained += enemy.points;
                        this.gameState.xp += enemy.points;
                        particleSystem.createExplosion(enemy.x, enemy.y);
                        
                        const xpAmount = enemy.points;
                        this.damageTextSystem.addXP(enemy.x, enemy.y + 20, xpAmount);
                        
                        const dropChance = player.healthPickupChance || 0.02;
                        if (Math.random() < dropChance) {
                            powerUpSystem.spawnHealthPickup(enemy.x, enemy.y);
                        }

                        // NEW: roll currency drop and spawn CurrencyPickup via PowerUpSystem
                        try {
                            const cfg = this.dropConfig;
                            if (Math.random() < cfg.dropChance) {
                                const range = cfg.shardByType[enemy.type] || [1,3];
                                const min = range[0], max = range[1];
                                const shardAmount = Math.round(min + Math.random() * (max - min));
                                powerUpSystem.spawnCurrencyPickup(enemy.x, enemy.y, shardAmount);
                            }
                        } catch (e) {
                            // ignore spawn errors
                        }
                    }
                    
                    // pass through whether the bullet was a critical hit (if available)
                    const wasCrit = !!(bullet && bullet.isCritical);
                    this.damageTextSystem.addDamage(enemy.x, enemy.y, damage, 'physical', wasCrit);
                    
                    // Handle chaining
                    if (bullet.chain > 0 && bullet.remainingChains > 0) {
                        this.handleChaining(bullet, enemy, enemies, playerBullets, particleSystem, player);
                    }
                    
                    if (bullet.piercing <= 0 && bullet.chain <= 0) break;
                }
            }
        }
        
        // Player vs enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (player.intersects(enemy) && !player.invulnerable) {
                const damage = 20;
                this.damageTaken += damage;
                enemies.splice(i, 1);
                particleSystem.createExplosion(enemy.x, enemy.y);
                this.damageTextSystem.addDamage(player.x, player.y, damage, 'physical');
            }
        }
        
        // Player vs enemy bullets
        enemies.forEach(enemy => {
            const enemyBullets = enemy.getBullets();
            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                const bullet = enemyBullets[i];
                if (this.bulletIntersectsEntity(bullet, player) && !player.invulnerable) {
                    bullet.alive = false;
                    enemyBullets.splice(i, 1);
                    const damage = 10;
                    this.damageTaken += damage;
                    particleSystem.createExplosion(bullet.x, bullet.y);
                    this.damageTextSystem.addDamage(player.x, player.y, damage, 'physical');
                }
            }
        });
    }
    
    handleChaining(bullet, hitEnemy, enemies, playerBullets, particleSystem, player) {
        bullet.remainingChains--;
        
        const nearbyEnemies = enemies.filter(enemy => {
            if (enemy === hitEnemy || (bullet.hitTargets && bullet.hitTargets.includes(enemy))) {
                return false;
            }
            
            const dx = enemy.x - hitEnemy.x;
            const dy = enemy.y - hitEnemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance <= bullet.chainRange;
        });
        
        if (nearbyEnemies.length > 0) {
            const target = nearbyEnemies[0];
            const chainDamage = bullet.damage * bullet.chainDamageReduction;
            
            if (target.takeDamage(chainDamage)) {
                const enemyIndex = enemies.indexOf(target);
                if (enemyIndex > -1) {
                    enemies.splice(enemyIndex, 1);
                    this.scoreGained += target.points;
                    if (this.gameState) this.gameState.xp += target.points;
                    if (particleSystem && typeof particleSystem.createExplosion === 'function') {
                        particleSystem.createExplosion(target.x, target.y);
                    }
                    
                    const xpAmount = target.points;
                    this.damageTextSystem.addXP(target.x, target.y + 20, xpAmount);
                }
            }
            
            // chaining damage isn't considered a crit here
            this.damageTextSystem.addDamage(target.x, target.y, chainDamage, 'electric', false);
            
            if (!bullet.hitTargets) bullet.hitTargets = [];
            bullet.hitTargets.push(target);
            
            // Recursive chaining
            if (bullet.remainingChains > 0) {
                this.handleChaining(bullet, target, enemies, playerBullets);
            }
        }
    }
    
    getScoreGained() {
        return this.scoreGained;
    }
    
    getDamageTaken() {
        return this.damageTaken;
    }
    
    getDamageTextSystem() {
        return this.damageTextSystem;
    }
}