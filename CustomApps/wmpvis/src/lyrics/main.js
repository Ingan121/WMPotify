// main.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

import Strings from '../strings';
import LRC from "./lrcparse";
import madIdb from "./MadIdb";
import lrcCache from "./caching";
import { getSpotifyNowPlaying } from "./spotify";
import { openSearchDialog } from "./search";
import { ver } from "../UpdateCheck";
import { appInstance as App } from "../app";

let lyricsView = null;

const visStatus = {
    lastMusic: null,
    lastMusicEnglish: null
};

let lastLyrics = null;
let lastSyncedLyricsParsed = null;
let lastLyricsId = null;
let lastScrollIndex = -1;
let lastFetchInfo = {}; // For debugging
let overrides = {};
let abortController = new AbortController();
let scrolling = false;

const intersectionObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        processProperties();
        processTimeline(true);
    }
});
const forceProcessTimeline = () => {
    processTimeline(true);
};

export const headers = {
    'Lrclib-Client': `WMPotify/${ver} ModernActiveDesktop/3.4.0`
};

async function reloadLyrics() {
    const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
    if (overrides[hash]) {
        delete overrides[hash];
        madIdb.setItem('lyricsOverrides', overrides); // Doesn't need to wait for the promise to resolve
    }
    await lrcCache.delete(hash);
    processProperties();
};

async function openLyricsFile() {
    const pickerOpts = {
        types: [
            {
                description: 'Lyrics Files',
                accept: {
                    'text/plain': ['.lrc']
                }
            }
        ]
    };

    const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
    const file = await fileHandle.getFile();
    loadLyrics(file);

    const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
    if (hash) {
        overrides[hash] = {
            lrc: await file.text()
        };
        madIdb.setItem('lyricsOverrides', overrides);
    }
};

// #region Functions

// Load lyrics from the API
// Priority:
// 1. Local overrides
// 2. Cached results (includes remote overrides and Spotify data)
// 3. Remote overrides
// 4: Synced Spotify lyrics (if available, enabled, and premium)
// 5. Synced results (except for inaccurate search fallback with no album title data)
//  5.1 Get (whatever succeeds first)
//  5.2 Accurate search fallback
//  5.3 Accurate search fallback without album title
//  5.4 Accurate search fallback without artist name (only if album title is present)
//  5.5 Inaccurate search fallback
//  5.6 Inaccurate search fallback with parentheses stripped
// 6. Unsynced Spotify lyrics
// 7. Unsynced results
//  7.1 Same as 5.1-5.6
// 8. Synced inaccurate search fallback with no album title data
// 9. Unsynced inaccurate search fallback with no album title data
// 10. No lyrics found
async function findLyrics(id) {
    if (id) {
        return await fetchLyrics('https://lrclib.net/api/get/' + id);
    }

    const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
    if (lastFetchInfo.spotifyResponse && !lastFetchInfo.hash) {
        lastFetchInfo.hash = hash;
    } else {
        lastFetchInfo = { hash };
    }
    const override = overrides[hash];
    if (override?.lrc) {
        lastFetchInfo.override = -1;
        if (LRC.isTextLrc(override.lrc)) {
            const { artist, title, albumTitle, duration } = LRC.parseMetadata(override.lrc);
            return {
                synced: true,
                id: null,
                title: title,
                artist: artist,
                albumTitle: albumTitle,
                duration: duration,
                syncedLyrics: override.lrc,
                plainLyrics: LRC.toPlain(override.lrc),
                provider: 'Local File'
            };
        } else {
            return {
                synced: false,
                id: null,
                plainLyrics: override.lrc,
                provider: 'Local File'
            };
        }
    }

    const cache = !localStorage.wmpotifyVisLyricsNoCache && await lrcCache.get(hash);
    if (cache) {
        lastFetchInfo.cache = true;
        if (override?.id) {
            lastFetchInfo.override = override.id;
        }
        return cache;
    }

    let unsyncedSpotifyLyrics = null;
    if (!localStorage.wmpotifyVisLyricsNoSpotify && Spicetify.Player.data?.item?.uri?.startsWith('spotify:')) {
        const spotifyData = await Spicetify.CosmosAsync?.get(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${Spicetify.Player.data?.item?.uri?.split(':').pop()}?format=json&vocalRemoval=false&market=from_token`);
        if (spotifyData?.lyrics) {
            if (spotifyData.lyrics.syncType === "LINE_SYNCED") {
                return {
                    synced: true,
                    id: -1,
                    title: visStatus.lastMusic?.title,
                    artist: visStatus.lastMusic?.artist,
                    albumTitle: visStatus.lastMusic?.albumTitle,
                    duration: visStatus.lastMusic?.duration,
                    syncedLyrics: spotifyData.lyrics.lines.map(line => { return {time: line.startTimeMs / 1000, text: line.words} }),
                    plainLyrics: null,
                    provider: spotifyData.lyrics.providerDisplayName + ' (Spotify)'
                }
            } else {
                unsyncedSpotifyLyrics = {
                    synced: false,
                    id: -1,
                    plainLyrics: spotifyData.lyrics.lines.map(line => line.words).join('\n'),
                    provider: spotifyData.lyrics.providerDisplayName + ' (Spotify)'
                }
            }
        }
    }

    if (override?.id) {
        lastFetchInfo.override = override.id;
        return await fetchLyrics('https://lrclib.net/api/get/' + override.id);
    }

    // Try to get best (synced) results by trying multiple URLs
    let urlsToTry = [];

    const url = new URL('https://lrclib.net/api/get');
    if (visStatus.lastMusicEnglish) {
        const { artist, title, albumTitle, duration } = visStatus.lastMusicEnglish;
        const params = {
            artist_name: artist,
            track_name: title,
            album_name: albumTitle, // This doesn't seem to cause the find to fail even if the album name is completely wrong (even including 'undefined')
            duration: duration // However this does, so try without duration too. Also some songs have inaccurate durations (e.g. zero) in the DB
        };
        url.search = new URLSearchParams(params).toString();
        urlsToTry.push(url.toString());

        if (duration) {
            delete params.duration;
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());
            params.duration = duration;
        }

        const strippedTitle = stripNonAlphaNumeric(title);
        if (strippedTitle) {
            params.track_name = strippedTitle;
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());

            if (duration) {
                delete params.duration;
                url.search = new URLSearchParams(params).toString();
                urlsToTry.push(url.toString());
            }
        }
    }
    if (visStatus.lastMusic) { // Some songs only have localized artist names in the DB, so try without Spotify data too even if it's available. Test case: "프로미스나인 - Supersonic"
        const { artist, title, albumTitle } = visStatus.lastMusic;
        const params = {
            artist_name: artist,
            track_name: title,
            album_name: albumTitle
            // Duration here is more inaccurate than Spotify's duration, and it also may not be present or up to date when the timeline event is triggered
            // So don't include it here
        };

        if (urlsToTry.length === 0 && !artist) {
            // Don't try get without artist name, as it's mandatory for the get API
            return await searchFallbackAccurate();
        }

        url.search = new URLSearchParams(params).toString();
        urlsToTry.push(url.toString());

        const strippedTitle = stripNonAlphaNumeric(title);
        if (strippedTitle) {
            params.track_name = strippedTitle;
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());
        }

        // YTM has these stuff EVEN FOR ARTISTS in ENGLISH MODE, so try stripping them too (seen "IZ*ONE (아이즈원)", "Apink(에이핑크)", and even "WJSN(Cosmic Girls)(우주소녀)")
        const strippedArtist = stripNonAlphaNumeric(artist);
        if (strippedArtist) {
            params.artist_name = strippedArtist;
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());
        }

        // Spotify Web Player reports all artists to SMTC as a single string, so try splitting it
        // Same for YT Music, and it also uses ', & ' (or localized variant) for the last artist
        // Or just ' & ' (or localized variant) if there are only two artists
        if (artist.includes(', ') || artist.includes(' & ')) {
            params.artist_name = artist.split(', ')[0].split(' & ')[0];
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());

            if (strippedTitle) {
                params.track_name = strippedTitle;
                url.search = new URLSearchParams(params).toString();
                urlsToTry.push(url.toString());
            }
        }
    }
    urlsToTry = [...new Set(urlsToTry)];
    console.log('MADVisLrc:', urlsToTry);
    lastFetchInfo.urls = urlsToTry;
    lastFetchInfo.attempt = new Array(urlsToTry.length).fill(0);
    lastFetchInfo.attempted = 0;
    lastFetchInfo.searchFallback = 0;

    let lastUnsyncedLyrics = null;
    for (const url of urlsToTry) {
        const lyrics = await fetchLyrics(url);
        if (lyrics) {
            if (lyrics.synced) {
                return lyrics;
            } else {
                lastUnsyncedLyrics = lyrics;
            }
        }
    }
    if (unsyncedSpotifyLyrics || lastUnsyncedLyrics) {
        const searchResult = await searchFallbackAccurate();
        if (searchResult?.synced) {
            // If the search fallback found a synced result, return that instead of the unsynced one
            // Example of get not finding the best result that the search api does: "STAYC - Flexing On My Ex" (maybe because of the duration)
            return searchResult
        }
        // If the search result is unsynced, or it's not found, return the get result instead as that's more accurate
        lastFetchInfo.searchFallback = 0;
        return unsyncedSpotifyLyrics || lastUnsyncedLyrics;
    } else {
        // May work in weird cases like instrumental tracks getting returned above, test case: "GFRIEND - Glass Bead"
        // Or if the get api just doesn't find the result that the search api does, test case: "QWER - 고민중독" (get works fine with Spotify data though)
        // Or some complicated cases like "Jay Park - All I Wanna Do (K) (Feat. Hoody & Loco)"
        return await searchFallbackAccurate();
    }
}

// More tolerant than get, but still tries to get the most accurate result (besides album title matters here)
// Less tolerant than searchFallback (e.g. duplicated titles don't work here)
async function searchFallbackAccurate(mode = 0) { // 0: Normal, 1: No album title, 2: No artist name
    lastFetchInfo.searchFallback = 1;
    let artist = visStatus.lastMusicEnglish?.artist || visStatus.lastMusic?.artist || '';
    if (artist.includes(', ') || artist.includes(' & ')) {
        artist = artist.split(', ')[0].split(' & ')[0];
    }
    const strippedArtist = stripNonAlphaNumeric(artist);
    if (strippedArtist) {
        artist = strippedArtist;
    }
    let title = visStatus.lastMusicEnglish?.title || visStatus.lastMusic?.title || '';
    const strippedTitle = stripNonAlphaNumeric(title);
    if (strippedTitle) {
        title = strippedTitle;
    }
    const albumTitle = visStatus.lastMusicEnglish?.albumTitle || visStatus.lastMusic?.albumTitle || '';
    if (!albumTitle) {
        mode = 1;
    }
    console.log('MADVisLrc: searchFallbackAccurate: ' + mode);

    const url = new URL('https://lrclib.net/api/search');
    const params = {
        track_name: title
    };
    switch (mode) {
        case 0:
            params.artist_name = artist;
            params.album_name = albumTitle;
            break;
        case 1:
            // Album title matters here, unlike in the get api
            // So try without album title too
            params.artist_name = artist;
            break;
        case 2:
            // In case the artist name comes in a format not in the DB
            // Test case: "QUEEN BEE - メフィスト (メフィスト)" - only the Japanese name is in the DB. Same for "fromis_9 - Supersonic" above (well this doesn't work well; Supersonic both as title and album is too common. I reuploaded the song with English artist name anyway)
            // So try without the artist name too - it's possible unlike the get api which mandates the artist name
            // I believe title name + album title is more accurate than the inaccurate search fallback?
            // This also works with localized artist names. That's not a primarily supported case though. May not work if title is fully localized with no English part
            params.album_name = albumTitle;
            break;
    }
    lastFetchInfo.searchFallback = mode + 1;
    url.search = new URLSearchParams(params).toString();

    abortController = new AbortController();
    const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        signal: abortController.signal
    });
    const result = await response.json();

    let lastUnsyncedLyrics = null;
    if (result.length > 0) {
        for (const item of result) {
            if (item.syncedLyrics) {
                return {
                    synced: true,
                    id: item.id,
                    title: item.trackName,
                    artist: item.artistName,
                    albumTitle: item.albumName,
                    duration: item.duration,
                    syncedLyrics: item.syncedLyrics,
                    plainLyrics: item.plainLyrics || LRC.toPlain(item.syncedLyrics),
                    provider: 'LRCLIB'
                };
            } else if (item.plainLyrics) {
                lastUnsyncedLyrics = {
                    synced: false,
                    id: item.id,
                    title: item.trackName,
                    artist: item.artistName,
                    albumTitle: item.albumName,
                    duration: item.duration,
                    plainLyrics: item.plainLyrics,
                    provider: 'LRCLIB'
                };
            }
        }
        if (lastUnsyncedLyrics) {
            let searchResult;
            switch (mode) {
                case 0:
                    searchResult = await searchFallbackAccurate(1);
                    break;
                case 1:
                    // Don't fall back to (inaccurate) search or accurate search without the artist name if the album title is not present and unsynced lyrics exist, as it may find a completely different song. Test case: "IVE - I WANT"
                    // In fact, "IVE" easily causes the inaccurate search fallback to return a completely different song, as LRCLIB doesn't care about punctuation so songs with "I've" in titles, albums, ... gets returned
                    if (!visStatus.lastMusicEnglish?.albumTitle && !visStatus.lastMusic?.albumTitle) {
                        return lastUnsyncedLyrics;
                    }
                    searchResult = await searchFallbackAccurate(2);
                    break;
                case 2:
                    searchResult = await searchFallback();
                    break;
            }
            if (searchResult?.synced) {
                // If the search fallback found a synced result, return that instead of the unsynced one
                return searchResult
            }
            // If the search result is unsynced, return the accurate search result instead as that's more accurate
            lastFetchInfo.searchFallback = mode + 1;
            return lastUnsyncedLyrics;
        }
    }
    switch (mode) {
        case 0:
            return await searchFallbackAccurate(1);
        case 1:
            // Don't try accurate search without artist name if the album title is not present, as it's too inaccurate at that point
            if (!visStatus.lastMusicEnglish?.albumTitle && !visStatus.lastMusic?.albumTitle) {
                return await searchFallback();
            }
            return await searchFallbackAccurate(2);
        case 2:
            return await searchFallback();
    }
}

// Inaccurate but more tolerant search fallback
// Surprisingly it also works surprisingly well with YT/YTM duplicated titles. Even artificailly duplicated titles like "tripleS - Girls Never Die (Girls Never Die (Girls Never Die (Girls Never Die)))" work fine
// (though that case is already handled in stripNonAlphaNumeric)
// Although the search API allows dropping some words (e.g. "OH MY DUN" finds "OH MY GIRL - DUN DUN DANCE" fine), search results will be less accurate if we do that
// So try both with and without parentheses stripped
// Misc note: dropping punctuations and special characters also work ("youre" finds "you're" without issues), but dropping other arbitrary characters doesn't (e.g. "NewJean" doesn't find "NewJeans")
async function searchFallback(stripParens) {
    console.log('MADVisLrc: searchFallback' + (stripParens ? ' (stripped)' : ''));
    lastFetchInfo.searchFallback = 4;
    let artist = visStatus.lastMusicEnglish?.artist || visStatus.lastMusic?.artist || '';
    let title = visStatus.lastMusicEnglish?.title || visStatus.lastMusic?.title || '';
    if (stripParens) {
        lastFetchInfo.searchFallback = 5;
        let differenceExists = false;
        if (artist.includes(', ') || artist.includes(' & ')) {
            artist = artist.split(', ')[0].split(' & ')[0];
            const strippedArtist = stripNonAlphaNumeric(artist);
            if (strippedArtist) {
                artist = strippedArtist;
                differenceExists = true;
            }
        }
        const strippedTitle = stripNonAlphaNumeric(title);
        if (strippedTitle) {
            title = strippedTitle;
            differenceExists = true;
        }
        if (!differenceExists) {
            return null;
        }
    }
    const albumTitle = visStatus.lastMusicEnglish?.albumTitle || visStatus.lastMusic?.albumTitle || '';
    const query = artist + ' ' + title + ' ' + albumTitle;

    abortController = new AbortController();
    const response = await fetch(`https://lrclib.net/api/search?q=${query}`, {
        method: 'GET',
        headers: headers,
        signal: abortController.signal
    });
    const result = await response.json();

    let lastUnsyncedLyrics = null;
    if (result.length > 0) {
        for (const item of result) {
            if (item.syncedLyrics) {
                return {
                    synced: true,
                    id: item.id,
                    title: item.trackName,
                    artist: item.artistName,
                    albumTitle: item.albumName,
                    duration: item.duration,
                    syncedLyrics: item.syncedLyrics,
                    plainLyrics: item.plainLyrics || LRC.toPlain(item.syncedLyrics),
                    provider: 'LRCLIB'
                };
            } else if (item.plainLyrics) {
                lastUnsyncedLyrics = {
                    synced: false,
                    id: item.id,
                    title: item.trackName,
                    artist: item.artistName,
                    albumTitle: item.albumName,
                    duration: item.duration,
                    plainLyrics: item.plainLyrics,
                    provider: 'LRCLIB'
                };
            }
        }
        if (lastUnsyncedLyrics) {
            if (!stripParens) {
                const searchResult = await searchFallback(true);
                if (searchResult?.synced) {
                    // If the search fallback found a synced result, return that instead of the unsynced one
                    return searchResult;
                }
            }
            lastFetchInfo.searchFallback = stripParens ? 5 : 4;
            return lastUnsyncedLyrics;
        }
    }
    if (stripParens) {
        return null;
    } else {
        // Attempt to get "CHUU - Confession (Ditto X Chuu (LOONA)) (고백 (영화 '동감' X 츄 (이달의 소녀)))" (YT/YTM) to work with the search fallback
        return await searchFallback(true);
    }
}

async function fetchLyrics(url) {
    try {
        if (lastFetchInfo.attempted !== undefined) {
            lastFetchInfo.attempted++;
        }
        abortController = new AbortController();
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            signal: abortController.signal
        });
        const json = await response.json();
        
        if (response.ok) {
            if (json.syncedLyrics) {
                if (lastFetchInfo.attempt) {
                    lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = 1;
                }
                return {
                    synced: true,
                    id: json.id,
                    title: json.trackName,
                    artist: json.artistName,
                    albumTitle: json.albumName,
                    duration: json.duration,
                    syncedLyrics: json.syncedLyrics,
                    plainLyrics: json.plainLyrics || LRC.toPlain(json.syncedLyrics),
                    provider: 'LRCLIB'
                }
            } else if (json.plainLyrics) {
                if (lastFetchInfo.attempt) {
                    lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = 2;
                }
                return {
                    synced: false,
                    id: json.id,
                    title: json.trackName,
                    artist: json.artistName,
                    albumTitle: json.albumName,
                    duration: json.duration,
                    plainLyrics: json.plainLyrics,
                    provider: 'LRCLIB'
                }
            } else {
                if (lastFetchInfo.attempt) {
                    lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = -1;
                }
                return null;
            }
        } else {
            if (lastFetchInfo.attempt) {
                lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = -2;
            }
            return null;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        } else {
            if (lastFetchInfo.attempt) {
                lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = -3;
            }
            console.error(error);
            return null;
        }
    }
}

async function loadLyrics(idOrLrc, addOverride) {
    // Abort the previous request if it's still running
    // On early startup, 'undefined undefined undefined' might be used for the song hash (before receiving the first mediaProperties/SMTC event)
    // and cause finding the appropriate override to fail
    // This function is called both on startup and mediaProperties events, and if the former uses fetch instead of the override, the fetch might finish after the latter gets the override
    // So the fetch should be aborted to prevent the loaded override from being overwritten by the fetch result (likely "No lyrics found")
    abortController.abort();

    let lyrics = null;
    if (idOrLrc) {
        lastFetchInfo = {
            hash: lastFetchInfo.hash
        };
    }
    if (idOrLrc instanceof File) {
        const text = await idOrLrc.text();
        if (LRC.isTextLrc(text)) {
            const { artist, title, albumTitle, duration } = LRC.parseMetadata(text);
            lyrics = {
                synced: true,
                id: null,
                title: title || getFilename(idOrLrc.name),
                artist: artist,
                albumTitle: albumTitle,
                duration: duration,
                syncedLyrics: text,
                plainLyrics: LRC.toPlain(text),
                provider: Strings['LRC_PROVIDER_LOCAL']
            }
        } else {
            lyrics = {
                synced: false,
                id: null,
                title: getFilename(idOrLrc.name),
                plainLyrics: text,
                provider: Strings['LRC_PROVIDER_LOCAL']
            }
        }
    } else {
        if (!visStatus.lastMusic && !visStatus.lastMusicEnglish) {
            lyricsView.innerHTML = Strings['LRC_STATUS_NO_MUSIC'];
            return;
        }
        try {
            lyricsView.innerHTML = Strings['LRC_STATUS_LOADING'];
            lyrics = await findLyrics(idOrLrc);
        } catch (error) {
            if (error.name === 'AbortError') {
                // New request was made, ignore the old one
                return;
            }
        }
    }

    lastLyrics = lyrics;
    if (lyrics) {
        lastLyricsId = lyrics.id;
        if (lyrics.synced) {
            lyricsView.innerHTML = '';
            const lrc = typeof lyrics.syncedLyrics === 'string' ? LRC.parse(lyrics.syncedLyrics) : lyrics.syncedLyrics;
            lrc.forEach((line, index) => {
                const p = document.createElement('p');
                p.classList.add('wmpotify-lyrics-line');
                p.textContent = line.text;
                p.dataset.time = line.time;
                p.addEventListener('click', () => {
                    Spicetify.Player.seek(line.time * 1000);
                });
                lyricsView.appendChild(p);
            });
            lyricsView.scrollTop = 0;
            lastSyncedLyricsParsed = lrc;
            processTimeline(true);
        } else {
            lyricsView.textContent = lyrics.plainLyrics;
            lastSyncedLyricsParsed = null;
        }
        const providerView = document.createElement('p');
        providerView.classList.add('wmpotify-lyrics-provider');
        providerView.textContent = Strings['LRC_PROVIDER_INFO'] + lyrics.provider;
        providerView.style = 'font-size: 0.875rem; font-weight: 400; color: var(--wmpvis-lyrics-inactive); padding: 20px 0;';
        lyricsView.appendChild(providerView);
        const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
        if (!hash) {
            return;
        }
        if (idOrLrc && !(idOrLrc instanceof File) && idOrLrc.length <= 10) {
            if (addOverride) {
                overrides[hash] = {
                    id: lyrics.id
                };
                madIdb.setItem('lyricsOverrides', overrides);
                await lrcCache.delete(hash);
                lrcCache.add(hash, lyrics);
            }
        } else if (!lyrics.cachedAt) {
            lrcCache.add(hash, lyrics);
        }
    } else {
        if (!navigator.onLine) {
            lyricsView.innerHTML = Strings['LRC_STATUS_OFFLINE'];
        } else {
            lyricsView.innerHTML = Strings['LRC_STATUS_NOT_FOUND'];
        }
        lastSyncedLyricsParsed = null;
    }
}

async function processProperties() {
    if (!localStorage.wmpotifyVisShowLyrics) {
        return;
    }
    lyricsView.innerHTML = Strings['LRC_STATUS_LOADING'];
    const spotifyNowPlayingLocal = await getSpotifyNowPlaying();
    if (spotifyNowPlayingLocal && spotifyNowPlayingLocal.item) {
        const artist = spotifyNowPlayingLocal.item.artists[0].name;
        const title = spotifyNowPlayingLocal.item.name;
        const albumTitle = spotifyNowPlayingLocal.item.album.name;
        const duration = (spotifyNowPlayingLocal.item.duration?.milliseconds || spotifyNowPlayingLocal.item.duration_ms) / 1000;
        visStatus.lastMusic = {
            artist: artist,
            title: title,
            albumTitle: albumTitle,
            duration: duration
        };
    } else {
        delete visStatus.lastMusic;
    }
    const spotifyNowPlayingEnglish = await getSpotifyNowPlaying('en');
    if (spotifyNowPlayingEnglish && spotifyNowPlayingEnglish.item) {
        const artist = spotifyNowPlayingEnglish.item.artists[0].name;
        const title = spotifyNowPlayingEnglish.item.name;
        const albumTitle = spotifyNowPlayingEnglish.item.album.name;
        const duration = spotifyNowPlayingEnglish.item.duration_ms / 1000;
        visStatus.lastMusicEnglish = {
            artist: artist,
            title: title,
            albumTitle: albumTitle,
            duration: duration
        };
    } else {
        delete visStatus.lastMusicEnglish;
    }
    loadLyrics();
}

function processTimeline(init) {
    if (!lyricsView?.children.length) {
        return;
    }
    if (lastLyrics && lastSyncedLyricsParsed) {
        const nearestIndex = getNearestLyricIndex(Spicetify.Player.getProgress() / 1000);
        if (nearestIndex === -1) {
            return;
        }
        for (let i = 0; i < lyricsView.children.length; i++) {
            const lyric = lyricsView.children[i];
            if (i <= nearestIndex) {
                lyric.style.color = 'var(--wmpvis-lyrics-active)';

                if ((!scrolling || init === true) && i === nearestIndex) {
                    const lyricTop = lyric.offsetTop;
                    const lyricBottom = lyricTop + lyric.offsetHeight;
                    const viewTop = lyricsView.parentElement.scrollTop;
                    const viewBottom = viewTop + lyricsView.parentElement.clientHeight;
                    const lyricInView = lyricTop >= viewTop && lyricBottom <= viewBottom;
                    if (i !== lastScrollIndex || init === true) {
                        if (lyricInView || init === true) {
                            if (lyric.offsetTop < lyricsView.parentElement.offsetHeight / 2) {
                                // scrolling to the top of the lyricsView
                                // don't use scrollIntoView with behavior: 'smooth' here as it causes jittering
                                lyricsView.parentElement.scrollTop = 0;
                            } else if (lyric.offsetTop > lyricsView.scrollHeight - lyricsView.offsetHeight / 2) {
                                // scrolling to the bottom of the lyricsView
                                lyricsView.parentElement.scrollTo({
                                    top: lyricsView.parentElement.scrollHeight,
                                    behavior: 'smooth'
                                });
                            } else {
                                lyric.scrollIntoView({
                                    block: 'center', 
                                    behavior: 'smooth'
                                });
                            }
                        }
                        lastScrollIndex = i;
                    }
                }
            } else {
                lyric.style.color = 'var(--wmpvis-lyrics-inactive)';
            }
        }
    }
}

// #region Utils
function getNearestLyricIndex(time) {
    if (lastSyncedLyricsParsed) {
        time += App.state.syncDelay;
        if (time < lastSyncedLyricsParsed[0].time) {
            return 0;
        }
        let nearestIndex = -1;
        if (time > lastSyncedLyricsParsed[lastSyncedLyricsParsed.length - 1].time) {
            return lastSyncedLyricsParsed.length - 1;
        }
        for (let i = 0; i < lastSyncedLyricsParsed.length; i++) {
            if (time > lastSyncedLyricsParsed[i].time && time < lastSyncedLyricsParsed[i + 1].time) {
                nearestIndex = i;
                break;
            }
        }
        return nearestIndex;
    } else {
        return -1;
    }
}

// Crazy tricks regarding Spotify and YT Music title formatting
function stripNonAlphaNumeric(str) {
    // Spotify test cases: "IVE - 해야 (HEYA)", "DAY6 - 녹아내려요 Melt Down", "Ryokuoushoku Shakai - 花になって - Be a flower" (this one actually doesn't work in stripped form. Aaand in YTM: it only returns the English part to SMTC so have to use the search fallback), "TWICE - 올해 제일 잘한 일 / The Best Thing I Ever Did" (works fine in stripped form)
    // These songs do not provide English titles so the Spotify API returns titles like these            
    // Other weird formats I found: "NCT 127 - Fact Check (불가사의; 不可思議)", "SHINee - Sherlock · 셜록 (Clue+Note)" - these two work fine with Spotify data so was not going to handle them but it turns out they work nicely in the finished form of this function (lol)
    // Also: "NCT 127 - 영웅 (英雄; Kick It)" - semicolon is left in the stripped form, but it works fine in both get and search cuz LRCLIB doesn't care about punctuation

    // YTM English mode test cases: "YOUNHA - EVENT HORIZON (사건의 지평선)" (actually works fine in non-stripped form), "Weki Meki - Whatever U Want (너 하고 싶은 거 다 해 (너.하.다))"
    const replaced = str.replace(/[^\x20-\x7E]/g, '').trim(); // Remove non-ASCII characters
    const replacedHard = replaced.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/ - /g, '').trim(); // Remove non-alphanumeric characters (preserve spaces and hyphens without surrounding spaces)

    // Check if the title is a duplicated English title (YTM somehow has these even in English mode)
    // Test case: "IVE - MINE (MINE)", "KWON EUNBI - Underwater (Underwater)", "OH MY GIRL - Dun Dun Dance (Dun Dun Dance)" (this actually works fine in non-stripped form in both get and search)
    // And "IVE - MINE (MINE)" returns a completely different song in the search fallback, so this is necessary
    if (replacedHard.length % 2 === 1) {
        const split = replacedHard.split(' ');
        const half = split.slice(0, split.length / 2).join(' ');
        if (replacedHard === half + ' ' + half) {
            return half;
        }
    }
    if (replaced === '' || replaced === str) {
        // Try stripping 'from', 'feat.', or such stuff from alphanumeric only titles (usually for YT Music)
        // The original title is in the DB in most cases though
        if ((str.includes('(') && str.includes(')'))) {
            return str.split('(')[0].trim();
        }
        return null;
    } else if (replaced.startsWith('(') && replaced.endsWith(')')) {
        // This may return something like "Feat. whatever" but surprisingly only giving the feat stuff as artist works fine with LRCLIB (searchFallbackAccurate)
        // Test case: "SUNMI - 보름달 (Feat. Lena)" (this one doesn't have English title at all in Spotify)
        return replaced.slice(1, -1);
    } else if (replaced.endsWith(')')) {
        // This may remove parentheses that are not a 'duplicated localized title' format, but it can also help with some weird cases like "ASHGRAY - Hello Mr. my yesterday (From 애니메이션 \"명탐정 코난\" 10기) (한국어버젼)" (watafak)
        const split = replaced.split('(')[0].trim();
        const splitReplacedHard = split.replace(/[^a-zA-Z0-9\s]/g, '');
        if (splitReplacedHard === '') {
            // This surprisingly works fine with some complicated examples in YTM English mode
            // Tested with "PRODUCE 48 - 반해버리잖아? (好きになっちゃうだろう？) (Suki ni Nacchaudarou?)", and "AKMU - 어떻게 이별까지 사랑하겠어, 널 사랑하는 거지(How can I love the heartbreak, you're the one I love)"
            // LRCLIB doesn't seem to care about punctuation or special characters (EXCEPT for hyphens, "IU -Into the I-LAND (Into the I-LAND)" (YT) doesn't work in with hyphens stripped)
            return replacedHard.trim();
        } else if (split === '') {
            return null;
        } else {
            return split;
        }
    } else {
        return replacedHard.trim();
    }
}

async function getSongHash(artist, title, albumTitle) {
    if (!artist && !title && !albumTitle) {
        // undefined + undefined + undefined = NaN, sha1("NaN") = 9/2caPgErNpmXSqwgiF7sVgzGPI=
        // what the fuck
        return null;
    }
    const data = new TextEncoder().encode(artist + title + albumTitle);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashB64 = btoa(String.fromCharCode(...hashArray));
    return hashB64;
}

function copyDebugInfo() {
    let msg = '== Debug info from MADVis Lyrics for WMPotify ==\n\n';

    const msgInLyricsView = lyricsView.querySelector('span');
    if (msgInLyricsView) {
        msg = msgInLyricsView.textContent;
    } else {
        msg += 'Current track: ' + escapeHTML(visStatus.lastMusic?.artist) + ' - ' + escapeHTML(visStatus.lastMusic?.title) + ' (' + escapeHTML(visStatus.lastMusic?.albumTitle) + ')\n';
        msg += 'Current lyrics ID: ';
        if (lastLyricsId === null) {
            msg += 'Local lyrics';
        } else if (lastLyricsId === -1) {
            msg += 'Spotify lyrics';
        } else {
            msg += lastLyricsId;
        }
        msg += '\nSong hash: ' + lastFetchInfo.hash + '\n';
        msg += 'Timeline: ' + (Spicetify.Player.getProgress() / 1000) + 's / ' + (Spicetify.Player.data.item.duration.milliseconds / 1000) + 's\n\n';
        msg += 'Track info from the loaded lyrics: ' + escapeHTML(lastLyrics?.artist) + ' - ' + escapeHTML(lastLyrics?.title) + ' (' + escapeHTML(lastLyrics?.albumTitle) + ')\n';
        msg += 'Duration of the loaded lyrics: ' + lastLyrics?.duration + 's\n';
        msg += 'Lyrics provider: ' + lastLyrics?.provider + '\n\n';
        if (lastFetchInfo.override === -1) {
            msg += 'Override: Local lyrics\n';
        } else if (lastFetchInfo.override || lastLyrics?.cachedAt) {
            if (lastFetchInfo.override) {
                msg += 'Override ID: ' + lastFetchInfo.override + '\n';
            }
            if (lastLyrics?.cachedAt) {
                msg += 'Lyrics loaded from cache\n';
                const cachedAtDate = new Date(lastLyrics.cachedAt).toLocaleString(navigator.language);
                const expiryDays = parseInt(localStorage.wmpotifyVisLyricsCacheExpiry) || 21;
                const expiryTime = expiryDays * 24 * 60 * 60 * 1000;
                const expiryDate = new Date(lastLyrics.cachedAt + expiryTime).toLocaleString(navigator.language);
                msg += 'Cache created at: ' + cachedAtDate + '\n';
                msg += 'Cache expiry: ' + expiryDate + '\n';
            }
        } else if (lastFetchInfo.urls) {
            msg += 'URLs tried:\n';
            for (let i = 0; i < lastFetchInfo.urls.length; i++) {
                msg += '- ' + escapeHTML(decodeURIComponent(lastFetchInfo.urls[i])) + ' (';
                switch (lastFetchInfo.attempt[i]) {
                    case 1:
                        msg += 'Synced';
                        break;
                    case 2:
                        msg += 'Unsynced';
                        break;
                    case 0:
                        msg += 'Not tried';
                        break;
                    case -1:
                        msg += 'Instrumental';
                        break;
                    case -2:
                        msg += 'No lyrics';
                        break;
                    case -3:
                        msg += 'Error';
                        break;
                    default:
                        msg += 'Unknown';
                        break;
                }
                msg += ')\n';
            }
            msg += '\n';
        }
        if (lastFetchInfo.searchFallback) {
            switch (lastFetchInfo.searchFallback) {
                case 1:
                    msg += 'Search fallback: Accurate\n';
                    break;
                case 2:
                    msg += 'Search fallback: Accurate (no album)\n';
                    break;
                case 3:
                    msg += 'Search fallback: Accurate (no artist)\n';
                    break;
                case 4:
                    msg += 'Search fallback: Normal\n';
                    break;
                case 5:
                    msg += 'Search fallback: Normal (stripped)\n';
                    break;
            }
        }
        if (lastSyncedLyricsParsed) {
            msg += 'Loaded lyrics are synced';
        } else if (lastLyrics.synced) {
            msg += 'Loaded lyrics are not synced, synced lyrics are available';
        } else {
            msg += 'Loaded lyrics are not synced, synced lyrics are not available';
        }

        msg += '\n\n';
        if (visStatus.lastMusicEnglish) {
            msg += 'Current track info in English: ' + escapeHTML(visStatus.lastMusicEnglish?.artist) + ' - ' + escapeHTML(visStatus.lastMusicEnglish?.title) + ' (' + escapeHTML(visStatus.lastMusicEnglish?.albumTitle) + ')\n';
            msg += 'Duration: ' + visStatus.lastMusicEnglish?.duration + 's';
        } else {
            msg += 'Current Spotify track: None\n';
            if (lastFetchInfo.spotifyResponse === -1) {
                msg += 'Spotify API last response: Error';
            } else if (lastFetchInfo.spotifyResponse) {
                msg += 'Spotify API last response code: ' + lastFetchInfo.spotifyResponse;
            }
        }
    }

    Spicetify.Platform.ClipboardAPI.copy(msg);
}

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

function getFilename (str) {
    return str.split('/').pop().split('.').slice(0, -1).join('.');
}
// #endregion
// #endregion

// #region Initialization
async function init(lv) {
    if (lyricsView) {
        return;
    }

    overrides = await madIdb.getItem('lyricsOverrides') || {};
    lyricsView = lv;
    Spicetify.Player.addEventListener('songchange', processProperties);
    Spicetify.Player.addEventListener('onprogress', processTimeline);
    window.addEventListener('focus', forceProcessTimeline);

    lyricsView.addEventListener('scroll', () => {
        scrolling = true;
        setTimeout(() => {
            scrolling = false;
        }, 1000);
    });

    intersectionObserver.observe(lyricsView.parentElement);
}

function uninit() {
    Spicetify.Player.removeEventListener('songchange', processProperties);
    Spicetify.Player.removeEventListener('onprogress', processTimeline);
    window.removeEventListener('focus', forceProcessTimeline);
    abortController.abort();
    intersectionObserver.disconnect();
    lyricsView = null;
}

const MadVisLyrics = {
    init,
    loadLyrics,
    reloadLyrics,
    openLyricsFile,
    openSearchDialog: () => {
        openSearchDialog(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle, lastLyricsId);
    },
    processTimeline,
    copyDebugInfo,
    uninit
};

export default MadVisLyrics;
// #endregion