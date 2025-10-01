# Stats System Architecture Analysis

## Executive Summary

Our stats system has evolved into a hybrid architecture where:
- **StatSystem** acts as the centralized registry and source of truth for stat values
- **Upgrade Types** (`/game/upgrades/types/`) apply modifications when selected
- **Components** and **Game Systems** are supposed to read from StatSystem but many don't

**The Core Problem:** Several stats are registered in StatSystem and modified by upgrades, but the game systems that should *consume* these stats either:
1. Don't read from StatSystem at all
2. Read from legacy player properties instead
3. Have no implementation to apply the stat's mechanical effect

## Working vs Non-Working Stats

### ✅ Working Stats (Properly Integrated)

1. **Max Health** (`maxHealth`)
   - ✅ Registered in StatSystem
   - ✅ Accessor in Player.js syncs with healthComponent
   - ✅ HealthComponent applies the value
   - ✅ Updates propagate to gameState
   
2. **Speed** (`speed`)
   - ✅ Registered in StatSystem
   - ✅ Accessor sets movementComponent.baseSpeed/currentSpeed
   - ✅ MovementSystem reads from component
   - ✅ Changes take effect immediately

3. **Fire Rate** (`fireRate`)
   - ✅ Registered in StatSystem as shots-per-second
   - ✅ Accessor converts to milliseconds for weapon
   - ✅ WeaponComponent.currentWeapon.fireRate updated
   - ✅ Shooting speed changes immediately

4. **Charge Speed & Max Charge** (`chargeSpeed`, `maxCharge`)
   - ✅ Registered in StatSystem
   - ✅ ChargeComponent reads via `_applyStatDerivedValues()`
   - ✅ Recalculates on stat changes via `refreshFromStats()`

### ❌ Non-Working Stats (Integration Incomplete)

1. **Damage** (`damage`)
   - ✅ Registered in StatSystem
   - ⚠️ BaseWeapon.createProjectile() reads from StatSystem
   - ❌ **BUT:** Uses `window.gameInstance.player` which may not always be valid
   - ❌ WeaponComponent doesn't refresh damage when stat changes
   - 🔍 **Issue:** Timing/reference problem, not automatic propagation

2. **Critical Chance** (`criticalChance`)
   - ✅ Registered in StatSystem
   - ⚠️ BaseWeapon.createProjectile() reads from StatSystem
   - ❌ **BUT:** Same `window.gameInstance.player` issue
   - ❌ No guarantee the current stat value is used when bullets spawn
   - 🔍 **Issue:** Global reference fragility

3. **Critical Damage** (`criticalDamage`)
   - ✅ Registered in StatSystem
   - ⚠️ BaseWeapon.createProjectile() reads from StatSystem
   - ❌ **BUT:** Same reference and timing issues as crit chance
   - 🔍 **Issue:** Reads stat but may get stale value

4. **Lifesteal** (`lifesteal`)
   - ✅ Registered in StatSystem
   - ❌ **CRITICAL:** No code in CollisionSystem applies healing
   - ❌ Player takes damage, deals damage, but healing never happens
   - 🔍 **Issue:** Stat exists but mechanic is completely unimplemented

5. **Luck** (`luck`)
   - ✅ Registered in StatSystem
   - ⚠️ Passed to UpgradeGenerator.generateUpgradeChoices()
   - ❌ **BUT:** LevelUpManager reads `this.player.luck` not via accessor
   - ❌ Needs `player.luck` getter that reads from StatSystem
   - 🔍 **Issue:** Direct property access bypasses StatSystem

## Architecture: Are `/game/upgrades/types/` Files Deprecated?

### Current Role of Upgrade Type Files

**NO, they are NOT deprecated.** They serve a critical architectural role:


