// spotify.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

export async function getSpotifyNowPlaying(lang) {
    try {
        if (!Spicetify.Player.data) {
            return {
                item: null,
                errorCode: -1
            };
        }
        if (!lang) {
            return Spicetify.Player.data;
        } else {
            const headers = {
                'Authorization': 'Bearer ' + Spicetify.Platform.AuthorizationAPI.getState().token.accessToken
            }
            headers['Accept-Language'] = lang;
            const response = await fetch('https://api.spotify.com/v1/tracks/' + Spicetify.Player.data.item.uri.split(':')[2], {
                method: 'GET',
                headers: headers
            });
            if (response.status === 200) {
                const json = await response.json();
                return {
                    item: json
                };
            } else {
                return {
                    item: null,
                    errorCode: response.status
                };
            }
        }
    } catch (error) {
        console.error(error);
        return {
            item: null,
            errorCode: -1
        }
    }
}
