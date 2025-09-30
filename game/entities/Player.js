import { Entity } from '../entities/Entity.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { MovementComponent } from '../components/MovementComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { PlayerStatsComponent } from '../components/PlayerStatsComponent.js';
import ChargeComponent from '../components/ChargeComponent.js';
import StatSystem from '../systems/StatSystem.js';

export class Player extends Entity {
    constructor(x, y, weaponFactory) {
        super(x, y, 40, 40);

        // Initialize stat system (new)
        this.statSystem = new StatSystem();

        // Register core baseline stats
        this.statSystem.registerStat({
            id: 'maxHealth',
            name: 'Max Health',
            baseValue: 100,
            description: 'Maximum health',
            category: 'defensive',
            upgradeWeight: 0.8
        });
        this.statSystem.registerStat({
            id: 'health',
            name: 'Health',
            baseValue: 100,
            description: 'Current health (managed by healthComponent)',
            category: 'defensive',
            upgradeWeight: 0
        });
        this.statSystem.registerStat({
            id: 'damage',
            name: 'Damage',
            baseValue: 1,
            description: 'Bullet damage',
            category: 'offensive',
            upgradeWeight: 0.9
        });
        this.statSystem.registerStat({
            id: 'speed',
            name: 'Speed',
            baseValue: 3,
            description: 'Movement speed',
            category: 'mobility',
            upgradeWeight: 0.7
        });
        this.statSystem.registerStat({
            id: 'fireRate',
            name: 'Fire Rate',
            baseValue: 50,
            description: 'Milliseconds between shots',
            category: 'offensive',
            upgradeWeight: 0.6
        });
        this.statSystem.registerStat({
            id: 'criticalChance',
            name: 'Critical Chance',
            baseValue: 0.1,
            description: 'Chance to deal critical damage',
            category: 'offensive',
            upgradeWeight: 0.4
        });
        this.statSystem.registerStat({
            id: 'criticalDamage',
            name: 'Critical Damage',
            baseValue: 0.5,
            description: 'Extra damage multiplier on crit',
            category: 'offensive',
            upgradeWeight: 0.4
        });
        this.statSystem.registerStat({
            id: 'luck',
            name: 'Luck',
            baseValue: 1.0,
            description: 'Affects upgrade quality and reroll cost',
            category: 'utility',
            upgradeWeight: 0.5
        });
        this.statSystem.registerStat({
            id: 'lifesteal',
            name: 'Lifesteal',
            baseValue: 0,
            description: 'Fraction of damage healed on hit',
            category: 'defensive',
            upgradeWeight: 0.2
        });

        // NEW: charging stats (moved from accidental file into entities/Player)
        this.statSystem.registerStat({
            id: 'chargeSpeed',
            name: 'Charge Speed',
            baseValue: 1.0,
            description: 'Multiplier for how fast charge accrues relative to fire rate',
            category: 'utility',
            upgradeWeight: 0.3
        });
        this.statSystem.registerStat({
            id: 'maxCharge',
            name: 'Max Charge',
            baseValue: 8,
            description: 'Maximum stored projectiles from charging',
            category: 'utility',
            upgradeWeight: 0.4
        });

        // Initialize components
        this.healthComponent = new HealthComponent(100);
        // Use StatSystem as single source of truth for base values
        this.movementComponent = new MovementComponent(this.statSystem.getStatValue('speed') || 3);
        this.weaponComponent = new WeaponComponent(weaponFactory, 'single', { damage: 1, fireRate: this.statSystem.getStatValue('fireRate') || 150 });
        this.statsComponent = new PlayerStatsComponent();

        // Charge component — derive parameters from statSystem (chargeSpeed & maxCharge)
        this.chargeComponent = new ChargeComponent({
            maxChargeTime: 5000,
            maxStoredShots: this.statSystem.getStatValue('maxCharge') || 5,
            chargeRate: 1,
            statSystem: this.statSystem
        });

        // Wire weapon component's charge component to the player's so upgrades can modify centrally
        // (weapon component already instantiates its own ChargeComponent; keep player component as authoritative)
        this.weaponComponent.chargeComponent = this.chargeComponent;

        // Set initial position
        this.movementComponent.setPosition(x, y);

        // Ensure entity position matches movement component immediately
        this.x = this.movementComponent.position.x;
        this.y = this.movementComponent.position.y;

        // Visual properties
        this.color = '#00ffff';

        // Keep gameState in sync with statSystem values where appropriate
        // initialize values
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.maxHealth = this.statSystem.getStatValue('maxHealth');
            window.gameInstance.gameState.health = this.healthComponent.currentHealth;
        }
    }

    update(deltaTime, inputState) {
        if (!this.statsComponent.isInvulnerable()) {
            this.movementComponent.update(deltaTime, inputState);
            this.weaponComponent.update(deltaTime, inputState, this.movementComponent.position);
        }

        // Always update bullets (weaponComponent handles this)
        // this.weaponComponent.update(deltaTime, inputState, this.movementComponent.position); // already called above

        // Update entity position from movement component
        this.x = this.movementComponent.position.x;
        this.y = this.movementComponent.position.y;

        // Spawn suction particles while charging to provide visual feedback
        try {
            if (this.chargeComponent && this.chargeComponent.isCharging && this.chargeComponent.isCharging()) {
                const progress = this.chargeComponent.getChargeProgress ? this.chargeComponent.getChargeProgress() : 0.0;
                const intensity = Math.min(1, Math.max(0, progress)); // 0..1
                if (window.gameInstance && window.gameInstance.particleSystem) {
                    // throttle spawn frequency by only spawning occasionally based on timestamp
                    const now = Date.now();
                    this._lastSuctionSpawn = this._lastSuctionSpawn || 0;
                    const spawnInterval = 80 - Math.round(60 * intensity); // more intense = more frequent
                    if (now - this._lastSuctionSpawn > spawnInterval) {
                        window.gameInstance.particleSystem.createSuction(this.x, this.y - 6, intensity);
                        this._lastSuctionSpawn = now;
                    }
                }
            }
        } catch (e) {
            // Fail silently to avoid breaking game if particle system not present
            // console.warn('Suction particle spawn failed', e);
        }
    }

    takeDamage(amount) {
        if (this.statsComponent.isInvulnerable()) return false;

        const died = this.healthComponent.takeDamage(amount);
        if (died) {
            this.alive = false;
        }

        // Update game state
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.health = this.healthComponent.currentHealth;
            window.gameInstance.gameState.maxHealth = this.healthComponent.maxHealth;
        }

        return died;
    }

    heal(amount) {
        this.healthComponent.heal(amount);

        // Update game state
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.health = this.healthComponent.currentHealth;
        }
    }

    setMaxHealth(newMax) {
        this.healthComponent.setMaxHealth(newMax);

        // Update game state
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.maxHealth = this.healthComponent.maxHealth;
            window.gameInstance.gameState.health = this.healthComponent.currentHealth;
        }
    }

    increaseDamage(amount) {
        this.weaponComponent.increaseDamage(amount);
    }

    setFireRateMultiplier(multiplier) {
        this.weaponComponent.setFireRateMultiplier(multiplier);
    }

    increaseSpeed(amount) {
        this.movementComponent.increaseSpeed(amount);
    }

    increaseHealthPickupChance(amount) {
        this.statsComponent.increaseHealthPickupChance(amount);
    }

    increaseHealthPickupAmount(amount) {
        this.statsComponent.increaseHealthPickupAmount(amount);
    }

    setInvulnerable(value) {
        this.statsComponent.setInvulnerable(value);
    }

    // Getters/setters now backed by statSystem where appropriate
    get health() { return this.healthComponent.currentHealth; }
    set health(value) { 
        this.healthComponent.currentHealth = value;
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.health = value;
        }
    }

    get maxHealth() { return this.statSystem.getStatValue('maxHealth'); }
    set maxHealth(value) { 
        this.statSystem.setBaseValue('maxHealth', value);
        this.healthComponent.setMaxHealth(this.statSystem.getStatValue('maxHealth'));
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.maxHealth = this.statSystem.getStatValue('maxHealth');
        }
    }

    get speed() { return this.statSystem.getStatValue('speed'); }
    set speed(value) { this.statSystem.setBaseValue('speed', value); if (this.movementComponent) { this.movementComponent.baseSpeed = value; this.movementComponent.currentSpeed = value; } }

    get damage() { return this.statSystem.getStatValue('damage'); }
    set damage(value) { this.statSystem.setBaseValue('damage', value); }

    get fireRate() { return this.statSystem.getStatValue('fireRate'); }
    set fireRate(value) { 
        this.statSystem.setBaseValue('fireRate', value);
        // propagate to weapon instance (fireRate is ms between shots)
        try { if (this.weaponComponent && this.weaponComponent.currentWeapon) this.weaponComponent.currentWeapon.fireRate = value; } catch(e){}
    }

    get healthPickupChance() { return this.statsComponent.getHealthPickupChance(); }
    set healthPickupChance(value) { this.statsComponent.increaseHealthPickupChance(value - this.statsComponent.getHealthPickupChance()); }

    get healthPickupAmount() { return this.statsComponent.getHealthPickupAmount(); }
    set healthPickupAmount(value) { this.statsComponent.increaseHealthPickupAmount(value - this.statsComponent.getHealthPickupAmount()); }

    get invulnerable() { return this.statsComponent.isInvulnerable(); }
    set invulnerable(value) { this.statsComponent.setInvulnerable(value); }

    getBullets() {
        return this.weaponComponent.getBullets();
    }

    render(ctx) {
        // Render player ship
        ctx.save();

        if (this.statsComponent.isInvulnerable()) {
            const flash = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.globalAlpha = 0.7 + flash * 0.3;
        }

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 20);
        ctx.lineTo(this.x - 20, this.y + 20);
        ctx.lineTo(this.x, this.y + 10);
        ctx.lineTo(this.x + 20, this.y + 20);
        ctx.closePath();
        ctx.fill();

        // Show charge indicator when charging
        if (this.weaponComponent.isCharging && this.weaponComponent.chargedBullets > 0) {
            const chargeRatio = Math.min((Date.now() - this.weaponComponent.chargeStartTime) / this.weaponComponent.maxChargeTime, 1);
            const radius = 20 + chargeRatio * 10;
            const alpha = 0.3 + chargeRatio * 0.4;

            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Show bullet count
            ctx.fillStyle = '#00ffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.weaponComponent.chargedBullets, this.x, this.y + 5);
        }

        ctx.restore();

        // Render bullets via weapon component (handles both weapon instances and fallback bullets)
        this.weaponComponent.render(ctx);
        
        // Charge indicator - commented out until charging weapon system is restored
        /*
        if (this.weaponComponent.isCharging && this.weaponComponent.chargedBullets > 0) {
            const chargeRatio = Math.min((Date.now() - this.weaponComponent.chargeStartTime) / this.weaponComponent.maxChargeTime, 1);
            const radius = 20 + chargeRatio * 10;
            const alpha = 0.3 + chargeRatio * 0.4;

            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Show bullet count
            ctx.fillStyle = '#00ffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.weaponComponent.chargedBullets, this.x, this.y + 5);
        }
        */
    }

    reset() {
        // Reset position and basic components
        this.x = 400;
        this.y = 500;

        // Recreate stat system to ensure no leftover modifiers or registered shop stats remain
        this.statSystem = new StatSystem();
        // Re-register baseline stats (keep consistent with constructor defaults)
        this.statSystem.registerStat({ id: 'maxHealth', name: 'Max Health', baseValue: 100, description: 'Maximum health', category: 'defensive', upgradeWeight: 0.8 });
        this.statSystem.registerStat({ id: 'health', name: 'Health', baseValue: 100, description: 'Current health (managed by healthComponent)', category: 'defensive', upgradeWeight: 0 });
        this.statSystem.registerStat({ id: 'damage', name: 'Damage', baseValue: 1, description: 'Bullet damage', category: 'offensive', upgradeWeight: 0.9 });
        this.statSystem.registerStat({ id: 'speed', name: 'Speed', baseValue: 3, description: 'Movement speed', category: 'mobility', upgradeWeight: 0.7 });
        this.statSystem.registerStat({ id: 'fireRate', name: 'Fire Rate', baseValue: 50, description: 'Milliseconds between shots', category: 'offensive', upgradeWeight: 0.6 });
        this.statSystem.registerStat({ id: 'criticalChance', name: 'Critical Chance', baseValue: 0.1, description: 'Chance to deal critical damage', category: 'offensive', upgradeWeight: 0.4 });
        this.statSystem.registerStat({ id: 'criticalDamage', name: 'Critical Damage', baseValue: 0.5, description: 'Extra damage multiplier on crit', category: 'offensive', upgradeWeight: 0.4 });
        this.statSystem.registerStat({ id: 'luck', name: 'Luck', baseValue: 1.0, description: 'Affects upgrade quality and reroll cost', category: 'utility', upgradeWeight: 0.5 });
        this.statSystem.registerStat({ id: 'lifesteal', name: 'Lifesteal', baseValue: 0, description: 'Fraction of damage healed on hit', category: 'defensive', upgradeWeight: 0.2 });
        this.statSystem.registerStat({ id: 'chargeSpeed', name: 'Charge Speed', baseValue: 1.0, description: 'Multiplier for how fast charge accrues relative to fire rate', category: 'utility', upgradeWeight: 0.3 });
        this.statSystem.registerStat({ id: 'maxCharge', name: 'Max Charge', baseValue: 8, description: 'Maximum stored projectiles from charging', category: 'utility', upgradeWeight: 0.4 });

        // Recreate components to ensure clean state
        this.healthComponent = new HealthComponent(this.statSystem.getStatValue('maxHealth') || 100);
        this.movementComponent = new MovementComponent(this.statSystem.getStatValue('speed') || 3);
        this.movementComponent.setPosition(400, 500);
        this.x = this.movementComponent.position.x;
        this.y = this.movementComponent.position.y;

        // Recreate weapon and charge components and wire them
        this.weaponComponent = new WeaponComponent(this.weaponComponent?.weaponFactory || new (this.weaponComponent?.constructor || (function(){}))(), 'single', { damage: 1, fireRate: this.statSystem.getStatValue('fireRate') || 150 });
        this.chargeComponent = new ChargeComponent({
            maxChargeTime: 5000,
            maxStoredShots: this.statSystem.getStatValue('maxCharge') || 8,
            chargeRate: 1,
            statSystem: this.statSystem
        });
        this.weaponComponent.chargeComponent = this.chargeComponent;

        // Reset other small state
        if (!this.statsComponent) this.statsComponent = new PlayerStatsComponent();
        this.alive = true;
        this.statsComponent.setInvulnerable(false);

        // reset charge state
        if (this.chargeComponent) this.chargeComponent.reset();

        // Ensure UI/gameState sync
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.maxHealth = this.statSystem.getStatValue('maxHealth');
            window.gameInstance.gameState.health = this.healthComponent.currentHealth;
            window.gameInstance.gameState.currency = 0;
        }
    }
}