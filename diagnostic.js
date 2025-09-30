// Diagnostic tool to find import errors
const fs = require('fs');
const path = require('path');

// Define the expected file structure based on architecture.md
const expectedStructure = {
    '/game/Game.js': {
        imports: {
            '../engine/GameEngine.js': 'exists',
            '../entities/Player.js': 'exists',
            './systems/EnemySpawner.js': 'exists',
            '../systems/InputHandler.js': 'exists',
            '../systems/CollisionSystem.js': 'exists',
            '../systems/ParticleSystem.js': 'exists',
            './systems/PowerUpSystem.js': 'exists',
            './upgrades/UpgradeSystem.js': 'exists',
            './managers/UIManager.js': 'exists',
            './GameState.js': 'exists',
            './managers/GameLoopManager.js': 'exists',
            './managers/SidePanelManager.js': 'exists',
            './managers/LevelUpManager.js': 'exists',
            './weapons/WeaponFactory.js': 'exists',
            './upgrades/types/WeaponUnlockUpgrade.js': 'exists',
            './systems/MovementSystem.js': 'exists',
            './systems/UtilitySystem.js': 'exists',
            './upgrades/types/MovementUpgrade.js': 'exists',
            './upgrades/types/UtilityUpgrade.js': 'exists',
            './upgrades/types/LuckUpgrade.js': 'exists',
            '../systems/SynergySystem.js': 'exists'
        }
    },
    '/game/entities/Player.js': {
        imports: {
            './Entity.js': 'exists',
            '../components/HealthComponent.js': 'exists',
            '../components/MovementComponent.js': 'exists',
            '../components/WeaponComponent.js': 'exists',
            '../components/PlayerStatsComponent.js': 'exists'
        }
    }
};

// Function to scan imports in a file
function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
        const imports = [];
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        return imports;
    } catch (error) {
        return [];
    }
}

// Function to check if a path exists
function checkPath(basePath, importPath) {
    const fullPath = path.join(basePath, importPath);
    const altPath = path.join(basePath, importPath + '.js');

    return fs.existsSync(fullPath) || fs.existsSync(altPath);
}

// Main diagnostic function
function runDiagnostics() {
    console.log('=== IMPORT PATH DIAGNOSTICS ===\n');

    const baseDir = process.cwd();
    let errorCount = 0;
    let warningCount = 0;

    // Check Game.js
    const gamePath = path.join(baseDir, 'game', 'Game.js');
    if (fs.existsSync(gamePath)) {
        const imports = scanFile(gamePath);
        console.log('Checking game/Game.js:');

        imports.forEach(importPath => {
            const exists = checkPath(path.dirname(gamePath), importPath);
            if (!exists) {
                console.log(`  ❌ ${importPath} - NOT FOUND`);
                errorCount++;

                // Suggest fix
                const suggestions = {
                    './LevelUpManager': './managers/LevelUpManager.js',
                    './SidePanelManager': './managers/SidePanelManager.js',
                    './GameLoopManager': './managers/GameLoopManager.js',
                    './UIManager': './managers/UIManager.js',
                    './WeaponFactory': './weapons/WeaponFactory.js',
                    './UpgradeSystem': './upgrades/UpgradeSystem.js',
                    './GameState': './GameState.js'
                };

                if (suggestions[importPath]) {
                    console.log(`     💡 Suggested fix: Change to '${suggestions[importPath]}'`);
                }
            } else {
                console.log(`  ✅ ${importPath}`);
            }
        });
    }

    // Check Player.js
    const playerPath = path.join(baseDir, 'game', 'entities', 'Player.js');
    if (fs.existsSync(playerPath)) {
        const imports = scanFile(playerPath);
        console.log('\nChecking game/entities/Player.js:');

        imports.forEach(importPath => {
            const exists = checkPath(path.dirname(playerPath), importPath);
            if (!exists) {
                console.log(`  ❌ ${importPath} - NOT FOUND`);
                errorCount++;

                const suggestions = {
                    './components/HealthComponent': '../components/HealthComponent.js',
                    './components/MovementComponent': '../components/MovementComponent.js',
                    './components/WeaponComponent': '../components/WeaponComponent.js',
                    './components/PlayerStatsComponent': '../components/PlayerStatsComponent.js'
                };

                if (suggestions[importPath]) {
                    console.log(`     💡 Suggested fix: Change to '${suggestions[importPath]}'`);
                }
            } else {
                console.log(`  ✅ ${importPath}`);
            }
        });
    }

    console.log(`\n=== DIAGNOSTICS COMPLETE ===`);
    console.log(`Errors found: ${errorCount}`);
    console.log(`Warnings: ${warningCount}`);

    if (errorCount > 0) {
        console.log('\n🔧 To fix these errors:');
        console.log('1. Update the import paths in the files mentioned above');
        console.log('2. Use the suggested fixes provided');
        console.log('3. Run this diagnostic again to verify fixes');
    }
}

// Run diagnostics if this file is executed directly
if (require.main === module) {
    runDiagnostics();
}

module.exports = { runDiagnostics, scanFile, checkPath };