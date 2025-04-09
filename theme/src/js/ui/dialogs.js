'use strict';

import Strings from '../strings';

export function confirmModal(title = "WMPotify", message, confirmText = Strings['UI_OK'], cancelText = Strings['UI_CANCEL']) {
    return new Promise((resolve, reject) => {
        const modalContent = document.createElement('div');
        modalContent.id = 'wmpotify-confirm-modal';
        const msgElem = document.createElement('p');
        msgElem.textContent = message;
        modalContent.appendChild(msgElem);

        const observer = new MutationObserver(() => {
            if (!document.contains(modalContent)) {
                observer.disconnect();
                resolve(false);
            }
        });
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('wmpotify-modal-bottom-buttons');
        const okButton = document.createElement('button');
        okButton.classList.add('wmpotify-aero');
        okButton.textContent = confirmText;
        okButton.addEventListener('click', (event) => {
            observer.disconnect();
            Spicetify.PopupModal.hide();
            resolve(true);
            event.preventDefault();
            event.stopPropagation();
        });
        buttonContainer.appendChild(okButton);
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('wmpotify-aero');
        cancelButton.textContent = cancelText;
        cancelButton.addEventListener('click', (event) => {
            observer.disconnect();
            Spicetify.PopupModal.hide();
            resolve(false);
            event.preventDefault();
            event.stopPropagation();
        });
        buttonContainer.appendChild(cancelButton);
        modalContent.appendChild(buttonContainer);
        Spicetify.PopupModal.display({ title: title, content: modalContent });
        observer.observe(document.body, { childList: true });
    });
}

export function promptModal(title = "WMPotify", message, text, hint) {
    return new Promise((resolve, reject) => {
        const modalContent = document.createElement('div');
        modalContent.id = 'wmpotify-prompt-modal';
        const msgElem = document.createElement('p');
        msgElem.textContent = message;
        modalContent.appendChild(msgElem);
        const input = document.createElement('input');
        input.classList.add('wmpotify-aero');
        input.type = 'text';
        input.value = text;
        input.placeholder = hint;
        input.style.width = '100%';
        modalContent.appendChild(input);

        const observer = new MutationObserver(() => {
            if (!document.contains(modalContent)) {
                observer.disconnect();
                resolve(null);
            }
        });
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('wmpotify-modal-bottom-buttons');
        const okButton = document.createElement('button');
        okButton.classList.add('wmpotify-aero');
        okButton.textContent = Strings['UI_OK'];
        okButton.addEventListener('click', (event) => {
            observer.disconnect();
            Spicetify.PopupModal.hide();
            resolve(input.value);
            event.preventDefault();
            event.stopPropagation();
        });
        buttonContainer.appendChild(okButton);
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('wmpotify-aero');
        cancelButton.textContent = Strings['UI_CANCEL'];
        cancelButton.addEventListener('click', (event) => {
            observer.disconnect();
            Spicetify.PopupModal.hide();
            resolve(null);
            event.preventDefault();
            event.stopPropagation();
        });
        buttonContainer.appendChild(cancelButton);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                okButton.click();
            } else if (event.key === 'Escape') {
                cancelButton.click();
            }
        });
        modalContent.appendChild(buttonContainer);
        Spicetify.PopupModal.display({ title: title, content: modalContent });
        input.focus();
        observer.observe(document.body, { childList: true });
    });
}

export async function openWmpvisInstallDialog() {
    const dialogContent = document.createElement('div');
    dialogContent.id = 'wmpotify-instructions-dialog';
    dialogContent.innerHTML = `
        <p>${Strings['WMPVIS_INSTALL_DESC']}</p><br>
        <img src="https://raw.githubusercontent.com/Ingan121/WMPotify/refs/heads/master/screenshots/wmpvis_aero_2.png" alt="WMPotify NowPlaying screenshot"><br><br>
        <p>${Strings['WMPVIS_INSTALL_STEPS']}</p><br>
        <ol>
            <li>1. ${Strings['WMPVIS_INSTALL_STEP1']}</li>
            <div class="wmpotify-code-container">
                <button id="wmpotify-copy-code">
                    ${/* https://icons.getbootstrap.com/icons/copy/ */ ''}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                    </svg>
                </button>
                <code>
                ${navigator.userAgent.includes('Windows') ?
                    'iex "& { $(iwr -useb \'<a href="https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.ps1">https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.ps1</a>\') } -Install @(\'wmpvis\')"' :
                    'export SKIP_THEME=true; curl -fsSL <a href="https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.sh">https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.sh</a> | sh'
                }
                </code>
            </div>
            <li>2. ${Strings[navigator.userAgent.includes('Windows') ? 'WMPVIS_INSTALL_STEP2' : 'WMPVIS_INSTALL_STEP2_UNIX']}</li>
            <li>3. ${Strings['WMPVIS_INSTALL_STEP3']}</li>
        </ol><br>
        <p>${Strings.getString('WMPVIS_INSTALL_MORE_INFO', `<a href="https://github.com/Ingan121/Spicetify-CustomApps">${Strings['UI_CLICK_HERE']}</a>`)}</p>
        <p>${Strings.getString('WMPVIS_INSTALL_HIDE', `<a href="javascript:localStorage.wmpotifyNoWmpvis=true;document.querySelector('#wmpotify-tabs-container button[data-identifier=now-playing]').dataset.hidden=true;Spicetify.PopupModal.hide();window.dispatchEvent(new Event('resize'))">${Strings['UI_CLICK_HERE']}</a>`)}</p>
    `;
    Spicetify.PopupModal.display({
        title: Strings['WMPVIS_INSTALL_TITLE'],
        content: dialogContent,
        isLarge: true
    });
    document.querySelector('#wmpotify-copy-code').addEventListener('click', () => {
        const command = document.querySelector('#wmpotify-instructions-dialog code').textContent.trim();
        Spicetify.Platform.ClipboardAPI.copy(command);
    });
}

export async function openUpdateDialog(alreadyUpdated, tagName, content) {
    let version = tagName;
    let changelog = 'Failed to fetch changelog!';
    if (content) {
        changelog = content.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
    } else {
        try {
            const res = await fetch('https://api.github.com/repos/Ingan121/WMPotify/releases/latest');
            const data = await res.json();
            version = data.name;
            changelog = data.body?.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>') || '';
        } catch (e) {
            // omg api rate limit
            changelog = Strings.getString('THEME_CHANGELOG_PLACEHOLDER', `<a href="https://github.com/Ingan121/WMPotify/releases/tag/${version}">${Strings['UI_CLICK_HERE']}</a>`);
        }
    }

    const dialogContent = document.createElement('div');
    dialogContent.id = 'wmpotify-instructions-dialog';
    dialogContent.innerHTML = `
        <p>${Strings.getString('THEME_UPDATE_INFO', version)}</p>
        <div class="wmpotify-code-container">
            <p>${changelog}</p>
        </div>
        ${alreadyUpdated ? '' : `
            <p>${Strings['THEME_UPDATE_STEPS']}</p><br>
            <ol>
                <li>1. ${Strings['WMPVIS_INSTALL_STEP1']}</li>
                <div class="wmpotify-code-container">
                    <button id="wmpotify-copy-code">
                        ${/* https://icons.getbootstrap.com/icons/copy/ */ ''}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                        </svg>
                    </button>
                    <code>
                    ${navigator.userAgent.includes('Windows') ?
                        'iex "& { $(iwr -useb \'<a href="https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.ps1">https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.ps1</a>\') }"' :
                        'curl -fsSL <a href="https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.sh">https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.sh</a> | sh'
                    }
                    </code>
                </div>
                <li>2. ${Strings[navigator.userAgent.includes('Windows') ? 'WMPVIS_INSTALL_STEP2' : 'WMPVIS_INSTALL_STEP2_UNIX']}</li>
                <li>3. ${Strings['WMPVIS_INSTALL_STEP3']}</li>
            </ol><br>
            <p>${Strings.getString('WMPVIS_INSTALL_MORE_INFO', `<a href="https://github.com/Ingan121/WMPotify">${Strings['UI_CLICK_HERE']}</a>`)}</p>
            <button class="wmpotify-aero" onclick="localStorage.wmpotifyIgnoreVersion='${tagName}';Spicetify.PopupModal.hide();">${Strings['THEME_UPDATE_DISMISS']}</button>
        `}
    `;
    Spicetify.PopupModal.display({
        title: Strings['THEME_UPDATE_TITLE'],
        content: dialogContent,
        isLarge: !alreadyUpdated
    });
    if (!alreadyUpdated) {
        document.querySelector('#wmpotify-copy-code').addEventListener('click', () => {
            const command = document.querySelector('#wmpotify-instructions-dialog code').textContent.trim();
            Spicetify.Platform.ClipboardAPI.copy(command);
        });
    }
}