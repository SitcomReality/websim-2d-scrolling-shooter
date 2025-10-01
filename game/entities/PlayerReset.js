-    player.weaponComponent = new WeaponComponent(player.weaponComponent?.weaponFactory || new (player.weaponComponent?.constructor || (function(){}))(), 'single', { damage: 1, fireRate: 1000 / (player.statSystem.getStatValue('fireRate') || 20) });
+    player.weaponComponent = new WeaponComponent(player.weaponComponent?.weaponFactory || new (player.weaponComponent?.constructor || (function(){}))(), 'single', { damage: 1, fireRate: 1000 / (player.statSystem.getStatValue('fireRate') || 20), owner: player });

