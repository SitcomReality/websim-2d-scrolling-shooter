export class SidePanelManager {
    constructor(player, enemySpawner) {
        this.player = player;
        this.enemySpawner = enemySpawner;
    }

    updateSidePanels() {
        this.updateShipStatsPanel();
        this.updateUnlockedEnemiesPanel();
    }

    updateShipStatsPanel() {
        const statsList = document.getElementById('ship-stats-list');
        if (!statsList) return;

        statsList.innerHTML = '';

        // Prefer statSystem if available
        const stats = (this.player && this.player.statSystem) ?
            this.player.statSystem.getAllStats() :
            [
                { id: 'speed', name: 'Speed', value: this.player.speed?.toFixed(1) || '5.0' },
                { id: 'fireRate', name: 'Fire Rate', value: Math.round(1000 / (this.player.fireRate || 150)), unit: '/sec' },
                { id: 'damage', name: 'Damage', value: this.player.damage || 1 },
                { id: 'maxHealth', name: 'Max Health', value: this.player.maxHealth || 100, unit: 'HP' },
                { id: 'healthPickupChance', name: 'Health Drop Chance', value: Math.round((this.player.healthPickupChance || 0.02) * 100), unit: '%' },
                { id: 'healthPickupAmount', name: 'Health Restore', value: this.player.healthPickupAmount || 5, unit: 'HP' },
                { id: 'luck', name: 'Luck', value: (this.player.luck?.toFixed ? this.player.luck.toFixed(1) : (this.player.statSystem ? this.player.statSystem.getStatValue('luck') : '1.0')) }
            ];

        // If statSystem returned full definitions, map to display-friendly objects
        const normalized = stats.map(s => {
            if (s && s.id && typeof s.value !== 'undefined') {
                return { name: s.name || s.id, value: (typeof s.value === 'number' ? (Number.isInteger(s.value) ? s.value : s.value.toFixed(2)) : s.value), unit: s.unit || '' };
            } else if (s && s.name) {
                return { name: s.name, value: s.value, unit: s.unit || '' };
            }
            return { name: s.id || 'stat', value: s.value || '?' };
        });

        normalized.forEach(stat => {
            const item = document.createElement('div');
            item.className = 'stat-item';
            item.innerHTML = `
                <div class="stat-name">${stat.name}</div>
                <div class="stat-value">${stat.value}${stat.unit || ''}</div>
            `;
            statsList.appendChild(item);
        });
    }

    updateUnlockedEnemiesPanel() {
        const enemiesList = document.getElementById('unlocked-enemies-list');
        if (!enemiesList) return;

        enemiesList.innerHTML = '';
        this.enemySpawner.unlockedTypes.forEach(type => {
            const item = document.createElement('div');
            item.className = 'enemy-item';

            let description = '';
            let color = '#ff9900';

            switch(type) {
                case 'basic':
                    description = 'Standard enemy';
                    color = '#ff9900';
                    break;
                case 'fast':
                    description = 'Quick and agile';
                    color = '#ff6666';
                    break;
                case 'zigzag':
                    description = 'Moves erratically';
                    color = '#ff00ff';
                    break;
                case 'tank':
                    description = 'Slow but tough';
                    color = '#ff0000';
                    break;
            }

            item.innerHTML = `
                <div class="enemy-name" style="color: ${color}">${type.toUpperCase()}</div>
                <div class="enemy-description">${description}</div>
            `;
            enemiesList.appendChild(item);
        });
    }
}