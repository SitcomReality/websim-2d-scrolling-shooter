import { BaseUpgrade } from '../BaseUpgrade.js';

export class WeaponUnlockUpgrade extends BaseUpgrade {
    constructor(config = {}) {
        super({
            id: 'weaponUnlock',
            name: 'New Weapon',
            description: 'Unlocks a new weapon type',
            icon: '🔫',
            maxLevel: 5,
            category: 'offensive',
            rarity: 'legendary',
            weaponTypes: config.weaponTypes || ['burst', 'spread', 'rapid', 'homing']
        });

        this.weaponTypes = config.weaponTypes || ['burst', 'spread', 'rapid', 'homing'];
    }

    apply(player, values) {
        // This upgrade unlocks new weapon types
        // The actual weapon switching logic would be handled by the game
        if (!player.unlockedWeapons) {
            player.unlockedWeapons = ['single'];
        }

        // Unlock the next weapon type
        const nextWeapon = this.weaponTypes.find(type => !player.unlockedWeapons.includes(type));
        if (nextWeapon) {
            player.unlockedWeapons.push(nextWeapon);
        }
    }

    getDescription(values) {
        const nextWeapon = this.weaponTypes.find(type => !player.unlockedWeapons || !player.unlockedWeapons.includes(type));
        return `Unlocks ${nextWeapon || 'new weapon'} type`;
    }

    canBeOffered(playerState, upgradeState) {
        const currentLevel = upgradeState.getUpgradeLevel(this.id);
        if (currentLevel >= this.maxLevel) return false;

        // Only offer if there are still weapons to unlock
        if (!playerState.unlockedWeapons) return true;
        return this.weaponTypes.some(type => !playerState.unlockedWeapons.includes(type));
    }
}