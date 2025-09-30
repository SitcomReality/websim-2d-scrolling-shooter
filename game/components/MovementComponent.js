export class MovementComponent {
    constructor(baseSpeed = 5) {
        this.baseSpeed = baseSpeed;
        this.currentSpeed = baseSpeed;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        // new: acceleration/inertia tuning (small values give ~0.4-0.6s to reach/lose speed)
        this.acceleration = 0.12; // higher = faster to top speed
        this.friction = 0.10;     // higher = quicker slow-down
    }
    
    update(deltaTime, inputState) {
        this.velocity.x = this.velocity.x || 0;
        this.velocity.y = this.velocity.y || 0;
        const targetX = (inputState.left ? -1 : 0) + (inputState.right ? 1 : 0);
        const targetY = (inputState.up ? -1 : 0) + (inputState.down ? 1 : 0);

        // compute target velocity based on baseSpeed and directional input
        const targetVx = targetX * this.baseSpeed;
        const targetVy = targetY * this.baseSpeed;

        // approach target velocity using acceleration (simple exponential smoothing)
        const t = Math.min(1, (deltaTime / 16) * this.acceleration * 60); // frame-rate-normalized
        this.velocity.x += (targetVx - this.velocity.x) * t;
        this.velocity.y += (targetVy - this.velocity.y) * t;

        // apply friction when no input to slowly damp to zero
        if (targetX === 0) this.velocity.x *= (1 - Math.min(1, this.friction * (deltaTime/16)));
        if (targetY === 0) this.velocity.y *= (1 - Math.min(1, this.friction * (deltaTime/16)));

        // update position
        this.position.x += this.velocity.x * (deltaTime / 16);
        this.position.y += this.velocity.y * (deltaTime / 16);
        
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