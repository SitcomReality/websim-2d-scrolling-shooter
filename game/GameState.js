export class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.isRunning = false;
        this.score = 0;
        this.health = 100;
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
        this.isPausedForLevelUp = false;
        this.levelUpDelayTimer = 0;
        this.isLevelUpPending = false;
    }
}

