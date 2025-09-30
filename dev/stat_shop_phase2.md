Phase 2: Currency and Collection

    Create game/entities/CurrencyPickup.js:
        An entity similar to HealthPickup that represents the new currency.
        It should have a distinct visual and an attraction effect towards the player.
		Amount can scale with enemy type or level.

    Update Enemy Drops:
        In CollisionSystem.js, when an enemy is defeated, roll drop chance and spawn CurrencyPickup with value range.
		Track tuning constants centrally (dropChance, min/maxShard per enemy tier).

    Track Currency:
        Add a currency property to GameState.js.
        When the player collides with a CurrencyPickup, increment the gameState.currency and emit UI event for live updates.

    Display Currency in UI:
        Add a new element to index.html to display the player's current currency total.
        Update UIManager.js to subscribe to currency change events and render.
