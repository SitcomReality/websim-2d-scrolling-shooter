export class UpgradeSystem {
    constructor() {
        this.availableUpgrades = [
            new HealthUpgrade(),
            new DamageUpgrade(),
            new SpeedUpgrade(),
            new FireRateUpgrade()
        ];
        
        this.playerUpgrades = new Map();
        this.rarityWeights = {
            common: 70,
            uncommon: 20,
            rare: 8,
            legendary: 2
        };
    }
    
    generateUpgradeChoices(level, playerUpgrades) {
        const choices = [];
        const available = this.getAvailableUpgrades(level, playerUpgrades);
        
        for (let i = 0; i < Math.min(4, available.length); i++) {
            const upgrade = available[Math.floor(Math.random() * available.length)];
            const rarity = this.rollRarity();
            choices.push({
                upgrade: upgrade,
                rarity: rarity,
                values: upgrade.getValues(rarity)
            });
        }
        
        return choices;
    }
    
    getAvailableUpgrades(level, playerUpgrades) {
        return this.availableUpgrades.filter(upgrade => 
            upgrade.canBeOffered(level, playerUpgrades)
        );
    }
    
    rollRarity() {
        const total = Object.values(this.rarityWeights).reduce((a, b) => a + b, 0);
        const roll = Math.random() * total;
        
        let cumulative = 0;
        for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
            cumulative += weight;
            if (roll <= cumulative) return rarity;
        }
        return 'common';
    }
    
    applyUpgrade(upgradeChoice, player) {
        const { upgrade, rarity, values } = upgradeChoice;
        upgrade.apply(player, values);
        
        if (!this.playerUpgrades.has(upgrade.name)) {
            this.playerUpgrades.set(upgrade.name, { count: 0 });
        }
        this.playerUpgrades.get(upgrade.name).count++;
    }
}

class BaseUpgrade {
    constructor(name) {
        this.name = name;
        this.maxLevel = 5;
    }
    
    canBeOffered(level, playerUpgrades) {
        const currentCount = playerUpgrades.get(this.name)?.count || 0;
        return currentCount < this.maxLevel;
    }
}

class HealthUpgrade extends BaseUpgrade {
    constructor() {
        super('Max Health');
    }
    
    getValues(rarity) {
        const values = {
            common: 5,
            uncommon: 7,
            rare: 9,
            legendary: 12
        };
        return { health: values[rarity] };
    }
    
    apply(player, values) {
        player.maxHealth = (player.maxHealth || 100) + values.health;
        player.health = Math.min(player.health + values.health, player.maxHealth);
    }
}

class DamageUpgrade extends BaseUpgrade {
    constructor() {
        super('Damage Boost');
    }
    
    getValues(rarity) {
        const values = {
            common: 1,
            uncommon: 2,
            rare: 3,
            legendary: 5
        };
        return { damage: values[rarity] };
    }
    
    apply(player, values) {
        player.damage = (player.damage || 1) + values.damage;
    }
}

class SpeedUpgrade extends BaseUpgrade {
    constructor() {
        super('Movement Speed');
    }
    
    getValues(rarity) {
        const values = {
            common: 0.5,
            uncommon: 0.8,
            rare: 1.2,
            legendary: 1.8
        };
        return { speed: values[rarity] };
    }
    
    apply(player, values) {
        player.speed = (player.speed || 5) + values.speed;
    }
}

class FireRateUpgrade extends BaseUpgrade {
    constructor() {
        super('Fire Rate');
    }
    
    getValues(rarity) {
        const values = {
            common: 0.9,
            uncommon: 0.85,
            rare: 0.8,
            legendary: 0.7
        };
        return { fireRateMultiplier: values[rarity] };
    }
    
    apply(player, values) {
        player.fireRate = (player.fireRate || 150) * values.fireRateMultiplier;
    }
}