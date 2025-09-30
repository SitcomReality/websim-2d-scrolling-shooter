export class GameLoopManager {
    constructor(game) {
        this.game = game;
        this.lastTime = 0;
        this.isRunning = false;
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = 0;
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning || !this.game.gameState.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.game.gameState.isPausedForLevelUp) {
            this.game.update(deltaTime);
            this.game.render();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

