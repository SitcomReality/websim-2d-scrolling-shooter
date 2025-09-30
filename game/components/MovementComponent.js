export class MovementComponent {
    constructor(baseSpeed = 5) {
        this.baseSpeed = baseSpeed;
        this.currentSpeed = baseSpeed;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        // inertia / smoothing parameters
        this.acceleration = 0.12; // lower -> slower to reach full speed
        this.friction = 0.06;     // lower -> gentler slow down when input stops
    }
    
    update(deltaTime, inputState) {
        // Compute target velocity from input
        const dtFactor = Math.max(0.5, deltaTime / 16); // normalize to ~60fps step with lower bound
        const targetX = (inputState.left ? -1 : 0) + (inputState.right ? 1 : 0);
        const targetY = (inputState.up ? -1 : 0) + (inputState.down ? 1 : 0);
        const targetVelX = targetX * this.currentSpeed;
        const targetVelY = targetY * this.currentSpeed;

        // accelerate velocity toward target
        const accel = Math.min(1, this.acceleration * dtFactor);
        this.velocity.x += (targetVelX - this.velocity.x) * accel;
        this.velocity.y += (targetVelY - this.velocity.y) * accel;

        // apply friction when near-zero input to gently slow down
        if (targetX === 0) this.velocity.x *= (1 - Math.min(1, this.friction * dtFactor));
        if (targetY === 0) this.velocity.y *= (1 - Math.min(1, this.friction * dtFactor));

        // integrate position
        this.position.x += this.velocity.x * (dtFactor);
        this.position.y += this.velocity.y * (dtFactor);
        
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