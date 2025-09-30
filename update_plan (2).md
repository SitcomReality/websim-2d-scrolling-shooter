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

**Features:**
- Players can reroll upgrade choices once per level-up
- Cost increases each time (optional)
- Visual "reroll" button in upgrade selection overlay
- Animation when rerolling

**Integration Points:**
- `LevelUpManager.js` - track rerolls used
- `UIManager.js` - add reroll button
- `UpgradeSystem.js` - regenerate choices on reroll

### STEP 3: Implement Phase 5.2 - Upgrade Rarity Visual Effects
**Goal:** Make rarity differences more visually impactful

**Enhancements:**
- Animated borders for rare/legendary cards
- Particle effects on hover
- Glow effects based on rarity
- Sound effects when selecting rare upgrades (optional)

**Files to Modify:**
- `/styles/upgrade-cards.css` - add animations
- `/game/upgrades/UpgradeCardRenderer.js` - add effect rendering

### STEP 4: Implement Phase 5.3 - Upgrade Synergy Discovery UI
**Goal:** Show players when they're close to activating synergies

**New Features:**
- Synergy hints in upgrade selection
- Progress bars showing synergy requirements
- Visual indicators when synergies activate
- Synergy library/codex to view discovered synergies
