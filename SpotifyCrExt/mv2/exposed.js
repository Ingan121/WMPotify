const extensionId = document.currentScript.dataset.extensionId;

window.SpotEx = {
    openWindow(createData) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(extensionId, { action: "openWindow", createData: createData }, (response) => {
                if (response.ok) {
                    resolve(response.window);
                } else {
                    reject(response.error);
                }
            });
        });
    },

    updateWindow(updateInfo) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(extensionId, { action: "updateWindow", updateInfo: updateInfo }, (response) => {
                if (response.ok) {
                    resolve();
                } else {
                    reject(response.error);
                }
            });
        });
    },

    getWindow(getOptions) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(extensionId, { action: "getWindow", getOptions: getOptions }, (response) => {
                if (response.ok) {
                    resolve(response.window);
                } else {
                    reject(response.error);
                }
            });
        });
    },

    fetch(url, options, responseType = "text") {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(extensionId, { action: "fetch", url: url, options: options, responseType: responseType }, (response) => {
                if (response.error) {
                    reject(response.error);
                } else {
                    resolve(response);
                }
            });
        });
    }
}

window.addEventListener("load", function() {
    let attempts = 0;
    const interval = setInterval(() => {
        if (window.Spicetify) {
            try {
                new Spicetify.Menu.Item(
                    "Manage Chrome Extensions",
                    false, 
                    () => {
                        window.SpotEx.openWindow({ url: "chrome://extensions", type: "popup" });
                    }
                ).register();
                clearInterval(interval);
            } catch {
                // Not ready
                attempts++;
            }
        } else {
            attempts++;
        }
        if (attempts > 100) {
            clearInterval(interval);
        }
    }, 100);
});

console.log("Spotify API Extender loaded");