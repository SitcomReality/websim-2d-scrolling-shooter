export class MovementComponent {
    constructor(baseSpeed = 5) {
        this.baseSpeed = baseSpeed;
        this.currentSpeed = baseSpeed;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    
    update(deltaTime, inputState) {
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        if (inputState.left) this.velocity.x = -this.currentSpeed;
        if (inputState.right) this.velocity.x = this.currentSpeed;
        if (inputState.up) this.velocity.y = -this.currentSpeed;
        if (inputState.down) this.velocity.y = this.currentSpeed;
        
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        // Clamp to bounds
        this.position.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.position.x));
        this.position.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.position.y));
    }
    
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }
    
    setBounds(minX, maxX, minY, maxY) {
        this.bounds = { minX, maxX, minY, maxY };
    }
    
    increaseSpeed(amount) {
        this.currentSpeed = this.baseSpeed + amount;
    }
    
    setSpeedMultiplier(multiplier) {
        this.currentSpeed = this.baseSpeed * multiplier;
    }
}

