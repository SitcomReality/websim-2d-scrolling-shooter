import { PlayerComponent } from './PlayerComponent.js';

export class HealthComponent extends PlayerComponent {
    constructor(player, initialHealth = 100) {
        super(player);
        this.maxHealth = initialHealth;
        this.currentHealth = initialHealth;
    }

    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        return this.currentHealth <= 0;
    }

    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    setMaxHealth(newMax) {
        const oldMax = this.maxHealth;
        this.maxHealth = newMax;
        // Scale current health proportionally
        this.currentHealth = Math.round((this.currentHealth / oldMax) * newMax);
    }

    applyUpgrade(upgradeData) {
        if (upgradeData.health) {
            this.setMaxHealth(this.maxHealth + upgradeData.health);
        }
    }

    reset() {
        this.currentHealth = this.maxHealth;
    }

    getHealthPercent() {
        return this.currentHealth / this.maxHealth;
    }
}