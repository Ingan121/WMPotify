'use strict';

import DirectUserStorage from "../utils/DirectUserStorage";
import SidebarManager from "./SidebarManager";
import CustomLibX from "../pages/libx";
import { initDiscographyPage } from "../pages/discography";
import { initPlaylistPage } from "../pages/playlist";
import { ylxKeyPrefix, expandedStateKey } from "../pages/libx";

let initTime = 0;
let headerWrapperObserver: MutationObserver | null = null;

const PageManager = {
    waitForPageRender() {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                if (document.querySelector('.main-loadingPage-container')) {
                    return;
                }
                resolve(undefined);
                observer.disconnect();
            });
            observer.observe(document.querySelector('.main-view-container__scroll-node-child main')!, { childList: true });
        });
    },

    async onLocChange(location: Location) {
        if (!location?.pathname) {
            return;
        }

        if (initTime && Date.now() - initTime < 2000) {
            // Prevent double init on page load
            return;
        }

        document.documentElement.dataset.page = location.pathname;

        SidebarManager.updateSidebarWidth(true);

        if (location.pathname.startsWith('/wmpotify-standalone-libx')) {
            document.body.dataset.wmpotifyLibPageOpen = "true";

            // Use Spicetify.LocalStorageAPI for immediate effect, then revert the underlying localStorage values to prevent persistence
            const origSidebarState = DirectUserStorage.getItem(`${ylxKeyPrefix}-sidebar-state`);
            const origSidebarWidth = DirectUserStorage.getItem(expandedStateKey);
            Spicetify.Platform.LocalStorageAPI.setItem(`${ylxKeyPrefix}-sidebar-state`, 2);
            Spicetify.Platform.LocalStorageAPI.setItem(expandedStateKey, 0);
            DirectUserStorage.setItem(`${ylxKeyPrefix}-sidebar-state`, origSidebarState!); // make the previous setItem temporary
            DirectUserStorage.setItem(expandedStateKey, origSidebarWidth!);

            if (!(await CustomLibX.init())) {
                // Already initialized
                if (Spicetify.Platform.History.action === 'POP') {
                    // User navigation with back/forward buttons
                    CustomLibX.go();
                }
            }
        } else if (document.body.dataset.wmpotifyLibPageOpen === "true") {
            delete document.body.dataset.wmpotifyLibPageOpen;

            CustomLibX.uninit();

            if (localStorage.wmpotifyShowLibX) {
                const origSidebarState = DirectUserStorage.getItem(`${ylxKeyPrefix}-sidebar-state`);
                DirectUserStorage.removeItem(`${ylxKeyPrefix}-sidebar-state`); // Spicetify LocalStorageAPI does nothing if setting to same value, so remove it first
                const origSidebarWidth = DirectUserStorage.getItem(expandedStateKey);
                DirectUserStorage.removeItem(expandedStateKey);
                Spicetify.Platform.LocalStorageAPI.setItem(`${ylxKeyPrefix}-sidebar-state`, parseInt(origSidebarState!.toString()));
                Spicetify.Platform.LocalStorageAPI.setItem(expandedStateKey, parseInt(origSidebarWidth!.toString()));
            } else {
                Spicetify.Platform.LocalStorageAPI.setItem(`${ylxKeyPrefix}-sidebar-state`, 1); // collapsed
            }
        }

        if (location.pathname.match('/artist/.*/discography.*')) {
            initDiscographyPage(true);
        }
    },

    async onMainContentMount() {
        console.debug('WMPotify: onMainContentMount');
        initPlaylistPage();
        if (headerWrapperObserver) {
            headerWrapperObserver.disconnect();
        }
        const headerWrapper = document.querySelector('div[data-testid="topbar-content-wrapper"]');
        if (headerWrapper) {
            headerWrapperObserver = new MutationObserver(PageManager.onMainContentMount);
            headerWrapperObserver.observe(headerWrapper, { childList: true });
        }
    },

    init() {
        PageManager.onLocChange(Spicetify.Platform.History.location);
        initTime = Date.now();
        Spicetify.Platform.History.listen((location: Location) => PageManager.onLocChange(location));
        new MutationObserver(PageManager.onMainContentMount).observe(document.querySelector('main')!, { childList: true });
        new MutationObserver(PageManager.onMainContentMount).observe(document.querySelector('.Root__main-view')!, { childList: true });
    },

    initPlaylistPage
};

export default PageManager;