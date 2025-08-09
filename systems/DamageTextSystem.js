export class DamageTextSystem {
    constructor() {
        this.damageTexts = [];
    }

    addDamage(x, y, amount, damageType = 'physical') {
        this.damageTexts.push(new DamageText(x, y, amount, damageType));
    }

    update(deltaTime) {
        this.damageTexts.forEach(text => text.update(deltaTime));
        this.damageTexts = this.damageTexts.filter(text => text.alive);
    }

    render(ctx) {
        this.damageTexts.forEach(text => text.render(ctx));
    }
}

class DamageText {
    constructor(x, y, amount, damageType) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.damageType = damageType;
        
        const colors = {
            physical: '#ff6666',
            magic: '#9370db',
            nanobot: '#00ff00',
            fire: '#ff4500',
            ice: '#00bfff',
            electric: '#ffff00'
        };
        
        this.color = colors[damageType] || colors.physical;
        this.velocity = { x: (Math.random() - 0.5) * 2, y: -2 };
        this.lifetime = 1000; // milliseconds
        this.maxLifetime = 1000;
        this.alive = true;
        this.fontSize = 16;
    }

    update(deltaTime) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.lifetime -= deltaTime;
        
        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }

    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        const fontSize = this.fontSize + (1 - alpha) * 4;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillText(`-${this.amount}`, this.x, this.y);
        ctx.restore();
    }
}