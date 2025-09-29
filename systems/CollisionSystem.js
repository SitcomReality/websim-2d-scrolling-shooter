import { DamageTextSystem } from './DamageTextSystem.js';

export class CollisionSystem {
    constructor() {
        this.scoreGained = 0;
        this.damageTaken = 0;
        this.damageTextSystem = new DamageTextSystem();
    }
    
    checkCollisions(player, enemies, playerBullets, particleSystem, powerUpSystem) {
        this.scoreGained = 0;
        this.damageTaken = 0;
        
        // Player bullets vs enemies
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const bullet = playerBullets[i];
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (bullet.intersects(enemy)) {
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
                    }
                    
                    this.damageTextSystem.addDamage(enemy.x, enemy.y, damage, 'physical');
                    
                    // Handle chaining
                    if (bullet.chain > 0 && bullet.remainingChains > 0) {
                        this.handleChaining(bullet, enemy, enemies, playerBullets);
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
                if (bullet.intersects(player) && !player.invulnerable) {
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
    
    handleChaining(bullet, hitEnemy, enemies, playerBullets) {
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
            
            if (enemy.takeDamage(chainDamage)) {
                const enemyIndex = enemies.indexOf(target);
                if (enemyIndex > -1) {
                    enemies.splice(enemyIndex, 1);
                    this.scoreGained += target.points;
                    this.gameState.xp += target.points;
                    particleSystem.createExplosion(target.x, target.y);
                    
                    const xpAmount = target.points;
                    this.damageTextSystem.addXP(target.x, target.y + 20, xpAmount);
                }
            }
            
            this.damageTextSystem.addDamage(target.x, target.y, chainDamage, 'electric');
            
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