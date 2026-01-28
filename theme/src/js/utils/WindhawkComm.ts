'use strict';

// CEF/Spotify Tweaks Windhawk mod communication
// See <repository root>/cte.wh.cpp for the Windhawk mod implementation
// https://windhawk.net/mods/cef-titlebar-enabler-universal

export interface WindhawkModOptions {
    'showframe': boolean;
    'showframeonothers': boolean;
    'showmenu': boolean;
    'showcontrols': boolean;
    'transparentcontrols': boolean;
    'transparentrendering': boolean;
    'ignoreminsize': boolean;
    'noforceddarkmode': boolean;
    'forceextensions': boolean;
    'blockupdates': boolean;
    'allowuntested': boolean;
}

export interface WindhawkQueryResult {
    'isMaximized': boolean;
    'isTopMost': boolean;
    'isLayered': boolean;
    'isTransparent': boolean;
    'isThemingEnabled': boolean;
    'isDwmEnabled': boolean;
    'hwAccelerated': boolean;
    'minWidth': number;
    'minHeight': number;
    'titleLocked': boolean;
    'dpi': number;
    'speedModSupported': boolean;
    'playbackSpeed'?: number;
    'immediateSpeedChange'?: boolean;
    'options': WindhawkModOptions;
}

export interface WindhawkModule {
    query(): WindhawkQueryResult;
    extendFrame(left: number, right: number, top: number, bottom: number): void;
    minimize(): void;
    maximizeRestore(): void;
    close(): void;
    focus(): void;
    setLayered(layered: boolean, alpha?: number, color?: string): void;
    setTransparent(transparent: boolean): void;
    setBackdrop(backdropType: 'none' | 'mica' | 'acrylic' | 'tabbed'): void;
    resizeTo(width: number, height: number): void;
    setMinSize(minWidth: number, minHeight: number): void;
    setTopMost(topMost: boolean): void;
    setTitle(title: string): void;
    lockTitle(lock: boolean): void;
    openSpotifyMenu(): void;
    setPlaybackSpeed?(speed: number): void;

    'initialOptions': WindhawkModOptions;
    'version': string;
}

declare global {
    interface Window {
        // Spotify built-in CEF bindings
        cancelEsperantoCall: (moduleName: string) => WindhawkModule;
        _getSpotifyModule: (moduleName: string) => WindhawkModule;
    }
}

class WindhawkComm {
    static module: WindhawkModule | null = null;
    static lastDpi: number = 1;

    static init() {
        if (!navigator.userAgent.includes("Windows")) {
            return;
        }
        try {
            WindhawkComm.module = (window.cancelEsperantoCall || window._getSpotifyModule)("ctewh");
            if (!WindhawkComm.module) {
                console.log("Windhawk mod not available");
                return;
            }
            WindhawkComm.lastDpi = WindhawkComm.module.query().dpi / 96;
            const { version, initialOptions } = WindhawkComm.module;
            console.log(`CEF/Spotify Tweaks Windhawk mod available, Version: ${version}`);
            window.addEventListener("resize", () => {
                if (WindhawkComm.module) {
                    WindhawkComm.lastDpi = WindhawkComm.module.query().dpi / 96;
                }
            });
        } catch (e) {
            // query fails if the main browser process has unloaded the mod and thus closed the pipe
            WindhawkComm.module = null;
            console.log("Windhawk mod not available");
        }
    }

    static query() {
        if (WindhawkComm.module) {
            return WindhawkComm.module.query();
        }
        return null;
    }

    // (int, int, int, int)
    // To disable: (0, 0, 0, 0)
    // To extend to full window: (-1, -1, -1, -1)
    static extendFrame(left: number, right: number, top: number, bottom: number) {
        if (WindhawkComm.module?.extendFrame) {
            [left, right, top, bottom] = [left, right, top, bottom].map(v => Math.round(v * window.devicePixelRatio));
            if (WindhawkComm.lastDpi > 1) { // Fix for Windows DPI scaling
                [left, right] = [left && left - 1, right && right - 1];
                [top, bottom] = [top && top - 1, bottom && bottom - 1];
            }
            WindhawkComm.module.extendFrame(left, right, top, bottom);
        }
    }

    static minimize() {
        if (WindhawkComm.module?.minimize) {
            WindhawkComm.module.minimize();
        }
    }

    static maximizeRestore() {
        if (WindhawkComm.module?.maximizeRestore) {
            WindhawkComm.module.maximizeRestore();
        }
    }

    static close() {
        if (WindhawkComm.module?.close) {
            WindhawkComm.module.close();
        }
    }

    // (bool, optional int 0-255, optional string)
    // color: RRGGBB hex, makes this color transparent and click-through
    // Hardware acceleration must be disabled for color to work
    static setLayered(layered: boolean, alpha?: number, color?: string) {
        if (WindhawkComm.module?.setLayered) {
            WindhawkComm.module.setLayered(layered, alpha, color);
        }
    }

    // (bool)
    static setTransparent(transparent: boolean) {
        if (WindhawkComm.module?.setTransparent) {
            WindhawkComm.module.setTransparent(transparent);
        }
    }

    // (string - none, mica, acrylic, tabbed)
    static setBackdrop(backdropType: 'none' | 'mica' | 'acrylic' | 'tabbed') {
        if (WindhawkComm.module?.setBackdrop) {
            WindhawkComm.module.setBackdrop(backdropType);
        }
    }

    // (int, int)
    // Ignores min/max size
    static resizeTo(width: number, height: number) {
        if (WindhawkComm.module?.resizeTo) {
            WindhawkComm.module.resizeTo(width, height);
        }
    }

    // (int, int)
    static setMinSize(width: number, height: number) {
        if (WindhawkComm.module?.setMinSize) {
            [width, height] = [width, height].map(v => Math.round(v * window.devicePixelRatio));
            WindhawkComm.module.setMinSize(width, height);
        }
    }

    // (bool)
    static setTopMost(topMost: boolean) {
        if (WindhawkComm.module?.setTopMost) {
            WindhawkComm.module.setTopMost(topMost);
        }
    }

    // (string - max 255 characters)
    static setTitle(title: string) {
        if (WindhawkComm.module?.setTitle) {
            WindhawkComm.module.setTitle(title);
        }
    }

    // (bool)
    static lockTitle(lock: boolean) {
        if (WindhawkComm.module?.lockTitle) {
            WindhawkComm.module.lockTitle(lock);
        }
    }

    static openSpotifyMenu() {
        if (WindhawkComm.module?.openSpotifyMenu) {
            WindhawkComm.module.openSpotifyMenu();
        }
    }

    // (double - 1.0 is normal speed, must be > 0 and <= 5.0)
    // Win64 only
    static setPlaybackSpeed(speed: number | string) {
        if (WindhawkComm.module?.setPlaybackSpeed) {
            if (typeof speed === 'string') {
                speed = parseFloat(speed);
            }
            WindhawkComm.module.setPlaybackSpeed(speed);
        }
    }

    static available() {
        return !!WindhawkComm.module;
    }

    static getModule() {
        return WindhawkComm.module;
    }
}

export default WindhawkComm;