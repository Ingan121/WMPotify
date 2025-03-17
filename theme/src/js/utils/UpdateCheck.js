'use strict';

import Strings from '../strings'
import WindhawkComm from "../WindhawkComm";
import { openUpdateDialog } from '../ui/dialogs';

export const ver = '1.0b4';

export async function checkUpdates() {
    try {
        const isMarketplaceDist = !!document.querySelector('style.marketplaceUserCSS');
        const cteAvailable = WindhawkComm.available();
        const cteVer = WindhawkComm.getModule()?.version;

        const res = await fetch('https://www.ingan121.com/wmpotify/latest.txt');
        const latest = await res.text();
        const wmpotifyLatest = latest.match('wmpotify=(.*)')[1];
        const cteLatest = latest.match('cte=(.*)')[1];

        if (!isMarketplaceDist && compareVersions(ver, wmpotifyLatest) < 0) {
            if (localStorage.wmpotifyIgnoreVersion !== wmpotifyLatest) {
                openUpdateDialog(false, wmpotifyLatest);
            }
        }

        if (cteAvailable && compareVersions(cteVer, cteLatest) < 0) {
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

export function compareVersions(a, b) {
    const versionMap = { '': 1, 'b': 0, 'a': -1 };

    const parseVersion = (version) => {
        const match = version.match(/(\d+)\.(\d+)([ab]?)(\d*)/);
        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
            type: versionMap[match[3] || ''],
            extra: parseInt(match[4]) || 0
        };
    };

    const aParsed = parseVersion(a);
    const bParsed = parseVersion(b);

    if (aParsed.major !== bParsed.major) {
        return aParsed.major - bParsed.major;
    }

    if (aParsed.minor !== bParsed.minor) {
        return aParsed.minor - bParsed.minor;
    }

    if (aParsed.type !== bParsed.type) {
        return aParsed.type - bParsed.type;
    }

    return aParsed.extra - bParsed.extra;
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