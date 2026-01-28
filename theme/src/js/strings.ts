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

type Strings = typeof enUS;

const strings: { [key: string]: Strings } = {
    'en-US': enUS,
    'ko-KR': koKR,
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