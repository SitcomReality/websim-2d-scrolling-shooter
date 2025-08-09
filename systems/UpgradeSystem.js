        let description = '';
        let valueText = '';
        
        if (upgrade.name === 'Max Health') {
            description = 'Increases your maximum health';
            valueText = `+${values.health} HP`;
        } else if (upgrade.name === 'Damage Boost') {
            description = 'Increases your bullet damage';
            valueText = `+${values.damage} Damage`;
        } else if (upgrade.name === 'Movement Speed') {
            description = 'Increases your movement speed';
            valueText = `+${values.speed} Speed`;
        } else if (upgrade.name === 'Fire Rate') {
            description = 'Increases your firing speed';
            valueText = `${Math.round((1 - values.fireRateMultiplier) * 100)}% Faster`;
        } else if (upgrade.name === 'Health Pickup Chance') {
            description = 'Increases chance of health pickups from enemies';
            valueText = `+${Math.round(values.chanceIncrease * 100)}% Chance`;
        } else if (upgrade.name === 'Health Pickup Value') {
            description = 'Increases health restored by pickups';
            valueText = `+${values.amountIncrease} Health`;
        }

