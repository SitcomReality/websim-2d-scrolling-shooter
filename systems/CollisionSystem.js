import { DamageTextSystem } from './DamageTextSystem.js';

export class CollisionSystem {
    constructor() {
        this.scoreGained = 0;
        this.damageTaken = 0;
        this.damageTextSystem = new DamageTextSystem();
    }
    
    checkCollisions(player, enemies, playerBullets, particleSystem) {
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
                        enemy.alive = false;
                        this.scoreGained += enemy.points;
                        particleSystem.createExplosion(enemy.x, enemy.y);
                    }
                    this.damageTextSystem.addDamage(enemy.x, enemy.y, damage, 'physical');
                    break;
                }
            }
        }
        
        // Player vs enemies
        for (let enemy of enemies) {
            if (player.intersects(enemy) && !player.invulnerable) {
                const damage = 20;
                this.damageTaken += damage;
                enemy.alive = false;
                particleSystem.createExplosion(enemy.x, enemy.y);
                this.damageTextSystem.addDamage(player.x, player.y, damage, 'physical');
            }
        }
        
        // Player vs enemy bullets
        enemies.forEach(enemy => {
            enemy.getBullets().forEach(bullet => {
                if (bullet.intersects(player) && !player.invulnerable) {
                    bullet.alive = false;
                    const damage = 10;
                    this.damageTaken += damage;
                    particleSystem.createExplosion(bullet.x, bullet.y);
                    this.damageTextSystem.addDamage(player.x, player.y, damage, 'physical');
                }
            });
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