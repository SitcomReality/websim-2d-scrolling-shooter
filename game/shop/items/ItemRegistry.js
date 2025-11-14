// Facade registry that composes item data and activation logic
import _items from './_items.js';
import { activateItem, saveOwned, loadOwned, applyOwned } from './activate.js';

const ItemRegistry = {
    getAllItems() {
        return Array.from(_items.values());
    },

    getItem(id) {
        return _items.get(id) || null;
    },

    activateItem(itemId, player, context = {}) {
        return activateItem(itemId, player, context);
    },

    saveOwned(ownedIds = [], storageKey = 'shop_owned_items') {
        return saveOwned(ownedIds, storageKey);
    },

    loadOwned(storageKey = 'shop_owned_items') {
        return loadOwned(storageKey);
    },

    applyOwned(ownedIds = [], player, context = {}) {
        return applyOwned(ownedIds, player, context);
    }
};

export default ItemRegistry;