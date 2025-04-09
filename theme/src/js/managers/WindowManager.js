'use strict';

import Config from "../pages/config";
import WindhawkComm from "../WindhawkComm";

let fullscreenHideControlTimer = null;

function toggleMiniMode() {
    if (!WindhawkComm.available()) {
        return;
    }
    if (isMiniMode()) {
        const lastSize = localStorage.wmpotifyPreMiniModeSize?.split(',');
        if (lastSize && lastSize.length === 2) {
            WindhawkComm.resizeTo(parseInt(lastSize[0]), parseInt(lastSize[1]));
        }
    } else {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        localStorage.wmpotifyPreMiniModeSize = [window.innerWidth, window.innerHeight];
        WindhawkComm.resizeTo(358, 60);
    }
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
        exitFullscreen();
    } else {
        if (Spicetify.Config.custom_apps.includes('wmpvis')) {
            Spicetify.Platform.History.push({ pathname: '/wmpvis' });
        } else {
            const lyricsButton = document.querySelector('.main-nowPlayingBar-extraControls button[data-testid="lyrics-button"]');
            if (lyricsButton) {
                lyricsButton.click();
            }
        }
        Config.close();
        document.documentElement.requestFullscreen();
        document.body.classList.add('wmpotify-playerbar-visible');
        setTimeout(() => {
            document.addEventListener('pointermove', fullscreenMouseMoveListener);
            fullscreenMouseMoveListener();
        }, 200);
    }
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            exitFullscreen();
        }
    }, { once: true });
    // Somehow fullscreenchange event doesn't fire when exiting fullscreen with Esc key in Spotify
    document.addEventListener('resize', () => {
        exitFullscreen();
    }, { once: true });
}

function isMiniMode() {
    const isCustomTitlebar = !!document.querySelector('#wmpotify-title-bar');
    return window.innerWidth < 360 && window.innerHeight < (isCustomTitlebar ? 92 : 62);
}

function fullscreenMouseMoveListener() {
    if (!document.fullscreenElement) {
        exitFullscreen();
        return;
    }
    document.body.classList.add('wmpotify-playerbar-visible');
    clearTimeout(fullscreenHideControlTimer);
    fullscreenHideControlTimer = setTimeout(() => {
        document.body.classList.remove('wmpotify-playerbar-visible');
    }, 2000);
}

function exitFullscreen() {
    document.body.classList.remove('wmpotify-playerbar-visible');
    document.removeEventListener('pointermove', fullscreenMouseMoveListener);
}

window.addEventListener('resize', () => {
    if (localStorage.wmpotifyTopMost === 'minimode') {
        WindhawkComm.setTopMost(isMiniMode());
    }
});

const WindowManager = {
    toggleMiniMode,
    toggleFullscreen,
    isMiniMode,
}

export default WindowManager;