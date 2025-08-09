    initializeSystems() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        this.inputHandler = new InputHandler(this.canvas);
        this.enemySpawner = new EnemySpawner(this.canvas);
        this.collisionSystem = new CollisionSystem();
        this.particleSystem = new ParticleSystem();
        this.powerUpSystem = new PowerUpSystem();
        this.powerUpSystem.player = this.player;
        this.upgradeSystem = new UpgradeSystem();
        
        this.gameEngine.addEntity(this.player);
    }
    
    setupEventListeners() {
        this.uiManager.on('start', () => this.startGame());
        this.uiManager.on('restart', () => this.restartGame());
        this.uiManager.on('continue', () => this.continueAfterLevelUp());
        this.uiManager.on('upgradeSelected', (index) => this.selectUpgrade(index));
    }

    startGame() {
        this.gameState.reset();
        this.gameState.isRunning = true;
        this.gameLoop();
    }

