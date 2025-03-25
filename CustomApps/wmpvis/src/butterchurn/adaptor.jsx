'use strict';

// Some codes are from https://steamcommunity.com/sharedfiles/filedetails/?id=2962616483

import React from "react";
import Strings from "../strings";

import butterchurn from './butterchurn.min.js';
import butterchurnExtraImages from './butterchurnExtraImages.min.js';
import butterchurnPresets from './butterchurnPresets.min.js';
import butterchurnPresetsExtra from './butterchurnPresetsExtra.min.js';
import butterchurnPresetsExtra2 from './butterchurnPresetsExtra2.min.js';
import FFT from './fft.js';
import { findAudioArray } from '../wmpvis.js';

let audioData = null;
let lastIndex = 0;

let inited = false;
let pause = false;
let randomTimer = null;
let renderTimer = null;

let visualizer = null;
let resizeObserver = null;

let fps = parseInt(localStorage.wmpotifyVisBCFPS || "30");

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

                #wmpvis-config .selectorArea {
                    margin-bottom: 0;
                }

                #wmpvis-config .selectorLabel {
                    margin-right: 5px;
                }

                #wmpvis-config input[type=number] {
                    width: 40px;
                    text-align: right;
                    margin-top: 3px;
                    margin-left: 5px;
                    color: black;
                }

                #wmpvis-config #hardcutArea {
                    margin-top: 3px;
                }

                #wmpvis-config input[type=number]::-webkit-inner-spin-button, 
                #wmpvis-config input[type=number]::-webkit-outer-spin-button { 
                    appearance: none;
                    margin: 0; 
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
            <span id="fpsLabel">{Strings["BCCONF_FPS"]}</span>
            <input id="fpsInput" class="wmpotify-aero" type="number" name="fps" defaultValue="30" step="1" placeholder="30" /><br />
            <span id="randomTimerLabel">{Strings["BCCONF_RANDOM_TIMER"]}</span>
            <input id="randomTimerInput" class="wmpotify-aero" type="number" name="randomTimer" defaultValue="10" step="0.001" placeholder="10" /><br />
            <span id="transitionTimeLabel">{Strings["BCCONF_TRANSITION_TIME"]}</span>
            <input id="transitionTimeInput" class="wmpotify-aero" type="number" name="transitionTime" defaultValue="8" step="0.001" placeholder="8" /><br />
            <div id="hardcutArea" class="selectorArea">
                <span id="hardcutLabel" class="selectorLabel">{Strings["BCCONF_HARDCUT_TYPE"]}:</span>
                <select id="hardcutSelector" class="wmpotify-aero">
                    <option value="0">{Strings["BCCONF_HARDCUT_NONE"]}</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </div>
            <span id="hardcutTransitionTimeLabel">{Strings["BCCONF_HARDCUT_TRANSITION_TIME"]}</span>
            <input id="hardcutTransitionTimeInput" class="wmpotify-aero" type="number" name="hardcutTransitionTime" defaultValue="0.1" step="0.001" placeholder="0.1" disabled />
            <section class="bottomButtons field-row">
                <button id="okBtn" class="wmpotify-aero">{Strings["UI_OK"]}</button>
                <button id="cancelBtn" class="wmpotify-aero">{Strings["UI_CANCEL"]}</button>
                <button id="applyBtn" class="wmpotify-aero" accesskey="a">{Strings["UI_APPLY"]}</button>
            </section>
        </div>
    </>
});

function openConfigDialog() {
    Spicetify.PopupModal.display({
        title: Strings['BCCONF_TITLE'],
        content: <ConfigDialog />,
    });

    const root = document.querySelector("#wmpvis-config");
    const hardcutSelector = root.querySelector("#hardcutSelector");
    const fpsInput = root.querySelector("#fpsInput");
    const randomTimerInput = root.querySelector("#randomTimerInput");
    const transitionTimeInput = root.querySelector("#transitionTimeInput");
    const hardcutTransitionTimeInput = root.querySelector("#hardcutTransitionTimeInput");

    const okBtn = root.querySelector("#okBtn");
    const cancelBtn = root.querySelector("#cancelBtn");
    const applyBtn = root.querySelector("#applyBtn");

    fpsInput.value = localStorage.wmpotifyVisBCFPS || 30;
    hardcutSelector.value = localStorage.wmpotifyVisBCHardcut || 0;
    randomTimerInput.value = localStorage.wmpotifyVisBCRandomTimer || 10;
    transitionTimeInput.value = localStorage.wmpotifyVisBCTransitionTime || 10;
    hardcutTransitionTimeInput.value = localStorage.wmpotifyVisBCHardcutTransitionTime || 0.1;

    hardcutSelector.addEventListener("change", () => {
        if (hardcutSelector.value === "0") {
            hardcutTransitionTimeInput.disabled = true;
        } else {
            hardcutTransitionTimeInput.disabled = false;
        }
    });

    if (localStorage.wmpotifyVisBCPreset) {
        randomTimerInput.disabled = true;
        transitionTimeInput.disabled = true;
    }

    if (hardcutSelector.value !== 0) {
        hardcutTransitionTimeInput.disabled = false;
    }

    function apply() {
        if (hardcutSelector.value === 0) {
            delete localStorage.wmpotifyVisBCHardcut;
        } else {
            localStorage.wmpotifyVisBCHardcut = hardcutSelector.value;
        }
        localStorage.wmpotifyVisBCFPS = fps = fpsInput.value;
        const prevRandomTimer = localStorage.wmpotifyVisBCRandomTimer;
        localStorage.wmpotifyVisBCRandomTimer = randomTimerInput.value;
        localStorage.wmpotifyVisBCTransitionTime = transitionTimeInput.value;
        localStorage.wmpotifyVisBCHardcutTransitionTime = hardcutTransitionTimeInput.value;

        if (prevRandomTimer !== randomTimerInput.value) {
            beginRandomTimer(transitionTimeInput.value);
        }
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
}

const presets = Object.assign(
    {},
    butterchurnPresets.getPresets(),
    butterchurnPresetsExtra.getPresets(),
    butterchurnPresetsExtra2.getPresets()
);

export function init(canvas, debugView) {
    if (inited) {
        return;
    }

    const clientRect = canvas.getBoundingClientRect();
    canvas.width = clientRect.width;
    canvas.height = clientRect.height;

    visualizer = butterchurn.createVisualizer(null, canvas, {
        width: canvas.width,
        height: canvas.height,
        pixelRatio: window.devicePixelRatio || 1,
        textureRatio: 1
    });
    visualizer.loadExtraImages(butterchurnExtraImages.getImages());

    const fft = new FFT(96, 1024, false);

    const setVisualizerSize = () => {
        const clientRect = canvas.getBoundingClientRect();
        canvas.width = clientRect.width;
        canvas.height = clientRect.height;
        visualizer.setRendererSize(canvas.width, canvas.height);
    };

    setVisualizerSize();
    resizeObserver = new ResizeObserver(setVisualizerSize);
    resizeObserver.observe(canvas);

    let lastTime = +Date.now();
    let lastHardcutTime = 0;
    let lastHardcutRecalcTime = 0;
    let lastHardcutFreqVol = 0;
    let hardcutThreshold = null;

    let lastAudioArray = [];
    let newAudioArray = [];
    let interpolCycle = 1;

    const animationStep = () => {
        const currentTime = +Date.now();
        const elapsedTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        const elapsedTimeSinceHardcut = (currentTime - lastHardcutTime);
        const elapsedTimeSinceHardcutRecalc = (currentTime - lastHardcutRecalcTime);

        let renderTime = (Date.now() - currentTime) / 1000;

        if (!audioData || !visualizer || pause || !Spicetify.Player.isPlaying()) {
            if (!audioData) {
                debugView.innerText = 'No audio data';
            }
            renderTimer = setTimeout(() => {
                window.requestAnimationFrame(animationStep);
            }, (1 / fps - renderTime) * 1000);
            return;
        }

        const index = findAudioArray(lastIndex);
        lastAudioArray = audioData[index > 0 ? index - 1 : 0]?.slice(1) || new Array(96).fill(0);
        newAudioArray = audioData[index]?.slice(1) || new Array(96).fill(0);

        let audioArray = [];

        if (interpolCycle < (fps / 30)) {
            for (let i in newAudioArray) {
                audioArray[i] = lastAudioArray[i]+(((newAudioArray[i] - lastAudioArray[i]) / (fps / 30)) * interpolCycle)
            }

            interpolCycle++;
        } else {
            audioArray = newAudioArray;
        }

        audioArray = audioArray.map(value => value * 256);

        switch (localStorage.wmpotifyVisBCHardcut) {
            case "1": 
            case "2": 
            case "3": 
            case "4": {
                let hardcutThresholdSet = 0;
                let hardcutFreq = 0;
                let minimumHardcutDelay = 0;
                let maximumHardcutDelay = 0;

                switch (localStorage.wmpotifyVisBCHardcut) {
                    case "1":
                        hardcutThresholdSet = 220;
                        hardcutFreq = 2;
                        minimumHardcutDelay = 200;
                        maximumHardcutDelay = 10000;
                        break;
                    case "2":
                        hardcutThresholdSet = 150;
                        hardcutFreq = 60;
                        minimumHardcutDelay = 200;
                        maximumHardcutDelay = 10000;
                        break;
                    case "3":
                        hardcutThresholdSet = 255;
                        hardcutFreq = 2;
                        minimumHardcutDelay = 8000;
                        maximumHardcutDelay = 30000;
                        break;
                    case "4":
                        hardcutThresholdSet = 190;
                        hardcutFreq = 60;
                        minimumHardcutDelay = 8000;
                        maximumHardcutDelay = 30000;
                        break;
                    default:
                        break;
                }

                if (hardcutThreshold == null) {
                    hardcutThreshold = hardcutThresholdSet;
                }

                const hardcutCheck = (Math.min(newAudioArray[hardcutFreq], 256) + Math.min(newAudioArray[64 + hardcutFreq], 256)) / 2;

                if (elapsedTimeSinceHardcutRecalc > 2000 && elapsedTimeSinceHardcut > 2000 && hardcutThreshold > hardcutThresholdSet) {
                    const temp = 1 - (Math.max((elapsedTimeSinceHardcut/500),1) * 0.005);
                    hardcutThreshold = Math.max(hardcutThreshold * temp, hardcutThresholdSet);
                    lastHardcutRecalcTime = currentTime;
                } else if ( hardcutThreshold <= hardcutThresholdSet && elapsedTimeSinceHardcutRecalc > maximumHardcutDelay && elapsedTimeSinceHardcut > maximumHardcutDelay) {
                    hardcutThreshold = (hardcutThreshold / 1.5);
                    lastHardcutRecalcTime = currentTime;
                }

                if (hardcutCheck >= hardcutThreshold && lastHardcutFreqVol <= (hardcutCheck / 2)) {
                    if (elapsedTimeSinceHardcut < 500) {
                        hardcutThreshold = (hardcutThreshold + hardcutCheck) / 2;
                        lastHardcutRecalcTime = currentTime;
                    }

                    if (elapsedTimeSinceHardcut > minimumHardcutDelay) {
                        if (!localStorage.wmpotifyVisBCPreset) {
                            beginRandomTimer(parseFloat(localStorage.wmpotifyVisBCHardcutTransitionTime || 0.1));
                        }
                        lastHardcutTime = currentTime;
                    }
                }

                lastHardcutFreqVol = hardcutCheck;
            }
            break;
            case "5": {
                const hardcutThresholdSet = 220;
                const hardcutFreq = 2;
                const breakdownLength = 4000;

                const hardcutCheck = (Math.min(newAudioArray[hardcutFreq], 256) + Math.min(newAudioArray[64 + hardcutFreq], 256))/2;

                if (hardcutCheck >= hardcutThresholdSet && lastHardcutFreqVol <= (hardcutCheck / 2)) {
                    if (currentTime > (lastHardcutTime+breakdownLength)) {
                        if (!localStorage.wmpotifyVisBCPreset) {
                            beginRandomTimer(parseFloat(localStorage.wmpotifyVisBCHardcutTransitionTime || 0.1));
                        }
                    }
                    lastHardcutTime = currentTime;
                }

                lastHardcutFreqVol = hardcutCheck;
            }
            case "0":
            default:
                break;
        }

        visualizer.render({
            elapsedTime: elapsedTime,
            audioLevels: {
                timeByteArray: fft.timeToFrequencyDomain(audioArray),
                timeByteArrayL: fft.timeToFrequencyDomain(audioArray),
                timeByteArrayR: fft.timeToFrequencyDomain(audioArray)
            }
        });

        renderTimer = setTimeout(() => {
            window.requestAnimationFrame(animationStep);
        }, (1/fps - renderTime)*1000);
    }

    window.requestAnimationFrame(animationStep);

    if (localStorage.wmpotifyVisBCPreset) {
        visualizer.loadPreset(presets[localStorage.wmpotifyVisBCPreset]);
    } else {
        beginRandomTimer();
    }

    inited = true;
}

function beginRandomTimer(blend = 0) {
    clearInterval(randomTimer);
    random(blend);
    randomTimer = setInterval(() => {
        random(parseFloat(localStorage.wmpotifyVisBCTransitionTime || 8));
    }, (localStorage.wmpotifyVisBCRandomTimer || 10) * 1000);
}

function random(blend) {
    const presetNames = Object.keys(presets);
    const randomPreset = presetNames[Math.floor(Math.random() * presetNames.length)];
    visualizer.loadPreset(presets[randomPreset], blend);
    console.debug(`Random preset: ${randomPreset}`);
}

const ButterchurnAdaptor = {
    init,
    setAudioData: (data) => {
        audioData = data;
    },
    setPaused: (value) => {
        pause = value;
    },
    getPresets: () => {
        return Object.keys(presets);
    },
    setPreset: (presetName) => {
        if (presetName === null) {
            beginRandomTimer(0.5);
        } else {
            clearInterval(randomTimer);
            visualizer.loadPreset(presets[presetName], 0.5);
        }
    },
    openConfigDialog,
    uninit: () => {
        clearInterval(randomTimer);
        clearInterval(renderTimer);
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        visualizer = null;
        inited = false;
    }
};

export default ButterchurnAdaptor;