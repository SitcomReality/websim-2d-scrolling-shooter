# Design Document: Charge Ability & Upgrade Synergy

## 1. Introduction & Core Philosophy

The goal of this document is to establish clear, extensible conventions for how the **Charge ability** interacts with our upgrade and item systems. The Charge ability should feel like a core tactical choice—a "super move" that synergizes with the player's build, not just an alternative firing mode.

Our core philosophy will be:
*   **Risk vs. Reward:** Charging makes the player vulnerable by pausing their primary fire. The payoff for a full charge must be significant and satisfying. Upgrades can either mitigate this risk or amplify the reward.
*   **Charge Amplifies, It Doesn't Replace:** When a player charges, the release should feel like a "supercharged" version of their current weapon's capabilities. A Spread Gun should release a super-spread; a Homing weapon should release a swarm of missiles.
*   **Modular & Clear Roles:**
    *   **Shop Items** should be the primary way to introduce *new mechanics* (e.g., enabling Multi-shot, converting your weapon to Lightning).
    *   **Level-Up Upgrades** should primarily enhance the *stats* of those mechanics (e.g., increasing Multi-shot projectile count, improving Lightning chain range).

## 2. The Projectile Lifecycle: Hooks for Upgrades

We can think of a projectile's existence in four key phases. By defining these, we create clear "hooks" for items and upgrades to modify.

*   **Phase 1: On Fire (Ejection)**
    *   _What happens when projectiles leave the ship?_
    *   **Examples:** Multi-shot, Spread Shot, Side Shots, Burst Fire.
    *   **Charge Interaction:** The charge release will multiply the "On Fire" effect. For example, releasing 10 stored shots with a 3-shot spread results in 10 rapid waves of 3-shot spreads.

*   **Phase 2: Projectile Behavior (Travel)**
    *   _How does the projectile move and behave in the world?_
    *   **Examples:** Homing, Piercing, Accelerating, Ricochet. This is also where total conversions like **Lightning** or **Laser Beams** would fundamentally change the projectile.
    *   **Charge Interaction:** A charged release will create many projectiles that *all share* this behavior, resulting in a visually impressive swarm.

*   **Phase 3: On Hit (Impact)**
    *   _What happens when the projectile connects with an enemy?_
    *   **Examples:** Chain Lightning, Lifesteal, Applying status effects (slow, burn).
    *   **Charge Interaction:** Each projectile from the charged volley can trigger "On Hit" effects, leading to massive chain reactions or significant healing.

*   **Phase 4: On Condition (Kill / Crit)**
    *   _What happens under specific circumstances?_
    *   **Examples:** Corpse explosions on kill, resource gain on crit.
    *   **Charge Interaction:** A charged volley, with its high number of projectiles, significantly increases the chance of triggering these conditional effects in a short burst.

## 3. Proposed Implementation Plan

### Step 1: Refactor the Charge Release Logic

Currently, `FiringLogic.js`'s `_emitProjectiles` method creates a generic, slightly randomized burst. This needs to be delegated to the active weapon to allow for synergy.

1.  **Modify `FiringLogic.js`:**
    *   The `_emitProjectiles(count, position)` method should be changed to call a new method on the `currentWeapon`, for instance: `this.component.currentWeapon.fireChargedRelease(count, position)`.

2.  **Modify `BaseWeapon.js`:**
    *   Add a new method: `fireChargedRelease(count, position)`.
    *   The default implementation will loop `count` times and fire its standard projectile pattern. For a `SingleShotWeapon`, this means firing `count` bullets. For a `SpreadWeapon`, it would fire `count` spreads. We can add a very small delay between each shot in the loop to create a satisfying "barrage" effect instead of all projectiles spawning on the exact same frame.

### Step 2: Implement "On Fire" Upgrades

These are great introductory items as they build on the existing systems.

#### Multi-shot
*   **Item (`ItemFactory`):** "Duplicator Module".
*   **Stats Registered:**
    *   `multishot_count`: Number of extra projectiles (Base: 1).
    *   `multishot_damage_penalty`: Multiplier for extra projectile damage (Base: -0.75 for 25% damage).
*   **Implementation:**
    *   Modify `BaseWeapon.createProjectiles()` (or the method it calls). It should read `multishot_count` from the `statSystem`. If it's greater than 0, it will generate the primary projectile *plus* the extra projectiles, which are slightly offset horizontally. The extra projectiles have their damage multiplied by `(1 + multishot_damage_penalty)`.
*   **Charge Interaction:** The refactor from Step 1 handles this naturally. A charged release will fire a barrage, and each shot in that barrage will include the extra multi-shot projectiles.

#### Side Shots
*   **Item (`ItemFactory`):** "Flank Cannons".
*   **Stats Registered:**
    *   `sideshot_damage_penalty`: Damage multiplier for side projectiles (Base: -0.75).
    *   `sideshot_fire_rate_multiplier`: Fires at a fraction of the main gun's speed (Base: 0.5 for 50% rate).
*   **Implementation:**
    *   This should **not** be part of the main weapon's `fire()` logic. Instead, modify `WeaponComponent.update()`.
    *   Add a separate fire timer for side shots. Each frame, it checks if enough time has passed based on `currentWeapon.fireRate * (1 / sideshot_fire_rate_multiplier)`.
    *   If it can fire, it creates two projectiles (one left, one right) with modified damage.
*   **Charge Interaction:** This is key: **Side shots should continue firing while charging.** This directly addresses the "vulnerability" problem by providing cover, making it a powerful defensive/utility item.

### Step 3: Implement Total Weapon Conversions

These are game-changing items that swap the player's weapon type.

#### Lightning Projector
*   **Item (`ItemFactory`):** "Arc Projector".
*   **`onActivate`:** Calls `player.weaponComponent.switchWeapon('lightning')`.
*   **Implementation:**
    *   Create a new `LightningWeapon.js` that extends `BaseWeapon`.
    *   Its `fire()` method will not create a projectile entity. Instead, it will instantly trace a path to the nearest enemy within a certain range, apply damage, and create a visual effect.
*   **Charge Interaction:** The `fireChargedRelease(count, position)` method in `LightningWeapon` will be spectacular. It could trigger a massive chain lightning effect that bounces between enemies `count` times, with each bounce creating a satisfying visual arc.

#### Laser Beam
*   **Item (`ItemFactory`):** "Focusing Crystal".
*   **`onActivate`:** Calls `player.weaponComponent.switchWeapon('laser')`.
*   **Implementation:**
    *   Create `LaserWeapon.js`. This is more complex. Instead of `fire()`, it might have `startFiring()` and `stopFiring()`. `update()` would continuously draw the beam and apply damage to enemies touching it.
*   **Charge Interaction:** Charging could increase the beam's **width** or **damage**. Releasing the charge would fire a massive, screen-piercing beam for a short duration, with the duration scaling based on the `count` of stored shots.

### Step 4: Implement Charge Ability Modifiers

These are items that fundamentally change how the charge mechanic itself works, rather than what it fires.

#### "Aegis Charge" Item
*   **Functionality:** Charging no longer stores shots. Instead, it projects a defensive shield that reduces incoming damage. Releasing the charge detonates the shield, damaging nearby enemies.
*   **Implementation:**
    *   This item's `onActivate` function would need to swap out the player's `chargeComponent`.
    *   Create a new `ShieldChargeComponent.js`.
    *   `startCharging()` would apply a "shielded" status effect to the player (e.g., add a temporary "damage_reduction" modifier to the `statSystem`).
    *   `stopCharging()` would remove the status effect and trigger a radial damage effect around the player. The damage and radius would scale with how long the ability was charged.
    *   `FiringLogic.js` would need a small change to check the type of charge component and call the appropriate release effect (firing projectiles vs. detonating a shield).

#### "Tranquil Charge" Item
*   **Functionality:** Continue firing your main weapon while charging, but at a heavily reduced fire rate (e.g., 25%).
*   **Implementation:**
    *   In `FiringLogic.js`, inside the `if (inputState.shoot)` block where charging is initiated, add a secondary firing timer.
    *   This timer would be 4x longer than the weapon's normal `fireRate`. When it's ready, it calls `currentWeapon.fire(position)` and resets, allowing for slow, periodic shots during the charge.

This layered approach allows us to build out these exciting systems piece by piece, ensuring each part is robust before moving to the next level of complexity. It all starts with making the charge release smarter by letting the current weapon define its behavior.

I'm excited to see where we can take this!


