import { HealthUpgrade } from './types/HealthUpgrade.js';
import { DamageUpgrade } from './types/DamageUpgrade.js';
import { SpeedUpgrade } from './types/SpeedUpgrade.js';
import { FireRateUpgrade } from './types/FireRateUpgrade.js';
import { HealthPickupChanceUpgrade } from './types/HealthPickupChanceUpgrade.js';
import { HealthPickupAmountUpgrade } from './types/HealthPickupAmountUpgrade.js';
import { MovementUpgrade } from './types/MovementUpgrade.js';
import { UtilityUpgrade } from './types/UtilityUpgrade.js';
import { LuckUpgrade } from './types/LuckUpgrade.js';
import { CriticalChanceUpgrade } from './types/CriticalChanceUpgrade.js';
import { CriticalDamageUpgrade } from './types/CriticalDamageUpgrade.js';
import { PiercingUpgrade } from './types/PiercingUpgrade.js';
import { ChainUpgrade } from './types/ChainUpgrade.js';
import { RicochetUpgrade } from './types/RicochetUpgrade.js';
import { UpgradeGenerator } from './UpgradeGenerator.js';
import { UpgradeCardCreator } from './UpgradeCardCreator.js';

export class UpgradeSystem {
    constructor(weaponFactory) {
        this.weaponFactory = weaponFactory;
        this.availableUpgrades = [
            new HealthUpgrade(),
            new DamageUpgrade(),
            new SpeedUpgrade(),
            new FireRateUpgrade(),
            new HealthPickupChanceUpgrade(),
            new HealthPickupAmountUpgrade(),
            new MovementUpgrade(),
            new UtilityUpgrade(),
            new LuckUpgrade(),
            new CriticalChanceUpgrade(),
            new CriticalDamageUpgrade(),
            new PiercingUpgrade(),
            new ChainUpgrade(),
            new RicochetUpgrade()
        ];

        this.playerUpgrades = new Map();
        this.rarityWeights = {
            common: 70,
            uncommon: 20,
            rare: 8,
            legendary: 2
        };

        // Initialize modular components
        this.upgradeGenerator = new UpgradeGenerator(this.rarityWeights);
        this.upgradeCardCreator = new UpgradeCardCreator();
    }

    generateUpgradeChoices(level, playerUpgrades, luck = 1.0) {
        return this.upgradeGenerator.generateUpgradeChoices(
            this.availableUpgrades,
            level, 
            playerUpgrades,
            luck
        );
    }

    applyUpgrade(upgradeChoice, player) {
        const { upgrade, rarity, values } = upgradeChoice;
        upgrade.apply(player, values);

        if (!this.playerUpgrades.has(upgrade.name)) {
            this.playerUpgrades.set(upgrade.name, { count: 0 });
        }
        this.playerUpgrades.get(upgrade.name).count++;
    }

    createUpgradeCard(choice, index) {
        return this.upgradeCardCreator.createUpgradeCard(choice, index);
    }
}