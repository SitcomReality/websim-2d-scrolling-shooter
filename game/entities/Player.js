import { Entity } from '../entities/Entity.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { MovementComponent } from '../components/MovementComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { PlayerStatsComponent } from '../components/PlayerStatsComponent.js';
import ChargeComponent from '../components/ChargeComponent.js';
import StatSystem from '../systems/StatSystem.js';
import { initializePlayer } from './PlayerSetup.js';
import { handlePlayerDamage, healPlayer, setPlayerMaxHealth } from './PlayerActions.js';
import { playerGettersSetters } from './PlayerAccessors.js';
import { renderPlayer } from './PlayerRender.js';
import { resetPlayerState } from './PlayerReset.js';

export class Player extends Entity {
    constructor(x, y, weaponFactory) {
        super(x, y, 40, 40);

        // Delegate heavy initialization to PlayerSetup for clarity and testability
        initializePlayer(this, x, y, weaponFactory);
    }

    update(deltaTime, inputState) {
        if (!this.statsComponent.isInvulnerable()) {
            this.movementComponent.update(deltaTime, inputState);
            this.weaponComponent.update(deltaTime, inputState, this.movementComponent.position);
        }

        // Update entity position from movement component
        this.x = this.movementComponent.position.x;
        this.y = this.movementComponent.position.y;

        // suction particles while charging
        try {
            if (this.chargeComponent && this.chargeComponent.isCharging && this.chargeComponent.isCharging()) {
                const progress = this.chargeComponent.getChargeProgress ? this.chargeComponent.getChargeProgress() : 0.0;
                const intensity = Math.min(1, Math.max(0, progress)); // 0..1
                if (window.gameInstance && window.gameInstance.particleSystem) {
                    const now = Date.now();
                    this._lastSuctionSpawn = this._lastSuctionSpawn || 0;
                    const spawnInterval = 80 - Math.round(60 * intensity);
                    if (now - this._lastSuctionSpawn > spawnInterval) {
                        window.gameInstance.particleSystem.createSuction(this.x, this.y - 6, intensity);
                        this._lastSuctionSpawn = now;
                    }
                }
            }
        } catch (e) {
            // Fail silently
        }
    }

    // Delegate damage/heal/max health operations
    takeDamage(amount) { return handlePlayerDamage(this, amount); }
    heal(amount) { return healPlayer(this, amount); }
    setMaxHealth(newMax) { return setPlayerMaxHealth(this, newMax); }

    // Accessors delegated to small module
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
        // propagate to weapon instance (weapon.fireRate expects ms between shots)
        try { 
            if (this.weaponComponent && this.weaponComponent.currentWeapon) {
                const ms = Math.max(1, Math.floor(1000 / value));
                this.weaponComponent.currentWeapon.fireRate = ms;
            } 
        } catch(e){}
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

    render(ctx) { return renderPlayer(this, ctx); }

    reset() { return resetPlayerState(this); }
}

// Install accessors onto Player prototype (single place so imports succeed)
import playerAccessors from './PlayerAccessors.js';
playerAccessors.install(Player.prototype);