import { BaseWeapon } from './BaseWeapon.js';
import { SingleShotWeapon } from './types/SingleShotWeapon.js';
import { BurstWeapon } from './types/BurstWeapon.js';
import { SpreadWeapon } from './types/SpreadWeapon.js';
import { RapidFireWeapon } from './types/RapidFireWeapon.js';
import { HomingWeapon } from './types/HomingWeapon.js';

export class WeaponFactory {
    static createWeapon(type, config = {}) {
        switch (type) {
            case 'single':
                return new SingleShotWeapon(config);
            case 'burst':
                return new BurstWeapon(config);
            case 'spread':
                return new SpreadWeapon(config);
            case 'rapid':
                return new RapidFireWeapon(config);
            case 'homing':
                return new HomingWeapon(config);
            default:
                return new SingleShotWeapon(config);
        }
    }

    static createFromData(data) {
        return this.createWeapon(data.type, data.config);
    }
}

