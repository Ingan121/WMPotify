import enUS from './lang/en-US.js';
import koKR from './lang/ko-KR.js';

const supportedLanguages = {
    "en-US": "English",
    "ko-KR": "한국어"
};

let lang = navigator.language;

if (!(lang in supportedLanguages)) {
    for (const supportedLang in supportedLanguages) {
        if (lang.slice(0, 2) === supportedLang.slice(0, 2)) {
            lang = supportedLang;
            break;
        }
    }
    if (!(lang in supportedLanguages)) {
        lang = "en-US";
    }
}

const strings = {
    'en-US': enUS,
    'ko-KR': koKR,
};

const currentStrings = strings[lang] || strings['en-US'];
currentStrings.getString = getString;

export default currentStrings;

function getString(locId) {
    if (currentStrings[locId]) {
        return processString(currentStrings[locId], ...Array.from(arguments).slice(1));
    } else if (strings['en-US'][locId]) {
        console.info(`Fallback string used for locId ${locId}`);
        return processString(strings['en-US'][locId], ...Array.from(arguments).slice(1));
    } else {
        console.error(`No string found for locId ${locId}`);
        return locId;
    }
}

export function processString(str) {
    // &Apply -> <u>A</u>pply
    // \&Apply -> &Apply
    str = str.replace(/&([^&])/g, "<u>$1</u>").replace(/\\&/g, "&");
    // %s -> extraString
    // %[n]s -> arguments[n]
    if (arguments.length > 1) {
        for (let i = 1; i < arguments.length; i++) {
            str = str.replace(/%s/, arguments[i]);
            str = str.replace(`%${i}s`, arguments[i]);
        }
    }
    return str;
}