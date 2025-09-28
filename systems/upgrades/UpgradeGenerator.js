import { ProceduralUpgrade } from './ProceduralUpgrade.js';

export class UpgradeGenerator {
    constructor() {
        this.templates = new Map();
        this.affinities = new Map();
        this.combinations = new Map();
    }

    registerTemplate(name, template) {
        this.templates.set(name, template);
    }

    registerAffinity(upgradeId, affinity) {
        if (!this.affinities.has(upgradeId)) {
            this.affinities.set(upgradeId, []);
        }
        this.affinities.get(upgradeId).push(affinity);
    }

    registerCombination(ids, result) {
        const key = Array.isArray(ids) ? ids.sort().join(',') : ids;
        this.combinations.set(key, result);
    }

    generateUpgrade(templateName, playerState, existingUpgrades, seed = null) {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Unknown template: ${templateName}`);
        }

        const upgrade = new ProceduralUpgrade({
            id: `${templateName}_${Date.now()}`,
            name: template.name,
            description: template.description,
            rarity: template.rarity || 'common',
            category: template.category,
            tags: template.tags || [],
            seed: seed || Math.random(),
            affinities: template.affinities || [],
            mutations: template.mutations || [],
            combinations: template.combinations || []
        });

        return upgrade.generate(playerState, existingUpgrades);
    }

    generateRandomUpgrade(playerState, existingUpgrades, complexity = 'simple') {
        const templates = Array.from(this.templates.keys());
        const templateName = templates[Math.floor(Math.random() * templates.length)];

        const upgrade = this.generateUpgrade(templateName, playerState, existingUpgrades);

        // Add random complexity
        if (complexity === 'complex') {
            this.addRandomComponents(upgrade);
        }

        return upgrade;
    }

    addRandomComponents(upgrade) {
        const components = [
            () => this.addRandomSynergy(upgrade),
            () => this.addRandomMutation(upgrade),
            () => this.addRandomAffinity(upgrade),
            () => this.addRandomCombination(upgrade)
        ];

        const numComponents = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numComponents; i++) {
            const component = components[Math.floor(Math.random() * components.length)];
            component();
        }
    }

    addRandomSynergy(upgrade) {
        if (!upgrade.synergies) upgrade.synergies = [];
        upgrade.synergies.push(Math.random().toString(36).substr(2, 5));
    }

    addRandomMutation(upgrade) {
        if (!upgrade.mutations) upgrade.mutations = [];
        upgrade.mutations.push({
            type: 'random',
            chance: Math.random() * 0.5 + 0.1
        });
    }

    addRandomAffinity(upgrade) {
        if (!upgrade.affinities) upgrade.affinities = [];
        upgrade.affinities.push({
            type: 'random',
            strength: Math.random()
        });
    }

    addRandomCombination(upgrade) {
        if (!upgrade.combinations) upgrade.combinations = [];
        upgrade.combinations.push({
            target: Math.random().toString(36).substr(2, 5),
            result: 'enhanced'
        });
    }

    generateUpgradeSet(theme, playerState, existingUpgrades, count = 5) {
        const upgrades = [];

        // Get templates matching the theme
        const matchingTemplates = Array.from(this.templates.entries())
            .filter(([name, template]) => 
                template.tags && template.tags.includes(theme)
            );

        // Generate upgrades
        for (let i = 0; i < Math.min(count, matchingTemplates.length); i++) {
            const [name, template] = matchingTemplates[i];
            const upgrade = this.generateUpgrade(name, playerState, existingUpgrades);
            upgrades.push(upgrade);
        }

        // Fill remaining slots with random upgrades
        while (upgrades.length < count) {
            const randomUpgrade = this.generateRandomUpgrade(playerState, existingUpgrades);
            upgrades.push(randomUpgrade);
        }

        return upgrades;
    }
}