Phase 3: The Shop - Backend

    Create game/shop/ItemFactory.js:
		Define ALL items as data first (pure data objects).
		Separate stat definition from activation:
			definesStats: list of StatDefinition that this item introduces if the player owns it.
			onActivate(player, { statSystem, gameState }): apply behaviors/flags and any initial modifiers; register stats here using statSystem.registerStat for each in definesStats.
		
		Persistence-safe flow:
			On save: persist ownedItemIds.
			On load: for each owned item, call onActivate again to re-register stats and behaviors.

        This factory will define all possible shop items as data objects with a clear contract:

JavaScript

    {
      id: string,
      name: string,
      cost: number,
      description: string,
      category: string,
      statsToRegister: [],  // Stats this item will introduce
      dependencies: [],     // Other items required first
      conflictsWith: [],    // Items that can't be owned together
      onPurchase: function, // Effect application
      onLoad: function      // Re-apply effects on game load
    }

    The onPurchase function will contain the logic for applying the item's effects
    Add a stat dependencies map implicitly via definesStats and provides. The ProceduralUpgradeGenerator will query statSystem.getUpgradableStats(), which only includes stats registered by current ownership, guaranteeing alignment.
	
	Example:
		onActivate: (player, { statSystem }) => {
		// register stat definitions for owned item
		item.definesStats.forEach(def => statSystem.registerStat(def));
		// enable behaviors
		player.weaponComponent.canChain = true;
		// Optionally set starting modifiers
		statSystem.addModifier({ statId: 'chain_count', type: 'flat', amount: 2, sourceId: item.id });
		}

Create game/shop/ShopSystem.js:

    This system will manage the shop's inventory with deterministic generation:
        Use seedable random generators for consistent testing: Use a seedable RNG (e.g., a tiny LCG or seedrandom); seed with gameState.shopSeed + run context (levelIndex, wave, rerollCount)
        Apply constraints: no duplicate items in single offer, no conflicting mods together
        Implement category rotation for variety
    Core methods:
        generateOfferings(seed, playerOwnedItems) - Create shop inventory
        purchaseItem(itemId, player) - Validates currency, deducts cost, adds to ownedItemIds, calls item.onActivate
        rerollOfferings(cost) - Refresh inventory for a cost based on a scaling formula: cost = floor(baseCost * growth^rerollCount) (e.g., base 10, growth 1.35).
        loadOwnedItems(itemIds, player) - Restore items on game load
    Handle deducting currency from the GameState
    Track purchased items for save/load functionality

