'use strict';

export const ver = '1.0';

export async function checkUpdates() {
    try {
        const res = await fetch('https://www.ingan121.com/wmpotify/latest.txt');
        const latest = await res.text();
        const wmpvisLatest = latest.match('wmpvis=(.*)')[1];
        return compareVersions(ver, wmpvisLatest) < 0;
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