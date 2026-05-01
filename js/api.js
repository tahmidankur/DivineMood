// api.js — talks to al-quran.cloud and bible-api.com
// both are free, no key needed


// Fetch a Quran verse — Arabic + English in one request.
// Returns a normalized verse object the rest of the app can use.
async function fetchQuranVerse(surah, ayah, edition = 'en.sahih') {

  // two editions separated by comma = one round trip instead of two
  const url = `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,${edition}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.code !== 200) {
    throw new Error('Quran API returned an error: ' + data.status);
  }

  // response is an array: [0] arabic, [1] english
  const arabicData  = data.data[0];
  const englishData = data.data[1];

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


// Fetch a Bible verse by reference string e.g. "John 3:16".
async function fetchBibleVerse(reference, translation = 'web') {

  const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=${translation}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error('Bible API error: ' + data.error);
  }

  // some references span multiple verses — join them into one block
  const text = data.verses
    ? data.verses.map(function(v) { return v.text.trim(); }).join(' ')
    : data.text.trim();

  return {
    id:        'bible-' + reference,
    source:    'bible',
    reference: data.reference || reference,
    arabic:    null,
    english:   text,
    label:     'World English Bible',
  };
}


// Returns a direct MP3 URL for a given ayah recited by Mishary Alafasy.
async function fetchQuranAudio(surah, ayah) {
  const url = `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.code !== 200) {
    throw new Error('Audio not available');
  }

  return data.data.audio;
}
