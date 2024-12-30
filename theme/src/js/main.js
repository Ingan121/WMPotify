import { MadMenu, createMadMenu } from './MadMenu';
import { noControls } from './noControls';
import { initQueuePanel } from './queue';

(function() {
    const elementsRequired = [
        '.Root__globalNav',
        '.main-globalNav-searchContainer > button',
        '.main-globalNav-searchContainer > div form button',
        '.custom-navlinks-scrollable_container div[role="presentation"] > button',
        '.main-topBar-topbarContentRight > .main-actionButtons > button',
        '.main-topBar-topbarContentRight > button:last-child',
        '.player-controls__left',
        '.player-controls__buttons button[data-testid="control-button-skip-back"]',
        '.player-controls__buttons button[data-testid="control-button-repeat"]',
        '.player-controls__buttons button[data-testid="control-button-playpause"]',
        '.player-controls__right',
        '.playback-bar .encore-text',
        '.volume-bar',
        '.volume-bar__icon-button',
        '.volume-bar .progress-bar',
        '.main-nowPlayingBar-left',
        '.main-nowPlayingWidget-trackInfo',
        '.Root__right-sidebar > div > div',
    ];

    const tabNameSubstitutes = {
        'Your Library': 'Library',
        'Friend Activity': 'Friends',
    }

    async function init() {
        noControls();

        if (!localStorage.wmpotifyShowLibX) {
            document.body.dataset.hideLibx = true;
        }

        const topbar = document.querySelector('.Root__globalNav');
        const tabsContainer = document.createElement('div');
        tabsContainer.classList.add('wmpotify-tabs-container');
        topbar.insertBefore(tabsContainer, topbar.querySelector('.main-globalNav-searchSection'));

        const homeButton = document.querySelector('.main-globalNav-searchContainer > button');
        addTab(homeButton);
        const searchButton = document.querySelector('.main-globalNav-searchContainer > div form button');
        addTab(searchButton);
        const customAppButtons = document.querySelectorAll('.custom-navlinks-scrollable_container div[role="presentation"] > button');
        for (const btn of customAppButtons) {
            addTab(btn);
        }
        const rightButtons = document.querySelectorAll('.main-topBar-topbarContentRight > .main-actionButtons > button');
        for (const btn of rightButtons) {
            addTab(btn);
        }

        const accountButton = document.querySelector('.main-topBar-topbarContentRight > button:last-child');
        const accountLabel = document.createElement('span');
        accountLabel.textContent = accountButton.getAttribute('aria-label');
        accountLabel.classList.add('wmpotify-user-label');
        accountButton.appendChild(accountLabel);
        
        const playPauseButton = document.querySelector(".player-controls__buttons button[data-testid='control-button-playpause']");
        Spicetify.Player.addEventListener("onplaypause", updatePlayPauseButton);
        new MutationObserver(updatePlayPauseButton).observe(playPauseButton, { attributes: true, attributeFilter: ['aria-label'] });

        setupTrackInfoWidget();
        new MutationObserver(setupTrackInfoWidget).observe(document.querySelector('.main-nowPlayingBar-left'), { childList: true });

        const playerControlsLeft = document.querySelector('.player-controls__left');
        const prevButton = document.querySelector('.player-controls__buttons button[data-testid="control-button-skip-back"]');
        const repeatButton = document.querySelector('.player-controls__buttons button[data-testid="control-button-repeat"]');
        playerControlsLeft.insertBefore(repeatButton, prevButton);

        const stopButton = document.createElement('button');
        stopButton.setAttribute('aria-label', 'Stop');
        stopButton.classList.add('wmpotify-stop-button');
        stopButton.addEventListener('click', () => {
            Spicetify.Platform.PlayerAPI.clearQueue();
            Spicetify.Player.playUri("");
        });
        playerControlsLeft.insertBefore(stopButton, prevButton);

        const playerControlsRight = document.querySelector('.player-controls__right');
        const volumeBar = document.querySelector('.volume-bar');
        const volumeButton = volumeBar.querySelector('.volume-bar__icon-button');
        const volumeBarProgress = volumeBar.querySelector('.progress-bar');
        updateVolumeIcon();
        new MutationObserver(updateVolumeIcon).observe(volumeBarProgress, { attributes: true, attributeFilter: ['style'] });
        playerControlsRight.appendChild(volumeBar);

        const timeTexts = document.querySelectorAll('.playback-bar .encore-text'); // 0: elapsed, 1: total (both in HH:MM:SS format)
        const timeText = document.createElement('span');
        timeText.classList.add('wmpotify-time-text');
        let timeTextMode = parseInt(localStorage.wmpotifyTimeTextMode || 0); // 0: remaining, 1: elapsed, 2: elapsed / total
        if (timeTextMode === 2) {
            timeText.style.left = '-80px';
        }
        updateTimeText();
        timeText.addEventListener('click', () => {
            timeTextMode = (timeTextMode + 1) % 3;
            localStorage.wmpotifyTimeTextMode = timeTextMode;
            if (timeTextMode === 2) {
                timeText.style.left = '-80px';
            } else {
                timeText.style.left = '';
            }
        });
        playerControlsLeft.insertAdjacentElement('afterbegin', timeText);
        Spicetify.Player.addEventListener("onprogress", updateTimeText);

        // Shuffle button is often removed and re-added, so we need this to keep it in place
        const observer = new MutationObserver(() => {
            const childLength = playerControlsLeft.children.length;
            if (childLength === 4) {
                return;
            }
            observer.disconnect();
            playerControlsLeft.insertBefore(playerControlsLeft.children[childLength - 2], repeatButton);
            observer.observe(playerControlsLeft, { childList: true });
        });
        observer.observe(playerControlsLeft, { childList: true });

        initQueuePanel();
        new MutationObserver(initQueuePanel).observe(document.querySelector('.Root__right-sidebar > div > div'), { childList: true });

        function addTab(btn) {
            tabsContainer.appendChild(btn);
            const label = document.createElement('span');
            const name = btn.getAttribute('aria-label');
            label.textContent = tabNameSubstitutes[name] || name;
            label.classList.add('wmpotify-tab-label');
            btn.appendChild(label);
        }

        function setupTrackInfoWidget() {
            updatePlayPauseButton();
            const trackInfoWidget = document.querySelector('.main-nowPlayingWidget-trackInfo');
            if (!trackInfoWidget || document.querySelector('.wmpotify-track-info')) {
                return;
            }
            const trackInfoText = document.createElement('p');
            trackInfoText.classList.add('wmpotify-track-info');
            trackInfoText.textContent = document.querySelector('.main-trackInfo-name')?.textContent || '';
            trackInfoWidget.appendChild(trackInfoText);

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
            }, 3000);
            Spicetify.Player.addEventListener("songchange", () => {
                trackInfoCurrent = 0;
                trackInfoText.textContent = Spicetify.Player.data?.item.metadata.title;
            });
        }

        function updatePlayPauseButton() {
            if (Spicetify.Player.isPlaying()) {
                playPauseButton.classList.add('playing');
            } else {
                playPauseButton.classList.remove('playing');
            }
        }

        function updateVolumeIcon() {
            const volume = getComputedStyle(volumeBarProgress).getPropertyValue('--progress-bar-transform').replace('%', '') / 100;
            if (volume === 0) {
                volumeButton.dataset.vol = 'muted';
            } else if (volume <= 0.3) {
                volumeButton.dataset.vol = 'low';
            } else if (volume <= 0.6) {
                volumeButton.dataset.vol = 'mid';
            } else {
                volumeButton.dataset.vol = 'high';
            }
        }

        function updateTimeText() {
            switch (timeTextMode) {
                case 0:
                    const remaining = Spicetify.Player.data.item.metadata.duration - Spicetify.Player.getProgress();
                    timeText.textContent = formatTime(remaining);
                    break;
                case 1:
                    timeText.textContent = timeTexts[0].textContent;
                    break;
                case 2:
                    timeText.textContent = `${timeTexts[0].textContent} / ${timeTexts[1].textContent}`;
                    break;
            }
        }
    }

    function formatTime(milliseconds) {
        let seconds = Math.floor(milliseconds / 1000);
        let minutes = Math.floor(seconds / 60);
        seconds = String(seconds % 60).padStart(2, '0');
        if (minutes < 60) {
            return `${minutes}:${seconds}`;
        }
        const hours = Math.floor(minutes / 60);
        minutes = String(minutes % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function isReady() {
        return window.Spicetify &&
            window.Spicetify.CosmosAsync &&
            window.Spicetify.Player?.origin?._state &&
            elementsRequired.every(selector => document.querySelector(selector));
    }

    window.addEventListener('load', () => {
        let cnt = 0;
        const interval = setInterval(() => {
            if (isReady()) {
                init();
                console.log('WMPotify: Theme loaded');
                clearInterval(interval);
            } else if (cnt++ > 100) {
                alert('[WMPotify] Theme loading failed. Please refresh the page to try again. Please make sure you have compatible Spoitfy version and have global navbar enabled.');
                clearInterval(interval);
                const missing = [];
                for (const selector of elementsRequired) {
                    if (!document.querySelector(selector)) {
                        missing.push(selector);
                    }
                }
                console.log('WMPotify: Missing elements:', missing);
            }
        }, 100);
    });
    
    // test
    createMadMenu('test', [
        {
            text: '&Item 1',
            click: () => console.log('Item 1 clicked')
        },
        {
            text: 'I&tem 2',
            click: () => console.log('Item 2 clicked')
        },
        {
            text: '&Submenu',
            submenu: 'testsub'
        }
    ])
    createMadMenu('testsub', [
        {
            text: 'Sub&item 1',
            click: () => console.log('Subitem 1 clicked')
        },
        {
            text: 'Subi&tem 2',
            click: () => console.log('Subitem 2 clicked')
        }
    ], 'test');
    const menu = new MadMenu(document.createElement('div'), ['test'], ['testsub'], [], []);
    menu.openMenu('test', { x: 300, y: 100 });
    globalThis.menu = menu;
    window.ignoreFocusLoss = true;
})();