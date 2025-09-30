Phase 6: Save/Load Integration/Persistence and Rehydration (cross-cutting)

    Save on key events (post-purchase, post-level-up):
        currency, ownedItemIds, rerollCount, shopSeed, and an upgrade history or current modifiers if needed.

    Update GameState.js:
        Add ownedItems array to track purchased shop items
        Serialize stat system state for saving

    Update Save/Load Logic:
        On save: Store owned items, stat values, and modifiers
        On load:
            Register core stats, re-initialize StatSystem with saved base values.
            Call ShopSystem.loadOwnedItems() to re-apply all item effects / For each owned item, call item.onActivate to re-register stat definitions and behaviors.
            Re-apply all modifier stacks in correct order
