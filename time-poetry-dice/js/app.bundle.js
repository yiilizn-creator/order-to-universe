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
  ({ nature, action, object, emotion }) =>
    `${nature}${action}${object}\n${emotion}终于被看见`,
  ({ color, nature, action, object, emotion }) =>
    `${color}${nature}${action}${object}\n${emotion}终于被看见`,
  ({ nature, action, object, emotion, time }) =>
    `${nature}${action}${object}\n${emotion}在${time}醒来`,
  ({ color, nature, object, action, emotion }) =>
    `${color}${nature}停在${object}\n${action}之后是${emotion}`,
  ({ nature, action, object, emotion }) =>
    `${nature}悄悄${action}\n${object}记住了${emotion}`,
  ({ color, object, nature, action, emotion }) =>
    `${color}${object}里\n${nature}${action}，${emotion}很轻`,
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
    if (len >= 14 && len <= 32) return poem;
  }

  return `${vars.nature}${vars.action}${vars.object}\n${vars.emotion}终于被看见`;
}

function getBestOrder(wordMap, rolledWords) {
  const v = varsFromMap(wordMap);
  const ordered = [v.nature, v.action, v.object, v.color, v.emotion, v.time].filter(Boolean);
  const unique = [...new Set(ordered)];
  const rest = rolledWords.filter((w) => !unique.includes(w));
  return [...unique, ...rest].slice(0, 6);
}

function getShareCopy(bestPoem) {
  return `${bestPoem.replace(/\n/g, "\n")}\n\n—— 时间的诗\n随机六个词，组成一句话`;
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
      el.classList.add("dice-tile--draggable");

      el.addEventListener("dragstart", (e) => {
        dragUsed = true;
        el.classList.add("dice-tile--dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      });

      el.addEventListener("dragend", () => {
        el.classList.remove("dice-tile--dragging");
      });

      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        el.classList.add("dice-tile--over");
      });

      el.addEventListener("dragleave", () => {
        el.classList.remove("dice-tile--over");
      });

      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("dice-tile--over");
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
}

function renderPoster(canvas, { bestPoem }) {
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  const w = POSTER_W;
  const h = POSTER_H;

  ctx.fillStyle = "#FAF8F6";
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "center";
  ctx.font = "500 48px 'PingFang SC', 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#111111";
  ctx.fillText("时间的诗", w / 2, 220);

  ctx.font = "500 72px 'PingFang SC', 'Noto Sans SC', sans-serif";
  wrapText(ctx, bestPoem, 140, h * 0.4, w - 280, 108);

  ctx.font = "400 36px 'PingFang SC', 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#777777";
  ctx.fillText("随机六个词", w / 2, h - 220);
  ctx.fillText("组成一句话", w / 2, h - 160);

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

function createDiceTile(set, options = {}) {
  const {
    size = "md",
    word = "…",
    floating = false,
    delay = 0,
    stagger = false,
  } = options;

  const tile = document.createElement("div");
  tile.className = `dice-tile dice-tile--${size}`;
  if (floating) {
    tile.classList.add("dice-tile--float");
    tile.style.animationDelay = `${delay}s`;
  }
  if (stagger) {
    tile.classList.add("dice-tile--stagger");
    tile.style.animationDelay = `${delay}ms`;
  }
  tile.dataset.setId = set.id;

  const body = document.createElement("div");
  body.className = "dice-tile__body";

  const edgeTop = document.createElement("div");
  edgeTop.className = "dice-tile__edge dice-tile__edge--top";
  edgeTop.setAttribute("aria-hidden", "true");

  const edgeLeft = document.createElement("div");
  edgeLeft.className = "dice-tile__edge dice-tile__edge--left";
  edgeLeft.setAttribute("aria-hidden", "true");

  const front = document.createElement("div");
  front.className = "dice-tile__front";
  front.textContent = word;

  body.appendChild(edgeTop);
  body.appendChild(edgeLeft);
  body.appendChild(front);
  tile.appendChild(body);
  tile.setAttribute("role", "img");
  tile.setAttribute("aria-label", `${set.label}：${word}`);
  return tile;
}

function setTileWord(tile, word) {
  const front = tile.querySelector(".dice-tile__front");
  if (front) front.textContent = word;
  tile.setAttribute("aria-label", word);
}

function renderDiceCluster(container, { count = 3, size = "md", floating = true } = {}) {
  container.innerHTML = "";
  DICE_SETS.slice(0, count).forEach((set, i) => {
    const word = set.words[i % set.words.length];
    container.appendChild(
      createDiceTile(set, { size, word, floating, delay: i * 0.45 })
    );
  });
}

function renderDiceStage(container, rolled) {
  container.innerHTML = "";
  rolled.forEach((item) => {
    const set = DICE_SETS.find((s) => s.id === item.setId);
    container.appendChild(createDiceTile(set, { size: "lg", word: "…" }));
  });
}

function animateRoll(container, rolled, onComplete) {
  const tiles = [...container.querySelectorAll(".dice-tile")];

  tiles.forEach((tile) => tile.classList.add("dice-tile--toss"));

  setTimeout(() => {
    tiles.forEach((tile) => {
      tile.querySelector(".dice-tile__body")?.classList.add("dice-tile__body--spin");
    });
  }, 200);

  const stopStart = 900;
  const stopGap = 260;

  tiles.forEach((tile, i) => {
    setTimeout(() => {
      const body = tile.querySelector(".dice-tile__body");
      body?.classList.remove("dice-tile__body--spin");
      body?.classList.add("dice-tile__body--land");
      setTileWord(tile, rolled[i].word);
      tile.classList.remove("dice-tile--toss");
    }, stopStart + i * stopGap);
  });

  setTimeout(() => {
    tiles.forEach((tile) => {
      tile.querySelector(".dice-tile__body")?.classList.remove("dice-tile__body--land");
    });
    onComplete?.();
  }, ROLL_DURATION);
}

function createResultTile(item) {
  const set = DICE_SETS.find((s) => s.id === item.setId);
  return createDiceTile(set, { size: "lg", word: item.word });
}

/* === app.js === */
const SITE_URL = window.location.href.split("?")[0];
const PAGE_TRANSITION_MS = 600;
const BEST_ANIM_MS = 1200;
const BEST_BTN_LABEL = "✨ 显示最佳排列";
const BEST_BTN_LOADING = "正在重新排列词语…";

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
    setTimeout(() => el.classList.add("reveal--visible"), 80 + i * 60);
  });
}

function resetBestPanel() {
  const panel = $("#best-panel");
  panel.classList.remove("best-panel--open");
  $("#best-poem").textContent = "";
  $("#best-poem").classList.remove("best-poem--visible");
  $("#best-loading").hidden = true;

  const btn = $("#best-arrange-btn");
  if (btn) {
    btn.hidden = false;
    btn.disabled = false;
    btn.textContent = BEST_BTN_LABEL;
  }
  state.bestRevealed = false;
}

function renderResultContent() {
  state.words = state.rolled.map((r) => r.word);
  state.bestPoem = generateBestPoem(state.wordMap);
  state.bestOrder = getBestOrder(state.wordMap, state.words);
  resetBestPanel();

  state.diceCtrl = initDiceDrag(
    $("#result-dice-row"),
    state.rolled,
    createResultTile,
    (order, dragUsed) => {
      if (dragUsed) track("drag_used");
    }
  );

  $("#result-dice-row").querySelectorAll(".dice-tile").forEach((tile, i) => {
    tile.classList.add("dice-tile--stagger");
    tile.style.animationDelay = `${i * 120}ms`;
  });

  track("words_revealed", { words: state.words });
}

function showBestArrangement() {
  if (!state.diceCtrl || state.bestRevealed) return;
  track("best_arrange_click");

  const btn = $("#best-arrange-btn");
  const loading = $("#best-loading");
  const poemEl = $("#best-poem");
  const panel = $("#best-panel");

  btn.disabled = true;
  btn.textContent = BEST_BTN_LOADING;
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
    btn.hidden = true;

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
  renderPoster(canvas, { bestPoem: state.bestPoem });
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
        copyText(getShareCopy(state.bestPoem));
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
        copyText(getShareCopy(state.bestPoem));
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

  renderDiceCluster($("#home-dice-cluster"), { count: 3, size: "md", floating: true });

  document.querySelectorAll(".screen.screen--active .reveal").forEach((el, i) => {
    setTimeout(() => el.classList.add("reveal--visible"), 100 + i * 80);
  });

  bindActions();
}

init();

})();
