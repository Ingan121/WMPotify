'use strict';

import PageManager from "../managers/PageManager";

export async function initDiscographyPage(wait: boolean) {
    const section = document.querySelector('section[data-test-uri^="spotify:artist:"]') as HTMLElement | null;
    if (!section) {
        if (wait) {
            await PageManager.waitForPageRender();
            initDiscographyPage(false);
        }
        return;
    }

    await waitForFullRender(section);

    let topbar = (section.querySelector('.artist-artistDiscography-topBar') || section.querySelector('section div:has(> .x-sortBox-sortDropdown)')) as HTMLElement | null;
    if (topbar) {
        topbar.dataset.identifier = 'discography-topbar';
        document.querySelector('.main-topBar-topbarContent')?.appendChild(topbar);
        // Prevent React from removing the topbar when exiting the page, causing critical errors (#64)
        const origRemoveChild = section.removeChild;
        (section.removeChild as any) = function (child) {
            if (child === topbar) {
                topbar?.remove();
                return child;
            }
            return origRemoveChild.call(section, child);
        };
    } else {
        topbar = document.querySelector('[data-identifier="discography-topbar"]') as HTMLElement | null;
    }
    if (!topbar) {
        return;
    }

    if (section.querySelector('.artist-artistDiscography-cardGrid')) {
        await waitForFullRender(section, true);
    }

    const artistName = topbar.querySelector('a')?.textContent;
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
            const playBtn = header.querySelector('.artist-artistDiscography-headerButtons div button') as HTMLButtonElement | null;
            playBtn?.click();
        });
        headerImage.addEventListener('contextmenu', async (event: Event) => {
            const menuBtn = header.querySelector('.artist-artistDiscography-headerButtons > button:last-child') as HTMLButtonElement | null;
            menuBtn?.click();
            event.preventDefault();
            event.stopPropagation();
            await waitForContextMenu();
            const menu = document.querySelector('[data-tippy-root]') as HTMLElement | null;
            if (menu) {
                menu.dataset.wmpotifyForceTransform = "true";
                const mouseEvent = event as MouseEvent;
                menu.style.setProperty('--tippy-force-transform', `translate(${mouseEvent.clientX}px, ${mouseEvent.clientY}px)`);
            }
        });
        const link = document.createElement('a');
        link.href = artistUrl || '';
        link.textContent = artistName || '';
        header.querySelector('.artist-artistDiscography-headerTitle + div')?.appendChild(link);
    }

    const trackLists = section.querySelectorAll('.artist-artistDiscography-tracklist');
    for (const trackList of trackLists) {
        if (trackList.querySelector('.wmpotify-discography-trackList-header')) {
            continue;
        }
        const albumName = trackList.querySelector('[role="grid"]') as HTMLElement | null;
        if (!albumName) {
            continue;
        }
        const albumTitle = albumName.getAttribute('aria-label') || '';
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
    observer.observe(target!, { childList: true, subtree: subtreeNeeded });
}

function waitForFullRender(section: HTMLElement, noGridView: boolean = false): Promise<undefined> | undefined {
    if (!section.querySelector('.artist-artistDiscography-tracklist') && (noGridView || !section.querySelector('.artist-artistDiscography-cardGrid'))) {
        return new Promise(resolve => {
            const observer = new MutationObserver(() => {
                if (section.querySelector('.artist-artistDiscography-tracklist') || (!noGridView && section.querySelector('.artist-artistDiscography-cardGrid'))) {
                    observer.disconnect();
                    resolve(undefined);
                }
            });
            observer.observe(section, { childList: true, subtree: true });
        });
    }
}

function waitForContextMenu(): Promise<void> {
    return new Promise(resolve => {
        const observer = new MutationObserver(() => {
            const menu = document.querySelector('[data-tippy-root]');
            if (menu) {
                observer.disconnect();
                resolve(undefined);
            }
        });
        observer.observe(document.body, { childList: true });
    });
}