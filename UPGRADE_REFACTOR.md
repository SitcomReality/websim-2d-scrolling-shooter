# Modular Upgrade System Refactor Guide

## Overview
This document outlines a comprehensive plan to refactor the upgrade system to support modular, stackable upgrades with advanced weapon mechanics, movement modifications, and other unique effects and abilities. The system will use a component-based architecture with clear separation of concerns.

## File Structure

### Core Upgrade System
- `systems/upgrades/base/BaseUpgrade.js` - *Abstract interface for all upgrades, including activation, stacking, persistence, and metadata*
- `systems/upgrades/UpgradeStack.js` - *Manages stack state, caps, and decay logic*
- `systems/upgrades/UpgradeSystem.js` - *Orchestrator: applies, removes, and resolves upgrade conflicts*
- `systems/upgrades/UpgradeRegistry.js` - *Catalog of all available upgrades with metadata*
- `systems/upgrades/generator/ProceduralGenerator.js` - *Weighted, themed, tiered upgrade generation*
- `systems/upgrades/generator/SynergyRules.js` - *Defines combo logic and interaction rules*

### Domain-Specific Upgrade Frameworks
- `systems/upgrades/frameworks/WeaponUpgradeFramework.js` - *Base class for weapon-specific upgrades*
- `systems/upgrades/frameworks/MovementUpgradeFramework.js` - *Base class for movement-specific upgrades*
- `systems/upgrades/frameworks/UtilityUpgradeFramework.js` - *Base class for utility upgrades (shields, buffs)*

### Weapon System
- `systems/weapons/PlayerWeapon.js` - *Weapon component with fire modes, ammo, cooldown*
- `entities/projectile/BaseProjectile.js` - *Base projectile logic and behavior*
- `entities/projectile/ProjectilePool.js` - *Performance-optimized projectile management*

### Movement System
- `systems/movement/PlayerMovement.js` - *Physics, input handling, and movement state*

### Integration & UI
- `entities/Player.js` - *Composes all player components*
- `ui/UpgradeSelectionUI.js` - *Upgrade selection interface with synergy highlighting*

## Step-by-Step Implementation

### Phase 1: Foundation Layer (Week 1-2)

#### 1.1 Base Upgrade System
**File:** `systems/upgrades/base/BaseUpgrade.js`
```javascript
class BaseUpgrade {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.tier = config.tier;
    this.maxStacks = config.maxStacks || 1;
    this.currentStacks = 0;
  }

  // Synergy system foundation
  getSynergyTags() { return []; }
  onSynergyTriggered(otherUpgrade) { /* optional hook */ }
  
  // Core upgrade lifecycle
  onApply(player) { }
  onRemove(player) { }
  onStackIncreased(player, oldStacks, newStacks) { }
}
```

#### 1.2 Upgrade Stack Manager
**File:** `systems/upgrades/UpgradeStack.js`
- Tracks active upgrades and their stack counts
- Enforces maximum stack limits
- Handles upgrade conflicts and precedence

#### 1.3 Upgrade Registry
**File:** `systems/upgrades/UpgradeRegistry.js`
- Central catalog of all available upgrades
- Precomputes synergy pairs for UI and generation
- Organizes upgrades by category and tier

#### 1.4 Player Component Architecture
**File:** `entities/Player.js`
```javascript
class Player {
  constructor() {
    this.components = {
      movement: new PlayerMovement(),
      weapon: new PlayerWeapon(),
      upgrades: new UpgradeStack(),
      health: new HealthComponent(),
      input: new InputComponent(),
    };
    this.stats = new Map(); // Luck, crit chance, etc.
  }
}
```

### Phase 2: Weapon System Refactor (Week 3-4)

#### 2.1 Weapon Upgrade Framework
**File:** `systems/upgrades/frameworks/WeaponUpgradeFramework.js`
```javascript
class WeaponUpgradeFramework extends BaseUpgrade {
  getSynergyTags() { 
    return super.getSynergyTags().concat(['weapon', 'projectile']); 
  }
  
  modifyProjectile(projectile) { }
  modifyFireRate(baseRate) { return baseRate; }
  modifyDamage(baseDamage) { return baseDamage; }
}
```

#### 2.2 Projectile System
**File:** `entities/projectile/BaseProjectile.js`
- Base class for all projectile types
- Supports modification by weapon upgrades
- Handles collision and lifetime logic

#### 2.3 Fire Modes and Charge Mechanics
**File:** `systems/weapons/PlayerWeapon.js`
- Implements different fire modes (auto, burst, charge)
- Manages ammo and cooldown systems
- Integrates with upgrade modifications

### Phase 3: Movement & Utility Systems (Week 5)

#### 3.1 Movement Upgrade Framework
**File:** `systems/upgrades/frameworks/MovementUpgradeFramework.js`
```javascript
class MovementUpgradeFramework extends BaseUpgrade {
  getSynergyTags() { 
    return super.getSynergyTags().concat(['movement', 'mobility']); 
  }
  
  modifySpeed(baseSpeed) { return baseSpeed; }
  modifyJump(baseJump) { return baseJump; }
  onDash(player) { } // For dash/teleport upgrades
}
```

#### 3.2 Utility Upgrade Framework
**File:** `systems/upgrades/frameworks/UtilityUpgradeFramework.js`
- Handles shields, buffs, and defensive upgrades
- Manages temporary effects and cooldowns

### Phase 4: Synergy & Advanced Mechanics (Week 6)

#### 4.1 Synergy System Implementation
**File:** `systems/upgrades/generator/SynergyRules.js`
- Defines upgrade combination effects
- Biases upgrade generation toward synergistic combinations
- Exposes synergy information to UI

#### 4.2 Procedural Upgrade Generator
**File:** `systems/upgrades/generator/ProceduralGenerator.js`
- Weighted random selection based on player luck stat
- Tier-based upgrade distribution
- Synergy-aware generation in later floors

#### 4.3 Advanced Weapon Mechanics
- Chain lightning, area effects, piercing
- Critical hit system with on-crit effects
- Compound upgrade interactions

### Phase 5: UI & Polish

#### 5.1 Upgrade Selection UI
**File:** `ui/UpgradeSelectionUI.js`
- Displays available upgrades with tooltips
- Highlights synergistic combinations
- Shows stat changes and descriptions
- Sprites for upgrade icons

#### 5.2 Visual Effects Integration
- Particle effects for upgrade activations
- Visual feedback for synergies
- Upgrade-specific animations

## Key Design Principles

1. **Component-Based Architecture**: All player capabilities separated into discrete components
2. **Incremental Enhancement**: Upgrades modify existing systems rather than replacing them
3. **Synergy-First Design**: Upgrade interactions considered from the beginning
4. **Performance-Conscious**: Object pooling for projectiles, efficient upgrade application
5. **Extensible Framework**: Easy to add new upgrade types and mechanics