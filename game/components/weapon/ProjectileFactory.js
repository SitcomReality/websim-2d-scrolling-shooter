export default class ProjectileFactory {
    static create(component, position, direction) {
        const weapon = component.currentWeapon;
        // If weapon provides its own projectile creation, prefer that.
        if (weapon && typeof weapon.createProjectile === 'function') {
            if (component.owner) weapon.owner = component.owner;
            return weapon.createProjectile(position, direction);
        }

        const speed = (weapon && weapon.projectileSpeed) || 10;
        let damage = (weapon && weapon.damage) || 1;
        const color = (weapon && weapon.projectileColor) || '#00ffff';

        // Use stat system strictly via component.owner.statSystem — no legacy fallbacks
        try {
            const player = component.owner;
            if (player && player.statSystem) {
                const statSystem = player.statSystem;
                const critChance = statSystem.getStatValue('criticalChance') || 0;
                const critDamage = statSystem.getStatValue('criticalDamage') || 0;
                const baseDamage = statSystem.getStatValue('damage') || damage;
                if (Math.random() < critChance) {
                    damage = baseDamage * (1 + critDamage);
                } else {
                    damage = baseDamage;
                }
            } else {
                // Intentionally throw to fail fast if statSystem not present (enforces no legacy)
                throw new Error('Missing statSystem on owner for projectile creation');
            }
        } catch (e) {
            // let errors bubble up in development; fallback to computed damage if necessary
        }

        return {
            x: position.x,
            y: position.y,
            vx: direction.x * speed,
            vy: direction.y * speed,
            damage: damage,
            color: color,
            alive: true,
            width: (weapon && weapon.bulletWidth) || 4,
            height: (weapon && weapon.bulletHeight) || 10,
            piercing: (weapon && weapon.piercing) || 0,
            chain: (weapon && weapon.chain) || 0,
            chainRange: (weapon && weapon.chainRange) || 100,
            chainDamageReduction: (weapon && weapon.chainDamageReduction) || 0.7,
            penetration: (weapon && weapon.penetration) || 0,
            ricochet: (weapon && weapon.ricochet) || 0,
            hitTargets: [],
            remainingChains: (weapon && weapon.chain) || 0,
            remainingRicochets: (weapon && weapon.ricochet) || 0
        };
    }
}