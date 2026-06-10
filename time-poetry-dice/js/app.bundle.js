(function(){
'use strict';
/* === analytics.js === */
const STORAGE_KEY = "time-poetry-dice-analytics";

function track(event, data = {}) {
  const payload = { event, timestamp: Date.now(), ...data };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    stored.push(payload);
    if (stored.length > 200) stored.splice(0, stored.length - 200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* ignore */
  }

  document.dispatchEvent(new CustomEvent("poetry:track", { detail: payload }));
}

function recordVisit() {
  const key = "time-poetry-dice-visit";
  try {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    data.count = (data.count || 0) + 1;
    data.lastVisit = Date.now();
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  } catch {
    return { count: 1 };
  }
}

function incrementRollCount() {
  const key = "time-poetry-dice-rolls";
  try {
    const n = Number(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(n));
    return n;
  } catch {
    return 1;
  }
}

/* === poem.js === */
const BEST_TEMPLATES = [
  ({ color, nature, action, object, emotion }) => {
    const subject = object === "小猫" ? "小猫" : `那只${object}`;
    return `${color}${nature}${action}${object}，\n${emotion}的${subject}终于抬起头。`;
  },
  ({ color, nature, action, object, time }) =>
    `${color}${nature}${action}${object}，\n${time}的故事刚刚开始。`,
  ({ nature, action, color, object, emotion }) =>
    `${nature}${action}过${color}的${object}，\n${emotion}在角落里发芽。`,
  ({ color, object, nature, action, emotion }) =>
    `${color}${object}里，\n${nature}轻轻${action}，${emotion}有了名字。`,
  ({ time, nature, color, action, object }) =>
    `${time}的${color}${nature}，\n${action}向${object}，像一句玩笑话。`,
  ({ emotion, nature, object, action, color }) =>
    `把${emotion}交给${nature}，\n${action}过${color}的${object}。`,
  ({ color, nature, object, action, time }) =>
    `${color}${nature}停在${object}旁，\n${time}悄悄${action}。`,
  ({ nature, color, action, emotion, object }) =>
    `${nature}和${color}打了个照面，\n${action}之后，${emotion}住进了${object}。`,
];

function countChars(text) {
  return text.replace(/\s/g, "").length;
}

function varsFromMap(wordMap) {
  return {
    emotion: wordMap.emotion,
    time: wordMap.time,
    nature: wordMap.nature,
    color: wordMap.color,
    object: wordMap.object,
    action: wordMap.action,
  };
}

function generateBestPoem(wordMap) {
  const vars = varsFromMap(wordMap);
  const shuffled = [...BEST_TEMPLATES].sort(() => Math.random() - 0.5);

  for (const tpl of shuffled) {
    const poem = tpl(vars).trim();
    const len = countChars(poem);
    if (len >= 18 && len <= 36) return poem;
  }

  return `${vars.color}${vars.nature}${vars.action}${vars.object}，\n${vars.emotion}的${vars.object}终于抬起头。`;
}

function getBestOrder(wordMap, rolledWords) {
  const v = varsFromMap(wordMap);
  const ordered = [v.color, v.nature, v.action, v.object, v.emotion, v.time].filter(Boolean);
  const unique = [...new Set(ordered)];
  const rest = rolledWords.filter((w) => !unique.includes(w));
  return [...unique, ...rest].slice(0, 6);
}

function composeCustomPoem(words) {
  if (!words.length) return "";
  const mid = Math.ceil(words.length / 2);
  return `${words.slice(0, mid).join("")}\n${words.slice(mid).join("")}`;
}

function getShareCopy(words, bestPoem) {
  return `时间的诗\n\n我掷出了这组词：\n${words.join("｜")}\n\n它们最终组成：\n${bestPoem.replace(/\n/g, "")}\n\n你也来试试，看看你的词语会怎么排列`;
}

/* === drag.js === */
function initDiceDrag(container, rolledItems, createItemEl, onChange) {
  let order = [...rolledItems];
  let dragUsed = false;

  function render() {
    container.innerHTML = "";
    order.forEach((item, index) => {
      const el = createItemEl(item);
      el.draggable = true;
      el.dataset.index = String(index);
      el.classList.add("dice-wrap--draggable");

      el.addEventListener("dragstart", (e) => {
        dragUsed = true;
        el.classList.add("dice-wrap--dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      });

      el.addEventListener("dragend", () => {
        el.classList.remove("dice-wrap--dragging");
      });

      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        el.classList.add("dice-wrap--over");
      });

      el.addEventListener("dragleave", () => {
        el.classList.remove("dice-wrap--over");
      });

      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("dice-wrap--over");
        const from = Number(e.dataTransfer.getData("text/plain"));
        const to = Number(el.dataset.index);
        if (from === to) return;

        const next = [...order];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        order = next;
        render();
        onChange(order.map((i) => i.word), dragUsed);
      });

      container.appendChild(el);
    });
  }

  render();
  onChange(order.map((i) => i.word), false);

  return {
    getOrder: () => order.map((i) => i.word),
    setOrder: (words) => {
      order = words
        .map((word) => order.find((i) => i.word === word) || rolledItems.find((i) => i.word === word))
        .filter(Boolean);
      render();
      onChange(order.map((i) => i.word), dragUsed);
    },
    wasDragUsed: () => dragUsed,
  };
}

/* === poster.js === */
const POSTER_W = 1080;
const POSTER_H = 1920;

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = text.split("\n");
  let cy = y;
  lines.forEach((line) => {
    const chars = [...line];
    let current = "";
    chars.forEach((ch) => {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current) {
        ctx.fillText(current, x, cy);
        cy += lineHeight;
        current = ch;
      } else {
        current = test;
      }
    });
    if (current) {
      ctx.fillText(current, x, cy);
      cy += lineHeight;
    }
  });
  return cy;
}

function renderPoster(canvas, { words, bestPoem, siteUrl }) {
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  const w = POSTER_W;
  const h = POSTER_H;

  ctx.fillStyle = "#FAFAFA";
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.55);
  glow.addColorStop(0, "rgba(217,242,255,0.5)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "center";
  ctx.font = "500 56px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#1e293b";
  ctx.fillText("时间的诗", w / 2, 200);

  ctx.font = "300 32px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(30,41,59,0.55)";
  ctx.fillText("我掷出了这组词：", w / 2, 320);

  ctx.font = "400 36px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#1e293b";
  ctx.fillText(words.join("｜"), w / 2, 400);

  ctx.font = "300 32px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(30,41,59,0.55)";
  ctx.fillText("它们最终组成：", w / 2, 520);

  ctx.font = "400 52px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#1e293b";
  wrapText(ctx, bestPoem, 120, 620, w - 240, 84);

  ctx.font = "300 34px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(30,41,59,0.45)";
  ctx.fillText("你也来试试", w / 2, h - 280);
  ctx.fillText("看看你的词语会怎么排列", w / 2, h - 220);

  ctx.font = "300 24px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(30,41,59,0.3)";
  const url = (siteUrl || window.location.href).replace(/^https?:\/\//, "");
  ctx.fillText(url, w / 2, h - 80);

  return canvas;
}

function downloadPoster(canvas, filename = "时间的诗.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function getPosterPreviewScale(canvas, maxWidth) {
  const scale = Math.min(1, maxWidth / POSTER_W);
  canvas.style.width = `${POSTER_W * scale}px`;
  canvas.style.height = `${POSTER_H * scale}px`;
}

/* === dice.js === */
const DICE_SETS = [
  { id: "emotion", label: "情绪", words: ["等待", "重逢", "拥抱", "遗忘", "想念", "告别"] },
  { id: "time", label: "时间", words: ["今天", "昨天", "黄昏", "深夜", "未来", "清晨"] },
  { id: "nature", label: "自然", words: ["晚风", "银河", "潮汐", "月亮", "雨水", "雪地"] },
  { id: "color", label: "颜色", words: ["蓝色", "粉色", "白色", "透明", "灰色", "金色"] },
  { id: "object", label: "事物", words: ["宇宙", "冰川", "灯塔", "小猫", "信件", "车站"] },
  { id: "action", label: "动作", words: ["流过", "经过", "停留", "闪烁", "坠落", "消失"] },
];

const FACE_TRANSFORMS = [
  "rotateY(0deg) translateZ(var(--half))",
  "rotateY(90deg) translateZ(var(--half))",
  "rotateY(180deg) translateZ(var(--half))",
  "rotateY(-90deg) translateZ(var(--half))",
  "rotateX(90deg) translateZ(var(--half))",
  "rotateX(-90deg) translateZ(var(--half))",
];

const ROLL_DURATION = 2500;

function rollDice() {
  return DICE_SETS.map((set) => {
    const faceIndex = Math.floor(Math.random() * 6);
    return {
      setId: set.id,
      label: set.label,
      word: set.words[faceIndex],
      faceIndex,
    };
  });
}

function wordsToMap(rolled) {
  const map = {};
  rolled.forEach((item) => {
    map[item.setId] = item.word;
  });
  return map;
}

function createFace(word, index) {
  const face = document.createElement("div");
  face.className = "dice-face";
  face.style.transform = FACE_TRANSFORMS[index];
  face.textContent = word;
  return face;
}

function createDiceElement(set, options = {}) {
  const { size = "md", word = null, faceIndex = 0, floating = false, delay = 0 } = options;

  const wrap = document.createElement("div");
  wrap.className = `dice-wrap dice-wrap--${size}`;
  if (floating) {
    wrap.classList.add("dice-wrap--float");
    wrap.style.animationDelay = `${delay}s`;
  }
  wrap.dataset.setId = set.id;

  const cube = document.createElement("div");
  cube.className = "dice-cube";
  cube.setAttribute("role", "img");
  cube.setAttribute("aria-label", `${set.label}骰子`);

  set.words.forEach((w, i) => {
    cube.appendChild(createFace(w, i));
  });

  if (word !== null) {
    cube.dataset.face = String(faceIndex);
    cube.style.transform = getStoppedRotation(faceIndex);
  }

  wrap.appendChild(cube);
  return wrap;
}

function getStoppedRotation(faceIndex) {
  const rotations = [
    "rotateX(-12deg) rotateY(18deg)",
    "rotateX(-12deg) rotateY(-72deg)",
    "rotateX(-12deg) rotateY(-162deg)",
    "rotateX(-12deg) rotateY(108deg)",
    "rotateX(-102deg) rotateY(18deg)",
    "rotateX(78deg) rotateY(18deg)",
  ];
  return rotations[faceIndex] || rotations[0];
}

function renderDiceCluster(container, { count = 3, size = "sm", floating = true } = {}) {
  container.innerHTML = "";
  DICE_SETS.slice(0, count).forEach((set, i) => {
    container.appendChild(createDiceElement(set, { size, floating, delay: i * 0.4 }));
  });
}

function renderDiceStage(container, rolled) {
  container.innerHTML = "";
  DICE_SETS.forEach((set, i) => {
    const item = rolled.find((r) => r.setId === set.id);
    const el = createDiceElement(set, {
      size: "lg",
      word: item?.word ?? null,
      faceIndex: item?.faceIndex ?? 0,
    });
    if (i >= 3) {
      el.classList.add("dice-wrap--pending");
    }
    container.appendChild(el);
  });
}

function animateRoll(container, rolled, onComplete) {
  const wraps = [...container.querySelectorAll(".dice-wrap")];
  const cubes = [...container.querySelectorAll(".dice-cube")];

  wraps.forEach((wrap) => {
    wrap.classList.add("dice-wrap--drop");
  });

  setTimeout(() => {
    wraps.slice(0, 3).forEach((wrap, i) => {
      wrap.querySelector(".dice-cube")?.classList.add("dice-cube--spin");
      wrap.style.animationDelay = `${i * 0.05}s`;
    });
  }, 300);

  setTimeout(() => {
    wraps.slice(3).forEach((wrap, i) => {
      wrap.classList.remove("dice-wrap--pending");
      wrap.classList.add("dice-wrap--appear");
      setTimeout(() => {
        wrap.querySelector(".dice-cube")?.classList.add("dice-cube--spin");
      }, i * 120);
    });
  }, 650);

  const stopStart = 1100;
  const stopGap = 200;

  cubes.forEach((cube, i) => {
    setTimeout(() => {
      cube.classList.remove("dice-cube--spin");
      cube.classList.add("dice-cube--landed");
      cube.style.transform = getStoppedRotation(rolled[i].faceIndex);
    }, stopStart + i * stopGap);
  });

  setTimeout(() => {
    wraps.forEach((wrap) => {
      wrap.classList.remove("dice-wrap--drop", "dice-wrap--appear");
    });
    onComplete?.();
  }, ROLL_DURATION);
}

function renderMiniDice(container, rolled) {
  container.innerHTML = "";
  rolled.forEach((item) => {
    const set = DICE_SETS.find((s) => s.id === item.setId);
    const el = createDiceElement(set, {
      size: "xs",
      word: item.word,
      faceIndex: item.faceIndex,
    });
    container.appendChild(el);
  });
}

/* === app.js === */
const SITE_URL = window.location.href.split("?")[0];
const PAGE_TRANSITION_MS = 500;
const BEST_ANIM_MS = 1500;

const state = {
  screen: "home",
  rolled: [],
  wordMap: {},
  words: [],
  bestPoem: "",
  bestOrder: [],
  isRolling: false,
  diceCtrl: null,
  bestRevealed: false,
};

const $ = (sel) => document.querySelector(sel);

function showToast(msg) {
  const toast = $("#toast");
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function switchScreen(name) {
  if (state.screen === name) return;
  const prev = $(`.screen[data-screen="${state.screen}"]`);
  const next = $(`.screen[data-screen="${name}"]`);

  prev?.classList.remove("screen--active");
  next?.classList.add("screen--active", "screen--entering");
  setTimeout(() => next?.classList.remove("screen--entering"), PAGE_TRANSITION_MS);

  state.screen = name;
  next?.querySelectorAll(".reveal").forEach((el, i) => {
    el.classList.remove("reveal--visible");
    setTimeout(() => el.classList.add("reveal--visible"), 60 + i * 50);
  });
}

function playRollSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.35, 0.55, 0.75, 0.95].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 600 + Math.random() * 400;
      gain.gain.setValueAtTime(0.05, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.07);
    });
  } catch {
    /* ignore */
  }
}

function createResultDice(item) {
  const set = DICE_SETS.find((s) => s.id === item.setId);
  return createDiceElement(set, {
    size: "md",
    word: item.word,
    faceIndex: item.faceIndex,
  });
}

function renderResultContent() {
  state.words = state.rolled.map((r) => r.word);
  state.bestPoem = generateBestPoem(state.wordMap);
  state.bestOrder = getBestOrder(state.wordMap, state.words);
  state.bestRevealed = false;

  const bestPanel = $("#best-panel");
  bestPanel.classList.remove("best-panel--open");
  $("#best-poem").textContent = "";
  $("#best-poem").classList.remove("best-poem--visible");
  $("#best-loading").hidden = true;

  const btn = document.querySelector('[data-action="best-arrange"]');
  if (btn) btn.hidden = false;

  state.diceCtrl = initDiceDrag(
    $("#result-dice-row"),
    state.rolled,
    createResultDice,
    (order, dragUsed) => {
      $("#custom-poem").textContent = composeCustomPoem(order);
      if (dragUsed) track("drag_used");
    }
  );

  track("words_revealed", { words: state.words });
}

function showBestArrangement() {
  if (!state.diceCtrl || state.bestRevealed) return;
  track("best_arrange_click");

  const loading = $("#best-loading");
  const poemEl = $("#best-poem");
  const panel = $("#best-panel");

  loading.hidden = false;
  poemEl.textContent = "";
  poemEl.classList.remove("best-poem--visible");

  setTimeout(() => {
    state.diceCtrl.setOrder(state.bestOrder);
    loading.hidden = true;
    poemEl.textContent = state.bestPoem;
    poemEl.classList.add("best-poem--visible");
    panel.classList.add("best-panel--open");
    state.bestRevealed = true;

    const btn = document.querySelector('[data-action="best-arrange"]');
    if (btn) btn.hidden = true;

    track("best_arrange_shown", { poem: state.bestPoem });
  }, BEST_ANIM_MS);
}

function startRoll() {
  if (state.isRolling) return;
  state.isRolling = true;

  track("roll_start");
  incrementRollCount();
  switchScreen("roll");

  state.rolled = rollDice();
  state.wordMap = wordsToMap(state.rolled);

  const stage = $("#roll-dice-stage");
  renderDiceStage(stage, state.rolled);
  playRollSound();

  animateRoll(stage, state.rolled, () => {
    renderResultContent();
    switchScreen("result");
    state.isRolling = false;
    track("roll_complete", { words: state.rolled.map((r) => r.word) });
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("已复制到剪贴板");
    return true;
  } catch {
    showToast("复制失败，请手动复制");
    return false;
  }
}

function goPoster() {
  if (!state.bestRevealed) {
    showToast("请先显示最佳排列");
    return;
  }
  const canvas = $("#poster-canvas");
  renderPoster(canvas, {
    words: state.words,
    bestPoem: state.bestPoem,
    siteUrl: SITE_URL,
  });
  getPosterPreviewScale(canvas, $("#poster-preview").clientWidth);
  switchScreen("share");
  track("poster_view");
}

function bindActions() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    switch (btn.dataset.action) {
      case "start-roll":
        track("start_roll_click");
        btn.classList.add("btn--pressed");
        setTimeout(() => btn.classList.remove("btn--pressed"), 150);
        startRoll();
        break;
      case "roll-again":
        track("roll_again_click");
        startRoll();
        break;
      case "best-arrange":
        showBestArrangement();
        break;
      case "save-poster":
        goPoster();
        track("save_poster_click");
        break;
      case "share-friend":
        $("#share-panel").hidden = false;
        track("share_click");
        break;
      case "back-result":
        switchScreen("result");
        break;
      case "download-poster":
        downloadPoster($("#poster-canvas"));
        showToast("图片已保存");
        track("poster_download");
        break;
      case "copy-share-text":
        copyText(getShareCopy(state.words, state.bestPoem));
        track("share_copy");
        break;
      case "close-share":
        $("#share-panel").hidden = true;
        break;
      case "share-copy-link":
        copyText(SITE_URL);
        track("share_link_copy");
        $("#share-panel").hidden = true;
        break;
      case "share-copy-text":
        copyText(getShareCopy(state.words, state.bestPoem));
        track("share_text_copy");
        $("#share-panel").hidden = true;
        break;
      default:
        break;
    }
  });
}

function init() {
  recordVisit();
  track("page_view", { screen: "home" });

  renderDiceCluster($("#home-dice-cluster"), { count: 3, size: "sm", floating: true });

  document.querySelectorAll(".screen.screen--active .reveal").forEach((el, i) => {
    setTimeout(() => el.classList.add("reveal--visible"), 80 + i * 70);
  });

  bindActions();
}

init();

})();
