
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

**New Files:**

