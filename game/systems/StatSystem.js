export class StatSystem {
    constructor() {
        this.stats = new Map(); // id -> definition
        this._subscribers = new Map(); // event -> Set(callback)
        this._dirty = new Set(); // stats needing recompute
    }

    // Validation for StatDefinition shape (minimal)
    _validateDefinition(def) {
        if (!def || typeof def.id !== 'string' || typeof def.name !== 'string') {
            throw new Error('Invalid StatDefinition: id and name required');
        }
        if (typeof def.baseValue !== 'number') {
            throw new Error('Invalid StatDefinition: baseValue number required');
        }
    }

    registerStat(def) {
        this._validateDefinition(def);
        if (this.stats.has(def.id)) {
            throw new Error(`Stat with id "${def.id}" already registered`);
        }
        const normalized = {
            id: def.id,
            name: def.name,
            baseValue: def.baseValue,
            value: def.baseValue,
            maxValue: typeof def.maxValue === 'number' ? def.maxValue : null,
            softCap: typeof def.softCap === 'number' ? def.softCap : null,
            description: def.description || '',
            category: def.category || 'general',
            upgradeWeight: typeof def.upgradeWeight === 'number' ? def.upgradeWeight : 0,
            format: def.format || null,
            flatModifiers: [], // {source, value}
            percentModifiers: [], // {source, value}
            _cached: def.baseValue
        };
        this.stats.set(def.id, normalized);
        this._markDirty(def.id);
        this._emit('statsChanged', [def.id]);
        return normalized;
    }

    hasStat(id) {
        return this.stats.has(id);
    }

    getDefinition(id) {
        return this.stats.get(id) || null;
    }

    getAllStats() {
        return Array.from(this.stats.values()).map(s => ({ ...s }));
    }

    getUpgradableStats() {
        return Array.from(this.stats.values()).filter(s => s.upgradeWeight && s.upgradeWeight > 0).map(s => ({ ...s }));
    }

    getStatsByCategory(category) {
        return Array.from(this.stats.values()).filter(s => s.category === category).map(s => ({ ...s }));
    }

    setBaseValue(id, value) {
        const stat = this.stats.get(id);
        if (!stat) return false;
        const old = stat.baseValue;
        stat.baseValue = value;
        this._markDirty(id);
        this._recomputeIfNeeded(id);
        this._emit('statChanged', id, old, stat.value);
        this._emit('statsChanged', [id]);
        return true;
    }

    // modifier: { type: 'flat'|'percent', value: number, source: string }
    addModifier(statId, modifier) {
        if (!modifier || typeof modifier.value !== 'number' || !modifier.type) {
            throw new Error('Invalid modifier');
        }
        const stat = this.stats.get(statId);
        if (!stat) throw new Error(`Unknown stat ${statId}`);
        const entry = { source: modifier.source || 'anon', value: modifier.value };
        if (modifier.type === 'flat') stat.flatModifiers.push(entry);
        else if (modifier.type === 'percent') stat.percentModifiers.push(entry);
        else throw new Error('Modifier type must be flat or percent');
        this._markDirty(statId);
        this._recomputeIfNeeded(statId);
        return entry;
    }

    removeModifierBySource(statId, source) {
        const stat = this.stats.get(statId);
        if (!stat) return false;
        stat.flatModifiers = stat.flatModifiers.filter(m => m.source !== source);
        stat.percentModifiers = stat.percentModifiers.filter(m => m.source !== source);
        this._markDirty(statId);
        this._recomputeIfNeeded(statId);
        return true;
    }

    clearSourceModifiers(sourceId) {
        const changed = [];
        this.stats.forEach((stat, id) => {
            const beforeCount = stat.flatModifiers.length + stat.percentModifiers.length;
            stat.flatModifiers = stat.flatModifiers.filter(m => m.source !== sourceId);
            stat.percentModifiers = stat.percentModifiers.filter(m => m.source !== sourceId);
            const afterCount = stat.flatModifiers.length + stat.percentModifiers.length;
            if (beforeCount !== afterCount) {
                this._markDirty(id);
                changed.push(id);
            }
        });
        if (changed.length) {
            changed.forEach(id => this._recomputeIfNeeded(id));
            this._emit('statsChanged', changed);
        }
    }

    getStatValue(id) {
        const stat = this.stats.get(id);
        if (!stat) return null;
        this._recomputeIfNeeded(id);
        return stat.value;
    }

    // internal compute with deterministic stacking and soft-cap/clamp
    _computeFinal(stat) {
        const flat = stat.flatModifiers.reduce((s, m) => s + m.value, 0);
        const percent = stat.percentModifiers.reduce((s, m) => s + m.value, 0);
        let val = (stat.baseValue + flat) * (1 + percent);
        // soft cap: if provided, ease returns above softCap (gentle compression)
        if (typeof stat.softCap === 'number' && stat.softCap > 0 && val > stat.softCap) {
            // simple soft cap using sqrt compression beyond softCap
            const over = val - stat.softCap;
            val = stat.softCap + Math.sqrt(over) * 0.75;
        }
        if (typeof stat.maxValue === 'number') {
            val = Math.min(val, stat.maxValue);
        }
        // store
        stat.value = val;
        stat._cached = val;
        this._dirty.delete(stat.id);
        return val;
    }

    _markDirty(id) {
        this._dirty.add(id);
    }

    _recomputeIfNeeded(id) {
        const stat = this.stats.get(id);
        if (!stat) return;
        if (this._dirty.has(id)) {
            const old = stat.value;
            const newVal = this._computeFinal(stat);
            if (old !== newVal) {
                this._emit('statChanged', id, old, newVal);
            }
        }
    }

    // events: subscribe/unsubscribe
    on(event, cb) {
        if (!this._subscribers.has(event)) this._subscribers.set(event, new Set());
        this._subscribers.get(event).add(cb);
    }

    off(event, cb) {
        if (!this._subscribers.has(event)) return;
        this._subscribers.get(event).delete(cb);
    }

    _emit(event, ...args) {
        const set = this._subscribers.get(event);
        if (set) {
            set.forEach(cb => {
                try { cb(...args); } catch (e) { console.warn('StatSystem event handler error', e); }
            });
        }
    }
}

export default StatSystem;