// app.js — screens, verse loading, save/share, audio, toasts

const STORAGE_KEY   = 'divinemood_saved';
const PREFS_KEY     = 'divinemood_prefs';

let currentMood      = 'happy';
let currentTradition = 'quran';
let currentVerse     = null;
let verseIndex       = {};   // how far we've cycled through verses per mood
let audioElement     = null;
let isPlaying        = false;
let savedVerses      = [];
let loadToken        = 0;    // ignores stale responses when "Another verse" is tapped quickly
let lastRemoved      = null; // for undo

const prefs = loadJSON(PREFS_KEY, {});
if (prefs.tradition === 'bible' || prefs.tradition === 'quran') currentTradition = prefs.tradition;

loadSavedFromStorage();


// --- helpers ---

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full / private mode */ }
}

// API text is inserted as HTML, so escape it
function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function moodLabel(mood) {
  return MOOD_EMOJI[mood] || mood;
}


// --- localStorage ---

function loadSavedFromStorage() {
  const stored = loadJSON(STORAGE_KEY, []);
  savedVerses = Array.isArray(stored) ? stored : [];
}

function persistSaved() {
  saveJSON(STORAGE_KEY, savedVerses);
  updateNavCount();
}


// --- Screen switching + history ---
// Each screen gets a history entry so the phone's back button / swipe-back
// moves between screens instead of closing the app.

const SCREENS = ['welcome', 'moods', 'verse', 'saved'];

function showScreen(screenName) {
  if (!SCREENS.includes(screenName)) screenName = 'welcome';

  // kill audio whenever leaving the verse screen
  if (screenName !== 'verse') stopAudio();

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screenName).classList.add('active');

  // bottom nav only on moods + saved
  const nav = document.getElementById('bottom-nav');
  nav.classList.toggle('visible', screenName === 'moods' || screenName === 'saved');
  nav.querySelectorAll('.nav-btn').forEach(btn => {
    const on = btn.dataset.nav === screenName;
    btn.classList.toggle('active', on);
    if (on) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
  });

  if (screenName === 'saved') renderSavedList();

  window.scrollTo(0, 0);
}

function navigate(screenName, opts) {
  opts = opts || {};
  const state = { screen: screenName, mood: currentMood };
  const url = '#' + screenName;
  if (opts.replace) history.replaceState(state, '', url);
  else              history.pushState(state, '', url);
  showScreen(screenName);
}

function goBack() {
  // if we got here via a history entry, use it; otherwise go to moods
  if (history.state && history.state.fromApp) history.back();
  else navigate('moods', { replace: true });
}

window.addEventListener('popstate', function(e) {
  const screen = (e.state && e.state.screen) || location.hash.slice(1) || 'welcome';
  if (screen === 'verse' && !currentVerse) { showScreen('moods'); return; }
  showScreen(screen);
});

// deep links from the manifest shortcuts (#moods, #saved)
(function initRoute() {
  let start = location.hash.slice(1);
  if (start === 'verse' || !SCREENS.includes(start)) start = 'welcome';
  // returning users skip the welcome screen
  if (start === 'welcome' && prefs.seenWelcome) start = 'moods';
  history.replaceState({ screen: start }, '', start === 'welcome' ? location.pathname : '#' + start);
  showScreen(start);
  prefs.seenWelcome = true;
  saveJSON(PREFS_KEY, prefs);
  updateNavCount();
})();


// --- Mood selection ---
function pickMood(mood) {
  currentMood = mood;
  if (prefs.tradition) currentTradition = prefs.tradition;
  document.getElementById('verse-mood-label').textContent = moodLabel(mood);
  setTraditionButtons();

  history.pushState({ screen: 'verse', mood: mood, fromApp: true }, '', '#verse');
  showScreen('verse');
  loadVerse();
}


// --- Tradition toggle (Quran / Bible) ---
function switchTradition(tradition) {
  if (tradition === currentTradition && currentVerse && currentVerse.source === tradition) return;
  currentTradition = tradition;
  prefs.tradition = tradition;  // remember the user's choice
  saveJSON(PREFS_KEY, prefs);
  stopAudio();
  setTraditionButtons();
  loadVerse();
}

function setTraditionButtons() {
  const q = currentTradition === 'quran';
  const bq = document.getElementById('btn-quran');
  const bb = document.getElementById('btn-bible');
  bq.classList.toggle('active', q);
  bb.classList.toggle('active', !q);
  bq.setAttribute('aria-pressed', q);
  bb.setAttribute('aria-pressed', !q);
  document.getElementById('audio-player').style.display = q ? 'flex' : 'none';
}


// --- Load a verse ---
async function loadVerse() {
  stopAudio();
  const token = ++loadToken;

  currentVerse = null;
  setVerseActionsEnabled(false);
  document.getElementById('verse-content').innerHTML = `
    <div class="loading-box">
      <div class="spinner" aria-hidden="true"></div>
      <p>Finding your verse…</p>
    </div>`;

  setTraditionButtons();
  updateSaveButton();

  const list = VERSES[currentMood][currentTradition];
  const key = currentTradition + '_' + currentMood;
  const i = verseIndex[key] || 0;
  verseIndex[key] = i + 1;
  const ref = list[i % list.length];

  try {
    const verse = currentTradition === 'quran'
      ? await fetchQuranVerse(ref.s, ref.a)
      : await fetchBibleVerse(ref);

    if (token !== loadToken) return;   // a newer request already started

    currentVerse = verse;
    displayVerse(verse);
    setVerseActionsEnabled(true);
    updateSaveButton();

  } catch (error) {
    if (token !== loadToken) return;
    const offline = !navigator.onLine;
    document.getElementById('verse-content').innerHTML = `
      <div class="error-box">
        <div class="error-icon" aria-hidden="true">${offline ? '📡' : '😔'}</div>
        <p>${offline
          ? 'You\'re offline and this verse hasn\'t been downloaded yet.<br>Your saved verses are still available.'
          : 'Couldn\'t load this verse right now.'}</p>
        <div class="error-actions">
          <button class="btn-gold btn-small" onclick="loadVerse()">Try again</button>
          ${savedVerses.length ? '<button class="btn-outline btn-small" onclick="navigate(\'saved\')">Saved verses</button>' : ''}
        </div>
      </div>`;
    console.error('loadVerse error:', error);
  }
}

function setVerseActionsEnabled(on) {
  ['save-btn', 'share-btn'].forEach(id => { document.getElementById(id).disabled = !on; });
  document.getElementById('play-btn').disabled = !on;
}


// --- Render a verse card ---
function displayVerse(verse) {
  const isQuran = verse.source === 'quran';

  document.getElementById('verse-content').innerHTML = `
    <article class="verse-card">
      <div class="verse-source">${isQuran ? '📖' : '✝'} ${esc(verse.reference)}</div>

      ${isQuran && verse.arabic
        ? `<div class="arabic-text" lang="ar" dir="rtl">${esc(verse.arabic)}</div>
           <hr class="verse-divider"/>`
        : ''}

      <p class="english-text">“${esc(verse.english)}”</p>
      ${verse.label ? `<p class="translation-label">${esc(verse.label)}</p>` : ''}
    </article>`;
}


// --- Audio (Quran only) ---

async function toggleAudio() {
  if (!currentVerse || currentVerse.source !== 'quran') return;
  if (isPlaying) stopAudio();
  else await startAudio();
}

async function startAudio() {
  const btn = document.getElementById('play-btn');
  const verseAtStart = currentVerse;
  btn.classList.add('loading');
  try {
    const audioUrl = await fetchQuranAudio(verseAtStart.surah, verseAtStart.ayah);
    if (currentVerse !== verseAtStart) return;   // user moved on while loading

    if (audioElement) audioElement.pause();
    audioElement = new Audio(audioUrl);
    audioElement.onended = function() {
      isPlaying = false;
      updatePlayButton();
    };
    await audioElement.play();
    isPlaying = true;
    updatePlayButton();

  } catch (error) {
    showToast(navigator.onLine ? 'Recitation not available right now' : 'Recitation needs an internet connection');
    console.error('Audio error:', error);
  } finally {
    btn.classList.remove('loading');
  }
}

function stopAudio() {
  if (audioElement) audioElement.pause();
  isPlaying = false;
  updatePlayButton();
}

function updatePlayButton() {
  const btn = document.getElementById('play-btn');
  if (!btn) return;

  btn.setAttribute('aria-label', isPlaying ? 'Pause recitation' : 'Play recitation');
  btn.innerHTML = isPlaying
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

  const waveBars = document.getElementById('wave-bars');
  if (waveBars) waveBars.classList.toggle('playing', isPlaying);
}


// --- Save / remove verse ---

function isSaved(id) {
  return savedVerses.some(v => v.id === id);
}

function saveCurrentVerse() {
  if (!currentVerse) return;

  if (isSaved(currentVerse.id)) {
    savedVerses = savedVerses.filter(v => v.id !== currentVerse.id);
    showToast('Removed from saved');
  } else {
    savedVerses.unshift({
      id:        currentVerse.id,
      source:    currentVerse.source,
      mood:      currentMood,
      reference: currentVerse.reference,
      arabic:    currentVerse.arabic,
      english:   currentVerse.english,
      label:     currentVerse.label,
      surah:     currentVerse.surah,
      ayah:      currentVerse.ayah,
      savedAt:   Date.now(),
    });
    if (navigator.vibrate) navigator.vibrate(15);
    showToast('✓ Saved — find it under Saved');
  }

  persistSaved();
  updateSaveButton();
}

function updateSaveButton() {
  const btn = document.getElementById('save-btn');
  if (!btn) return;
  const saved = !!currentVerse && isSaved(currentVerse.id);

  btn.classList.toggle('saved', saved);
  btn.setAttribute('aria-pressed', saved);
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
    ${saved ? 'Saved' : 'Save'}`;
}

function updateNavCount() {
  const el = document.getElementById('nav-count');
  if (!el) return;
  el.hidden = savedVerses.length === 0;
  el.textContent = savedVerses.length;
}


// --- Share ---
async function shareVerse() {
  if (!currentVerse) return;
  await shareText(currentVerse);
}

async function shareText(verse) {
  const text = '“' + verse.english + '” — ' + verse.reference + '\n\nShared via Divine Mood';

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Divine Mood', text: text });
    } catch (e) {
      if (e.name !== 'AbortError') copyText(text);   // user cancelling isn't an error
    }
  } else {
    copyText(text);
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('✓ Copied to clipboard');
  } catch (e) {
    showToast('Couldn\'t copy — try again');
  }
}


// --- Saved verses list ---

function renderSavedList() {
  const container = document.getElementById('saved-list');
  const subtitle  = document.getElementById('saved-subtitle');

  if (savedVerses.length === 0) {
    subtitle.textContent = 'Verses you save will appear here';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">🕊️</div>
        <h2>Nothing saved yet</h2>
        <p>Tap <strong>Save</strong> on any verse to keep it here — it'll work offline too.</p>
        <button class="btn-gold btn-small" onclick="navigate('moods', { replace: true })">Find a verse</button>
      </div>`;
    return;
  }

  subtitle.textContent = savedVerses.length + (savedVerses.length === 1 ? ' verse' : ' verses') + ' · tap one to open it';

  container.innerHTML = savedVerses.map(function(verse, index) {
    const isQuran = verse.source === 'quran';
    const date = new Date(verse.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return `
      <article class="saved-item">
        <div class="saved-item-top">
          <span class="source-badge ${isQuran ? 'badge-quran' : 'badge-bible'}">
            ${isQuran ? '📖 Quran' : '✝ Bible'}
          </span>
          ${verse.mood ? `<span class="saved-mood">${esc(moodLabel(verse.mood))}</span>` : ''}
          <span class="spacer"></span>
          <button class="icon-btn" onclick="shareSaved(${index})" aria-label="Share ${esc(verse.reference)}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <button class="icon-btn remove-btn" onclick="removeVerse(${index})" aria-label="Remove ${esc(verse.reference)}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>

        <button class="saved-open" onclick="openSaved(${index})">
          ${isQuran && verse.arabic ? `<span class="saved-arabic" lang="ar" dir="rtl">${esc(verse.arabic)}</span>` : ''}
          <span class="saved-english">“${esc(verse.english)}”</span>
          <span class="saved-meta">
            <span class="saved-ref">${esc(verse.reference)}</span>
            <span class="saved-date">${date}</span>
          </span>
        </button>
      </article>`;
  }).join('');
}

function openSaved(index) {
  const v = savedVerses[index];
  if (!v) return;

  // older saves don't have surah/ayah stored, so recover them from the id
  if (v.source === 'quran' && (!v.surah || !v.ayah)) {
    const m = /quran-(\d+):(\d+)/.exec(v.id);
    if (m) { v.surah = +m[1]; v.ayah = +m[2]; }
  }

  loadToken++;  // cancel any in-flight load
  currentMood      = v.mood || currentMood;
  currentTradition = v.source;
  currentVerse     = Object.assign({ label: v.source === 'quran' ? 'Sahih International Translation' : 'World English Bible' }, v);

  document.getElementById('verse-mood-label').textContent = moodLabel(currentMood);
  setTraditionButtons();
  displayVerse(currentVerse);
  setVerseActionsEnabled(true);
  updateSaveButton();

  history.pushState({ screen: 'verse', mood: currentMood, fromApp: true }, '', '#verse');
  showScreen('verse');
}

function shareSaved(index) {
  const v = savedVerses[index];
  if (v) shareText(v);
}

function removeVerse(index) {
  const removed = savedVerses.splice(index, 1)[0];
  if (!removed) return;
  lastRemoved = { verse: removed, index: index };
  persistSaved();
  renderSavedList();
  showToast('Verse removed', { label: 'Undo', onClick: undoRemove });
}

function undoRemove() {
  if (!lastRemoved) return;
  savedVerses.splice(lastRemoved.index, 0, lastRemoved.verse);
  lastRemoved = null;
  persistSaved();
  renderSavedList();
  showToast('Restored');
}


// --- Toast ---
let toastTimer = null;

function showToast(message, action) {
  const toast = document.getElementById('toast');
  toast.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = message;
  toast.appendChild(span);

  if (action) {
    const btn = document.createElement('button');
    btn.textContent = action.label;
    btn.onclick = function() { hideToast(); action.onClick(); };
    toast.appendChild(btn);
  }

  toast.classList.add('show');
  toast.classList.toggle('has-action', !!action);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 5000 : 2500);
}

function hideToast() {
  document.getElementById('toast').classList.remove('show');
}


// --- Keyboard shortcuts on the verse screen (desktop) ---
document.addEventListener('keydown', function(e) {
  if (!document.getElementById('screen-verse').classList.contains('active')) return;
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'ArrowRight' || e.key === 'n') loadVerse();
  else if (e.key === 's') saveCurrentVerse();
  else if (e.key === 'Escape') goBack();
});
