import { BaseUpgrade } from './base/BaseUpgrade.js';

export class ProceduralUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super(config);
        this.type = 'procedural';
        this.seed = config.seed || Math.random();
        this.affinities = config.affinities || [];
        this.mutations = config.mutations || [];
        this.combinations = config.combinations || [];
    }

    generate(playerState, existingUpgrades) {
        const rng = this.createRNG(this.seed);
        const upgrade = this.buildUpgrade(rng, playerState, existingUpgrades);

        // Apply mutations
        if (this.mutations.length > 0) {
            const numMutations = Math.floor(rng() * 3) + 1;
            for (let i = 0; i < numMutations; i++) {
                this.applyRandomMutation(upgrade, rng);
            }
        }

        // Apply combinations
        if (this.combinations.length > 0) {
            this.applyRandomCombination(upgrade, rng, existingUpgrades);
        }

        return upgrade;
    }

    createRNG(seed) {
        let x = Math.sin(seed) * 10000;
        return () => {
            x = Math.sin(x) * 10000;
            return x - Math.floor(x);
        };
    }

    buildUpgrade(rng, playerState, existingUpgrades) {
        // Override in subclasses
        return {};
    }

    applyRandomMutation(upgrade, rng) {
        const mutations = [
            () => this.mutateRarity(upgrade, rng),
            () => this.mutateValues(upgrade, rng),
            () => this.mutateDescription(upgrade, rng),
            () => this.mutateSynergies(upgrade, rng)
        ];

        const mutation = mutations[Math.floor(rng() * mutations.length)];
        mutation();
    }

    mutateRarity(upgrade, rng) {
        const rarities = ['common', 'uncommon', 'rare', 'legendary'];
        const currentIndex = rarities.indexOf(upgrade.rarity);
        const newIndex = Math.max(0, Math.min(rarities.length - 1, 
            currentIndex + (rng() > 0.5 ? 1 : -1)));
        upgrade.rarity = rarities[newIndex];
    }

    mutateValues(upgrade, rng) {
        if (upgrade.values) {
            Object.keys(upgrade.values).forEach(key => {
                const multiplier = 0.8 + rng() * 0.4; // 0.8x to 1.2x
                upgrade.values[key] = Math.round(upgrade.values[key] * multiplier);
            });
        }
    }

    mutateDescription(upgrade, rng) {
        const prefixes = ['Enhanced', 'Superior', 'Modified', 'Augmented'];
        const suffixes = ['of Power', 'of Might', 'of Fury', 'of Destruction'];

        // Ensure upgrade.name exists before checking includes
        if (upgrade.name && rng() > 0.5 && !upgrade.name.includes(prefixes[0])) {
            upgrade.name = prefixes[Math.floor(rng() * prefixes.length)] + ' ' + upgrade.name;
        }

        if (upgrade.name && rng() > 0.7) {
            upgrade.name += ' ' + suffixes[Math.floor(rng() * suffixes.length)];
        }
    }

    mutateSynergies(upgrade, rng) {
        if (!upgrade.synergies) upgrade.synergies = [];

        // Add random synergy
        if (rng() > 0.6) {
            const randomId = Math.random().toString(36).substr(2, 5);
            upgrade.synergies.push(randomId);
        }

        // Remove random synergy
        if (upgrade.synergies.length > 0 && rng() > 0.8) {
            const index = Math.floor(rng() * upgrade.synergies.length);
            upgrade.synergies.splice(index, 1);
        }
    }

    applyRandomCombination(upgrade, rng, existingUpgrades) {
        const upgradableUpgrades = Array.from(existingUpgrades.values())
            .filter(u => u.count > 0 && u.id !== upgrade.id);

        if (upgradableUpgrades.length === 0) return;

        const targetUpgrade = upgradableUpgrades[Math.floor(rng() * upgradableUpgrades.length)];

        // Create combination
        upgrade.name = `${upgrade.name} + ${targetUpgrade.name}`;
        upgrade.description = `Combined upgrade with ${targetUpgrade.name}`;
        upgrade.rarity = this.getCombinedRarity(upgrade.rarity, targetUpgrade.rarity);

        // Merge values
        if (upgrade.values && targetUpgrade.values) {
            Object.keys(targetUpgrade.values).forEach(key => {
                if (!upgrade.values[key]) {
                    upgrade.values[key] = targetUpgrade.values[key] * 0.5;
                }
            });
        }
    }

    getCombinedRarity(rarity1, rarity2) {
        const rarityOrder = ['common', 'uncommon', 'rare', 'legendary'];
        const index1 = rarityOrder.indexOf(rarity1);
        const index2 = rarityOrder.indexOf(rarity2);
        const combinedIndex = Math.min(rarityOrder.length - 1, 
            Math.max(index1, index2) + 1);
        return rarityOrder[combinedIndex];
    }
}