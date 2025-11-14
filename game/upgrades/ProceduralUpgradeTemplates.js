export const proceduralTemplates = new Map();

export const rarityMultipliers = {
    common: 1.0,
    uncommon: 1.5,
    rare: 2.0,
    legendary: 3.0
};

export function initializeProceduralTemplates() {
    // Damage-based upgrades
    proceduralTemplates.set('damage', {
        id: 'damage',
        name: 'Damage',
        description: 'Increases your damage output',
        icon: '⚔️',
        category: 'offensive',
        baseValue: 1,
        variance: 0.5,
        maxLevel: 10,
        scaling: 'linear'
    });

    // Speed-based upgrades
    proceduralTemplates.set('speed', {
        id: 'speed',
        name: 'Speed',
        description: 'Increases movement speed',
        icon: '💨',
        category: 'mobility',
        baseValue: 0.5,
        variance: 0.3,
        maxLevel: 8,
        scaling: 'linear'
    });

    // Defense-based upgrades
    proceduralTemplates.set('defense', {
        id: 'defense',
        name: 'Defense',
        description: 'Reduces damage taken',
        icon: '🛡️',
        category: 'defensive',
        baseValue: 0.1,
        variance: 0.05,
        maxLevel: 6,
        scaling: 'exponential'
    });

    // Utility-based upgrades
    proceduralTemplates.set('utility', {
        id: 'utility',
        name: 'Utility',
        description: 'Improves utility systems',
        icon: '🔧',
        category: 'utility',
        baseValue: 1,
        variance: 0.5,
        maxLevel: 5,
        scaling: 'linear'
    });

    // Luck-based upgrades
    proceduralTemplates.set('luck', {
        id: 'luck',
        name: 'Luck',
        description: 'Increases luck stat',
        icon: '🍀',
        category: 'utility',
        baseValue: 0.2,
        variance: 0.1,
        maxLevel: 5,
        scaling: 'linear'
    });

    // Special upgrades
    proceduralTemplates.set('critical', {
        id: 'critical',
        name: 'Critical Strike',
        description: 'Chance for critical hits',
        icon: '💥',
        category: 'offensive',
        baseValue: 0.05,
        variance: 0.02,
        maxLevel: 5,
        scaling: 'exponential'
    });

    proceduralTemplates.set('lifesteal', {
        id: 'lifesteal',
        name: 'Life Steal',
        description: 'Heal on damage dealt',
        icon: '💉',
        category: 'defensive',
        baseValue: 0.02,
        variance: 0.01,
        maxLevel: 4,
        scaling: 'linear'
    });

    proceduralTemplates.set('multishot', {
        id: 'multishot',
        name: 'Multishot',
        description: 'Fire multiple projectiles',
        icon: '🔫',
        category: 'offensive',
        baseValue: 1,
        variance: 0,
        maxLevel: 3,
        scaling: 'linear'
    });
}

export default {
    proceduralTemplates,
    rarityMultipliers,
    initializeProceduralTemplates
};

