// ================================================
// app.js — All the app logic
//
// This file controls everything the user sees and does:
//   - Switching between screens
//   - Loading verses from the API
//   - Saving/removing verses
//   - Playing audio
//   - Showing toast notifications
// ================================================


// ------------------------------------------------
// APP STATE
// These variables remember what is happening right now
// ------------------------------------------------
let currentMood      = 'happy';   // which mood the user picked
let currentTradition = 'quran';   // 'quran' or 'bible'
let currentVerse     = null;      // the verse object we last loaded
let verseIndex       = {};        // tracks how many verses we've seen per mood
let audioElement     = null;      // the HTML5 Audio player object
let isPlaying        = false;     // is audio currently playing?
let savedVerses      = [];        // array of saved verse objects


// ------------------------------------------------
// ON PAGE LOAD
// Run this code as soon as the page is ready
// ------------------------------------------------
loadSavedFromStorage();


// ------------------------------------------------
// LOCALSTORAGE — Save data between visits
//
// localStorage is like a small database built into
// the browser. Data persists even after the tab closes.
// ------------------------------------------------

// Read saved verses from the browser storage
function loadSavedFromStorage() {
  const stored = localStorage.getItem('divinemood_saved');
  if (stored) {
    savedVerses = JSON.parse(stored);
  }
}

// Write the savedVerses array back to browser storage
function persistSaved() {
  localStorage.setItem('divinemood_saved', JSON.stringify(savedVerses));
}


// ------------------------------------------------
// SHOW SCREEN
//
// Hides all 4 screens, then shows the one you want.
//
// How screen switching works:
//   - All screens have class "screen" → display: none
//   - Adding class "active" makes one visible
//   - CSS animation plays when a screen becomes active
// ------------------------------------------------
function showScreen(screenName) {

  // Stop audio whenever we leave the verse screen
  if (screenName !== 'verse') {
    stopAudio();
  }

  // Hide every screen
  document.querySelectorAll('.screen').forEach(function(screen) {
    screen.classList.remove('active');
  });

  // Show only the requested screen
  document.getElementById('screen-' + screenName).classList.add('active');

  // If we're going to the saved screen, refresh the list
  if (screenName === 'saved') {
    renderSavedList();
  }
}


// ------------------------------------------------
// PICK MOOD
//
// Called when user taps a mood card on Screen 2.
// Saves the mood, then goes to the verse screen.
// ------------------------------------------------
function pickMood(mood) {
  currentMood      = mood;
  currentTradition = 'quran';  // always start with Quran

  // Update the mood pill text at the top of the verse screen
  document.getElementById('verse-mood-label').textContent = MOOD_EMOJI[mood];

  // Reset toggle buttons so Quran is active
  document.getElementById('btn-quran').classList.add('active');
  document.getElementById('btn-bible').classList.remove('active');

  // Go to the verse screen
  showScreen('verse');

  // Load a verse for this mood
  loadVerse();
}


// ------------------------------------------------
// SWITCH TRADITION
//
// Called when user taps "Quran" or "Bible" toggle.
// ------------------------------------------------
function switchTradition(tradition) {
  currentTradition = tradition;
  stopAudio();

  // Update which button looks active
  document.getElementById('btn-quran').classList.toggle('active', tradition === 'quran');
  document.getElementById('btn-bible').classList.toggle('active', tradition === 'bible');

  // Load a verse for the new tradition
  loadVerse();
}


// ------------------------------------------------
// LOAD VERSE
//
// The main function. It:
//   1. Shows a loading spinner
//   2. Picks the next verse reference from data.js
//   3. Calls the right API function from api.js
//   4. Passes the result to displayVerse()
// ------------------------------------------------
async function loadVerse() {
  stopAudio();

  // Show loading spinner while we wait for the API
  document.getElementById('verse-content').innerHTML = `
    <div class="loading-box">
      <div class="spinner"></div>
      <p>Finding your verse…</p>
    </div>`;

  // Show or hide the audio player depending on tradition
  document.getElementById('audio-player').style.display =
    currentTradition === 'quran' ? 'flex' : 'none';

  // Reset the Save button to unsaved state
  updateSaveButton();

  try {
    let verse; // this will hold the verse object once loaded

    if (currentTradition === 'quran') {
      // --- Pick a Quran verse ---

      const quranList = VERSES[currentMood].quran;  // get the list from data.js

      // Track which verse we're on for this mood using verseIndex
      const key = 'q_' + currentMood;
      if (verseIndex[key] === undefined) verseIndex[key] = 0;

      // Pick the verse at the current index
      const ref = quranList[verseIndex[key] % quranList.length];

      // Advance the index so next time we get a different verse
      verseIndex[key]++;

      // Call the API (defined in api.js)
      verse = await fetchQuranVerse(ref.s, ref.a);

    } else {
      // --- Pick a Bible verse ---

      const bibleList = VERSES[currentMood].bible;  // get the list from data.js

      const key = 'b_' + currentMood;
      if (verseIndex[key] === undefined) verseIndex[key] = 0;

      const ref = bibleList[verseIndex[key] % bibleList.length];
      verseIndex[key]++;

      // ref is a plain string like "John 3:16"
      // Call the API (defined in api.js)
      verse = await fetchBibleVerse(ref);
    }

    // Save the loaded verse so other functions can use it
    currentVerse = verse;

    // Show it on screen
    displayVerse(verse);
    updateSaveButton();

  } catch (error) {
    // Something went wrong — show a friendly error message
    document.getElementById('verse-content').innerHTML = `
      <div class="error-box">
        <div style="font-size:40px; margin-bottom:10px;">😔</div>
        <p>Could not load verse.<br>Please check your internet connection.</p>
        <button class="btn-gold" style="width:auto; padding:12px 28px; margin-top:16px;"
          onclick="loadVerse()">Try Again</button>
      </div>`;

    // Log the full error in the browser console for debugging
    console.error('loadVerse error:', error);
  }
}


// ------------------------------------------------
// DISPLAY VERSE
//
// Takes a verse object and builds the HTML card.
// ------------------------------------------------
function displayVerse(verse) {
  const isQuran = verse.source === 'quran';

  document.getElementById('verse-content').innerHTML = `
    <div class="verse-card">

      <!-- Reference badge: "📖 Al-Baqarah 2:286" -->
      <div class="verse-source">
        ${isQuran ? '📖' : '✝'} ${verse.reference}
      </div>

      <!-- Arabic text (only for Quran) -->
      ${isQuran
        ? `<div class="arabic-text">${verse.arabic}</div>
           <hr class="verse-divider"/>`
        : ''}

      <!-- English verse text -->
      <p class="english-text">"${verse.english}"</p>

      <!-- Translation credit -->
      <p class="translation-label">${verse.label}</p>

    </div>`;
}


// ------------------------------------------------
// AUDIO PLAYER (Quran only)
// ------------------------------------------------

// Called when user taps the play/pause button
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
    // Get the MP3 URL from the API (defined in api.js)
    const audioUrl = await fetchQuranAudio(currentVerse.surah, currentVerse.ayah);

    // Stop any currently playing audio
    if (audioElement) audioElement.pause();

    // Create a new audio player and start playing
    audioElement = new Audio(audioUrl);
    audioElement.play();
    isPlaying = true;

    // When the audio finishes, reset the button automatically
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

  // wave-bars element might not exist on other screens
  const waveBars = document.getElementById('wave-bars');
  if (waveBars) waveBars.classList.remove('playing');
}

// Swap the play icon to a pause icon (and back)
function updatePlayButton() {
  const btn = document.getElementById('play-btn');
  if (!btn) return;

  if (isPlaying) {
    // Show the pause icon (two vertical bars)
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>`;
  } else {
    // Show the play icon (triangle)
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>`;
  }
}


// ------------------------------------------------
// SAVE / REMOVE VERSE
// ------------------------------------------------

function saveCurrentVerse() {
  if (!currentVerse) return;

  // Check if this verse is already in the saved list
  const alreadySaved = savedVerses.some(function(v) {
    return v.id === currentVerse.id;
  });

  if (alreadySaved) {
    // Remove it from the array
    savedVerses = savedVerses.filter(function(v) {
      return v.id !== currentVerse.id;
    });
    showToast('Verse removed');
  } else {
    // Add it to the beginning of the array
    savedVerses.unshift({
      id:        currentVerse.id,
      source:    currentVerse.source,
      mood:      currentMood,
      reference: currentVerse.reference,
      arabic:    currentVerse.arabic,  // null for Bible verses
      english:   currentVerse.english,
      savedAt:   Date.now(),           // timestamp in milliseconds
    });
    showToast('✓ Verse saved!');
  }

  // Write to browser storage so it persists
  persistSaved();
  updateSaveButton();
}

// Update the Save button appearance based on whether this verse is saved
function updateSaveButton() {
  const btn = document.getElementById('save-btn');
  if (!btn || !currentVerse) return;

  const isSaved = savedVerses.some(function(v) {
    return v.id === currentVerse.id;
  });

  if (isSaved) {
    // Show filled bookmark + gold style
    btn.classList.add('saved');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" width="20" height="20">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
      Saved`;
  } else {
    // Show empty bookmark + default style
    btn.classList.remove('saved');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
      Save`;
  }
}


// ------------------------------------------------
// SHARE VERSE
// ------------------------------------------------
async function shareVerse() {
  if (!currentVerse) return;

  const text = '"' + currentVerse.english + '" — ' + currentVerse.reference
             + '\n\nShared via Divine Mood';

  if (navigator.share) {
    // Use the phone's built-in share sheet (works on mobile)
    await navigator.share({ title: 'Divine Mood', text: text });
  } else {
    // Fallback: copy to clipboard (works on desktop)
    navigator.clipboard.writeText(text);
    showToast('✓ Copied to clipboard');
  }
}


// ------------------------------------------------
// RENDER SAVED LIST (Screen 4)
//
// Builds all the saved verse cards from scratch.
// Called every time we navigate to the saved screen.
// ------------------------------------------------
function renderSavedList() {
  const container = document.getElementById('saved-list');

  // Show empty state if nothing is saved
  if (savedVerses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕊️</div>
        <h3>Nothing saved yet</h3>
        <p>Tap the Save button on any verse to keep it here</p>
      </div>`;
    return;
  }

  // Build one HTML card for each saved verse
  container.innerHTML = savedVerses.map(function(verse, index) {
    const isQuran = verse.source === 'quran';

    // Format the save date: "Jan 5" etc.
    const date = new Date(verse.savedAt).toLocaleDateString('en-CA', {
      month: 'short',
      day:   'numeric'
    });

    return `
      <div class="saved-item">

        <!-- Top row: source badge + remove button -->
        <div class="saved-item-top">
          <span class="source-badge ${isQuran ? 'badge-quran' : 'badge-bible'}">
            ${isQuran ? '📖 Quran' : '✝ Bible'}
          </span>
          <button class="remove-btn" onclick="removeVerse(${index})">✕</button>
        </div>

        <!-- Arabic text (only for Quran) -->
        ${isQuran && verse.arabic
          ? `<div class="saved-arabic">${verse.arabic}</div>`
          : ''}

        <!-- English verse text -->
        <p class="saved-english">"${verse.english}"</p>

        <!-- Bottom row: reference + date -->
        <div class="saved-meta">
          <span class="saved-ref">${verse.reference}</span>
          <span class="saved-date">${date}</span>
        </div>

      </div>`;
  }).join('');  // join() combines the array of strings into one HTML string
}

// Remove a single saved verse by its position in the array
function removeVerse(index) {
  savedVerses.splice(index, 1);  // splice removes 1 item at position 'index'
  persistSaved();
  renderSavedList();
  showToast('Verse removed');
}


// ------------------------------------------------
// TOAST NOTIFICATION
//
// Shows a small popup message at the bottom
// for 2.5 seconds, then hides it.
// ------------------------------------------------
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');      // CSS transition makes it slide up

  setTimeout(function() {
    toast.classList.remove('show'); // CSS transition slides it back down
  }, 2500);
}
