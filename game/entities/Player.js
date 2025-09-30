import { Entity } from '../entities/Entity.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { MovementComponent } from '../components/MovementComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { PlayerStatsComponent } from '../components/PlayerStatsComponent.js';

export class Player extends Entity {
    constructor(x, y, weaponFactory) {
        super(x, y, 40, 40);

        // Initialize components
        this.healthComponent = new HealthComponent(100);
        this.movementComponent = new MovementComponent(5);
        this.weaponComponent = new WeaponComponent(weaponFactory, 'single', { damage: 1, fireRate: 150 });
        this.statsComponent = new PlayerStatsComponent();

        // Set initial position
        this.movementComponent.setPosition(x, y);

        // Ensure entity position matches movement component immediately
        this.x = this.movementComponent.position.x;
        this.y = this.movementComponent.position.y;

        // Visual properties
        this.color = '#00ffff';
    }

    update(deltaTime, inputState) {
        if (!this.statsComponent.isInvulnerable()) {
            this.movementComponent.update(deltaTime, inputState);
            this.weaponComponent.update(deltaTime, inputState, this.movementComponent.position);
        }

        // Always update bullets
        this.weaponComponent.update(deltaTime, inputState, this.movementComponent.position);

        // Update entity position from movement component
        this.x = this.movementComponent.position.x;
        this.y = this.movementComponent.position.y;
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

    // Getters for backward compatibility
    get health() { return this.healthComponent.currentHealth; }
    set health(value) { 
        this.healthComponent.currentHealth = value;
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.health = value;
        }
    }

    get maxHealth() { return this.healthComponent.maxHealth; }
    set maxHealth(value) { 
        this.healthComponent.setMaxHealth(value);
        if (window.gameInstance && window.gameInstance.gameState) {
            window.gameInstance.gameState.maxHealth = value;
        }
    }

    get speed() { return this.movementComponent.currentSpeed; }
    set speed(value) { this.movementComponent.currentSpeed = value; }

    get damage() { return this.weaponComponent.damage; }
    set damage(value) { this.weaponComponent.damage = value; }

    get fireRate() { return this.weaponComponent.currentFireRate; }
    set fireRate(value) { this.weaponComponent.currentFireRate = value; }

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
        this.x = 400;
        this.y = 500;
        this.healthComponent = new HealthComponent(100);
        this.movementComponent.setPosition(400, 500);
        // Keep entity coordinates in sync with movement component
        this.x = this.movementComponent.position.x;
        this.y = this.movementComponent.position.y;
        this.weaponComponent.clearBullets();
        this.alive = true;
        this.statsComponent.setInvulnerable(false);
    }
}