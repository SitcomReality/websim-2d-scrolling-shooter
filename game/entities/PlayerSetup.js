import StatSystem from '../systems/StatSystem.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { MovementComponent } from '../components/MovementComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { PlayerStatsComponent } from '../components/PlayerStatsComponent.js';
import ChargeComponent from '../components/ChargeComponent.js';

export function initializePlayer(playerInstance, x = 400, y = 500, weaponFactory = null) {
    // Initialize stat system (new)
    playerInstance.statSystem = new StatSystem();

    // Register core baseline stats (canonical defaults)
    const baseStats = [
        { id: 'maxHealth', name: 'Max Health', baseValue: 100, description: 'Maximum health', category: 'defensive', upgradeWeight: 0.8 },
        { id: 'health', name: 'Health', baseValue: 100, description: 'Current health (managed by healthComponent)', category: 'defensive', upgradeWeight: 0 },
        { id: 'damage', name: 'Damage', baseValue: 1, description: 'Bullet damage', category: 'offensive', upgradeWeight: 0.9 },
        { id: 'speed', name: 'Speed', baseValue: 3, description: 'Movement speed', category: 'mobility', upgradeWeight: 0.7 },
        { id: 'fireRate', name: 'Fire Rate', baseValue: 20, description: 'Shots per second', category: 'offensive', upgradeWeight: 0.6 },
        { id: 'criticalChance', name: 'Critical Chance', baseValue: 0.1, description: 'Chance to deal critical damage', category: 'offensive', upgradeWeight: 0.4 },
        { id: 'criticalDamage', name: 'Critical Damage', baseValue: 0.5, description: 'Extra damage multiplier on crit', category: 'offensive', upgradeWeight: 0.4 },
        { id: 'luck', name: 'Luck', baseValue: 1.0, description: 'Affects upgrade quality and reroll cost', category: 'utility', upgradeWeight: 0.5 },
        { id: 'lifesteal', name: 'Lifesteal', baseValue: 0, description: 'Fraction of damage healed on hit', category: 'defensive', upgradeWeight: 0.2 },
        { id: 'chargeSpeed', name: 'Charge Speed', baseValue: 1.0, description: 'Multiplier for how fast charge accrues relative to fire rate', category: 'utility', upgradeWeight: 0.3 },
        { id: 'maxCharge', name: 'Max Charge', baseValue: 8, description: 'Maximum stored projectiles from charging', category: 'utility', upgradeWeight: 0.4 }
    ];
    baseStats.forEach(def => {
        if (!playerInstance.statSystem.hasStat(def.id)) playerInstance.statSystem.registerStat(def);
    });

    // Initialize components
    playerInstance.healthComponent = new HealthComponent(playerInstance.statSystem.getStatValue('maxHealth') || 100);
    playerInstance.movementComponent = new MovementComponent(playerInstance.statSystem.getStatValue('speed') || 3);
    playerInstance.weaponComponent = new WeaponComponent(weaponFactory, 'single', { 
        damage: playerInstance.statSystem.getStatValue('damage') || 1, 
        fireRate: 1000 / (playerInstance.statSystem.getStatValue('fireRate') || 20),
        statSystem: playerInstance.statSystem // pass statSystem at construction
    });
    // Wire weapon component to this player so weapons can read the statSystem via owner reference
    if (playerInstance.weaponComponent && typeof playerInstance.weaponComponent.bindToPlayer === 'function') {
        playerInstance.weaponComponent.bindToPlayer(playerInstance);
    } else if (playerInstance.weaponComponent) {
        // best-effort set owner/property for older fallback weapon components
        playerInstance.weaponComponent.owner = playerInstance;
    }
    playerInstance.statsComponent = new PlayerStatsComponent();

    // Charge component — derive parameters from statSystem (chargeSpeed & maxCharge)
    playerInstance.chargeComponent = new ChargeComponent({
        maxChargeTime: 5000,
        maxStoredShots: playerInstance.statSystem.getStatValue('maxCharge') || 8,
        chargeRate: 1,
        statSystem: playerInstance.statSystem
    });

    // Wire weapon component's charge component to the player's authoritative one
    playerInstance.weaponComponent.chargeComponent = playerInstance.chargeComponent;

    // Set initial position and sync movement component
    playerInstance.movementComponent.setPosition(x, y);
    playerInstance.x = playerInstance.movementComponent.position.x;
    playerInstance.y = playerInstance.movementComponent.position.y;

    // Visual and alive state
    playerInstance.color = playerInstance.color || '#00ffff';
    playerInstance.alive = true;

    // Ensure gameState is in sync with statSystem values where appropriate
    if (window.gameInstance && window.gameInstance.gameState) {
        window.gameInstance.gameState.maxHealth = playerInstance.statSystem.getStatValue('maxHealth');
        window.gameInstance.gameState.health = playerInstance.healthComponent.currentHealth;
    }
}