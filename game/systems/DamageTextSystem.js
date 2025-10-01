export class DamageTextSystem {
    constructor() {
        this.damageTexts = [];
        this.xpTexts = []; // Added XP texts array
    }

    addDamage(x, y, amount, damageType = 'physical') {
        this.damageTexts.push(new DamageText(x, y, amount, damageType));
    }

    addXP(x, y, amount) {
        this.xpTexts.push(new XPText(x, y, amount));
    }

    update(deltaTime) {
        this.damageTexts.forEach(text => text.update(deltaTime));
        this.damageTexts = this.damageTexts.filter(text => text.alive);
        
        this.xpTexts.forEach(text => text.update(deltaTime));
        this.xpTexts = this.xpTexts.filter(text => text.alive);
    }

    render(ctx) {
        this.damageTexts.forEach(text => text.render(ctx));
        this.xpTexts.forEach(text => text.render(ctx));
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
            electric: '#ffff00',
            critical: '#ffaa00'  // Distinct orange-yellow for crits
        };
        
        this.color = colors[damageType] || colors.physical;
        this.velocity = { x: (Math.random() - 0.5) * 2, y: -2 };
        this.lifetime = 1000;
        this.maxLifetime = 1000;
        this.alive = true;
        // Crits get larger base font size
        this.fontSize = damageType === 'critical' ? 20 : 16;
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
        ctx.shadowBlur = this.damageType === 'critical' ? 15 : 10;
        ctx.shadowColor = this.color;
        const prefix = this.damageType === 'critical' ? 'CRIT -' : '-';
        ctx.fillText(`${prefix}${Math.round(this.amount)}`, this.x, this.y);
        ctx.restore();
    }
}

class XPText {
    constructor(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.color = '#ffff00'; // Yellow for XP
        this.velocity = { x: (Math.random() - 0.5) * 1.5, y: -1.5 };
        this.lifetime = 1500; // milliseconds
        this.maxLifetime = 1500;
        this.alive = true;
        this.fontSize = 14;
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
        const fontSize = this.fontSize + (1 - alpha) * 2;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillText(`+${this.amount} XP`, this.x, this.y);
        ctx.restore();
    }
}