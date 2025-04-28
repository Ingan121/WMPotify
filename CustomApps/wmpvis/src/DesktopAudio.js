'use strict';

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

export async function getDesktopAudioCapturer() {
    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    const audioContext = new AudioContext();

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
        throw new Error("No audio track available in the display media stream.");
    }

    const audioSource = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;

    audioSource.connect(analyser);

    return { analyser, stream, audioContext };
}
