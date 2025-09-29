import { PlayerComponent } from './PlayerComponent.js';

export class MovementComponent extends PlayerComponent {
    constructor(player) {
        super(player);
        this.speed = 5;
        this.velocity = { x: 0, y: 0 };
    }

    update(deltaTime, inputState) {
        // Calculate movement based on input
        this.velocity.x = 0;
        this.velocity.y = 0;

        if (inputState.left) this.velocity.x = -this.speed;
        if (inputState.right) this.velocity.x = this.speed;
        if (inputState.up) this.velocity.y = -this.speed;
        if (inputState.down) this.velocity.y = this.speed;

        // Apply movement
        this.player.x += this.velocity.x;
        this.player.y += this.velocity.y;

        // Keep player in bounds
        this.player.x = Math.max(20, Math.min(780, this.player.x));
        this.player.y = Math.max(20, Math.min(580, this.player.y));
    }

    applyUpgrade(upgradeData) {
        if (upgradeData.speed) {
            this.speed += upgradeData.speed;
        }
    }

    reset() {
        this.velocity = { x: 0, y: 0 };
    }
}