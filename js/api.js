// ================================================
// api.js — Functions that talk to external APIs
//
// We use two free APIs:
// 1. Al-Quran Cloud  → api.alquran.cloud
// 2. Bible API       → bible-api.com
//
// Both are completely free and need no API key.
// ================================================


// ------------------------------------------------
// FETCH A QURAN VERSE
//
// How it works:
//   - We send a request to the Al-Quran Cloud API
//   - We ask for TWO editions at once: Arabic + English
//   - The API returns both in one response
//
// Parameters:
//   surah      = the chapter number  (e.g. 2)
//   ayah       = the verse number    (e.g. 255)
//   edition    = which English translation to use
//
// Returns an object with: id, source, reference,
//   arabic, english, surah, ayah, label
// ------------------------------------------------
async function fetchQuranVerse(surah, ayah, edition = 'en.sahih') {

  // Build the API URL
  // "editions/quran-uthmani,en.sahih" asks for Arabic AND English in one call
  const url = `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,${edition}`;

  // Call the API (async/await means "wait here until the response comes back")
  const response = await fetch(url);
  const data = await response.json();

  // If the API returned an error, throw it so our app can show an error message
  if (data.code !== 200) {
    throw new Error('Quran API returned an error: ' + data.status);
  }

  // The API returns an array of two items:
  //   data.data[0] = Arabic edition
  //   data.data[1] = English translation
  const arabicData  = data.data[0];
  const englishData = data.data[1];

  // Build and return a clean verse object
  return {
    id:        'quran-' + surah + ':' + ayah,
    source:    'quran',
    reference: arabicData.surah.englishName + ' ' + surah + ':' + ayah,
    arabic:    arabicData.text,
    english:   englishData.text,
    surah:     surah,
    ayah:      ayah,
    label:     'Sahih International Translation',
  };
}


// ------------------------------------------------
// FETCH A BIBLE VERSE
//
// How it works:
//   - We send the reference string (e.g. "John 3:16")
//     directly to the Bible API URL
//   - The API returns the verse text
//
// Parameters:
//   reference  = verse reference as a string (e.g. "John 3:16")
//   translation = which translation to use (default: 'web')
//
// Returns an object with: id, source, reference,
//   arabic (null for Bible), english, label
// ------------------------------------------------
async function fetchBibleVerse(reference, translation = 'web') {

  // encodeURIComponent() turns spaces into %20 so the URL works correctly
  // Example: "John 3:16" → "John%203%3A16"
  const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=${translation}`;

  const response = await fetch(url);
  const data = await response.json();

  // The API returns { error: "..." } if something went wrong
  if (data.error) {
    throw new Error('Bible API error: ' + data.error);
  }

  // Some references return multiple verses — join them all into one text block
  const text = data.verses
    ? data.verses.map(function(v) { return v.text.trim(); }).join(' ')
    : data.text.trim();

  return {
    id:        'bible-' + reference,
    source:    'bible',
    reference: data.reference || reference,
    arabic:    null,   // Bible has no Arabic text
    english:   text,
    label:     'World English Bible',
  };
}


// ------------------------------------------------
// FETCH QURAN AUDIO URL
//
// Returns a direct MP3 link for a given ayah
// recited by Mishary Alafasy.
//
// Parameters:
//   surah  = surah number
//   ayah   = ayah number
// ------------------------------------------------
async function fetchQuranAudio(surah, ayah) {
  const url = `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.code !== 200) {
    throw new Error('Audio not available');
  }

  // The audio URL is inside data.data.audio
  return data.data.audio;
}
