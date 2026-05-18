/* Crush Guesser '95 */
'use strict';

// ── Constants ──────────────────────────────────────────────────────────────
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GAME_W = 390;
const GAME_H = 844;

const S = {
  TITLE:         'TITLE',
  HALLWAY_INTRO: 'HALLWAY_INTRO',
  HALLWAY_INPUT: 'HALLWAY_INPUT',
  LOCKER_INTRO:  'LOCKER_INTRO',
  LOCKER_COMBO:  'LOCKER_COMBO',
  LOCKER_UNLOCK: 'LOCKER_UNLOCK',
  LOCKER_ANIM:   'LOCKER_ANIM',
  TK_INTRO:      'TK_INTRO',
  TK_COMBO:      'TK_COMBO',
  TK_REVEAL:     'TK_REVEAL',
  PLAY_AGAIN:    'PLAY_AGAIN',
};

// ── Game state ─────────────────────────────────────────────────────────────
let G = {};
let transitioning = false;

function resetGame() {
  if (G.animTimer) { clearInterval(G.animTimer); }
  G = {
    scene:        S.TITLE,
    nameLength:   5,
    alphaGroups:  [],
    lockerSel:    [],
    newGroups:    [],
    tkSel:        [],
    revealedName: '',
    lockRotDeg:   0,
    animFrame:    1,
    animTimer:    null,
  };
  transitioning = false;
}

// ── Logic ──────────────────────────────────────────────────────────────────
function divideAlphabet(n) {
  const groups = [];
  for (let i = 0; i < 26; i += n) {
    groups.push(ALPHABET.slice(i, Math.min(i + n, 26)));
  }
  return groups;
}

function computeNewGroups(selectedGroups) {
  const minLen = selectedGroups.reduce((m, g) => Math.min(m, g.length), Infinity);
  const rows = [];
  for (let r = 0; r < minLen; r++) {
    rows.push(selectedGroups.map(g => g[r]).join(''));
  }
  return rows;
}

function extractName(newGroups, tkSel) {
  return tkSel.map((rowIdx, col) => newGroups[rowIdx][col]).join('');
}

// ── DOM helpers ────────────────────────────────────────────────────────────
function mk(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function mkImg(src, cls) {
  const i = mk('img', cls);
  i.src = src;
  i.alt = '';
  return i;
}

function tkDialSrc(digit) {
  if (digit === 9) return 'dial/to-dial-9.PNG';
  return `dial/tk-dial-${digit}.PNG`;
}

const gameEl = () => document.getElementById('game');

function setBg(src) {
  gameEl().style.backgroundImage = `url('${src}')`;
}

// ── Scene transition ───────────────────────────────────────────────────────
function goto(scene) {
  if (transitioning) return;
  transitioning = true;
  if (G.animTimer) { clearInterval(G.animTimer); G.animTimer = null; }

  const fade = mk('div', 'scene-fade');
  gameEl().appendChild(fade);
  requestAnimationFrame(() => {
    fade.classList.add('dark');
    setTimeout(() => {
      G.scene = scene;
      gameEl().innerHTML = '';
      transitioning = false;
      render();
    }, 350);
  });
}

// ── Dialogue ───────────────────────────────────────────────────────────────
function buildDialogue(g, lines, onDone) {
  let idx = 0;
  const box = mk('div', 'dialogue-box');

  const tag = mk('div', 'dlg-you-tag lf');
  tag.textContent = 'You';

  const tb  = mk('div', 'dlg-textbox');
  const txt = mk('div', 'dlg-text');
  txt.textContent = lines[0];
  const arrow = mk('div', 'dlg-arrow');
  tb.append(txt, arrow);

  box.append(tag, tb);
  g.append(box);

  box.addEventListener('click', () => {
    idx++;
    if (idx >= lines.length) { if (!transitioning) onDone(); }
    else { txt.textContent = lines[idx]; }
  });
}

// ── Paper layer ────────────────────────────────────────────────────────────
function buildPaper(g, imgFile, textCls, contentFn) {
  const layer = mk('div', 'paper-layer');
  layer.appendChild(mkImg(`hand-with-paper/${imgFile}`, ''));
  g.appendChild(layer);

  const overlay = mk('div', `paper-text ${textCls}`);
  contentFn(overlay);
  g.appendChild(overlay);
}

// ── Nav buttons ────────────────────────────────────────────────────────────
function addNext(g, onClick) {
  const btn = mk('div', 'nav-btn nav-next');
  btn.innerHTML = '<div class="nav-icon"></div><span class="lf">Next</span>';
  btn.addEventListener('click', onClick);
  g.appendChild(btn);
}

function addBack(g, onBack) {
  if (!onBack) return;
  const btn = mk('div', 'nav-btn nav-back');
  btn.innerHTML = '<div class="nav-icon"></div><span class="lf">Back</span>';
  btn.addEventListener('click', onBack);
  g.appendChild(btn);
}

// ── Render dispatcher ──────────────────────────────────────────────────────
function render() {
  const g = gameEl();
  ({
    [S.TITLE]:         renderTitle,
    [S.HALLWAY_INTRO]: renderHallwayIntro,
    [S.HALLWAY_INPUT]: renderHallwayInput,
    [S.LOCKER_INTRO]:  renderLockerIntro,
    [S.LOCKER_COMBO]:  renderLockerCombo,
    [S.LOCKER_UNLOCK]: renderLockerUnlock,
    [S.LOCKER_ANIM]:   renderLockerAnim,
    [S.TK_INTRO]:      renderTKIntro,
    [S.TK_COMBO]:      renderTKCombo,
    [S.TK_REVEAL]:     renderTKReveal,
    [S.PLAY_AGAIN]:    renderPlayAgain,
  })[G.scene]?.(g);
}

// ── TITLE ──────────────────────────────────────────────────────────────────
function renderTitle(g) {
  setBg('background/view-1-school-hallway.png');
  g.appendChild(mkImg('title/Crush-guesser-title.png', 'title-logo'));

  // Paper layer with text inside so both sway together
  const layer = mk('div', 'paper-layer paper-layer--title');
  layer.appendChild(mkImg('hand-with-paper/hand-with-paper-hallway.PNG', ''));

  const overlay = mk('div', 'paper-text paper-text-title');
  overlay.innerHTML = `
    <span class="paper-line hwf">Back then, names meant a whole lot more...</span>
    <span class="paper-line hwf">Now, think of a name.</span>
    <span class="paper-line hwf">Don't say it out loud.</span>
    <span class="start-line" id="start-link">
      <span class="start-text">START</span>
      <svg class="start-squiggle" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2,6 Q9,2 17,5 T31,5 Q40,8 50,4 T68,5 Q78,2 87,6 T98,5"/>
      </svg>
    </span>
  `;
  layer.appendChild(overlay);
  g.appendChild(layer);

  // wire up START after insertion
  requestAnimationFrame(() => {
    document.getElementById('start-link')?.addEventListener('click', () => goto(S.HALLWAY_INTRO));
  });
}

// ── HALLWAY INTRO ──────────────────────────────────────────────────────────
function renderHallwayIntro(g) {
  setBg('background/view-1-school-hallway.png');

  buildDialogue(g, [
    "I can almost feel it like it was yesterday... School had already been done for the summer. My best friend told me that their crush's name was written inside a Trapper Keeper kept inside a locker at school.",
    "They said they left clues behind so I could figure out who it was. Time to find that locker...",
  ], () => goto(S.HALLWAY_INPUT));

  buildPaper(g, 'hand-with-paper-hallway.PNG', 'paper-text-hallway', txt => {
    txt.innerHTML =
      '<span class="hwf">Possible locker number.</span><br>' +
      '<span class="hwf" style="font-size:28px">26</span>' +
      '<span class="hwf"> ÷ Length of name<br>= Locker number</span>';
  });
}

// ── HALLWAY INPUT ──────────────────────────────────────────────────────────
function renderHallwayInput(g) {
  setBg('background/view-1-school-hallway.png');

  let len = G.nameLength;

  buildPaper(g, 'hand-with-paper-hallway.PNG', 'paper-text-hallway', txt => {
    txt.innerHTML =
      '<div class="hwf" style="margin-bottom:8px">How many letters<br>in the name?</div>' +
      '<div class="name-stepper">' +
        '<button class="step-btn lf" id="dec">−</button>' +
        '<span class="step-val hwf" id="len-val">' + len + '</span>' +
        '<button class="step-btn lf" id="inc">+</button>' +
      '</div>' +
      '<div class="hwf" style="font-size:12px;color:#4a5a8b;margin-top:6px">' +
        '= Locker #' + len +
      '</div>';
  });

  addNext(g, () => {
    G.nameLength  = len;
    G.alphaGroups = divideAlphabet(len);
    G.lockerSel   = [];
    G.newGroups   = [];
    G.tkSel       = [];
    G.lockRotDeg  = 0;
    goto(S.LOCKER_INTRO);
  });
  addBack(g, () => goto(S.HALLWAY_INTRO));

  // Wire up stepper after layout
  requestAnimationFrame(() => {
    const valEl = document.getElementById('len-val');
    const lockerHint = g.querySelector('.paper-text-hallway > div:last-child');

    const update = () => {
      if (valEl) valEl.textContent = len;
      if (lockerHint) lockerHint.textContent = `= Locker #${len}`;
    };

    document.getElementById('dec')?.addEventListener('click', () => {
      if (len > 2) { len--; update(); }
    });
    document.getElementById('inc')?.addEventListener('click', () => {
      if (len < 9) { len++; update(); }
    });
  });
}

// ── LOCKER INTRO ───────────────────────────────────────────────────────────
function renderLockerIntro(g) {
  setBg('background/view-2-locker-closed-lock-on.png');
  addLockOverlay(g, false);

  buildDialogue(g, [
    "I know the combination is based off the clues in this paper they left behind. Something about each letter of the name being in a group of letters.",
    "The combo is the group number for each letter in sequence. Let me look at the groups...",
  ], () => {
    G.lockerSel  = [];
    G.lockRotDeg = 0;
    goto(S.LOCKER_COMBO);
  });

  buildPaper(g, 'hand-with-paper-locker.PNG', 'paper-text-locker', txt => {
    buildGroupListEl(txt, [], false);
  });

  addBack(g, () => goto(S.HALLWAY_INPUT));
}

// ── LOCKER COMBO ───────────────────────────────────────────────────────────
function renderLockerCombo(g) {
  setBg('background/view-2-locker-closed-lock-on.png');
  addLockOverlay(g, true);

  buildPaper(g, 'hand-with-paper-locker.PNG', 'paper-text-locker', txt => {
    const labelEl = mk('div', 'hwf combo-line');
    labelEl.textContent = 'Lock combo:';
    txt.appendChild(labelEl);

    const numsEl = mk('div', 'combo-nums hwf');
    numsEl.id = 'combo-nums';
    refreshComboNums(numsEl);
    txt.appendChild(numsEl);

    buildGroupListEl(txt, G.lockerSel, true);
  });

  const step = G.lockerSel.length;
  if (step < G.nameLength) {
    const prompt = mk('div', 'group-prompt lf');
    prompt.id = 'group-prompt';
    prompt.textContent = `Which group has letter ${step + 1}?`;
    g.appendChild(prompt);

    const btns = mk('div', 'group-btns');
    G.alphaGroups.forEach((_, i) => {
      const b = mk('button', 'g-btn lf');
      b.textContent = String(i + 1);
      b.addEventListener('click', () => onGroupSelect(i));
      btns.appendChild(b);
    });
    g.appendChild(btns);
  }

  addBack(g, () => {
    G.lockerSel  = [];
    G.lockRotDeg = 0;
    goto(S.LOCKER_INTRO);
  });
}

function refreshComboNums(el) {
  let html = '';
  for (let i = 0; i < G.nameLength; i++) {
    if (i > 0) html += '<span class="cd-sep">-</span>';
    html += i < G.lockerSel.length
      ? `<span class="cd-filled">${G.lockerSel[i] + 1}</span>`
      : '<span class="cd-pending">_</span>';
  }
  el.innerHTML = html;
}

function buildGroupListEl(parent, selIdxs, strikeUsed) {
  const list = mk('div', 'groups-list hwf');
  G.alphaGroups.forEach((group, i) => {
    const row  = mk('div', 'gi');
    const used = strikeUsed && selIdxs.includes(i);
    row.innerHTML = `<span class="${used ? 'gi-strike' : ''}">${i + 1}. ${group}</span>`;
    list.appendChild(row);
  });
  parent.appendChild(list);
}

function onGroupSelect(groupIdx) {
  G.lockerSel.push(groupIdx);

  // Spin the lock dial
  G.lockRotDeg += (360 / G.alphaGroups.length) * (groupIdx + 1) * 1.5;
  const dialImg = document.getElementById('lock-dial');
  if (dialImg) dialImg.style.transform = `rotate(${G.lockRotDeg}deg)`;

  // Refresh combo display in-place
  const numsEl = document.getElementById('combo-nums');
  if (numsEl) refreshComboNums(numsEl);

  // Update group strike-through in-place
  document.querySelectorAll('.gi span').forEach((span, i) => {
    span.className = G.lockerSel.includes(i) ? 'gi-strike' : '';
  });

  if (G.lockerSel.length >= G.nameLength) {
    const selGroups = G.lockerSel.map(i => G.alphaGroups[i]);
    G.newGroups = computeNewGroups(selGroups);
    G.tkSel     = new Array(G.nameLength).fill(0);
    // Disable buttons to prevent double-tap
    document.querySelectorAll('.g-btn').forEach(b => (b.disabled = true));
    setTimeout(() => goto(S.LOCKER_UNLOCK), 800);
  } else {
    const prompt = document.getElementById('group-prompt');
    if (prompt) prompt.textContent = `Which group has letter ${G.lockerSel.length + 1}?`;
  }
}

function addLockOverlay(g, animated) {
  const wrap = mk('div', 'lock-wrap');
  const body = mkImg('lock/locker-lock-body-on.PNG', 'lock-body-img');
  const dial = mkImg('lock/locker-lock-dial.PNG', 'lock-dial-img');
  dial.id = 'lock-dial';
  if (animated) dial.style.transform = `rotate(${G.lockRotDeg}deg)`;
  wrap.append(body, dial);
  g.appendChild(wrap);
}

// ── LOCKER UNLOCK ──────────────────────────────────────────────────────────
function renderLockerUnlock(g) {
  setBg('background/view-3-locker-closed-lock-off.PNG');

  buildDialogue(g, [
    "There! The lock is open! Now I can open the locker and see what's inside.",
  ], () => {
    G.animFrame = 1;
    goto(S.LOCKER_ANIM);
  });
}

// ── LOCKER ANIMATION ───────────────────────────────────────────────────────
function renderLockerAnim(g) {
  setBg(`background/view-4-locker-open-${G.animFrame}.PNG`);

  G.animTimer = setInterval(() => {
    G.animFrame++;
    if (G.animFrame > 11) {
      clearInterval(G.animTimer);
      G.animTimer = null;
      setTimeout(() => goto(S.TK_INTRO), 300);
      return;
    }
    setBg(`background/view-4-locker-open-${G.animFrame}.PNG`);
  }, 90);
}

// ── TK INTRO ───────────────────────────────────────────────────────────────
function renderTKIntro(g) {
  setBg('background/view-4-locker-open-11.PNG');

  buildDialogue(g, [
    "The Trapper Keeper! It looks like there's a dial lock on it.",
    "I have one more clue paper to figure out the combination. Time to crack this thing open...",
  ], () => goto(S.TK_COMBO));
}

// ── TK COMBO ───────────────────────────────────────────────────────────────
function renderTKCombo(g) {
  setBg('background/view-5-trapper-keeper-closed.png');

  const numRows = G.newGroups.length;
  // Responsive dial width: fit all N dials within ~370px with 5px gaps
  const dialW = Math.min(46, Math.floor((374 - (G.nameLength - 1) * 5) / G.nameLength));

  const dialsWrap = mk('div', 'tk-dials-wrap');
  dialsWrap.style.gap = '5px';

  for (let i = 0; i < G.nameLength; i++) {
    const unit   = mk('div', 'tk-dial-unit');
    const upBtn  = mk('button', 'dial-arrow-btn lf');
    upBtn.textContent = '▲';
    upBtn.style.width = `${dialW}px`;

    const dialImg = mkImg(tkDialSrc(G.tkSel[i] + 1), 'tk-dial-img');
    dialImg.id = `td-${i}`;
    dialImg.style.width = `${dialW}px`;

    const downBtn = mk('button', 'dial-arrow-btn lf');
    downBtn.textContent = '▼';
    downBtn.style.width = `${dialW}px`;

    upBtn.addEventListener('click',   () => changeDial(i,  1, numRows));
    downBtn.addEventListener('click', () => changeDial(i, -1, numRows));

    unit.append(upBtn, dialImg, downBtn);
    dialsWrap.appendChild(unit);
  }
  g.appendChild(dialsWrap);

  // Paper: new groups + dial combo
  buildPaper(g, 'hand-with-paper-trapper-keeper.PNG', 'paper-text-tk', txt => {
    const label = mk('div', 'hwf');
    label.textContent = 'Dial combo:';
    label.style.marginBottom = '2px';
    txt.appendChild(label);

    const combo = mk('div', 'hwf combo-nums');
    combo.id = 'tk-combo';
    combo.textContent = G.tkSel.map(s => s + 1).join('-');
    txt.appendChild(combo);

    const list = mk('div', 'groups-list hwf');
    G.newGroups.forEach((row, i) => {
      const d = mk('div', 'gi');
      d.textContent = `${i + 1}. ${row}`;
      list.appendChild(d);
    });
    txt.appendChild(list);
  });

  const openBtn = mk('button', 'open-btn lf');
  openBtn.textContent = 'OPEN IT';
  openBtn.addEventListener('click', () => {
    G.revealedName = extractName(G.newGroups, G.tkSel);
    goto(S.TK_REVEAL);
  });
  g.appendChild(openBtn);
}

function changeDial(idx, dir, numRows) {
  G.tkSel[idx] = (G.tkSel[idx] + dir + numRows) % numRows;
  const img = document.getElementById(`td-${idx}`);
  if (img) img.src = tkDialSrc(G.tkSel[idx] + 1);
  const combo = document.getElementById('tk-combo');
  if (combo) combo.textContent = G.tkSel.map(s => s + 1).join('-');
}

// ── TK REVEAL ─────────────────────────────────────────────────────────────
function renderTKReveal(g) {
  setBg('background/view-6-trapper-keeper-open.PNG');

  buildDialogue(g, [
    "The crush's name is...",
  ], () => goto(S.PLAY_AGAIN));

  const nameLen = G.revealedName.length;
  const fontSize = nameLen <= 5 ? 52 : nameLen <= 7 ? 42 : 34;

  const nameEl = mk('div', 'reveal-name hwf');
  nameEl.id    = 'revealed-name';
  nameEl.textContent = G.revealedName;
  nameEl.style.fontSize = `${fontSize}px`;
  g.appendChild(nameEl);

  setTimeout(() => {
    document.getElementById('revealed-name')?.classList.add('show');
  }, 700);
}

// ── PLAY AGAIN ────────────────────────────────────────────────────────────
function renderPlayAgain(g) {
  setBg('background/view-6-trapper-keeper-open.PNG');

  const nameLen  = G.revealedName.length;
  const fontSize = nameLen <= 5 ? 52 : nameLen <= 7 ? 42 : 34;

  const nameEl = mk('div', 'reveal-name hwf show');
  nameEl.textContent = G.revealedName;
  nameEl.style.fontSize = `${fontSize}px`;
  g.appendChild(nameEl);

  buildDialogue(g, [
    `The crush\'s name is ${G.revealedName}! Thank you for playing!`,
  ], () => {});

  const wrap   = mk('div', 'play-again-wrap');
  const yesBtn = mk('button', 'pa-btn lf');
  yesBtn.textContent = 'PLAY AGAIN';
  yesBtn.addEventListener('click', () => { resetGame(); goto(S.TITLE); });
  wrap.appendChild(yesBtn);
  g.appendChild(wrap);
}

// ── Scaling ────────────────────────────────────────────────────────────────
function scaleGame() {
  const g = document.getElementById('game');
  if (!g) return;
  const s = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  g.style.transform = `scale(${s})`;
  document.getElementById('game-wrapper').style.alignItems = 'center';
}

// ── Boot ───────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  resetGame();
  scaleGame();
  render();
});

window.addEventListener('resize', scaleGame);
