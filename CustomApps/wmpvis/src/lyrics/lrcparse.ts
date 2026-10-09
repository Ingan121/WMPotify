// lrcparse.js for WMPotify NowPlaying
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

interface ParsedLRC {
    time: number;
    text: string;
}

export default class LRC {
    lrcText?: string;
    parsed: ParsedLRC[];

    artist?: string;
    title?: string;
    albumTitle?: string;
    duration?: number;

    constructor(lrc: string | ParsedLRC[]) {
        if (typeof lrc === "string") {
            this.lrcText = lrc;
            this.parsed = [];
            for (const line of this.lrcText.split('\n')) {
                if (line.startsWith('[ar:')) {
                    this.artist = line.substring(4, line.length - 1);
                } else if (line.startsWith('[ti:')) {
                    this.title = line.substring(4, line.length - 1);
                } else if (line.startsWith('[al:')) {
                    this.albumTitle = line.substring(4, line.length - 1);
                } else if (line.startsWith('[length:')) {
                    const value = line.substring(8, line.length - 1).trim().split(':');
                    if (value.length === 2) {
                        this.duration = parseInt(value[0], 10) * 60 + parseInt(value[1], 10);
                    }
                } else {
                    const time = line.match(/\[(\d+):(\d+\.\d+)\]/);
                    if (time) {
                        const text = line.replace(time[0], '').trim();
                        const min = parseInt(time[1], 10);
                        const sec = parseFloat(time[2]);
                        if (!Number.isNaN(min) && !Number.isNaN(sec)) {
                            this.parsed.push({
                                text, time: min * 60 + sec
                            });
                        }
                    }
                }
            }
        } else {
            this.parsed = lrc;
        }
    }

    toPlain(): string {
        if (this.lrcText === undefined) {
            this.lrcText = "";
            for (const line of this.parsed) {
                this.lrcText += `${line.text}\n`;
            }
        }
        return this.lrcText;
    }

    static toPlain(lrcText: string): string {
        return lrcText.replace(/\[\d+:\d+\.\d+\]/g, '').replace(/\[.*?:.*?\]/g, '').trim().split('\n').map(line => line.trim()).join('\n');
    }

    isTextLrc(): boolean {
        return this.parsed.length !== 0;
    }
}
