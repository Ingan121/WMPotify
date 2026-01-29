// https://github.com/1j01/font-detective
// Manually converted to ESM TypeScript by me

// Helpers
function after(ms: number, fn: () => void) {
  const tid = setTimeout(fn, ms);
  return {
    stop: function() {
      return clearTimeout(tid);
    }
  };
}

function every(ms: number, fn: () => void){
  const iid = setInterval(fn, ms);
  return {
    stop: function() {
      return clearInterval(iid);
    }
  };
}

// http://www.dustindiaz.com/smallest-domready-ever
function domReady(callback: () => void) {
  if (/in/.test(document.readyState)) {
    return after(10, function() {
      return domReady(callback);
    });
  } else {
    return callback();
  }
}

// Namespace
const FD = {} as {
  preload: () => void;
  each: (callback: (font: Font) => void) => void;
  eachCallbacks: ( (font: Font) => void)[];
  all: (callback: (fonts: Font[]) => void) => void;
  allCallbacks: ( (fonts: Font[]) => void)[];
  incomplete?: boolean;
};

// A list of common fonts, somewhat biased towards Windows
const someCommonFontNames = [
  "Helvetica",
  "Lucida Grande",
  "Lucida Sans",
  "Tahoma",
  "Arial",
  "Geneva",
  "Monaco",
  "Verdana",
  "Microsoft Sans Serif",
  "Trebuchet MS",
  "Courier New",
  "Times New Roman",
  "Courier",
  "Lucida Bright",
  "Lucida Sans Typewriter",
  "URW Chancery L",
  "Comic Sans MS",
  "Georgia",
  "Palatino Linotype",
  "Lucida Sans Unicode",
  "Times",
  "Century Schoolbook L",
  "URW Gothic L",
  "Franklin Gothic Medium",
  "Lucida Console",
  "Impact",
  "URW Bookman L",
  "Helvetica Neue",
  "Nimbus Sans L",
  "URW Palladio L",
  "Nimbus Mono L",
  "Nimbus Roman No9 L",
  "Arial Black",
  "Sylfaen",
  "MV Boli",
  "Estrangelo Edessa",
  "Tunga",
  "Gautami",
  "Raavi",
  "Mangal",
  "Shruti",
  "Latha",
  "Kartika",
  "Vrinda",
  "Arial Narrow",
  "Century Gothic",
  "Garamond",
  "Book Antiqua",
  "Bookman Old Style",
  "Calibri",
  "Cambria",
  "Candara",
  "Corbel",
  "Monotype Corsiva",
  "Cambria Math",
  "Consolas",
  "Constantia",
  "MS Reference Sans Serif",
  "MS Mincho",
  "Segoe UI",
  "Arial Unicode MS",
  "Tempus Sans ITC",
  "Kristen ITC",
  "Mistral",
  "Meiryo UI",
  "Juice ITC",
  "Papyrus",
  "Bradley Hand ITC",
  "French Script MT",
  "Malgun Gothic",
  "Microsoft YaHei",
  "Gisha",
  "Leelawadee",
  "Microsoft JhengHei",
  "Haettenschweiler",
  "Microsoft Himalaya",
  "Microsoft Uighur",
  "MoolBoran",
  "Jokerman",
  "DFKai-SB",
  "KaiTi",
  "SimSun-ExtB",
  "Freestyle Script",
  "Vivaldi",
  "FangSong",
  "MingLiU-ExtB",
  "MingLiU_HKSCS",
  "MingLiU_HKSCS-ExtB",
  "PMingLiU-ExtB",
  "Copperplate Gothic Light",
  "Copperplate Gothic Bold",
  "Copperplate Gothic",
  "Franklin Gothic Book",
  "Maiandra GD",
  "Perpetua",
  "Eras Demi ITC",
  "Felix Titling",
  "Franklin Gothic Demi",
  "Pristina",
  "Edwardian Script ITC",
  "OCR A Extended",
  "OCR A",
  "Engravers MT",
  "Eras Light ITC",
  "Franklin Gothic Medium Cond",
  "Rockwell Extra Bold",
  "Rockwell",
  "Curlz MT",
  "Blackadder ITC",
  "Franklin Gothic Heavy",
  "Franklin Gothic Demi Cond",
  "Lucida Handwriting",
  "Segoe UI Light",
  "Segoe UI Semibold",
  "Lucida Calligraphy",
  "Cooper Black",
  "Viner Hand ITC",
  "Britannic Bold",
  "Wide Latin",
  "Old English Text MT",
  "Broadway",
  "Footlight MT Light",
  "Harrington",
  "Snap ITC",
  "Onyx",
  "Playbill",
  "Bauhaus 93",
  "Baskerville Old Face",
  "Algerian",
  "Matura MT Script Capitals",
  "Stencil",
  "Batang",
  "Chiller",
  "Harlow Solid Italic",
  "Kunstler Script",
  "Bernard MT Condensed",
  "Informal Roman",
  "Vladimir Script",
  "Bell MT",
  "Colonna MT",
  "High Tower Text",
  "Californian FB",
  "Ravie",
  "Segoe Script",
  "Brush Script MT",
  "SimSun",
  "Arial Rounded MT Bold",
  "Berlin Sans FB",
  "Centaur",
  "Niagara Solid",
  "Showcard Gothic",
  "Niagara Engraved",
  "Segoe Print",
  "Gabriola",
  "Gill Sans MT",
  "Iskoola Pota",
  "Calisto MT",
  "Script MT Bold",
  "Century Schoolbook",
  "Berlin Sans FB Demi",
  "Magneto",
  "Arabic Typesetting",
  "DaunPenh",
  "Mongolian Baiti",
  "DokChampa",
  "Euphemia",
  "Kalinga",
  "Microsoft Yi Baiti",
  "Nyala",
  "Bodoni MT Poster Compressed",
  "Goudy Old Style",
  "Imprint MT Shadow",
  "Gill Sans MT Condensed",
  "Gill Sans Ultra Bold",
  "Palace Script MT",
  "Lucida Fax",
  "Gill Sans MT Ext Condensed Bold",
  "Goudy Stout",
  "Eras Medium ITC",
  "Rage Italic",
  "Rockwell Condensed",
  "Castellar",
  "Eras Bold ITC",
  "Forte",
  "Gill Sans Ultra Bold Condensed",
  "Perpetua Titling MT",
  "Agency FB",
  "Tw Cen MT",
  "Gigi",
  "Tw Cen MT Condensed",
  "Aparajita",
  "Gloucester MT Extra Condensed",
  "Tw Cen MT Condensed Extra Bold",
  "PMingLiU",
  "Bodoni MT",
  "Bodoni MT Black",
  "Bodoni MT Condensed",
  "MS Gothic",
  "GulimChe",
  "MS UI Gothic",
  "MS PGothic",
  "Gulim",
  "MS PMincho",
  "BatangChe",
  "Dotum",
  "DotumChe",
  "Gungsuh",
  "GungsuhChe",
  "MingLiU",
  "NSimSun",
  "SimHei",
  "DejaVu Sans",
  "DejaVu Sans Condensed",
  "DejaVu Sans Mono",
  "DejaVu Serif",
  "DejaVu Serif Condensed",
  "Eurostile",
  "Matisse ITC",
  "Bitstream Vera Sans Mono",
  "Bitstream Vera Sans",
  "Staccato222 BT",
  "Bitstream Vera Serif",
  "Broadway BT",
  "ParkAvenue BT",
  "Square721 BT",
  "Calligraph421 BT",
  "MisterEarl BT",
  "Cataneo BT",
  "Ruach LET",
  "Rage Italic LET",
  "La Bamba LET",
  "Blackletter686 BT",
  "John Handy LET",
  "Scruff LET",
  "Westwood LET",
  "Yu Gothic",
  "Yu Gothic UI"
];

const testedFonts: Font[] = [];
let doneTestingFonts = false;
let startedLoading = false;

// The container for all font-detective related uglyness
const container = document.createElement("div");
container.id = "font-detective";
// The document body won't always exist at this point, so append this later
/*
  * A font class that can be stringified for use in css
  * e.g. font.toString() or (font + ", sans-serif")
  */
export class Font {
  name: string;
  type: string | undefined;
  style: string | undefined;

  constructor(name: string, type?: string, style?: string) {
    this.name = name;
    this.type = type;
    this.style = style;
  }

  toString() {
    // Escape \ to \\ before escaping " to \" (so " doesn't become \\"), and surround with quotes
    return '"' + this.name.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"';
  }

};

// Based off of http://www.lalit.org/lab/javascript-css-font-detect
const fontAvailabilityChecker = (function() {
  // A font will be compared against three base fonts
  // If it differs from one of the base measurements
  // (which implies it didn't fall back to the base font),
  // then the font is considered available
  const baseFontFamilies = ["monospace", "sans-serif", "serif"];
  
  // Create a span for testing the width of text
  const span = document.createElement("span");
  span.innerHTML = "mmmmmmmmmmlli";
  span.style.fontSize = "72px";
  const baseWidths = {};
  const baseHeights = {};
  return {
    init: function() {
      // Call this method once the document has a body
      document.body.appendChild(container);

      // Get the dimensions of the three base fonts
      const results: HTMLSpanElement[] = [];
      for (let j = 0, len = baseFontFamilies.length; j < len; j++) {
        const baseFontFamily = baseFontFamilies[j];
        span.style.fontFamily = baseFontFamily;
        container.appendChild(span);
        baseWidths[baseFontFamily] = span.offsetWidth;
        baseHeights[baseFontFamily] = span.offsetHeight;
        results.push(container.removeChild(span));
      }
      return results;
    },
    check: function(font: Font) {
      // Check whether a font is available
      for (let j = 0, len = baseFontFamilies.length; j < len; j++) {
        const baseFontFamily = baseFontFamilies[j];
        span.style.fontFamily = `${font}, ${baseFontFamily}`;
        container.appendChild(span);
        const differs = span.offsetWidth !== baseWidths[baseFontFamily] || span.offsetHeight !== baseHeights[baseFontFamily];
        container.removeChild(span);
        if (differs) {
          return true;
        }
      }
      return false;
    }
  };
})();
const loadFonts = function() {
  if (startedLoading) {
    return;
  }
  startedLoading = true;
  FD.incomplete = true;
  return domReady(() => {
    return testFonts((function() {
      const results: Font[] = [];
      for (let j = 0, len = someCommonFontNames.length; j < len; j++) {
        const fontName = someCommonFontNames[j];
        results.push(new Font(fontName));
      }
      return results;
    })());
  });
};
const testFonts = function(fonts: Font[]) {
  fontAvailabilityChecker.init();
  let i = 0;
  let testingFonts = every(20, function() {
    for (let j = 0; j <= 5; j++) {
      const font = fonts[i];
      const available = fontAvailabilityChecker.check(font);
      if (available) {
        testedFonts.push(font);
        const ref = FD.eachCallbacks;
        for (let k = 0, len = ref.length; k < len; k++) {
          const callback = ref[k];
          callback(font);
        }
      }
      i++;
      if (i >= fonts.length) {
        testingFonts.stop();
        const ref1 = FD.allCallbacks;
        for (let l = 0, len1 = ref1.length; l < len1; l++) {
          const callback = ref1[l];
          callback(testedFonts);
        }
        FD.allCallbacks = [];
        FD.eachCallbacks = [];
        doneTestingFonts = true;
        return;
      }
    }
  });
  return testingFonts;
};
/*
  * FontDetective.preload()
  * Starts detecting fonts early
  */
FD.preload = loadFonts;
/*
  * FontDetective.each(function(font){})
  * Calls back with a `Font` every time a font is detected and tested
  */
FD.each = function(callback) {
  for (let j = 0, len = testedFonts.length; j < len; j++) {
    const font = testedFonts[j];
    callback(font);
  }
  if (!doneTestingFonts) {
    FD.eachCallbacks.push(callback);
    return loadFonts();
  }
};
FD.eachCallbacks = [];
/*
  * FontDetective.all(function(fonts){})
  * Calls back with an `Array` of `Font`s when all fonts are detected and tested
  */
FD.all = function(callback) {
  if (doneTestingFonts) {
    return callback(testedFonts);
  } else {
    FD.allCallbacks.push(callback);
    return loadFonts();
  }
};
FD.allCallbacks = [];

export default FD;