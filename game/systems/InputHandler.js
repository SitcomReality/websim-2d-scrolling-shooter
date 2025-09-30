export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            // Map touch movement to keys
            this.keys['ArrowLeft'] = deltaX < -30;
            this.keys['ArrowRight'] = deltaX > 30;
            this.keys['ArrowUp'] = deltaY < -30;
            this.keys['ArrowDown'] = deltaY > 30;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['Space'] = true;
            setTimeout(() => this.keys['Space'] = false, 100);
        });
    }
    
    getInputState() {
        return {
            left: this.keys['ArrowLeft'] || this.keys['KeyA'],
            right: this.keys['ArrowRight'] || this.keys['KeyD'],
            up: this.keys['ArrowUp'] || this.keys['KeyW'],
            down: this.keys['ArrowDown'] || this.keys['KeyS'],
            shoot: this.keys['Space']
        };
    }
}

