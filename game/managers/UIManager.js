import { EventEmitter } from '../utils/EventEmitter.js';

export class UIManager extends EventEmitter {
    constructor(gameState) {
        super();
        this.gameState = gameState;
        this.upgradeChoices = [];
        
        this.elements = {
            canvas: document.getElementById('game-canvas'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            healthFill: document.getElementById('health-fill'),
            xpFill: document.getElementById('xp-fill'),
            scoreDisplay: document.getElementById('score-display'),
            levelDisplay: document.getElementById('level-display'),
            upgradeOverlay: document.getElementById('upgrade-selection-overlay'),
            upgradeChoices: document.getElementById('upgrade-choices'),
            currencyDisplay: document.getElementById('currency-display')
        };
        
        // Subscribe to currency change events (emitted by pickups)
        this.on('currencyChanged', (newAmount) => {
            if (this.elements.currencyDisplay) this.elements.currencyDisplay.textContent = `Currency: ${Math.round(newAmount)}`;
        });
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => {
            this.emit('start');
        });
        
        this.elements.restartBtn.addEventListener('click', () => {
            this.emit('restart');
        });
        
        const openShopBtn = document.getElementById('open-shop-btn');
        if (openShopBtn) {
            openShopBtn.addEventListener('click', () => this.emit('openStatShop'));
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
        this.elements.restartBtn.style.display = 'block';
    }
    
    hideStartButton() {
        this.elements.startBtn.style.display = 'none';
    }
    
    hideRestartButton() {
        this.elements.restartBtn.style.display = 'none';
    }
    
    showUpgradeSelection(choices, upgradeSystem) {
        this.upgradeChoices = choices;
        this.elements.upgradeChoices.innerHTML = '';
        
        // Add reroll button if available
        const rerollContainer = document.createElement('div');
        rerollContainer.className = 'reroll-container';
        
        const rerollButton = document.createElement('button');
        rerollButton.className = 'reroll-button';
        rerollButton.textContent = `Reroll (${upgradeSystem.getRerollCount()} remaining)`;
        
        const rerollCost = upgradeSystem.getRerollCost();
        const canReroll = upgradeSystem.canReroll(this.gameState.xp, this.gameState.playerLuck || 1.0);
        
        if (canReroll) {
            rerollButton.disabled = false;
            rerollButton.textContent = `Reroll (${upgradeSystem.getRerollCount()} remaining)`;
        } else {
            rerollButton.disabled = true;
            if (this.gameState.xp < rerollCost) {
                rerollButton.textContent = `Need ${rerollCost} XP`;
            } else {
                rerollButton.textContent = 'No rerolls left';
            }
        }
        
        rerollButton.addEventListener('click', () => {
            this.emit('rerollUpgrades');
        });
        
        rerollContainer.appendChild(rerollButton);
        this.elements.upgradeChoices.appendChild(rerollContainer);
        
        // Add upgrade cards
        choices.forEach((choice, index) => {
            const card = upgradeSystem.createUpgradeCard(choice, index);
            card.addEventListener('click', () => {
                this.handleUpgradeSelection(index);
            });
            this.elements.upgradeChoices.appendChild(card);
        });
        
        this.elements.upgradeOverlay.style.display = 'flex';
    }
    
    hideUpgradeSelection() {
        this.elements.upgradeOverlay.style.display = 'none';
    }
    
    handleUpgradeSelection(index) {
        this.emit('upgradeSelected', index);
    }
}