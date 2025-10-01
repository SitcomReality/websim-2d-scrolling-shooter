import StatSystem from '../systems/StatSystem.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { MovementComponent } from '../components/MovementComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import ChargeComponent from '../components/ChargeComponent.js';
import { PlayerStatsComponent } from '../components/PlayerStatsComponent.js';

export function resetPlayerState(player) {
    player.x = 400;
    player.y = 500;

    player.statSystem = new StatSystem();
    const baseStats = [
        { id: 'maxHealth', name: 'Max Health', baseValue: 100, description: 'Maximum health', category: 'defensive', upgradeWeight: 0.8 },
        { id: 'health', name: 'Health', baseValue: 100, description: 'Current health (managed by healthComponent)', category: 'defensive', upgradeWeight: 0 },
        { id: 'damage', name: 'Damage', baseValue: 1, description: 'Bullet damage', category: 'offensive', upgradeWeight: 0.9 },
        { id: 'speed', name: 'Speed', baseValue: 3, description: 'Movement speed', category: 'mobility', upgradeWeight: 0.7 },
        { id: 'fireRate', name: 'Fire Rate', baseValue: 6, description: 'Shots per second', category: 'offensive', upgradeWeight: 0.6 },
        { id: 'criticalChance', name: 'Critical Chance', baseValue: 0.1, description: 'Chance to deal critical damage', category: 'offensive', upgradeWeight: 0.4 },
        { id: 'criticalDamage', name: 'Critical Damage', baseValue: 0.5, description: 'Extra damage multiplier on crit', category: 'offensive', upgradeWeight: 0.4 },
        { id: 'luck', name: 'Luck', baseValue: 1.0, description: 'Affects upgrade quality and reroll cost', category: 'utility', upgradeWeight: 0.5 },
        { id: 'lifesteal', name: 'Lifesteal', baseValue: 0, description: 'Fraction of damage healed on hit', category: 'defensive', upgradeWeight: 0.2 },
        { id: 'chargeSpeed', name: 'Charge Speed', baseValue: 1.0, description: 'Multiplier for how fast charge accrues relative to fire rate', category: 'utility', upgradeWeight: 0.3 },
        { id: 'maxCharge', name: 'Max Charge', baseValue: 8, description: 'Maximum stored projectiles from charging', category: 'utility', upgradeWeight: 0.4 }
    ];
    baseStats.forEach(def => { if (!player.statSystem.hasStat(def.id)) player.statSystem.registerStat(def); });

    player.healthComponent = new HealthComponent(player.statSystem.getStatValue('maxHealth') || 100);
    player.movementComponent = new MovementComponent(player.statSystem.getStatValue('speed') || 3);
    player.movementComponent.setPosition(400, 500);
    player.x = player.movementComponent.position.x;
    player.y = player.movementComponent.position.y;

    player.weaponComponent = new WeaponComponent(player.weaponComponent?.weaponFactory || new (player.weaponComponent?.constructor || (function(){}))(), 'single', { damage: 1, fireRate: player.statSystem.getStatValue('fireRate') || 150 });
    player.chargeComponent = new ChargeComponent({
        maxChargeTime: 5000,
        maxStoredShots: player.statSystem.getStatValue('maxCharge') || 8,
        chargeRate: 1,
        statSystem: player.statSystem
    });
    player.weaponComponent.chargeComponent = player.chargeComponent;

    if (!player.statsComponent) player.statsComponent = new PlayerStatsComponent();
    player.alive = true;
    player.statsComponent.setInvulnerable(false);

    if (player.chargeComponent) player.chargeComponent.reset();

    if (window.gameInstance && window.gameInstance.gameState) {
        window.gameInstance.gameState.maxHealth = player.statSystem.getStatValue('maxHealth');
        window.gameInstance.gameState.health = player.healthComponent.currentHealth;
        window.gameInstance.gameState.currency = 0;
    }
}