export class SaveLoadManager {
    constructor(gameState, player, shopSystem, statSystem) {
        this.gameState = gameState;
        this.player = player;
        this.shopSystem = shopSystem;
        this.statSystem = statSystem;
        this.storageKey = 'game_save_v1';
    }

    save() {
        try {
            const payload = {
                version: 1,
                timestamp: Date.now(),
                currency: this.gameState.currency || 0,
                ownedItems: (this.shopSystem && typeof this.shopSystem.getOwned === 'function') ? this.shopSystem.getOwned() : (this.gameState.ownedItems || []),
                rerollCount: (this.shopSystem && typeof this.shopSystem.rerollCount === 'number') ? this.shopSystem.rerollCount : (this.gameState.rerollCount || 0),
                shopSeed: this.gameState.shopSeed || Date.now(),
                // Snapshot statSystem base values and modifiers (best-effort)
                statSnapshot: this._serializeStatSystem()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(payload));
            return true;
        } catch (e) {
            console.warn('Save failed', e);
            return false;
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed) return null;

            // Restore primitive fields
            if (typeof parsed.currency === 'number') this.gameState.currency = parsed.currency;
            if (Array.isArray(parsed.ownedItems)) this.gameState.ownedItems = parsed.ownedItems.slice();
            if (typeof parsed.rerollCount === 'number') this.gameState.rerollCount = parsed.rerollCount;
            if (parsed.shopSeed) this.gameState.shopSeed = parsed.shopSeed;

            // Rehydrate stat system if snapshot present
            if (parsed.statSnapshot && this.statSystem) {
                this._applyStatSnapshot(parsed.statSnapshot);
            }

            // Re-apply owned shop items via ShopSystem (if present)
            if (this.shopSystem && typeof this.shopSystem.loadOwnedItems === 'function') {
                this.shopSystem.loadOwnedItems(this.gameState.ownedItems || [], this.player);
            }

            return parsed;
        } catch (e) {
            console.warn('Load failed', e);
            return null;
        }
    }

    _serializeStatSystem() {
        if (!this.statSystem || typeof this.statSystem.getAllStats !== 'function') return null;
        const all = this.statSystem.getAllStats();
        // capture baseValue, flat/percent modifiers and max/soft caps for rehydrate
        return all.map(s => ({
            id: s.id,
            baseValue: s.baseValue,
            maxValue: s.maxValue,
            softCap: s.softCap,
            flatModifiers: (s.flatModifiers || []).map(m => ({ source: m.source, value: m.value })),
            percentModifiers: (s.percentModifiers || []).map(m => ({ source: m.source, value: m.value }))
        }));
    }

    _applyStatSnapshot(snapshot) {
        try {
            // Clear existing stats and re-register base definitions where possible.
            // StatSystem exposes registerStat/getDefinition/addModifier/removeModifierBySource
            // We'll re-apply baseValue and modifiers
            snapshot.forEach(snap => {
                try {
                    const def = this.statSystem.getDefinition(snap.id);
                    if (def) {
                        // if stat exists, set its base value
                        this.statSystem.setBaseValue(snap.id, snap.baseValue);
                    } else {
                        // attempt to register minimal definition
                        this.statSystem.registerStat({
                            id: snap.id,
                            name: snap.id,
                            baseValue: snap.baseValue,
                            maxValue: snap.maxValue,
                            softCap: snap.softCap,
                            upgradeWeight: 0.1
                        });
                    }

                    // clear any previous modifiers from same sources then reapply
                    if (Array.isArray(snap.flatModifiers)) {
                        snap.flatModifiers.forEach(m => {
                            try { this.statSystem.addModifier(snap.id, { type: 'flat', value: m.value, source: m.source }); } catch(e){/*ignore*/ }
                        });
                    }
                    if (Array.isArray(snap.percentModifiers)) {
                        snap.percentModifiers.forEach(m => {
                            try { this.statSystem.addModifier(snap.id, { type: 'percent', value: m.value, source: m.source }); } catch(e){/*ignore*/ }
                        });
                    }
                } catch (e) {
                    console.warn('Failed applying stat snapshot for', snap.id, e);
                }
            });
        } catch (e) {
            console.warn('Stat snapshot apply failed', e);
        }
    }
}

export default SaveLoadManager;