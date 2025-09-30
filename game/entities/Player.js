    this.movementComponent.setPosition(x, y);

+    // Ensure entity position matches movement component immediately
+    this.x = this.movementComponent.position.x;
+    this.y = this.movementComponent.position.y;
    
    // Visual properties
    this.color = '#00ffff';

