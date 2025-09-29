import { GameEngine } from '../engine/GameEngine.js';
import { Player } from './entities/Player.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { InputHandler } from '../systems/InputHandler.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { PowerUpSystem } from '../systems/PowerUpSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { UIManager } from './UIManager.js';
import { GameState } from './GameState.js';
import { GameLoopManager } from './GameLoopManager.js';
import { SidePanelManager } from './SidePanelManager.js';
import { LevelUpManager } from './LevelUpManager.js';

