Phase 1: Core Stat System Refactor

    Create game/systems/StatSystem.js:
		
		Responsibilities:
			Register and manage stats: registerStat(def), hasStat(id), getStatValue(id), setBaseValue(id, value).
			Apply and remove modifiers: addModifier(mod), removeModifier(sourceId, statId?), clearSourceModifiers(sourceId).
			Retrieve: getAllStats(), getUpgradableStats() (filtered by upgradable, visible), getDefinition(id).
			Events: onStatChanged(id, newValue), onStatsChanged(changedIds[]). Provide subscribe/unsubscribe.
			Deterministic stacking:
				Maintain arrays for flat and percent modifiers per stat with source attribution.
				Calculate final value by rule: (base + sum(flat)) * (1 + sum(percent)) then clamp and soft cap.
			Soft caps and clamping applied in one place, not in consumers.
			Validation: validate StatDefinition on register; error on duplicates; validate modifiers.
		Consider keeping a central compute cache invalidated only when needed (stat changes) to avoid recompute cost.

	
        This class will hold a map of all player stats with a strict StatDefinition shape:

		JavaScript

			{
			  id: string,           // Required: unique identifier
			  name: string,         // Required: display name
			  baseValue: number,    // Required: starting value
			  value: number,        // Calculated: final value after modifiers
			  maxValue: number,     // Optional: hard cap
			  softCap: number,      // Optional: soft cap for balancing
			  description: string,  // Required: tooltip text
			  category: string,     // Required: for grouping (offense/defense/utility)
			  upgradeWeight: number,// Optional: frequency in upgrade pool (0-1)
			  flatModifiers: [],    // Array of additive modifiers
			  percentModifiers: []  // Array of multiplicative modifiers
			}

			Core methods:
				registerStat(statDefinition) - Add a new stat with validation
				getStatValue(id) - Get calculated final value
				setBaseValue(id, value) - Set the base value
				addModifier(id, modifier) - Add a modifier with type (flat/percent)
				getAllStats() - Get all registered stats
				getStatsByCategory(category) - Get stats by category
			Event emitters:
				onStatChanged(statId, oldValue, newValue)
				onStatsChanged(changedStats)
			Value calculation: (baseValue + sum(flatModifiers)) * (1 + sum(percentModifiers)) with clamping to maxValue/softCap

		Integrate StatSystem into Player.js:

			Instantiate StatSystem in the Player constructor.
			Refactor existing player properties (damage, speed, maxHealth, etc.) to be registered in and managed by the new StatSystem. Register core baseline stats on player creation (damage, speed, maxHealth, fireRate, critChance, etc.) via registerStat().
			Update player getters/setters to interact with the StatSystem instead of direct properties. Example: get damage() { return this.statSystem.getStatValue('damage'); }.
			Emit or consume stat changes as needed by components (weapon, movement).

		Refactor Upgrade Types:

			Ensure each upgrade uses a stable sourceId (e.g., upgrade instance id) for easy removal if needed (respec later?).
			Modify all classes in game/upgrades/types/ to use the new modifier system:

		JavaScript

			// Instead of: player.damage += 5
			player.statSystem.addModifier('damage', { type: 'flat', value: 5, source: 'upgrade' });
			// Instead of: player.damage *= 1.2
			player.statSystem.addModifier('damage', { type: 'percent', value: 0.2, source: 'upgrade' });

		Update UI (SidePanelManager.js):

			Subscribe to statSystem.onStatsChanged events for efficient re-rendering
			Change updateShipStatsPanel to iterate over player.statSystem.getAllStats() to dynamically build the stats list
			Group stats by category for better organization
			Format values based on definition.format.

