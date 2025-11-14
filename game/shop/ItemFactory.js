// Refactored to delegate to items registry module.
// Lightweight wrapper kept for backwards compatibility with existing imports.

import ItemRegistry from './items/ItemRegistry.js';

export class ItemFactory {
    static getAllItems() {
        return ItemRegistry.getAllItems();
    }

    static getItem(id) {
        return ItemRegistry.getItem(id);
    }

    static activateItem(itemId, player, context = {}) {
        return ItemRegistry.activateItem(itemId, player, context);
    }

    static saveOwned(ownedIds = [], storageKey = 'shop_owned_items') {
        return ItemRegistry.saveOwned(ownedIds, storageKey);
    }

    static loadOwned(storageKey = 'shop_owned_items') {
        return ItemRegistry.loadOwned(storageKey);
    }

    static applyOwned(ownedIds = [], player, context = {}) {
        return ItemRegistry.applyOwned(ownedIds, player, context);
    }
}

export default ItemFactory;