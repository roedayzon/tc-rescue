// Pause — friction wrapper for a contact you shouldn't reach.
// All state is local (localStorage). No accounts, no network.

const STORAGE_KEY = 'pause:state:v1';

const defaultState = {
  contact: null,            // { name, phone, addedAt }
  commitUntil: null,        // ms timestamp; while > now, app is "committed"
  unlockTimerSec: 600,      // cooldown before challenge (10 min default)
  challengeLength: 80,      // chars in typing challenge
  unlockWindowSec: 60,      // how long the unlocked screen stays open
  log: [],                  // [{ ts, type }]
  unlockedUntil: null,
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function logEvent(type) {
  state.log.unshift({ ts: Date.now(), type });
  state.log = state.log.slice(0, 200);
  saveState();
}

const $ = (sel, root = document) => root.querySelector(sel);

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

function fmtMaskedPhone(p) {
  const digits = (p || '').replace(/\D/g, '');
  if (!digits) return '';
  return '•'.repeat(Math.max(0, digits.length - 2)) + ' ' + digits.slice(-2);
}

function fmtTimeLeft(ms) {
  if (ms <= 0) return '00:00';
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function randomChallenge(len) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

let activeTickers = [];
function clearTickers() {
  activeTickers.forEach(id => clearInterval(id));
  activeTickers = [];
}
function tick(fn, ms) {
  const id = setInterval(fn, ms);
  activeTickers.push(id);
  return id;
}

function render() {
  clearTickers();
  const root = $('#app');
  root.innerHTML = '';
  if (!state.contact) {
    root.append(renderOnboarding());
  } else if (state.unlockedUntil && state.unlockedUntil > Date.now()) {
    root.append(renderUnlocked());
  } else {
    root.append(renderLocked());
  }
}

function renderOnboarding() {
  let name = '';
  let phone = '';
  let dur = '604800';

  const update = () => {
    nextBtn.disabled = !(name.trim() && phone.replace(/\D/g, '').length >= 7);
  };

  const nameEl = el('input', {
    type: 'text', placeholder: 'e.g., "Don\'t call"',
    autocomplete: 'off',
    oninput: e => { name = e.target.value; update(); },
  });
  const phoneEl = el('input', {
    type: 'tel', placeholder: '+1 555 123 4567',
    autocomplete: 'off',
    oninput: e => { phone = e.target.value; update(); },
  });
  const durEl = el('select', { onchange: e => { dur = e.target.value; } },
    el('option', { value: '0' }, 'No commit period (friction only)'),
    el('option', { value: '3600' }, '1 hour'),
    el('option', { value: '86400' }, '1 day'),
    el('option', { value: '604800', selected: true }, '1 week'),
    el('option', { value: '2592000' }, '30 days'),
  );

  const nextBtn = el('button', {
    class: 'primary', disabled: true,
    onclick: () => {
      state.contact = { name: name.trim(), phone: phone.trim(), addedAt: Date.now() };
      const seconds = Number(dur);
      if (seconds > 0) state.commitUntil = Date.now() + seconds * 1000;
      logEvent('lockset');
      saveState();
      render();
    },
  }, 'Lock it');

  return el('section', { class: 'screen' },
    el('h1', {}, 'Pause'),
    el('p', { class: 'lede' },
      "Stash a contact you shouldn't reach. The number is hidden behind a long delay and a typing challenge — enough friction to break the reflex."),
    el('div', { class: 'field' }, el('label', {}, 'Contact name'), nameEl),
    el('div', { class: 'field' }, el('label', {}, 'Phone number'), phoneEl),
    el('div', { class: 'field' }, el('label', {}, 'Commit period'), durEl),
    el('p', { class: 'small warn' },
      "After saving: delete this contact from your phone's Contacts and clear your call/message history with them. The app holds the only easy-access copy."),
    nextBtn,
  );
}

function renderLocked() {
  const c = state.contact;
  const inCommit = state.commitUntil && state.commitUntil > Date.now();

  const timerNode = el('div', { class: 'timer' },
    inCommit ? fmtTimeLeft(state.commitUntil - Date.now()) : '—',
  );

  if (inCommit) {
    tick(() => {
      const left = state.commitUntil - Date.now();
      if (left <= 0) { render(); return; }
      timerNode.textContent = fmtTimeLeft(left);
    }, 1000);
  }

  return el('section', { class: 'screen' },
    el('div', { class: 'lock-card' },
      el('div', { class: 'pill' }, inCommit ? 'Committed until' : 'Locked'),
      timerNode,
      el('div', { class: 'contact' },
        el('div', { class: 'name' }, c.name),
        el('div', { class: 'masked' }, fmtMaskedPhone(c.phone)),
      ),
      el('p', { class: 'small' },
        inCommit
          ? "You set a commit period. You can still force an unlock — but this is the moment you said you wouldn't."
          : "No active commit period. You can unlock with the friction challenge."),
      el('button', { class: 'ghost', onclick: startUnlock },
        'I really need to reach them'),
    ),
    el('div', { class: 'row' },
      el('button', { class: 'subtle', onclick: showLog }, 'Activity'),
      el('button', { class: 'subtle', onclick: showSettings }, 'Settings'),
    ),
  );
}

function startUnlock() {
  logEvent('attempt');
  const cooldownMs = state.unlockTimerSec * 1000;
  if (cooldownMs <= 0) return runChallenge();
  runCooldown(cooldownMs).then(passed => {
    if (passed) runChallenge();
    else { logEvent('aborted'); render(); }
  });
}

function runCooldown(durMs) {
  return new Promise(resolve => {
    clearTickers();
    const root = $('#app');
    root.innerHTML = '';
    const start = Date.now();
    const end = start + durMs;
    const timerNode = el('div', { class: 'timer big' }, fmtTimeLeft(durMs));
    const presenceBtn = el('button', { class: 'primary' }, "I'm still here");
    let lastTap = Date.now();
    let needTap = false;
    let resolved = false;

    presenceBtn.addEventListener('click', () => {
      lastTap = Date.now();
      needTap = false;
      presenceBtn.classList.remove('attention');
      presenceBtn.textContent = "I'm still here";
    });

    const cancelBtn = el('button', {
      class: 'ghost',
      onclick: () => { if (!resolved) { resolved = true; clearTickers(); resolve(false); } },
    }, 'Cancel');

    root.append(el('section', { class: 'screen' },
      el('div', { class: 'pill' }, 'Cooling down'),
      timerNode,
      el('p', { class: 'small' },
        'Stay on this screen. Tap when prompted — leaving aborts the unlock.'),
      presenceBtn,
      cancelBtn,
    ));

    tick(() => {
      const left = end - Date.now();
      if (left <= 0) {
        if (!resolved) { resolved = true; clearTickers(); resolve(true); }
        return;
      }
      timerNode.textContent = fmtTimeLeft(left);

      const sinceTap = Date.now() - lastTap;
      if (!needTap && sinceTap > 30000) {
        needTap = true;
        presenceBtn.classList.add('attention');
        presenceBtn.textContent = 'Tap to stay';
      } else if (needTap && sinceTap > 40000) {
        if (!resolved) { resolved = true; clearTickers(); resolve(false); }
      }
    }, 500);
  });
}

function runChallenge() {
  clearTickers();
  const root = $('#app');
  root.innerHTML = '';

  let challenge = randomChallenge(state.challengeLength);
  let regenerating = false;

  const challengeNode = el('div', { class: 'challenge' }, challenge);
  const progressBar = el('div', {}, el('div', {}));
  progressBar.classList.add('progress');

  const blockClipboard = (e) => { e.preventDefault(); };
  const input = el('textarea', {
    class: 'challenge-input',
    rows: '4',
    autocomplete: 'off',
    autocorrect: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    inputmode: 'text',
    placeholder: 'Type the string above exactly. Pasting is disabled. One typo regenerates the string.',
  });
  input.addEventListener('paste', blockClipboard);
  input.addEventListener('drop', blockClipboard);
  input.addEventListener('input', () => {
    if (regenerating) { input.value = ''; return; }
    const v = input.value;
    if (v.length > challenge.length) {
      input.value = v.slice(0, challenge.length);
    }
    if (challenge.startsWith(input.value)) {
      progressBar.firstChild.style.width = `${(input.value.length / challenge.length) * 100}%`;
      if (input.value === challenge) unlock();
    } else {
      regenerating = true;
      input.classList.add('error');
      progressBar.firstChild.style.width = '0%';
      setTimeout(() => {
        challenge = randomChallenge(state.challengeLength);
        challengeNode.textContent = challenge;
        input.value = '';
        input.classList.remove('error');
        regenerating = false;
        input.focus();
      }, 450);
    }
  });

  root.append(el('section', { class: 'screen' },
    el('div', { class: 'pill' }, 'Type to unlock'),
    el('p', { class: 'small' },
      'No copy/paste. A single mistake regenerates the string.'),
    challengeNode,
    progressBar,
    input,
    el('button', {
      class: 'ghost',
      onclick: () => { logEvent('aborted'); render(); },
    }, 'Cancel'),
  ));

  setTimeout(() => input.focus(), 100);
}

function unlock() {
  state.unlockedUntil = Date.now() + state.unlockWindowSec * 1000;
  logEvent('unlocked');
  saveState();
  render();
}

function renderUnlocked() {
  const c = state.contact;
  const countdown = el('span', {}, String(state.unlockWindowSec));

  tick(() => {
    const left = Math.ceil((state.unlockedUntil - Date.now()) / 1000);
    if (left <= 0) {
      state.unlockedUntil = null;
      saveState();
      render();
      return;
    }
    countdown.textContent = String(left);
  }, 500);

  return el('section', { class: 'screen' },
    el('div', { class: 'pill warn' }, 'Unlocked'),
    el('div', { class: 'contact big' },
      el('div', { class: 'name' }, c.name),
      el('div', { class: 'phone' }, c.phone),
    ),
    el('p', { class: 'small' }, 'Re-locks in ', countdown, 's.'),
    el('div', { class: 'row' },
      el('a', {
        class: 'btn primary', href: `tel:${c.phone}`,
        onclick: () => logEvent('called'),
      }, 'Call'),
      el('a', {
        class: 'btn primary', href: `sms:${c.phone}`,
        onclick: () => logEvent('texted'),
      }, 'Text'),
    ),
    el('button', {
      class: 'ghost',
      onclick: () => { state.unlockedUntil = null; saveState(); render(); },
    }, 'Re-lock now'),
  );
}

function showLog() {
  clearTickers();
  const root = $('#app');
  root.innerHTML = '';
  const items = state.log.length
    ? state.log.map(e => el('li', {},
        el('span', { class: 'ts' }, new Date(e.ts).toLocaleString()),
        '— ',
        el('span', { class: 'ev' }, e.type),
      ))
    : [el('li', { class: 'small' }, 'No activity yet.')];
  root.append(el('section', { class: 'screen' },
    el('h2', {}, 'Activity'),
    el('ul', { class: 'log' }, ...items),
    el('button', { class: 'ghost', onclick: render }, 'Back'),
  ));
}

function showSettings() {
  clearTickers();
  const root = $('#app');
  root.innerHTML = '';
  const c = state.contact;

  const cooldownEl = el('input', {
    type: 'number', min: '0', max: '3600',
    value: String(state.unlockTimerSec),
    onchange: e => {
      state.unlockTimerSec = Math.max(0, Number(e.target.value) || 0);
      saveState();
    },
  });
  const challengeEl = el('input', {
    type: 'number', min: '20', max: '300',
    value: String(state.challengeLength),
    onchange: e => {
      state.challengeLength = Math.max(20, Math.min(300, Number(e.target.value) || 80));
      saveState();
    },
  });

  root.append(el('section', { class: 'screen' },
    el('h2', {}, 'Settings'),
    el('div', { class: 'field' },
      el('label', {}, 'Contact'),
      el('div', {}, `${c.name} — ${fmtMaskedPhone(c.phone)}`),
    ),
    el('div', { class: 'field' },
      el('label', {}, 'Cooldown before challenge (seconds)'),
      cooldownEl,
    ),
    el('div', { class: 'field' },
      el('label', {}, 'Challenge length (characters)'),
      challengeEl,
    ),
    el('div', { class: 'field' },
      el('label', {}, 'Commit until'),
      el('div', {},
        state.commitUntil && state.commitUntil > Date.now()
          ? new Date(state.commitUntil).toLocaleString()
          : 'No active commit period',
      ),
    ),
    el('div', { class: 'row' },
      el('button', {
        class: 'ghost',
        onclick: () => {
          const base = Math.max(state.commitUntil || 0, Date.now());
          state.commitUntil = base + 7 * 24 * 3600 * 1000;
          logEvent('lockset');
          saveState();
          render();
        },
      }, '+7 days'),
      el('button', {
        class: 'ghost',
        onclick: () => {
          if (confirm('Clear commit period? Friction unlock still applies.')) {
            state.commitUntil = null;
            saveState();
            render();
          }
        },
      }, 'Clear commit'),
    ),
    el('button', {
      class: 'danger',
      onclick: () => {
        if (confirm('Delete the stored contact and all data? This cannot be undone.')) {
          localStorage.removeItem(STORAGE_KEY);
          state = { ...defaultState };
          render();
        }
      },
    }, 'Delete everything'),
    el('button', { class: 'ghost', onclick: render }, 'Back'),
  ));
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('sw.js').catch(() => {}));
}

render();
