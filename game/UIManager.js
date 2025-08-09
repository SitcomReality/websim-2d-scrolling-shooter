import { EventEmitter } from '../utils/EventEmitter.js';

export class UIManager extends EventEmitter {
    constructor(gameState) {
        super();
        this.gameState = gameState;
        this.upgradeChoices = [];
        this.lastHealth = 100;
        this.lastXp = 0;
        this.initializeElements();
    }
    
    initializeElements() {
        this.scoreDisplay = document.getElementById('score-display');
        this.healthFill = document.getElementById('health-fill');
        this.xpFill = document.getElementById('xp-fill');
        this.levelDisplay = document.getElementById('level-display');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.levelUpOverlay = document.getElementById('level-up-overlay');
        this.continueBtn = document.getElementById('continue-btn');
        this.upgradeSelectionOverlay = document.getElementById('upgrade-selection-overlay');
        this.upgradeChoicesContainer = document.getElementById('upgrade-choices');
        this.upgradeTitle = document.getElementById('upgrade-title');
        this.levelUpLevel = document.getElementById('level-up-level');
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.emit('start'));
        this.restartBtn.addEventListener('click', () => this.emit('restart'));
        this.continueBtn.addEventListener('click', () => this.emit('continue'));
    }
    
    update() {
        this.scoreDisplay.textContent = `Score: ${this.gameState.score}`;
        
        // Health change animation
        if (this.gameState.health !== this.lastHealth) {
            this.healthFill.style.width = `${this.gameState.health}%`;
            document.getElementById('health-bar').classList.add('flash-health');
            setTimeout(() => {
                document.getElementById('health-bar').classList.remove('flash-health');
            }, 600);
            this.lastHealth = this.gameState.health;
        }
        
        // XP change animation
        const xpPercentage = (this.gameState.xp / this.gameState.xpToNextLevel) * 100;
        if (this.gameState.xp !== this.lastXp && this.gameState.xp > this.lastXp) {
            this.xpFill.style.width = `${xpPercentage}%`;
            document.getElementById('xp-bar').classList.add('flash-xp');
            setTimeout(() => {
                document.getElementById('xp-bar').classList.remove('flash-xp');
            }, 600);
        }
        
        this.levelDisplay.textContent = `Level ${this.gameState.level}`;
        this.lastXp = this.gameState.xp;
    }
    
    showUpgradeSelection(upgradeChoices, upgradeSystem) {
        this.upgradeChoices = upgradeChoices;
        
        this.levelUpOverlay.style.display = 'none';
        
        this.upgradeChoicesContainer.innerHTML = '';
        
        upgradeChoices.forEach((choice, index) => {
            const card = this.createUpgradeCard(choice, index, upgradeSystem);
            this.upgradeChoicesContainer.appendChild(card);
        });
        
        this.upgradeSelectionOverlay.style.display = 'flex';
    }
    
    createUpgradeCard(choice, index, upgradeSystem) {
        const card = document.createElement('div');
        card.className = `upgrade-card ${choice.rarity}`;
        
        const upgrade = choice.upgrade;
        const values = choice.values;
        
        let description = '';
        let valueText = '';
        
        if (upgrade.name === 'Max Health') {
            description = 'Increases your maximum health';
            valueText = `+${values.health} HP`;
        } else if (upgrade.name === 'Damage Boost') {
            description = 'Increases your bullet damage';
            valueText = `+${values.damage} Damage`;
        } else if (upgrade.name === 'Movement Speed') {
            description = 'Increases your movement speed';
            valueText = `+${values.speed} Speed`;
        } else if (upgrade.name === 'Fire Rate') {
            description = 'Increases your firing speed';
            valueText = `${Math.round((1 - values.fireRateMultiplier) * 100)}% Faster`;
        } else if (upgrade.name === 'Health Pickup Chance') {
            description = 'Increases chance of health pickups from enemies';
            valueText = `+${Math.round(values.chanceIncrease * 100)}% Chance`;
        } else if (upgrade.name === 'Health Pickup Value') {
            description = 'Increases health restored by pickups';
            valueText = `+${values.amountIncrease} Health`;
        }
        
        card.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-description">${description}</div>
            <div class="upgrade-value">${valueText}</div>
            <div class="upgrade-rarity">${choice.rarity}</div>
        `;
        
        card.addEventListener('click', () => this.emit('upgradeSelected', index));
        
        return card;
    }
    
    showGameOver() {
        this.restartBtn.style.display = 'block';
    }
    
    hideStartButton() {
        this.startBtn.style.display = 'none';
    }
    
    hideRestartButton() {
        this.restartBtn.style.display = 'none';
    }
    
    showLevelUp(level) {
        this.levelUpLevel.textContent = level;
        this.levelUpOverlay.style.display = 'flex';
    }
    
    hideUpgradeSelection() {
        this.upgradeSelectionOverlay.style.display = 'none';
    }
}