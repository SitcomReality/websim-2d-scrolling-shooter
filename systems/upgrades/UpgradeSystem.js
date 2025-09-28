import { UpgradeRegistry } from './UpgradeRegistry.js';
import { UpgradeGenerator } from './UpgradeGenerator.js';
import { BaseUpgrade } from './base/BaseUpgrade.js';
import { HomingMissileUpgrade, ExplosiveRoundsUpgrade, LightningWeaponUpgrade, LaserBeamUpgrade, PiercingShotsUpgrade } from './weapons/index.js';

export class UpgradeSystem {
    constructor() {
        this.registry = new UpgradeRegistry();
        this.generator = new UpgradeGenerator();
        this.playerUpgrades = new Map();
        this.templates = new Map();

        this.initializeTemplates();
        this.initializeBaseUpgrades();
        this.initializeWeaponUpgrades();
    }

    initializeTemplates() {
        // Register upgrade templates for procedural generation
        this.generator.registerTemplate('weapon_projectile', {
            name: 'Projectile Weapon',
            description: 'Fires projectiles at enemies',
            rarity: 'common',
            category: 'weapon',
            tags: ['weapon', 'projectile', 'offensive'],
            affinities: ['damage', 'speed'],
            mutations: ['damage', 'speed', 'piercing'],
            combinations: ['weapon_laser', 'weapon_burst']
        });

        this.generator.registerTemplate('weapon_laser', {
            name: 'Laser Weapon',
            description: 'Fires a continuous laser beam',
            rarity: 'rare',
            category: 'weapon',
            tags: ['weapon', 'laser', 'offensive', 'continuous'],
            affinities: ['damage', 'duration'],
            mutations: ['damage', 'width', 'duration'],
            combinations: ['weapon_projectile', 'weapon_lightning']
        });

        this.generator.registerTemplate('movement_dash', {
            name: 'Dash Ability',
            description: 'Quickly dash in any direction',
            rarity: 'uncommon',
            category: 'movement',
            tags: ['movement', 'mobility', 'defensive'],
            affinities: ['speed', 'distance'],
            mutations: ['speed', 'distance', 'cooldown'],
            combinations: ['movement_teleport', 'movement_phase']
        });

        this.generator.registerTemplate('ability_shield', {
            name: 'Shield Generator',
            description: 'Generates a protective shield',
            rarity: 'rare',
            category: 'ability',
            tags: ['ability', 'defensive', 'shield'],
            affinities: ['strength', 'duration'],
            mutations: ['strength', 'duration', 'recharge'],
            combinations: ['ability_reflect', 'ability_absorb']
        });

        this.generator.registerTemplate('stat_health', {
            name: 'Health Boost',
            description: 'Increases maximum health',
            rarity: 'common',
            category: 'stat',
            tags: ['stat', 'health', 'defensive'],
            affinities: ['health', 'regeneration'],
            mutations: ['health', 'regeneration', 'resistance'],
            combinations: ['stat_armor', 'stat_regeneration']
        });
    }

    initializeBaseUpgrades() {
        // Register handcrafted upgrades
        this.registry.register(new BaseUpgrade({
            id: 'health_boost',
            name: 'Health Boost',
            description: 'Increases maximum health by 10',
            rarity: 'common',
            category: 'stat',
            tags: ['health', 'defensive'],
            apply: (player, values) => {
                player.maxHealth = (player.maxHealth || 100) + 10;
                player.health = Math.min(player.health, player.maxHealth);
            },
            getValues: () => ({ health: 10 })
        }));

        this.registry.register(new BaseUpgrade({
            id: 'damage_boost',
            name: 'Damage Boost',
            description: 'Increases damage by 1',
            rarity: 'common',
            category: 'stat',
            tags: ['damage', 'offensive'],
            apply: (player, values) => {
                player.damage = (player.damage || 1) + 1;
            },
            getValues: () => ({ damage: 1 })
        }));

        this.registry.register(new BaseUpgrade({
            id: 'speed_boost',
            name: 'Speed Boost',
            description: 'Increases movement speed by 0.5',
            rarity: 'common',
            category: 'movement',
            tags: ['speed', 'mobility'],
            apply: (player, values) => {
                player.speed = (player.speed || 5) + 0.5;
            },
            getValues: () => ({ speed: 0.5 })
        }));
    }

    initializeWeaponUpgrades() {
        // Register weapon upgrade modules
        this.registry.register(new HomingMissileUpgrade());
        this.registry.register(new ExplosiveRoundsUpgrade());
        this.registry.register(new LightningWeaponUpgrade());
        this.registry.register(new LaserBeamUpgrade());
        this.registry.register(new PiercingShotsUpgrade());
        
        // Register templates for procedural generation
        this.generator.registerTemplate('homing_missile', {
            name: 'Homing Missiles',
            description: 'Fires missiles that track enemies',
            rarity: 'uncommon',
            category: 'weapon',
            tags: ['weapon', 'projectile', 'homing', 'missile'],
            affinities: ['damage', 'speed'],
            mutations: ['homingStrength', 'missileSpeed', 'explosionRadius'],
            combinations: ['weapon_explosive', 'weapon_piercing']
        });

        this.generator.registerTemplate('explosive_rounds', {
            name: 'Explosive Rounds',
            description: 'Bullets explode on impact, damaging nearby enemies',
            rarity: 'rare',
            category: 'weapon',
            tags: ['weapon', 'explosive', 'aoe', 'damage'],
            affinities: ['damage', 'radius'],
            mutations: ['explosionRadius', 'explosionDamage', 'knockback'],
            combinations: ['weapon_homing', 'weapon_shrapnel']
        });

        this.generator.registerTemplate('laser_beam', {
            name: 'Laser Beam',
            description: 'Fires a continuous laser beam that melts enemies',
            rarity: 'rare',
            category: 'weapon',
            tags: ['weapon', 'laser', 'beam', 'continuous', 'burn'],
            affinities: ['damage', 'duration'],
            mutations: ['beamWidth', 'beamRange', 'burnDamage'],
            combinations: ['weapon_piercing', 'weapon_lightning']
        });

        this.generator.registerTemplate('piercing_shots', {
            name: 'Piercing Shots',
            description: 'Bullets pierce through enemies, hitting multiple targets',
            rarity: 'uncommon',
            category: 'weapon',
            tags: ['weapon', 'projectile', 'piercing', 'multi-target'],
            affinities: ['damage', 'pierce'],
            mutations: ['pierceCount', 'pierceDamageReduction', 'armorPiercing'],
            combinations: ['weapon_laser', 'weapon_explosive']
        });
    }

    generateUpgradeChoices(playerState, count = 3) {
        const choices = [];

        // Get handcrafted upgrades
        const handcrafted = this.registry.getUpgradeChoices(
            playerState,
            this.playerUpgrades,
            Math.floor(count * 0.6)
        );

        choices.push(...handcrafted);

        // Generate procedural upgrades
        const remainingCount = count - choices.length;
        for (let i = 0; i < remainingCount; i++) {
            const procedural = this.generator.generateRandomUpgrade(
                playerState,
                this.playerUpgrades,
                'complex'
            );
            choices.push(procedural);
        }

        return choices;
    }

    applyUpgrade(upgradeChoice, player) {
        const { upgrade, values } = upgradeChoice;

        if (upgrade.apply) {
            upgrade.apply(player, values);
        }

        // Track upgrade
        if (!this.playerUpgrades.has(upgrade.id)) {
            this.playerUpgrades.set(upgrade.id, { count: 0, upgrade });
        }
        this.playerUpgrades.get(upgrade.id).count++;

        // Update UI
        this.updatePlayerUI(player);
    }

    updatePlayerUI(player) {
        if (window.gameInstance && window.gameInstance.uiManager) {
            window.gameInstance.uiManager.update();
        }
    }

    createUpgradeCard(choice, index) {
        const card = document.createElement('div');
        card.className = `upgrade-card ${choice.rarity}`;

        const upgrade = choice.upgrade || choice;
        const values = choice.values || upgrade.getValues?.(choice.rarity) || {};

        card.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-value">${this.formatValues(values)}</div>
            <div class="upgrade-rarity">${upgrade.rarity}</div>
        `;

        return card;
    }

    formatValues(values) {
        return Object.entries(values)
            .map(([key, value]) => {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
                let formattedValue = value;

                if (typeof value === 'number') {
                    if (value > 0 && value < 1) {
                        formattedValue = `${Math.round(value * 100)}%`;
                    } else if (value > 0) {
                        formattedValue = `+${value}`;
                    }
                }

                return `${formattedKey}: ${formattedValue}`;
            })
            .join(', ');
    }

    // Utility methods for creating specific upgrade types
    createWeaponUpgrade(config) {
        return new BaseUpgrade({
            ...config,
            category: 'weapon',
            tags: [...(config.tags || []), 'weapon', 'offensive']
        });
    }

    createMovementUpgrade(config) {
        return new BaseUpgrade({
            ...config,
            category: 'movement',
            tags: [...(config.tags || []), 'movement', 'mobility']
        });
    }

    createAbilityUpgrade(config) {
        return new BaseUpgrade({
            ...config,
            category: 'ability',
            tags: [...(config.tags || []), 'ability', 'special']
        });
    }
}