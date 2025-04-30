'use strict';

import Strings from './strings';
import { confirmModal } from './dialogs';
import { appInstance as App } from './app';
import { updateVisConfig } from './wmpvis';

const displayMediaOptions = {
    video: {
        displaySurface: "browser",
    },
    audio: {
        suppressLocalAudioPlayback: false,
    },
    preferCurrentTab: false,
    selfBrowserSurface: "exclude",
    systemAudio: "include",
    surfaceSwitching: "exclude",
    monitorTypeSurfaces: "include",
};

export async function getDesktopAudioCapturer(fftSize = 256) {
    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

    const audioTracks = stream.getAudioTracks();
    for (const track of stream.getVideoTracks()) {
        track.stop();
    }
    if (audioTracks.length === 0) {
        throw new Error("No audio track available in the display media stream.");
    }
    audioTracks[0].addEventListener('ended', () => {
        updateVisConfig();
        App.setState({ desktopAudioAvailable: false });
    })

    const audioContext = new AudioContext();

    const audioSource = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    const analyserL = audioContext.createAnalyser();
    analyserL.maxDecibels = -20;
    analyserL.fftSize = fftSize / 2;
    const analyserR = audioContext.createAnalyser();
    analyserR.maxDecibels = -20;
    analyserR.fftSize = fftSize / 2;
    const splitter = audioContext.createChannelSplitter(2);

    audioSource.connect(analyser);
    audioSource.connect(splitter);
    splitter.connect(analyserL, 0);
    splitter.connect(analyserR, 1);

    return { stream, audioContext, audioSource, analyser, analyserL, analyserR };
}

export async function setupDesktopAudioCapture(event) {
    if (event) {
        event.stopPropagation(); // workaround for spicetifyWrapper.js PopupModal behavior
    }
    if (event?.shiftKey || await confirmModal(Strings["SYSAUDIO_GUIDE_TITLE"], Strings["SYSAUDIO_GUIDE"])) {
        Spicetify.PopupModal.hide();
        try {
            globalThis.wmpvisDesktopAudioCapturer = await getDesktopAudioCapturer();
            App.setState({ desktopAudioAvailable: true });
            updateVisConfig();
        } catch (e) {
            Spicetify.showNotification(Strings['SYSAUDIO_FAIL']);
            console.error(e);
        }
    }
}