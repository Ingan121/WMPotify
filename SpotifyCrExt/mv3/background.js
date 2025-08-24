chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.action === "openWindow") {
        try {
            chrome.windows.create(request.createData, (window) => {
                sendResponse({ ok: true, window: window });
            });
        } catch (error) {
            sendResponse({ ok: false, error: error.message });
        }
        return true;
    }
    if (request.action === "updateWindow") {
        getSpotifyWindowId().then((windowId) => {
            try {
                chrome.windows.update(windowId, request.updateInfo);
                sendResponse({ ok: true });
            } catch (error) {
                sendResponse({ ok: false, error: error.message });
            }
        });
        return true;
    }
    if (request.action === "getWindow") {
        getSpotifyWindowId().then((windowId) => {
            try {
                chrome.windows.get(windowId, request.getOptions, (window) => {
                    sendResponse({ ok: true, window: window });
                });
            } catch (error) {
                sendResponse({ ok: false, error: error.message });
            }
        });
        return true;
    }
    if (request.action === "fetch") {
        fetch(request.url, request.options).then((response) => {
            const responseToReturn = { ok: response.ok, status: response.status };
            switch (request.responseType) {
                case "json":
                    response.json().then((json) => {
                        responseToReturn.result = json;
                        sendResponse(responseToReturn);
                    }).catch((error) => {
                        responseToReturn.error = error.message;
                        sendResponse(responseToReturn);
                    });
                    break;
                case "text":
                    response.text().then((text) => {
                        responseToReturn.result = text;
                        sendResponse(responseToReturn);
                    }).catch((error) => {
                        responseToReturn.error = error.message;
                        sendResponse(responseToReturn);
                    });
                    break;
                case "raw":
                    response.blob().then((blob) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            responseToReturn.result = reader.result;
                            sendResponse(responseToReturn);
                        }
                        reader.onerror = (error) => {
                            responseToReturn.error = error.message;
                            sendResponse(responseToReturn);
                        }
                        reader.readAsDataURL(blob);
                    }).catch((error) => {
                        responseToReturn.error = error.message;
                        sendResponse(responseToReturn);
                    });
                    break;
            }
        }).catch((error) => {
            sendResponse({ error: error.message });
        });
        return true;
    }
});

function getSpotifyWindowId() {
    return new Promise((resolve) => {
        chrome.windows.getAll({ populate: true, windowTypes: ["popup"] }, (windows) => {
            windows.forEach((window) => {
                if (window.tabs[0].url === "https://xpui.app.spotify.com/index.html") {
                    resolve(window.id);
                }
            });
        });
    });
}