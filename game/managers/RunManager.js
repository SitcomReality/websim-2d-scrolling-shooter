export class RunManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.container = null;
        this._createOverlay();
        // track whether a run is active (load button disabled on game over)
        this.runActive = false;
    }

    _createOverlay() {
        this.container = document.createElement('div');
        this.container.id = 'run-manager-overlay';
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.9)',
            zIndex: '4000',
            pointerEvents: 'all'
        });

        const panel = document.createElement('div');
        Object.assign(panel.style, {
            background: '#001122',
            border: '2px solid #00ffff',
            borderRadius: '10px',
            padding: '28px',
            color: '#00ffff',
            width: '520px',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif'
        });

        panel.innerHTML = `
            <h1 style="color:#ffff00;margin-bottom:8px;">Run Menu</h1>
            <p style="color:#cccccc;margin-bottom:16px;">Start a new run or continue a saved run. Game over ends the saved run.</p>
            <div style="display:flex;gap:12px;justify-content:center;margin-bottom:12px;">
                <button id="rm-new-btn" style="padding:10px 16px;border-radius:6px;border:none;cursor:pointer;background:#00ffff;color:#000;font-weight:bold;">New Run</button>
                <button id="rm-load-btn" style="padding:10px 16px;border-radius:6px;border:none;cursor:pointer;background:#0080ff;color:#fff;font-weight:bold;">Load Run</button>
            </div>
            <div id="rm-info" style="color:#cccccc;font-size:13px;margin-top:8px;">No run loaded.</div>
        `;

        this.container.appendChild(panel);
        document.body.appendChild(this.container);

        this._newBtn = panel.querySelector('#rm-new-btn');
        this._loadBtn = panel.querySelector('#rm-load-btn');
        this._info = panel.querySelector('#rm-info');

        this._newBtn.addEventListener('click', () => this.startNewRun());
        this._loadBtn.addEventListener('click', () => this.loadRun());

        this.hide(); // start hidden; Game will show at boot
    }

    show() {
        if (!this.container) return;
        this.container.style.display = 'flex';
        // load button state depends on saved run existence and whether run is active
        const saved = localStorage.getItem(this.game.saveLoadManager?.storageKey || 'game_save_v1');
        const canLoad = !!saved && !this.runActive;
        this._loadBtn.disabled = !canLoad;
        this._loadBtn.style.opacity = canLoad ? '1' : '0.5';
        this._info.textContent = canLoad ? 'Saved run available to load.' : 'No saved run available.';
    }

    hide() {
        if (!this.container) return;
        this.container.style.display = 'none';
    }

    startNewRun() {
        // Clear any existing save (new run replaces saved run)
        try {
            localStorage.removeItem(this.game.saveLoadManager?.storageKey || 'game_save_v1');
        } catch (e) { /* ignore */ }

        // Reset game state and systems fully to avoid stat bleed
        this._fullReset();
        this.runActive = true;
        this.hide();

        // ensure game state marked running and UI reflects start
        if (this.game && this.game.gameState) this.game.gameState.isRunning = true;
        if (this.game && this.game.uiManager) /* legacy start button removed - no-op */;

        // start game loop
        this.game.uiManager.update();
        this.game.gameLoopManager.start();
    }

    loadRun() {
        // Attempt to load via save manager (if available)
        if (this.game.saveLoadManager) {
            const loaded = this.game.saveLoadManager.load();
            if (loaded) {
                // ensure shopSystem re-applies owned items (SaveLoadManager does this) and rehydrate any systems
                this._postLoadReinit();
                this.runActive = true;
                this.hide();

                // mark running and update UI
                if (this.game && this.game.gameState) this.game.gameState.isRunning = true;
                if (this.game && this.game.uiManager) /* legacy start button removed - no-op */;

                this.game.uiManager.update();
                this.game.gameLoopManager.start();
                return;
            }
        }
        // fallback: indicate nothing to load
        this._info.textContent = 'Failed to load saved run.';
        this._loadBtn.disabled = true;
    }

    // Called when a game ends (game over) to present the run menu and mark run inactive
    showAfterGameOver() {
        // mark run as finished so the load button is disabled
        this.runActive = false;
        // stop the game loop to ensure clean state
        try { this.game.gameLoopManager.stop(); } catch(e){}
        // show overlay (load disabled to prevent continuing dead run)
        this.show();
        // also show a small message
        if (this._info) this._info.textContent = 'Game over — saved run ended. Start a new run.';
    }

    // internal helper to fully reset game state + systems
    _fullReset() {
        // stop loop while resetting
        try { this.game.gameLoopManager.stop(); } catch(e){}

        // reset gameState
        if (this.game.gameState && typeof this.game.gameState.reset === 'function') {
            this.game.gameState.reset();
        } else {
            this.game.gameState = new (this.game.GameState || (function(){return null})())();
        }

        // Reset player, stat system and managers to initial clean state
        try {
            // recreate player to ensure fresh statSystem and components
            const PlayerClass = this.game.Player || null;
            if (PlayerClass) {
                this.game.player = new PlayerClass(400, 500, this.game.weaponFactory || null);
            } else if (this.game.player && typeof this.game.player.reset === 'function') {
                this.game.player.reset();
            }

            // Reset or recreate core managers/systems that hold state
            if (this.game.upgradeSystem && typeof this.game.upgradeSystem.reset === 'function') this.game.upgradeSystem.reset();
            if (this.game.enemySpawner && typeof this.game.enemySpawner.reset === 'function') this.game.enemySpawner.reset();
            if (this.game.particleSystem && typeof this.game.particleSystem.reset === 'function') this.game.particleSystem.reset();
            if (this.game.powerUpSystem && typeof this.game.powerUpSystem.reset === 'function') this.game.powerUpSystem.powerUps = [];
            if (this.game.sidePanelManager && typeof this.game.sidePanelManager.updateSidePanels === 'function') this.game.sidePanelManager.updateSidePanels();

            // Re-register player movement component with MovementSystem and restore bounds
            try {
                if (this.game.movementSystem && this.game.player && this.game.player.movementComponent && this.game.canvas) {
                    this.game.movementSystem.registerEntity('player', this.game.player.movementComponent);
                    this.game.movementSystem.setBounds('player', 0, this.game.canvas.width, 0, this.game.canvas.height);
                }
            } catch (e) { /* ignore */ }

            // Clear shop owned state if present (new run should start clean)
            if (this.game.shopSystem) {
                // clear persisted owned and in-memory sets
                try {
                    this.game.shopSystem.ownedItemIds = new Set();
                    this.game.shopSystem.currentOfferings = [];
                    this.game.shopSystem.rerollCount = 0;
                    this.game.shopSystem._persistOwned();
                } catch (e) {}
            }

            // reset save manager to ensure future saves reflect new run
            if (this.game.saveLoadManager) {
                try {
                    // clear save in storage and reset manager's internals if needed
                    localStorage.removeItem(this.game.saveLoadManager.storageKey);
                } catch (e) {}
            }
        } catch (e) {
            console.warn('RunManager full reset error', e);
        }

        // update UI/state
        try { this.game.uiManager.update(); } catch(e){}
    }

    _postLoadReinit() {
        // after load, ensure objects reference are wired correctly (player, statSystem, shopSystem)
        try {
            // If shopSystem persisted owned items and Load applied them, ensure shopSystem has reference to player
            if (this.game.shopSystem && typeof this.game.shopSystem.loadOwnedItems === 'function') {
                this.game.shopSystem.loadOwnedItems(this.game.gameState.ownedItems || [], this.game.player);
            }
            // Re-register movementSystem bounds for player after re-creation
            if (this.game.movementSystem && this.game.player && this.game.player.movementComponent) {
                this.game.movementSystem.registerEntity('player', this.game.player.movementComponent);
                this.game.movementSystem.setBounds('player', 0, this.game.canvas.width, 0, this.game.canvas.height);
            }
        } catch (e) {
            console.warn('RunManager post-load reinit error', e);
        }
    }
}

export default RunManager;