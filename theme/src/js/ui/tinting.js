'use strict';

const canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 1;
const context = canvas.getContext('2d');

function getTintedColor(hue, sat, base = '#EEF3FA') {
    context.fillStyle = base;
    context.filter = `hue-rotate(${hue}deg) saturate(${sat}%)`;
    context.fillRect(0, 0, 1, 1);
    return 'rgba(' + context.getImageData(0, 0, 1, 1).data + ')';
}

export function setTintColor(hue, sat, tintPb, tintMore) {
    if (!hue && !sat) {
        document.documentElement.style.setProperty('--spice-main', '#EEF3FA');
        document.documentElement.style.removeProperty('--wmpotify-tint-hue');
        document.documentElement.style.removeProperty('--wmpotify-tint-sat');
        document.documentElement.style.removeProperty('--spice-button');
        document.documentElement.style.removeProperty('--spice-button-active');
        document.documentElement.style.removeProperty('--spice-accent');
        document.documentElement.style.removeProperty('--wmp11-text-hilight');
        document.documentElement.style.removeProperty('--hilight');
        document.documentElement.style.removeProperty('--hot-tracking-color');
        document.documentElement.style.removeProperty('--menu-hilight');
        document.documentElement.style.removeProperty('--item-hover-background');
        document.documentElement.style.removeProperty('--item-hover-border');
        document.documentElement.style.removeProperty('--menu-item-hover-background');
        document.documentElement.style.removeProperty('--menu-item-hover-border-color');
        document.documentElement.style.removeProperty('--button-border-color-inner-focus');
        document.documentElement.style.removeProperty('--menu-item-hover-color');
        document.documentElement.style.removeProperty('--button-face-hover');
        document.documentElement.style.removeProperty('--button-face-active');
        document.documentElement.style.removeProperty('--button-shade-light-hovered');
        document.documentElement.style.removeProperty('--button-shade-light-active');
        document.documentElement.style.removeProperty('--button-shade-dark-hovered');
        document.documentElement.style.removeProperty('--button-shade-top-active');
        document.documentElement.style.removeProperty('--button-shade-bottom-active');
        document.documentElement.style.removeProperty('--button-border-color-default');
        document.documentElement.style.removeProperty('--button-border-color-hovered');
        document.documentElement.style.removeProperty('--button-border-color-active');
        document.documentElement.style.removeProperty('--textbox-border-color-focused');
        document.documentElement.style.removeProperty('--textbox-border-top-color-focused');
        document.documentElement.style.removeProperty('--menu-icon-background-border-color');
        document.documentElement.style.removeProperty('--menu-icon-checkmark-color');
        document.documentElement.style.removeProperty('--menu-icon-radio-dot-outer-color');
        document.documentElement.style.removeProperty('--menu-icon-radio-dot-inner-color');
        document.documentElement.style.removeProperty('--menu-icon-radio-dot-border-color');
        document.documentElement.style.removeProperty('--menu-item-hover-border-color');
        return;
    }
    const playerBar = document.querySelector('.main-nowPlayingBar-nowPlayingBar');
    if (playerBar) {
        if (tintPb) {
            playerBar.classList.add('tinted');
        } else {
            playerBar.classList.remove('tinted');
        }
    }
    document.documentElement.style.setProperty('--spice-main', getTintedColor(hue, sat));
    document.documentElement.style.setProperty('--wmpotify-tint-hue', hue + 'deg');
    document.documentElement.style.setProperty('--wmpotify-tint-sat', sat / 100);
    if (tintMore) {
        document.documentElement.dataset.wmpotifyTintMore = true;
        const tintedAccent = getTintedColor(hue, sat, '#0067d0');
        document.documentElement.style.setProperty('--spice-button', tintedAccent);
        document.documentElement.style.setProperty('--spice-button-active', tintedAccent);
        document.documentElement.style.setProperty('--spice-accent', tintedAccent);
        document.documentElement.style.setProperty('--wmp11-text-hilight', tintedAccent);
        document.documentElement.style.setProperty('--hilight', tintedAccent);
        document.documentElement.style.setProperty('--hot-tracking-color', tintedAccent);
        document.documentElement.style.setProperty('--menu-hilight', tintedAccent);

        if (document.documentElement.dataset.wmpotifyDarkMode) {
            document.documentElement.style.setProperty('--item-hover-background', 
                `linear-gradient(
                    to bottom,
                    ${getTintedColor(hue, sat, '#272f3a')} 0%,
                    ${getTintedColor(hue, sat, '#272f39')} 10%,
                    ${getTintedColor(hue, sat, '#272e38')} 20%,
                    ${getTintedColor(hue, sat, '#272d36')} 30%,
                    ${getTintedColor(hue, sat, '#272e34')} 40%,
                    ${getTintedColor(hue, sat, '#272c33')} 50%,
                    ${getTintedColor(hue, sat, '#272b31')} 60%,
                    ${getTintedColor(hue, sat, '#272c30')} 70%,
                    ${getTintedColor(hue, sat, '#272a2e')} 80%,
                    ${getTintedColor(hue, sat, '#272b2d')} 90%,
                    ${getTintedColor(hue, sat, '#27282b')} 100%
                )`
            );
            document.documentElement.style.setProperty('--item-hover-border', getTintedColor(hue, sat, '#2f4d73'));
            document.documentElement.style.setProperty('--menu-item-hover-background', `
                linear-gradient(
                    to bottom,
                    ${getTintedColor(hue, sat, '#303b4499')},
                    ${getTintedColor(hue, sat, '#30383dcc')} 75%,
                    ${getTintedColor(hue, sat, '#30373ccc')}
                )`
            );
            document.documentElement.style.setProperty('--menu-item-hover-border-color', getTintedColor(hue, sat, '#375273'));

            document.documentElement.style.removeProperty('--button-border-color-inner-focus');
            document.documentElement.style.removeProperty('--menu-item-hover-color');
            if (localStorage.wmpotifyControlStyle !== '10') {
                document.documentElement.style.setProperty('--button-face-hover', getTintedColor(hue, sat, '#484e60'));
                document.documentElement.style.setProperty('--button-face-active', getTintedColor(hue, sat, '#384058'));
                document.documentElement.style.setProperty('--button-shade-light-hovered', getTintedColor(hue, sat, '#3b4255'));
                document.documentElement.style.setProperty('--button-shade-light-active', getTintedColor(hue, sat, '#2a344d'));
                document.documentElement.style.setProperty('--button-shade-dark-hovered', getTintedColor(hue, sat, '#366685'));
                document.documentElement.style.setProperty('--button-shade-top-active', getTintedColor(hue, sat, '#4b5166'));
                document.documentElement.style.setProperty('--button-shade-bottom-active', getTintedColor(hue, sat, '#2a5579'));
                document.documentElement.style.setProperty('--button-border-color-default', getTintedColor(hue, sat, '#9fa7bf'));
                document.documentElement.style.setProperty('--button-border-color-hovered', getTintedColor(hue, sat, '#9ea6be'));
                document.documentElement.style.setProperty('--button-border-color-active', getTintedColor(hue, sat, '#8e96ae'));
                document.documentElement.style.setProperty('--textbox-border-color-focused', getTintedColor(hue, sat, '#506a81'));
                document.documentElement.style.setProperty('--textbox-border-top-color-focused', getTintedColor(hue, sat, '#6aa9db'));
                document.documentElement.style.setProperty('--menu-icon-background-border-color', getTintedColor(hue, sat, '#32537c'));
                document.documentElement.style.setProperty('--menu-icon-checkmark-color', getTintedColor(hue, sat, '#aac9fe'));
                document.documentElement.style.setProperty('--menu-icon-radio-dot-outer-color', getTintedColor(hue, sat, '#b8c6e2'));
                document.documentElement.style.setProperty('--menu-icon-radio-dot-inner-color', getTintedColor(hue, sat, '#d5d4ea'));
                document.documentElement.style.setProperty('--menu-icon-radio-dot-border-color', getTintedColor(hue, sat, '#9fabca'));
                document.documentElement.style.setProperty('--menu-item-hover-border-color', getTintedColor(hue, sat, '#375273'));
            } else {
                document.documentElement.style.removeProperty('--button-face-hover');
                document.documentElement.style.removeProperty('--button-face-active');
                document.documentElement.style.removeProperty('--button-shade-light-hovered');
                document.documentElement.style.removeProperty('--button-shade-light-active');
                document.documentElement.style.removeProperty('--button-shade-dark-hovered');
                document.documentElement.style.removeProperty('--button-shade-top-active');
                document.documentElement.style.removeProperty('--button-shade-bottom-active');
                document.documentElement.style.removeProperty('--button-border-color-default');
                document.documentElement.style.removeProperty('--button-border-color-hovered');
                document.documentElement.style.removeProperty('--button-border-color-active');
                document.documentElement.style.removeProperty('--textbox-border-color-focused');
                document.documentElement.style.removeProperty('--textbox-border-top-color-focused');
                document.documentElement.style.removeProperty('--menu-icon-background-border-color');
                document.documentElement.style.removeProperty('--menu-icon-checkmark-color');
                document.documentElement.style.removeProperty('--menu-icon-radio-dot-outer-color');
                document.documentElement.style.removeProperty('--menu-icon-radio-dot-inner-color');
                document.documentElement.style.removeProperty('--menu-icon-radio-dot-border-color');
                document.documentElement.style.removeProperty('--menu-item-hover-border-color');
            }
        } else {
            document.documentElement.style.setProperty('--item-hover-background', 
                `linear-gradient(
                    to bottom,
                    ${getTintedColor(hue, sat, '#ebf4fc')} 0%,
                    ${getTintedColor(hue, sat, '#eaf4fc')} 10%,
                    ${getTintedColor(hue, sat, '#e9f3fc')} 20%,
                    ${getTintedColor(hue, sat, '#e8f3fc')} 30%,
                    ${getTintedColor(hue, sat, '#e7f2fc')} 40%,
                    ${getTintedColor(hue, sat, '#e5f2fc')} 50%,
                    ${getTintedColor(hue, sat, '#e2f1fc')} 60%,
                    ${getTintedColor(hue, sat, '#e1f1fc')} 70%,
                    ${getTintedColor(hue, sat, '#e0f0fc')} 80%,
                    ${getTintedColor(hue, sat, '#dff0fc')} 90%,
                    ${getTintedColor(hue, sat, '#def0fc')} 100%
                )`
            );
            document.documentElement.style.setProperty('--item-hover-border', getTintedColor(hue, sat, '#cde9f8'));
            document.documentElement.style.setProperty('--menu-item-hover-background', `
                linear-gradient(
                    to bottom,
                    #fff9,
                    ${getTintedColor(hue, sat, '#e6ecf5cc')} 90%,
                    #fffc
                )`
            );
            document.documentElement.style.setProperty('--menu-item-hover-border-color', getTintedColor(hue, sat, '#b8d6fb'));

            if (localStorage.wmpotifyControlStyle === '10') {
                document.documentElement.style.setProperty('--button-face-hover', getTintedColor(hue, sat, '#e5f1fb'));
                document.documentElement.style.setProperty('--button-face-active', getTintedColor(hue, sat, '#cce4f7'));
                const tinted0078D7 = getTintedColor(hue, sat, '#0078d7');
                document.documentElement.style.setProperty('--button-border-color-hovered', tinted0078D7);
                document.documentElement.style.setProperty('--button-border-color-active', getTintedColor(hue, sat, '#005499'));
                document.documentElement.style.setProperty('--button-border-color-inner-focus', tinted0078D7);
                document.documentElement.style.setProperty('--textbox-border-color-focused', tinted0078D7);
                document.documentElement.style.setProperty('--menu-item-hover-color', getTintedColor(hue, sat, '#91c9f7'));
            } else {
                document.documentElement.style.removeProperty('--button-border-color-inner-focus');
                document.documentElement.style.removeProperty('--menu-item-hover-color');
                document.documentElement.style.setProperty('--button-face-hover', getTintedColor(hue, sat, '#eaf6fd'));
                document.documentElement.style.setProperty('--button-face-active', getTintedColor(hue, sat, '#c4e5f6'));
                const tintedBEE6FD = getTintedColor(hue, sat, '#bee6fd');
                const tinted98D1EF = getTintedColor(hue, sat, '#98d1ef');
                document.documentElement.style.setProperty('--button-shade-light-hovered', tintedBEE6FD);
                document.documentElement.style.setProperty('--button-shade-light-active', tinted98D1EF);
                document.documentElement.style.setProperty('--button-shade-dark-hovered', getTintedColor(hue, sat, '#a7d9f5'));
                document.documentElement.style.setProperty('--button-shade-top-active', getTintedColor(hue, sat, '#e5f4fc'));
                document.documentElement.style.setProperty('--button-shade-bottom-active', getTintedColor(hue, sat, '#68b3db'));
                document.documentElement.style.setProperty('--button-border-color-default', getTintedColor(hue, sat, '#5586a3'));
                document.documentElement.style.setProperty('--button-border-color-hovered', getTintedColor(hue, sat, '#3c7fb1'));
                document.documentElement.style.setProperty('--button-border-color-active', getTintedColor(hue, sat, '#6d91ab'));
                document.documentElement.style.setProperty('--textbox-border-color-focused', tintedBEE6FD);
                document.documentElement.style.setProperty('--textbox-border-top-color-focused', tinted98D1EF);
                document.documentElement.style.setProperty('--menu-icon-background-border-color', getTintedColor(hue, sat, '#b3d3f9'));
                document.documentElement.style.setProperty('--menu-icon-checkmark-color', getTintedColor(hue, sat, '#0c12a1'));
                document.documentElement.style.setProperty('--menu-icon-radio-dot-outer-color', getTintedColor(hue, sat, '#333583'));
                document.documentElement.style.setProperty('--menu-icon-radio-dot-border-color', getTintedColor(hue, sat, '#1a1490'));
                document.documentElement.style.setProperty('--menu-item-hover-border-color', getTintedColor(hue, sat, '#b8d6fb'));
            }
        }
    } else {
        delete document.documentElement.dataset.wmpotifyTintMore;
        document.documentElement.style.removeProperty('--spice-button');
        document.documentElement.style.removeProperty('--spice-button-active');
        document.documentElement.style.removeProperty('--spice-accent');
        document.documentElement.style.removeProperty('--wmp11-text-hilight');
        document.documentElement.style.removeProperty('--hilight');
        document.documentElement.style.removeProperty('--hot-tracking-color');
        document.documentElement.style.removeProperty('--menu-hilight');
        document.documentElement.style.removeProperty('--item-hover-background');
        document.documentElement.style.removeProperty('--item-hover-border');
        document.documentElement.style.removeProperty('--menu-item-hover-background');
        document.documentElement.style.removeProperty('--menu-item-hover-border-color');
        document.documentElement.style.removeProperty('--button-border-color-inner-focus');
        document.documentElement.style.removeProperty('--menu-item-hover-color');
        document.documentElement.style.removeProperty('--button-face-hover');
        document.documentElement.style.removeProperty('--button-face-active');
        document.documentElement.style.removeProperty('--button-shade-light-hovered');
        document.documentElement.style.removeProperty('--button-shade-light-active');
        document.documentElement.style.removeProperty('--button-shade-dark-hovered');
        document.documentElement.style.removeProperty('--button-shade-top-active');
        document.documentElement.style.removeProperty('--button-shade-bottom-active');
        document.documentElement.style.removeProperty('--button-border-color-default');
        document.documentElement.style.removeProperty('--button-border-color-hovered');
        document.documentElement.style.removeProperty('--button-border-color-active');
        document.documentElement.style.removeProperty('--textbox-border-color-focused');
        document.documentElement.style.removeProperty('--textbox-border-top-color-focused');
        document.documentElement.style.removeProperty('--menu-icon-background-border-color');
        document.documentElement.style.removeProperty('--menu-icon-checkmark-color');
        document.documentElement.style.removeProperty('--menu-icon-radio-dot-outer-color');
        document.documentElement.style.removeProperty('--menu-icon-radio-dot-inner-color');
        document.documentElement.style.removeProperty('--menu-icon-radio-dot-border-color');
        document.documentElement.style.removeProperty('--menu-item-hover-border-color');
    }
}

/*

    --button-face-hover: #eaf6fd;
    --button-face-active: #c4e5f6;
    --button-shade-light-hovered: #bee6fd;
    --button-shade-light-active: #98d1ef;
    --button-shade-dark-hovered: #a7d9f5;
    --button-shade-top-active: #e5f4fc;
    --button-shade-bottom-active: #68b3db;
    --button-border-color-default: #5586a3;
    --button-border-color-hovered: #3c7fb1;
    --button-border-color-active: #6d91ab;
    --textbox-border-color-focused: #bee6fd;
    --textbox-border-top-color-focused: #98d1ef;
    --menu-icon-background-border-color: #b3d3f9;
    --menu-icon-checkmark-color: #0c12a1;
    --menu-icon-radio-dot-outer-color: #333583;
    --menu-icon-radio-dot-border-color: #1a1490;
    --menu-item-hover-border-color: #b8d6fb;

    
    --button-face-hover: #484e60;
    --button-face-active: #384058;
    --button-shade-light-hovered: #3b4255;
    --button-shade-light-active: #2a344d;
    --button-shade-dark-hovered: #366685;
    --button-border-color-default: #9fa7bf;
    --button-border-color-hovered: #9ea6be;
    --button-border-color-active: #8e96ae;
    --button-shade-top-active: #4b5166;
    --button-shade-bottom-active: #2a5579;
    --button-border-color-default: #9fa7bf;
    --button-border-color-hovered: #9ea6be;
    --button-border-color-active: #8e96ae;
    --textbox-border-color-focused: #506a81;
    --textbox-border-top-color-focused: #6aa9db;
    --menu-icon-background-border-color: #32537c;
    --menu-icon-checkmark-color: #aac9fe;
    --menu-icon-radio-dot-outer-color: #b8c6e2;
    --menu-icon-radio-dot-inner-color: #d5d4ea;
    --menu-icon-radio-dot-border-color: #9fabca;
    --menu-item-hover-border-color: #375273;


    10 (tint only in light mode):
    
  --button-face-hover: #e5f1fb;
  --button-face-active: #cce4f7;
  --button-border-color-hovered: #0078d7;
  --button-border-color-active: #005499;
  --button-border-color-inner-focus: #0078d7;
  --menu-item-hover-color: #91c9f7;
    --textbox-border-color-focused: #0078d7;
*/