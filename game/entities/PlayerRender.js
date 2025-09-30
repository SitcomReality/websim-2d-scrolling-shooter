export function renderPlayer(player, ctx) {
    ctx.save();

    if (player.statsComponent.isInvulnerable()) {
        const flash = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        ctx.globalAlpha = 0.7 + flash * 0.3;
    }

    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;

    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 20);
    ctx.lineTo(player.x - 20, player.y + 20);
    ctx.lineTo(player.x, player.y + 10);
    ctx.lineTo(player.x + 20, player.y + 20);
    ctx.closePath();
    ctx.fill();

    // Charge indicator
    if (player.weaponComponent.isCharging && player.weaponComponent.chargedBullets > 0) {
        const chargeRatio = Math.min((Date.now() - (player.weaponComponent.chargeStartTime || 0)) / (player.weaponComponent.maxChargeTime || 1), 1);
        const radius = 20 + chargeRatio * 10;
        const alpha = 0.3 + chargeRatio * 0.4;

        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#00ffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.weaponComponent.chargedBullets, player.x, player.y + 5);
    }

    ctx.restore();

    // Render bullets via weapon component
    player.weaponComponent.render(ctx);
}