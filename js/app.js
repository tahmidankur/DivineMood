// app.js — screens, verse loading, save/share, audio, toasts

let currentMood      = 'happy';
let currentTradition = 'quran';
let currentVerse     = null;
let verseIndex       = {};   // tracks how far we've cycled through verses per mood
let audioElement     = null;
let isPlaying        = false;
let savedVerses      = [];

loadSavedFromStorage();


// --- localStorage ---

function loadSavedFromStorage() {
  const stored = localStorage.getItem('divinemood_saved');
  if (stored) {
    savedVerses = JSON.parse(stored);
  }
}

function persistSaved() {
  localStorage.setItem('divinemood_saved', JSON.stringify(savedVerses));
}


// --- Screen switching ---
// Hides everything, then shows whichever screen was asked for.
function showScreen(screenName) {

  // kill audio whenever leaving the verse screen
  if (screenName !== 'verse') {
    stopAudio();
  }

  document.querySelectorAll('.screen').forEach(function(screen) {
    screen.classList.remove('active');
  });

  document.getElementById('screen-' + screenName).classList.add('active');

  if (screenName === 'saved') {
    renderSavedList();
  }
}


// --- Mood selection ---
function pickMood(mood) {
  currentMood      = mood;
  currentTradition = 'quran';  // always land on Quran first

  document.getElementById('verse-mood-label').textContent = MOOD_EMOJI[mood];

  document.getElementById('btn-quran').classList.add('active');
  document.getElementById('btn-bible').classList.remove('active');

  showScreen('verse');
  loadVerse();
}


// --- Tradition toggle (Quran / Bible) ---
function switchTradition(tradition) {
  currentTradition = tradition;
  stopAudio();

  document.getElementById('btn-quran').classList.toggle('active', tradition === 'quran');
  document.getElementById('btn-bible').classList.toggle('active', tradition === 'bible');

  loadVerse();
}


// --- Load a verse ---
async function loadVerse() {
  stopAudio();

  document.getElementById('verse-content').innerHTML = `
    <div class="loading-box">
      <div class="spinner"></div>
      <p>Finding your verse…</p>
    </div>`;

  // audio player only makes sense for Quran
  document.getElementById('audio-player').style.display =
    currentTradition === 'quran' ? 'flex' : 'none';

  updateSaveButton();

  try {
    let verse;

    if (currentTradition === 'quran') {
      const quranList = VERSES[currentMood].quran;
      const key = 'q_' + currentMood;
      if (verseIndex[key] === undefined) verseIndex[key] = 0;
      const ref = quranList[verseIndex[key] % quranList.length];
      verseIndex[key]++;
      verse = await fetchQuranVerse(ref.s, ref.a);

    } else {
      const bibleList = VERSES[currentMood].bible;
      const key = 'b_' + currentMood;
      if (verseIndex[key] === undefined) verseIndex[key] = 0;
      const ref = bibleList[verseIndex[key] % bibleList.length];
      verseIndex[key]++;
      verse = await fetchBibleVerse(ref);
    }

    currentVerse = verse;
    displayVerse(verse);
    updateSaveButton();

  } catch (error) {
    document.getElementById('verse-content').innerHTML = `
      <div class="error-box">
        <div style="font-size:40px; margin-bottom:10px;">😔</div>
        <p>Could not load verse.<br>Please check your internet connection.</p>
        <button class="btn-gold" style="width:auto; padding:12px 28px; margin-top:16px;"
          onclick="loadVerse()">Try Again</button>
      </div>`;

    console.error('loadVerse error:', error);
  }
}


// --- Render a verse card ---
function displayVerse(verse) {
  const isQuran = verse.source === 'quran';

  document.getElementById('verse-content').innerHTML = `
    <div class="verse-card">

      <div class="verse-source">
        ${isQuran ? '📖' : '✝'} ${verse.reference}
      </div>

      ${isQuran
        ? `<div class="arabic-text">${verse.arabic}</div>
           <hr class="verse-divider"/>`
        : ''}

      <p class="english-text">"${verse.english}"</p>
      <p class="translation-label">${verse.label}</p>

    </div>`;
}


// --- Audio (Quran only) ---

async function toggleAudio() {
  if (!currentVerse || currentVerse.source !== 'quran') return;
  if (isPlaying) {
    stopAudio();
  } else {
    await startAudio();
  }
}

async function startAudio() {
  try {
    const audioUrl = await fetchQuranAudio(currentVerse.surah, currentVerse.ayah);

    if (audioElement) audioElement.pause();

    audioElement = new Audio(audioUrl);
    audioElement.play();
    isPlaying = true;

    audioElement.onended = function() {
      isPlaying = false;
      updatePlayButton();
      document.getElementById('wave-bars').classList.remove('playing');
    };

    updatePlayButton();
    document.getElementById('wave-bars').classList.add('playing');

  } catch (error) {
    showToast('Audio not available right now');
    console.error('Audio error:', error);
  }
}

function stopAudio() {
  if (audioElement) audioElement.pause();
  isPlaying = false;
  updatePlayButton();

  // wave-bars only exists on the verse screen
  const waveBars = document.getElementById('wave-bars');
  if (waveBars) waveBars.classList.remove('playing');
}

function updatePlayButton() {
  const btn = document.getElementById('play-btn');
  if (!btn) return;

  if (isPlaying) {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>`;
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>`;
  }
}


// --- Save / remove verse ---

function saveCurrentVerse() {
  if (!currentVerse) return;

  const alreadySaved = savedVerses.some(function(v) {
    return v.id === currentVerse.id;
  });

  if (alreadySaved) {
    savedVerses = savedVerses.filter(function(v) {
      return v.id !== currentVerse.id;
    });
    showToast('Verse removed');
  } else {
    savedVerses.unshift({
      id:        currentVerse.id,
      source:    currentVerse.source,
      mood:      currentMood,
      reference: currentVerse.reference,
      arabic:    currentVerse.arabic,
      english:   currentVerse.english,
      savedAt:   Date.now(),
    });
    showToast('✓ Verse saved!');
  }

  persistSaved();
  updateSaveButton();
}

function updateSaveButton() {
  const btn = document.getElementById('save-btn');
  if (!btn || !currentVerse) return;

  const isSaved = savedVerses.some(function(v) {
    return v.id === currentVerse.id;
  });

  if (isSaved) {
    btn.classList.add('saved');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" width="20" height="20">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
      Saved`;
  } else {
    btn.classList.remove('saved');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
      Save`;
  }
}


// --- Share ---
async function shareVerse() {
  if (!currentVerse) return;

  const text = '"' + currentVerse.english + '" — ' + currentVerse.reference
             + '\n\nShared via Divine Mood';

  if (navigator.share) {
    await navigator.share({ title: 'Divine Mood', text: text });
  } else {
    // desktop fallback
    navigator.clipboard.writeText(text);
    showToast('✓ Copied to clipboard');
  }
}


// --- Saved verses list ---

function renderSavedList() {
  const container = document.getElementById('saved-list');

  if (savedVerses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕊️</div>
        <h3>Nothing saved yet</h3>
        <p>Tap the Save button on any verse to keep it here</p>
      </div>`;
    return;
  }

  container.innerHTML = savedVerses.map(function(verse, index) {
    const isQuran = verse.source === 'quran';

    const date = new Date(verse.savedAt).toLocaleDateString('en-CA', {
      month: 'short',
      day:   'numeric'
    });

    return `
      <div class="saved-item">

        <div class="saved-item-top">
          <span class="source-badge ${isQuran ? 'badge-quran' : 'badge-bible'}">
            ${isQuran ? '📖 Quran' : '✝ Bible'}
          </span>
          <button class="remove-btn" onclick="removeVerse(${index})">✕</button>
        </div>

        ${isQuran && verse.arabic
          ? `<div class="saved-arabic">${verse.arabic}</div>`
          : ''}

        <p class="saved-english">"${verse.english}"</p>

        <div class="saved-meta">
          <span class="saved-ref">${verse.reference}</span>
          <span class="saved-date">${date}</span>
        </div>

      </div>`;
  }).join('');
}

function removeVerse(index) {
  savedVerses.splice(index, 1);
  persistSaved();
  renderSavedList();
  showToast('Verse removed');
}


// --- Toast ---
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(function() {
    toast.classList.remove('show');
  }, 2500);
}
