// appearance.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

import Strings from '../strings.js';

export async function importScheme() {
    const pickerOpts = {
        types: [{
            description: "All Supported Types",
            accept: {
                "application/x-windows-theme": [".theme", ".themepack"],
                "application/x-windows-registry": [".reg"],
                "application/json": [".json"],
                "text/css": [".css"]
            }
        }, {
            description: "Theme Files",
            accept: {
                "application/x-windows-theme": [".theme", ".themepack"]
            }
        }, {
            description: "Registry Files (HKCU\\CPL\\Colors or WCTC)",
            accept: {
                "application/x-windows-registry": [".reg"]
            }
        }, {
            description: "ModernActiveDesktop JSON Files",
            accept: {
                "application/json": [".json"]
            }
        }, {
            description: "CSS Files (Not recommended)",
            accept: {
                "text/css": [".css"]
            }
        }],
        excludeAcceptAllOption: false,
        multiple: false,
    };
    const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
    const file = await fileHandle.getFile();
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let encoding = 'utf-8';
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
        encoding = 'utf-16le';
    } else if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
        encoding = 'utf-16be';
    }

    const text = new TextDecoder(encoding).decode(arrayBuffer);

    if (text.match("--.*:.*;") || file.name.endsWith(".css")) {
        const cssScheme = text.replace('--button-face:', '--surface:').replace('--button-shadow:', '--button-shadow-color:').replace('--ui-font:', '--ui-font-default:').replace(/;\s*}/g, ' !important; }');
        applyScheme(cssScheme);
        localStorage.wmpotifyControlStyle = "custom";
        localStorage.wmpotifyCustomScheme = cssScheme;
    } else {
        try {
            const scheme = JSON.parse(text);
            const cssScheme = generateCssScheme(scheme);
            applyScheme(cssScheme);
            localStorage.wmpotifyControlStyle = "custom";
            localStorage.wmpotifyCustomScheme = cssScheme;
        } catch {
            // Match both REGEDIT4 and Windows Registry Editor Version 5.00
            const reg = !!text.split("\n")[0].match(/(?=.*REG)(?=.*EDIT)/i);
            const ctc = reg && text.includes("\\Control Panel\\Appearance\\ClassicSchemes\\");
            try {
                const scheme = {
                    'active-border': getColorValue(text, 'ActiveBorder', reg, ctc),
                    'active-title': getColorValue(text, 'ActiveTitle', reg, ctc),
                    'app-workspace': getColorValue(text, 'AppWorkspace', reg, ctc),
                    'background': getColorValue(text, 'Background', reg, ctc),
                    'button-alternate-face': getColorValue(text, 'ButtonAlternateFace', reg, ctc),
                    'button-dk-shadow': getColorValue(text, 'ButtonDkShadow', reg, ctc),
                    'button-face': getColorValue(text, 'ButtonFace', reg, ctc),
                    'button-hilight': getColorValue(text, 'ButtonHilight', reg, ctc),
                    'button-light': getColorValue(text, 'ButtonLight', reg, ctc),
                    'button-shadow': getColorValue(text, 'ButtonShadow', reg, ctc),
                    'button-text': getColorValue(text, 'ButtonText', reg, ctc),
                    'gradient-active-title': getColorValue(text, 'GradientActiveTitle', reg, ctc),
                    'gradient-inactive-title': getColorValue(text, 'GradientInactiveTitle', reg, ctc),
                    'gray-text': getColorValue(text, 'GrayText', reg, ctc),
                    'hilight': getColorValue(text, 'Hilight', reg, ctc),
                    'hilight-text': getColorValue(text, 'HilightText', reg, ctc),
                    'hot-tracking-color': getColorValue(text, 'HotTrackingColor', reg, ctc),
                    'inactive-border': getColorValue(text, 'InactiveBorder', reg, ctc),
                    'inactive-title': getColorValue(text, 'InactiveTitle', reg, ctc),
                    'inactive-title-text': getColorValue(text, 'InactiveTitleText', reg, ctc),
                    'info-text': getColorValue(text, 'InfoText', reg, ctc),
                    'info-window': getColorValue(text, 'InfoWindow', reg, ctc),
                    'menu': getColorValue(text, 'Menu', reg, ctc),
                    'menu-bar': getColorValue(text, 'MenuBar', reg, ctc),
                    'menu-hilight': getColorValue(text, 'MenuHilight', reg, ctc),
                    'menu-text': getColorValue(text, 'MenuText', reg, ctc),
                    'scrollbar': getColorValue(text, 'Scrollbar', reg, ctc),
                    'title-text': getColorValue(text, 'TitleText', reg, ctc),
                    'window': getColorValue(text, 'Window', reg, ctc),
                    'window-frame': getColorValue(text, 'WindowFrame', reg, ctc),
                    'window-text': getColorValue(text, 'WindowText', reg, ctc),
                };
                if (ctc) {
                    // Parse WinClassicThemeConfig-specific registry values
                    // Font values are not supported
                    const scrollbarSize = text.match(`\\n"Size1"=dword:0000(.*)\r\n`);
                    if (scrollbarSize) {
                        scheme['scrollbar-size'] = parseInt(scrollbarSize[1], 16) + "px";
                    } else {
                        scheme['scrollbar-size'] = '16px';
                    }
                    const menuHeight = text.match(`\\n"Size8"=dword:0000(.*)\r\n`);
                    if (menuHeight) {
                        scheme['menu-height'] = parseInt(menuHeight[1], 16) + "px";
                    } else {
                        scheme['menu-height'] = '18px';
                    }
                    const gradientsDisabled = text.match(`\\n"Gradients"=dword:00000000\r\n`);
                    if (gradientsDisabled) {
                        scheme['gradient-active-title'] = scheme['active-title'];
                        scheme['gradient-inactive-title'] = scheme['inactive-title'];
                    }
                    const flatMenusDisabled = text.match(`\\n"FlatMenus"=dword:00000000\r\n`);
                    if (!flatMenusDisabled) {
                        scheme['flat-menus'] = "mbcm";
                    } else {
                        scheme['flat-menus'] = "none";
                    }
                } else {
                    // WindowMetrics parsing is not supported; just use the default values
                    scheme['scrollbar-size'] = '16px';
                    scheme['menu-height'] = '18px';
                }

                const cssScheme = generateCssScheme(scheme);
                applyScheme(cssScheme);
                localStorage.wmpotifyControlStyle = "custom";
                localStorage.wmpotifyCustomScheme = cssScheme;
            } catch {
                Spicetify.showNotification(Strings["CONF_GENERAL_MSG_INVALID_SCHEME_FILE"]);
                throw new Error('Invalid scheme file');
            }
        }
    }
}

export async function applyScheme(cssText) {
    let style = document.getElementById('wmpotify-scheme');
    if (!style) {
        style = document.createElement('style');
        style.id = 'wmpotify-scheme';
        document.body.appendChild(style);
    }
    style.textContent = cssText;

    document.documentElement.dataset.wmpotifyControlStyle = "custom";
    if (cssText.includes("--flat-menus: mbcm")) {
        document.documentElement.dataset.wmpotifyFlatMenus = true;
    }
}

function generateCssScheme(scheme) {
    const shouldBeDeleted = [ // Keys not used in WMPotify
        'extra-border-bottom',
        'supports-win-shadow',
        'extra-title-height',
        'extra-border-size',
        'menu-animation',
        'menu-shadow',
        'supports-colorization',
        'default-colorization-color',
        'win-open-anim',
        'win-close-anim',
        'palette-title-height',
    ];
    const replaceKeys = { // MAD-WMPotify variable name differences
        'button-face': 'surface',
        'button-shadow': 'button-shadow-color',
        'ui-font': 'ui-font-default',
    };

    let cssScheme = `:root {\n`;
    for (const key in scheme) {
        if (shouldBeDeleted.includes(key)) {
            continue;
        }
        if (replaceKeys[key]) {
            cssScheme += `--${replaceKeys[key]}: ${scheme[key]} !important;\n`;
            continue;
        }
        cssScheme += `--${key}: ${scheme[key]} !important;\n`;
    }
    cssScheme += generateThemeSvgs(scheme);
    cssScheme += "}";
    return cssScheme;
}

function generateThemeSvgs(scheme) {
    const buttonFace = scheme['surface'] || scheme['button-face'];
    const buttonDkShadow = scheme['button-dk-shadow'];
    const buttonHilight = scheme['button-hilight'];
    const buttonLight = scheme['button-light'];
    const buttonShadow = scheme['button-shadow-color'] || scheme['button-shadow'];
    const buttonText = scheme['button-text'];
    const menuText = scheme['menu-text'];
    const hilightText = scheme['hilight-text'];

    const scrollUp = `
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 0H0V1V16H1V1H15V0Z" fill="${buttonLight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2 1H1V15H2V2H14V1H2Z" fill="${buttonHilight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16 17H15H0V16H15V0H16V17Z" fill="${buttonDkShadow}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 1H14V15H1V16H14H15V1Z" fill="${buttonShadow}"/>
            <rect x="2" y="2" width="12" height="13" fill="${buttonFace}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 6H7V7H6V8H5V9H4V10H11V9H10V8H9V7H8V6Z" fill="${buttonText}"/>
        </svg>`.replace(/  |\n/g, '');
    const scrollDown = `
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 0H0V1V16H1V1H15V0Z" fill="${buttonLight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2 1H1V15H2V2H14V1H2Z" fill="${buttonHilight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16 17H15H0V16H15V0H16V17Z" fill="${buttonDkShadow}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 1H14V15H1V16H14H15V1Z" fill="${buttonShadow}"/>
            <rect x="2" y="2" width="12" height="13" fill="${buttonFace}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9 6H4V7H5V8H6V9H7V10H8V9H9V8H10V7H11V6Z" fill="${buttonText}"/>
        </svg>`.replace(/  |\n/g, '');
    const scrollLeft = `
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 0H0V1V16H1V1H15V0Z" fill="${buttonLight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2 1H1V15H2V2H14V1H2Z" fill="${buttonHilight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16 17H15H0V16H15V0H16V17Z" fill="${buttonDkShadow}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 1H14V15H1V16H14H15V1Z" fill="${buttonShadow}"/>
            <rect x="2" y="2" width="12" height="13" fill="${buttonFace}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9 4H8V5H7V6H6V7H5V8H6V9H7V10H8V11H9V4Z" fill="${buttonText}"/>
        </svg>`.replace(/  |\n/g, '');
    const scrollRight = `
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 0H0V1V16H1V1H15V0Z" fill="${buttonLight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2 1H1V15H2V2H14V1H2Z" fill="${buttonHilight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16 17H15H0V16H15V0H16V17Z" fill="${buttonDkShadow}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 1H14V15H1V16H14H15V1Z" fill="${buttonShadow}"/>
            <rect x="2" y="2" width="12" height="13" fill="${buttonFace}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7 4H6V11H7V10H8V9H9V8H10V7H9V6H8V5H7V4Z" fill="${buttonText}"/>
        </svg>`.replace(/  |\n/g, '');
    const scrollTrack = `
        <svg width="2" height="2" viewBox="0 0 2 2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0H0V1H1V2H2V1H1V0Z" fill="${buttonFace}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2 0H1V1H0V2H1V1H2V0Z" fill="${buttonHilight}"/>
        </svg>`.replace(/  |\n/g, '');
    const dropdownButtonPressed = `
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H15H16V17H15H0V16V1V0ZM1 16H15V1H1V16Z" fill="${buttonShadow}"/>
            <rect x="1" y="1" width="14" height="15" fill="${buttonFace}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 7H5V8H6V9H7V10H8V11H9V10H10V9H11V8H12V7Z" fill="${buttonText}"/>
        </svg>`.replace(/  |\n/g, '');
    const checkmark = `
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V5H1V6H2V7H3V6H4V5H5V4H6V3H7V0Z" fill="${buttonText}"/>
        </svg>`.replace(/  |\n/g, '');
    const checkmarkDisabled = `
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V5H1V6H2V7H3V6H4V5H5V4H6V3H7V0Z" fill="${buttonShadow}"/>
        </svg>`.replace(/  |\n/g, '');
    const checkmarkMenu = `
        <?xml version="1.0" standalone="no"?>
        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="-10 0 2058 2048" shape-rendering="crispEdges">
            <path fill="${menuText}" d="M512 832l320 319l576 -575v384l-576 576l-320 -320v-384z" />
        </svg>`.replace(/  |\n/g, '');
    const checkmarkMenuHover = `
        <?xml version="1.0" standalone="no"?>
        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="-10 0 2058 2048" shape-rendering="crispEdges">
            <path fill="${hilightText}" d="M512 832l320 319l576 -575v384l-576 576l-320 -320v-384z" />
        </svg>`.replace(/  |\n/g, '');

    const css = `
        --scroll-up: url("data:image/svg+xml,${encodeURIComponent(scrollUp)}") !important;
        --scroll-down: url("data:image/svg+xml,${encodeURIComponent(scrollDown)}") !important;
        --scroll-left: url("data:image/svg+xml,${encodeURIComponent(scrollLeft)}") !important;
        --scroll-right: url("data:image/svg+xml,${encodeURIComponent(scrollRight)}") !important;
        --scroll-track: url("data:image/svg+xml,${encodeURIComponent(scrollTrack)}") !important;
        --dropdown-button-pressed: url("data:image/svg+xml,${encodeURIComponent(dropdownButtonPressed)}") !important;
        --checkmark: url("data:image/svg+xml,${encodeURIComponent(checkmark)}") !important;
        --checkmark-disabled: url("data:image/svg+xml,${encodeURIComponent(checkmarkDisabled)}") !important;
        --checkmark-menu: url("data:image/svg+xml,${encodeURIComponent(checkmarkMenu)}") !important;
        --checkmark-menu-hover: url("data:image/svg+xml,${encodeURIComponent(checkmarkMenuHover)}") !important;
    `.replace(/  |\n/g, '');
    return css;
}

// Parse *.theme files
// Or exported "HKCU\Control Panel\Colors" *.reg files (reg = true)
// Or WinClassicThemeConfig reg files (ctc = true)
function getColorValue(themeText, name, reg, ctc) {
    const ctcMap = [
        'Scrollbar',
        'Background',
        'ActiveTitle',
        'InactiveTitle',
        'Menu',
        'Window',
        'WindowFrame',
        'MenuText',
        'WindowText',
        'TitleText',
        'ActiveBorder',
        'InactiveBorder',
        'AppWorkspace',
        'Hilight',
        'HilightText',
        'ButtonFace',
        'ButtonShadow',
        'GrayText',
        'ButtonText',
        'InactiveTitleText',
        'ButtonHilight',
        'ButtonDkShadow',
        'ButtonLight',
        'InfoText',
        'InfoWindow',
        'ButtonAlternateFace',
        'HotTrackingColor',
        'GradientActiveTitle',
        'GradientInactiveTitle',
        'MenuHilight',
        'MenuBar'
    ];
    let regex;
    if (ctc) {
        regex = new RegExp(`\\n"Color${ctcMap.indexOf(name)}"=dword:00(.*)\r\n`);
    } else if (reg) {
        regex = new RegExp(`\\n\"${name}\"=\"(.*)\"\r\n`);
    } else {
        regex = new RegExp(`\\n${name}=(.*)\r\n`);
    }
    let rgb = themeText.match(regex);
    if (ctc) {
        if (!rgb) {
            throw new Error(`Color not found for ${name}`);
        } else {
            return '#' + rgb[1].trim().match(/.{2}/g).reverse().join('');
        }
    }
    if (!rgb) {
        switch (name) {
            case 'ButtonAlternateFace':
                return '#B5B5B5';
            case 'GradientActiveTitle':
                return getColorValue(themeText, 'ActiveTitle', reg);
            case 'GradientInactiveTitle':
                return getColorValue(themeText, 'InactiveTitle', reg);
            case 'MenuBar':
                return getColorValue(themeText, 'Menu', reg);
            case 'MenuHilight':
                return getColorValue(themeText, 'Hilight', reg);
            case 'HotTrackingColor':
                return '#008080';
            default:
                throw new Error(`Color not found for ${name}`);
        }
    }
    return '#' + rgb[1].trim().split(' ').map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}