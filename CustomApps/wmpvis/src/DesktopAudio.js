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
    if (audioTracks[0].label.toLowerCase().includes('tab')) {
        for (const track of stream.getAudioTracks()) {
            track.stop();
        }
        throw new Error("Incorrect audio selected.");
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
    Spicetify.PopupModal.hide();
    if (!globalThis.documentPictureInPicture) {
        // This feature requires Chrome runtime
        // documentPictureInPicture also needs it and is undefined in Alloy mode
        // So runtime is detected with it
        Spicetify.showNotification(Strings["SYSAUDIO_ALLOY"]);
        return;
    }

    if (globalThis.wmpvisDesktopAudioCapturer?.stream?.active) {
        for (const track of globalThis.wmpvisDesktopAudioCapturer.stream.getTracks()) {
            track.stop();
        }
        updateVisConfig();
        App.setState({ desktopAudioAvailable: false });
        return;
    }
    if (event?.shiftKey || await confirmModal(Strings["SYSAUDIO_GUIDE_TITLE"], Strings["SYSAUDIO_GUIDE"])) {
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