import { Game } from './Game.js';

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🎮 Initializing game...');
        window.gameInstance = new Game();
        console.log('✅ Game initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        console.error('📍 Stack:', error.stack);
        
        // Log to localStorage for debugging
        const errorLog = localStorage.getItem('gameErrorLog') || '';
        const newLog = `${errorLog}\n[${new Date().toISOString()}] Game init failed: ${error.message}\n${error.stack}`;
        localStorage.setItem('gameErrorLog', newLog);
        
        // Show user-friendly error
        document.body.innerHTML = `
            <div style="color: red; padding: 20px; font-family: monospace; background: #000; min-height: 100vh;">
                <h2>🎮 Game Initialization Failed</h2>
                <p><strong>Error:</strong> ${error.message}</p>
                <details style="margin-top: 10px;">
                    <summary>Technical Details</summary>
                    <pre style="font-size: 12px; overflow-x: auto;">${error.stack}</pre>
                </details>
                <p style="margin-top: 20px;">
                    <strong>💡 Suggestions:</strong>
                </p>
                <ul>
                    <li>Check browser console for detailed import errors</li>
                    <li>Verify all JavaScript files are accessible</li>
                    <li>Check network tab for 404 errors</li>
                </ul>
            </div>
        `;
    }
});