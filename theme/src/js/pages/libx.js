'use strict';

import Strings from '../strings';
import DirectUserStorage from '../utils/DirectUserStorage';

// This script implements the custom sidebar, header and navigation for the stock Spotify LibraryX
// It's implemented with parsing and clicking various elements in the DOM, so it's not the most efficient way to do it
// Seems direct navigation is possible with Spicetify.Platform.LocalStorageAPI.setItem('ylx-active-filter-ids', {"": ["1", ...]})
// But unfortunately it's quite unreliable and doesn't work in all cases (and those not working cases are not known)
// So this script is implemented in the inefficient way

let categoryButtons;
const categoryButtonsHierarchy = [];
const categoryLocalizations = {};
const categoryButtonsObserver = new MutationObserver(parseCategoryButtons);
const folderObserver = new MutationObserver(onFolderChange);
let inFolder = false;
let exittingFolder = false;
let lastCategories = [];
let lastCategoriesIdentifier = [];

const CustomLibX = {
    async init() {
        if (document.querySelector('#wmpotify-libx-sidebar')) {
            return false;
        }

        const filterKeys = Object.keys(Spicetify.Platform.Translations).filter(key => key.startsWith('shared.library.filter.'));
        filterKeys.forEach(key => {
            const value = Spicetify.Platform.Translations[key];
            categoryLocalizations[key.split('.').pop()] = {
                'loc_id': key,
                'value': value
            };
        });

        if (categoryButtonsHierarchy.length === 0) {
            categoryButtonsHierarchy.push({
                identifier: 'playlist',
                localized: categoryLocalizations.playlist.value,
                elem: null
            });
            categoryButtonsHierarchy.push({
                identifier: 'album',
                localized: categoryLocalizations.album.value,
                elem: null
            });
            categoryButtonsHierarchy.push({
                identifier: 'artist',
                localized: categoryLocalizations.artist.value,
                elem: null
            });
        }

        const header = document.createElement('div');
        header.id = 'wmpotify-libx-header';
        document.querySelector('.main-yourLibraryX-libraryContainer').insertAdjacentElement('afterbegin', header);

        const sidebar = document.createElement('div');
        sidebar.id = 'wmpotify-libx-sidebar';
        document.querySelector('.main-yourLibraryX-libraryItemContainer').insertAdjacentElement('afterbegin', sidebar);

        await waitForLibXLoad();

        categoryButtons = document.querySelector('.main-yourLibraryX-filterArea .search-searchCategory-categoryGrid [role="presentation"]');
        parseCategoryButtons();
        categoryButtonsObserver.observe(categoryButtons, { childList: true });

        // Whole category buttons container gets re-rendered when entering and exiting a playlist folder
        folderObserver.observe(document.querySelector('.main-yourLibraryX-filterArea'), { childList: true });

        window.addEventListener('resize', handleResize);

        return true;
    },

    uninit() {
        document.querySelector('#wmpotify-libx-header')?.remove();
        document.querySelector('#wmpotify-libx-sidebar')?.remove();
        categoryButtonsObserver.disconnect();
        folderObserver.disconnect();
        window.removeEventListener('resize', handleResize);
    },

    go(identifiers) {
        if (!identifiers) {
            identifiers = Spicetify.Platform.History.location.pathname.split('/').slice(2);
        }
        if (identifiers[0] === undefined) {
            return;
        }
        go(identifiers);
    },

    expand: expandLibX,
    collapse: collapseLibX
};

function renderHeader() {
    const header = document.querySelector('#wmpotify-libx-header');
    header.innerHTML = '';
    const rootIcon = document.createElement('div');
    rootIcon.classList.add('wmpotify-libx-header-root-icon');
    rootIcon.classList.add('wmpotify-toolbar-button');
    header.appendChild(rootIcon);
    const rootText = document.createElement('button');
    rootText.classList.add('wmpotify-libx-header-root-text');
    rootText.classList.add('wmpotify-toolbar-button');
    rootText.textContent = Strings['LIBX_HEADER_ROOT'];
    rootText.addEventListener('click', goToRootCategory);
    header.appendChild(rootText);

    const currentCategories = getCurrentCategories();
    currentCategories.forEach((category, index) => {
        const categoryText = document.createElement('button');
        categoryText.classList.add('wmpotify-libx-header-category-text');
        categoryText.classList.add('wmpotify-toolbar-button');
        categoryText.textContent = category;
        categoryText.addEventListener('click', async () => {
            if (!categoryText.nextElementSibling) {
                return;
            }
            if (inFolder) {
                exitFolder();
                await waitForFolderChange();
            }
            categoryButtonsObserver.disconnect();
            const currentCategory = categoryButtonsHierarchy.find(cat => cat.localized === category);
            if (index === 0) {
                goToRootCategory();
                await waitForCategoryButtonsUpdate();
            } else {
                if (!currentCategory) {
                    return;
                }

                const parentCategory = categoryButtonsHierarchy.find(cat => cat.localized === currentCategories[index - 1]);

                if (!isInParentCategory(parentCategory) || !document.contains(currentCategory.elem)) {
                    if (!isInRootCategory()) {
                        goToRootCategory();
                        await waitForCategoryButtonsUpdate();
                    }
                    parentCategory.elem.click();
                    await waitForCategoryButtonsUpdate();
                }
            }
            refreshElement(currentCategory);
            currentCategory.elem.click();
            categoryButtonsObserver.observe(categoryButtons, { childList: true });
        });
        header.appendChild(categoryText);
    });

    if (inFolder) {
        const folderName = document.querySelector('.main-yourLibraryX-collapseButton > div').textContent;
        const folderText = document.createElement('button');
        folderText.classList.add('wmpotify-libx-header-category-text');
        folderText.classList.add('wmpotify-toolbar-button');
        folderText.textContent = folderName;
        header.appendChild(folderText);
    }
}

function parseCategoryButtons() {
    inFolder = document.querySelector('.main-yourLibraryX-collapseButton').childElementCount > 1;

    const currentCategories = getCurrentCategories(true);
    if (inFolder) {
        const folderId = Spicetify.Platform.LocalStorageAPI.getItem('opened-folder-uri');
        currentCategories.push(folderId);
    }
    if (!exittingFolder) {
        const pathname = '/wmpotify-standalone-libx/' + currentCategories.join('/');
        if (Spicetify.Platform.History.location.pathname === '/wmpotify-standalone-libx') {
            Spicetify.Platform.History.location.pathname = pathname;
        } else if (Spicetify.Platform.History.location.pathname !== pathname) {
            Spicetify.Platform.History.push({
                pathname: '/wmpotify-standalone-libx/' + currentCategories.join('/'),
            });
        }
    }

    if (inFolder) {
        // In a playlist folder, etc. Not the real root category
        renderHeader();
        return;
    }
    const isInitial = !categoryButtons.querySelector('button[class*="ChipClear"]:first-child');
    const buttons = Array.from(categoryButtons.querySelectorAll('button'));
    if (isInitial) {
        buttons.forEach((button, index) => {
            const category = {};
            category.localized = button.textContent;
            category.identifier = Object.keys(categoryLocalizations).find(key => categoryLocalizations[key].value === category.localized);
            category.elem = button;
            if (!categoryButtonsHierarchy.some(cat => cat.localized === category.localized)) {
                categoryButtonsHierarchy.push(category);
            }
        });
    } else {
        buttons.shift(); // Skip the category clear button
        const currentParentLocalized = buttons[0].textContent;
        let currentParent = categoryButtonsHierarchy.find(category => category.localized === currentParentLocalized);
        if (!currentParent) {
            const category = {};
            category.localized = currentParentLocalized;
            category.identifier = Object.keys(categoryLocalizations).find(key => categoryLocalizations[key].value === category.localized);
            category.elem = buttons[0];
            categoryButtonsHierarchy.push(category);
            currentParent = category;
        }
        if (!currentParent.children) {
            currentParent.children = [];
        }
        buttons.shift(); // Skip the parent category button
        buttons.forEach((button, index) => {
            const category = {};
            category.localized = button.textContent;
            category.identifier = Object.keys(categoryLocalizations).find(key => categoryLocalizations[key].value === category.localized);
            category.elem = button;
            if (!currentParent.children.some(cat => cat.localized === category.localized)) {
                currentParent.children.push(category);
            }
        });
    }
    renderHeader();
    renderSidebar();
}

function onFolderChange() {
    categoryButtonsObserver.disconnect();
    categoryButtons = document.querySelector('.main-yourLibraryX-filterArea .search-searchCategory-categoryGrid [role="presentation"]');
    parseCategoryButtons();
    categoryButtonsObserver.observe(categoryButtons, { childList: true });
}

// Refresh the element reference in the category object
function refreshElement(category) {
    if (!document.contains(category.elem)) {
        for (const button of categoryButtons.querySelectorAll('button')) {
            if (button.textContent === category.localized) {
                category.elem = button;
                break;
            }
        }
    }
}

function isInRootCategory() {
    return !categoryButtons.querySelector('button[class*="ChipClear"]:first-child');
}

function isInParentCategory(parentCategory) {
    if (isInRootCategory()) {
        return false;
    }
    const buttons = Array.from(categoryButtons.querySelectorAll('button'));
    return buttons[1].textContent === parentCategory.localized;
}

async function goToRootCategory() {
    if (inFolder) {
        exitFolder();
        await waitForFolderChange();
    }
    categoryButtons.querySelector('button[class*="ChipClear"]:first-child')?.click();
};

function exitFolder() {
    exittingFolder = true;
    document.querySelectorAll('.main-yourLibraryX-collapseButton button')?.[1]?.click();
}

function getCurrentCategories(identifier = false) {
    const currentCategories = [];
    inFolder = document.querySelector('.main-yourLibraryX-collapseButton').childElementCount > 1;
    if (inFolder) {
        if (identifier) {
            return lastCategoriesIdentifier;
        }
        return lastCategories;
    } else if (isInRootCategory()) {
        lastCategories = [];
        lastCategoriesIdentifier = [];
        return currentCategories;
    } else {
        const buttons = Array.from(categoryButtons.querySelectorAll('button')).slice(1);
        let currentParent = buttons[0].textContent;
        if (identifier) {
            currentParent = Object.keys(categoryLocalizations).find(key => categoryLocalizations[key].value === currentParent);
        }
        currentCategories.push(currentParent);
        const activeChild = categoryButtons.querySelector('button[class*="secondary-selected"]');
        if (activeChild) {
            if (identifier) {
                currentCategories.push(Object.keys(categoryLocalizations).find(key => categoryLocalizations[key].value === activeChild.textContent));
            } else {
                currentCategories.push(activeChild.textContent);
            }
        }
        if (identifier) {
            lastCategoriesIdentifier = structuredClone(currentCategories);
        } else {
            lastCategories = structuredClone(currentCategories);
        }
    }
    return currentCategories;
}

async function go(identifiers) {
    if (inFolder) {
        exitFolder();
        await waitForFolderChange();
    }
    categoryButtonsObserver.disconnect();
    if (!isInRootCategory()) {
        goToRootCategory();
        if (identifiers.length === 0) {
            return;
        }
        await waitForCategoryButtonsUpdate();
    }
    for (let i = 0; i < identifiers.length; i++) {
        if (identifiers[i].startsWith('spotify:user:')) {
            await waitForListRender();
            document.querySelector('.main-yourLibraryX-libraryRootlist .main-rootlist-wrapper div[role="button"][aria-labelledby*="listrow-title-' + identifiers[i] + '"]').click();
        } else if (i === 0) {
            const category = categoryButtonsHierarchy.find(cat => cat.identifier === identifiers[i]);
            if (!category) {
                return;
            }
            refreshElement(category);
            category.elem.click();
            await waitForCategoryButtonsUpdate();
        } else {
            const parentCategory = categoryButtonsHierarchy.find(cat => cat.identifier === identifiers[i - 1]);
            if (!parentCategory) {
                return;
            }
            const category = parentCategory.children.find(cat => cat.identifier === identifiers[i]);
            if (!category) {
                return;
            }
            refreshElement(category);
            category.elem.click();
            await waitForCategoryButtonsUpdate();
        }
    }
    renderHeader();
    renderSidebar();
    categoryButtonsObserver.observe(categoryButtons, { childList: true });
}

function renderSidebar() {
    const sidebar = document.querySelector('#wmpotify-libx-sidebar');
    sidebar.innerHTML = '';
    const rootButtonContainer = document.createElement('div');
    rootButtonContainer.classList.add('wmpotify-libx-sidebar-item-container');
    const rootButton = document.createElement('button');
    rootButton.classList.add('wmpotify-libx-sidebar-item');
    rootButton.id = 'wmpotify-libx-sidebar-root';
    rootButton.textContent = Strings['LIBX_SIDEBAR_ROOT'];
    rootButton.addEventListener('click', goToRootCategory);
    const rootButtonChevron = document.createElement('div');
    rootButtonChevron.classList.add('wmpotify-libx-sidebar-chevron');
    rootButtonChevron.addEventListener('click', () => {
        sidebar.classList.toggle('rootCollapsed');
    });
    rootButtonContainer.appendChild(rootButtonChevron);
    rootButtonContainer.appendChild(rootButton);
    sidebar.appendChild(rootButtonContainer);
    categoryButtonsHierarchy.forEach(category => {
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('wmpotify-libx-sidebar-item-container');
        const button = document.createElement('button');
        button.classList.add('wmpotify-libx-sidebar-item');
        button.textContent = category.localized;
        button.dataset.identifier = category.identifier;
        button.addEventListener('click', async () => {
            if (button.classList.contains('active') && !inFolder) {
                return;
            }
            if (inFolder) {
                exitFolder();
                await waitForFolderChange();
            }
            categoryButtonsObserver.disconnect();
            if (!isInRootCategory()) {
                goToRootCategory();
                await waitForCategoryButtonsUpdate();
            }
            refreshElement(category);
            category.elem.click();
            categoryButtonsObserver.observe(categoryButtons, { childList: true });
        });
        buttonContainer.appendChild(button);
        sidebar.appendChild(buttonContainer);
        if (category.children && category.children.length > 0) {
            const buttonChevron = document.createElement('div');
            buttonChevron.classList.add('wmpotify-libx-sidebar-chevron');
            buttonChevron.addEventListener('click', () => {
                buttonContainer.classList.toggle('collapsed');
            });
            buttonContainer.insertBefore(buttonChevron, button);
            const downlevel = document.createElement('div');
            downlevel.classList.add('wmpotify-libx-sidebar-downlevel');
            category.children.forEach(child => {
                const childButton = document.createElement('button');
                childButton.classList.add('wmpotify-libx-sidebar-item');
                childButton.textContent = child.localized;
                childButton.dataset.identifier = child.identifier;
                childButton.addEventListener('click', async () => {
                    if (childButton.classList.contains('active') && !inFolder) {
                        return;
                    }
                    if (inFolder) {
                        exitFolder();
                        await waitForFolderChange();
                    }
                    categoryButtonsObserver.disconnect();
                    refreshElement(child);
                    if (!isInParentCategory(category) || !document.contains(child.elem)) {
                        if (!isInRootCategory()) {
                            goToRootCategory();
                            await waitForCategoryButtonsUpdate();
                        }
                        refreshElement(category);
                        category.elem.click();
                        await waitForCategoryButtonsUpdate();
                    }
                    refreshElement(child);
                    child.elem.click();
                    categoryButtonsObserver.observe(categoryButtons, { childList: true });
                });
                downlevel.appendChild(childButton);
            });
            sidebar.appendChild(downlevel);
        }
    });
    const activeCategories = getCurrentCategories();
    if (activeCategories.length > 0) {
        const activeCategory = activeCategories.pop();
        const activeButton = Array.from(sidebar.querySelectorAll('.wmpotify-libx-sidebar-item')).find(button => button.textContent === activeCategory);
        activeButton.classList.add('active');
    } else {
        rootButton.classList.add('active');
    }
}

function handleResize() {
    const origSidebarState = DirectUserStorage.getItem("ylx-sidebar-state");
    Spicetify.Platform.LocalStorageAPI.setItem("ylx-sidebar-state", 2);
    DirectUserStorage.setItem("ylx-sidebar-state", origSidebarState); // make the previous setItem temporary
}

function waitForLibXLoad() {
    if (!document.querySelector('.main-yourLibraryX-filterArea .search-searchCategory-categoryGrid [role="presentation"]')) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                if (document.querySelector('.main-yourLibraryX-filterArea .search-searchCategory-categoryGrid [role="presentation"]')) {
                    resolve();
                    observer.disconnect();
                }
            });
            observer.observe(document.querySelector('.main-yourLibraryX-libraryItemContainer'), { childList: true, subtree: true });
        });
    }
}

function waitForCategoryButtonsUpdate() {
    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            if (categoryButtons.querySelector('button')) {
                resolve();
                observer.disconnect();
            }
        });
        observer.observe(categoryButtons, { childList: true });
    });
}

function waitForFolderChange() {
    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            exittingFolder = false;
            resolve();
            observer.disconnect();
        });
        observer.observe(document.querySelector('.main-yourLibraryX-filterArea'), { childList: true });
    });
}

function waitForListRender() {
    if (!document.querySelector('.main-yourLibraryX-libraryRootlist .main-rootlist-wrapper [role="presentation"]:not([class])')) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                if (document.querySelector('.main-yourLibraryX-libraryRootlist .main-rootlist-wrapper [role="presentation"]:not([class])')) {
                    resolve();
                    observer.disconnect();
                }
            });
            observer.observe(document.querySelector('.main-yourLibraryX-libraryRootlist'), { childList: true, subtree: true });
        });
    }
}

function expandLibX() {
    if (document.querySelector('.main-yourLibraryX-filterArea + div')) { // fully expanded (level 2)
        return;
    }

    if (window.innerWidth < 1024) {
        window.resizeTo(1024 + window.outerWidth - window.innerWidth, window.outerHeight);
    }

    if (!document.querySelector('.main-yourLibraryX-filterArea')) { // collapsed (level 1)
        document.querySelector('.main-yourLibraryX-collapseButton button')?.click();
    }
    if (document.querySelector('.main-yourLibraryX-filterArea + div')) { // fully expanded (level 2)
        return;
    }

    let fullExpand = document.querySelector('.main-yourLibraryX-headerContent > button:last-child') || document.querySelector('.main-yourLibraryX-headerContent > div:last-child > button:last-child');
    if (fullExpand) {
        fullExpand.click();
    } else {
        const observer = new MutationObserver(() => {
            fullExpand = document.querySelector('.main-yourLibraryX-headerContent > button:last-child') || document.querySelector('.main-yourLibraryX-headerContent > div:last-child > button:last-child');
            if (fullExpand) {
                fullExpand.click();
                observer.disconnect();
            }
        });
        observer.observe(document.querySelector('.main-yourLibraryX-headerContent'), { childList: true, subtree: true });
    }
}

// Intended only for calling when the sidebar is fully expanded
function collapseLibX(level = 1) {
    if (![0, 1].includes(level)){
        return;
    }

    if (level === 1) {
        document.querySelector('.main-yourLibraryX-collapseButton button')?.click();
    } else if (level === 0) {
        (document.querySelector('.main-yourLibraryX-headerContent > button:first-child') || document.querySelector('.main-yourLibraryX-headerContent > div:last-child > button:last-child'))?.click();
    }
}

export default CustomLibX;