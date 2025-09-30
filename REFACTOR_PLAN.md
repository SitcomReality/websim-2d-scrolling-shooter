# Refactor Plan: Shop System and Dynamic Stats

This document outlines the plan to refactor the game's progression systems by introducing a currency-based shop for mechanical upgrades and creating a more flexible, data-driven system for managing player stats.

### 1. Overview of the Current System

*   **Progression:** Player progression is driven entirely by gaining XP from defeating enemies. When the XP bar fills, the player levels up.
*   **Upgrades:** Leveling up pauses the game and presents the player with a choice of several upgrades. These are drawn from a predefined pool in `game/upgrades/UpgradeSystem.js`.
*   **Upgrade Types:** The current system mixes two kinds of upgrades:
    *   **Stat Upgrades:** Simple numerical increases to player or weapon stats (e.g., `DamageUpgrade`, `HealthUpgrade`, `FireRateUpgrade`).
    *   **Mechanical Upgrades:** Upgrades that introduce new behaviors or significantly alter existing ones (e.g., `ChainUpgrade`, `RicochetUpgrade`, `PiercingUpgrade`).
*   **Stat Management:**
    *   Player stats are stored as properties directly on the `Player` object (e.g., `player.damage`, `player.speed`) or within components like `PlayerStatsComponent`.
    *   Each new stat-based upgrade typically requires a dedicated class file in `game/upgrades/types/` (e.g., `LifestealUpgrade.js`). This class defines how the upgrade is applied and how it's presented to the user.
    *   The `SidePanelManager` reads these properties directly from the `Player` object to display them in the UI.

### 2. Intended Changes: The Shop & Dynamic Stat System

The goal is to separate mechanical changes from simple stat boosts to create more meaningful player choices and a deeper progression system.

*   **Two Progression Paths:**
    1.  **Leveling Up (XP):** Continues to provide stat-based upgrades. This is the "get stronger" path.
    2.  **The Shop (Currency):** Provides items that unlock new mechanics and playstyles. This is the "get different" path.

*   **New Currency:**
    *   Enemies will have a chance to drop a new currency (e.g., "Scrap" or "Cores").
    *   This currency will be collected by the player.
    *   It will be used to purchase items from a new Shop interface and to pay for rerolls.

*   **The Shop:**
    *   A new UI screen, accessible between waves or after a level-up.
    *   The shop will offer a rotating selection of "Items" or "Modules".
    *   These items will grant new mechanics by applying "effects" or unlocking new "behaviors". Examples:
        *   Unlocking a Homing Missile weapon mod.
        *   Adding an "Explosive Rounds" effect to projectiles.
        *   Granting a temporary shield ability.
        *   Unlocking new weapon types (moving `WeaponUnlockUpgrade` logic here).

*   **Dynamic Stat System:**
    *   **Stat Registry:** We will create a central `StatSystem`. This system will be the single source of truth for all player stats. The `Player` object and its components will query this system for stat values.
    *   **Stat Definition:** Stats will be defined as data objects, not as unique classes. A stat definition might look like: `{ id: 'explosion_radius', name: 'Explosion Radius', baseValue: 0, description: 'The blast radius of explosive shots' }`.
    *   **Introducing New Stats:** When a player buys an item from the shop, the item will register its associated new stats with the `StatSystem`. For example, the "Explosive Rounds" item would register `explosion_radius` and `explosion_damage` stats.
    *   **Integrating with Upgrades:** Once a new stat is registered, the `ProceduralUpgradeGenerator` will be modified to recognize it. It will then be able to dynamically create new upgrade cards for these stats (e.g., "Increase Explosion Radius by 10%").
    *   **UI Integration:** The `SidePanelManager` will query the `StatSystem` to dynamically display all currently active stats for the player, including those added by items.

### 3. Step-by-Step Implementation Plan

Here is a phased plan to implement the proposed changes.

**Phase 1: Core Stat System Refactor**

1.  **Create `game/systems/StatSystem.js`:**
    *   This class will hold a map of all player stats (`{ id, name, value, baseValue, description, ...}`).
    *   It will have methods like `registerStat(statDefinition)`, `getStatValue(id)`, `setBaseValue(id, value)`, `modifyStat(id, amount)`, `getAllStats()`.
    *   It will manage base values and modifications from upgrades separately to calculate the final `value`.

2.  **Integrate `StatSystem` into `Player.js`:**
    *   Instantiate `StatSystem` in the `Player` constructor.
    *   Refactor existing player properties (`damage`, `speed`, `maxHealth`, etc.) to be registered in and managed by the new `StatSystem`.
    *   Update player getters/setters to interact with the `StatSystem` instead of direct properties. Example: `get damage() { return this.statSystem.getStatValue('damage'); }`.

3.  **Refactor Upgrade Types:**
    *   Modify all classes in `game/upgrades/types/` to call `player.statSystem.modifyStat('stat_id', amount)` instead of directly changing player properties.

4.  **Update UI (`SidePanelManager.js`):**
    *   Change `updateShipStatsPanel` to iterate over `player.statSystem.getAllStats()` to dynamically build the stats list, rather than using a hardcoded list.

**Phase 2: Currency and Collection**

1.  **Create `game/entities/CurrencyPickup.js`:**
    *   An entity similar to `HealthPickup` that represents the new currency.
    *   It should have a distinct visual and an attraction effect towards the player.

2.  **Update Enemy Drops:**
    *   In `CollisionSystem.js`, when an enemy is defeated, add logic to spawn a `CurrencyPickup` based on a drop chance.

3.  **Track Currency:**
    *   Add a `currency` property to `GameState.js`.
    *   When the player collides with a `CurrencyPickup`, increment the `gameState.currency`.

4.  **Display Currency in UI:**
    *   Add a new element to `index.html` to display the player's current currency total.
    *   Update `UIManager.js` to keep this display up-to-date.

**Phase 3: The Shop - Backend**

1.  **Create `game/shop/ItemFactory.js`:**
    *   This factory will define all possible shop items as data objects.
    *   An item definition will include `id`, `name`, `cost`, `description`, and an `onPurchase` effect function.
    *   The `onPurchase` function will contain the logic for applying the item's effects, such as registering new stats (`player.statSystem.registerStat(...)`), adding new behaviors to the player/weapon, etc.

2.  **Create `game/shop/ShopSystem.js`:**
    *   This system will manage the shop's inventory.
    *   It will have methods to `generateOfferings()` (pulling from `ItemFactory`), `purchaseItem(itemId, player)`, and `rerollOfferings()`.
    *   It will handle deducting currency from the `GameState`.

**Phase 4: The Shop - Frontend & Game Loop Integration**

1.  **Create Shop UI (`index.html` and `styles/shop.css`):**
    *   Add a new overlay element for the shop interface.
    *   Style the shop with slots for items, displaying their name, icon, description, and cost. Include a purchase button for each and a reroll button.

2.  **Update `UIManager.js`:**
    *   Add methods to `showShop(offerings)` and `hideShop()`.
    *   The `showShop` method will dynamically create item cards from the offerings data and attach event listeners for purchasing and rerolling.

3.  **Integrate Shop into Game Flow:**
    *   Decide when the shop should appear (e.g., via a button after the level-up screen, or automatically every few levels).
    *   Update `Game.js` and `LevelUpManager.js` to pause the game and call `uiManager.showShop()` at the appropriate time.

**Phase 5: Connecting Items to the Upgrade System**

1.  **Modify `ProceduralUpgradeGenerator.js`:**
    *   Update the generator to be able to create upgrades for *any* stat registered in the `player.statSystem`.
    *   When generating upgrade choices, it will now look at the player's registered stats and create relevant upgrade cards, in addition to the base stat upgrades.

2.  **Transition Mechanical Upgrades to Shop Items:**
    *   Identify upgrades like `ChainUpgrade`, `RicochetUpgrade`, etc.
    *   Remove their classes from `game/upgrades/types/`.
    *   Re-implement them as items in `ItemFactory.js`.
    *   The `onPurchase` function for these items will:
        1.  Add a new behavior/flag to the player or weapon component (e.g., `player.weaponComponent.canChain = true`).
        2.  Register new associated stats with the `StatSystem` (e.g., `chain_count`, `chain_range`, `chain_damage_reduction`).
    *   Now, after purchasing the "Chain Lightning Module" from the shop, the player will start seeing upgrade offers like "Increase Chain Count" and "Increase Chain Range" upon leveling up.

