Phase 5: Connecting Items to the Upgrade System

    Modify ProceduralUpgradeGenerator.js:
		Query statSystem.getUpgradableStats(), update the generator to create upgrades for any stat registered in the player.statSystem
		Deterministic RNG seeded similarly to ShopSystem.
        Implement governance rules to prevent upgrade pool explosion:
            Use StatDefinition.upgradeWeight property to control stat appearance frequency
            Group related stats so they don't all appear at once
            Organize dynamic stats under clear taxonomy (offense, defense, utility, weapon mods)
			Limit dilution: Cap the number of dynamic stat cards per upgrade offering (e.g., at most 2 dynamic stats, rest from core), include the ability to optionally rotate categories across level-ups (deterministically).
			Card construction: “+X flat” vs “+Y%” — ensure variety rules and avoid stacking same type repeatedly unless desired.


        When generating upgrade choices, prioritize based on:
            Stat category balance
            Player's current build (owned items)
            Upgrade weight values

    Transition Mechanical Upgrades to Shop Items:
        Identify upgrades like ChainUpgrade, RicochetUpgrade, etc.
        Remove their classes from game/upgrades/types/
        Re-implement them as items in ItemFactory.js with proper stat registration:
		
			provides.behaviors (e.g., canChain, canRicochet).
			definesStats (e.g., chain_count, chain_range, chain_damage_reduction).
			onActivate: set the behavior flags and register new stats; optionally add baseline modifiers.


			JavaScript

			{
			  id: 'chain_lightning_module',
			  name: 'Chain Lightning Module',
			  statsToRegister: [
				{ id: 'chain_count', baseValue: 2, category: 'weapon_mods' },
				{ id: 'chain_range', baseValue: 100, category: 'weapon_mods' },
				{ id: 'chain_damage_reduction', baseValue: 0.2, category: 'weapon_mods' }
			  ],
			  onPurchase: (player) => {
				// Register stats
				this.statsToRegister.forEach(stat => player.statSystem.registerStat(stat));
				// Apply behavior
				player.weaponComponent.canChain = true;
			  },
			  onLoad: (player) => {
				// Re-apply on game load
				this.onPurchase(player);
			  }
			}

	After purchasing items, players will see relevant upgrade offers upon leveling up