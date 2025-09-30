import { Game } from './Game.js';

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.gameInstance = new Game();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        document.body.innerHTML = `
            <div style="color: red; padding: 20px; font-family: monospace;">
                <h2>Game Initialization Failed</h2>
                <p>${error.message}</p>
                <pre>${error.stack}</pre>
            </div>
        `;
    }
});

// Global error handler for import errors
window.addEventListener('error', (event) => {
    const error = event.error;
    if (error && error.message && error.message.includes('import')) {
        console.error('Import Error Detected:', error.message);
        
        // Try to extract module path from error
        const match = error.message.match(/import .* from ['"](.*)['"]/);
        if (match) {
            const missingModule = match[1];
            console.error(`Missing module: ${missingModule}`);
            suggestFix(missingModule);
        }
    }
});

function suggestFix(missingModule) {
    const suggestions = {
        // Common incorrect paths and their fixes
        './LevelUpManager': './managers/LevelUpManager.js',
        './SidePanelManager': './managers/SidePanelManager.js',
        './GameLoopManager': './managers/GameLoopManager.js',
        './UIManager': './managers/UIManager.js',
        './WeaponFactory': './weapons/WeaponFactory.js',
        './UpgradeSystem': './upgrades/UpgradeSystem.js',
        './GameState': './GameState.js',
        './InputHandler': '../systems/InputHandler.js',
        './CollisionSystem': '../systems/CollisionSystem.js',
        './ParticleSystem': '../systems/ParticleSystem.js',
        './SynergySystem': '../systems/SynergySystem.js',
        './Enemy': '../entities/Enemy.js',
        './Entity': '../entities/Entity.js',
        './Player': '../entities/Player.js',
        './BaseWeapon': '../weapons/BaseWeapon.js',
        './HealthComponent': './components/HealthComponent.js',
        './MovementComponent': './components/MovementComponent.js',
        './WeaponComponent': './components/WeaponComponent.js',
        './PlayerStatsComponent': './components/PlayerStatsComponent.js',
        './UtilityComponent': './components/UtilityComponent.js',
        './BaseUpgrade': './BaseUpgrade.js',
        './RerollSystem': './RerollSystem.js',
        './UpgradeGenerator': './UpgradeGenerator.js',
        './UpgradeCardCreator': './UpgradeCardCreator.js',
        './ProceduralUpgradeGenerator': './ProceduralUpgradeGenerator.js'
    };

    const suggestion = suggestions[missingModule];
    if (suggestion) {
        console.error(`Suggested fix: Change import from '${missingModule}' to '${suggestion}'`);
    } else {
        console.error(`Unknown module path. Check if ${missingModule} exists in the project structure.`);
    }
}