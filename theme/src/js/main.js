'use strict';

import Strings from './strings'
import ControlManager from './managers/ControlManager';
import { setTintColor } from './ui/tinting';
import CustomTitlebar from './ui/titlebar';
import { setupTopbar } from './ui/topbar';
import { setupPlayerbar } from './ui/playerbar';
import Config from './pages/config';
import SidebarManager from './managers/SidebarManager';
import { initQueuePanel } from './pages/queue';
import WindhawkComm from './WindhawkComm';
import PageManager from './managers/PageManager';
import WindowManager from './managers/WindowManager';
import { ver, checkUpdates, compareVersions, compareSpotifyVersion } from './utils/UpdateCheck';
import { openUpdateDialog } from './ui/dialogs';
import ThemeManager from './managers/ThemeManager';

const elementsRequired = [
    '.Root__globalNav',
    '.main-globalNav-historyButtons',
    '.main-globalNav-searchSection',
    '.main-globalNav-searchContainer > button',
    '.main-globalNav-searchContainer div form button',
    '.main-globalNav-searchContainer div form input[type="search"]',
    '.main-topBar-topbarContentRight > .main-actionButtons > button',
    '.main-topBar-topbarContentRight > button:last-child',
    '.Root__main-view',
    '.main-view-container__scroll-node-child main',
    '.main-nowPlayingBar-nowPlayingBar',
    '.player-controls__left',
    '.player-controls__buttons button[data-testid="control-button-repeat"]',
    '.player-controls__buttons button[data-testid="control-button-playpause"]',
    '.player-controls__right',
    '.playback-bar [class*=encore-text]',
    '.volume-bar',
    '.volume-bar__icon-button',
    '.volume-bar .progress-bar',
    '.main-nowPlayingBar-left',
];

let style = 'xp';
let titleStyle = 'spotify';

function earlyInit() {
    if (!localStorage.wmpotifyShowLibX) {
        document.body.dataset.hideLibx = true;
    }

    WindhawkComm.init();

    const whStatus = WindhawkComm.query();

    if (whStatus) {
        if (localStorage.wmpotifyTopMost === 'always' || (localStorage.wmpotifyTopMost === 'minimode' && WindowManager.isMiniMode())) {
            WindhawkComm.setTopMost(true);
        } else {
            WindhawkComm.setTopMost(false);
        }
    }

    // Supported: native, custom, spotify, keepmenu
    // native: Use the native title bar (requires Linux or Windows with my Windhawk mod) Assumes native title bar is available and removes any custom title bar in the client area
    // custom: Use custom title bar implemented by this theme, install Spotify API Extender (SpotEx) or Windhawk mod for minimize/maximize buttons
    // spotify: Use Spotify's window controls (default on unmodded Spotify client on Windows/macOS, unavailable on Linux)
    // keepmenu: Use custom window controls but keep the space for Spotify's menu (useful when only controls are hidden with the WH mod, Windows only)
    // Default: native if native title bar is available, custom if SpotEx or WH mod is available, spotify otherwise
    if (localStorage.wmpotifyTitleStyle && ['native', 'custom', 'spotify', 'keepmenu'].includes(localStorage.wmpotifyTitleStyle)) {
        titleStyle = localStorage.wmpotifyTitleStyle;
    } else {
        console.log('WMPotify EarlyInit:', window.SpotEx, whStatus);
        if (window.outerHeight - window.innerHeight > 0 || whStatus?.options?.showframe || navigator.userAgent.includes('Linux')) {
            titleStyle = 'native';
        } else if (window.SpotEx || whStatus) {
            if (whStatus?.options?.showmenu && !whStatus.options.showcontrols) {
                titleStyle = 'keepmenu';
            } else {
                titleStyle = 'custom';
            }
        }
    }
    if (titleStyle === 'keepmenu' && !navigator.userAgent.includes('Windows')) {
        titleStyle = 'spotify';
    }
    if (titleStyle === 'spotify' && navigator.userAgent.includes('Linux')) {
        titleStyle = 'native';
    }
    document.documentElement.dataset.wmpotifyTitleStyle = titleStyle;
    if (titleStyle !== 'native') {
        CustomTitlebar.earlyInit();
    }

    if (whStatus && !localStorage.wmpotifyStyle && titleStyle === 'native' && whStatus.isThemingEnabled) {
        if (WindhawkComm.getModule()?.initialOptions.transparentrendering && whStatus.isDwmEnabled) {
            style = 'aero';
        } else if (!whStatus.isDwmEnabled) {
            style = 'basic';
        }
    }

    // Supported: xp, aero, basic
    if (localStorage.wmpotifyStyle && ['xp', 'aero', 'basic'].includes(localStorage.wmpotifyStyle)) {
        style = localStorage.wmpotifyStyle;
    }
    WindhawkComm.setMinSize(358, titleStyle === 'native' ? 60 : 90); // mini mode
    switch (style) {
        case 'xp':
            WindhawkComm.extendFrame(0, 0, 0, 0);
            break;
        case 'aero':
            WindhawkComm.extendFrame(0, 0, 0, 60);
            break;
        case 'basic':
            WindhawkComm.extendFrame(0, 0, 0, 0);
            document.body.style.setProperty('--basic-pb-text', localStorage.wmpotifyBasicTextColor || '#002963');
            if (document.hasFocus()) {
                document.body.style.backgroundColor = localStorage.wmpotifyBasicActiveColor || '#b9d1ea';
            } else {
                document.body.style.backgroundColor = localStorage.wmpotifyBasicInactiveColor || '#d7e4f2';
            }
            window.addEventListener('focus', () => {
                document.body.style.backgroundColor = localStorage.wmpotifyBasicActiveColor || '#b9d1ea';
            });
            window.addEventListener('blur', () => {
                document.body.style.backgroundColor = localStorage.wmpotifyBasicInactiveColor || '#d7e4f2';
            });
            break;
    }
    document.documentElement.dataset.wmpotifyStyle = style;

    document.documentElement.dataset.wmpotifyControlStyle = localStorage.wmpotifyControlStyle || 'aero';

    window.addEventListener('resize', () => {
        if (style === 'aero') {
            if (window.innerHeight < 62) {
                WindhawkComm.extendFrame(-1, -1, -1, -1);
            } else {
                WindhawkComm.extendFrame(0, 0, 0, 60);
            }
        }
        WindhawkComm.setMinSize(358, titleStyle === 'native' ? 60 : 90);
    });

    if (localStorage.wmpotifyFont) {
        document.documentElement.style.setProperty('--ui-font', localStorage.wmpotifyFont);
    }

    if (localStorage.wmpotifyHidePbLeftBtn) {
        document.body.dataset.hidePbLeftBtn = true;
    }

    if (whStatus && localStorage.wmpotifyLockTitle) {
        WindhawkComm.lockTitle(true);
    }

    let darkMode = 'follow_scheme';
    if (['follow_scheme', 'system', 'always', 'never'].includes(localStorage.wmpotifyDarkMode)) {
        darkMode = localStorage.wmpotifyDarkMode;
    } else if (WindhawkComm.getModule()?.initialOptions.noforceddarkmode) {
        darkMode = 'system';
    }
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkMode === 'always' ||
        (darkMode === 'follow_scheme' && window.Spicetify?.Config?.color_scheme === 'dark') ||
        (darkMode === 'system' && darkQuery.matches)
    ) {
        document.documentElement.dataset.wmpotifyDarkMode = true;
    }
    if (darkMode === 'system') {
        ThemeManager.addSystemDarkModeListener();
    } else if (darkMode === 'follow_scheme') {
        ThemeManager.addMarketplaceSchemeObserver();
    }
}

earlyInit();

async function init() {
    await CustomTitlebar.init(titleStyle);

    if (WindhawkComm.available() && localStorage.wmpotifyLockTitle) {
        WindhawkComm.setTitle(await Spicetify.AppTitle.get());
    }

    if (!localStorage.wmpotifyShowLibX) {
        Spicetify.Platform.LocalStorageAPI.setItem("ylx-sidebar-state", 1);
    }

    const isWin11 = Spicetify.Platform.PlatformData.os_version?.split('.')[2] >= 22000;
    if (isWin11 && localStorage.wmpotifyBackdrop !== 'none') {
        WindhawkComm.setBackdrop(localStorage.wmpotifyBackdrop || 'mica');
    }

    if (localStorage.wmpotifyTintColor) {
        const [hue, sat, tintPb] = localStorage.wmpotifyTintColor.split(',');
        setTintColor(hue, sat, tintPb);
    }

    ControlManager.init();
    PageManager.init();
    SidebarManager.init();

    Config.init();
    new Spicetify.Menu.Item(Strings['MENU_CONF'], false, Config.open).register();

    setupTopbar();
    setupPlayerbar();

    initQueuePanel();
    new MutationObserver(initQueuePanel).observe(
        // Right panel has varying structure in different versions
        document.querySelector('.XOawmCGZcQx4cesyNfVO') || // Seems same on .52-.56 but may change in future
        document.querySelector('.Root__right-sidebar > div > div[class]:first-child') ||
        document.querySelector('.Root__right-sidebar div[class]') // Works on .45-.52
    , { childList: true });

    if (!localStorage.wmpotifyLastVer || compareVersions(localStorage.wmpotifyLastVer, ver) < 0) {
        openUpdateDialog(true, ver);
    }
    localStorage.wmpotifyLastVer = ver;
    if (!localStorage.wmpotifyNoUpdateCheck) {
        checkUpdates();
    }
}

function isReady() {
    if (window.Spicetify?.Platform?.PlayerAPI &&
        window.Spicetify.AppTitle &&
        window.Spicetify.Menu &&
        window.Spicetify.Platform.History?.listen &&
        window.Spicetify.Platform.LocalStorageAPI &&
        window.Spicetify.Platform.Translations &&
        window.Spicetify.Platform.PlatformData
    ) {
        if (elementsRequired.every(selector => document.querySelector(selector))) {
            return true;
        } else {
            return false;
        }
    } else {
        return null;
    }
}

if (document.readyState === 'complete') {
    waitForReady();
}

window.addEventListener('load', () => {
    waitForReady();
});

function waitForReady() {
    let cnt = 0;
    const interval = setInterval(async () => {
        const ready = isReady();
        if (ready) {
            clearInterval(interval);
            try {
                await init();
                console.log('WMPotify: Theme loaded');
                document.documentElement.dataset.wmpotifyInitComplete = true;
            } catch (e) {
                (window.Spicetify?.showNotification || window.alert)('[WMPotify] ' + Strings['MAIN_MSG_ERROR_INIT']);
                console.error('WMPotify: Error during init:', e);
                document.documentElement.dataset.wmpotifyJsFail = true;
            }
        } else if (cnt++ > 80) {
            if (compareSpotifyVersion('1.2.45') < 0) {
                (window.Spicetify?.showNotification || window.alert)('[WMPotify] ' + Strings['MAIN_MSG_ERROR_OLD_SPOTIFY']);
            } else {
                const locId = compareSpotifyVersion('1.2.45') === 0 ? 'MAIN_MSG_ERROR_LOAD_FAIL_GLOBALNAV' : 'MAIN_MSG_ERROR_LOAD_FAIL';
                if (window.confirm('[WMPotify] ' + Strings[locId])) {
                    window.location.reload();
                }
            }
            if (ready === false) {
                console.error('WMPotify: Missing elements:', elementsRequired.filter(selector => !document.querySelector(selector)));
                if (!document.querySelector('.Root__globalNav')) {
                    // Show headers and sidebar when global nav is missing
                    // To allow users to access experimental features, marketplace, etc.
                    document.documentElement.dataset.wmpotifyNoGlobalNav = true;
                    delete document.body.dataset.hideLibx;
                    console.error('WMPotify: Global nav not found');
                }
            } else {
                console.error('WMPotify: Missing API objects:', Object.entries({
                    'Spicetify.Platform.PlayerAPI': window.Spicetify?.Platform?.PlayerAPI,
                    'Spicetify.AppTitle': window.Spicetify.AppTitle,
                    'Spicetify.Menu': window.Spicetify.Menu,
                    'Spicetify.Platform.History.listen': window.Spicetify.Platform.History?.listen,
                    'Spicetify.Platform.LocalStorageAPI': window.Spicetify.Platform.LocalStorageAPI,
                    'Spicetify.Platform.Translations': window.Spicetify.Platform.Translations,
                    'Spicetify.Platform.PlatformData': window.Spicetify.Platform.PlatformData,
                }).filter(([_, obj]) => !obj));
            }
            clearInterval(interval);
        }
    }, 100);
}

document.addEventListener('scroll', function () {
    document.documentElement.scrollTo(0, 0);
});
