'use strict';

import PageManager from "../managers/PageManager";

export async function initDiscographyPage(wait) {
    const section = document.querySelector('section[data-test-uri^="spotify:artist:"]');
    if (!section) {
        if (wait) {
            await PageManager.waitForPageRender();
            initDiscographyPage(false);
        }
        return;
    }

    await waitForFullRender(section);

    let topbar = section.querySelector('.artist-artistDiscography-topBar') || section.querySelector('section div:has(> .x-sortBox-sortDropdown)');
    if (topbar) {
        topbar.dataset.identifier = 'discography-topbar';
        document.querySelector('.main-topBar-topbarContent').appendChild(topbar);
        // Prevent React from removing the topbar when exiting the page, causing critical errors (#64)
        const origRemoveChild = section.removeChild;
        section.removeChild = function (child) {
            if (child === topbar) {
                topbar.remove();
                return;
            }
            return origRemoveChild.call(this, child);
        };
    } else {
        topbar = document.querySelector('[data-identifier="discography-topbar"]');
    }
    if (!topbar) {
        return;
    }

    if (section.querySelector('.artist-artistDiscography-cardGrid')) {
        await waitForFullRender(section, true);
    }

    const artistName = topbar.querySelector('a').textContent;
    const artistUrl = section.dataset.testUri;

    const headers = section.querySelectorAll('.artist-artistDiscography-headerContainer');
    for (const header of headers) {
        if (header.querySelector('.artist-artistDiscography-headerTitle + div a')) {
            continue;
        }
        const headerImage = header.querySelector('.main-entityHeader-image');
        if (!headerImage) {
            continue;
        }
        headerImage.addEventListener('dblclick', () => {
            header.querySelector('.artist-artistDiscography-headerButtons div button').click();
        });
        headerImage.addEventListener('contextmenu', async (event) => {
            header.querySelector('.artist-artistDiscography-headerButtons > button:last-child').click();
            event.preventDefault();
            event.stopPropagation();
            await waitForContextMenu();
            const menu = document.querySelector('[data-tippy-root]');
            menu.dataset.wmpotifyForceTransform = true;
            menu.style.setProperty('--tippy-force-transform', `translate(${event.clientX}px, ${event.clientY}px)`);
        });
        const link = document.createElement('a');
        link.href = artistUrl;
        link.textContent = artistName;
        header.querySelector('.artist-artistDiscography-headerTitle + div').appendChild(link);
    }

    const trackLists = section.querySelectorAll('.artist-artistDiscography-tracklist');
    for (const trackList of trackLists) {
        if (trackList.querySelector('.wmpotify-discography-trackList-header')) {
            continue;
        }
        const albumName = trackList.querySelector('[role="grid"]');
        if (!albumName) {
            continue;
        }
        const albumTitle = albumName.getAttribute('aria-label');
        const trackListHeader = document.createElement('div');
        trackListHeader.className = 'wmpotify-discography-trackList-header';
        trackListHeader.textContent = albumTitle;
        trackList.insertAdjacentElement('afterbegin', trackListHeader);
    }

    const observer = new MutationObserver(() => {
        initDiscographyPage(false);
        observer.disconnect();
    });
    let subtreeNeeded = false;
    let target = section.querySelector('[data-testid="infinite-scroll-list"]');
    if (!target) {
        target = section.querySelector('section');
        subtreeNeeded = true;
    }
    observer.observe(target, { childList: true, subtree: subtreeNeeded });
}

function waitForFullRender(section, noGridView) {
    if (!section.querySelector('.artist-artistDiscography-tracklist') && (noGridView || !section.querySelector('.artist-artistDiscography-cardGrid'))) {
        return new Promise(resolve => {
            const observer = new MutationObserver(() => {
                if (section.querySelector('.artist-artistDiscography-tracklist') || (!noGridView && section.querySelector('.artist-artistDiscography-cardGrid'))) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(section, { childList: true, subtree: true });
        });
    }
}

function waitForContextMenu() {
    return new Promise(resolve => {
        const observer = new MutationObserver(() => {
            const menu = document.querySelector('[data-tippy-root]');
            if (menu) {
                observer.disconnect();
                resolve();
            }
        });
        observer.observe(document.body, { childList: true });
    });
}