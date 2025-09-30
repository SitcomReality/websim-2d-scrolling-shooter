Phase 4: The Shop - Frontend & Game Loop Integration

    Create Shop UI (index.html and styles/shop.css):
        Add a new overlay element for the shop interface
        Style the shop with slots for items, displaying:
            Name, icon, description, and cost
            Which new stats or behaviors it adds (clearly highlighted)
            For weapon unlocks, preview of how it changes the weapon pool & annotate effect on weapon pool (e.g., “Unlocks Homing Missile”).
            Purchase button for each item
            Reroll button with cost display

    Update UIManager.js:
        Add methods to showShop(offerings) and hideShop()
        The showShop method will:
            Dynamically create item cards from the offerings data
            Clearly indicate which stats/behaviors each item adds
            Attach event listeners for purchasing and rerolling
            Show item categories and dependencies
		On purchase success: update currency, add a small confirmation (e.g., “Chain Module acquired”), and optionally close or keep open if multiple buys are allowed.

    Integrate Shop into Game Flow:
        Allow flexibility for when the shop should appear (e.g., via a button after the level-up screen, or automatically every few levels). For now, it will be every level up, shown after the upgrade screen.
        Update Game.js and LevelUpManager.js to pause the game and call uiManager.showShop() at the appropriate time
