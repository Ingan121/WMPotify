import Strings from './lang/strings';
import enUS from './lang/en-US';
import koKR from './lang/ko-KR';
import esAR from './lang/es-AR';

// Translation guide, kinda: https://github.com/Ingan121/ModernActiveDesktop/blob/master/docs/Translating.md
// It uses the localization system with the same basis, but there are a lot of differences and missing stuff (e.g. some formatting characters in processString)
// so refer to the code and comments in this file and files in ./lang as well

const supportedLanguages = {
    "en-US": "English",
    "ko-KR": "한국어",
    "es-AR": "Español"
};

let lang = navigator.language;

// 1. Exact match, 2. Match first 2 characters (e.g. "en" matches "en-US"), 3. Default to English
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

const strings: { [key: string]: Strings } = {
    'en-US': enUS,
    'ko-KR': koKR,
    'es-AR': esAR
};

const currentStrings = strings['en-US'];
if (lang !== 'en-US') {
    Object.assign(currentStrings, strings[lang]);
}
const exportedStrings = {
    ...currentStrings,
    getString: getString
};
export default exportedStrings;

function getString(locId: keyof Strings, ...args: any[]): string {
    if (currentStrings[locId]) {
        return processString(currentStrings[locId], ...args);
    } else if (strings['en-US'][locId]) {
        console.info(`Fallback string used for locId ${locId}`);
        return processString(strings['en-US'][locId], ...args);
    } else {
        console.error(`No string found for locId ${locId}`);
        return locId;
    }
}

export function processString(str: string, ...extraStrings: any[]): string {
    // &Apply -> <u>A</u>pply
    // \&Apply -> &Apply
    str = str.replace(/&([^&])/g, "<u>$1</u>").replace(/\\&/g, "&");
    // %s -> extraStrings[0]
    // %[n]s -> extraStrings[n]
    if (extraStrings.length > 0) {
        for (let i = 0; i < extraStrings.length; i++) {
            str = str.replace(/%s/, extraStrings[i]);
            str = str.replace(`%${i + 1}s`, extraStrings[i]);
        }
    }
    return str;
}