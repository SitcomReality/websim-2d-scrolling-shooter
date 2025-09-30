import { Game } from './Game.js';
import { runImportDiagnostics } from '../browser-diagnostics.js';

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🎮 Initializing game...');
        window.gameInstance = new Game();
        console.log('✅ Game initialized successfully');
        
        // Run diagnostics after a short delay to catch any late import errors
        setTimeout(() => {
            console.log('🔍 Running post-initialization diagnostics...');
            const diagnostics = runImportDiagnostics();
            if (diagnostics.errors.length === 0) {
                console.log('🎉 All systems operational!');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        console.error('📍 Stack:', error.stack);
        
        // Log to localStorage for debugging
        const errorLog = localStorage.getItem('gameErrorLog') || '';
        const newLog = `${errorLog}\n[${new Date().toISOString()}] Game init failed: ${error.message}\n${error.stack}`;
        localStorage.setItem('gameErrorLog', newLog);
        
        // Show user-friendly error
        document.body.innerHTML = `
            <div style="color: red; padding: 20px; font-family: monospace; background: #000; min-height: 100vh;">
                <h2>🎮 Game Initialization Failed</h2>
                <p><strong>Error:</strong> ${error.message}</p>
                <details style="margin-top: 10px;">
                    <summary>Technical Details</summary>
                    <pre style="font-size: 12px; overflow-x: auto;">${error.stack}</pre>
                </details>
                <p style="margin-top: 20px;">
                    <strong>💡 Suggestions:</strong>
                </p>
                <ul>
                    <li>Check browser console for detailed import errors</li>
                    <li>Run <code>window.runImportDiagnostics()</code> in console</li>
                    <li>Verify all JavaScript files are accessible</li>
                    <li>Check network tab for 404 errors</li>
                </ul>
                <button onclick="window.runImportDiagnostics()" style="margin-top: 10px; padding: 10px; background: #ff0000; color: white; border: none; cursor: pointer;">
                    Run Diagnostics
                </button>
            </div>
        `;
    }
});

// Global error handler for import errors
window.addEventListener('error', (event) => {
    const error = event.error;
    if (error && error.message && error.message.includes('import')) {
        console.error('🚨 Import Error Detected:', error.message);
        
        // Try to extract module path from error
        const match = error.message.match(/import .* from ['"](.*)['"]/);
        if (match) {
            const missingModule = match[1];
            console.error(`📍 Missing module: ${missingModule}`);
            suggestFix(missingModule);
        }
        
        // Show diagnostic suggestion
        console.log('💡 Run window.runImportDiagnostics() for detailed analysis');
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
        console.error(`💡 Suggested fix: Change import from '${missingModule}' to '${suggestion}'`);
    } else {
        console.error(`🔍 Unknown module path. Check if ${missingModule} exists in the project structure.`);
    }
}

// Export for use in other modules
export { suggestFix };