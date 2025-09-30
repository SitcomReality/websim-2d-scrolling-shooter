Core data contracts
Use these shapes application-wide to keep things consistent and testable.

    StatDefinition
        id: string
        name: string
        description?: string
        category: 'offense' | 'defense' | 'utility' | 'weapon'
        baseValue: number
        minValue?: number (default: -Infinity)
        maxValue?: number (default: +Infinity)
        softCap?: {
        value: number, // soft cap target
        mode: 'diminishing' | 'clamp',
        k?: number // curve steepness for diminishing returns
        }
        upgradeWeight?: number (0.0–1.0; default 1.0)
        group?: string // groups related stats e.g., 'explosion', 'chain'
        upgradable?: boolean // if false, generator will not create upgrade cards
        format?: 'int' | 'float' | 'percent' // for UI
        visible?: boolean // some hidden/internal stats

    StatModifier
        statId: string
        type: 'flat' | 'percent'
        amount: number // for percent: 0.2 means +20%
        sourceId: string // itemId/upgradeId
        stacking?: 'add' | 'max' // default 'add'; 'max' picks max of current and amount

Final stat calculation:

    Sum flat modifiers, then apply percent modifiers, then clamp and apply soft cap once.
    final = applySoftCap(
    clamp((baseValue + sum(flatMods)) * (1 + sum(percentMods)), minValue, maxValue),
    softCap
    )

    ItemDefinition
        id: string
        name: string
        cost: number
        description: string
        icon?: string
        tags?: string[] // 'weapon', 'mobility', 'defense', etc.
        conflictsWith?: string[] // itemIds that cannot appear together in the same offering
        definesStats?: StatDefinition[] // stat definitions this item introduces to the game when owned
        provides?: {
        behaviors?: string[] // e.g., 'canChain', 'projectileExplodes'
        unlocksWeaponTypes?: string[] // e.g., 'HomingMissile'
        }
        onActivate(player, context): void
        // called when purchased or when rehydrating from save

    Shop generation constraints
        seed: string | number // for deterministic generation
        slots: number // how many items shown
        excludeItemIds: string[] // no duplicates in one offering
        categoryRotation?: string[] // optional category cycle
        forbiddenTags?: string[]
        availablePoolFn(gameState): ItemDefinition[] // filters pool based on state

    SaveGame shape (relevant fields)
        currency: number
        ownedItemIds: string[]
        rerollCount: number
        shopSeed: string | number
        upgradeState: { modifiers: StatModifier[] } // optional, or reconstruct from history
        other relevant player progression fields
