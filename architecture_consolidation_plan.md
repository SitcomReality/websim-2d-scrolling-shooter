# Architecture Consolidation Plan

## Current State Analysis

### Directory Structure Issues
- **Duplicate Systems**: Multiple systems directories (`/systems/` and `/game/systems/`)
- **Mixed Upgrade Systems**: Both `game/upgrades/UpgradeSystem.js` and `systems/UpgradeSystem.js` exist
- **Inconsistent Component Organization**: Components scattered between `game/components/` and entity files
- **Weapon System Fragmentation**: Weapon-related files spread across multiple directories

### Identified Redundancies

#### 1. Upgrade System Duplication
- `game/upgrades/UpgradeSystem.js` - Main upgrade management
- `systems/UpgradeSystem.js` - Legacy version with basic functionality
- `systems/ProceduralUpgradeSystem.js` - Procedural upgrade generation

#### 2. System Organization
- `systems/` contains: Collision, DamageText, EnemySpawner, Particle, PowerUp, Synergy
- `game/systems/` contains: EnemySpawner (duplicate), InputHandler, Movement, Utility

#### 3. Component Architecture
- Player component logic split between `entities/Player.js` and `game/entities/Player.js`
- Weapon components scattered across `game/weapons/`, `game/components/`, and weapon types

## Proposed Architecture

### Suggested File Structure

