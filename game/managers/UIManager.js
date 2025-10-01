import { EventEmitter } from '../utils/EventEmitter.js';
import UpgradeUI from '../ui/UpgradeUI.js';
import ShopUI from '../ui/ShopUI.js';
import StatDebugUI from '../ui/StatDebugUI.js';

export class UIManager extends EventEmitter {
    constructor(gameState) {
        super();
        this.gameState = gameState;
        this.upgradeChoices = [];
        
        this.elements = {
            canvas: document.getElementById('game-canvas'),
            // legacy start/restart buttons removed from DOM; don't query them
            healthFill: document.getElementById('health-fill'),
            xpFill: document.getElementById('xp-fill'),
            scoreDisplay: document.getElementById('score-display'),
            levelDisplay: document.getElementById('level-display'),
            upgradeOverlay: document.getElementById('upgrade-selection-overlay'),
            upgradeChoices: document.getElementById('upgrade-choices'),
            currencyDisplay: document.getElementById('currency-display')
        };
        
        // Modular UI handlers
        this.upgradeUI = new UpgradeUI(this);
        this.shopUI = new ShopUI(this);
        this.statDebugUI = new StatDebugUI(this);

        // Subscribe to currency change events (emitted by pickups)
        this.on('currencyChanged', (newAmount) => {
            if (this.elements.currencyDisplay) this.elements.currencyDisplay.textContent = `Currency: ${Math.round(newAmount)}`;
        });
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Start/restart buttons removed — no handlers for them here.

        // Dev helper: give currency (replaces legacy open-shop dev button)
        const giveCurrencyBtn = document.getElementById('give-currency-btn');
        if (giveCurrencyBtn) {
            giveCurrencyBtn.addEventListener('click', () => this.emit('devGiveCurrency'));
        }

        // Stat debug opener
        const statDebugBtn = document.getElementById('open-stat-debug-btn');
        if (statDebugBtn) {
            statDebugBtn.addEventListener('click', () => {
                if (this.statDebugUI) this.statDebugUI.show();
            });
        }

        // New: Disable XP toggle button
        const disableXPBtn = document.getElementById('disable-xp-btn');
        if (disableXPBtn) {
            disableXPBtn.addEventListener('click', () => this.emit('devToggleXP'));
        }
        
        // Dev panel events
        const levelUpBtn = document.getElementById('level-up-btn');
        if (levelUpBtn) {
            levelUpBtn.addEventListener('click', () => {
                this.emit('devLevelUp');
            });
        }
        
        const healBtn = document.getElementById('heal-btn');
        if (healBtn) {
            healBtn.addEventListener('click', () => {
                this.emit('devHeal');
            });
        }
        
        const maxXPBtn = document.getElementById('max-xp-btn');
        if (maxXPBtn) {
            maxXPBtn.addEventListener('click', () => {
                this.emit('devMaxXP');
            });
        }
        
        const killAllBtn = document.getElementById('kill-all-btn');
        if (killAllBtn) {
            killAllBtn.addEventListener('click', () => {
                this.emit('devKillAll');
            });
        }
    }
    
    update() {
        // Update health bar
        const healthPercent = Math.max(0, this.gameState.health);
        this.elements.healthFill.style.width = `${healthPercent}%`;
        
        // Update health value text
        const healthValue = document.getElementById('health-value');
        if (healthValue) {
            const maxHealth = this.gameState.maxHealth || 100;
            healthValue.textContent = `${Math.round(this.gameState.health)} / ${maxHealth}`;
        }
        
        // Update XP bar
        const xpPercent = (this.gameState.xp / this.gameState.xpToNextLevel) * 100;
        this.elements.xpFill.style.width = `${xpPercent}%`;
        
        // Update XP value text
        const xpValue = document.getElementById('xp-value');
        if (xpValue) {
            xpValue.textContent = `${Math.round(this.gameState.xp)} / ${this.gameState.xpToNextLevel}`;
        }
        
        // Update displays
        this.elements.scoreDisplay.textContent = `Score: ${this.gameState.score}`;
        this.elements.levelDisplay.textContent = `Level ${this.gameState.level}`;
        if (this.elements.currencyDisplay) {
            this.elements.currencyDisplay.textContent = `Currency: ${Math.round(this.gameState.currency || 0)}`;
        }

        // Let modular UIs update any dynamic displays they control
        if (this.shopUI && typeof this.shopUI.refreshBalance === 'function') this.shopUI.refreshBalance();
    }
    
    animateHealthBar() {
        const healthBar = document.getElementById('health-bar');
        healthBar.classList.remove('flash-health');
        
        // Force reflow to restart animation
        void healthBar.offsetWidth;
        
        healthBar.classList.add('flash-health');
        
        // Remove class after animation completes
        setTimeout(() => {
            healthBar.classList.remove('flash-health');
        }, 600);
    }
    
    animateXPBar() {
        const xpBar = document.getElementById('xp-bar');
        xpBar.classList.remove('flash-xp');
        
        // Force reflow to restart animation
        void xpBar.offsetWidth;
        
        xpBar.classList.add('flash-xp');
        
        // Remove class after animation completes
        setTimeout(() => {
            xpBar.classList.remove('flash-xp');
        }, 600);
    }
    
    showGameOver() {
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.style.display = 'block';
    }
    
    // legacy hideStartButton / hideRestartButton removed intentionally

    // Delegate upgrade UI responsibilities
    showUpgradeSelection(choices, upgradeSystem) {
        // keep a reference so other managers (LevelUpManager) can read available choices
        this.upgradeChoices = Array.isArray(choices) ? choices.slice() : [];
        if (this.upgradeUI) this.upgradeUI.show(choices, upgradeSystem);
    }
    
    hideUpgradeSelection() {
        if (this.upgradeUI) this.upgradeUI.hide();
    }
    
    handleUpgradeSelection(index) {
        this.emit('upgradeSelected', index);
    }
    
    // Shop UI delegation
    showShop(offerings = [], shopController = null) {
        if (this.shopUI) this.shopUI.show(offerings, shopController);
    }

    hideShop() {
        if (this.shopUI) this.shopUI.hide();
    }
}