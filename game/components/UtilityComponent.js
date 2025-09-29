export class UtilityComponent {
    constructor() {
        this.utilities = new Map();
        this.cooldowns = new Map();
    }

    addUtility(id, config) {
        this.utilities.set(id, {
            name: config.name,
            cooldown: config.cooldown || 0,
            duration: config.duration || 0,
            onActivate: config.onActivate,
            onDeactivate: config.onDeactivate,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0
        });
    }

    update(deltaTime) {
        // Update cooldowns
        this.cooldowns.forEach((cooldown, id) => {
            if (cooldown > 0) {
                this.cooldowns.set(id, Math.max(0, cooldown - deltaTime));
            }
        });

        // Update active utilities
        this.utilities.forEach((utility, id) => {
            if (utility.isActive) {
                utility.remainingDuration -= deltaTime;
                if (utility.remainingDuration <= 0) {
                    this.deactivateUtility(id);
                }
            }
        });
    }

    activateUtility(id) {
        const utility = this.utilities.get(id);
        if (!utility || utility.isActive || this.cooldowns.get(id) > 0) {
            return false;
        }

        utility.isActive = true;
        utility.remainingDuration = utility.duration;
        
        if (utility.onActivate) {
            utility.onActivate();
        }

        // Set cooldown
        if (utility.cooldown > 0) {
            this.cooldowns.set(id, utility.cooldown);
        }

        return true;
    }

    deactivateUtility(id) {
        const utility = this.utilities.get(id);
        if (!utility || !utility.isActive) {
            return false;
        }

        utility.isActive = false;
        
        if (utility.onDeactivate) {
            utility.onDeactivate();
        }

        return true;
    }

    isUtilityActive(id) {
        const utility = this.utilities.get(id);
        return utility ? utility.isActive : false;
    }

    getCooldownRemaining(id) {
        return this.cooldowns.get(id) || 0;
    }

    getDurationRemaining(id) {
        const utility = this.utilities.get(id);
        return utility ? utility.remainingDuration : 0;
    }

    reset() {
        this.utilities.forEach((utility, id) => {
            if (utility.isActive) {
                this.deactivateUtility(id);
            }
        });
        this.cooldowns.clear();
    }
}