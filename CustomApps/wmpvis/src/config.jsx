// config.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

import React from "react";
import Strings from "./strings";
import { updateVisConfig } from "./wmpvis";
import { appInstance as App } from "./app";

const ConfigDialog = React.memo(() => {
    return <>
        <style>
            {`
                #wmpvis-config .field-row {
                    display: flex;
                    align-items: center;
                }

                #wmpvis-config [class^="field-row"] + [class^="field-row"] {
                    margin-top: 6px;
                }

                #wmpvis-config .field-row > * + * {
                    margin-left: 6px;
                }

                #wmpvis-config #colorSelector {
                    margin-bottom: 4px;
                }

                #wmpvis-config #customColors {
                    margin-top: 2px;
                    margin-bottom: 5px;
                }

                .colorPicker {
                    min-width: auto !important;
                    min-height: auto;
                    width: 42px;
                    height: 21px;
                    position: relative;
                    top: 13.5px;
                    margin-top: -25px;
                    margin-left: 5px;
                    margin-right: 10px;
                }

                .colorPicker-color {
                    width: 20px;
                    height: 11px;
                    background-color: black;
                    border: 1px solid var(--button-text);
                    position: relative;
                    top: 0;
                    left: -7px;
                    float: left
                }

                .colorPicker-bar {
                    width: 1px;
                    height: 13px;
                    background-color: var(--button-shadow);
                    border-right: solid 1px var(--button-hilight);
                    position: relative;
                    top: 0;
                    left: 18px;
                }

                .colorPicker-expandMark {
                    height: 0;
                    position: relative;
                    top: -15px;
                    left: 15px;
                    font-size: 10px;
                }

                .colorPicker-input {
                    width: 0;
                    height: 0;
                    opacity: 0;
                    position: absolute;
                    left: 0;
                    bottom: 0;
                }

                #wmpvis-config .selectorArea {
                    margin-bottom: 0;
                }

                #wmpvis-config .selectorLabel {
                    margin-right: 5px;
                }

                #wmpvis-config label[for="dimAlbumArtChkBox"] {
                    margin-top: 3px;
                }

                #wmpvis-config #albumArtSizeArea {
                    margin-top: 4px;
                }

                #wmpvis-config input[type=checkbox] + label::before {
                    top: calc(50% - var(--checkbox-width) / 2);
                }

                #wmpvis-config #visConfArea {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }

                #wmpvis-config #barWidthInput,
                #wmpvis-config #decSpeedInput,
                #wmpvis-config #primaryScaleInput,
                #wmpvis-config #diffScaleInput {
                    width: 40px;
                    text-align: right;
                    margin-left: 5px;
                }

                #wmpvis-config #primaryScaleInput,
                #wmpvis-config #diffScaleInput {
                    margin-top: 3px;
                }

                #wmpvis-config input[type=number]::-webkit-inner-spin-button, 
                #wmpvis-config input[type=number]::-webkit-outer-spin-button { 
                    appearance: none;
                    margin: 0; 
                }

                #wmpvis-config p {
                    margin: 3px 0;
                }

                #wmpvis-config legend {
                    margin-bottom: 5px;
                }

                #wmpvis-config .bottomButtons {
                    margin-top: 5px;
                    justify-content: flex-end;
                }

                #wmpvis-config .disabled {
                    color: var(--button-shadow);
                    text-shadow: 1px 1px 0 var(--button-hilight);
                }

                #wmpvis-config button.wmpotify-aero {
                    color: black;
                    min-height: 23px;
                    min-width: 75px;
                    padding: 0 12px;
                    text-align: center;
                }
                `}
        </style>
        <div style={{ fontSize: "11px" }} id="wmpvis-config">
            <fieldset>
                <legend>{Strings["VISCONF_COLOR_TITLE"]}</legend>
                <select id="colorSelector" class="wmpotify-aero">
                    <option value="default">{Strings["VISCONF_COLOR_DEFAULT"]}</option>
                    <option value="scheme">{Strings["VISCONF_COLOR_FOLLOW_SCHEME"]}</option>
                    <option value="custom">{Strings["VISCONF_COLOR_CUSTOM"]}</option>
                </select><br />
                <input id="followAlbumArtChkBox" class="wmpotify-aero" type="checkbox" name="followAlbumArt" accesskey="l" />
                <label for="followAlbumArtChkBox">{Strings["VISCONF_COLOR_FOLLOW_ALBUM_ART"]}</label>
            </fieldset><hr />
            <fieldset>
                <legend>{Strings["VISCONF_CUSTOM_COLOR_TITLE"]}</legend>
                <section id="customColors" class="field-row disabled">
                    <span id="bgColorPickerLabel">{Strings["VISCONF_CUSTOM_COLOR_BG"]}</span>
                    <button id="bgColorPicker" class="colorPicker wmpotify-aero" disabled>
                        <div class="colorPicker-color"></div>
                        <div class="colorPicker-bar"></div>
                        <div class="colorPicker-expandMark">⏷</div>
                        <input class="colorPicker-input" type="color" />
                    </button>
                    <span id="barColorPickerLabel">{Strings["VISCONF_CUSTOM_COLOR_BAR"]}</span>
                    <button id="barColorPicker" class="colorPicker wmpotify-aero" disabled>
                        <div class="colorPicker-color" style={{ backgroundColor: "#a4eb0c" }}></div>
                        <div class="colorPicker-bar"></div>
                        <div class="colorPicker-expandMark">⏷</div>
                        <input class="colorPicker-input" type="color" />
                    </button>
                    <span id="topColorPickerLabel">{Strings["VISCONF_CUSTOM_COLOR_TOP"]}</span>
                    <button id="topColorPicker" class="colorPicker wmpotify-aero" disabled>
                        <div class="colorPicker-color" style={{ backgroundColor: "#dfeaf7" }}></div>
                        <div class="colorPicker-bar"></div>
                        <div class="colorPicker-expandMark">⏷</div>
                        <input class="colorPicker-input" type="color" />
                    </button>
                </section>
            </fieldset><hr />
            <fieldset id="albumArtFieldset">
                <legend>{Strings["VISCONF_ALBUM_ART_TITLE"]}</legend>
                <input id="albumArtChkBox" class="wmpotify-aero" type="checkbox" name="albumArt" accesskey="h" />
                <label for="albumArtChkBox">{Strings["VISCONF_ALBUM_ART_SHOW"]}</label><br />
                <input id="dimAlbumArtChkBox" class="wmpotify-aero" type="checkbox" name="albumArt" disabled accesskey="i" />
                <label for="dimAlbumArtChkBox">{Strings["VISCONF_ALBUM_ART_DIM"]}</label>
                <div id="albumArtSizeArea" class="selectorArea disabled">
                    <span id="albumArtSizeLabel" class="selectorLabel">{Strings["VISCONF_ALBUM_ART_SIZE_TITLE"]}:</span>
                    <select id="albumArtSizeSelector" class="wmpotify-aero" disabled>
                        <option value="orig">{Strings["VISCONF_ALBUM_ART_SIZE_ORIG"]}</option>
                        <option value="auto">{Strings["VISCONF_ALBUM_ART_SIZE_AUTO"]}</option>
                        <option value="auto2x">{Strings["VISCONF_ALBUM_ART_SIZE_AUTO2X"]}</option>
                        <option value="auto2xmin">{Strings["VISCONF_ALBUM_ART_SIZE_AUTO2XMIN"]}</option>
                        <option value="2x">{Strings["VISCONF_ALBUM_ART_SIZE_2X"]}</option>
                        <option value="horizfit">{Strings["VISCONF_ALBUM_ART_SIZE_FIT"]}</option>
                        <option value="vertfit">{Strings["VISCONF_ALBUM_ART_SIZE_FILL"]}</option>
                        <option value="scale">{Strings["VISCONF_ALBUM_ART_SIZE_STRETCH"]}</option>
                    </select>
                </div>
            </fieldset><hr />
            <fieldset>
                <legend>{Strings["VISCONF_VIS_TITLE"]}</legend>
                <div id="visConfArea">
                    <div>
                        <input id="fixedBarsChkBox" class="wmpotify-aero" type="checkbox" accesskey="w" />
                        <label for="fixedBarsChkBox">{Strings["VISCONF_BAR_WIDTH"]}</label>
                        <input id="barWidthInput" class="wmpotify-aero" type="number" name="barWidth" defaultValue="6" step="1" placeholder="6" disabled />
                    </div>
                    <div>
                        <span id="decSpeedLabel">{Strings["VISCONF_DEC_SPEED"]}</span>
                        <input id="decSpeedInput" class="wmpotify-aero" type="number" name="decSpeed" defaultValue="3" placeholder="3" />
                    </div>
                    <div>
                        <span id="primaryScaleLabel">{Strings["VISCONF_PRIMARY_SCALE"]}</span>
                        <input id="primaryScaleInput" class="wmpotify-aero" type="number" name="primaryScale" defaultValue="1.0" max="1.0" step="0.01" placeholder="1.0" />
                    </div>
                    <div>
                        <span id="diffScaleLabel">{Strings["VISCONF_DIFF_SCALE"]}</span>
                        <input id="diffScaleInput" class="wmpotify-aero" type="number" name="diffScale" defaultValue="0.07" max="1.0" step="0.001" placeholder="0.07" />
                    </div>
                </div>
                <input id="reduceBarsChkBox" class="wmpotify-aero" type="checkbox" name="reduceBars" defaultChecked />
                <label for="reduceBarsChkBox">{Strings["VISCONF_REDUCE_BARS"]}</label>
                <p id="diffScaleInfo">
                    {Strings["VISCONF_SCALE_INFO"]}
                </p>
            </fieldset>
            <section class="bottomButtons field-row">
                <button id="okBtn" class="wmpotify-aero">{Strings["UI_OK"]}</button>
                <button id="cancelBtn" class="wmpotify-aero">{Strings["UI_CANCEL"]}</button>
                <button id="applyBtn" class="wmpotify-aero" accesskey="a">{Strings["UI_APPLY"]}</button>
            </section>
        </div>
    </>
});

export function openConfigDialog() {
    Spicetify.PopupModal.display({
        title: Strings['VISCONF_TITLE'],
        content: <ConfigDialog />,
    });

    init(document.getElementById("wmpvis-config"));
}

function init(root) {
    const colorSelector = root.querySelector("#colorSelector");
    const followAlbumArtChkBox = root.querySelector('#followAlbumArtChkBox');

    const customColors = root.querySelector("#customColors");
    const bgColorPicker = root.querySelector("#bgColorPicker");
    const bgColorPickerColor = bgColorPicker.querySelector(".colorPicker-color");
    const barColorPicker = root.querySelector("#barColorPicker");
    const barColorPickerLabel = root.querySelector("#barColorPickerLabel");
    const barColorPickerColor = barColorPicker.querySelector(".colorPicker-color");
    const topColorPicker = root.querySelector("#topColorPicker");
    const topColorPickerLabel = root.querySelector("#topColorPickerLabel");
    const topColorPickerColor = topColorPicker.querySelector(".colorPicker-color");

    const albumArtChkBox = root.querySelector("#albumArtChkBox");
    const dimAlbumArtChkBox = root.querySelector("#dimAlbumArtChkBox");
    const albumArtSizeArea = root.querySelector("#albumArtSizeArea");
    const albumArtSizeSelector = root.querySelector("#albumArtSizeSelector");

    const fixedBarsChkBox = root.querySelector("#fixedBarsChkBox");
    const barWidthInput = root.querySelector("#barWidthInput");
    const decSpeedLabel = root.querySelector("#decSpeedLabel");
    const decSpeedInput = root.querySelector("#decSpeedInput");

    const primaryScaleLabel = root.querySelector("#primaryScaleLabel");
    const primaryScaleInput = root.querySelector("#primaryScaleInput");
    const diffScaleLabel = root.querySelector("#diffScaleLabel");
    const diffScaleInput = root.querySelector("#diffScaleInput");
    const diffScaleInfo = root.querySelector("#diffScaleInfo");
    const reduceBarsChkBox = root.querySelector("#reduceBarsChkBox");

    const okBtn = root.querySelector("#okBtn");
    const cancelBtn = root.querySelector("#cancelBtn");
    const applyBtn = root.querySelector("#applyBtn");

    colorSelector.addEventListener("change", () => {
        if (colorSelector.value === "default") {
            bgColorPickerColor.style.backgroundColor = "#000000";
            barColorPickerColor.style.backgroundColor = "#a4eb0c";
            topColorPickerColor.style.backgroundColor = "#dfeaf7";
            bgColorPicker.disabled = true;
            barColorPicker.disabled = true;
            topColorPicker.disabled = true;
            customColors.classList.add("disabled");
        } else if (colorSelector.value === "scheme") {
            bgColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-main');
            barColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-accent');
            topColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-text');
            bgColorPicker.disabled = true;
            barColorPicker.disabled = true;
            topColorPicker.disabled = true;
            customColors.classList.add("disabled");
        } else {
            bgColorPicker.disabled = false;
            if (!["none", "albumArt"].includes(localStorage.wmpotifyVisType)) {
                barColorPicker.disabled = false;
                topColorPicker.disabled = false;
            }
            customColors.classList.remove("disabled");
        }
    });

    albumArtChkBox.addEventListener("change", () => {
        if (albumArtChkBox.checked) {
            dimAlbumArtChkBox.disabled = false;
            albumArtSizeArea.classList.remove("disabled");
            albumArtSizeSelector.disabled = false;
        } else {
            dimAlbumArtChkBox.disabled = true;
            albumArtSizeArea.classList.add("disabled");
            albumArtSizeSelector.disabled = true;
        }
    });

    [bgColorPicker, barColorPicker, topColorPicker].forEach((colorPicker, index) => {
        const colorPickerColor = colorPicker.querySelector(".colorPicker-color");
        const colorPickerInput = colorPicker.querySelector("input[type='color']");
        colorPickerInput.addEventListener("input", () => {
            const color = colorPickerInput.value;
            colorPickerColor.style.backgroundColor = color;
        });
        colorPicker.addEventListener("click", () => {
            colorPickerInput.click();
        });
    });

    fixedBarsChkBox.addEventListener("change", () => {
        if (fixedBarsChkBox.checked) {
            barWidthInput.disabled = false;
        } else {
            barWidthInput.value = 6;
            barWidthInput.disabled = true;
        }
    });

    function apply() {
        if (colorSelector.value === "default") {
            delete localStorage.wmpotifyVisBgColor;
            delete localStorage.wmpotifyVisBarColor;
            delete localStorage.wmpotifyVisTopColor;
            delete localStorage.wmpotifyVisUseSchemeColors;
        } else if (colorSelector.value === "scheme") {
            localStorage.wmpotifyVisUseSchemeColors = true;
        } else {
            localStorage.wmpotifyVisBgColor = bgColorPickerColor.style.backgroundColor;
            localStorage.wmpotifyVisBarColor = barColorPickerColor.style.backgroundColor;
            localStorage.wmpotifyVisTopColor = topColorPickerColor.style.backgroundColor;
            delete localStorage.wmpotifyVisUseSchemeColors;
        }

        if (followAlbumArtChkBox.checked) {
            localStorage.wmpotifyVisFollowAlbumArt = true;
        } else {
            delete localStorage.wmpotifyVisFollowAlbumArt;
        }

        if (albumArtChkBox.checked) {
            localStorage.wmpotifyVisShowAlbumArt = true;
        } else {
            delete localStorage.wmpotifyVisShowAlbumArt;
        }
        if (dimAlbumArtChkBox.checked) {
            localStorage.wmpotifyVisDimAlbumArt = true;
        } else {
            delete localStorage.wmpotifyVisDimAlbumArt;
        }
        localStorage.wmpotifyVisAlbumArtSize = albumArtSizeSelector.value;

        if (fixedBarsChkBox.checked) {
            localStorage.wmpotifyVisBarWidth = barWidthInput.value;
            delete localStorage.wmpotifyVisAutoSizeBars
        } else {
            delete localStorage.wmpotifyVisBarWidth;
            localStorage.wmpotifyVisAutoSizeBars = true;
        }

        localStorage.wmpotifyVisDecSpeed = decSpeedInput.value;
        localStorage.wmpotifyVisPrimaryScale = primaryScaleInput.value;
        localStorage.wmpotifyVisDiffScale = diffScaleInput.value;

        if (reduceBarsChkBox.checked) {
            delete localStorage.wmpotifyVisDontReduceBars;
        } else {
            localStorage.wmpotifyVisDontReduceBars = true;
        }

        App.setState({
            bgColor:
                ((localStorage.wmpotifyVisType === "albumArt" || localStorage.wmpotifyVisUseSchemeColors) && !localStorage.wmpotifyVisBgColor) ?
                    "var(--spice-main)" :
                    localStorage.wmpotifyVisBgColor || "black",
            followAlbumArt: !!localStorage.wmpotifyVisFollowAlbumArt,
            showAlbumArt: !!localStorage.wmpotifyVisShowAlbumArt,
            dimAlbumArt: !!localStorage.wmpotifyVisDimAlbumArt,
            albumArtSize: localStorage.wmpotifyVisAlbumArtSize || "orig",
        });
        updateVisConfig();
    }

    okBtn.addEventListener("click", () => {
        apply();
        Spicetify.PopupModal.hide();
    });

    cancelBtn.addEventListener("click", () => {
        Spicetify.PopupModal.hide();
    });

    applyBtn.addEventListener("click", () => {
        apply();
    });

    // Colors / Custom colors fieldset
    if (localStorage.wmpotifyVisUseSchemeColors) {
        colorSelector.value = "scheme";
        bgColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-main');
        barColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-accent');
        topColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-text');
    } else if (localStorage.wmpotifyVisBgColor) {
        colorSelector.value = "custom";
        bgColorPickerColor.style.backgroundColor = localStorage.wmpotifyVisBgColor;
        barColorPickerColor.style.backgroundColor = localStorage.wmpotifyVisBarColor;
        topColorPickerColor.style.backgroundColor = localStorage.wmpotifyVisTopColor;
        bgColorPicker.disabled = false;
        barColorPicker.disabled = false;
        topColorPicker.disabled = false;
        customColors.classList.remove("disabled");
    }

    // Album art fieldset
    if (localStorage.wmpotifyVisFollowAlbumArt) {
        followAlbumArtChkBox.checked = true;
    }
    if (localStorage.wmpotifyVisShowAlbumArt) {
        albumArtChkBox.checked = true;
        dimAlbumArtChkBox.disabled = false;
        albumArtSizeArea.classList.remove("disabled");
        albumArtSizeSelector.disabled = false;
    }
    if (localStorage.wmpotifyVisDimAlbumArt) {
        dimAlbumArtChkBox.checked = true;
    }
    if (localStorage.wmpotifyVisAlbumArtSize) {
        albumArtSizeSelector.value = localStorage.wmpotifyVisAlbumArtSize;
    }

    // Visualizer fieldset
    if (!localStorage.wmpotifyVisAutoSizeBars) {
        fixedBarsChkBox.checked = true;
        barWidthInput.value = localStorage.wmpotifyVisBarWidth || 6;
        barWidthInput.disabled = false;
    }
    if (localStorage.wmpotifyVisDecSpeed) {
        decSpeedInput.value = localStorage.wmpotifyVisDecSpeed;
    }
    if (localStorage.wmpotifyVisPrimaryScale) {
        primaryScaleInput.value = localStorage.wmpotifyVisPrimaryScale;
    }
    if (localStorage.wmpotifyVisDiffScale) {
        diffScaleInput.value = localStorage.wmpotifyVisDiffScale;
    }
    if (localStorage.wmpotifyVisDontReduceBars) {
        reduceBarsChkBox.checked = false;
    }

    if (["none", "albumArt"].includes(localStorage.wmpotifyVisType)) {
        albumArtChkBox.disabled = true;
        dimAlbumArtChkBox.disabled = true;
        barColorPicker.disabled = true;
        topColorPicker.disabled = true;
        barColorPickerLabel.classList.add("disabled");
        topColorPickerLabel.classList.add("disabled");
        fixedBarsChkBox.disabled = true;
        barWidthInput.disabled = true;
        decSpeedLabel.classList.add("disabled");
        decSpeedInput.disabled = true;
        primaryScaleLabel.classList.add("disabled");
        primaryScaleInput.disabled = true;
        diffScaleLabel.classList.add("disabled");
        diffScaleInput.disabled = true;
        diffScaleInfo.classList.add("disabled");
        reduceBarsChkBox.disabled = true;
    }
}