export class HealthComponent {
    constructor(maxHealth = 100) {
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }

    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        return this.currentHealth <= 0;
    }

    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    setMaxHealth(newMax) {
        const previousMax = this.maxHealth;
        this.maxHealth = newMax;
        // Maintain the same health percentage when max increases
        if (newMax > previousMax) {
            this.currentHealth = Math.min(this.currentHealth, this.maxHealth);
        } else {
            this.currentHealth = Math.min(this.currentHealth, this.maxHealth);
        }
    }

    isAlive() {
        return this.currentHealth > 0;
    }

    getHealthPercentage() {
        return (this.currentHealth / this.maxHealth) * 100;
    }
}