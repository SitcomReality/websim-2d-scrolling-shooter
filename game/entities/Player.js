        // Render bullets
-        this.weaponComponent.getBullets().forEach(bullet => bullet.render(ctx));
+        const bullets = this.weaponComponent.getBullets() || [];
+        bullets.forEach(bullet => {
+            if (bullet && typeof bullet.render === 'function') {
+                bullet.render(ctx);
+            } else if (bullet) {
+                ctx.save();
+                ctx.fillStyle = bullet.color || '#00ffff';
+                ctx.shadowBlur = 10;
+                ctx.shadowColor = bullet.color || '#00ffff';
+                const w = bullet.width || 4;
+                const h = bullet.height || 10;
+                ctx.fillRect(bullet.x - w / 2, bullet.y - h / 2, w, h);
+                ctx.restore();
+            }
+        });

