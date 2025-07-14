// caching.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

import madIdb from './MadIdb';

const lrcCache = {
    add: addCache,
    get: getCache,
    delete: deleteCache,
    exists: cacheExists,
    count: countCache,
    clear: clearCache
};

export default lrcCache;

const UNIX_1DAY = 86400000; // 24 * 60 * 60 * 1000

async function addCache(hash, lyrics) {
    if (!hash || localStorage.wmpotifyVisLyricsNoCache) {
        return;
    }
    const max = parseInt(localStorage.wmpotifyVisLyricsCacheMax) || 500;
    const count = await countCache();
    if (count >= max) {
        console.log(`MADVisLrc: Cache is full. Deleting ${count - max + 1} oldest caches.`);
        await deleteOldestCache(count - max + 1);
    }

    const db = await madIdb.init();
    const estimate = await navigator.storage.estimate();
    const ratio = estimate.usage / estimate.quota;
    if (ratio > 0.9) {
        console.log("MADVisLrc: Storage is almost full. Deleting 10 oldest caches. Cannot add a new cache.");
        deleteOldestCache(10);
        resolve();
        return;
    }

    return new Promise(async (resolve, reject) => {
        const transaction = db.transaction("lrccache", "readwrite");
        const store = transaction.objectStore("lrccache");
        if (lyrics === null) {
            resolve();
            return;
        }
        const request = store.add({
            hash,
            lyrics,
            createdAt: Date.now()
        });
        request.onsuccess = function () {
            console.log("MADVisLrc: Cache added: " + hash);
            resolve();
        };
        request.onerror = function () {
            if (request.error.name === "ConstraintError") {
                console.log("MADVisLrc: Cache already exists: " + hash);
                resolve();
            } else {
                console.error(request.error);
                reject(request.error);
            }
        };
    });
}

async function getCache(hash) {
    if (!hash || localStorage.wmpotifyVisLyricsNoCache) {
        return null;
    }
    const db = await madIdb.init();
    if (!db.objectStoreNames.contains("lrccache")) {
        localStorage.wmpotifyVisLyricsNoCache = true;
        return null;
    }
    const expiryDays = parseInt(localStorage.wmpotifyVisLyricsCacheExpiry) || 21;
    const expiryTime = expiryDays * UNIX_1DAY;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("lrccache", "readwrite");
        const store = transaction.objectStore("lrccache");
        const request = store.get(hash);
        request.onsuccess = function () {
            if (request.result && Date.now() - request.result.createdAt <= expiryTime) {
                const lyrics = request.result.lyrics;
                lyrics.cachedAt = request.result.createdAt;
                resolve(lyrics);
            } else {
                store.delete(hash);
                resolve(null);
            }
        };
        request.onerror = function () {
            console.error(request.error);
            reject(request.error);
        };
    });
}

async function deleteCache(hash) {
    if (!hash) {
        return;
    }
    const db = await madIdb.init();
    if (!db.objectStoreNames.contains("lrccache")) {
        return;
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("lrccache", "readwrite");
        const store = transaction.objectStore("lrccache");
        const request = store.delete(hash);
        request.onsuccess = function () {
            resolve();
        };
        request.onerror = function () {
            console.error(request.error);
            reject(request.error);
        };
    });
}

async function cacheExists(hash) {
    if (!hash) {
        return false;
    }
    const db = await madIdb.init();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("lrccache", "readonly");
        const store = transaction.objectStore("lrccache");
        const request = store.get(hash);
        request.onsuccess = function () {
            resolve(request.result !== undefined);
        };
        request.onerror = function () {
            console.error(request.error);
            reject(request.error);
        };
    });
}

// Delete an oldest cache if the cache limit is reached
async function deleteOldestCache(num = 1) {
    const db = await madIdb.init();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("lrccache", "readwrite");
        const store = transaction.objectStore("lrccache");
        const index = store.index("createdAtIndex");
        const request = index.openCursor();
        let cnt = 0;
        request.onsuccess = function () {
            const cursor = request.result;
            if (cursor) {
                store.delete(cursor.value.hash);
                cnt++;
                if (cnt < num) {
                    cursor.continue();
                } else {
                    resolve();
                }
            } else {
                resolve();
            }
        };
        request.onerror = function () {
            console.error(request.error);
            reject(request.error);
        };
    });
}

async function cleanExpiredCache() {
    const db = await madIdb.init();
    const expiryDays = parseInt(localStorage.wmpotifyVisLyricsCacheExpiry) || 21;
    const expiryTime = expiryDays * UNIX_1DAY;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("lrccache", "readwrite");
        const store = transaction.objectStore("lrccache");
        const index = store.index("createdAtIndex");
        const request = index.openCursor();
        let cnt = 0;
        request.onsuccess = function () {
            const cursor = request.result;
            if (cursor) {
                if (Date.now() - cursor.value.createdAt > expiryTime) {
                    store.delete(cursor.value.hash);
                    cnt++;
                }
                cursor.continue();
            } else {
                console.log(`MADVisLrc: Deleted ${cnt} expired caches.`);
                resolve();
            }
        };
        request.onerror = function () {
            console.error(request.error);
            reject(request.error);
        };
    });
}

async function countCache() {
    const db = await madIdb.init();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("lrccache", "readonly");
        const store = transaction.objectStore("lrccache");
        const request = store.count();
        request.onsuccess = function () {
            resolve(request.result);
        };
        request.onerror = function () {
            console.error(request.error);
            reject(request.error);
        };
    });
}

async function clearCache() {
    const db = await madIdb.init();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("lrccache", "readwrite");
        const store = transaction.objectStore("lrccache");
        const request = store.clear();
        request.onsuccess = function () {
            resolve();
        };
        request.onerror = function () {
            console.error(request.error);
            reject(request.error);
        };
    });
}

if (localStorage.wmpotifyVisLyricsLastCacheClean) {
    const lastClean = parseInt(localStorage.wmpotifyVisLyricsLastCacheClean);
    if (Date.now() - lastClean >= UNIX_1DAY) {
        cleanExpiredCache();
        localStorage.wmpotifyVisLyricsLastCacheClean = Date.now();
    }
} else {
    localStorage.wmpotifyVisLyricsLastCacheClean = Date.now();
}