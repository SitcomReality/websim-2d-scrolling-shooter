export default class StatDebugUI {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.containerId = 'stat-debug-overlay';
        this._createOverlay();
    }

    _createOverlay() {
        if (document.getElementById(this.containerId)) return;
        const overlay = document.createElement('div');
        overlay.id = this.containerId;
        Object.assign(overlay.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '320px',
            maxHeight: '80vh',
            overflow: 'auto',
            background: '#001122',
            border: '2px solid #00ffff',
            borderRadius: '8px',
            padding: '12px',
            color: '#00ffff',
            zIndex: 5000,
            display: 'none',
            fontFamily: 'Arial, sans-serif'
        });

        overlay.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="color:#ffff00;font-weight:bold;">Stat Debug</div>
                <div>
                    <button id="stat-debug-close" style="background:#ff0066;color:#fff;border:none;padding:6px;border-radius:6px;cursor:pointer;">Close</button>
                </div>
            </div>
            <div id="stat-debug-list" style="display:flex;flex-direction:column;gap:8px;"></div>
            <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end;">
                <button id="stat-debug-reset" style="padding:8px;border-radius:6px;border:none;background:#444;color:#fff;cursor:pointer;">Reset Defaults</button>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#stat-debug-close').addEventListener('click', () => this.hide());
        overlay.querySelector('#stat-debug-reset').addEventListener('click', () => this._resetDefaults());
        this.overlay = overlay;
        this.listEl = overlay.querySelector('#stat-debug-list');
    }

    show() {
        if (!this.overlay) this._createOverlay();
        this._rebuildList();
        this.overlay.style.display = 'block';
    }

    hide() {
        if (this.overlay) this.overlay.style.display = 'none';
    }

    _rebuildList() {
        this.listEl.innerHTML = '';
        const player = (window.gameInstance && window.gameInstance.player) ? window.gameInstance.player : null;
        const statSystem = player && player.statSystem ? player.statSystem : null;
        if (!statSystem) {
            const node = document.createElement('div');
            node.style.color = '#cccccc';
            node.textContent = 'No StatSystem found on player.';
            this.listEl.appendChild(node);
            return;
        }

        const stats = statSystem.getAllStats();
        stats.forEach(def => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '8px';
            row.style.alignItems = 'center';
            row.style.border = '1px solid rgba(0,255,255,0.04)';
            row.style.padding = '6px';
            row.style.borderRadius = '6px';
            row.innerHTML = `
                <div style="flex:1;">
                    <div style="color:#00ffff;font-weight:bold;">${def.name} <span style="color:#888;font-weight:normal;font-size:12px;">(${def.id})</span></div>
                    <div style="color:#cccccc;font-size:12px;">value: <span style="color:#ffff00;font-weight:bold;">${(typeof def.value === 'number') ? def.value : 'N/A'}</span></div>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
                    <input data-stat="${def.id}" type="number" step="0.01" value="${def.baseValue}" style="width:80px;padding:6px;border-radius:6px;border:1px solid rgba(0,255,255,0.08);background:#07121a;color:#fff;">
                    <div style="display:flex;gap:6px;">
                        <button data-apply="${def.id}" style="padding:6px;border-radius:6px;border:none;background:#00ffff;color:#000;cursor:pointer;">Apply</button>
                        <button data-clear="${def.id}" style="padding:6px;border-radius:6px;border:none;background:#444;color:#fff;cursor:pointer;">Clear</button>
                    </div>
                </div>
            `;
            // attach handlers
            row.querySelector(`button[data-apply="${def.id}"]`).addEventListener('click', () => {
                const input = row.querySelector(`input[data-stat="${def.id}"]`);
                const val = parseFloat(input.value);
                if (!isNaN(val)) {
                    try {
                        statSystem.setBaseValue(def.id, val);
                        // ensure player components react (e.g., charge refresh)
                        if (player && player.chargeComponent && typeof player.chargeComponent.refreshFromStats === 'function') player.chargeComponent.refreshFromStats();
                        if (player && player.movementComponent && typeof player.movementComponent.setPosition === 'function') {
                            // update movement base speed if stat changed
                            if (def.id === 'speed') player.movementComponent.baseSpeed = statSystem.getStatValue('speed') || player.movementComponent.baseSpeed;
                        }
                        // Force side panels & UI refresh
                        if (window.gameInstance && window.gameInstance.sidePanelManager) window.gameInstance.sidePanelManager.updateSidePanels();
                        if (window.gameInstance && window.gameInstance.uiManager) window.gameInstance.uiManager.update();
                        this._rebuildList();
                    } catch (e) {
                        console.warn('Failed to apply stat change', e);
                    }
                }
            });
            row.querySelector(`button[data-clear="${def.id}"]`).addEventListener('click', () => {
                try {
                    statSystem.removeModifierBySource(def.id + '_debug'); // best-effort cleanup
                } catch (e) {}
                // restore base from definition when possible (no-op here)
                this._rebuildList();
            });

            this.listEl.appendChild(row);
        });
    }

    _resetDefaults() {
        const player = (window.gameInstance && window.gameInstance.player) ? window.gameInstance.player : null;
        const statSystem = player && player.statSystem ? player.statSystem : null;
        if (!statSystem) return;
        // Reset known core stats to canonical defaults used in Player.reset/ctor
        const defaults = {
            maxHealth: 100,
            health: 100,
            damage: 1,
            speed: 3,
            fireRate: 50,
            criticalChance: 0.1,
            criticalDamage: 0.5,
            luck: 1.0,
            lifesteal: 0,
            chargeSpeed: 1.0,
            maxCharge: 8
        };
        Object.entries(defaults).forEach(([id, val]) => {
            try { if (statSystem.hasStat(id)) statSystem.setBaseValue(id, val); } catch(e){}
        });
        // Ensure components update
        if (player && player.chargeComponent && typeof player.chargeComponent.refreshFromStats === 'function') player.chargeComponent.refreshFromStats();
        if (window.gameInstance && window.gameInstance.sidePanelManager) window.gameInstance.sidePanelManager.updateSidePanels();
        if (window.gameInstance && window.gameInstance.uiManager) window.gameInstance.uiManager.update();
        this._rebuildList();
    }
}