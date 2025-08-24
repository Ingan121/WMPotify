'use strict';

import Strings from '../strings'
import WindhawkComm from "../WindhawkComm";
import { openUpdateDialog } from '../ui/dialogs';

const verString = '1.2.1 Pre-release (2025/08/24)';

export class MadVersion {
    constructor(ver) {
        const split = ver.split(" ");
        const verSplit = split[0].split(".");
        this.major = parseInt(verSplit[0]);
        this.minor = parseInt(verSplit[1]);
        this.patch = parseInt(verSplit[2]) || 0;
        this.extra = split.length === 1 ? "" : split.slice(1).join(" ");
    }

    toString(level = 1) {
        switch (parseInt(level)) {
            case 0:
                return `${this.major}.${this.minor}.${this.patch}${this.extra ? ` ${this.extra}` : ""}`;
            case 1:
                return `${this.major}.${this.minor}.${this.patch}`;
            case 2:
                return `${this.major}.${this.minor}`;
            case 3:
                return `${this.major}`;
            default:
                return this.toString(1);
        }
    }

    compare(verString, noExtra) {
        // Returns 1 if this version is newer, -1 if older, 0 if equal
        const ver = new MadVersion(verString);
        if (this.major !== ver.major) {
            return this.major - ver.major > 0 ? 1 : -1;
        }
        if (this.minor !== ver.minor) {
            return this.minor - ver.minor > 0 ? 1 : -1;
        }
        if (this.patch !== ver.patch) {
            return this.patch - ver.patch > 0 ? 1 : -1;
        }
        if (noExtra) {
            return 0;
        }
        if (this.extra && ver.extra) {
            return 0; // Extra versions are considered equal cuz I'm lazy
        }
        if (this.extra) {
            return -1; // Version with extra is considered older (cuz its a pre-release version)
        }
        if (ver.extra) {
            return 1;
        }
        return 0;
    }
}

export const ver = new MadVersion(verString);

export async function checkUpdates() {
    try {
        const isMarketplaceDist = !!document.querySelector('style.marketplaceUserCSS');
        const cteAvailable = WindhawkComm.available();
        const cteVer = new MadVersion(WindhawkComm.getModule()?.version);

        const res = await fetch('https://www.ingan121.com/wmpotify/latest.txt');
        const latest = await res.text();
        const wmpotifyLatest = latest.match('wmpotify_new=(.*)')[1];
        const cteLatest = latest.match('cte=(.*)')[1];

        if (!isMarketplaceDist && ver.compare(wmpotifyLatest) < 0) {
            if (localStorage.wmpotifyIgnoreVersion !== wmpotifyLatest) {
                openUpdateDialog(false, wmpotifyLatest);
            }
        }

        if (cteAvailable && cteVer.compare(cteLatest) < 0) {
            if (localStorage.wmpotifyLastCheckedWhVer !== cteLatest) {
                Spicetify.showNotification('[WMPotify] ' + Strings.getString('CTEWH_UPDATE_MSG', cteLatest));
            }
        }
        localStorage.wmpotifyLastCheckedWhVer = cteLatest;
    } catch (e) {
        // probably offline or my server is down
        console.error(e);
    }
}

export function compareSpotifyVersion(target) {
    let current = window?.Spicetify?.Platform?.version?.split('.').map(Number);
    if (!current) {
        current = navigator.userAgent.match(/Spotify\/(\d+\.\d+\.\d+\.\d+)/)?.[1].split('.').map(Number);
    }
    if (!current || !target) {
        return 0;
    }
    const targetParsed = target.split('.').map(Number);

    for (let i = 0; i < targetParsed.length; i++) {
        if (current[i] !== targetParsed[i]) {
            return current[i] - targetParsed[i];
        }
    }
    return 0;
}