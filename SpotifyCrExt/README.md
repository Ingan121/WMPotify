## Spotify API Extender
A Chrome extension that gives Spicetify extensions and themes extended API capabilities to manage windows and fetch cross-origin resources.

### Installation
1. Run `spicetify enable-devtools` to enable DevTools
2. Right click any empty space, or go to the menu -> Develop, and click `Show Chrome Tools`
3. Click the `chrome://extensions` link
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the extension directory

### Notes
* Spotify disables all Chrome extensions by default, unless DevTools is enabled.
* Forcing extensions to be always enabled:
    * Windows: Install my [CEF/Spotify Tweaks mod](https://windhawk.net/mods/cef-titlebar-enabler-universal) and enable the `Force enable Chrome extensions` option in the mod settings page. This option is enabled by default.
    * macOS/Linux: Patch the Spotify binary (or the Spotify library on 1.2.70+) with a hex editor to change the `disable-extensions` flag to something else.
* Installing the Manifest V2 version on Spotify 1.2.70 and newer will somehow crash the Spotify client from the next launch. Only use the Manifest V3 version on Spotify 1.2.70+.
    * If you're experiencing crashes caused by the MV2 extension, delete `%localappdata%/Spotify` (or equivalent CEF web data directory for your platform).

### API Documentation
#### `window.SpotEx.openWindow(createData)`
* Opens a new window with the specified `createData`.
* `createData`: Same as the `createData` in [chrome.windows.create](https://developer.chrome.com/docs/extensions/reference/windows/#method-create)
#### `window.SpotEx.updateWindow(updateInfo)`
* Updates the main Spotify window with the provided `updateInfo`.
* `updateInfo`: Same as the `updateInfo` in [chrome.windows.update](https://developer.chrome.com/docs/extensions/reference/windows/#method-update)
#### `window.SpotEx.getWindow()`
* Retrieves the information about the main Spotify window.
* Returns a Promise that resolves to the window information.
* Returned data format: Same as the Chrome extension's [Windows type](https://developer.chrome.com/docs/extensions/reference/api/windows#type-Window)
#### `window.SpotEx.fetch(url, options, responseType)`
* Fetches a resource from the specified `url`. This bypasses the same-origin policy.
    * `url`: The URL of the resource to fetch.
    * `options`: Fetch options, such as method and headers.
    * `responseType`: `json`, `text`, or `raw` (`text` if not specified)
* Returns a Promise that resolves to the fetched data.
* Returned data format: Object with `ok`, `status`, `result`, and `error` properties.
    * `ok`: A boolean indicating whether the fetch was successful.
    * `status`: The HTTP status code of the response.
    * `result`: The parsed response data (if successful).
    * `error`: The error message (if failed).
* Result format: Depends on the `responseType`.
    * `json`: The parsed JSON object.
    * `text`: The response text.
    * `raw`: Base64-encoded data URL of the raw response data.