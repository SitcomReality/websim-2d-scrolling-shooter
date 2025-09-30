Intended Changes: The Shop & Dynamic Stat System

The goal is to separate mechanical changes from simple stat boosts to create more meaningful player choices and a deeper progression system.

    Two Progression Paths:
        Leveling Up (XP): Continues to provide stat-based upgrades. This is the "get stronger" path.
        The Shop (Currency): Provides items that unlock new mechanics and playstyles. This is the "get different" path. Mechanical changes (new behaviors) and unlocking new stat pools.

    New Currency:
        Enemies will have a chance to drop a new currency: shards.
        This currency will be collected by the player.
        It will be used to purchase items from a new Shop interface and to pay for rerolls.

    The Shop:
        A new UI screen, accessible between waves or after a level-up.
        The shop will offer a rotating selection of "Items" or "Modules".
        These items will grant new mechanics by applying "effects" or unlocking new "behaviors". Examples:
            Unlocking a Homing Missile weapon mod.
            Adding an "Explosive Rounds" effect to projectiles.
            Granting a temporary shield ability.
            Unlocking new weapon types (moving WeaponUnlockUpgrade logic here).

    Dynamic Stat System:
        Stat Registry: We will create a central StatSystem. This system will be the single source of truth for all player stats. The Player object and its components will query this system for stat values.
        Stat Definition: Stats will be defined as data objects with a strict shape for consistency and validation.
        Modifier Stacking: The system will support both additive and multiplicative modifiers with a predictable order of operations: (baseValue + flatMods) * (1 + percentMods).
        Value Constraints: Each stat will have baseValue, maxValue, and optional softCap properties to prevent runaway values from item stacking.
        Event System: The StatSystem will emit events when stats change, allowing UI and other systems to react efficiently.
        Introducing New Stats: When a player buys an item from the shop, the item will register its associated new stats with the StatSystem.
        Integrating with Upgrades: Once a new stat is registered, the ProceduralUpgradeGenerator will be modified to recognize it with governance rules to prevent upgrade pool explosion.
        UI Integration: The SidePanelManager will query the StatSystem to dynamically display all currently active stats for the player, including those added by items.