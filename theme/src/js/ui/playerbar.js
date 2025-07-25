'use strict';

import Strings from '../strings';
import { formatTime } from '../utils/functions';
import WindhawkComm from '../WindhawkComm';
import WindowManager from '../managers/WindowManager';

class PlayerBar {
    constructor() {
        this.playerBar = document.querySelector('.main-nowPlayingBar-nowPlayingBar');

        this.setupTrackInfoWidget();
        new MutationObserver(this.setupTrackInfoWidget.bind(this)).observe(document.querySelector('.main-nowPlayingBar-left'), { childList: true });

        const playerControlsLeft = document.querySelector('.player-controls__left');
        const repeatButton = document.createElement('button');
        const repeatLabels = ['playback-control.enable-repeat', 'playback-control.enable-repeat-one', 'playback-control.disable-repeat'];
        const currentRepeat = Spicetify.Player.getRepeat();
        const currentLabel = Spicetify.Platform.Translations[repeatLabels[currentRepeat]];
        repeatButton.setAttribute('aria-label', currentLabel);
        repeatButton.setAttribute('aria-checked', !!currentRepeat);
        repeatButton.id = 'wmpotify-repeat-button';
        repeatButton.addEventListener('click', () => {
            Spicetify.Player.toggleRepeat();
        });
        Spicetify.Tippy(repeatButton, {
            ...Spicetify.TippyProps,
            content: currentLabel
        });
        Spicetify.Platform.PlayerAPI._events.addListener("update", ({ data }) => {
            repeatButton.setAttribute('aria-checked', !!data.repeat);
            const newLabel = Spicetify.Platform.Translations[repeatLabels[data.repeat]];
            repeatButton.setAttribute('aria-label', newLabel);
            repeatButton._tippy.setContent(newLabel);
        });
        playerControlsLeft.appendChild(repeatButton);

        const whStatus = WindhawkComm.query();

        const prevButton = document.querySelector('.player-controls__buttons button[data-testid="control-button-skip-back"]');
        const nextButton = document.querySelector('.player-controls__buttons button[data-testid="control-button-skip-forward"]');
        if (prevButton) {
            prevButton.addEventListener('contextmenu', (event) => {
                Spicetify.Player.seek(Spicetify.Player.getProgress() - 15000);
                event.preventDefault();
            });
            Spicetify.Platform.Translations['playback-control.skip-back'] += '\n' + Strings['PB_TOOLTIP_SEEK_BK'];
        }
        if (nextButton) {
            nextButton.addEventListener('contextmenu', (event) => {
                Spicetify.Player.seek(Spicetify.Player.getProgress() + 15000);
                event.preventDefault();
            });
            Spicetify.Platform.Translations['playback-control.skip-forward'] += '\n' + Strings['PB_TOOLTIP_SEEK_FWD'];
            if (whStatus?.speedModSupported && whStatus.immediateSpeedChange) {
                nextButton.addEventListener('pointerdown', () => {
                    // Speed control won't work when using Spotify Connect (playing on another device)
                    if (nextButton.disabled || Spicetify.Platform.ConnectAPI.state.connectionStatus === 'connected') {
                        return;
                    }
                    this.longPressTimer = setTimeout(() => {
                        nextButton.dataset.fastForward = true;
                        WindhawkComm.setPlaybackSpeed(5);
                        Spicetify.Player.play();
                    }, 1000);
                });
                document.addEventListener('pointerup', (event) => {
                    clearTimeout(this.longPressTimer);
                    if (nextButton.dataset.fastForward) {
                        delete nextButton.dataset.fastForward;
                        WindhawkComm.setPlaybackSpeed(1);
                        event.preventDefault();
                        event.stopPropagation();
                    }
                });
                Spicetify.Platform.Translations['playback-control.skip-forward'] += '\n' + Strings['PB_TOOLTIP_FF'];
            }
        }

        // Shuffle button is often re-added to right before the prev button
        // so keep shuffle and prev at the first of the left controls in DOM and re-order our modified/custom buttons with CSS flex order
        const stopButton = document.createElement('button');
        stopButton.setAttribute('aria-label', Strings['PB_TOOLTIP_STOP']);
        stopButton.id = 'wmpotify-stop-button';
        stopButton.addEventListener('click', () => {
            Spicetify.Platform.PlayerAPI.clearQueue();
            Spicetify.Player.playUri("");
        });
        Spicetify.Tippy(stopButton, {
            ...Spicetify.TippyProps,
            content: Strings['PB_TOOLTIP_STOP']
        });
        playerControlsLeft.appendChild(stopButton);

        const playerControlsRight = document.querySelector('.player-controls__right');
        const volumeBar = document.querySelector('.volume-bar');
        this.volumeButton = volumeBar.querySelector('.volume-bar__icon-button');
        this.volumeBarProgress = volumeBar.querySelector('.progress-bar');
        this.updateVolumeIcon();
        new MutationObserver(this.updateVolumeIcon.bind(this)).observe(this.volumeBarProgress, { attributes: true, attributeFilter: ['style'] });
        playerControlsRight.appendChild(volumeBar);

        const volSlider = document.querySelector('.volume-bar__slider-container');
        const volPopup = volSlider.children[0];
        volSlider.addEventListener('click', () => {
            if (window.innerWidth < 750) {
                volPopup.dataset.visible = true;
                const autoClose = setTimeout(() => {
                    delete volPopup.dataset.visible;
                }, 5000);
                volPopup.addEventListener('pointerup', () => {
                    clearTimeout(autoClose);
                    setTimeout(() => {
                        delete volPopup.dataset.visible;
                    }, 100);
                }, { once: true });
            }
        });

        this.timeTexts = document.querySelectorAll('.playback-bar [class*=encore-text]'); // 0: elapsed, 1: total (both in HH:MM:SS format)
        this.timeTextContainer = document.createElement('div');
        this.timeTextContainer.classList.add('wmpotify-time-text-container');
        this.timeText = document.createElement('span');
        this.timeText.classList.add('wmpotify-time-text');
        this.timeTextMode = parseInt(localStorage.wmpotifyTimeTextMode || 0); // 0: remaining, 1: elapsed, 2: elapsed / total
        this.updateTimeText();
        this.timeText.dataset.mode = this.timeTextMode;
        this.timeText.addEventListener('click', () => {
            this.timeTextMode = (this.timeTextMode + 1) % 3;
            this.timeText.dataset.mode = this.timeTextMode;
            localStorage.wmpotifyTimeTextMode = this.timeTextMode;
        });
        this.timeTextContainer.appendChild(this.timeText);
        this.playerBar.insertAdjacentElement('afterbegin', this.timeTextContainer);
        Spicetify.Player.addEventListener("onprogress", this.updateTimeText.bind(this));

        this.titlebar = document.querySelector('#wmpotify-title-bar');
        this.titleButtons = document.querySelector('#wmpotify-title-buttons');
        if (this.titlebar) {
            this.updateTimeTextMiniMode();
            window.addEventListener('resize', this.updateTimeTextMiniMode.bind(this));
        }

        if (whStatus) {
            const miniModeButton = new Spicetify.Playbar.Button(
                Strings['PB_BTN_MINI_MODE'],
                '', // SVG icon, not needed (image provided in CSS)
                () => WindowManager.toggleMiniMode()
            );
            miniModeButton.element.id = 'wmpotify-mini-mode-button';
        }

        const fullscreenButton = new Spicetify.Playbar.Button(
            Strings['PB_BTN_FULLSCREEN'],
            '',
            () => WindowManager.toggleFullscreen()
        );
        fullscreenButton.element.id = 'wmpotify-fullscreen-button';
    }

    async setupTrackInfoWidget() {
        const isCustomTitlebar = !!document.querySelector('#wmpotify-title-bar');
        const whAvailable = WindhawkComm.available();
        const origDefaultTitle = await Spicetify.AppTitle.get();
        const titlebarText = document.querySelector('#wmpotify-title-text');

        const trackInfoWidget = document.querySelector('.main-nowPlayingWidget-trackInfo');
        if (!trackInfoWidget || document.querySelector('.wmpotify-track-info')) {
            return;
        }
        const trackInfoText = document.createElement('p');
        trackInfoText.classList.add('wmpotify-track-info');
        trackInfoText.textContent = document.querySelector('.main-trackInfo-name')?.textContent || '';
        trackInfoWidget.appendChild(trackInfoText);
        if (window.innerWidth < 420 && window.innerHeight < (isCustomTitlebar ? 92 : 62)) {
            if (isCustomTitlebar) {
                titlebarText.textContent = trackInfoText.textContent;
            } else if (whAvailable) {
                WindhawkComm.setTitle(trackInfoText.textContent);
            }
            this.titleSet = true;
        }

        let trackInfoCurrent = 1; // 0: title, 1: artist, 2: album
        setInterval(() => {
            if (!Spicetify.Player.isPlaying()) {
                return;
            }
            const trackInfo = Spicetify.Player.data?.item.metadata;
            if (!trackInfo) {
                return;
            }
            if (trackInfoCurrent === 0) {
                trackInfoText.textContent = trackInfo.title;
            } else if (trackInfoCurrent === 1) {
                trackInfoText.textContent = trackInfo.artist_name;
            } else if (trackInfoCurrent === 2) {
                trackInfoText.textContent = trackInfo.album_title;
            }
            trackInfoCurrent = (trackInfoCurrent + 1) % 3;

            // Mini mode
            if (window.innerWidth < 420 && window.innerHeight < (isCustomTitlebar ? 92 : 62)) {
                if (isCustomTitlebar) {
                    titlebarText.textContent = trackInfoText.textContent;
                } else if (whAvailable) {
                    WindhawkComm.lockTitle(true);
                    WindhawkComm.setTitle(trackInfoText.textContent);
                }
                this.titleSet = true;
            } else {
                if (this.titleSet) {
                    this.titleSet = false;
                    if (isCustomTitlebar) {
                        titlebarText.textContent = origDefaultTitle;
                    }
                    if (!localStorage.wmpotifyLockTitle) {
                        WindhawkComm.lockTitle(false);
                    }
                    if (Spicetify.Player.isPlaying() && !localStorage.wmpotifyLockTitle) {
                        WindhawkComm.setTitle(trackInfo.artist_name + ' - ' + trackInfo.title);
                    } else {
                        WindhawkComm.setTitle(origDefaultTitle);
                    }
                }
            }
        }, 3000);
        Spicetify.Player.addEventListener("songchange", () => {
            trackInfoCurrent = 0;
            trackInfoText.textContent = Spicetify.Player.data?.item.metadata.title;
            if (window.innerWidth < 420 && window.innerHeight < (isCustomTitlebar ? 92 : 62)) {
                if (isCustomTitlebar) {
                    titlebarText.textContent = trackInfoText.textContent;
                } else if (whAvailable) {
                    WindhawkComm.setTitle(trackInfoText.textContent);
                }
                this.titleSet = true;
            }
        });
    }

    updateTimeTextMiniMode() {
        if (window.innerWidth < 800) {
            if (!this.titlebar.contains(this.timeText)) {
                if (this.titleButtons) {
                    this.titlebar.insertBefore(this.timeText, this.titleButtons);
                } else {
                    this.titlebar.appendChild(this.timeText);
                }
            }
        } else {
            if (!this.playerBar.contains(this.timeText)) {
                this.timeTextContainer.appendChild(this.timeText);
            }
        }
    }

    updateVolumeIcon() {
        const volume = getComputedStyle(this.volumeBarProgress).getPropertyValue('--progress-bar-transform').replace('%', '') / 100;
        if (volume === 0) {
            this.volumeButton.dataset.vol = 'muted';
        } else if (volume <= 0.3) {
            this.volumeButton.dataset.vol = 'low';
        } else if (volume <= 0.6) {
            this.volumeButton.dataset.vol = 'mid';
        } else {
            this.volumeButton.dataset.vol = 'high';
        }
    }

    updateTimeText() {
        switch (this.timeTextMode) {
            case 0:
                {
                    try {
                        const remaining = Spicetify.Player.data?.item?.metadata?.duration - Spicetify.Player.getProgress();
                        this.timeText.textContent = formatTime(remaining, true);
                    } catch (e) {
                        // getProgress might fail if some internal Spotify stuff goes wrong (more internal Spotify errors show up in console before WMPotify fail logs)
                        // As this function is called directly on init, to prevent error during init, just set it to 00:00
                        console.error('WMPotify: Error getting remaining time:', e);
                        this.timeText.textContent = '00:00';
                    }
                }
                break;
            case 1:
                {
                    let elapsed = this.timeTexts[0].textContent;
                    if (elapsed.length === 4 || elapsed.length === 7) { // idk if there's a hour-long song
                        elapsed = '0' + elapsed;
                    }
                    this.timeText.textContent = elapsed;
                }
                break;
            case 2:
                {
                    let elapsed = this.timeTexts[0].textContent;
                    if (elapsed.length === 4 || elapsed.length === 7) {
                        elapsed = '0' + elapsed;
                    }
                    let total = this.timeTexts[1].textContent;
                    if (total.length === 4 || total.length === 7) {
                        total = '0' + total;
                    }
                    this.timeText.textContent = `${elapsed} / ${total}`;
                }
                break;
        }
    }
}

export default PlayerBar;
