export class CollisionSystem {
    constructor() {
        this.scoreGained = 0;
        this.damageTaken = 0;
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
                    if (enemy.takeDamage(1)) {
                        enemy.alive = false;
                        this.scoreGained += enemy.points;
                        particleSystem.createExplosion(enemy.x, enemy.y);
                    }
                    break;
                }
            }
        }
        
        // Player vs enemies
        for (let enemy of enemies) {
            if (player.intersects(enemy)) {
                this.damageTaken += 20;
                enemy.alive = false;
                particleSystem.createExplosion(enemy.x, enemy.y);
            }
        }
        
        // Player vs enemy bullets
        enemies.forEach(enemy => {
            enemy.getBullets().forEach(bullet => {
                if (bullet.intersects(player)) {
                    bullet.alive = false;
                    this.damageTaken += 10;
                    particleSystem.createExplosion(bullet.x, bullet.y);
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
}

