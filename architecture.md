### Core Principles
1. **Separation of Concerns**: Engine vs Game vs Content
2. **Single Responsibility**: Each file has one clear purpose
3. **Consistent Hierarchy**: Predictable file locations
4. **Minimal Duplication**: One authoritative source per concept

### Directory Structure
/
├── engine/                    # Core game engine (reusable)
│   ├── GameEngine.js
│   ├── systems/
│   │   ├── CollisionSystem.js
│   │   ├── InputHandler.js
│   │   ├── ParticleSystem.js
│   │   └── DamageTextSystem.js
│   ├── entities/
│   │   ├── Entity.js          # Base entity class
│   │   └── Bullet.js          # Generic bullet
│   └── components/
│       ├── HealthComponent.js
│       ├── MovementComponent.js
│       └── WeaponComponent.js
│
├── game/                      # Game-specific implementation
│   ├── Game.js                # Main game orchestrator
│   ├── GameState.js
│   ├── GameLoopManager.js
│   ├── managers/              # High-level game managers
│   │   ├── UIManager.js
│   │   ├── LevelUpManager.js
│   │   └── SidePanelManager.js
│   ├── systems/               # Game-specific systems
│   │   ├── EnemySpawner.js    # AUTHORITATIVE
│   │   ├── PowerUpSystem.js   # AUTHORITATIVE
│   │   ├── UpgradeSystem.js   # AUTHORITATIVE
│   │   ├── MovementSystem.js
│   │   ├── UtilitySystem.js
│   │   └── SynergySystem.js
│   ├── entities/              # Game-specific entities
│   │   ├── Player.js          # AUTHORITATIVE
│   │   └── Enemy.js
│   ├── weapons/
│   │   ├── BaseWeapon.js
│   │   ├── WeaponFactory.js
│   │   └── types/
│   ├── upgrades/
│   │   ├── BaseUpgrade.js
│   │   ├── UpgradeFactory.js
│   │   ├── UpgradeState.js
│   │   └── types/
│   └── components/            # Game-specific components
│       ├── PlayerStatsComponent.js
│       └── UtilityComponent.js
│
├── procedural/                # Procedural generation
│   ├── ProceduralUpgradeGenerator.js
│   └── ProceduralUpgradeSystem.js
│
├── utils/                     # Shared utilities
│   └── EventEmitter.js
│
├── styles/                    # All CSS files
│   ├── main.css
│   ├── ui-components.css
│   ├── animations.css
│   ├── overlays.css
│   ├── upgrade-cards.css
│   ├── side-panels.css
│   └── synergy-notifications.css
│
├── assets/                    # Static assets
│   ├── upgrade-icon-spritesheet.png
│   └── upgrade-icon-spritesheet-description.js
│
└── index.html
    styles.css                 # Main CSS import file
    game/main.js              # Entry point