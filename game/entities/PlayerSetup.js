-    playerInstance.weaponComponent = new WeaponComponent(weaponFactory, 'single', { damage: playerInstance.statSystem.getStatValue('damage') || 1, fireRate: 1000 / (playerInstance.statSystem.getStatValue('fireRate') || 20) });
+    playerInstance.weaponComponent = new WeaponComponent(weaponFactory, 'single', { damage: playerInstance.statSystem.getStatValue('damage') || 1, fireRate: 1000 / (playerInstance.statSystem.getStatValue('fireRate') || 20), owner: playerInstance });

