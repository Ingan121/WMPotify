// MadMenu.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

import { processString } from "../strings";

// This script handles the menu bar and context menus in ModernActiveDesktop apps
// Dependencies: functions.js (getTextWidth)
// Load libmad.css for the default styles

interface StandaloneOptions {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
}

export class MadMenu {
    menuOrder: string[];
    submenus: string[];
    openedMenu: HTMLElement | null;
    mouseOverMenu: boolean;
    mouseOverSubmenu: boolean;
    handlingPointerEvent: boolean;
    handlingKeyEvent: boolean;
    boundMenuNavigationHandler: (event: KeyboardEvent) => void;
    submenuOpenTimer: number | undefined;
    submenuCloseTimer: number | undefined;
    shouldNotCloseSubmenu: boolean;
    menuHierarchy: { [key: string]: string[] }
    beforeMenuOpenEvent: Event;
    afterMenuCloseEvent: Event;
    // menuOrder: An array of menu names in the order they appear in the menu bar
    // submenus: An array of submenu names
    // menu names are defined by the id of the menu button, the menu background, and the menu element (e.g. "fileMenuBtn", "fileMenuBg", and "fileMenu")
    constructor(menuOrder: string[] = [], submenus: string[] = []) {
        this.menuOrder = menuOrder;
        this.submenus = submenus;
        this.openedMenu = null;
        this.mouseOverMenu = false;
        this.mouseOverSubmenu = false;
        this.handlingPointerEvent = false;
        this.handlingKeyEvent = false;
        this.boundMenuNavigationHandler = this.menuNavigationHandler.bind(this);
        this.submenuOpenTimer = undefined;
        this.submenuCloseTimer = undefined;
        this.shouldNotCloseSubmenu = false;
        this.menuHierarchy = {};
        this.beforeMenuOpenEvent = new Event('beforemenuopen');
        this.afterMenuCloseEvent = new Event('aftermenuclose');

        for (const menuName of menuOrder) {
            this.menuHierarchy[menuName] = [];
            const menuBg = document.getElementById(menuName + 'MenuBg');
            if (!menuBg) {
                continue;
            }
            const menuItems = menuBg.querySelectorAll('.contextMenuItem');

            for (const elem of menuItems) {
                if (!elem || elem instanceof HTMLElement === false) {
                    continue;
                }
                if (elem.dataset.submenu) {
                    this.menuHierarchy[menuName].push(elem.dataset.submenu);
                }
                elem.addEventListener('pointerover', () => {
                    for (const item of menuItems) {
                        if (item instanceof HTMLElement) {
                            delete item.dataset.active;
                        }
                    }
                    elem.dataset.active = "true";
                    clearTimeout(this.submenuOpenTimer);
                    if (elem.dataset.submenu) {
                        this.submenuOpenTimer = setTimeout(() => {
                            if (elem.dataset.submenu) {
                                this.openMenu(elem.dataset.submenu);
                            }
                        }, 300);
                    } else if (this.menuHierarchy[menuName].length > 0) {
                        this.delayedCloseMenu(this.menuHierarchy[menuName][0]);
                    }
                });
                elem.addEventListener('pointerleave', () => {
                    if (!this.mouseOverSubmenu) {
                        delete elem.dataset.active;
                        clearTimeout(this.submenuOpenTimer);
                        if (elem.dataset.submenu) {
                            this.delayedCloseMenu(elem.dataset.submenu);
                        }
                    }
                });
                elem.addEventListener('click', () => {
                    if (elem.dataset.submenu && !elem.classList.contains('disabled')) {
                        if (this.openedMenu?.id !== elem.dataset.submenu + 'MenuBg') {
                            this.openMenu(elem.dataset.submenu);
                        } else {
                            document.getElementById(elem.dataset.submenu + 'MenuBg')?.focus();
                        }
                    } else if (!elem.dataset.noClose) {
                        this.closeMenu(menuName);
                    }
                });
            }

            menuBg.addEventListener('focusout', (event) => {
                if (window['ignoreFocusLoss']) {
                    return;
                }
                if (event.relatedTarget && event.relatedTarget instanceof HTMLElement &&
                    event.relatedTarget.dataset.submenuOf === menuName
                ) {
                    return;
                }
                this.closeMenu(menuName);
            });

            menuBg.addEventListener('pointermove', (event) => {
                if (event.clientX > 0 || event.clientY > 0) {
                    menuBg.style.animation = 'none';
                }
            });
        }

        for (const submenu of submenus) {
            const menuBg = document.getElementById(submenu + 'MenuBg');
            if (!menuBg) {
                continue;
            }
            const menuItems = menuBg.querySelectorAll('.contextMenuItem');
            const parentMenuBg = document.getElementById(menuBg.dataset.submenuOf + 'MenuBg');
            if (!parentMenuBg) {
                continue;
            }
            const parentMenuItemIndex = Array.from(parentMenuBg.querySelectorAll('.contextMenuItem')).findIndex((elem) => (elem as HTMLElement).dataset.submenu === submenu);
            const parentMenuItem = parentMenuBg.querySelectorAll('.contextMenuItem')[parentMenuItemIndex] as HTMLElement;

            for (const elem of menuItems) {
                elem.addEventListener('pointerover', () => {
                    for (const item of menuItems) {
                        if (item instanceof HTMLElement) {
                            delete item.dataset.active;
                        }
                    }
                    if (elem instanceof HTMLElement) {
                        elem.dataset.active = "true";
                    }
                });
                elem.addEventListener('pointerleave', () => {
                    if (elem instanceof HTMLElement) {
                        delete elem.dataset.active;
                    }
                });
                elem.addEventListener('click', () => {
                    this.shouldNotCloseSubmenu = false;
                    this.closeMenu(submenu);
                    this.closeMenu(menuBg.dataset.submenuOf);
                });
            }

            menuBg.addEventListener('pointerover', () => {
                this.mouseOverMenu = true;
                this.mouseOverSubmenu = true;
                this.shouldNotCloseSubmenu = true;
                clearTimeout(this.submenuCloseTimer);
                parentMenuItem.dataset.active = "true";
            });

            menuBg.addEventListener('pointerleave', () => {
                this.mouseOverMenu = false;
                this.mouseOverSubmenu = false;
                this.shouldNotCloseSubmenu = false;
            });

            menuBg.addEventListener('focusout', (event) => {
                if (window['ignoreFocusLoss']) {
                    return;
                }
                if (menuBg.style.display === 'none') {
                    return;
                }
                this.shouldNotCloseSubmenu = false;
                const standalone = !!menuBg.dataset.openStandalone;
                // Prevent closing the submenu when clicking the same menu item in the parent menu
                if (event.relatedTarget && event.relatedTarget instanceof HTMLElement &&
                    event.relatedTarget.id && event.relatedTarget.id === parentMenuBg.id
                ) {
                    return;
                }
                this.closeMenu(submenu);
                // Prevent closing the parent menu when opening another submenu
                if (event.relatedTarget && event.relatedTarget instanceof HTMLElement &&
                    event.relatedTarget.id && event.relatedTarget.dataset.submenuOf === menuBg.dataset.submenuOf
                ) {
                    return;
                }
                if (!standalone) {
                    this.closeMenu(menuBg.dataset.submenuOf);
                }
            });
        }
    }

    openMenu(menuName: string, standalone: StandaloneOptions | null = null) {
        const menuBg = document.getElementById(menuName + 'MenuBg');
        if (!menuBg) {
            return;
        }
        const menu = document.getElementById(menuName + 'Menu');
        if (!menu) {
            return;
        }
        const isSubmenu = !!menuBg.dataset.submenuOf;
        let parentMenuBg: HTMLElement | null = null;
        let parentMenuItem: HTMLElement | null = null;

        let menuItems: NodeListOf<Element> | null = null;
        const debugItems = menuBg.querySelectorAll('.contextMenuItem.debug');
        if (localStorage.wmpotifyDebugMode) {
            menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden])');
            for (const debugItem of debugItems) {
                if (debugItem instanceof HTMLElement) {
                    debugItem.style.display = '';
                }
            }
        } else {
            menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden]):not(.debug)');
            for (const debugItem of debugItems) {
                if (debugItem instanceof HTMLElement) {
                    debugItem.style.display = 'none';
                }
            }
        }

        menuBg.dispatchEvent(this.beforeMenuOpenEvent);

        if (standalone) {
            menuBg.dataset.openStandalone = "true";
        } else {
            if (isSubmenu) {
                // Close other submenus of the same parent menu
                if (this.menuHierarchy[menuBg.dataset.submenuOf || ''].length > 1) {
                    for (const submenu of this.menuHierarchy[menuBg.dataset.submenuOf || '']) {
                        if (submenu !== menuName) {
                            this.closeMenu(submenu);
                        }
                    }
                }
                parentMenuBg = document.getElementById(menuBg.dataset.submenuOf + 'MenuBg') as HTMLElement | null;
                if (!parentMenuBg || parentMenuBg.style.display === 'none') {
                    return;
                }
                let parentMenuItemIndex = Array.from(parentMenuBg.querySelectorAll('.contextMenuItem')).findIndex((elem) => (elem as HTMLElement).dataset.submenu === menuName);
                parentMenuItem = parentMenuBg.querySelectorAll('.contextMenuItem')[parentMenuItemIndex] as HTMLElement;
                if (parentMenuItem.classList.contains('disabled')) {
                    return;
                }
            } else {
                // Make sure other menus are closed
                for (const menu of this.menuOrder) {
                    if (menu !== menuName && (document.getElementById(menu + 'MenuBg') as HTMLElement).style.display === 'block') {
                        this.closeMenu(menu);
                    }
                }
            }
            delete menuBg.dataset.openStandalone;
        }

        menuBg.style.animation = '';

        for (const item of menuItems || []) {
            if (item instanceof HTMLElement) {
                delete item.dataset.active;
            }
        }
        if (standalone) {
            if (standalone.top) {
                menuBg.style.top = standalone.top;
            }
            if (standalone.left) {
                menuBg.style.left = standalone.left;
            }
            if (standalone.right) {
                menuBg.style.right = standalone.right;
            }
            if (standalone.bottom) {
                menuBg.style.bottom = standalone.bottom;
            }
        } else {
            let top = '';
            let left = 0;
            if (isSubmenu && parentMenuBg && parentMenuItem) {
                top = (parentMenuBg.offsetTop + parentMenuItem.offsetTop).toString();
                left = parentMenuBg.offsetLeft + parentMenuBg.offsetWidth - 6;
            }
            menuBg.style.top = top + 'px';
            menuBg.style.left = left + 'px';
        }
        menuBg.style.display = 'block';
        const calculatedMenuWidth = this.calcMenuWidth(menuName);
        menuBg.style.width = calculatedMenuWidth + ')';
        menuBg.style.minWidth = "0";
        menu.style.width = calculatedMenuWidth + (['aero', '10', undefined].includes(localStorage.wmpotifyControlStyle) ? ' - 2px)' : ')');
        menuBg.style.height = this.calcMenuHeight(menuName) + 'px';
        if (!standalone) {
            if (isSubmenu && parentMenuItem) {
                parentMenuItem.dataset.active = "true";
            }
        }
        menuBg.focus();
        this.openedMenu = menuBg;
        document.addEventListener('keydown', this.boundMenuNavigationHandler);
    }

    closeMenu(menuName) {
        //console.log('closeMenu:', new Error().stack);
        const menuBg = document.getElementById(menuName + 'MenuBg') as HTMLElement;
        const standalone = !!menuBg.dataset.openStandalone;
        const isSubmenu = !!menuBg.dataset.submenuOf && !standalone;
        if ((isSubmenu && this.shouldNotCloseSubmenu)) {
            return;
        }
        let parentMenuBg;
        let parentMenuItem;

        if (!standalone) {
            if (isSubmenu) {
                parentMenuBg = document.getElementById(menuBg.dataset.submenuOf + 'MenuBg') as HTMLElement;
                let parentMenuItemIndex = Array.from(parentMenuBg.querySelectorAll('.contextMenuItem')).findIndex((elem) => (elem as HTMLElement).dataset.submenu === menuName);
                parentMenuItem = parentMenuBg.querySelectorAll('.contextMenuItem')[parentMenuItemIndex] as HTMLElement;
            }
        }

        if (this.submenuCloseTimer) {
            clearTimeout(this.submenuCloseTimer);
        }

        menuBg.style.display = 'none';
        if (standalone) {
            delete menuBg.dataset.openStandalone;
        } else if (isSubmenu) {
            delete parentMenuItem.dataset.active;
        }

        menuBg.dispatchEvent(this.afterMenuCloseEvent);

        if (isSubmenu && parentMenuBg.style.display !== 'none') {
            parentMenuBg.focus();
            this.openedMenu = parentMenuBg;
        } else {
            this.openedMenu = null;
            document.removeEventListener('keydown', this.boundMenuNavigationHandler);
        }
        //console.log(menuName + ': ' + new Error().stack);
    }

    delayedCloseMenu(menuName) {
        this.submenuCloseTimer = setTimeout(() => {
            this.closeMenu(menuName);
        }, 300);
    }

    menuNavigationHandler(event) {
        if (!this.openedMenu) {
            return;
        }
        let menuItems;
        if (localStorage.wmpotifyDebugMode) {
            menuItems = this.openedMenu.querySelectorAll('.contextMenuItem');
        } else {
            menuItems = this.openedMenu.querySelectorAll('.contextMenuItem:not(.debug)');
        }
        const activeItem = this.openedMenu.querySelector('.contextMenuItem[data-active]');
        const activeItemIndex = Array.from(menuItems).indexOf(activeItem);
        let parentMenuItem;
        if (this.openedMenu.dataset.submenuOf) {
            parentMenuItem = document.getElementById(this.openedMenu.dataset.submenuOf + 'MenuBg')?.querySelector('.contextMenuItem[data-active]') as HTMLElement;
        }
        this.handlingKeyEvent = true;
        this.openedMenu.style.animation = 'none';
        switch (event.key) {
            case "Escape":
                this.mouseOverMenu = false;
                this.openedMenu.blur();
                break;
            case "ArrowUp":
                if (activeItem && activeItem instanceof HTMLElement) {
                    delete activeItem.dataset.active;
                    if (activeItemIndex > 0) {
                        menuItems[activeItemIndex - 1].dataset.active = "true";
                    } else {
                        menuItems[menuItems.length - 1].dataset.active = "true";
                    }
                } else {
                    menuItems[menuItems.length - 1].dataset.active = "true";
                }
                break;
            case "ArrowDown":
                if (activeItem && activeItem instanceof HTMLElement) {
                    delete activeItem.dataset.active;
                    if (activeItemIndex < menuItems.length - 1) {
                        menuItems[activeItemIndex + 1].dataset.active = "true";
                    } else {
                        menuItems[0].dataset.active = "true";
                    }
                } else {
                    menuItems[0].dataset.active = "true";
                }
                break;
            case "ArrowLeft": {
                if (this.openedMenu.dataset.submenuOf) {
                    this.closeMenu(this.openedMenu.id.slice(0, -6));
                    parentMenuItem.dataset.active = "true";
                    break;
                }
                if (this.menuOrder.length === 1) {
                    break;
                }
                const prevMenu = this.menuOrder[(this.menuOrder.indexOf(this.openedMenu.id.slice(0, -6)) + this.menuOrder.length - 1) % this.menuOrder.length];
                this.closeMenu(this.openedMenu.id.slice(0, -6));
                this.openMenu(prevMenu);
                const openedMenuItem = this.openedMenu.querySelector('.contextMenuItem') as HTMLElement;
                openedMenuItem.dataset.active = "true";
                break;
            }
            case "ArrowRight": {
                if (activeItem && activeItem instanceof HTMLElement && activeItem.dataset.submenu) {
                    this.openMenu(activeItem.dataset.submenu);
                    const openedSubMenuItem = this.openedMenu.querySelector('.contextMenuItem') as HTMLElement;
                    openedSubMenuItem.dataset.active = "true";
                    break;
                }
                if (this.menuOrder.length === 1) {
                    break;
                }
                let nextMenu = '';
                if (this.openedMenu.dataset.submenuOf) {
                    nextMenu = this.menuOrder[(this.menuOrder.indexOf(this.openedMenu.dataset.submenuOf) + 1) % this.menuOrder.length];
                    this.closeMenu(this.openedMenu.id.slice(0, -6));
                } else {
                    nextMenu = this.menuOrder[(this.menuOrder.indexOf(this.openedMenu.id.slice(0, -6)) + 1) % this.menuOrder.length];
                    this.closeMenu(this.openedMenu.id.slice(0, -6));
                }
                this.openMenu(nextMenu);
                const openedMenuItem = this.openedMenu.querySelector('.contextMenuItem') as HTMLElement;
                openedMenuItem.dataset.active = "true";
                break;
            }
            case "Enter":
                if (activeItem && activeItem instanceof HTMLElement) {
                    activeItem.click();
                } else {
                    this.openedMenu.blur();
                    break;
                }
                break;
            default:
                const shortcutsKeys = this.openedMenu.getElementsByTagName('u');
                for (const shortcutKey of shortcutsKeys) {
                    if (event.key === shortcutKey.textContent.toLowerCase()) {
                        shortcutKey.parentElement?.click();
                        break;
                    }
                }
        }
        this.handlingKeyEvent = false;
        event.preventDefault();
        event.stopPropagation();
    }

    calcMenuWidth(menuName: string): string {
        const menuBg = document.getElementById(menuName + 'MenuBg');
        if (!menuBg) {
            return '200px';
        }
        let menuItems: NodeListOf<Element>;
        if (localStorage.wmpotifyDebugMode) {
            menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden])');
        } else {
            menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden]):not(.debug)');
        }
        menuBg.style.minWidth = '';
        const minWidth = parseInt(getComputedStyle(menuBg).minWidth) || 0;
        const width = Array.from(menuItems).reduce((maxWidth, elem) => {
            const text = elem.textContent;
            const width = getTextWidth(text);
            return Math.max(minWidth, maxWidth, width);
        }, 0);
        return `calc(${width}px + 4.5em`;
    }

    calcMenuHeight(menuName: string): number {
        const menuBg = document.getElementById(menuName + 'MenuBg');
        if (!menuBg) {
            return 0;
        }
        const separators = menuBg.querySelectorAll('hr');

        let menuItems: NodeListOf<Element>;
        if (localStorage.wmpotifyDebugMode) {
            menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden])');
        } else {
            menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden]):not(.debug)');
        }
        const menuItemHeight = (menuItems[0] as HTMLElement).offsetHeight;

        let separatorHeight = 0;
        if (separators.length > 0) {
            const styles = getComputedStyle(separators[0]);
            separatorHeight = separators[0].offsetHeight + parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
        }
        const height = Math.round(menuItems.length * menuItemHeight + separators.length * separatorHeight);
        //console.log(`${menuItems.length} * ${menuItemHeight} + ${separators.length} * ${separatorHeight} = ${height}`)
        return height;
    }
}

export interface MadMenuItem {
    hr?: boolean; // Whether the menu item is a separator
    text?: string; // The text of the menu item (use %s for string substitution, %[n]s for argument substitution, and & for underlined characters / access keys)
    args?: any[]; // An array of arguments to be passed to processString
    classList?: string[]; // An array of classes to be added to the menu item
    disabled?: boolean; // Whether the menu item is disabled
    hidden?: boolean; // Whether the menu item is hidden
    submenu?: string; // The id of the submenu
    click?: (event: Event) => void; // The function to be called when the menu item is clicked
    noClose?: boolean; // Whether the menu item should not close the menu when clicked
}

export interface CreateMadMenuRes {
    menuBg: HTMLElement;
    menu: HTMLElement | null;
    menuItems: NodeListOf<Element> | null;
}

export function createMadMenu(menuName: string, menuItems: MadMenuItem[], submenuOf?: string): CreateMadMenuRes {
    // menuName: The name of the menu
    // submenuOf: The id of the parent menu
    // menuItems: An array of objects with the MadMenuItem properties

    const menuBg = document.createElement('div');
    menuBg.id = menuName + 'MenuBg';
    menuBg.className = 'contextMenuBg';
    menuBg.tabIndex = -1;
    menuBg.style.display = 'none';
    menuBg.innerHTML = `<div id="${menuName}Menu" class="contextMenu"></div>`;
    if (submenuOf) {
        menuBg.dataset.submenuOf = submenuOf;
    }
    menuItems.forEach((item) => {
        if (item.hr) {
            const separator = document.createElement('hr');
            menuBg.querySelector('.contextMenu')?.appendChild(separator);
            return;
        }
        const menuItem = document.createElement('div');
        menuItem.className = 'contextMenuItem';
        if (item.text) {
            if (item.args) {
                menuItem.innerHTML = '<p>' + processString(item.text, ...item.args) + '</p>';
            } else {
                menuItem.innerHTML = '<p>' + processString(item.text) + '</p>';
            }
        }
        if (item.classList) {
            menuItem.classList.add(...item.classList);
        }
        if (item.disabled) {
            menuItem.classList.add('disabled');
        }
        if (item.hidden) {
            menuItem.dataset.hidden = "true";
        }
        if (item.submenu) {
            menuItem.dataset.submenu = item.submenu;
            menuItem.innerHTML += '<p class="submenuMark">⏵</p>';
        }
        if (item.noClose) {
            menuItem.dataset.noClose = "true";
        }
        if (item.click) {
            menuItem.addEventListener('click', item.click);
        }
        menuBg.querySelector('.contextMenu')?.appendChild(menuItem);
    });
    document.body.appendChild(menuBg);
    return {
        menuBg: menuBg,
        menu: menuBg.querySelector('.contextMenu'),
        menuItems: menuBg.querySelectorAll('.contextMenuItem')
    };
}

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 * 
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 * 
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
let savedCanvas: HTMLCanvasElement | null = null;
function getTextWidth(text: string, font: string = getComputedStyle(document.documentElement).getPropertyValue("--menu-font")) {
    // re-use canvas object for better performance
    const canvas = savedCanvas || (savedCanvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    if (!context) {
        return 0;
    }
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}