export default class UpgradeUI {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.container = document.getElementById('upgrade-selection-overlay');
        this.choicesEl = document.getElementById('upgrade-choices');
    }

    show(choices, upgradeSystem) {
        this.choices = choices || [];
        this.upgradeSystem = upgradeSystem;
        if (!this.container || !this.choicesEl) return;

        this.choicesEl.innerHTML = '';

        // Add reroll button if available
        const rerollContainer = document.createElement('div');
        rerollContainer.className = 'reroll-container';

        const rerollButton = document.createElement('button');
        rerollButton.className = 'reroll-button';
        const canReroll = upgradeSystem && (typeof upgradeSystem.canReroll === 'function') ? upgradeSystem.canReroll(this.uiManager.gameState.xp, this.uiManager.gameState.playerLuck || 1.0) : false;
        const rerollCost = upgradeSystem && typeof upgradeSystem.getRerollCost === 'function' ? upgradeSystem.getRerollCost() : 0;
        rerollButton.disabled = !canReroll;
        rerollButton.textContent = canReroll ? `Reroll (${upgradeSystem.getRerollCount()} remaining)` : (this.uiManager.gameState.xp < rerollCost ? `Need ${rerollCost} XP` : 'No rerolls left');
        rerollButton.addEventListener('click', () => this.uiManager.emit('rerollUpgrades'));
        rerollContainer.appendChild(rerollButton);
        this.choicesEl.appendChild(rerollContainer);

        (choices || []).forEach((choice, index) => {
            const card = (upgradeSystem && typeof upgradeSystem.createUpgradeCard === 'function') ? upgradeSystem.createUpgradeCard(choice, index) : this._createSimpleCard(choice);
            card.addEventListener('click', () => this.uiManager.handleUpgradeSelection(index));
            this.choicesEl.appendChild(card);
        });

        this.container.style.display = 'flex';
    }

    hide() {
        if (this.container) this.container.style.display = 'none';
    }

    _createSimpleCard(choice) {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.textContent = choice.name || choice.upgrade?.name || 'Upgrade';
        return card;
    }
}