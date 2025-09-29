export class UtilitySystem {
    constructor() {
        this.utilities = new Map();
        this.activeEffects = [];
    }

    registerUtility(id, utilityComponent) {
        this.utilities.set(id, utilityComponent);
    }

    unregisterUtility(id) {
        this.utilities.delete(id);
    }

    update(deltaTime) {
        // Update active effects
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.duration -= deltaTime;
            if (effect.duration <= 0) {
                effect.onExpire();
                return false;
            }
            return true;
        });

        // Update utility components
        this.utilities.forEach(utility => {
            if (utility.update) {
                utility.update(deltaTime);
            }
        });
    }

    addEffect(effect) {
        this.activeEffects.push(effect);
        if (effect.onApply) {
            effect.onApply();
        }
    }

    hasEffect(type) {
        return this.activeEffects.some(effect => effect.type === type);
    }

    getEffect(type) {
        return this.activeEffects.find(effect => effect.type === type);
    }

    clearEffects() {
        this.activeEffects.forEach(effect => {
            if (effect.onExpire) {
                effect.onExpire();
            }
        });
        this.activeEffects = [];
    }

    reset() {
        this.clearEffects();
        this.utilities.clear();
    }
}

export class Effect {
    constructor(type, duration, onApply = null, onExpire = null) {
        this.type = type;
        this.duration = duration;
        this.onApply = onApply;
        this.onExpire = onExpire;
    }
}