export class PlayerComponent {
    constructor(player) {
        this.player = player;
        this.enabled = true;
    }

    update(deltaTime) {
        // Override in subclasses
    }

    applyUpgrade(upgradeData) {
        // Override in subclasses to handle upgrades
    }

    reset() {
        // Override in subclasses to handle reset
    }
}