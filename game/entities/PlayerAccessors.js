// Centralized getters/setters that map to statSystem and components
export const playerGettersSetters = {
    install(proto) {
        Object.defineProperty(proto, 'health', {
            get() { return this.healthComponent.currentHealth; },
            set(v) { this.healthComponent.currentHealth = v; if (window.gameInstance && window.gameInstance.gameState) window.gameInstance.gameState.health = v; }
        });

        Object.defineProperty(proto, 'maxHealth', {
            get() { return this.statSystem.getStatValue('maxHealth'); },
            set(v) { this.statSystem.setBaseValue('maxHealth', v); this.healthComponent.setMaxHealth(this.statSystem.getStatValue('maxHealth')); if (window.gameInstance && window.gameInstance.gameState) { window.gameInstance.gameState.maxHealth = this.statSystem.getStatValue('maxHealth'); } }
        });

        Object.defineProperty(proto, 'speed', {
            get() { return this.statSystem.getStatValue('speed'); },
            set(v) { this.statSystem.setBaseValue('speed', v); if (this.movementComponent) { this.movementComponent.baseSpeed = v; this.movementComponent.currentSpeed = v; } }
        });

        Object.defineProperty(proto, 'damage', {
            get() { return this.statSystem.getStatValue('damage'); },
            set(v) { this.statSystem.setBaseValue('damage', v); }
        });

        Object.defineProperty(proto, 'fireRate', {
            get() { return this.statSystem.getStatValue('fireRate'); },
            set(v) { this.statSystem.setBaseValue('fireRate', v); try { if (this.weaponComponent && this.weaponComponent.currentWeapon) this.weaponComponent.currentWeapon.fireRate = v; } catch(e){} }
        });

        Object.defineProperty(proto, 'healthPickupChance', {
            get() { return this.statsComponent.getHealthPickupChance(); },
            set(v) { this.statsComponent.increaseHealthPickupChance(v - this.statsComponent.getHealthPickupChance()); }
        });

        Object.defineProperty(proto, 'healthPickupAmount', {
            get() { return this.statsComponent.getHealthPickupAmount(); },
            set(v) { this.statsComponent.increaseHealthPickupAmount(v - this.statsComponent.getHealthPickupAmount()); }
        });

        Object.defineProperty(proto, 'invulnerable', {
            get() { return this.statsComponent.isInvulnerable(); },
            set(v) { this.statsComponent.setInvulnerable(v); }
        });

        Object.defineProperty(proto, 'criticalChance', {
            get() { return this.statSystem.getStatValue('criticalChance'); },
            set(v) { this.statSystem.setBaseValue('criticalChance', v); }
        });

        Object.defineProperty(proto, 'criticalDamage', {
            get() { return this.statSystem.getStatValue('criticalDamage'); },
            set(v) { this.statSystem.setBaseValue('criticalDamage', v); }
        });

        Object.defineProperty(proto, 'lifesteal', {
            get() { return this.statSystem.getStatValue('lifesteal'); },
            set(v) { this.statSystem.setBaseValue('lifesteal', v); }
        });
    }
};

export default playerGettersSetters;