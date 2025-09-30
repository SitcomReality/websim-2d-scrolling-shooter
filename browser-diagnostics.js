// Browser-based diagnostic tool
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
    
    // Check common import patterns
    const checks = [
        { name: 'Player', path: 'entities/Player.js', expected: 'Player class' },
        { name: 'Enemy', path: 'entities/Enemy.js', expected: 'Enemy class' },
        { name: 'Entity', path: 'entities/Entity.js', expected: 'Entity base class' },
        { name: 'BaseWeapon', path: 'weapons/BaseWeapon.js', expected: 'BaseWeapon class' },
        { name: 'BaseUpgrade', path: 'upgrades/BaseUpgrade.js', expected: 'BaseUpgrade class' }
    ];
    
    checks.forEach(check => {
        try {
            // This is a simplified check - in reality you'd need to examine the actual imports
            console.log(`ℹ️  ${check.name}: Manual check required for ${check.path}`);
        } catch (e) {
            console.error(`❌ ${check.name}: ${e.message}`);
            errors.push(`${check.name} check failed: ${e.message}`);
        }
    });
    
    console.log('\n=== QUICK FIX GUIDE ===');
    console.log('Common import fixes needed:');
    console.log('');
    console.log('In game/Game.js:');
    console.log("  Change: import { LevelUpManager } from './LevelUpManager';");
    console.log("  To:     import { LevelUpManager } from './managers/LevelUpManager.js';");
    console.log('');
    console.log('In entities/Player.js:');
    console.log("  Change: import { HealthComponent } from './components/HealthComponent';");
    console.log("  To:     import { HealthComponent } from '../game/components/HealthComponent.js';");
    console.log('');
    
    console.log(`\n=== DIAGNOSTICS COMPLETE ===`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
        console.log('\n🔧 Check console for detailed error messages');
    }
    
    return { errors, warnings };
};

// Auto-run diagnostics when page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('💡 Run window.runImportDiagnostics() in console for detailed diagnostics');
    }, 1000);
});