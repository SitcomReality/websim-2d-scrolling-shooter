    render(ctx) {
        if (!this.alive) return; // Don't render destroyed enemies
        
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 15);
        ctx.lineTo(this.x - 15, this.y - 15);
        ctx.lineTo(this.x + 15, this.y - 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Render enemy bullets
        this.bullets.forEach(bullet => bullet.render(ctx));
    }

