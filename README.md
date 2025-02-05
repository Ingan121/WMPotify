# <img src="https://raw.githubusercontent.com/Ingan121/WMPotify/refs/heads/master/theme/src/resources/icon/wmpotify_48.png"> WMPotify
* A Windows Media Player 11 inspired Spicetify theme for Spotify
* Supported versions: 1.2.45 - 1.2.56
    * Primarily tested on 1.2.52
    * 1.2.45: global navbar must be enabled in the experimental features
    * 1.2.44 and below are not supported

## **Installation** / Updating

### **Manual installation using Scripts (recomended):**

#### **Windows (Powershell)**

* WMPotify + WMPotify NowPlaying + Windhawk + CEF/Spotify Tweaks mod
    * This script detects whether Spotify, Spiceify, Windhawk, and CEF/Spotify Tweaks mod are installed or not. If not, it will install them.
    * If Windhawk is installed and CEF/Spotify Tweaks mod is up-to-date, the installation of these two will be skipped.

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
iex "& { $(iwr -useb 'https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.ps1') }"
```

* Theme only:
```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
iex "& { $(iwr -useb 'https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.ps1') } -Install @('wmpotify')"
```

* WMPotify NowPlaying only:
```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
iex "& { $(iwr -useb 'https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.ps1') } -Install @('wmpvis')"
```

#### **Linux/macOS (Bash)**

* Note: Not tested on macOS yet

* WMPotify + WMPotify NowPlaying
```bash
curl -fsSL https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.sh | sh
```

* WMPotify NowPlaying only:
```bash
export SKIP_THEME=true
curl -fsSL https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.sh | sh
```

### **Manual installation**
1. Download the latest release from the [releases page](https://github.com/Ingan121/WMPotify/releases)
2. Locate Spicetify directories: use `spicetify config-dir` or `spicetify path userdata`
3. Extract the contents of the WMPotify zip to the `Themes\WMPotify` folder in the Spicetify directory. Create the `Themes\WMPotify` folder if it doesn't exist.
4. Extract the contents of the WMPotify NowPlaying zip to the `CustomApps\wmpvis` folder in the Spicetify directory. Create the `CustomApps\wmpvis` folder if it doesn't exist.
5. Run the following commands in Command Prompt / PowerShell / Terminal:
    ```cmd
    spicetify config inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1
    spicetify config current_theme WMPotify
    spicetify config custom_apps wmpvis
    spicetify apply
    ```
6. Windows only: Install [Windhawk](https://windhawk.net/) and [CEF/Spotify Tweaks mod](https://windhawk.net/mods/cef-titlebar-enabler-universal) for the full experience (optional but recommended)

### **Using Spicetify Marketplace (simpler installation):**

1. Install the `spicetify-marketplace` extension following its instructions: [https://github.com/spicetify/marketplace/wiki/Installation](https://github.com/spicetify/marketplace/wiki/Installation).
2. Search for "WMPotify" in the Spicetify Marketplace and click "Install."
* Warning: The Spicetify Marketplace version may load slowly due to the large number of images in the theme.

## **Uninstallation**

### **Manual uninstallation using Scripts (recomended):**

#### **Windows (Powershell)**
```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
iex "& { $(iwr -useb 'https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/install.ps1') } -Action Uninstall"
```

#### **Linux/macOS (Bash)**
```bash
curl -fsSL https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/uninstall.sh | sh
```

## **Screenshots**

### Home

* Aero
![home_aero](screenshots/home_aero.png)

* Basic
![home_basic](screenshots/home_basic.png)

* XP
![home_xp](screenshots/home_xp.png)

### Mini Mode

* Aero

    ![minimode_aero](screenshots/minimode_aero.png)

* Basic

    ![minimode_basic](screenshots/minimode_basic.png)

* XP

    ![minimode_xp](screenshots/minimode_xp.png)

### Now Playing

* Aero
![wmpvis_aero](screenshots/wmpvis_aero.png)

* Basic
![wmpvis_basic](screenshots/wmpvis_basic.png)

* XP
![wmpvis_xp](screenshots/wmpvis_xp.png)

* Menu
![wmpvis_menu](screenshots/wmpvis_menu_xp.png)

* Bars Visualization
![wmpvis_bars](screenshots/wmpvis_bars_xp.png)

### Library

* Compact
![library_compact_aero](screenshots/library_compact_aero.png)

* List
![library_list_aero](screenshots/library_list_aero.png)

* Grid
![library_grid_aero](screenshots/library_grid_aero.png)

### Settings

* General
![config_general_xp](screenshots/config_general_xp.png)

* Color Customization
![color_applied_aero](screenshots/color_applied_aero.png)
![color_applied_xp](screenshots/color_applied_xp.png)

* Playback Speed Control
![config_speed_aero](screenshots/config_speed_aero.png)

### Full Screen

* Aero / Basic
![fullscreen_aero](screenshots/fullscreen_aero.png)
(I know this is Windows Media Player 12, but I don't like Vista WMP11 fullscreen design)

* XP
![fullscreen_xp](screenshots/fullscreen_xp.png)

### Others

* Playlist
![playlist_aero](screenshots/playlist_aero.png)
![playlist_basic](screenshots/playlist_basic.png)

* Playlist (Scrolled)
![playlist_scrolled_aero](screenshots/playlist_scrolled_aero.png)

* Search
![search_xp](screenshots/search_xp.png)

* Discography
![discography_aero](screenshots/discography_aero.png)

## Frequently Asked Questions
1. **Q:** Queue list does not show up in the right panel
    * **A:** Check `Enable Queue on the right panel.` in the user button -> `Experimental features`.
    * If this still does not work and the Experimental features popup shows `Using fallback mode`, you need to downgrade Spotify to a version fully supported by Spicetify. Old releases are available [here](https://docs.google.com/spreadsheets/d/1wztO1L4zvNykBRw7X4jxP8pvo11oQjT0O5DvZ_-S4Ok/edit?pli=1&gid=803394557#gid=803394557)
2. **Q:** Aero Glass or the mini mode does not work
    * **A:** Currently those features are only available on Windows, and if you have installed the [CEF/Spotify Tweaks](https://windhawk.net/mods/cef-titlebar-enabler-universal) [Windhawk](https://windhawk.net/) mod. macOS and Linux are not supported now, and it needs more research to implement them.
    * For the mini mode, you might get it working by force resizing the window to a smaller size with an external tool. I will implement a custom miniplayer in the future that looks like the mini mode.

## TODO
* Dark mode support + dynamic theme support

## Credits
* [Spicetify](https://spicetify.app/)
* [Spotify](https://www.spotify.com/)
* wmploc.dll resources from Windows Media Player 11(+12) by Microsoft Corporation
* authui.dll resources from Windows Vista by Microsoft Corporation
* Some codes from [spicetify-visualizer](https://github.com/Konsl/spicetify-visualizer) by Konsl
* [7.css](https://khang-nd.github.io/7.css) by Khang-ND - used for some controls like buttons, menus, etc. Actually from my own fork from ModernActiveDesktop
* [font-detective](https://github.com/1j01/font-detective) by 1j01
* [Butterchurn](https://butterchurnviz.com/) by Jordan Berg, based on [MilkDrop](https://en.wikipedia.org/wiki/MilkDrop) by Geiss
* Some codes from [Butterchurn adaptation for Wallpaper Engine](https://steamcommunity.com/sharedfiles/filedetails/?id=2962616483) by SeiferX7
* Some inspiration from [this concept image](https://x.com/tehmondspartan/status/1671430592087613441) by MondySpartan (user button, lyrics overlay on top of visualization, etc.)
* Installation PowerShell script from [Spicetify-Lucid](https://github.com/sanoojes/Spicetify-Lucid) by sanoojes
* Some codes are from my previous [ModernActiveDesktop](https://github.com/Ingan121/ModernActiveDesktop) project
* For the CEF/Spotify Tweaks mod:
    * [Windhawk](https://windhawk.net/)
    * [Visual Studio Anti-Rich-Header](https://windhawk.net/mods/visual-studio-anti-rich-header) by m417z
    * [Chrome UI Tweaks](https://windhawk.net/mods/chrome-ui-tweaks) by Vasher
    * [Chromium Embedded Framework](https://bitbucket.org/chromiumembedded/cef)
    * [Chromium](https://www.chromium.org/)
