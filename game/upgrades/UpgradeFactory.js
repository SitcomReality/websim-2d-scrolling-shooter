import { HealthUpgrade } from './types/HealthUpgrade.js';
import { DamageUpgrade } from './types/DamageUpgrade.js';
import { SpeedUpgrade } from './types/SpeedUpgrade.js';
import { FireRateUpgrade } from './types/FireRateUpgrade.js';
import { HealthPickupChanceUpgrade } from './types/HealthPickupChanceUpgrade.js';
import { HealthPickupAmountUpgrade } from './types/HealthPickupAmountUpgrade.js';

export class UpgradeFactory {
    static createUpgrade(type, config = {}) {
        switch (type) {
            case 'health':
                return new HealthUpgrade(config);
            case 'damage':
                return new DamageUpgrade(config);
            case 'speed':
                return new SpeedUpgrade(config);
            case 'fireRate':
                return new FireRateUpgrade(config);
            case 'healthPickupChance':
                return new HealthPickupChanceUpgrade(config);
            case 'healthPickupAmount':
                return new HealthPickupAmountUpgrade(config);
            default:
                throw new Error(`Unknown upgrade type: ${type}`);
        }
    }
    
    static createFromData(data) {
        return this.createUpgrade(data.type, data.config);
    }
}

