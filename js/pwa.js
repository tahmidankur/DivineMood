// pwa.js — service worker, install prompt, update banner, offline notice

(function() {
  const PREFS_KEY = 'divinemood_prefs';
  let deferredPrompt = null;
  let waitingWorker  = null;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true;

  function getPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; }
  }
  function setPref(key, value) {
    const p = getPrefs(); p[key] = value;
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) {}
  }


  // --- Service worker + update banner ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js').then(function(reg) {

        // a new version was already waiting from a previous visit
        if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);

        reg.addEventListener('updatefound', function() {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', function() {
            // "installed" + an existing controller = an update, not the first install
            if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker);
          });
        });

        // check for updates when the app comes back to the foreground
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible') reg.update().catch(function() {});
        });
      }).catch(function(err) {
        console.warn('Service worker registration failed:', err);
      });

      // reload once the new worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (refreshing || !waitingWorker) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }

  function showUpdate(worker) {
    waitingWorker = worker;
    document.getElementById('update-banner').hidden = false;
  }

  window.applyUpdate = function() {
    document.getElementById('update-banner').hidden = true;
    if (waitingWorker) waitingWorker.postMessage('SKIP_WAITING');
  };


  // --- Install prompt (Chrome / Edge / Android) ---
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();          // show our own button instead of the mini-infobar
    deferredPrompt = e;
    document.getElementById('install-btn').hidden = false;
  });

  window.installApp = async function() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('install-btn').hidden = true;
    if (choice.outcome === 'accepted') showToast('✓ Installing Divine Mood');
  };

  window.addEventListener('appinstalled', function() {
    deferredPrompt = null;
    document.getElementById('install-btn').hidden = true;
  });


  // --- iOS "Add to Home Screen" hint (Safari has no install prompt) ---
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
             || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIos && !isStandalone && !getPrefs().iosHintDismissed) {
    // wait a moment so it doesn't greet the user before they've seen the app
    setTimeout(function() {
      document.getElementById('ios-hint').hidden = false;
    }, 4000);
  }

  window.dismissIosHint = function() {
    document.getElementById('ios-hint').hidden = true;
    setPref('iosHintDismissed', true);
  };


  // --- Offline notice ---
  function updateOnline() {
    document.getElementById('offline-bar').hidden = navigator.onLine;
  }
  window.addEventListener('online', function() {
    updateOnline();
    showToast('Back online');
  });
  window.addEventListener('offline', updateOnline);
  updateOnline();
})();
