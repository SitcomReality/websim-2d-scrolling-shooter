export class UpgradeRegistry {
    constructor() {
        this.upgrades = new Map();
        this.categories = new Map();
        this.tags = new Map();
        this.rarities = new Map();
    }

    register(upgrade) {
        if (!upgrade.id) {
            throw new Error('Upgrade must have an ID');
        }

        this.upgrades.set(upgrade.id, upgrade);

        // Categorize by category
        if (upgrade.category) {
            if (!this.categories.has(upgrade.category)) {
                this.categories.set(upgrade.category, []);
            }
            this.categories.get(upgrade.category).push(upgrade);
        }

        // Index by tags
        upgrade.tags.forEach(tag => {
            if (!this.tags.has(tag)) {
                this.tags.set(tag, []);
            }
            this.tags.get(tag).push(upgrade);
        });

        // Index by rarity
        if (!this.rarities.has(upgrade.rarity)) {
            this.rarities.set(upgrade.rarity, []);
        }
        this.rarities.get(upgrade.rarity).push(upgrade);
    }

    get(id) {
        return this.upgrades.get(id);
    }

    getByCategory(category) {
        return this.categories.get(category) || [];
    }

    getByTag(tag) {
        return this.tags.get(tag) || [];
    }

    getByRarity(rarity) {
        return this.rarities.get(rarity) || [];
    }

    getAll() {
        return Array.from(this.upgrades.values());
    }

    getRandomUpgrade(filters = {}) {
        let candidates = this.getAll();

        // Apply filters
        if (filters.category) {
            candidates = candidates.filter(u => u.category === filters.category);
        }

        if (filters.rarity) {
            candidates = candidates.filter(u => u.rarity === filters.rarity);
        }

        if (filters.tags && filters.tags.length > 0) {
            candidates = candidates.filter(u => 
                filters.tags.some(tag => u.tags.includes(tag))
            );
        }

        if (candidates.length === 0) return null;

        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    getUpgradeChoices(playerState, existingUpgrades, count = 3) {
        const choices = [];
        const candidates = this.getAll().filter(upgrade => 
            upgrade.canBeOffered(playerState, existingUpgrades)
        );

        // Weight by rarity and synergies
        const weightedCandidates = candidates.map(upgrade => ({
            upgrade,
            weight: this.calculateWeight(upgrade, playerState, existingUpgrades)
        }));

        // Sort by weight and pick top choices
        weightedCandidates.sort((a, b) => b.weight - a.weight);

        for (let i = 0; i < Math.min(count, weightedCandidates.length); i++) {
            choices.push(weightedCandidates[i].upgrade);
        }

        return choices;
    }

    calculateWeight(upgrade, playerState, existingUpgrades) {
        let weight = 1;

        // Rarity multiplier
        const rarityMultipliers = {
            common: 1,
            uncommon: 0.7,
            rare: 0.3,
            legendary: 0.1
        };

        weight *= rarityMultipliers[upgrade.rarity] || 1;

        // Synergy bonus
        upgrade.synergies.forEach(synergyId => {
            if (existingUpgrades.has(synergyId)) {
                weight *= 1.5;
            }
        });

        // Level penalty
        const level = upgrade.getLevel(existingUpgrades);
        weight *= Math.pow(0.8, level);

        return weight;
    }
}