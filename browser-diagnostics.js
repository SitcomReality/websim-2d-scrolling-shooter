// Enhanced browser diagnostic tool with better integration
window.runImportDiagnostics = function() {
    console.clear();
    console.log('=== BROWSER IMPORT DIAGNOSTICS ===\n');
    
    const errors = [];
    const warnings = [];
    
    // Check if Game is available
    try {
        if (typeof Game === 'undefined') {
            console.error('❌ Game class not found - check game/Game.js imports');
            errors.push('Game class import failed');
        } else {
            console.log('✅ Game class found');
        }
    } catch (e) {
        console.error('❌ Error accessing Game:', e.message);
        errors.push('Game class error: ' + e.message);
    }
    
    // Check if gameInstance is available
    try {
        if (typeof window.gameInstance === 'undefined') {
            console.warn('⚠️  window.gameInstance not found - game may not be initialized');
            warnings.push('Game instance not initialized');
        } else {
            console.log('✅ Game instance found');
        }
    } catch (e) {
        console.error('❌ Error accessing gameInstance:', e.message);
        errors.push('Game instance error: ' + e.message);
    }
    
    // Check for common import errors
    const importChecks = [
        { name: 'Player', path: 'game/entities/Player.js' },
        { name: 'Enemy', path: 'game/systems/EnemySpawner.js' },
        { name: 'UpgradeSystem', path: 'game/upgrades/UpgradeSystem.js' },
        { name: 'UIManager', path: 'game/managers/UIManager.js' },
        { name: 'GameState', path: 'game/GameState.js' }
    ];
    
    importChecks.forEach(check => {
        try {
            // Check if the module loaded successfully by testing key classes
            let found = false;
            
            switch(check.name) {
                case 'Player':
                    found = typeof window.gameInstance !== 'undefined' && window.gameInstance.player !== undefined;
                    break;
                case 'Enemy':
                    found = typeof window.gameInstance !== 'undefined' && window.gameInstance.enemySpawner !== undefined;
                    break;
                case 'UpgradeSystem':
                    found = typeof window.gameInstance !== 'undefined' && window.gameInstance.upgradeSystem !== undefined;
                    break;
                case 'UIManager':
                    found = typeof window.gameInstance !== 'undefined' && window.gameInstance.uiManager !== undefined;
                    break;
                case 'GameState':
                    found = typeof window.gameInstance !== 'undefined' && window.gameInstance.gameState !== undefined;
                    break;
            }
            
            if (found) {
                console.log(`✅ ${check.name}: Module loaded`);
            } else {
                console.warn(`⚠️  ${check.name}: Module may have import issues`);
                warnings.push(`${check.name} module check failed`);
            }
        } catch (e) {
            console.error(`❌ ${check.name}: ${e.message}`);
            errors.push(`${check.name} error: ${e.message}`);
        }
    });
    
    console.log('\n=== QUICK FIX GUIDE ===');
    console.log('Common import fixes needed:');
    console.log('');
    console.log('In game/Game.js:');
    console.log("  Change: import { LevelUpManager } from './LevelUpManager';");
    console.log("  To:     import { LevelUpManager } from './managers/LevelUpManager.js';");
    console.log('');
    console.log('In game/entities/Player.js:');
    console.log("  Change: import { HealthComponent } from './components/HealthComponent';");
    console.log("  To:     import { HealthComponent } from '../components/HealthComponent.js';");
    console.log('');
    
    console.log(`\n=== DIAGNOSTICS COMPLETE ===`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
        console.log('\n🔧 Check console for detailed error messages');
        console.log('Run window.showDetailedDiagnostics() for more info');
    }
    
    return { errors, warnings, timestamp: Date.now() };
};

// Enhanced detailed diagnostics
window.showDetailedDiagnostics = function() {
    console.log('\n=== DETAILED IMPORT ANALYSIS ===');
    
    // Check for 404 errors in network requests
    if (window.performance && window.performance.getEntries) {
        const failedRequests = window.performance.getEntries()
            .filter(entry => entry.entryType === 'resource' && entry.responseStatus >= 400);
        
        if (failedRequests.length > 0) {
            console.log('Failed resource loads:');
            failedRequests.forEach(request => {
                console.error(`❌ ${request.name}: ${request.responseStatus} error`);
            });
        }
    }
    
    // Check for syntax errors in loaded scripts
    const scripts = document.querySelectorAll('script[type="module"]');
    scripts.forEach(script => {
        console.log(`📄 Module script: ${script.src || 'inline'}`);
    });
    
    // Check localStorage for any cached error logs
    const errorLog = localStorage.getItem('gameErrorLog');
    if (errorLog) {
        console.log('\n📋 Cached Error Log:');
        console.log(errorLog);
    }
};

// Clear error log
window.clearErrorLog = function() {
    localStorage.removeItem('gameErrorLog');
    console.log('✅ Error log cleared');
};

// Enhanced error handler
window.addEventListener('error', (event) => {
    console.error('❌ Global error caught:', event.message);
    console.error('📍 File:', event.filename);
    console.error('📍 Line:', event.lineno);
    console.error('📍 Error object:', event.error);
    
    // Log to localStorage for persistence
    const errorLog = localStorage.getItem('gameErrorLog') || '';
    const newLog = `${errorLog}\n[${new Date().toISOString()}] ${event.message} at ${event.filename}:${event.lineno}`;
    localStorage.setItem('gameErrorLog', newLog);
    
    // Check if it's an import error
    if (event.message.includes('import') || event.message.includes('module')) {
        console.error('🔧 This appears to be an import/module error!');
        console.error('Run window.runImportDiagnostics() for detailed diagnostics');
    }
});

// Promise rejection handler for import failures
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('import')) {
        console.error('❌ Import promise rejected:', event.reason.message);
        console.error('🔧 Run window.runImportDiagnostics() for help');
    }
});

// Auto-run diagnostics when page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('💡 Run window.runImportDiagnostics() in console for detailed diagnostics');
        console.log('💡 Run window.showDetailedDiagnostics() for network analysis');
        
        // Auto-run if in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🛠️  Development mode detected - running auto-diagnostics...');
            window.runImportDiagnostics();
        }
    }, 2000);
});

// Export for use in other modules
export { runImportDiagnostics, showDetailedDiagnostics };