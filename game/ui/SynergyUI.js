import { SynergySystem } from '../systems/SynergySystem.js';

export class SynergyUI {
    constructor(synergySystem) {
        this.synergySystem = synergySystem;
        this.synergyProgressIndicators = {};
        this.synergyCodex = {};
    }

    initialize() {
        // Create synergy progress indicators
        this.synergySystem.getActiveSynergies().forEach(synergy => {
            const indicator = document.createElement('div');
            indicator.className = 'synergy-progress-indicator';
            indicator.innerHTML = `
                <div class="synergy-name">${synergy.name}</div>
                <div class="synergy-description">${synergy.description}</div>
                <div class="synergy-progress-bar">
                    <div class="synergy-progress-fill" style="width: 0%"></div>
                </div>
            `;
            document.getElementById('synergy-overlay').appendChild(indicator);
            this.synergyProgressIndicators[synergy.name] = indicator;
        });

        // Create synergy codex
        this.synergyCodex = document.createElement('div');
        this.synergyCodex.className = 'synergy-codex';
        document.getElementById('synergy-overlay').appendChild(this.synergyCodex);
    }

    update() {
        // Update synergy progress indicators
        this.synergySystem.getActiveSynergies().forEach(synergy => {
            const indicator = this.synergyProgressIndicators[synergy.name];
            const progress = this.synergySystem.getSynergyProgress(synergy.name);
            indicator.querySelector('.synergy-progress-fill').style.width = `${progress}%`;
        });
    }

    showSynergyCodex() {
        // Show synergy codex
        this.synergyCodex.innerHTML = '';
        this.synergySystem.getActiveSynergies().forEach(synergy => {
            const entry = document.createElement('div');
            entry.className = 'synergy-codex-entry';
            entry.innerHTML = `
                <div class="synergy-name">${synergy.name}</div>
                <div class="synergy-description">${synergy.description}</div>
            `;
            this.synergyCodex.appendChild(entry);
        });
    }

    hideSynergyCodex() {
        // Hide synergy codex
        this.synergyCodex.innerHTML = '';
    }
}