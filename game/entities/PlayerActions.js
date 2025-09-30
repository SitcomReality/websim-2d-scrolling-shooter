import StatSystem from '../systems/StatSystem.js';
import { PlayerStatsComponent } from '../components/PlayerStatsComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';

export function handlePlayerDamage(player, amount) {
    if (player.statsComponent && player.statsComponent.isInvulnerable()) return false;
    const died = player.healthComponent.takeDamage(amount);
    if (died) player.alive = false;
    if (window.gameInstance && window.gameInstance.gameState) {
        window.gameInstance.gameState.health = player.healthComponent.currentHealth;
        window.gameInstance.gameState.maxHealth = player.healthComponent.maxHealth;
    }
    return died;
}

export function healPlayer(player, amount) {
    player.healthComponent.heal(amount);
    if (window.gameInstance && window.gameInstance.gameState) {
        window.gameInstance.gameState.health = player.healthComponent.currentHealth;
    }
}

export function setPlayerMaxHealth(player, newMax) {
    player.healthComponent.setMaxHealth(newMax);
    if (window.gameInstance && window.gameInstance.gameState) {
        window.gameInstance.gameState.maxHealth = player.healthComponent.maxHealth;
        window.gameInstance.gameState.health = player.healthComponent.currentHealth;
    }
}

