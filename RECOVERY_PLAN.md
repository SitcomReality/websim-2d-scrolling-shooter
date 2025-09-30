# Recovery Plan: Getting Back on Track

## Current Situation Analysis

We've successfully completed:
- ✅ Phase 4.2: Procedural Upgrade Generator
- ✅ Phase 4.3: Advanced Weapon Mechanics (Piercing, Chain, Ricochet)
- ✅ Critical Hit system with Crit Chance and Crit Damage
- ✅ Upgrade icon spritesheet integration
- ✅ File structure cleanup (mostly complete)

Current state:
- All import errors have been fixed
- Duplicate files removed (`/entities/Player.js`)
- File paths now correctly reference the proper locations
- `game/upgrades/UpgradeSystem.js` is growing large and needs refactoring

## Remaining Issues

1. **UpgradeSystem.js is too large** (~300+ lines)
   - Card rendering logic mixed with upgrade generation
   - Rarity calculation in multiple places
   - Sprite mapping embedded in the class

2. **Missing UPGRADE_UPGRADE.md features** (Phase 5+)
   - Phase 5.1: Upgrade Reroll System
   - Phase 5.2: Upgrade Rarity Visual Effects
   - Phase 5.3: Upgrade Synergy Discovery UI
   - Phase 6: Meta Progression & Achievements

## Step-by-Step Recovery Plan

### STEP 1: Refactor UpgradeSystem.js (IMMEDIATE)
**Goal:** Split UpgradeSystem.js into modular, maintainable components

Create these new files:

#### A. `/game/upgrades/UpgradeRarityManager.js`
- Handles rarity calculations
- Manages rarity weights and luck modifiers
- Pure rarity rolling logic

#### B. `/game/upgrades/UpgradeCardRenderer.js`
- Creates upgrade card DOM elements
- Handles sprite positioning
- Manages card styling and animations

#### C. `/game/upgrades/UpgradeIconMapper.js`
- Maps upgrade icons/IDs to sprite positions
- Centralized icon configuration
- Easy to extend with new icons

#### D. `/game/upgrades/UpgradePool.js`
- Manages available upgrades
- Filters upgrades based on player state
- Handles upgrade availability logic

#### E. Slimmed-down `/game/upgrades/UpgradeSystem.js`
- Orchestrates the above modules
- Handles upgrade application
- Maintains player upgrade state

**Benefits:**
- Each file has a single responsibility
- Easy to test individual components
- Simple to add new features without bloating one file
- Better code organization and maintainability

### STEP 2: Implement Phase 5.1 - Upgrade Reroll System
**Goal:** Allow players to reroll their upgrade choices once per level

**New Files:**

