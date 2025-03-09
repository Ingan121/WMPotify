'use strict';

import Strings from '../strings';
import { formatTime } from "../utils/functions";
import { createMadMenu, MadMenu } from "../utils/MadMenu";
import SidebarManager from '../managers/SidebarManager';

let extraQueuePanelObserver;

export function initQueuePanel() {
    console.log('WMPotify: Trying to initialize queue panel');

    SidebarManager.updateSidebarWidth(true);

    // 1.2.55(53?) changed something with the right sidebar, making the npv panel always open
    const detectTarget = document.querySelector('.Root__right-sidebar > div > div > div:has(aside)');
    if (detectTarget && !extraQueuePanelObserver) {
        extraQueuePanelObserver = new MutationObserver(initQueuePanel);
        extraQueuePanelObserver.observe(detectTarget, { childList: true });
    }

    if (!document.querySelector('#queue-panel') ||
        document.querySelector('#wmpotify-queue-toolbar') ||
        document.querySelectorAll('div[data-encore-id="tabPanel"]').length > 2
    ) {
        return;
    }

    // There are two panels with the same ID, when the transition animation is in progress
    const panel = document.querySelector('#Desktop_PanelContainer_Id:has(#queue-panel)');
    const previousPanel = document.querySelector('#Desktop_PanelContainer_Id:not(:has(#queue-panel))');
    if (panel && previousPanel) {
        previousPanel.style.display = 'none';
    }
    panel.classList.add('spotify-queue-panel');
    const top = document.querySelector('#Desktop_PanelContainer_Id:has(#queue-panel) > div > div:first-child > div:first-child');
    const belowSeparator = document.querySelector('#Desktop_PanelContainer_Id:has(#queue-panel) > div > div:nth-child(2)');
    belowSeparator.id = 'spotify-queue-panel-content';

    const queueToolbar = document.createElement('div');
    queueToolbar.id = 'wmpotify-queue-toolbar';

    const playlistButton = document.createElement('button');
    playlistButton.id = 'wmpotify-queue-playlist-button';
    playlistButton.classList.add('wmpotify-toolbar-button');
    playlistButton.addEventListener('click', () => {
        const url = Spicetify.Player.data?.context?.uri;
        if (url) {
            window.open(url);
        }
    });
    playlistButton.textContent = document.querySelector('#queue-panel div[data-flip-id*="section-header-"] a')?.textContent || Strings['QUEUE_CURRENT_PLAYLIST_PLACEHOLDER'];
    playlistButton.innerHTML += '<span class="expandMark">⏷</span>';
    queueToolbar.appendChild(playlistButton);

    const clearButton = document.createElement('button');
    clearButton.id = 'wmpotify-queue-clear-button';
    clearButton.classList.add('wmpotify-toolbar-button');
    clearButton.addEventListener('click', () => {
        Spicetify.Platform.PlayerAPI.clearQueue();
        Spicetify.Player.playUri("");
    });

    queueToolbar.appendChild(clearButton);
    belowSeparator.insertAdjacentElement('afterbegin', queueToolbar);

    const placeholderImage = getComputedStyle(document.documentElement).getPropertyValue('--album-art-placeholder').trim().slice(5, -2);
    const topPanel = document.createElement('div');
    topPanel.id = 'wmpotify-queue-npv';
    const albumArt = document.createElement('img');
    albumArt.id = 'wmpotify-queue-album-art';
    albumArt.src = document.querySelector('.main-nowPlayingWidget-coverArt .cover-art img')?.src || placeholderImage;
    topPanel.appendChild(albumArt);
    const songTitle = document.createElement('div');
    songTitle.id = 'wmpotify-queue-song-title';
    songTitle.textContent = document.querySelector('.main-trackInfo-name')?.textContent || 'No items';
    topPanel.appendChild(songTitle);
    top.insertAdjacentElement('afterbegin', topPanel);

    onQueuePanelInit();
    new MutationObserver(onQueuePanelInit).observe(document.querySelector('#queue-panel'), { childList: true });

    const tabs = document.querySelectorAll('#Desktop_PanelContainer_Id:has(#queue-panel) div[role="tablist"] button');
    let menuItems = [];
    let menuObj;
    for (const tab of tabs) {
        menuItems.push({
            text: tab.textContent,
            click: function () {
                for (const menuItem of menuObj.menuItems) {
                    menuItem.classList.remove('activeStyle');
                }
                this.classList.add('activeStyle');
                tab.click()
            }
        });
    }
    menuItems[0].classList = ['activeStyle'];
    document.querySelector('#wmpotifyQueueTabMenuBg')?.remove();
    menuObj = createMadMenu('wmpotifyQueueTab', menuItems);
    const menu = new MadMenu(['wmpotifyQueueTab']);
    panel.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        menu.openMenu('wmpotifyQueueTab', { left: e.clientX + 'px', top: e.clientY + 'px' });
    });

    Spicetify.Player.addEventListener('songchange', () => {
        playlistButton.textContent = Spicetify.Player.data?.context?.metadata?.context_description || Strings['QUEUE_CURRENT_PLAYLIST_PLACEHOLDER'];
        playlistButton.innerHTML += '<span class="expandMark">⏷</span>';
        albumArt.src = Spicetify.Player.data?.item?.album?.images?.[0]?.url?.replace('spotify:image:', 'https://i.scdn.co/image/') || placeholderImage;
        songTitle.textContent = Spicetify.Player.data?.item?.name || 'No items';
    });
}

function onQueuePanelInit() {
    const queueContainer = document.querySelector('#queue-panel > div:first-child');
    if (!queueContainer) {
        return;
    }
    const queueContent = queueContainer?.querySelectorAll('#queue-panel ul')[1];
    if (queueContent) {
        delete queueContainer.dataset.nothingInQueue;
        processQueueItems();
        new MutationObserver(processQueueItems).observe(queueContent, { childList: true });
    } else {
        if (document.querySelector('#queue-panel > div:first-child > svg:first-child')) {
            queueContainer.dataset.nothingInQueue = true;
        } else {
            delete queueContainer.dataset.nothingInQueue;
        }
    }

}

function processQueueItems() {
    if (!document.querySelector('#queue-panel') || !Spicetify.Queue) {
        return;
    }
    const queueItems = document.querySelectorAll('#queue-panel li .HeaderArea');
    for (let i = 0; i < queueItems.length; i++) {
        const queueItem = queueItems[i];
        if (queueItem.querySelector('.wmpotify-queue-duration')) {
            continue;
        }
        const duration = i === 0 ?
            Spicetify.Queue.track?.contextTrack?.metadata?.duration :
            Spicetify.Queue.nextTracks?.[i - 1]?.contextTrack?.metadata?.duration;
        if (!duration) {
            continue;
        }
        const durationElement = document.createElement('span');
        durationElement.classList.add('wmpotify-queue-duration');
        durationElement.textContent = formatTime(duration);
        queueItem.appendChild(durationElement);
    }
}