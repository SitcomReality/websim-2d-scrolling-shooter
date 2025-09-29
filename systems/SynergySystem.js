export class SynergySystem {
    constructor() {
        this.synergies = new Map();
        this.activeSynergies = new Set();
        this.initializeSynergies();
    }

    initializeSynergies() {
        // Define synergy combinations and their effects
        this.synergies.set('damage+fireRate', {
            name: 'Devastation',
            description: 'Increased critical hit chance',
            requirements: { damage: 3, fireRate: 2 },
            effect: (player) => {
                player.criticalChance = (player.criticalChance || 0) + 0.15;
            },
            icon: '💥'
        });

        this.synergies.set('health+healthPickupAmount', {
            name: 'Vitality',
            description: 'Regenerate health slowly',
            requirements: { health: 2, healthPickupAmount: 2 },
            effect: (player) => {
                player.regeneration = (player.regeneration || 0) + 0.5;
            },
            icon: '❤️'
        });

        this.synergies.set('speed+movement', {
            name: 'Swiftness',
            description: 'Dodge chance increased',
            requirements: { speed: 2, movement: 2 },
            effect: (player) => {
                player.dodgeChance = (player.dodgeChance || 0) + 0.10;
            },
            icon: '💨'
        });

        this.synergies.set('luck+healthPickupChance', {
            name: 'Fortune',
            description: 'Better item drops',
            requirements: { luck: 2, healthPickupChance: 2 },
            effect: (player) => {
                player.dropQuality = (player.dropQuality || 1) + 0.3;
            },
            icon: '🍀'
        });

        this.synergies.set('damage+speed+fireRate', {
            name: 'Perfection',
            description: 'All stats boosted',
            requirements: { damage: 2, speed: 2, fireRate: 2 },
            effect: (player) => {
                player.damage = (player.damage || 1) * 1.2;
                player.speed = (player.speed || 5) * 1.2;
                player.fireRate = (player.fireRate || 150) * 0.9;
            },
            icon: '⭐'
        });
    }

    checkSynergies(upgradeState, player) {
        const upgradeCounts = this.getUpgradeCounts(upgradeState);
        const newActiveSynergies = new Set();

        // Check each synergy
        this.synergies.forEach((synergy, key) => {
            const requirements = synergy.requirements;
            let requirementsMet = true;

            for (const [upgradeId, requiredLevel] of Object.entries(requirements)) {
                const currentLevel = upgradeCounts.get(upgradeId) || 0;
                if (currentLevel < requiredLevel) {
                    requirementsMet = false;
                    break;
                }
            }

            if (requirementsMet) {
                newActiveSynergies.add(key);

                // If this is a newly activated synergy, apply its effect
                if (!this.activeSynergies.has(key)) {
                    synergy.effect(player);
                    this.showSynergyNotification(synergy);
                }
            }
        });

        this.activeSynergies = newActiveSynergies;
    }

    getUpgradeCounts(upgradeState) {
        const counts = new Map();

        if (upgradeState instanceof Map) {
            // Handle plain Map
            upgradeState.forEach((data, upgradeId) => {
                counts.set(upgradeId, data.count || 0);
            });
        } else if (upgradeState && typeof upgradeState.getUpgradeLevel === 'function') {
            // Handle UpgradeState instance
            const allUpgrades = ['damage', 'fireRate', 'speed', 'health', 'movement', 
                               'luck', 'healthPickupChance', 'healthPickupAmount'];
            allUpgrades.forEach(id => {
                counts.set(id, upgradeState.getUpgradeLevel(id));
            });
        }

        return counts;
    }

    showSynergyNotification(synergy) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'synergy-notification';
        notification.innerHTML = `
            <div class="synergy-icon">${synergy.icon}</div>
            <div class="synergy-info">
                <div class="synergy-name">${synergy.name} Synergy Activated!</div>
                <div class="synergy-description">${synergy.description}</div>
            </div>
        `;

        // Add to game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(notification);

            // Remove after animation
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }

    getActiveSynergies() {
        return Array.from(this.activeSynergies).map(key => this.synergies.get(key));
    }

    reset() {
        this.activeSynergies.clear();
    }
}