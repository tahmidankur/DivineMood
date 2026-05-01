# 🕌 Divine Mood

A beautiful web app that matches your mood to verses from the **Quran** and **Bible**.

Built with plain HTML, CSS, and JavaScript — no frameworks, no installation needed.

---

## ✨ Features

- 8 moods: Happy, Sad, Anxious, Hopeful, Grateful, Fearful, Angry, Lonely
- Quran verses with Arabic text + English translation
- Bible verses in English
- Quran audio recitation (Mishary Alafasy)
- Save favourite verses (stored in your browser)
- Share any verse with friends
- Works on mobile and desktop

---

## 📁 Project Structure

```
divine-mood/
│
├── index.html        ← The HTML structure (4 screens)
│
├── css/
│   └── style.css     ← All the visual styles and animations
│
├── js/
│   ├── data.js       ← All verse references (Quran + Bible)
│   ├── api.js        ← Functions that fetch verses from APIs
│   └── app.js        ← All app logic (switching screens, saving, audio)
│
└── README.md         ← This file
```

---

## 🚀 How to Run Locally

1. Open this folder in **VS Code**
2. Install the **Live Server** extension (by Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**
4. App opens at `http://127.0.0.1:5500`

No terminal, no npm, no install needed.

---

## 🌐 Deploy to GitHub Pages

1. Push this folder to GitHub
2. Go to repo → **Settings** → **Pages**
3. Source: **Deploy from a branch** → branch: `main` → folder: `/ (root)`
4. Click **Save**
5. Live at: `https://your-username.github.io/divine-mood`

---

## 📡 APIs Used

| API | What it does | Cost |
|-----|-------------|------|
| [Al-Quran Cloud](https://alquran.cloud/api) | Arabic text, English translation, Audio MP3 | Free, no key |
| [bible-api.com](https://bible-api.com) | Bible verse text | Free, no key |
| [Google Fonts](https://fonts.google.com) | Playfair Display, DM Sans, Noto Naskh Arabic | Free |

---

## 🛠️ Languages

- **HTML** — page structure and 4 screens
- **CSS** — all styles, colours, and animations
- **JavaScript** — app logic, API calls, saving verses
