'use strict';

import { unzlibSync } from 'fflate';

// mostly from https://github.com/Konsl/spicetify-visualizer

function parseRhythmString(rhythmString) {
	rhythmString = rhythmString.replace(/-/g, "+").replace(/_/g, "/");
	const compressed = new Uint8Array(
		atob(rhythmString)
			.split("")
			.map(c => c.charCodeAt(0))
	);
	const decompressed = unzlibSync(compressed);

	const input = new TextDecoder()
		.decode(decompressed)
		.split(" ")
		.map(s => parseInt(s));
	const output = [];
	if (input.length < 3) return output;

	const sampleRate = input.shift();
	const stepSize = input.shift();
	const stepDuration = stepSize / sampleRate;

	const channelCount = input.shift();
	if (input.length < channelCount) return output;

	for (let i = 0; i < channelCount; i++) {
		const channel = [];
		const entryCount = input.shift();
		if (input.length < entryCount + (channelCount - i - 1)) return output;

		for (let j = 0; j < entryCount; j++) {
			const entry = input.shift() * stepDuration;
			channel.push(j == 0 ? entry : channel[j - 1] + entry);
		}

		output.push(channel);
	}

	return output;
}

function decibelsToAmplitude(decibels) {
	return Math.min(Math.max(Math.pow(10, decibels / 20), 0), 1);
}

function binarySearchIndex(array, converter, position) {
	let lowerBound = 0;
	let upperBound = array.length;

	while (upperBound - lowerBound > 1) {
		const testIndex = Math.floor((upperBound + lowerBound) / 2);
		const pointPos = converter(array[testIndex], testIndex);

		if (pointPos <= position) lowerBound = testIndex;
		else upperBound = testIndex;
	}

	return lowerBound;
}

function mapLinear(value, iMin, iMax, oMin, oMax) {
	value = (value - iMin) / (iMax - iMin);
	value = value * (oMax - oMin) + oMin;
	return value;
}

function sampleSegmentedFunction(array, getX, getY, interpolate, position) {
	const pointIndex = binarySearchIndex(array, getX, position);
	const point = array[pointIndex];

	if (pointIndex > array.length - 2) return getY(point, pointIndex);
	const nextPoint = array[pointIndex + 1];

	return map(
		position,
		getX(point, pointIndex),
		getX(nextPoint, pointIndex + 1),
		interpolate,
		getY(point, pointIndex),
		getY(nextPoint, pointIndex + 1)
	);
}

function map(value, iMin, iMax, interpolate, oMin, oMax) {
	value = (value - iMin) / (iMax - iMin);
	value = interpolate(value);
	value = value * (oMax - oMin) + oMin;
	return value;
}

function smoothstep(x) {
	return x * x * (3 - 2 * x);
}

export async function spAudioDataToFrequencies() {
    const audioData = await Spicetify.getAudioData();

    const segments = audioData.segments;
    const rhythm = parseRhythmString(audioData.track.rhythmstring);

    if (segments.length === 0 || rhythm.length === 0) return [];

    const RHYTHM_WEIGHT = 0.4;
    const RHYTHM_OFFSET = 0.2;

    const rhythmWindowSize = (RHYTHM_WEIGHT / Math.sqrt(2)) * 8;

    const channelCount = 12 * rhythm.length;
    const channelSegments = [];

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const amplitudeStart = decibelsToAmplitude(segment.loudness_start);
        const amplitudeMax = decibelsToAmplitude(segment.loudness_max);
        const peakPosition = segment.start + segment.loudness_max_time;
        const pitches = segment.pitches;

        const rhythmWindowStart = peakPosition - rhythmWindowSize;
        const rhythmWindowEnd = peakPosition + rhythmWindowSize;
        const frequencies = rhythm.map(channel => {
            const start = binarySearchIndex(channel, e => e, rhythmWindowStart);
            const end = binarySearchIndex(channel, e => e, rhythmWindowEnd);

            return (
                channel
                    .slice(start, end)
                    .map(e => Math.exp(-Math.pow((e - peakPosition) / RHYTHM_WEIGHT, 2)))
                    .reduce((a, b) => a + b, 0) + RHYTHM_OFFSET
            );
        });

        const frequenciesMax = Math.max(...frequencies);
        for (let i = 0; i < frequencies.length; i++) frequencies[i] /= frequenciesMax;

        const channels = Array(channelCount);
        for (let j = 0; j < frequencies.length; j++) {
            const pitchVariation = mapLinear(j, 0, frequencies.length - 1, 0.2, 0.6);

            for (let k = 0; k < 12; k++) {
                const frequency = sampleSegmentedFunction(
                    [...frequencies.entries()],
                    e => e[0],
                    e => e[1],
                    smoothstep,
                    j + k / 12
                );
                const pitchAvg = pitches.reduce((a, b) => a + b, 0) / pitches.length;
                const pitch = pitches[k] * pitchVariation + pitchAvg * (1 - pitchVariation);
                channels[12 * j + k] = frequency * pitch;
            }
        }

        channelSegments.push([segment.start, ...channels.map(c => c * amplitudeStart)]);
        channelSegments.push([peakPosition, ...channels.map(c => c * amplitudeMax)]);

        if (i == segments.length - 1) {
            const amplitudeEnd = decibelsToAmplitude(segment.loudness_end);
            channelSegments.push([segment.start + segment.duration, ...channels.map(c => c * amplitudeEnd)]);
        }
    }
    return channelSegments;
}