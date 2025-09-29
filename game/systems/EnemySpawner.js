import { Enemy } from '../entities/Enemy.js';

unlockEnemyTypes(playerLevel) {
    const unlockOrder = ['basic', 'fast', 'zigzag', 'tank'];
    
    // Calculate how many types should be unlocked
    const typesToUnlock = Math.min(playerLevel, unlockOrder.length);
    
    // Update unlocked types to include only up to the current level
    this.unlockedTypes = unlockOrder.slice(0, typesToUnlock);
}