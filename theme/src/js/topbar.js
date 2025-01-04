import { MadMenu, createMadMenu } from './MadMenu';

let tabsContainer;
let tabs = [];
let overflowButton;

const tabNameSubstitutes = {
    'Your Library': 'Library',
    'Friend Activity': 'Friends',
}

export function setupTopbar() {
    const topbar = document.querySelector('.Root__globalNav');
    tabsContainer = document.createElement('div');
    tabsContainer.id = 'wmpotify-tabs-container';
    topbar.insertBefore(tabsContainer, topbar.querySelector('.main-globalNav-searchSection'));

    const homeButton = document.querySelector('.main-globalNav-searchContainer > button');
    addTab(homeButton);
    const searchButton = document.querySelector('.main-globalNav-searchContainer div form button');
    addTab(searchButton);
    tabs = [homeButton, searchButton];
    const customAppButtons = document.querySelectorAll('.custom-navlinks-scrollable_container div[role="presentation"] > button');
    for (const btn of customAppButtons) {
        addTab(btn);
        tabs.push(btn);
    }
    const rightButtons = document.querySelectorAll('.main-topBar-topbarContentRight > .main-actionButtons > button');
    for (const btn of rightButtons) {
        addTab(btn);
        tabs.push(btn);
    }
    const menuItems = [];
    for (const tab of tabs) {
        menuItems.push({
            text: tab.querySelector('.wmpotify-tab-label').textContent,
            click: () => tab.click(),
        });
    }
    createMadMenu('wmpotifyTab', menuItems);
    const menu = new MadMenu(['wmpotifyTab']);
    overflowButton = document.createElement('button');
    overflowButton.id = 'wmpotify-tabs-overflow-button';
    overflowButton.addEventListener('click', () => {
        menu.openMenu('wmpotifyTab', { top: '0', left: overflowButton.getBoundingClientRect().left + 'px' });
    });
    tabsContainer.appendChild(overflowButton);
    handleTabOverflow();
    setTimeout(handleTabOverflow, 1000);
    window.addEventListener('resize', handleTabOverflow);

    const accountButton = document.querySelector('.main-topBar-topbarContentRight > button:last-child');
    const accountLabel = document.createElement('span');
    accountLabel.textContent = accountButton.getAttribute('aria-label');
    accountLabel.classList.add('wmpotify-user-label');
    accountButton.appendChild(accountLabel);

    const searchContainer = document.createElement('div');
    searchContainer.id = 'wmpotify-search-container';
    const searchBarWrapper = document.createElement('div');
    searchBarWrapper.id = 'wmpotify-search-wrapper';
    const searchBar = document.querySelector('.main-topBar-searchBar');
    searchBarWrapper.appendChild(searchBar);
    const searchClearButton = document.createElement('button');
    searchClearButton.id = 'wmpotify-search-clear-button';
    searchClearButton.setAttribute('aria-label', 'Clear search');
    searchClearButton.addEventListener('click', () => {
        searchBar.value = '';
        searchBar.focus();
        window.open('spotify:search');
    });
    searchBarWrapper.appendChild(searchClearButton);
    searchContainer.appendChild(searchBarWrapper);
    topbar.appendChild(searchContainer);
}

function addTab(btn) {
    tabsContainer.appendChild(btn);
    const label = document.createElement('span');
    const name = btn.getAttribute('aria-label');
    label.textContent = tabNameSubstitutes[name] || name;
    label.classList.add('wmpotify-tab-label');
    btn.appendChild(label);
}

function handleTabOverflow() {
    const leftAreaWidth = document.querySelector('.main-globalNav-historyButtons').getBoundingClientRect().right;
    const rightAreaWidth = window.innerWidth - document.querySelector('.main-topBar-topbarContentRight').getBoundingClientRect().left;
    const extra = 160;

    let hiddenTabs = 0;
    while (window.innerWidth - leftAreaWidth - rightAreaWidth - extra < tabsContainer.getBoundingClientRect().width && hiddenTabs < tabs.length) {
        tabs[tabs.length - 1 - hiddenTabs++].dataset.hidden = true;
    }
    hiddenTabs = document.querySelectorAll('#wmpotify-tabs-container button[data-hidden]').length;
    while (hiddenTabs > 0 && window.innerWidth - leftAreaWidth - rightAreaWidth - extra > tabsContainer.getBoundingClientRect().width) {
        delete tabs[tabs.length - hiddenTabs--].dataset.hidden;
    }

    overflowButton.style.display = hiddenTabs > 0 ? 'block' : '';
}