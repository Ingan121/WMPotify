'use strict';

import Strings from "../strings";
import { promptModal } from "../ui/dialogs";
import FontDetective from "../utils/FontDetective";
import { setTintColor } from "../ui/tinting";
import WindhawkComm from "../WindhawkComm";
import WindowManager from "../managers/WindowManager";
import { checkUpdates } from "../utils/UpdateCheck";

const configWindow = document.createElement('div');
let tabs = null;
let currentTab = 0;
let speedApplyTimer = null;

let activeBasicColor = null;
let inactiveBasicColor = null;
let textBasicColor = null;

const elements = {}

function init() {
    if (document.getElementById('wmpotify-config')) {
        return;
    }

    const whStatus = WindhawkComm.query();
    const mainView = document.querySelector('.Root__main-view');

    configWindow.id = 'wmpotify-config';
    configWindow.innerHTML = `
        <div id="wmpotify-config-topborder" class="wmpotify-tintable"></div>
        <button id="wmpotify-config-prev"></button>
        <button id="wmpotify-config-next"></button>
        <p id="wmpotify-config-title">${Strings['CONF_COLOR_TITLE']}</p>
        <button id="wmpotify-config-close"></button>
        <section class="wmpotify-config-tab-content" data-tab-title="${Strings['CONF_COLOR_TITLE']}" style="display: block;">
            <section class="field-row">
                <a href="#" id="wmpotify-config-color-reset">${Strings['UI_RESET']}</a>
                <input type="checkbox" id="wmpotify-config-tint-playerbar" class="wmpotify-aero">
                <label for="wmpotify-config-tint-playerbar">${Strings['CONF_COLOR_TINTPB']}</label>
            </section>
            <label>${Strings['CONF_COLOR_HUE']}</label><br>
            <input type="range" id="wmpotify-config-hue" class="wmpotify-aero no-track" min="0" max="360" step="1" value="180"><br>
            <label>${Strings['CONF_COLOR_SAT']}</label><br>
            <input type="range" id="wmpotify-config-sat" class="wmpotify-aero no-track" min="0" max="354" step="1" value="121"><br>
        </section>
        <section class="wmpotify-config-tab-content" data-tab-title="${Strings['CONF_GENERAL_TITLE']}">
            <label for="wmpotify-config-style">${Strings['CONF_GENERAL_STYLE']}</label>
            <select id="wmpotify-config-style" class="wmpotify-aero">
                <option value="auto">${Strings['UI_AUTO']}</option>
                <option value="xp">XP</option>
                <option value="aero">Aero</option>
                <option value="basic">Basic</option>
                <option value="basic_custom">Basic (${Strings['UI_CUSTOM']})</option>
            </select>
            <label for="wmpotify-config-title-style">${Strings['CONF_GENERAL_TITLE_STYLE']}</label>
            <select id="wmpotify-config-title-style" class="wmpotify-aero">
                <option value="auto">${Strings['UI_AUTO']}</option>
                <option value="native">${Strings['CONF_GENERAL_TITLE_STYLE_NATIVE']}</option>
                <option value="custom">${Strings['CONF_GENERAL_TITLE_STYLE_CUSTOM']}</option>
                <option value="spotify">Spotify</option>
                <option value="keepmenu">${Strings['CONF_GENERAL_TITLE_STYLE_KEEPMENU']}</option>
            </select>
            <button id="wmpotify-config-apply" class="wmpotify-aero">${Strings['CONF_GENERAL_APPLY']}</button><br>
            <label for="wmpotify-config-font">${Strings['CONF_GENERAL_FONT']}</label>
            <select id="wmpotify-config-font" class="wmpotify-aero">
                <option value="custom">${Strings['UI_CUSTOM']}</option>
            </select>
            <input type="checkbox" id="wmpotify-config-hide-pbleftbtn" class="wmpotify-aero">
            <label for="wmpotify-config-hide-pbleftbtn">${Strings['CONF_GENERAL_HIDE_PBLEFTBTN']}</label><br>
            <label for="wmpotify-config-topmost">${Strings['CONF_GENERAL_TOPMOST']}</label>
            <select id="wmpotify-config-topmost" class="wmpotify-aero" disabled>
                <option value="always">${Strings['CONF_GENERAL_TOPMOST_ALWAYS']}</option>
                <option value="minimode">${Strings['CONF_GENERAL_TOPMOST_MINIMODE']}</option>
                <option value="never" selected>${Strings['CONF_GENERAL_TOPMOST_NEVER']}</option>
            </select>
            <label for="wmpotify-config-backdrop">${Strings['CONF_GENERAL_BACKDROP']}</label>
            <select id="wmpotify-config-backdrop" class="wmpotify-aero" disabled>
                <option value="none" selected>${Strings['CONF_GENERAL_BACKDROP_NONE']}</option>
                <option value="mica">Mica</option>
                <option value="acrylic">${Strings['CONF_GENERAL_BACKDROP_ACRYLIC']}</option>
                <option value="tabbed">${Strings['CONF_GENERAL_BACKDROP_TABBED']}</option>
            </select><br>
            <input type="checkbox" id="wmpotify-config-show-libx" class="wmpotify-aero">
            <label for="wmpotify-config-show-libx">${Strings['CONF_GENERAL_SHOW_LIBX']}</label>
            <input type="checkbox" id="wmpotify-config-lock-title" class="wmpotify-aero" disabled>
            <label for="wmpotify-config-lock-title">${Strings['CONF_GENERAL_LOCK_TITLE']}</label><br>
            <span id="wmpotify-config-wh-message">${Strings['CONF_GENERAL_WH_MESSAGE']}</span>
        </section>
        ${whStatus?.speedModSupported ? `
        <section class="wmpotify-config-tab-content" data-tab-title="${Strings['CONF_SPEED_TITLE']}" data-wh-speedmod-required="true">
            <a href="#" id="wmpotify-config-speed-slow">${Strings['CONF_SPEED_SLOW']}</a>
            <a href="#" id="wmpotify-config-speed-normal">${Strings['CONF_SPEED_NORMAL']}</a>
            <a href="#" id="wmpotify-config-speed-fast">${Strings['CONF_SPEED_FAST']}</a><br>
            <input type="range" id="wmpotify-config-speed" class="wmpotify-aero" min="0.5" max="2.0" step="0.1" value="1"><br>
            ${Strings['CONF_SPEED_CURRENT_LABEL']}: <span id="wmpotify-config-speed-value">1.0</span>
        </section>
        ` : ''}
        <section class="wmpotify-config-tab-content" data-tab-title="${Strings['CONF_ABOUT_TITLE']}">
            <div id="wmpotify-about-logo"></div>
            <p id="wmpotify-about-title">WMPotify</p>
            <button id="wmpotify-about-github" onclick="window.open('https://github.com/Ingan121/WMPotify', '_blank')">
                ${/* https://commons.wikimedia.org/wiki/File:GitHub_Invertocat_Logo.svg, CC BY 4.0 */ ''}
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                    width="240.000000pt" height="240.000000pt" viewBox="0 0 240.000000 240.000000"
                    preserveAspectRatio="xMidYMid meet">

                    <g transform="translate(0.000000,240.000000) scale(0.100000,-0.100000)"
                    fill="white" stroke="none">
                    <path d="M970 2301 c-305 -68 -555 -237 -727 -493 -301 -451 -241 -1056 143
                    -1442 115 -116 290 -228 422 -271 49 -16 55 -16 77 -1 24 16 25 20 25 135 l0
                    118 -88 -5 c-103 -5 -183 13 -231 54 -17 14 -50 62 -73 106 -38 74 -66 108
                    -144 177 -26 23 -27 24 -9 37 43 32 130 1 185 -65 96 -117 133 -148 188 -160
                    49 -10 94 -6 162 14 9 3 21 24 27 48 6 23 22 58 35 77 l24 35 -81 16 c-170 35
                    -275 96 -344 200 -64 96 -85 179 -86 334 0 146 16 206 79 288 28 36 31 47 23
                    68 -15 36 -11 188 5 234 13 34 20 40 47 43 45 5 129 -24 214 -72 l73 -42 64
                    15 c91 21 364 20 446 0 l62 -16 58 35 c77 46 175 82 224 82 39 0 39 -1 55 -52
                    17 -59 20 -166 5 -217 -8 -30 -6 -39 16 -68 109 -144 121 -383 29 -579 -62
                    -129 -193 -219 -369 -252 l-84 -16 31 -55 32 -56 3 -223 4 -223 25 -16 c23
                    -15 28 -15 76 2 80 27 217 101 292 158 446 334 590 933 343 1431 -145 293
                    -419 518 -733 602 -137 36 -395 44 -525 15z"/>
                    </g>
                </svg>
            </button>
            <p>${Strings['CONF_ABOUT_DESC']}</p>
            <p>${Strings['CONF_ABOUT_VERSION']}: 1.0 Beta 2<span id="wmpotify-about-ctewh-ver"></span></p>
            <p>${Strings['CONF_ABOUT_AUTHOR']} - <a href="https://www.ingan121.com/" target="_blank">www.ingan121.com</a></p>
            <input type="checkbox" id="wmpotify-config-auto-updates" class="wmpotify-aero" checked>
            <label for="wmpotify-config-auto-updates">${Strings['CONF_ABOUT_AUTO_UPDATES']}</label>
        </section>
    `;

    tabs = configWindow.querySelectorAll('.wmpotify-config-tab-content');
    elements.topborder = configWindow.querySelector('#wmpotify-config-topborder');
    elements.title = configWindow.querySelector('#wmpotify-config-title');
    elements.hue = configWindow.querySelector('#wmpotify-config-hue');
    elements.sat = configWindow.querySelector('#wmpotify-config-sat');
    elements.tintPb = configWindow.querySelector('#wmpotify-config-tint-playerbar');
    elements.style = configWindow.querySelector('#wmpotify-config-style');
    elements.titleStyle = configWindow.querySelector('#wmpotify-config-title-style');
    elements.fontSelector = configWindow.querySelector('#wmpotify-config-font');
    elements.fontCustom = configWindow.querySelector('#wmpotify-config-font option');
    elements.hidePbLeftBtn = configWindow.querySelector('#wmpotify-config-hide-pbleftbtn');
    elements.topmost = configWindow.querySelector('#wmpotify-config-topmost');
    elements.backdrop = configWindow.querySelector('#wmpotify-config-backdrop');
    elements.showLibX = configWindow.querySelector('#wmpotify-config-show-libx');
    elements.lockTitle = configWindow.querySelector('#wmpotify-config-lock-title');
    elements.whMessage = configWindow.querySelector('#wmpotify-config-wh-message');
    elements.whVer = configWindow.querySelector('#wmpotify-about-ctewh-ver');
    elements.autoUpdates = configWindow.querySelector('#wmpotify-config-auto-updates');

    configWindow.style.height = localStorage.wmpotifyConfigHeight || '';

    elements.style.addEventListener('change', async () => {
        if (elements.style.value === 'basic_custom') {
            const activeColor = await promptModal(Strings['CONF_GENERAL_BASIC_CUSTOM_DLG_TITLE'], Strings['CONF_GENERAL_BASIC_CUSTOM_ACTIVE_MSG'], '', Strings['CONF_GENERAL_BASIC_CUSTOM_PLACEHOLDER']);
            if (!activeColor) {
                elements.style.value = localStorage.wmpotifyStyle || 'auto';
                return;
            }
            const inactiveColor = await promptModal(Strings['CONF_GENERAL_BASIC_CUSTOM_DLG_TITLE'], Strings['CONF_GENERAL_BASIC_CUSTOM_INACTIVE_MSG'], '', Strings['CONF_GENERAL_BASIC_CUSTOM_PLACEHOLDER']);
            if (!inactiveColor) {
                elements.style.value = localStorage.wmpotifyStyle || 'auto';
                return;
            }
            const textColor = await promptModal(Strings['CONF_GENERAL_BASIC_CUSTOM_DLG_TITLE'], Strings['CONF_GENERAL_BASIC_CUSTOM_TEXT_MSG'], '', Strings['CONF_GENERAL_BASIC_CUSTOM_PLACEHOLDER']);
            if (!textColor) {
                elements.style.value = localStorage.wmpotifyStyle || 'auto';
                return;
            }
            activeBasicColor = activeColor;
            inactiveBasicColor = inactiveColor;
            textBasicColor = textColor;
        }
    });
    elements.fontSelector.addEventListener('change', async () => {
        if (elements.fontSelector.value === 'custom') {
            const fontName = await promptModal(Strings['CONF_GENERAL_CUSTOM_FONT_DLG_TITLE'], Strings['CONF_GENERAL_CUSTOM_FONT_MSG'], '', localStorage.wmpotifyFont || 'Segoe UI');
            if (!fontName) {
                elements.fontSelector.value = localStorage.wmpotifyFont || 'Segoe UI';
                return;
            }
            elements.fontCustom.textContent = fontName;
            localStorage.wmpotifyFont = fontName;
        } else {
            elements.fontCustom.textContent = Strings['UI_CUSTOM'];
            localStorage.wmpotifyFont = elements.fontSelector.value;
        }
        document.documentElement.style.setProperty('--ui-font', localStorage.wmpotifyFont);
    });
    elements.hidePbLeftBtn.addEventListener('change', () => {
        if (elements.hidePbLeftBtn.checked) {
            localStorage.wmpotifyHidePbLeftBtn = true;
            document.body.dataset.hidePbLeftBtn = true;
        } else {
            delete localStorage.wmpotifyHidePbLeftBtn;
            delete document.body.dataset.hidePbLeftBtn;
        }
    });
    elements.showLibX.addEventListener('change', () => {
        if (elements.showLibX.checked) {
            localStorage.wmpotifyShowLibX = true;
            delete document.body.dataset.hideLibx;
        } else {
            delete localStorage.wmpotifyShowLibX;
            document.body.dataset.hideLibx = true;
            Spicetify.Platform.LocalStorageAPI.setItem("ylx-sidebar-state", 1);
        }
    });
    configWindow.querySelector('#wmpotify-config-close').addEventListener('click', close);
    configWindow.querySelector('#wmpotify-config-apply').addEventListener('click', apply);
    elements.autoUpdates.addEventListener('change', () => {
        if (elements.autoUpdates.checked) {
            delete localStorage.wmpotifyNoUpdateCheck;
            checkUpdates();
        } else {
            localStorage.wmpotifyNoUpdateCheck = true;
        }
    });

    const isWin11 = Spicetify.Platform.PlatformData.os_version.split('.')[2] >= 22000;
    if (whStatus) {
        elements.topmost.disabled = false;
        elements.topmost.value = localStorage.wmpotifyTopMost || 'never';
        elements.topmost.addEventListener('change', () => {
            localStorage.wmpotifyTopMost = elements.topmost.value;
            if (elements.topmost.value === 'always' || 
                (elements.topmost.value === 'minimode' && WindowManager.isMiniMode())) {
                WindhawkComm.setTopMost(true);
            } else {
                WindhawkComm.setTopMost(false);
            }
        });

        elements.lockTitle.disabled = false;
        elements.lockTitle.checked = localStorage.wmpotifyLockTitle;
        elements.lockTitle.addEventListener('change', async () => {
            WindhawkComm.lockTitle(elements.lockTitle.checked);
            if (elements.lockTitle.checked) {
                WindhawkComm.setTitle(await Spicetify.AppTitle.get());
                localStorage.wmpotifyLockTitle = true;
            } else {
                delete localStorage.wmpotifyLockTitle;
                const trackInfo = Spicetify.Player.data?.item.metadata;
                if (trackInfo && Spicetify.Player.isPlaying()) {
                    WindhawkComm.setTitle(trackInfo.artist_name + ' - ' + trackInfo.title);
                }
            }
        });

        if (isWin11) {
            elements.backdrop.disabled = false;
            elements.backdrop.value = localStorage.wmpotifyBackdrop || 'mica';
            elements.backdrop.addEventListener('change', () => {
                localStorage.wmpotifyBackdrop = elements.backdrop.value;
                WindhawkComm.setBackdrop(elements.backdrop.value);
            });
        }

        elements.whMessage.style.display = 'none';
        elements.whVer.textContent = ', ' + Strings.getString('CONF_ABOUT_CTEWH_VERSION', WindhawkComm.getModule().version);

        if (whStatus.speedModSupported) {
            elements.speed = configWindow.querySelector('#wmpotify-config-speed');
            elements.speedValue = configWindow.querySelector('#wmpotify-config-speed-value');
            elements.speed.addEventListener('pointerup', onSpeedChange);
            configWindow.querySelector('#wmpotify-config-speed-slow').addEventListener('click', setSpeed.bind(null, 0.5));
            configWindow.querySelector('#wmpotify-config-speed-normal').addEventListener('click', setSpeed.bind(null, 1));
            configWindow.querySelector('#wmpotify-config-speed-fast').addEventListener('click', setSpeed.bind(null, 1.4));
            const playbackSpeed = whStatus.playbackSpeed || 1;
            elements.speedValue.textContent = Number.isInteger(playbackSpeed) ? playbackSpeed + '.0' : playbackSpeed;
            elements.speedValue.addEventListener('click', async () => {
                const speed = await promptModal(Strings['CONF_SPEED_CUSTOM_DLG_TITLE'], Strings['CONF_SPEED_CUSTOM_MSG'], playbackSpeed.toString(), '1.0');
                if (speed) {
                    setSpeed(speed);
                }
            });
        }
    }
    if (!isWin11) {
        elements.backdrop.style.display = 'none';
        elements.backdrop.previousElementSibling.style.display = 'none';
    }
    if (!navigator.userAgent.includes('Windows')) {
        elements.topmost.style.display = 'none';
        elements.topmost.previousElementSibling.style.display = 'none';
        elements.lockTitle.style.display = 'none';
        elements.lockTitle.nextElementSibling.style.display = 'none';
        elements.whMessage.style.display = 'none';
    }

    elements.hue.addEventListener('input', onColorChange);
    elements.sat.addEventListener('input', onColorChange);
    elements.tintPb.addEventListener('change', onColorChange);
    configWindow.querySelector('#wmpotify-config-color-reset').addEventListener('click', resetColor);

    configWindow.querySelector('#wmpotify-config-prev').addEventListener('click', prevTab);
    configWindow.querySelector('#wmpotify-config-next').addEventListener('click', nextTab);

    FontDetective.each(font => {
        const option = document.createElement("option");
        option.textContent = font.name;
        option.value = font.name;
        if (font.name === (localStorage.wmpotifyFont || 'Segoe UI')) {
            option.selected = true;
        }
        if (font.name === 'Segoe UI') {
            elements.fontSelector.insertBefore(option, elements.fontSelector.firstChild);
        } else {
            elements.fontSelector.insertBefore(option, elements.fontCustom);
        }
    });

    if (localStorage.wmpotifyStyle) {
        if (localStorage.wmpotifyStyle === 'basic' && localStorage.wmpotifyBasicActiveColor && localStorage.wmpotifyBasicInactiveColor && localStorage.wmpotifyBasicTextColor) {
            activeBasicColor = localStorage.wmpotifyBasicActiveColor;
            inactiveBasicColor = localStorage.wmpotifyBasicInactiveColor;
            textBasicColor = localStorage.wmpotifyBasicTextColor;
            elements.style.value = 'basic_custom';
        } else {
            elements.style.value = localStorage.wmpotifyStyle;
        }
    }
    if (!navigator.userAgent.includes('Windows')) {
        elements.titleStyle.querySelector('option[value=keepmenu]').remove();
    }
    if (navigator.userAgent.includes('Linux')) {
        elements.titleStyle.querySelector('option[value=spotify]').remove();
    }
    if (localStorage.wmpotifyTitleStyle) {
        elements.titleStyle.value = localStorage.wmpotifyTitleStyle;
    }
    if (localStorage.wmpotifyHidePbLeftBtn) {
        elements.hidePbLeftBtn.checked = true;
    }
    if (localStorage.wmpotifyShowLibX) {
        configWindow.querySelector('#wmpotify-config-show-libx').checked = true;
    }
    if (localStorage.wmpotifyNoUpdateCheck) {
        elements.autoUpdates.checked = false;
    }

    let offset = 0, isDown = false;

    elements.topborder.addEventListener('pointerdown', function () {
        isDown = true;
        offset = configWindow.getBoundingClientRect().bottom;
        document.body.style.cursor = 'ns-resize';
    }, true);

    document.addEventListener('pointerup', function () {
        isDown = false;
        document.body.style.cursor = '';
        localStorage.wmpotifyConfigHeight = configWindow.style.height;
    }, true);

    document.addEventListener('pointermove', function (event) {
        if (isDown) {
            configWindow.style.height = offset - event.clientY + 'px';
        }
    }, true);

    mainView.appendChild(configWindow);
}

function open() {
    if (!tabs) {
        return;
    }
    if (document.body.dataset.wmpotifyLibPageOpen) {
        // Close standalone LibX and go to home / NowPlaying to show the config panel
        // As standalone LibX page hides the main area
        if (Spicetify.Config.custom_apps.includes('wmpvis')) {
            Spicetify.Platform.History.push({ pathname: '/wmpvis' });
        } else {
            Spicetify.Platform.History.push({ pathname: '/' });
        }
    } else if (configWindow.style.display === 'block') {
        close();
        return;
    }
    configWindow.style.display = 'block';
    if (localStorage.wmpotifyTintColor) {
        const [hue, sat, tintPb] = localStorage.wmpotifyTintColor.split(',');
        elements.hue.value = parseInt(hue) + 180;
        elements.sat.value = parseInt(sat) * 121 / 100;
        if (tintPb) {
            elements.tintPb.checked = true;
        }
    }
}

function close() {
    configWindow.style.display = 'none';
}

function openTab(index) {
    if (!tabs) {
        return;
    }
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        tab.style.display = i === index ? 'block' : 'none';
    }
    currentTab = index;
    elements.title.textContent = tabs[index].dataset.tabTitle;
}

function prevTab() {
    openTab((currentTab - 1 + tabs.length) % tabs.length);
}

function nextTab() {
    openTab((currentTab + 1) % tabs.length);
}

function onColorChange() {
    const hue = elements.hue.value - 180;
    const sat = elements.sat.value * 100 / 121;
    setTintColor(hue, sat, elements.tintPb.checked);
    localStorage.wmpotifyTintColor = hue + ',' + sat + ',' + (elements.tintPb.checked ? '1' : '');
}

function resetColor() {
    elements.hue.value = 180;
    elements.sat.value = 121;
    setTintColor();
    delete localStorage.wmpotifyTintColor;
}

function onSpeedChange() {
    elements.speedValue.textContent = Number.isInteger(parseFloat(elements.speed.value)) ? elements.speed.value + '.0' : elements.speed.value;
    if (speedApplyTimer) {
        clearTimeout(speedApplyTimer);
    }
    speedApplyTimer = setTimeout(() => {
        setSpeed(elements.speed.value);
        speedApplyTimer = null;
    }, 500);
}

function setSpeed(speed) {
    if (Spicetify.Platform.ConnectAPI.state.connectionStatus === 'connected') {
        Spicetify.showNotification(Strings['CONF_SPEED_NO_CONNECT_MSG']);
        return;
    }
    speed = parseFloat(speed);
    const prevSpeed = WindhawkComm.query().playbackSpeed || 1;
    if (speed === prevSpeed) {
        return;
    }
    elements.speed.value = speed;
    elements.speedValue.textContent = Number.isInteger(speed) ? speed + '.0' : speed;
    try {
        WindhawkComm.setPlaybackSpeed(speed);
    } catch (e) {
        Spicetify.showNotification(e.message);
    }
}

function apply() {
    const style = elements.style.value;
    const titleStyle = elements.titleStyle.value;
    if (style !== 'auto') {
        if (style !== 'basic_custom' || !activeBasicColor || !inactiveBasicColor || !textBasicColor) {
            delete localStorage.wmpotifyBasicActiveColor;
            delete localStorage.wmpotifyBasicInactiveColor;
            delete localStorage.wmpotifyBasicTextColor;
        } else {
            localStorage.wmpotifyBasicActiveColor = activeBasicColor;
            localStorage.wmpotifyBasicInactiveColor = inactiveBasicColor;
            localStorage.wmpotifyBasicTextColor = textBasicColor;
        }
        localStorage.wmpotifyStyle = style === 'basic_custom' ? 'basic' : style;
    } else {
        delete localStorage.wmpotifyStyle;
    }
    if (titleStyle !== 'auto') {
        localStorage.wmpotifyTitleStyle = titleStyle;
    } else {
        delete localStorage.wmpotifyTitleStyle;
    }
    location.reload();
}

const Config = {
    init,
    open,
    close,
    openTab,
    prevTab,
    nextTab,
    apply,
    isOpen: () => configWindow.style.display === 'block'
};

export default Config;