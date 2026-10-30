# Divine Mood

Pick how you're feeling and get a verse from the Quran or the Bible that fits. Quran verses come with the Arabic text, an English translation and a recitation you can play.

Live: https://divine-mood.vercel.app

## Features

- 8 moods (happy, sad, anxious, hopeful, grateful, fearful, angry, lonely)
- Switch between Quran and Bible for the same mood
- Quran audio by Mishary Alafasy
- Save verses (kept in localStorage) and share them
- Installable as a PWA, works offline for the app shell

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
- `sw.js` - service worker for offline caching

## APIs

- [Al-Quran Cloud](https://alquran.cloud/api) for Arabic text, Sahih International translation and audio
- [bible-api.com](https://bible-api.com) for the World English Bible

Neither needs an API key.
