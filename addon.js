const { addonBuilder } = require("stremio-addon-sdk");
const languageMap = {
  Abkhazian: "ab",
  Afar: "aa",
  Afrikaans: "af",
  Albanian: "sq",
  Amharic: "am",
  Arabic: "ar",
  Aragonese: "an",
  Armenian: "hy",
  Assamese: "as",
  Aymara: "ay",
  Azerbaijani: "az",
  Bashkir: "ba",
  Basque: "eu",
  Bengali: "bn",
  Bihari: "bh",
  Bislama: "bi",
  Bosnian: "bs",
  Breton: "br",
  Bulgarian: "bg",
  Burmese: "my",
  Catalan: "ca",
  Chinese: "zh",
  Chuvash: "cv",
  Cornish: "kw",
  Corsican: "co",
  Croatian: "hr",
  Czech: "cs",
  Danish: "da",
  Dutch: "nl",
  Dzongkha: "dz",
  English: "en",
  Esperanto: "eo",
  Estonian: "et",
  Ewe: "ee",
  Fijian: "fj",
  Finnish: "fi",
  French: "fr",
  Georgian: "ka",
  German: "de",
  Greek: "el",
  Guaraní: "gn",
  Gujarati: "gu",
  "Haitian Creole": "ht",
  Hausa: "ha",
  Hawaiian: "haw",
  Hebrew: "he",
  Hindi: "hi",
  Hmong: "hmn",
  Hungarian: "hu",
  Icelandic: "is",
  Igbo: "ig",
  Indonesian: "id",
  Interlingua: "ia",
  Irish: "ga",
  Italian: "it",
  Japanese: "ja",
  Javanese: "jv",
  Kannada: "kn",
  Kazakh: "kk",
  Khmer: "km",
  Kinyarwanda: "rw",
  Korean: "ko",
  Kurdish: "ku",
  Kyrgyz: "ky",
  Lao: "lo",
  Latin: "la",
  Latvian: "lv",
  Lingala: "ln",
  Lithuanian: "lt",
  Luxembourgish: "lb",
  Macedonian: "mk",
  Malagasy: "mg",
  Malay: "ms",
  Malayalam: "ml",
  Maltese: "mt",
  Maori: "mi",
  Marathi: "mr",
  Mongolian: "mn",
  Nepali: "ne",
  Norwegian: "no",
  Occitan: "oc",
  Oromo: "om",
  Pashto: "ps",
  Persian: "fa",
  Polish: "pl",
  Portuguese: "pt",
  Quechua: "qu",
  Romanian: "ro",
  Russian: "ru",
  Samoan: "sm",
  Sanskrit: "sa",
  "Scots Gaelic": "gd",
  Serbian: "sr",
  Sesotho: "st",
  Shona: "sn",
  Sindhi: "sd",
  Sinhalese: "si",
  Slovak: "sk",
  Slovenian: "sl",
  Somali: "so",
  Spanish: "es",
  Sundanese: "su",
  Swahili: "sw",
  Swedish: "sv",
  Tajik: "tg",
  Tamil: "ta",
  Tatar: "tt",
  Telugu: "te",
  Thai: "th",
  Tigrinya: "ti",
  Turkish: "tr",
  Turkmen: "tk",
  Ukrainian: "uk",
  Urdu: "ur",
  Uzbek: "uz",
  Vietnamese: "vi",
  Volapük: "vo",
  Walloon: "wa",
  Welsh: "cy",
  Wolof: "wo",
  Xhosa: "xh",
  Yiddish: "yi",
  Yoruba: "yo",
  Zulu: "zu"
};

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
  id: "community.lobo",
  version: "0.0.1",
  catalogs: [],
  resources: ["stream"],
  types: ["movie", "series", "anime", "others"],
  name: "Lobo",
  description: "",
  logo: "http://127.0.0.1:60010/assets/logo.jpg",
  idPrefixes: ["tt"]
};
const builder = new addonBuilder(manifest);

async function stringAtob(input) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = input.replace(/=+$/, "");
  let output = "";

  if (str.length % 4 === 1) {
    throw new Error(
      "'atob' failed: The string to be decoded is not correctly encoded."
    );
  }

  for (
    let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
}

async function requestGet(url, headers = {}) {
  try {
    const response = await fetch(url, { method: "GET", headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return "";
  }
}

function getSizeQuality(url) {
  const parts = url.split("/");
  const base64Part = parts[parts.length - 2];
  const decodedPart = atob(base64Part);
  const sizeQuality = Number(decodedPart) || 1080;
  return sizeQuality;
}

async function getSource(tmdb_id, s, e) {
  console.log(tmdb_id, s, e);
  const DOMAIN = "https://embed.su";
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Referer: DOMAIN,
    Origin: DOMAIN
  };

  try {
    const urlSearch =
      s && e
        ? `${DOMAIN}/embed/tv/${tmdb_id}/${s}/${e}`
        : `${DOMAIN}/embed/movie/${tmdb_id}`;
    const htmlSearch = await fetch(urlSearch, { method: "GET", headers });
    const textSearch = await htmlSearch.text();

    const hashEncodeMatch = textSearch.match(/JSON\.parse\(atob\(\`([^\`]+)/i);
    const hashEncode = hashEncodeMatch ? hashEncodeMatch[1] : "";

    if (!hashEncode) return;

    const hashDecode = JSON.parse(await stringAtob(hashEncode));
    const mEncrypt = hashDecode.hash;
    if (!mEncrypt) return;

    const firstDecode = (await stringAtob(mEncrypt))
      .split(".")
      .map((item) => item.split("").reverse().join(""));

    console.log(firstDecode);

    const mediaTitle = `${hashDecode.title}  `;

    const out_id = hashDecode.episodeId.split(":");
    const season = out_id[2];
    const episode = out_id[3];

    const seasonAndEpisode = `${
      out_id[0] === "t" ? " | S" + season + "E" + episode + " | " : ""
    }`;

    const secondDecode = JSON.parse(
      await stringAtob(firstDecode.join("").split("").reverse().join(""))
    );

    if (!secondDecode || secondDecode.length === 0) return;

    const streams = [];

    for (const item of secondDecode) {
      if (item.name.toLowerCase() !== "viper") continue;

      const urlDirect = `${DOMAIN}/api/e/${item.hash}`;
      const dataDirect = await requestGet(urlDirect, {
        Referer: DOMAIN,
        "User-Agent": headers["User-Agent"],
        Accept: "*/*"
      });

      if (!dataDirect.source) continue;

      const tracks = dataDirect.subtitles
        .map((sub) => ({
          url: sub.file,
          lang: languageMap[sub.label.split(" ")[0]] || sub.label
        }))
        .filter((track) => track.lang);

      const requestDirectSize = await fetch(dataDirect.source, {
        headers,
        method: "GET"
      });
      const parseRequest = await requestDirectSize.text();

      const patternSize = parseRequest
        .split("\n")
        .filter((item) => item.includes("/proxy/"));

      const directQuality = patternSize.map((patternItem) => {
        const sizeQuality = getSizeQuality(patternItem);
        let dURL = `${DOMAIN}${patternItem}`;
        dURL = dURL
          .replace("embed.su/api/proxy/viper/", "")
          .replace(".png", ".m3u8")
          .replace(/=\/[^/]+\/[^/]+(?=\.m3u8)/, "=/cGxheWxpc3QubTN1OA==");

        return {
          url: dURL,
          name: `Lobo | ${sizeQuality}p`,
          description: `${mediaTitle}${seasonAndEpisode}`
        };
      });

      if (!directQuality.length) continue;

      streams.push(...directQuality);
    }

    return streams;
  } catch (e) {
    console.error(e);
    return [{ url: "", name: "", subtitles: [] }];
  }
}

builder.defineStreamHandler(async function (args) {
  return new Promise(async function (resolve, reject) {
    if (args.type === "movie") {
      const stream = await getSource(args.id);

      resolve({ streams: stream });
    } else if (args.type === "series") {
      const string_out = args.id.split(":");
      const id = string_out[0];
      const season = string_out[1];
      const espisode = string_out[2];
      const stream = await getSource(id, season, espisode);

      resolve({ streams: stream });
    } else {
      reject(new Error("No streams found for: " + args.id));
    }
  });
});

module.exports = builder.getInterface();
