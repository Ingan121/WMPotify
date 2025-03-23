// wmpvis.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

import ButterchurnAdaptor from './butterchurn/adaptor';
import MadVisLyrics from './lyrics/main';
import { spAudioDataToFrequencies } from './spadapter';
import { appInstance as App } from './app';

let initedOnce = false;

let albumArt = null;
let visBar = null;
let visTop = null;
let visBC = null;
let visBarCtx = null;
let visTopCtx = null;
let debugView = null;

let audioData = null;

let idle = false;

let visConfig = {};

const arraySize = 96;
const arraySizeReduced = 49;

const fps = 30;
let interval;

const lastAud = new Array(arraySize).fill(0);
const lastBar = new Array(arraySizeReduced).fill(0);
const lastTop = new Array(arraySizeReduced).fill(0);
const topSpeed = new Array(arraySizeReduced).fill(0);

let lastIndex = 0;

let initAttempts = 0;

let schemeBarColor = null;
let schemeTopColor = null;
let albumArtBarColor = null;
let albumArtTopColor = null;

export function findAudioArray(near) {
    if (!audioData) {
        return -1;
    }

    const current = Spicetify.Player.getProgress() / 1000;
    let index = near;

    if (index < 0) {
        index = 0;
    } else if (index >= audioData.length) {
        index = audioData.length - 1;
    }

    if (current < audioData[index][0]) {
        index = 0;
    }

    while (index < audioData.length - 1 && audioData[index + 1][0] < current) {
        index++;
    }

    debugView.innerText = index;

    return index;
}

async function wallpaperAudioListener() {
    if (!visBar || !visTop || !debugView) {
        uninit();
        return;
    }

    if (visConfig.type !== 'bars') {
        return;
    }

    const index = findAudioArray(lastIndex);
    if (index < 0) {
        return;
    }
    let audioArray = audioData[index]?.slice(1) || new Array(arraySize).fill(0);
    const same = index === lastIndex;
    if (same) {
        audioArray = new Array(arraySize).fill(0);
    }
    lastIndex = index;

    // Optimization
    if (idle) {
        if (audioArray[Math.round(Math.random() * (arraySize - 1))] <= 0.0001) {
            return;
        }
        idle = false;
    }
    
    for (let i = 0; i < audioArray.length - 2; i += 2) {
        audioArray[i / 2] = (audioArray[i] + audioArray[i + 1]) / 2;
    }
    audioArray[arraySizeReduced - 2] = audioArray[arraySize - 2];
    audioArray[arraySizeReduced - 1] = audioArray[arraySize - 1];

    // Clear the canvas
    visBarCtx.clearRect(0, 0, visBar.width, visBar.height);

    // Render bars along the full width of the canvas
    const barWidth = visConfig.barWidth || Math.max(Math.round(1.0 / arraySizeReduced * visBar.width), 6);
    const gap = 1;

    visBarCtx.fillStyle = visConfig.barColor;
    visTopCtx.fillStyle = visConfig.topColor;
    if (visConfig.followAlbumArt && albumArtBarColor && albumArtTopColor) {
        visBarCtx.fillStyle = albumArtBarColor;
        visTopCtx.fillStyle = albumArtTopColor;
    } else if (visConfig.useSchemeColors) {
        visBarCtx.fillStyle = schemeBarColor;
        visTopCtx.fillStyle = schemeTopColor;
    }

    let leftMargin = 0;
    if (barWidth * arraySizeReduced < visBar.width) {
        leftMargin = Math.round((visBar.width - barWidth * arraySizeReduced) / 2);
    }
    let allZero = true;
    for (var i = 0; i < audioArray.length; ++i) {
        if (i === 64 && visConfig.channelSeparation === 3) {
            break;
        }
        // Create an audio bar with its hight depending on the audio volume level of the current frequency
        const height = Math.round(visBar.height * Math.min(audioArray[i], 1) * visConfig.primaryScale);
        if (height > lastBar[i]) {
            lastBar[i] = height;
            visBarCtx.fillRect(leftMargin + barWidth * i, visBar.height - height, barWidth - gap, height);
        } else {
            lastBar[i] -= visConfig.decSpeed;
            const diff = audioArray[i] - lastAud[i];
            if (diff > 0.1) {
                lastBar[i] += Math.round(360 * diff * visConfig.diffScale);
                if (lastBar[i] > visBar.height) {
                    lastBar[i] = visBar.height;
                }
            }
            visBarCtx.fillRect(leftMargin + barWidth * i, visBar.height - lastBar[i], barWidth - gap, lastBar[i]);
        }
        const topPos = visTop.height - Math.round(lastBar[i]) - 1;
        if (topPos < lastTop[i]) {
            lastTop[i] = topPos;
            visTopCtx.fillRect(leftMargin + barWidth * i, topPos, barWidth - gap, 1);
            topSpeed[i] = 0;
            allZero = false;
        } else if (lastTop[i] < visTop.height - 1) {
            visTopCtx.clearRect(leftMargin + barWidth * i, 0, barWidth - gap, visTop.height);
            if (topSpeed[i] > 38) {
                lastTop[i] += 5 * Math.round(visConfig.decSpeed / 3);
            } else if (topSpeed[i] > 26) {
                lastTop[i] += 4 * Math.round(visConfig.decSpeed / 3);
                topSpeed[i] += 1;
            } else if (topSpeed[i] > 18) {
                lastTop[i] += 3 * Math.round(visConfig.decSpeed / 3);
                topSpeed[i] += 1;
            } else if (topSpeed[i] > 10) {
                lastTop[i] += 2 * Math.round(visConfig.decSpeed / 3);
                topSpeed[i] += 1;
            } else {
                topSpeed[i] += 1 + Math.round(visConfig.decSpeed / 3);
            }
            visTopCtx.fillRect(leftMargin + barWidth * i, lastTop[i], barWidth - gap, 1);
            allZero = false;
        }
        lastAud[i] = audioArray[i];
    }
    if (allZero) {
        idle = true;
    }
}

function updateSize() {
    const clientRect = visBar.getBoundingClientRect();
    visBar.height = clientRect.height;
    visBar.width = clientRect.width;
    visTop.height = visBar.height;
    visTop.width = visBar.width;
    idle = false;
}

export function updateVisConfig() {
    visConfig = {
        type: localStorage.wmpotifyVisType || 'bars',
        barColor: localStorage.wmpotifyVisBarColor || '#a4eb0c',
        topColor: localStorage.wmpotifyVisTopColor || '#dfeaf7',
        useSchemeColors: localStorage.wmpotifyVisUseSchemeColors,
        followAlbumArt: localStorage.wmpotifyVisFollowAlbumArt,
        barWidth: parseInt(localStorage.wmpotifyVisBarWidth || 6),
        decSpeed: parseFloat(localStorage.wmpotifyVisDecSpeed || 2),
        primaryScale: parseFloat(localStorage.wmpotifyVisPrimaryScale || 1.0),
        diffScale: parseFloat(localStorage.wmpotifyVisDiffScale || 0.07)
    };
    visTopCtx.clearRect(0, 0, visTop.width, visTop.height);
    idle = false;

    if (visConfig.type === 'milkdrop') {
        ButterchurnAdaptor.init(visBC);
        ButterchurnAdaptor.setPaused(false);
    } else {
        ButterchurnAdaptor.setPaused(true);
        if (visConfig.followAlbumArt) {
            updateAlbumArtColor();
        }
    }
}

function updateSchemeColor() {
    schemeBarColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-accent');
    schemeTopColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-text');
    App.setState({ schemeTopColor });
}

async function updateAlbumArtColor() {
    // Spicetify.colorExtractor and extractColorPreset are not that reliable
    // They often return duplicate colors for different color types, making it hard to determine which color to use
    // So we'll just use Spotify's color-lyrics API
    // Idk if this works on Spotify Free

    // If lyrics are visible and Spotify lyrics are enabled, this API will be called multiple times
    // But let's just let the browser caching do its job
    const spotifyData = await Spicetify.CosmosAsync?.get(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${Spicetify.Player.data?.item?.uri?.split(':').pop()}?format=json&vocalRemoval=false&market=from_token`);
    const colors = spotifyData?.colors;
    if (!colors) {
        return;
    }
    albumArtBarColor = `rgb(${colors.text >> 16 & 0xFF}, ${colors.text >> 8 & 0xFF}, ${colors.text & 0xFF})`;
    albumArtTopColor = `rgb(${colors.highlightText >> 16 & 0xFF}, ${colors.highlightText >> 8 & 0xFF}, ${colors.highlightText & 0xFF})`;
    const bgColor = `rgb(${colors.background >> 16 & 0xFF}, ${colors.background >> 8 & 0xFF}, ${colors.background & 0xFF})`;
    App.setState({ bgColorFromAlbumArt: bgColor, albumArtTopColor });
}

const mpSchemeUpdateObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);

            const hasMarketplaceCSS = (nodes) => nodes.some(node => 
                node.nodeType === Node.ELEMENT_NODE && 
                node.matches('.marketplaceCSS.marketplaceScheme')
            );

            if (hasMarketplaceCSS(addedNodes)) {
                updateSchemeColor();
            }
        }
    }
});

async function setupListeners() {
    console.log('Setting up listeners');
    try {
        audioData = await spAudioDataToFrequencies();
        App.setState({ noAudioData: false });
    } catch {
        // Retry after 1 second
        initAttempts++;
        if (initAttempts > 5) {
            App.setState({ noAudioData: true });
        } else {
            setTimeout(setupListeners, 1000);
            return;
        }
    }

    updateSchemeColor();
    if (visConfig.followAlbumArt) {
        updateAlbumArtColor();
    }
    albumArt.src = document.querySelector('.main-nowPlayingWidget-coverArt .cover-art img')?.src || '';

    // Observe color scheme changes through Spicetify Marketplace
    mpSchemeUpdateObserver.observe(document.body, { childList: true });
    // Observe color scheme changes through WMPotify Color Chooser
    new MutationObserver(updateSchemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    Spicetify.Player.addEventListener('songchange', async () => {
        try {
            audioData = await spAudioDataToFrequencies();
            App.setState({ noAudioData: false });
        } catch {
            audioData = null;
            App.setState({ noAudioData: true });
        }
        lastIndex = 0;
        albumArt.src = Spicetify.Player.data?.item?.album?.images?.[0]?.url?.replace('spotify:image:', 'https://i.scdn.co/image/') || '';
        if (visConfig.followAlbumArt) {
            updateAlbumArtColor();
        }
    });
    ButterchurnAdaptor.setAudioData(audioData);
    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval(wallpaperAudioListener, 1000 / fps);
}

window.addEventListener('resize', updateSize);

export async function init(elemRefs) {
    console.log('Initializing wmpvis');
    albumArt = elemRefs.albumArt.current;
    visBar = elemRefs.visBar.current;
    visTop = elemRefs.visTop.current;
    visBC = elemRefs.visBC.current;
    debugView = elemRefs.debug.current;

    visBarCtx = visBar.getContext('2d');
    visTopCtx = visTop.getContext('2d');

    updateSize();
    lastTop.fill(visTop.height);
    setupListeners();
    updateVisConfig();
    new ResizeObserver(updateSize).observe(visBar);

    if (visConfig.type === 'milkdrop') {
        ButterchurnAdaptor.init(visBC);
    }

    MadVisLyrics.init(elemRefs.lyrics.current);

    if (!initedOnce) {
        Spicetify.Platform.History.listen((location) => {
            if (location.pathname !== '/wmpvis') {
                uninit();
                delete globalThis.wmpvisSetShowLyrics;
            }
        })
    }

    initedOnce = true;
}

export function uninit() {
    if (interval) {
        clearInterval(interval);
    }
    ButterchurnAdaptor.uninit();
    MadVisLyrics.uninit();
}