'use strict';

// Spicetify LocalStorageAPI but without immediate effect

const DirectUserStorage = {
    getItem(key: string): string | number | null {
        const username = Spicetify._platform?.initialUser?.username;
        const res = localStorage.getItem(username + ":" + key);
        if (isNaN(Number(res))) {
            return res;
        } else {
            if (res === null) {
                return null;
            }
            return parseFloat(res);
        }
    },
    setItem(key: string, value: string | number) {
        const username = Spicetify._platform?.initialUser?.username;
        localStorage.setItem(username + ":" + key, value.toString());
    },
    removeItem(key: string) {
        const username = Spicetify._platform?.initialUser?.username;
        localStorage.removeItem(username + ":" + key);
    }
}

export default DirectUserStorage;