import DirectUserStorage from "../utils/DirectUserStorage";
import SidebarManager from "../managers/SidebarManager";
import CustomLibX from "../pages/libx";
import { updatePlayPauseButton } from "../ui/playerbar";
import { initDiscographyPage } from "../pages/discography";
import { initPlaylistPage } from "../pages/playlist";

let initTime = 0;

const PageManager = {
    waitForPageRender() {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                if (document.querySelector('.main-loadingPage-container')) {
                    return;
                }
                resolve();
                observer.disconnect();
            });
            observer.observe(document.querySelector('.main-view-container__scroll-node-child main'), { childList: true });
        });
    },

    async handleLocChange(location) {
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
            document.body.dataset.wmpotifyLibPageOpen = true;

            // Use Spicetify.LocalStorageAPI for immediate effect, then revert the underlying localStorage values to prevent persistence
            const origSidebarState = DirectUserStorage.getItem("ylx-sidebar-state");
            const origSidebarWidth = DirectUserStorage.getItem("ylx-expanded-state-nav-bar-width");
            Spicetify.Platform.LocalStorageAPI.setItem("ylx-sidebar-state", 2);
            Spicetify.Platform.LocalStorageAPI.setItem("ylx-expanded-state-nav-bar-width", 0);
            DirectUserStorage.setItem("ylx-sidebar-state", origSidebarState); // make the previous setItem temporary
            DirectUserStorage.setItem("ylx-expanded-state-nav-bar-width", origSidebarWidth);

            if (!(await CustomLibX.init())) {
                // Already initialized
                if (Spicetify.Platform.History.action === 'POP') {
                    // User navigation with back/forward buttons
                    CustomLibX.go();
                }
            }
        } else if (document.body.dataset.wmpotifyLibPageOpen) {
            delete document.body.dataset.wmpotifyLibPageOpen;

            CustomLibX.uninit();

            if (localStorage.wmpotifyShowLibX) {
                const origSidebarState = DirectUserStorage.getItem("ylx-sidebar-state");
                DirectUserStorage.removeItem("ylx-sidebar-state"); // Spicetify LocalStorageAPI does nothing if setting to same value, so remove it first
                const origSidebarWidth = DirectUserStorage.getItem("ylx-expanded-state-nav-bar-width");
                DirectUserStorage.removeItem("ylx-expanded-state-nav-bar-width");
                Spicetify.Platform.LocalStorageAPI.setItem("ylx-sidebar-state", parseInt(origSidebarState));
                Spicetify.Platform.LocalStorageAPI.setItem("ylx-expanded-state-nav-bar-width", parseInt(origSidebarWidth));
            } else {
                Spicetify.Platform.LocalStorageAPI.setItem("ylx-sidebar-state", 1); // collapsed
            }
        }

        if (location.pathname.match('/artist/.*/discography/.*')) {
            initDiscographyPage(true);
        } else if (location.pathname.startsWith('/playlist/')) {
            if (!document.querySelector('.playlist-playlist-playlist')) {
                await PageManager.waitForPageRender();
            }
            updatePlayPauseButton();
        }

        initPlaylistPage(true);
    },

    init() {
        PageManager.handleLocChange(Spicetify.Platform.History.location);
        initTime = Date.now();
        Spicetify.Platform.History.listen((location) => PageManager.handleLocChange(location));
    }
};

export default PageManager;