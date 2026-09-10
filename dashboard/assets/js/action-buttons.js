/**
 * Site-wide action-button feedback: disable on click/submit, show busy state,
 * and block double-fires until in-flight fetches finish.
 */
(function () {
  const SKIP_CLASSES = ['filter-btn', 'tab-btn', 'btn-close', 'dropdown-toggle'];
  let lastBtn = null;
  let inflight = 0;
  let idleTimer = null;

  function shouldSkip(btn) {
    if (!btn || btn.dataset.noBusy === '1') return true;
    return SKIP_CLASSES.some((c) => btn.classList.contains(c));
  }

  function mark(btn) {
    if (!btn || btn.dataset.hubBusy === '1') return;
    btn.dataset.hubBusy = '1';
    if (btn.disabled) btn.dataset.hubWasDisabled = '1';
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.classList.add('is-busy');
    if (!btn.dataset.hubLabel) {
      btn.dataset.hubLabel = (btn.textContent || '').trim();
    }
    if (btn.dataset.busyText) {
      btn.textContent = btn.dataset.busyText;
    }
  }

  function unmark(btn) {
    if (!btn || btn.dataset.hubBusy !== '1') return;
    if (btn.dataset.busyText && btn.dataset.hubLabel) {
      btn.textContent = btn.dataset.hubLabel;
    }
    btn.classList.remove('is-busy');
    btn.removeAttribute('aria-busy');
    btn.dataset.hubBusy = '';
    if (btn.dataset.hubWasDisabled === '1') {
      btn.disabled = true;
    } else {
      btn.disabled = false;
    }
    delete btn.dataset.hubWasDisabled;
  }

  function clearIdle() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function scheduleRelease() {
    clearIdle();
    idleTimer = setTimeout(() => {
      if (inflight === 0 && lastBtn) {
        unmark(lastBtn);
        lastBtn = null;
      }
    }, 350);
  }

  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target.closest && e.target.closest('button, input[type="submit"]');
      if (!btn || shouldSkip(btn)) return;
      if (lastBtn && lastBtn !== btn) unmark(lastBtn);
      lastBtn = btn;
      mark(btn);
      scheduleRelease();
    },
    true
  );

  document.addEventListener(
    'submit',
    (e) => {
      const btn =
        e.submitter ||
        (e.target && e.target.querySelector && e.target.querySelector('button[type="submit"], input[type="submit"]'));
      if (!btn || shouldSkip(btn)) return;
      if (lastBtn && lastBtn !== btn) unmark(lastBtn);
      lastBtn = btn;
      mark(btn);
      scheduleRelease();
    },
    true
  );

  window.__hubBusyFetchStart = function () {
    inflight += 1;
    clearIdle();
    if (lastBtn) mark(lastBtn);
  };

  window.__hubBusyFetchEnd = function () {
    inflight = Math.max(0, inflight - 1);
    if (inflight === 0) scheduleRelease();
  };

  if (!window.__hubFetchWrapped && typeof window.fetch === 'function') {
    window.__hubFetchWrapped = true;
    const origFetch = window.fetch.bind(window);
    window.fetch = function (...args) {
      const track = !!lastBtn;
      if (track) window.__hubBusyFetchStart();
      return origFetch(...args).finally(() => {
        if (track) window.__hubBusyFetchEnd();
      });
    };
  }
})();
