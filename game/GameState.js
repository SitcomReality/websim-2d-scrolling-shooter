export class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.isRunning = false;
        this.score = 0;
        this.health = 100;
        this.maxHealth = 100
        this.xp = 0
        this.level = 1
        this.xpToNextLevel = 100
        this.isPausedForLevelUp = false
        this.levelUpDelayTimer = 0
        this.isLevelUpPending = false
        this.currency = 0; // Phase 2: track player currency

        // Persistence / shop metadata
        this.ownedItems = [];       // persisted owned shop item ids
        this.shopSeed = Date.now(); // deterministic seed base for shop offers
        this.rerollCount = 0;       // persisted reroll count from shop
        this.statSnapshot = null;   // optional serialized stat system snapshot
    }
}