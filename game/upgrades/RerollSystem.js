export class RerollSystem {
    constructor() {
        this.rerollCount = 1; // Start with 1 reroll
        this.maxRerolls = 3;
        this.rerollCost = 50; // XP cost per reroll
    }

    canReroll(playerXP, playerLuck = 1.0) {
        // Check if player has enough XP and hasn't exceeded max rerolls
        const adjustedCost = Math.floor(this.rerollCost / playerLuck);
        return this.rerollCount > 0 && playerXP >= adjustedCost;
    }

    performReroll(playerXP, playerLuck = 1.0) {
        if (!this.canReroll(playerXP, playerLuck)) {
            return null;
        }

        const adjustedCost = Math.floor(this.rerollCost / playerLuck);
        this.rerollCount--;
        
        return {
            success: true,
            cost: adjustedCost,
            remainingRerolls: this.rerollCount
        };
    }

    restoreReroll() {
        if (this.rerollCount < this.maxRerolls) {
            this.rerollCount++;
        }
    }

    reset() {
        this.rerollCount = 1;
    }

    getRerollCount() {
        return this.rerollCount;
    }

    getMaxRerolls() {
        return this.maxRerolls;
    }

    getRerollCost(playerLuck = 1.0) {
        return Math.floor(this.rerollCost / playerLuck);
    }
}

