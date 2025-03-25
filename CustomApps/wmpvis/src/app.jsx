'use strict';

import React from 'react'
import Strings from './strings';
import { init, updateVisConfig, uninit } from './wmpvis';
import ButterchurnAdaptor from './butterchurn/adaptor';
import MadVisLyrics from './lyrics/main';
import lrcCache from './lyrics/caching';
import { checkUpdates } from './UpdateCheck';
import { openConfigDialog } from './config';

let appInstance = null;

class App extends React.Component {
  constructor(props) {
    super(props);
    appInstance = this;
    this.props = props;
    this.elemRefs = {
      root: React.createRef(),
      albumArt: React.createRef(),
      visBar: React.createRef(),
      visTop: React.createRef(),
      visBC: React.createRef(),
      debug: React.createRef(),
      lyrics: React.createRef()
    };
    this.state = {
      type: localStorage.wmpotifyVisType || "bars",
      bgColor:
        ((localStorage.wmpotifyVisType === "albumArt" || localStorage.wmpotifyVisUseSchemeColors) && !localStorage.wmpotifyVisBgColor) ?
          "var(--spice-main)" :
          localStorage.wmpotifyVisBgColor || "black",
      bgColorFromAlbumArt: null,
      schemeTopColor: null,
      followAlbumArt: !!localStorage.wmpotifyVisFollowAlbumArt,
      albumArtTopColor: null,
      showAlbumArt: !!localStorage.wmpotifyVisShowAlbumArt,
      dimAlbumArt: !!localStorage.wmpotifyVisDimAlbumArt,
      albumArtSize: localStorage.wmpotifyVisAlbumArtSize || "auto",
      albumArtSizeProps: { // "Original"
        width: "auto",
        height: "auto",
        minHeight: "0",
        maxWidth: "none",
        maxHeight: "none",
        objectFit: "contain",
      },
      bcPreset: localStorage.wmpotifyVisBCPreset || "Random",
      showLyrics: !!localStorage.wmpotifyVisShowLyrics,
      enableSpotifyLyrics: !localStorage.wmpotifyVisLyricsNoSpotify,
      enableLyricsCache: !localStorage.wmpotifyVisLyricsNoCache,
      isFullscreen: !!document.fullscreenElement,
      noAudioData: false,
      updateAvailable: false
    };
  }

  componentDidMount() {
    // 1.2.55 compatibility
    const resizeTarget = document.querySelector('.Root__main-view > div:first-child:not(.main-view-container)');
    if (resizeTarget) {
      resizeTarget.style.height = '100%';
    }
    // Comfy theme compatibility
    const resizeTarget2 = this.elemRefs.root.current.parentElement;
    if (resizeTarget2) {
      resizeTarget2.style.height = '100%';
    }
    const resizeTarget3 = resizeTarget2.parentElement;
    if (resizeTarget3) {
      resizeTarget3.style.height = '100%';
    }
    // This interferes with the right-click menu on non-WMPotify themes
    // Since this bar is empty when global nav is enabled, just hide it
    // (And this bar is always re-rendered on page navigation, so no need to restore it on unmount)
    const hideTarget = document.querySelector('.main-topBar-container');
    const isGlobalNav = !!document.querySelector('.Root__globalNav');
    if (hideTarget) {
      if (isGlobalNav) {
        hideTarget.style.display = 'none';
      } else {
        // Make the top bar is overlayed on the main view if it's not global nav
        const hideTarget2 = document.querySelector('.main-view-container__scroll-node-child-spacer');
        if (hideTarget2) {
          hideTarget2.style.display = 'none';
        }
      }
    }

    init(this.elemRefs);
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        init(this.elemRefs);
        observer.disconnect();
      }
    });

    observer.observe(this.elemRefs.visBar.current);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    globalThis.wmpvisSetShowLyrics = this.setShowLyrics;

    if (!localStorage.wmpotifyNoUpdateCheck) {
      checkUpdates().then((updateAvailable) => {
        this.setState({ updateAvailable });
      });
    }
  }

  componentWillUnmount() {
    uninit();
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    delete globalThis.wmpvisSetShowLyrics;

    const resizeTarget = document.querySelector('.Root__main-view > div:first-child:not(.main-view-container)');
    if (resizeTarget) {
      resizeTarget.style.height = '';
    }
    const resizeTarget2 = this.elemRefs.root.current.parentElement;
    if (resizeTarget2) {
      resizeTarget2.style.height = '';
    }
    const resizeTarget3 = resizeTarget2.parentElement;
    if (resizeTarget3) {
      resizeTarget3.style.height = '';
    }
  }

  changeVisType = (type) => {
    localStorage.wmpotifyVisType = type;
    updateVisConfig();
    this.setState({
      type: type
    });
    if (!localStorage.wmpotifyVisUseSchemeColors && !localStorage.wmpotifyVisBgColor && !(this.state.followAlbumArt && this.state.bgColorFromAlbumArt)) {
      this.setState({
        bgColor: type === "albumArt" ? "var(--spice-main)" : "black"
      });
    }
  };

  setShowLyrics = (show) => {
    if (show === undefined) {
      show = !this.state.showLyrics;
    }
    if (show) {
      localStorage.wmpotifyVisShowLyrics = true;
    } else {
      delete localStorage.wmpotifyVisShowLyrics;
    }
    this.setState({
      showLyrics: show
    });
  };

  handleFullscreenChange = () => {
    this.setState({ isFullscreen: !!document.fullscreenElement });
  };

  render() {
    const bcPresets = ButterchurnAdaptor.getPresets().sort();

    const SvgIcon = React.memo((props) => {
      return <svg class={props.class} height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d={props.d}></path></svg>;
    });

    const CheckMark = React.memo((props) => {
      return <SvgIcon class={props.class} d="M15.53 2.47a.75.75 0 0 1 0 1.06L4.907 14.153.47 9.716a.75.75 0 0 1 1.06-1.06l3.377 3.376L14.47 2.47a.75.75 0 0 1 1.06 0z"></SvgIcon>;
    });

    const ActiveRadio = React.memo(() => {
      return <CheckMark class="activeStyle" />;
    });

    const MenuWrapper = React.memo(() => {
      return <Spicetify.ReactComponent.Menu>
        <Spicetify.ReactComponent.MenuItem
          label="Track Info"
          onClick={() => window.open(Spicetify.Player.data?.item?.uri)}
          divider="after"
        >
          {Strings['MENU_TRACK_INFO']}
        </Spicetify.ReactComponent.MenuItem>
        <Spicetify.ReactComponent.MenuItem
          label="No Visualization"
          onClick={() => {
            this.changeVisType("none");
            this.setState({ showAlbumArt: false });
            delete localStorage.wmpotifyVisShowAlbumArt;
          }}
          divider="after"
          leadingIcon={this.state.type === "none" ? <ActiveRadio /> : null}
        >
          {Strings['MENU_NO_VIS']}
        </Spicetify.ReactComponent.MenuItem>
        <Spicetify.ReactComponent.MenuItem
          label="Album Art"
          onClick={() => {
            this.changeVisType("albumArt");
            this.setState({ showAlbumArt: true, dimAlbumArt: false });
            localStorage.wmpotifyVisShowAlbumArt = true;
            delete localStorage.wmpotifyVisDimAlbumArt;
          }}
          leadingIcon={this.state.type === "albumArt" ? <ActiveRadio /> : null}
        >
          {Strings['MENU_VIS_ALBUM_ART']}
        </Spicetify.ReactComponent.MenuItem>
        <Spicetify.ReactComponent.MenuItem
          label="Bars"
          onClick={() => {
            this.changeVisType("bars");
            this.setState({ showAlbumArt: false });
            delete localStorage.wmpotifyVisShowAlbumArt
          }}
          leadingIcon={this.state.type === "bars" ? <ActiveRadio /> : null}
        >
          {Strings['MENU_VIS_BARS']}
        </Spicetify.ReactComponent.MenuItem>
        <Spicetify.ReactComponent.MenuSubMenuItem
          displayText="MilkDrop"
          label="MilkDrop"
          leadingIcon={this.state.type === "milkdrop" ? <ActiveRadio /> : null}
        >
          <Spicetify.ReactComponent.MenuItem
            label="Random"
            onClick={() => {
              this.changeVisType("milkdrop");
              ButterchurnAdaptor.setPreset(null);
              delete localStorage.wmpotifyVisBCPreset;
              this.setState({ bcPreset: "Random" });
            }}
            leadingIcon={this.state.type === "milkdrop" && this.state.bcPreset === "Random" ? <ActiveRadio /> : null}
          >
            {Strings['MENU_VIS_BC_RANDOM']}
          </Spicetify.ReactComponent.MenuItem>
          {bcPresets.map((preset) => (
            <Spicetify.ReactComponent.MenuItem
              key={preset}
              label={preset}
              onClick={() => {
                this.changeVisType("milkdrop");
                ButterchurnAdaptor.setPreset(preset);
                localStorage.wmpotifyVisBCPreset = preset;
                this.setState({ bcPreset: preset });
              }}
              leadingIcon={this.state.type === "milkdrop" && this.state.bcPreset === preset ? <ActiveRadio /> : null}
            >
              {preset}
            </Spicetify.ReactComponent.MenuItem>
          ))}
        </Spicetify.ReactComponent.MenuSubMenuItem>
        <Spicetify.ReactComponent.MenuItem
          label="Advanced Options"
          divider="after"
          onClick={() => {
            if (this.state.type !== "milkdrop") {
              openConfigDialog();
            } else {
              ButterchurnAdaptor.openConfigDialog();
            }
          }}
        >
          {Strings['MENU_VISCONF']}
        </Spicetify.ReactComponent.MenuItem>
        <Spicetify.ReactComponent.MenuSubMenuItem
          displayText={Strings['MENU_LRC']}
          label="Lyrics"
          divider="after"
        >
          <Spicetify.ReactComponent.MenuItem
            label="Show Lyrics"
            onClick={() => {
              if (this.state.showLyrics) {
                delete localStorage.wmpotifyVisShowLyrics;
              } else {
                localStorage.wmpotifyVisShowLyrics = "true";
              }
              this.setState({ showLyrics: !this.state.showLyrics });
            }}
            divider="after"
            leadingIcon={this.state.showLyrics ? <CheckMark /> : null}
          >
            {Strings['MENU_LRC_SHOW']}
          </Spicetify.ReactComponent.MenuItem>
          <Spicetify.ReactComponent.MenuItem
            label="Use Spotify Lyrics"
            onClick={() => {
              if (this.state.enableSpotifyLyrics) {
                localStorage.wmpotifyVisLyricsNoSpotify = true;
              } else {
                delete localStorage.wmpotifyVisLyricsNoSpotify;
              }
              this.setState({ enableSpotifyLyrics: !this.state.enableSpotifyLyrics });
              MadVisLyrics.reloadLyrics();
            }}
            divider="after"
            leadingIcon={this.state.enableSpotifyLyrics ? <CheckMark /> : null}
          >
            {Strings['MENU_LRC_USE_SPOTIFY']}
          </Spicetify.ReactComponent.MenuItem>
          <Spicetify.ReactComponent.MenuItem
            label="Load Lyrics"
            onClick={() => MadVisLyrics.reloadLyrics()}
          >
            {Strings['MENU_LRC_LOAD']}
          </Spicetify.ReactComponent.MenuItem>
          <Spicetify.ReactComponent.MenuItem
            label="Search Lyrics"
            onClick={() => MadVisLyrics.openSearchDialog()}
          >
            {Strings['MENU_LRC_SEARCH']}
          </Spicetify.ReactComponent.MenuItem>
          <Spicetify.ReactComponent.MenuItem
            label="Open Lyrics File"
            onClick={async () => {
              try {
                await MadVisLyrics.openLyricsFile()
                Spicetify.showNotification(Strings['MSG_LOCAL_REMOVE_GUIDE']);
              } catch (e) {
                if (e.name === 'AbortError') {
                  return;
                }
                console.error(e);
                Spicetify.showNotification(Strings['MSG_LOCAL_LOAD_FAIL']);
              }
            }}
            divider="after"
          >
            {Strings['MENU_LRC_OPENFILE']}
          </Spicetify.ReactComponent.MenuItem>
          <Spicetify.ReactComponent.MenuItem
            label="Cache Lyrics"
            onClick={() => {
              if (this.state.enableLyricsCache) {
                localStorage.wmpotifyVisLyricsNoCache = true;
                lrcCache.clear();
              } else {
                delete localStorage.wmpotifyVisLyricsNoCache;
              }
              this.setState({ enableLyricsCache: !this.state.enableLyricsCache });
            }}
            leadingIcon={this.state.enableLyricsCache ? <CheckMark /> : null}
          >
            {Strings['MENU_LRC_CACHE']}
          </Spicetify.ReactComponent.MenuItem>
          <Spicetify.ReactComponent.MenuItem
            label="Copy Debug Info"
            onClick={() => {
              MadVisLyrics.copyDebugInfo();
              Spicetify.showNotification(Strings['MSG_DBG_INFO_COPIED']);
            }}
          >
            {Strings['MENU_LRC_COPY_DBG_INFO']}
          </Spicetify.ReactComponent.MenuItem>
        </Spicetify.ReactComponent.MenuSubMenuItem>
        <Spicetify.ReactComponent.MenuItem
          label="Full Screen"
          onClick={() => {
            const wmpotifyFullscreen = document.querySelector('#wmpotify-fullscreen-button');
            if (wmpotifyFullscreen) {
              wmpotifyFullscreen.click();
            } else {
              this.elemRefs.root.current.requestFullscreen();
            }
          }}
          leadingIcon={this.state.isFullscreen ? <CheckMark /> : null}
          divider={this.state.updateAvailable ? "after" : null}
        >
          {Strings['MENU_FULLSCREEN']}
        </Spicetify.ReactComponent.MenuItem>
        {this.state.updateAvailable &&
        <Spicetify.ReactComponent.MenuItem
          label="Update Available"
          onClick={() => {
            const url = Spicetify.Config.current_theme.toLowerCase() === 'wmpotify' ?
              'https://github.com/Ingan121/WMPotify' :
              'https://github.com/Ingan121/Spicetify-CustomApps';
            window.open(url);
          }}
        >
          {Strings['MENU_UPDATE_AVAILABLE']}
        </Spicetify.ReactComponent.MenuItem>}
      </Spicetify.ReactComponent.Menu>
    });

    return <>
      <style>
        {`
        .wmpotify-lyrics-line:hover {
          cursor: pointer;
          text-decoration: underline;
        }

        @media (min-width: 1280px) {
          .wmpvis-lyrics {
            font-size: 2rem !important;
          }
        }

        @media (min-width: 1920px) {
          .wmpvis-lyrics {
            font-size: 3rem !important;
            margin: 64px 144px 0 144px !important;
          }
        }
        `}
      </style>
      <Spicetify.ReactComponent.ContextMenu
        trigger="right-click"
        action="open"
        menu={<MenuWrapper />}
      >
        <section
          id="wmpvis"
          className="contentSpacing"
          style={{
            position: "absolute",
            height: "100%",
            backgroundColor: this.state.followAlbumArt && this.state.bgColorFromAlbumArt ?
              this.state.bgColorFromAlbumArt :
              this.state.bgColor,
            overflow: "hidden",
            maxWidth: "none",
          }}
          ref={this.elemRefs.root}
        >
          <img className="wmpvis-albumArt"
            style={{
              display: this.state.showAlbumArt && this.state.type !== "none" ? "block" : "none",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: this.state.albumArtSizeProps.width,
              height: this.state.albumArtSizeProps.height,
              minHeight: this.state.albumArtSizeProps.minHeight,
              maxWidth: this.state.albumArtSizeProps.maxWidth,
              maxHeight: this.state.albumArtSizeProps.maxHeight,
              objectFit: this.state.albumArtSizeProps.objectFit,
              opacity: this.state.dimAlbumArt ? 0.5 : 1,
              boxShadow: "var(--album-shadow-big)",
              zIndex: 0
            }}
            ref={this.elemRefs.albumArt}
          />
          <canvas
            className="wmpvis-visBar"
            style={{
              display: this.state.type === "bars" ? "block" : "none",
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 2
            }}
            ref={this.elemRefs.visBar}
          ></canvas>
          <canvas
            className="wmpvis-visTop"
            style={{
              display: this.state.type === "bars" ? "block" : "none",
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1
            }}
            ref={this.elemRefs.visTop}
          ></canvas>
          <canvas
            className="wmpvis-visBC"
            style={{
              display: this.state.type === "milkdrop" ? "block" : "none",
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 3
            }}
            ref={this.elemRefs.visBC}
          ></canvas>
          <p
            className="wmpvis-debug"
            style={{
              display: "none",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 3
            }}
            ref={this.elemRefs.debug}
          ></p>
          <p
            className="wmpotify-no-audio-notification"
            style={{
              display: this.state.noAudioData && ["bars", "milkdrop"].includes(this.state.type) ? "block" : "none",
              color:
                this.state.type !== "milkdrop" ?
                  this.state.followAlbumArt && this.state.bgColorFromAlbumArt ?
                    this.state.albumArtTopColor :
                    localStorage.wmpotifyVisUseSchemeColors ?
                      this.state.schemeTopColor :
                        localStorage.wmpotifyVisTopColor || "white"
                  : "white",
              backgroundColor: this.state.type !== "milkdrop" ? "transparent" : "rgba(0, 0, 0, 0.5)",
              position: "absolute",
              left: 0,
              bottom: 0,
              zIndex: 4
            }}
          >
            {Strings['NO_AUD_DATA']}
          </p>
          <div
            className="wmpvis-lyrics-container"
            style={{
              display: this.state.showLyrics ? "flex" : "none",
              justifyContent: "center",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 4,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              overflow: "auto",
            }}
          >
            <div
              className="wmpvis-lyrics"
              style={{
                color: "white",
                margin: "64px 64px 0 64px",
                fontSize: "1.5rem",
                fontWeight: "700",
                lineHeight: "1.5em",
                whiteSpace: "pre-wrap",
              }}
              ref={this.elemRefs.lyrics}
            ></div>
          </div>
        </section>
      </Spicetify.ReactComponent.ContextMenu>
    </>
  } 
}

export default App;
export { appInstance };