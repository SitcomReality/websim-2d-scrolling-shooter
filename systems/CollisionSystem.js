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
                    bullet.alive = false;
                    const damage = bullet.damage || 1;
                    if (enemy.takeDamage(damage)) {
                        // Immediately remove the enemy from the array
                        enemies.splice(j, 1);
                        this.scoreGained += enemy.points;
                        particleSystem.createExplosion(enemy.x, enemy.y);
                        
                        // Show XP text
                        const xpAmount = enemy.points; // XP equals enemy points
                        this.damageTextSystem.addXP(enemy.x, enemy.y + 20, xpAmount);
                        
                        // Use player's adjusted chance for health pickup
                        const dropChance = player.healthPickupChance || 0.02;
                        if (Math.random() < dropChance) {
                            powerUpSystem.spawnHealthPickup(enemy.x, enemy.y);
                        }
                    }
                    this.damageTextSystem.addDamage(enemy.x, enemy.y, damage, 'physical');
                    break;
                }
            }
        }
        
        // Player vs enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (player.intersects(enemy) && !player.invulnerable) {
                const damage = 20;
                this.damageTaken += damage;
                enemies.splice(i, 1); // Immediately remove the enemy
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