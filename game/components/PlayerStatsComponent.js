export class PlayerStatsComponent {
    constructor() {
        this.stats = {
            healthPickupChance: 0.02,
            healthPickupAmount: 5,
            invulnerable: false,
            luck: 1.0, // Base luck value
            criticalChance: 0.01, // 1% base crit chance
            criticalDamage: 0.5 // +50% damage on crit
        };
    }
    
    increaseHealthPickupChance(amount) {
        this.stats.healthPickupChance += amount;
    }
    
    increaseHealthPickupAmount(amount) {
        this.stats.healthPickupAmount += amount;
    }
    
    setInvulnerable(value) {
        this.stats.invulnerable = value;
    }
    
    getHealthPickupChance() {
        return this.stats.healthPickupChance;
    }
    
    getHealthPickupAmount() {
        return this.stats.healthPickupAmount;
    }
    
    isInvulnerable() {
        return this.stats.invulnerable;
    }
    
    increaseLuck(amount) {
        this.stats.luck += amount;
    }
    
    getLuck() {
        return this.stats.luck;
    }
    
    increaseCriticalChance(amount) {
        this.stats.criticalChance += amount;
    }
    
    increaseCriticalDamage(amount) {
        this.stats.criticalDamage += amount;
    }
    
    getCriticalChance() {
        return this.stats.criticalChance;
    }
    
    getCriticalDamage() {
        return this.stats.criticalDamage;
    }
}