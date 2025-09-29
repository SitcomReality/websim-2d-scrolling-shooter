import { Entity } from './Entity.js';
import { HealthComponent } from '../player/components/HealthComponent.js';
import { WeaponComponent } from '../player/components/WeaponComponent.js';
import { MovementComponent } from '../player/components/MovementComponent.js';
import { BurstFireComponent } from '../player/components/BurstFireComponent.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.color = '#00ffff';
        this.invulnerable = false;

        // Initialize components
        this.healthComponent = new HealthComponent(this, 100);
        this.weaponComponent = new WeaponComponent(this);
        this.movementComponent = new MovementComponent(this);
        this.burstFireComponent = new BurstFireComponent(this);

        // Reference components for easy access
        this.health = this.healthComponent.currentHealth;
        this.maxHealth = this.healthComponent.maxHealth;
        this.damage = this.weaponComponent.damage;
        this.fireRate = this.weaponComponent.fireRate;
        this.speed = this.movementComponent.speed;
        this.healthPickupChance = 0.02;
        this.healthPickupAmount = 5;
    }

    update(deltaTime, inputState) {
        if (!this.invulnerable) {
            // Update movement
            this.movementComponent.update(deltaTime, inputState);

            // Handle weapon firing
            if (inputState.shoot) {
                this.burstFireComponent.startCharging();
            } else {
                if (this.burstFireComponent.isCharging && this.burstFireComponent.chargedBullets > 0) {
                    this.burstFireComponent.releaseBurst();
                } else if (!this.burstFireComponent.isCharging) {
                    // Normal continuous firing
                    if (this.weaponComponent.canFire()) {
                        this.weaponComponent.fire(this.x, this.y);
                    }
                }
                this.burstFireComponent.stopCharging();
            }

            // Update components
            this.weaponComponent.update(deltaTime);
            this.burstFireComponent.update(deltaTime);
        }

        // Sync health values
        this.health = this.healthComponent.currentHealth;
        this.maxHealth = this.healthComponent.maxHealth;
    }

    takeDamage(amount) {
        if (this.invulnerable) return false;
        return this.healthComponent.takeDamage(amount);
    }

    heal(amount) {
        this.healthComponent.heal(amount);
        this.health = this.healthComponent.currentHealth;
    }

    applyUpgrade(upgradeData) {
        // Apply upgrade to relevant components
        if (this.healthComponent) {
            this.healthComponent.applyUpgrade(upgradeData);
        }
        if (this.weaponComponent) {
            this.weaponComponent.applyUpgrade(upgradeData);
        }
        if (this.movementComponent) {
            this.movementComponent.applyUpgrade(upgradeData);
        }

        // Sync values
        this.damage = this.weaponComponent.damage;
        this.fireRate = this.weaponComponent.fireRate;
        this.speed = this.movementComponent.speed;
    }

    render(ctx) {
        ctx.save();

        if (this.invulnerable) {
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
        if (this.burstFireComponent.isCharging && this.burstFireComponent.chargedBullets > 0) {
            const chargeRatio = this.burstFireComponent.getChargeRatio();
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
            ctx.fillText(this.burstFireComponent.chargedBullets, this.x, this.y + 5);
        }

        ctx.restore();

        // Render weapon bullets
        this.weaponComponent.render(ctx);
    }

    reset() {
        this.x = 400;
        this.y = 500;
        this.alive = true;
        this.invulnerable = false;

        // Reset all components
        this.healthComponent.reset();
        this.weaponComponent.reset();
        this.movementComponent.reset();
        this.burstFireComponent.reset();

        // Sync values
        this.health = this.healthComponent.currentHealth;
        this.maxHealth = this.healthComponent.maxHealth;
        this.damage = this.weaponComponent.damage;
        this.fireRate = this.weaponComponent.fireRate;
        this.speed = this.movementComponent.speed;
    }

    getBullets() {
        return this.weaponComponent.getBullets();
    }
}