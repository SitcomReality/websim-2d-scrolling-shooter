export class PlayerStatsComponent {
    constructor() {
        this.stats = {
            healthPickupChance: 0.02,
            healthPickupAmount: 5,
            invulnerable: false,
            luck: 1.0 // Base luck value
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
}