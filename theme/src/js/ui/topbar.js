'use strict';

import Strings from '../strings';
import { openWmpvisInstallDialog } from '../ui/dialogs';
import { MadMenu, createMadMenu } from '../utils/MadMenu';
import WindhawkComm from '../utils/WindhawkComm';

const tabNameSubstitutes = {
    'Friend Activity': 'Friends',
}

class Topbar {
    constructor() {
        const topbar = document.querySelector('.Root__globalNav');
        this.tabsContainer = document.createElement('div');
        this.tabsContainer.id = 'wmpotify-tabs-container';
        topbar.insertBefore(this.tabsContainer, topbar.querySelector('.main-globalNav-searchSection'));
        topbar.dataset.wmpotifyTabsCreated = true;

        let nowPlayingButton = document.querySelector('.custom-navlinks-scrollable_container div[role="presentation"] > button:has(#wmpotify-nowplaying-icon)');
        if (!nowPlayingButton) {
            nowPlayingButton = document.createElement('button');
            nowPlayingButton.addEventListener('click', () => {
                if (Spicetify.Config.custom_apps.includes('wmpvis')) {
                    // Somehow Spicetify didn't create CustomApps buttons but it's still installed
                    Spicetify.Platform.History.push({ pathname: '/wmpvis' });
                } else {
                    openWmpvisInstallDialog();
                }
            });
            if (localStorage.wmpotifyNoWmpvis && !Spicetify.Config.custom_apps.includes('wmpvis')) {
                nowPlayingButton.dataset.extraHidden = true;
            }
        }
        nowPlayingButton.setAttribute('aria-label', Strings['TAB_NOW_PLAYING']);
        nowPlayingButton.dataset.identifier = 'now-playing';
        this.addTab(nowPlayingButton);
        const homeButton = document.querySelector('.main-globalNav-searchContainer > button');
        homeButton.dataset.identifier = 'home';
        this.addTab(homeButton);
        const searchButton = document.querySelector('.main-globalNav-searchContainer div form button');
        searchButton.dataset.identifier = 'search';
        searchButton.addEventListener('click', (event) => {
            // This button behave differently from version to version
            // So just open the search page directly
            Spicetify.Platform.History.push({ pathname: '/search' });
            event.preventDefault();
            event.stopPropagation();
        });
        this.addTab(searchButton);
        const libraryButton = document.createElement('button');
        libraryButton.id = 'wmpotify-library-button';
        libraryButton.dataset.identifier = 'library';
        libraryButton.setAttribute('aria-label', Strings['TAB_LIBRARY']);
        libraryButton.addEventListener('click', () => {
            Spicetify.Platform.History.push({ pathname: '/wmpotify-standalone-libx', });
        });
        this.addTab(libraryButton);
        this.tabs = [nowPlayingButton, homeButton, searchButton, libraryButton];
        const customAppButtons = document.querySelectorAll('.custom-navlinks-scrollable_container div[role="presentation"] > button');
        if (customAppButtons.length > 0) {
            for (const btn of customAppButtons) {
                this.addTab(btn);
                this.tabs.push(btn);
            }
        } else {
            const customAppsButtonsParent = document.querySelector('.main-globalNav-historyButtonsContainer');
            const observer = new MutationObserver(() => {
                console.log('WMPotify: Handling late custom apps buttons mount');
                for (const btn of this.tabs) {
                    delete btn.dataset.hidden;
                }
                const customAppsButtons = document.querySelectorAll('.custom-navlinks-scrollable_container div[role="presentation"] > button');
                if (customAppsButtons.length > 0) {
                    for (const btn of customAppsButtons) {
                        if (btn.querySelector('#wmpotify-nowplaying-icon')) {
                            delete nowPlayingButton.dataset.hidden;
                            continue;
                        }
                        this.addTab(btn);
                        this.tabs.push(btn);
                    }
                    observer.disconnect();
                    this.loadOrder();
                }
            });
            observer.observe(customAppsButtonsParent, { childList: true, subtree: true });
        }
        const rightButtons = document.querySelectorAll('.main-topBar-topbarContentRight > .main-actionButtons > button');
        for (const btn of rightButtons) {
            if (btn.dataset.restoreFocusKey === 'buddy_feed') {
                btn.dataset.identifier = 'buddy-feed';
            } else if (rightButtons.length === 2) {
                btn.dataset.identifier = 'content-feed';
            }
            this.addTab(btn);
            this.tabs.push(btn);
        }

        this.loadOrder();

        const menuItems = [];
        for (const tab of this.tabs) {
            menuItems.push({
                text: tab.querySelector('.wmpotify-tab-label').textContent,
                click: () => tab.click(),
            });
        }
        createMadMenu('wmpotifyTab', menuItems);
        createMadMenu('wmpotifyTabMenu', [
            {
                text: Strings['TAB_RESET_ORDER'],
                click: () => {
                    localStorage.removeItem('wmpotifyTabOrder');
                    location.reload();
                },
            },
        ]);
        const menu = new MadMenu(['wmpotifyTab', 'wmpotifyTabMenu']);
        this.overflowButton = document.createElement('button');
        this.overflowButton.id = 'wmpotify-tabs-overflow-button';
        const top = !!document.querySelector('#wmpotify-title-bar') ? '25px' : '0';
        this.overflowButton.addEventListener('click', () => {
            menu.openMenu('wmpotifyTab', { top, left: this.overflowButton.getBoundingClientRect().left + 'px' });
        });
        this.tabsContainer.appendChild(this.overflowButton);

        this.tabsContainer.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            menu.openMenu('wmpotifyTabMenu', { top: event.clientY + 'px', left: event.clientX + 'px' });
        });

        let cnt = 0;
        this.handleTabOverflow();
        const interval = setInterval(() => {
            this.handleTabOverflow();
            if (cnt++ > 10) {
                clearInterval(interval);
            }
        }, 200);
        window.addEventListener('resize', this.handleTabOverflow.bind(this));
        new ResizeObserver(this.handleTabOverflow.bind(this)).observe(this.tabsContainer);
        document.addEventListener('fullscreenchange', this.handleTabOverflow.bind(this));

        const accountButton = document.querySelector('.main-topBar-topbarContentRight > button:last-child');
        const accountLabel = document.createElement('span');
        accountLabel.textContent = accountButton.getAttribute('aria-label');
        accountLabel.classList.add('wmpotify-user-label');
        accountButton.appendChild(accountLabel);

        const searchContainer = document.createElement('div');
        searchContainer.id = 'wmpotify-search-container';
        const searchBarWrapper = document.createElement('div');
        searchBarWrapper.id = 'wmpotify-search-wrapper';
        const searchBar = document.querySelector('.main-globalNav-searchContainer div form input[type="search"]');
        searchBarWrapper.appendChild(searchBar);
        const searchClearButton = document.createElement('button');
        searchClearButton.id = 'wmpotify-search-clear-button';
        searchClearButton.setAttribute('aria-label', 'Clear search');
        searchClearButton.addEventListener('click', () => {
            searchBar.value = '';
            searchBar.focus();
            Spicetify.Platform.History.push({ pathname: '/search' });
        });
        searchBarWrapper.appendChild(searchClearButton);
        searchContainer.appendChild(searchBarWrapper);
        topbar.appendChild(searchContainer);

        topbar.addEventListener('pointerdown', (event) => {
            if (event.button === 2 && !event.target.closest('input') && !event.target.closest('#wmpotify-tabs-container')) {
                WindhawkComm.openSpotifyMenu();
            }
        });

        const rightSidebarWidth = getComputedStyle(document.documentElement).getPropertyValue("--right-sidebar-width");
        if (rightSidebarWidth) {
            document.documentElement.style.setProperty("--panel-width", rightSidebarWidth);
        }
    }

    addTab(btn) {
        this.tabsContainer.appendChild(btn);
        const label = document.createElement('span');
        const name = btn.getAttribute('aria-label');
        label.textContent = tabNameSubstitutes[name] || name;
        label.classList.add('wmpotify-tab-label');
        btn.draggable = true;
        btn.addEventListener('dragstart', (event) => {
            this.tabsContainer.classList.add('dragging');
            event.dataTransfer.setData('text/plain', label.textContent);
            btn.dataset.dragging = true;
        });
        btn.addEventListener('dragend', () => {
            delete btn.dataset.dragging;
            this.tabsContainer.classList.remove('dragging');
        });
        btn.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        btn.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const draggedTab = this.tabs.find((tab) => tab.dataset.dragging);
            if (draggedTab) {
                if (event.offsetX > btn.getBoundingClientRect().width / 2) {
                    this.tabsContainer.insertBefore(draggedTab, btn.nextElementSibling);
                } else {
                    this.tabsContainer.insertBefore(draggedTab, btn);
                }
                this.tabs = Array.from(this.tabsContainer.querySelectorAll('button:not(#wmpotify-tabs-overflow-button)'));
                this.handleTabOverflow();
                localStorage.wmpotifyTabOrder = this.getTabOrder();
            }
        });
        btn.appendChild(label);
    }

    getTabOrder() {
        return this.tabs.map((tab) => {
            return tab.dataset.identifier || tab.getAttribute('aria-label');
        });
    }

    loadOrder() {
        if (localStorage.wmpotifyTabOrder) {
            const order = localStorage.wmpotifyTabOrder.split(',');
            for (const tab of order) {
                const foundTab = this.tabs.find((t) => {
                    return t.dataset.identifier === tab || t.getAttribute('aria-label') === tab;
                });
                if (foundTab) {
                    this.tabsContainer.appendChild(foundTab);
                }
            }
            this.tabs = Array.from(this.tabsContainer.querySelectorAll('button'));
            if (this.overflowButton) {
                this.tabsContainer.appendChild(this.overflowButton);
            }
        }
    }

    handleTabOverflow() {
        const leftAreaWidth = document.querySelector('.main-globalNav-historyButtons').getBoundingClientRect().right;
        const rightAreaWidth = window.innerWidth - document.querySelector('.main-topBar-topbarContentRight').getBoundingClientRect().left;
        const extra = 160;

        let hiddenTabs = 0;
        while (window.innerWidth - leftAreaWidth - rightAreaWidth - extra < this.tabsContainer.getBoundingClientRect().width && hiddenTabs < this.tabs.length) {
            this.tabs[this.tabs.length - 1 - hiddenTabs++].dataset.hidden = true;
        }
        hiddenTabs = document.querySelectorAll('#wmpotify-tabs-container button[data-hidden]').length;
        while (hiddenTabs > 0 && window.innerWidth - leftAreaWidth - rightAreaWidth - extra > this.tabsContainer.getBoundingClientRect().width) {
            delete this.tabs[this.tabs.length - hiddenTabs--].dataset.hidden;
        }

        this.overflowButton.style.display = hiddenTabs > 0 ? 'block' : '';
    }
}

export default Topbar;