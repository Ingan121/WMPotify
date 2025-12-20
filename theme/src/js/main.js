'use strict';

import Strings from './strings'
import CustomTitlebar from './ui/titlebar';
import Topbar from './ui/topbar';
import PlayerBar from './ui/playerbar';
import Config from './pages/config';
import SidebarManager from './managers/SidebarManager';
import { initQueuePanel } from './pages/queue';
import WindhawkComm from './WindhawkComm';
import PageManager from './managers/PageManager';
import WindowManager from './managers/WindowManager';
import {
    ver,
    checkUpdates,
    compareSpotifyVersion,
    MadVersion
} from './utils/UpdateCheck';
import {
    openUpdateDialog,
    openWmpvisInstallDialog,
    errorDialog,
    diagDialog,
    promptModal,
    confirmModal
} from './ui/dialogs';
import ThemeManager from './managers/ThemeManager';
import { ylxKeyPrefix } from "./pages/libx";
import { applyScheme } from './utils/appearance';
import { setTintColor } from './ui/tinting';
import { MadMenu, createMadMenu } from './utils/MadMenu';
import CustomLibX from './pages/libx';

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
    '.player-controls__buttons button[data-testid="control-button-playpause"]',
    '.player-controls__right',
    '.playback-bar [class*=encore-text]',
    '.volume-bar',
    '.volume-bar__icon-button',
    '.volume-bar .progress-bar',
    '.main-nowPlayingBar-left',
];

const loadStartTime = performance.now();

let style = 'xp';
let titleStyle = 'spotify';

function earlyInit() {
    if (!localStorage.wmpotifyShowLibX) {
        document.body.dataset.hideLibx = true;
    }

    WindhawkComm.init();

    const whStatus = WindhawkComm.query();
    const whInitialOpts = WindhawkComm.getModule()?.initialOptions || {};

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
        if (window.outerHeight - window.innerHeight > 0 || whInitialOpts.showframe || navigator.userAgent.includes('Linux')) {
            titleStyle = 'native';
        } else if (window.SpotEx || whStatus) {
            titleStyle = 'custom';
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

    // Set default style if the style is set to auto (not set)
    // If the Windhawk mod is available, and the title style is native:
    //   Use Aero style if transparency is enabled and DWM is enabled
    //   Use Basic style if transparency is disabled and DWM is disabled, or if using high contrast mode
    // XP otherwise (No WH, macOS/Linux, Windows Classic theme (non-HighContrast), title style is not native, etc.)
    const hcQuery = window.matchMedia('(forced-colors: active)');
    if (!localStorage.wmpotifyStyle && titleStyle === 'native') {
        if (hcQuery.matches) {
            style = 'basic';
        } else if (whStatus && whStatus.isThemingEnabled) {
            if (whInitialOpts.transparentrendering && whStatus.isDwmEnabled) {
                style = 'aero';
            } else if (!whStatus.isDwmEnabled) {
                style = 'basic';
            }
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
            if (whInitialOpts.showframe === false) {
                WindhawkComm.setTransparent(true);
            }
            break;
        case 'aero':
            WindhawkComm.extendFrame(0, 0, whInitialOpts.showframe === false ? 24 : 0, 60);
            break;
        case 'basic':
            WindhawkComm.extendFrame(0, 0, 0, 0);
            if (whInitialOpts.showframe === false) {
                WindhawkComm.setTransparent(true);
            }

            if (localStorage.wmpotifyBasicTextColor) {
                document.body.style.setProperty('--basic-pb-text', localStorage.wmpotifyBasicTextColor);
            }
            if (localStorage.wmpotifyBasicActiveColor) {
                document.body.style.setProperty('--basic-pb-active-bg', localStorage.wmpotifyBasicActiveColor);
            }
            if (localStorage.wmpotifyBasicInactiveColor) {
                document.body.style.setProperty('--basic-pb-inactive-bg', localStorage.wmpotifyBasicInactiveColor);
            }

            if (document.hasFocus()) {
                document.body.style.backgroundColor = 'var(--basic-pb-active-bg, #b9d1ea)';
            } else {
                document.body.style.backgroundColor = 'var(--basic-pb-inactive-bg, #d7e4f2)';
            }
            window.addEventListener('focus', () => {
                document.body.style.backgroundColor = 'var(--basic-pb-active-bg, #b9d1ea)';
            });
            window.addEventListener('blur', () => {
                document.body.style.backgroundColor = 'var(--basic-pb-inactive-bg, #d7e4f2)';
            });
            break;
    }
    document.documentElement.dataset.wmpotifyStyle = style;

    document.documentElement.dataset.wmpotifyControlStyle = localStorage.wmpotifyControlStyle || 'aero';
    if (localStorage.wmpotifyCustomScheme) {
        applyScheme(localStorage.wmpotifyCustomScheme);
    }

    window.addEventListener('resize', () => {
        if (style === 'aero') {
            if (window.innerHeight < 62) {
                WindhawkComm.extendFrame(-1, -1, -1, -1);
            } else {
                WindhawkComm.extendFrame(0, 0, whInitialOpts.showframe === false ? 24 : 0, 60);
            }
        } else if (whInitialOpts.showframe === false) {
            // Only doing once is somehow unreliable on Win11
            WindhawkComm.setTransparent(true);
        }
        WindhawkComm.setMinSize(358, titleStyle === 'native' ? 60 : 90);
    });

    if (localStorage.wmpotifyExternalFont) {
        Config.applyExternalFont(localStorage.wmpotifyExternalFont);
    }
    if (localStorage.wmpotifyFont) {
        document.documentElement.style.setProperty('--ui-font', localStorage.wmpotifyFont);
    }

    if (localStorage.wmpotifyHidePbLeftBtn) {
        document.body.dataset.hidePbLeftBtn = true;
    }
    if (localStorage.wmpotifyRightAlignPbLeftBtn) {
        document.body.dataset.rightAlignPbLeftBtn = true;
    }

    if (whStatus && localStorage.wmpotifyLockTitle) {
        WindhawkComm.lockTitle(true);
    }

    let darkMode = 'follow_scheme';
    if (['follow_scheme', 'system', 'always', 'never'].includes(localStorage.wmpotifyDarkMode)) {
        darkMode = localStorage.wmpotifyDarkMode;
    } else if (whInitialOpts.noforceddarkmode) {
        darkMode = 'system';
    }
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkMode === 'always' ||
        (darkMode === 'follow_scheme' && Spicetify.Config.color_scheme === 'dark') ||
        (darkMode === 'system' && darkQuery.matches)
    ) {
        document.documentElement.dataset.wmpotifyDarkMode = true;
    }
    if (darkMode === 'system') {
        ThemeManager.addSystemDarkModeListener();
    } else if (darkMode === 'follow_scheme') {
        ThemeManager.addMarketplaceSchemeObserver();
    }
    
    logTimed('WMPotify: earlyInit end');
}

earlyInit();

globalThis.WMPotify = {
    ver,
    Strings,
    Config,
    WindowManager,
    ThemeManager,
    PageManager,
    WindhawkComm,
    CustomLibX,
    Dialog: {
        openUpdateDialog,
        openWmpvisInstallDialog,
        errorDialog,
        diagDialog,
        promptModal,
        confirmModal,
    },
    MadMenu: {
        createMadMenu,
        MadMenu,
    },
    MadVersion,
    setTintColor,
    checkUpdates
};

async function init() {
    await CustomTitlebar.init(titleStyle);

    if (WindhawkComm.available() && localStorage.wmpotifyLockTitle) {
        WindhawkComm.setTitle(await Spicetify.AppTitle.get());
    }

    if (!localStorage.wmpotifyShowLibX) {
        Spicetify.Platform.LocalStorageAPI.setItem(`${ylxKeyPrefix}-sidebar-state`, 1);
    }

    const isWin11 = Spicetify.Platform.PlatformData.os_version?.split('.')[2] >= 22000;
    if (isWin11 && (WindhawkComm.getModule()?.initialOptions?.showframe !== false || style === 'aero')) {
        try {
            WindhawkComm.setBackdrop(localStorage.wmpotifyBackdrop || 'mica');
        } catch (e) {
            // 'none' was introduced in mod version 1.6 and throws on older versions
            console.error(e);
        }
    } 

    PageManager.init();
    new SidebarManager();

    Config.init();

    globalThis.WMPotify.topbar = new Topbar();
    globalThis.WMPotify.playerBar = new PlayerBar();

    initQueuePanel();
    new MutationObserver(initQueuePanel).observe(
        // Right panel has varying structure in different versions
        document.querySelector('.oXO9_yYs6JyOwkBn8E4a') || // .72+
        document.querySelector('.XOawmCGZcQx4cesyNfVO') || // .45-.71
        document.querySelector('.Root__right-sidebar > div > div[class]:first-child') ||
        document.querySelector('.Root__right-sidebar div[class]') // Works on .45-.52
    , { childList: true });

    if (!localStorage.wmpotifyLastVer || ver.compare(localStorage.wmpotifyLastVer) < 0) {
        openUpdateDialog(true, ver.toString(0));
    }
    localStorage.wmpotifyLastVer = ver.toString(0);
    if (!localStorage.wmpotifyNoUpdateCheck) {
        checkUpdates();
    }
}

async function doInit() {
    try {
        await init();
        logTimed('WMPotify: Theme loaded');
        document.documentElement.dataset.wmpotifyInitComplete = true;
    } catch (e) {
        console.error('WMPotify: Error during init:', e);
        errorDialog(Strings.getString('ERRDLG_DETAIL_EXCEPTION', e.stack));
        document.documentElement.dataset.wmpotifyJsFail = true;
    }
}

function isReady() {
    if (Spicetify.Platform?.PlayerAPI &&
        Spicetify.AppTitle &&
        Spicetify.Menu &&
        Spicetify.Platform.History?.listen &&
        Spicetify.Platform.LocalStorageAPI &&
        Spicetify.Platform.Translations &&
        Spicetify.Platform.PlatformData &&
        Spicetify.Player.origin?._state?.repeat != undefined // Spicetify.Player.getRepeat()
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
    if (isReady()) {
        doInit();
    } else {
        Spicetify.Events.platformLoaded.on(() => {
            if (isReady()) {
                doInit();
            } else {
                const interval = setInterval(() => {
                    const ready = isReady();
                    if (ready) {
                        clearInterval(interval);
                        doInit();
                    } else if (cnt++ > 80) {
                        if (compareSpotifyVersion('1.2.45') < 0) {
                            (Spicetify.showNotification || window.alert)('[WMPotify] ' + Strings['MAIN_MSG_ERROR_OLD_SPOTIFY']);
                        } else {
                            if (compareSpotifyVersion('1.2.45') === 0 && !document.querySelector('.Root__globalNav')) {
                                if (window.confirm('[WMPotify] ' + Strings['MAIN_MSG_ERROR_LOAD_FAIL_GLOBALNAV'])) {
                                    window.location.reload();
                                }
                            } else {
                                errorDialog(Strings[ready === false ? 'ERRDLG_DETAIL_MISSING_ELEMENTS' : 'ERRDLG_DETAIL_MISSING_API'], elementsRequired.filter(selector => !document.querySelector(selector)));
                            }
                        }
                        if (!document.querySelector('.Root__globalNav')) {
                            // Show headers and sidebar when global nav is missing
                            // To allow users to access experimental features, marketplace, etc.
                            document.documentElement.dataset.wmpotifyNoGlobalNav = true;
                            delete document.body.dataset.hideLibx;
                            console.error('WMPotify: Global nav not found');
                        }
                        clearInterval(interval);
                    }
                }, 100);
            }
        });
    }
}

document.addEventListener('scroll', function () {
    document.documentElement.scrollTo(0, 0);
});

function logTimed(str) {
    const time = performance.now() - loadStartTime;
    console.log(`[${time.toFixed(6)}ms] ${str}`);
}