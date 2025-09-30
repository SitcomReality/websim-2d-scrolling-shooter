import { Entity } from './Entity.js';

export class CurrencyPickup extends Entity {
    constructor(x, y, amount = 1) {
        super(x, y, 18, 18);
        this.amount = amount;
        this.speedY = 0.6 + Math.random() * 0.6;
        this.color = '#ffd700';
        this.attracting = false;
        this.attractSpeed = 0.02 + Math.random() * 0.03;
        this.lifetime = 10000;
        this.maxLifetime = this.lifetime;
    }

    update(deltaTime) {
        // slow downward drift
        this.y += this.speedY;

        // attract to player if nearby
        const player = window.gameInstance && window.gameInstance.player;
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 140) {
                // start attraction stronger as closer
                this.attracting = true;
                const t = Math.max(0.03, (140 - dist) / 140);
                this.x += dx * this.attractSpeed * t * (deltaTime / 16);
                this.y += dy * this.attractSpeed * t * (deltaTime / 16);
            }
            // auto-collect when very close
            if (dist < 18) {
                this.apply(player);
                this.alive = false;
                return;
            }
        }

        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) this.alive = false;
    }

    render(ctx) {
        ctx.save();
        // golden shard with glow
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x + 8, this.y);
        ctx.lineTo(this.x, this.y + 8);
        ctx.lineTo(this.x - 8, this.y);
        ctx.closePath();
        ctx.fill();

        // small sparkle
        ctx.fillStyle = '#fff7d0';
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.restore();
    }

    apply(player) {
        try {
            const gs = window.gameInstance && window.gameInstance.gameState;
            const ui = window.gameInstance && window.gameInstance.uiManager;
            if (gs) {
                gs.currency = (gs.currency || 0) + this.amount;
                // sync xp-based shop currency if desired (not required)
                if (ui && typeof ui.emit === 'function') {
                    ui.emit('currencyChanged', gs.currency);
                }
            }
        } catch (e) {
            // ignore to avoid breaking game loop
        }
    }
}

export default CurrencyPickup;