# Divine Mood

Pick how you're feeling and get a verse from the Quran or the Bible that fits. Quran verses come with the Arabic text, an English translation and a recitation you can play.

Live: https://divine-mood.vercel.app

## Features

- 8 moods (happy, sad, anxious, hopeful, grateful, fearful, angry, lonely)
- Switch between Quran and Bible for the same mood
- Quran audio by Mishary Alafasy
- Save verses (kept in localStorage), reopen or share them, undo a removal
- Remembers whether you prefer Quran or Bible
- Installable as a PWA: install button on Android/desktop, an "Add to Home Screen" hint on iPhone
- Works offline: the app, your saved verses and any verse you've already seen
- Shows a "new version is ready" banner after a deploy

## Running it

It's plain HTML/CSS/JS, so any static server works:

```bash
python3 -m http.server
```

then open http://localhost:8000.

## Files

- `js/data.js` - verse references for each mood
- `js/api.js` - calls to the Quran and Bible APIs
- `js/app.js` - screens, saving, sharing, audio
- `js/pwa.js` - service worker registration, install prompt, update banner, offline notice
- `sw.js` - service worker (network-first for the app, cache-first for verse text)
- `assets/icons/` - PWA and home-screen icons generated from `assets/logo.png`

When you deploy, bump `VERSION` in `sw.js` so installed copies pick up the new files and clear old caches.

## APIs

- [Al-Quran Cloud](https://alquran.cloud/api) for Arabic text, Sahih International translation and audio
- [bible-api.com](https://bible-api.com) for the World English Bible

Neither needs an API key.
