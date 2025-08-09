import { EventEmitter } from '../utils/EventEmitter.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';

export class UIManager extends EventEmitter {
    constructor(gameState) {
        super();
        this.gameState = gameState;
        this.upgradeChoices = [];
        this.upgradeSystem = new UpgradeSystem();
        
        this.setupUI();
    }
    
    setupUI() {
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.continueBtn = document.getElementById('continue-btn');
        this.levelUpOverlay = document.getElementById('level-up-overlay');
        this.upgradeSelectionOverlay = document.getElementById('upgrade-selection-overlay');
        this.upgradeChoicesContainer = document.getElementById('upgrade-choices');
        
        this.startBtn.addEventListener('click', () => this.emit('start'));
        this.restartBtn.addEventListener('click', () => this.emit('restart'));
        this.continueBtn.addEventListener('click', () => this.emit('continue'));
    }
    
    update() {
        const healthFill = document.getElementById('health-fill');
        const xpFill = document.getElementById('xp-fill');
        const scoreDisplay = document.getElementById('score-display');
        const levelDisplay = document.getElementById('level-display');
        
        if (healthFill) {
            healthFill.style.width = `${this.gameState.health}%`;
            if (this.gameState.health < 100) {
                healthFill.parentElement.classList.add('flash-health');
                setTimeout(() => {
                    healthFill.parentElement.classList.remove('flash-health');
                }, 600);
            }
        }
        
        if (xpFill) {
            const xpPercent = (this.gameState.xp / this.gameState.xpToNextLevel) * 100;
            xpFill.style.width = `${xpPercent}%`;
            if (xpPercent > 0) {
                xpFill.parentElement.classList.add('flash-xp');
                setTimeout(() => {
                    xpFill.parentElement.classList.remove('flash-xp');
                }, 600);
            }
        }
        
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${this.gameState.score}`;
        }
        
        if (levelDisplay) {
            levelDisplay.textContent = `Level ${this.gameState.level}`;
        }
    }
    
    hideStartButton() {
        if (this.startBtn) this.startBtn.style.display = 'none';
    }
    
    hideRestartButton() {
        if (this.restartBtn) this.restartBtn.style.display = 'none';
    }
    
    showGameOver() {
        if (this.restartBtn) this.restartBtn.style.display = 'block';
    }
    
    showLevelUp(level) {
        // Skip the level up overlay entirely
        const upgradeChoices = this.upgradeSystem.generateUpgradeChoices(
            level,
            this.upgradeSystem.playerUpgrades
        );
        this.showUpgradeSelection(upgradeChoices, this.upgradeSystem);
    }
    
    showUpgradeSelection(choices, upgradeSystem) {
        this.upgradeChoices = choices;
        this.upgradeSelectionOverlay.style.display = 'flex';
        this.upgradeChoicesContainer.innerHTML = '';
        
        choices.forEach((choice, index) => {
            const card = upgradeSystem.createUpgradeCard(choice, index);
            card.addEventListener('click', () => {
                this.emit('upgradeSelected', index);
            });
            this.upgradeChoicesContainer.appendChild(card);
        });
    }
    
    hideUpgradeSelection() {
        this.upgradeSelectionOverlay.style.display = 'none';
    }
    
    hideLevelUp() {
        this.levelUpOverlay.style.display = 'none';
    }
}