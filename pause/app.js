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
  setup: { step: 0, draft: null, exportMethod: null, checks: {} },
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
  if (!state.setup) state.setup = { step: 0, draft: null, exportMethod: null, checks: {} };
  const step = state.setup.step;
  if (step === 1) return renderSetupContact();
  if (step === 2) return renderSetupExport();
  if (step === 3) return renderSetupClear();
  if (step === 4) return renderSetupLock();
  return renderSetupWelcome();
}

function setStep(n) {
  state.setup.step = n;
  saveState();
  render();
}

function setCheck(key, val) {
  state.setup.checks[key] = val;
  saveState();
}

function stepHeader(n, total, title) {
  return el('div', { class: 'step-header' },
    el('div', { class: 'pill' }, `Step ${n} of ${total}`),
    el('h2', {}, title),
  );
}

function renderSetupWelcome() {
  return el('section', { class: 'screen' },
    el('h1', {}, 'Pause'),
    el('p', { class: 'lede' },
      "Setup takes about 15 minutes in four steps: save the number into Pause, save your message memories, clear the easy-access copies from your phone, then set the lock."),
    el('p', { class: 'small' },
      "You can stop and resume anytime — your progress is saved on this device."),
    el('button', { class: 'primary', onclick: () => setStep(1) }, 'Start'),
  );
}

function renderSetupContact() {
  const draft = state.setup.draft || { name: '', phone: '' };
  let name = draft.name;
  let phone = draft.phone;

  const isValid = () => name.trim() && phone.replace(/\D/g, '').length >= 7;
  const update = () => {
    state.setup.draft = { name, phone };
    saveState();
    nextBtn.disabled = !isValid();
  };

  const nameEl = el('input', {
    type: 'text', value: name, placeholder: 'e.g., "Don\'t call"',
    autocomplete: 'off',
    oninput: e => { name = e.target.value; update(); },
  });
  const phoneEl = el('input', {
    type: 'tel', value: phone, placeholder: '+1 555 123 4567',
    autocomplete: 'off',
    oninput: e => { phone = e.target.value; update(); },
  });
  const nextBtn = el('button', {
    class: 'primary', disabled: !isValid(),
    onclick: () => setStep(2),
  }, 'Continue');

  return el('section', { class: 'screen' },
    stepHeader(1, 4, 'Save the number'),
    el('p', { class: 'lede' },
      "Type the contact's name and phone number. Pause holds it for you so you don't need to keep it elsewhere on your phone."),
    el('div', { class: 'field' }, el('label', {}, 'Contact name'), nameEl),
    el('div', { class: 'field' }, el('label', {}, 'Phone number'), phoneEl),
    el('div', { class: 'row' },
      el('button', { class: 'ghost', onclick: () => setStep(0) }, 'Back'),
      nextBtn,
    ),
  );
}

const EXPORT_METHODS = {
  screenshots: {
    title: 'Save by screenshot',
    sub: 'Free. Works on any iPhone. Tedious for long threads.',
    steps: [
      'Open Messages and tap the conversation.',
      'Scroll all the way to the top of the thread.',
      'Take a screenshot — Side button + Volume Up (or Side + Home on older iPhones).',
      'Scroll down by one screen, screenshot again. Repeat until you reach the bottom.',
      'For photos or videos in the thread, long-press → Save before deleting.',
      'Optional: in the Photos app, create a hidden album and move the screenshots there so they don\'t surface in your camera roll.',
    ],
  },
  imazing: {
    title: 'Export with iMazing',
    sub: 'Free trial works for export. Clean PDF with images. Needs Mac/PC + USB cable.',
    steps: [
      'On your Mac or PC, install iMazing from imazing.com (the trial version supports message export).',
      'Plug your iPhone into the computer with a USB cable. Tap Trust on the phone.',
      'In iMazing, click your phone in the sidebar → Messages.',
      'Find the conversation and click Export → choose PDF (or Text + attachments).',
      'Save the file somewhere durable — external drive, password manager, encrypted folder.',
    ],
  },
  'mac-icloud': {
    title: 'Use a Mac with iCloud Messages',
    sub: 'Already-synced thread on your Mac stays accessible after deleting on iPhone — if you set it up right.',
    steps: [
      'On your Mac, open Messages.app and check the conversation appears.',
      'Important: turn iCloud Messages OFF on the Mac first (Messages → Settings → iMessage → uncheck Enable Messages in iCloud).',
      'This keeps the local copy on the Mac while letting you delete from iPhone without syncing the deletion.',
      'Optional: in Messages on Mac, File → Print → Save as PDF for an archived copy.',
      'Wait until step 3 of this wizard before deleting on the iPhone.',
    ],
  },
};

function renderSetupExport() {
  const method = state.setup.exportMethod;

  if (!method) {
    const card = (id) => el('button', {
      class: 'method-card',
      onclick: () => { state.setup.exportMethod = id; saveState(); render(); },
    },
      el('div', { class: 'method-title' }, EXPORT_METHODS[id].title),
      el('div', { class: 'method-sub' }, EXPORT_METHODS[id].sub),
    );

    return el('section', { class: 'screen' },
      stepHeader(2, 4, 'Save your messages'),
      el('p', { class: 'lede' },
        'Pick a way to keep the conversation. Short threads do fine with screenshots; long histories are easier on a computer.'),
      card('screenshots'),
      card('imazing'),
      card('mac-icloud'),
      el('button', { class: 'ghost', onclick: () => setStep(1) }, 'Back'),
    );
  }

  const m = EXPORT_METHODS[method];
  const checkKey = `export-done-${method}`;
  const done = !!state.setup.checks[checkKey];
  const cb = el('input', {
    type: 'checkbox',
    onchange: e => { setCheck(checkKey, e.target.checked); render(); },
  });
  if (done) cb.checked = true;

  return el('section', { class: 'screen' },
    stepHeader(2, 4, m.title),
    el('ol', { class: 'steps' }, ...m.steps.map(s => el('li', {}, s))),
    el('label', { class: 'check-row' }, cb,
      el('span', {}, "I've saved the messages I want to keep.")),
    el('div', { class: 'row' },
      el('button', {
        class: 'ghost',
        onclick: () => { state.setup.exportMethod = null; saveState(); render(); },
      }, 'Pick another method'),
      el('button', { class: 'primary', disabled: !done, onclick: () => setStep(3) }, 'Continue'),
    ),
  );
}

const CLEAR_TASKS = [
  {
    key: 'clear-thread',
    required: true,
    title: 'Delete the message thread',
    steps: [
      'Open Messages.',
      'Swipe left on the conversation → Delete.',
      'Then tap Edit (top left) → Show Recently Deleted → select the thread → Delete → Delete Message.',
    ],
  },
  {
    key: 'clear-recents',
    required: true,
    title: 'Clear call history',
    steps: [
      'Open the Phone app → Recents.',
      'Swipe left on each call from this person → Delete.',
      'Or, if you don\'t mind clearing all: tap Edit → Clear → Clear All Recents.',
    ],
  },
  {
    key: 'clear-contact',
    required: false,
    title: 'Remove from Contacts (recommended)',
    steps: [
      'Open Contacts → tap their card → Edit.',
      'Scroll to the bottom → Delete Contact.',
      'Or, less aggressive: delete the phone number field but keep the name.',
    ],
  },
  {
    key: 'block',
    required: false,
    title: 'Block the number (optional)',
    steps: [
      'Settings → Phone → Blocked Contacts → Add New.',
      'Or in Phone app: tap their entry → ⓘ → Block this Caller.',
      'They can leave voicemail but cannot ring through.',
    ],
  },
];

function renderSetupClear() {
  const allRequired = CLEAR_TASKS.filter(t => t.required).every(t => state.setup.checks[t.key]);

  return el('section', { class: 'screen' },
    stepHeader(3, 4, 'Clear from your phone'),
    el('p', { class: 'lede' },
      'Now remove the easy-access paths. The first two are required; the others are optional but they help.'),
    ...CLEAR_TASKS.map(t => {
      const checked = !!state.setup.checks[t.key];
      const cb = el('input', {
        type: 'checkbox',
        onchange: e => { setCheck(t.key, e.target.checked); render(); },
      });
      if (checked) cb.checked = true;
      return el('div', { class: 'task' },
        el('label', { class: 'check-row' }, cb,
          el('span', { class: 'task-title' },
            t.title, t.required ? '' : ' ',
            t.required ? null : el('span', { class: 'optional-tag' }, 'optional'),
          )),
        el('ol', { class: 'steps' }, ...t.steps.map(s => el('li', {}, s))),
      );
    }),
    el('div', { class: 'row' },
      el('button', { class: 'ghost', onclick: () => setStep(2) }, 'Back'),
      el('button', { class: 'primary', disabled: !allRequired, onclick: () => setStep(4) }, 'Continue'),
    ),
  );
}

function renderSetupLock() {
  let dur = '604800';
  const durEl = el('select', { onchange: e => { dur = e.target.value; } },
    el('option', { value: '0' }, 'No commit period (friction only)'),
    el('option', { value: '3600' }, '1 hour'),
    el('option', { value: '86400' }, '1 day'),
    el('option', { value: '604800', selected: true }, '1 week'),
    el('option', { value: '2592000' }, '30 days'),
  );

  const finishBtn = el('button', {
    class: 'primary',
    onclick: () => {
      const draft = state.setup.draft || { name: '', phone: '' };
      state.contact = { name: draft.name.trim(), phone: draft.phone.trim(), addedAt: Date.now() };
      const seconds = Number(dur);
      if (seconds > 0) state.commitUntil = Date.now() + seconds * 1000;
      state.setup = { step: 0, draft: null, exportMethod: null, checks: {} };
      logEvent('lockset');
      saveState();
      render();
    },
  }, 'Lock it');

  return el('section', { class: 'screen' },
    stepHeader(4, 4, 'Set the lock'),
    el('p', { class: 'lede' },
      "How long do you want to commit? You can still force unlocks during this period — but you'll have to do the cooldown and typing challenge each time."),
    el('div', { class: 'field' }, el('label', {}, 'Commit period'), durEl),
    el('div', { class: 'row' },
      el('button', { class: 'ghost', onclick: () => setStep(3) }, 'Back'),
      finishBtn,
    ),
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
