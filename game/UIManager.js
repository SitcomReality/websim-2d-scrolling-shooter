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
            upgradeChoices: document.getElementById('upgrade-choices')
        };
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => {
            this.emit('start');
        });
        
        this.elements.restartBtn.addEventListener('click', () => {
            this.emit('restart');
        });

        // Add dev panel event listeners
        const devLevelUpBtn = document.getElementById('dev-level-up');
        if (devLevelUpBtn) {
            devLevelUpBtn.addEventListener('click', () => {
                this.emit('devLevelUp');
            });
        }

        const devMaxHealthBtn = document.getElementById('dev-max-health');
        if (devMaxHealthBtn) {
            devMaxHealthBtn.addEventListener('click', () => {
                this.emit('devMaxHealth');
            });
        }

        const devGodModeBtn = document.getElementById('dev-god-mode');
        if (devGodModeBtn) {
            devGodModeBtn.addEventListener('click', () => {
                this.emit('devGodMode');
            });
        }

        const devClearEnemiesBtn = document.getElementById('dev-clear-enemies');
        if (devClearEnemiesBtn) {
            devClearEnemiesBtn.addEventListener('click', () => {
                this.emit('devClearEnemies');
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