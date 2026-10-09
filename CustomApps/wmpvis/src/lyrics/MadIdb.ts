// MadIdb.js for WMPotify NowPlaying
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

// Use indexedDB for storing images and JSON
const madIdb = new Proxy({}, {
    get(_target, prop: string) {
        // handle it like localStorage
        switch (prop) {
            case "init":
                return initMadIdb;
            case "getItem":
                return madIdbGetItem;
            case "setItem":
                return madIdbSetItem;
            case "deleteItem":
                return madIdbDeleteItem;
            case "itemExists":
                return madIdbItemExists;
            default:
                return madIdbGetItem(prop);
        }
    },
    // Using madIdb's setter is not recommended
    // as it's hard to handle async operations
    // Use madIdb.setItem() instead
    set(_target, prop: string, value) {
        madIdbSetItem(prop, value);
        return true;
    },
    deleteProperty(_target, prop: string) {
        madIdbDeleteItem(prop);
        return true;
    }
});

export default madIdb;

function initMadIdb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const db = indexedDB.open("wmpotify", 1);
        db.onupgradeneeded = () => {
            db.result.createObjectStore("config");
            const lrcCacheStore = db.result.createObjectStore("lrccache", { keyPath: "hash" });
            lrcCacheStore.createIndex("createdAtIndex", "createdAt", { unique: false });
        };
        db.onsuccess = () => {
            resolve(db.result);
        };
        db.onerror = () => {
            reject(db.error);
        };
    });
}

async function madIdbGetItem(key: string) {
    const db = await initMadIdb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("config", "readwrite");
        const store = transaction.objectStore("config");
        const request = store.get(key);
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

async function madIdbSetItem(key: string, value: unknown) {
    const db = await initMadIdb();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("config", "readwrite");
        const store = transaction.objectStore("config");
        store.put(value, key);
        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

async function madIdbDeleteItem(key: string) {
    const db = await initMadIdb();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("config", "readwrite");
        const store = transaction.objectStore("config");
        store.delete(key);
        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

async function madIdbItemExists(key: string) {
    const db = await initMadIdb();
    return new Promise<boolean>((resolve, reject) => {
        const transaction = db.transaction("config", "readwrite");
        const store = transaction.objectStore("config");
        const request = store.getKey(key);
        request.onsuccess = () => {
            resolve(request.result !== undefined);
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}