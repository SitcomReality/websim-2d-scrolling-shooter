export class UpgradeCardCreator {
    createUpgradeCard(choice, index) {
        const card = document.createElement('div');
        card.className = `upgrade-card ${choice.rarity}`;

        const upgrade = choice.upgrade;
        const values = choice.values;

        // Get sprite position from upgrade icon mapping
        const spritePosition = this.getSpritePosition(upgrade.icon);

        let description = '';
        let valueText = '';

        if (upgrade.isProcedural) {
            // Handle procedural upgrades
            description = upgrade.getDescription(values);
            const valueKey = Object.keys(values)[0];
            const valueAmount = Object.values(values)[0];

            if (valueKey === 'damage') {
                valueText = `+${valueAmount} Damage`;
            } else if (valueKey === 'speed') {
                valueText = `+${valueAmount.toFixed(1)} Speed`;
            } else if (valueKey === 'defense') {
                valueText = `-${Math.round(valueAmount * 100)}% Damage Taken`;
            } else if (valueKey === 'luck') {
                valueText = `+${valueAmount.toFixed(1)} Luck`;
            } else if (valueKey === 'critical') {
                valueText = `+${Math.round(valueAmount * 100)}% Critical`;
            } else if (valueKey === 'lifesteal') {
                valueText = `+${Math.round(valueAmount * 100)}% Lifesteal`;
            } else if (valueKey === 'multishot') {
                valueText = `+${valueAmount} Projectiles`;
            } else if (valueKey === 'utility') {
                valueText = `+${valueAmount} Utility`;
            }
        } else {
            // Handle regular upgrades
            valueText = this.getRegularUpgradeText(upgrade, values);
            description = this.getRegularUpgradeDescription(upgrade);
        }

        card.innerHTML = `
            <div class="upgrade-icon-container">
                <div class="upgrade-sprite" style="background-position: ${spritePosition};"></div>
            </div>
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-description">${description}</div>
            <div class="upgrade-value">${valueText}</div>
            <div class="upgrade-rarity">${choice.rarity}</div>
        `;

        return card;
    }

    getRegularUpgradeText(upgrade, values) {
        if (upgrade.name === 'Max Health') {
            const healthIncrease = values.health || values[upgrade.id] || values.common;
            return `+${healthIncrease} HP`;
        } else if (upgrade.name === 'Damage Boost') {
            const damageIncrease = values.damage || values[upgrade.id] || values.common;
            return `+${damageIncrease} Damage`;
        } else if (upgrade.name === 'Movement Speed') {
            const speedIncrease = values.speed || values[upgrade.id] || values.common;
            return `+${speedIncrease.toFixed(1)} Speed`;
        } else if (upgrade.name === 'Fire Rate') {
            const multiplier = values.fireRateMultiplier || values.fireRate || values[upgrade.id] || values.common;
            return `${Math.round((1 - multiplier) * 100)}% Faster`;
        } else if (upgrade.name === 'Health Pickup Chance') {
            const chanceIncrease = values.chanceIncrease || values[upgrade.id] || values.common;
            return `+${Math.round(chanceIncrease * 100)}% Chance`;
        } else if (upgrade.name === 'Health Pickup Value') {
            const amountIncrease = values.amountIncrease || values[upgrade.id] || values.common;
            return `+${amountIncrease} Health`;
        } else if (upgrade.name === 'Utility Boost') {
            const utilityBoost = values.utility || values[upgrade.id] || values.common;
            return `+${utilityBoost} Utility`;
        } else if (upgrade.name === 'Luck') {
            const luckIncrease = values.luck || values[upgrade.id] || values.common;
            return `+${luckIncrease.toFixed(1)} Luck`;
        } else if (upgrade.name === 'Critical Chance') {
            const chanceIncrease = values.criticalChance || values[upgrade.id] || values.common;
            return `+${Math.round(chanceIncrease * 100)}% Critical Chance`;
        } else if (upgrade.name === 'Critical Damage') {
            const damageIncrease = values.criticalDamage || values[upgrade.id] || values.common;
            return `+${Math.round(damageIncrease * 100)}% Critical Damage`;
        } else if (upgrade.name === 'Piercing') {
            const piercingCount = values.piercing || values[upgrade.id] || values.common;
            return `Pierces ${piercingCount} additional enemies`;
        } else if (upgrade.name === 'Chain Lightning') {
            const chainData = values.chain || values[upgrade.id] || values.common;
            return `Chains ${chainData.chains} times within ${chainData.range}px`;
        } else if (upgrade.name === 'Ricochet') {
            const ricochetCount = values.ricochet || values[upgrade.id] || values.common;
            return `Ricochets ${ricochetCount} times off walls`;
        }
        return '';
    }

    getRegularUpgradeDescription(upgrade) {
        const descriptions = {
            'Max Health': 'Increases your maximum health',
            'Damage Boost': 'Increases your bullet damage',
            'Movement Speed': 'Increases your movement speed',
            'Fire Rate': 'Increases your firing speed',
            'Health Pickup Chance': 'Increases chance of health pickups from enemies',
            'Health Pickup Value': 'Increases health restored by pickups',
            'Utility Boost': 'Enhances utility systems',
            'Luck': 'Increases the quality of upgrade offerings',
            'Critical Chance': 'Increases your chance to deal critical damage',
            'Critical Damage': 'Increases damage dealt by critical hits',
            'Piercing': 'Bullets pierce through enemies',
            'Chain Lightning': 'Bullets chain to nearby enemies',
            'Ricochet': 'Bullets bounce off walls'
        };
        return descriptions[upgrade.name] || upgrade.description;
    }

    getSpritePosition(iconIdentifier) {
        // Map icon identifiers to sprite positions
        const iconMap = {
            '❤️': '0,0',    // Health
            '⚔️': '1,0',    // Damage
            '💨': '2,0',    // Speed
            '🔥': '3,0',    // Fire Rate
            '💚': '0,1',    // Health Pickup Chance
            '💝': '1,1',    // Health Pickup Amount
            '🔧': '2,1',    // Utility
            '🍀': '3,1',    // Luck
            '🎯': '0,2',    // Critical Chance
            '💥': '1,2',    // Critical Damage
            '🔫': '2,2',    // Piercing
            '⚡': '3,2',    // Chain Lightning
            '🏀': '0,3',    // Ricochet
            '🛡️': '1,3',    // Defense (if needed)
            '💉': '2,3',    // Lifesteal (if needed)
            '⭐': '3,3'      // Special/Multishot
        };

        const position = iconMap[iconIdentifier] || '0,0';
        const [col, row] = position.split(',');
        const x = -col * 64;
        const y = -row * 64;

        return `${x}px ${y}px`;
    }
}