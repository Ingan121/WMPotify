'use strict';

import ControlManager from "../managers/ControlManager";
import WindhawkComm from "../WindhawkComm";

let titleBar = null;

function createTitlebarSkeleton() {
    titleBar = document.createElement('div');
    titleBar.id = 'wmpotify-title-bar';
    const titleIcon = document.createElement('div');
    titleIcon.id = 'wmpotify-title-icon';
    titleIcon.addEventListener('click', () => {
        titleIcon.classList.toggle('logo2013');
        if (titleIcon.classList.contains('logo2013')) {
            localStorage.wmpotifyUse2013Icon = true;
        } else {
            delete localStorage.wmpotifyUse2013Icon;
        }
    });
    if (localStorage.wmpotifyUse2013Icon) {
        titleIcon.classList.add('logo2013');
    }
    titleIcon.addEventListener('dblclick', () => {
        closeWindow();
    });
    titleBar.appendChild(titleIcon);
    document.body.appendChild(titleBar);
}

async function initTitlebar(mode) {
    const whStatus = WindhawkComm.query();

    switch (mode) {
        case 'native':
            new ControlManager(1);
            break;
        case 'custom':
            new ControlManager(1);
        case 'keepmenu':
            const titleButtons = document.createElement('div');
            titleButtons.id = 'wmpotify-title-buttons';
            if (window.SpotEx || whStatus) {
                const minimizeButton = document.createElement('button');
                minimizeButton.id = 'wmpotify-minimize-button';
                minimizeButton.addEventListener('click', () => {
                    if (whStatus) {
                        WindhawkComm.minimize();
                    } else {
                        SpotEx.updateWindow({ state: 'minimized' });
                    }
                });
                titleButtons.appendChild(minimizeButton);
                const maximizeButton = document.createElement('button');
                maximizeButton.id = 'wmpotify-maximize-button';
                maximizeButton.addEventListener('click', async () => {
                    if (whStatus) {
                        WindhawkComm.maximizeRestore();
                    } else {
                        if ((await SpotEx.getWindow()).state === 'maximized') {
                            SpotEx.updateWindow({ state: 'normal' });
                        } else {
                            SpotEx.updateWindow({ state: 'maximized' });
                        }
                    }
                });
                titleButtons.appendChild(maximizeButton);
                window.addEventListener('resize', updateWindowStatus);
                updateWindowStatus();

                async function updateWindowStatus() {
                    if (whStatus) {
                        if (WindhawkComm.query().isMaximized) {
                            maximizeButton.dataset.maximized = true;
                        } else {
                            delete maximizeButton.dataset.maximized;
                        }
                    } else {
                        if ((await SpotEx.getWindow()).state === 'maximized') {
                            maximizeButton.dataset.maximized = true;
                        } else {
                            delete maximizeButton.dataset.maximized;
                        }
                    }
                }
            }
            const closeButton = document.createElement('button');
            closeButton.id = 'wmpotify-close-button';
            closeButton.addEventListener('click', () => {
                closeWindow();
            });
            titleButtons.appendChild(closeButton);
        case 'spotify':
            if (titleBar === null) {
                createTitlebarSkeleton();
            }
            const titleText = document.createElement('span');
            titleText.id = 'wmpotify-title-text';
            titleText.textContent = await Spicetify.AppTitle.get();
            titleBar.appendChild(titleText);
            if (mode === 'custom' || mode === 'keepmenu') {
                titleBar.appendChild(titleButtons);
            }
            if (mode === 'keepmenu' || mode === 'spotify') {
                new ControlManager(25);
            }
            Spicetify.AppTitle.sub((title) => {
                if (title?.trim()) {
                    titleText.textContent = title;
                }
            });
            break;
    }
}

async function closeWindow() {
    if (WindhawkComm.available()) {
        WindhawkComm.close();
    } else {
        window.close();
    }
}

class CustomTitlebar {
    static earlyInit = createTitlebarSkeleton;
    static init = initTitlebar;
};

export default CustomTitlebar;