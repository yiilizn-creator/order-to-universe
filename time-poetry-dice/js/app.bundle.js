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
const POEM_TEMPLATES = [
  ({ nature, color, object, action, emotion }) =>
    `${nature}${action}${color}${object}，\n而${emotion}，藏进了${object === "小猫" ? "小猫" : pickAlt(object)}的眼睛里。`,
  ({ time, nature, color, emotion, action }) =>
    `在${time}的${color}里，\n${nature}${action}，\n${emotion}悄悄经过。`,
  ({ color, nature, object, emotion, time }) =>
    `${color}的${nature}落在${object}上，\n${time}的你，正在${emotion}。`,
  ({ object, nature, action, emotion, time }) =>
    `${object}记得${nature}，\n${action}在${time}，\n${emotion}从未走远。`,
  ({ nature, action, color, time, emotion }) =>
    `${nature}${action}过${color}的${time}，\n${emotion}，像光一样轻。`,
  ({ emotion, nature, object, action, color }) =>
    `把${emotion}交给${nature}，\n让它${action}向${color}的${object}。`,
  ({ time, emotion, nature, color, action }) =>
    `${time}，${emotion}与${nature}相遇，\n在${color}中${action}，\n像一句未说完的话。`,
  ({ color, object, nature, emotion, action }) =>
    `${color}${object}里，\n${nature}轻轻${action}，\n${emotion}终于有了形状。`,
];

const INTERPRET_TEMPLATES = [
  ({ emotion, nature, object }) =>
    `你抽到的是：${emotion} × ${nature} × ${object}\n有些事情不是没有结果，只是还在来的路上。`,
  ({ emotion, time, nature }) =>
    `你抽到的是：${emotion} × ${time} × ${nature}\n宇宙想告诉你，该来的温柔，会在对的时间抵达。`,
  ({ color, emotion, object }) =>
    `你抽到的是：${color} × ${emotion} × ${object}\n你正在经历的，不是失去，而是换一种方式被记住。`,
  ({ emotion, action, nature }) =>
    `你抽到的是：${emotion} × ${action} × ${nature}\n允许自己慢下来，那些${action}过的，都会成为养分。`,
  ({ time, emotion, object }) =>
    `你抽到的是：${time} × ${emotion} × ${object}\n你不需要立刻有答案，感受本身就是最好的回应。`,
  ({ nature, color, emotion }) =>
    `你抽到的是：${nature} × ${color} × ${emotion}\n你比自己想象的更柔软，也更值得被好好对待。`,
  ({ emotion, object, time }) =>
    `你抽到的是：${emotion} × ${object} × ${time}\n有些告别不是结束，而是把心意安放在更安静的地方。`,
  ({ nature, object, emotion }) =>
    `你抽到的是：${nature} × ${object} × ${emotion}\n你正在靠近真实的自己，请相信这个过程。`,
];

const ALT_OBJECTS = ["灯塔", "车站", "信件", "冰川"];

function pickAlt(obj) {
  const alts = ALT_OBJECTS.filter((o) => o !== obj);
  return alts[Math.floor(Math.random() * alts.length)];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function countChars(text) {
  return text.replace(/\s/g, "").length;
}

function formatPoem(text) {
  return text.trim();
}

function generatePoem(wordMap) {
  const vars = {
    emotion: wordMap.emotion,
    time: wordMap.time,
    nature: wordMap.nature,
    color: wordMap.color,
    object: wordMap.object,
    action: wordMap.action,
  };

  const shuffled = [...POEM_TEMPLATES].sort(() => Math.random() - 0.5);
  for (const tpl of shuffled) {
    const poem = formatPoem(tpl(vars));
    const len = countChars(poem);
    if (len >= 25 && len <= 45) return poem;
  }

  const fallback = formatPoem(
    `${vars.nature}${vars.action}${vars.color}${vars.object}，\n而${vars.emotion}，藏进了${vars.time}里。`
  );
  return fallback;
}

function generateInterpretation(wordMap) {
  const vars = {
    emotion: wordMap.emotion,
    time: wordMap.time,
    nature: wordMap.nature,
    color: wordMap.color,
    object: wordMap.object,
    action: wordMap.action,
  };

  const shuffled = [...INTERPRET_TEMPLATES].sort(() => Math.random() - 0.5);
  for (const tpl of shuffled) {
    const text = tpl(vars);
    const len = countChars(text);
    if (len >= 30 && len <= 60) return text;
  }

  return `你抽到的是：${vars.emotion} × ${vars.nature} × ${vars.object}\n宇宙想对你说，你值得被温柔地理解。`;
}

function composeCustomPoem(words, style = "line") {
  if (!words.length) return "";
  if (style === "line") {
    const mid = Math.ceil(words.length / 2);
    return `${words.slice(0, mid).join("")}\n${words.slice(mid).join("")}`;
  }
  return words.join(" ");
}

function getShareCopy(poem) {
  return `${poem.replace(/\n/g, " ")}\n\n—— 来自《时间的诗》`;
}

/* === drag.js === */
function initTagDrag(container, words, onChange) {
  let order = [...words];

  function render() {
    container.innerHTML = "";
    order.forEach((word, index) => {
      const tag = document.createElement("button");
      tag.type = "button";
      tag.className = "tag-card";
      tag.textContent = word;
      tag.draggable = true;
      tag.dataset.index = String(index);

      tag.addEventListener("dragstart", (e) => {
        tag.classList.add("tag-card--dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      });

      tag.addEventListener("dragend", () => {
        tag.classList.remove("tag-card--dragging");
      });

      tag.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        tag.classList.add("tag-card--over");
      });

      tag.addEventListener("dragleave", () => {
        tag.classList.remove("tag-card--over");
      });

      tag.addEventListener("drop", (e) => {
        e.preventDefault();
        tag.classList.remove("tag-card--over");
        const from = Number(e.dataTransfer.getData("text/plain"));
        const to = Number(tag.dataset.index);
        if (from === to) return;

        const next = [...order];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        order = next;
        render();
        onChange(order);
      });

      container.appendChild(tag);
    });
  }

  render();
  onChange(order);
  return () => order;
}

/* === poster.js === */
const POSTER_W = 1080;
const POSTER_H = 1920;

function drawStarfield(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#0F172A");
  grad.addColorStop(0.45, "#1a2744");
  grad.addColorStop(1, "#0F172A");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6 + 0.2})`;
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, w * 0.6);
  glow.addColorStop(0, "rgba(255,183,213,0.18)");
  glow.addColorStop(0.5, "rgba(143,216,255,0.08)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function drawGlassCard(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  const r = 32;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

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

function drawQRPlaceholder(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  const cell = size / 7;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if ((r + c) % 2 === 0) ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
    }
  }
  ctx.restore();
}

function renderPoster(canvas, { poem, words, siteUrl }) {
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  const w = POSTER_W;
  const h = POSTER_H;

  drawStarfield(ctx, w, h);

  ctx.textAlign = "center";

  ctx.font = "500 52px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("时间的诗", w / 2, 180);

  ctx.font = "300 28px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(255,183,213,0.9)";
  ctx.fillText(words.join(" · "), w / 2, 260);

  const cardX = 80;
  const cardY = 340;
  const cardW = w - 160;
  const cardH = 720;
  drawGlassCard(ctx, cardX, cardY, cardW, cardH);

  ctx.textAlign = "left";
  ctx.font = "400 56px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  wrapText(ctx, poem, cardX + 48, cardY + 120, cardW - 96, 88);

  ctx.textAlign = "center";
  ctx.font = "300 36px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("我掷出了这一首诗", w / 2, h - 420);
  ctx.fillText("你会掷出什么？", w / 2, h - 360);

  drawQRPlaceholder(ctx, w / 2 - 80, h - 280, 160);

  ctx.font="300 24px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  const url = siteUrl || window.location.href;
  ctx.fillText(url.replace(/^https?:\/\//, ""), w / 2, h - 80);

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
  wrap.dataset.label = set.label;

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

function renderDiceCluster(container, { size = "sm", floating = true } = {}) {
  container.innerHTML = "";
  DICE_SETS.forEach((set, i) => {
    container.appendChild(createDiceElement(set, { size, floating, delay: i * 0.35 }));
  });
}

function renderDiceStage(container, rolled = null) {
  container.innerHTML = "";
  DICE_SETS.forEach((set, i) => {
    const item = rolled?.find((r) => r.setId === set.id);
    const el = createDiceElement(set, {
      size: "lg",
      word: item?.word ?? null,
      faceIndex: item?.faceIndex ?? 0,
      delay: i * 0.1,
    });
    container.appendChild(el);
  });
}

function animateRoll(container, rolled, onComplete) {
  const cubes = container.querySelectorAll(".dice-cube");
  const wraps = container.querySelectorAll(".dice-wrap");

  wraps.forEach((wrap) => wrap.classList.add("dice-wrap--rolling"));

  cubes.forEach((cube, i) => {
    cube.classList.add("dice-cube--spin");
    cube.style.animationDelay = `${i * 0.08}s`;
  });

  setTimeout(() => {
    cubes.forEach((cube) => {
      cube.classList.remove("dice-cube--spin");
      cube.classList.add("dice-cube--bounce");
    });
  }, 1500);

  cubes.forEach((cube, i) => {
    setTimeout(() => {
      const item = rolled[i];
      cube.classList.remove("dice-cube--bounce");
      cube.classList.add("dice-cube--landed");
      cube.style.transform = getStoppedRotation(item.faceIndex);
      cube.dataset.face = String(item.faceIndex);

    }, 1800 + i * 120);
  });

  const lastStop = 1800 + (cubes.length - 1) * 120 + 400;
  setTimeout(() => {
    wraps.forEach((wrap) => wrap.classList.remove("dice-wrap--rolling"));
    onComplete?.();
  }, lastStop);
}

/* === app.js === */
const SITE_URL = window.location.href.split("?")[0];
const PAGE_TRANSITION_MS = 600;

const state = {
  screen: "home",
  rolled: [],
  wordMap: {},
  poem: "",
  customPoem: "",
  isRolling: false,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

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
  prev?.classList.add("screen--leaving");
  setTimeout(() => prev?.classList.remove("screen--leaving"), PAGE_TRANSITION_MS);

  next?.classList.add("screen--active", "screen--entering");
  setTimeout(() => next?.classList.remove("screen--entering"), PAGE_TRANSITION_MS);

  state.screen = name;
  next?.querySelectorAll(".reveal").forEach((el, i) => {
    el.classList.remove("reveal--visible");
    setTimeout(() => el.classList.add("reveal--visible"), 80 + i * 60);
  });
}

function playRollSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const times = [0, 0.12, 0.28, 0.45, 0.62, 0.78];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 800 + Math.random() * 600;
      gain.gain.setValueAtTime(0.08, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.1);
    });
  } catch {
    /* ignore */
  }
}

function vibrate() {
  if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
}

function spawnParticles() {
  const burst = $("#particle-burst");
  burst.innerHTML = "";
  for (let i = 0; i < 24; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    const angle = (Math.PI * 2 * i) / 24;
    const dist = 60 + Math.random() * 80;
    p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
    p.style.animationDelay = `${Math.random() * 0.2}s`;
    burst.appendChild(p);
  }
  burst.classList.add("particle-burst--active");
  setTimeout(() => burst.classList.remove("particle-burst--active"), 1200);
}

function renderResultDice() {
  const row = $("#result-dice-row");
  row.innerHTML = "";
  state.rolled.forEach((item) => {
    const set = DICE_SETS.find((s) => s.id === item.setId);
    const el = createDiceElement(set, {
      size: "md",
      word: item.word,
      faceIndex: item.faceIndex,
    });
    row.appendChild(el);
  });
}

function renderResultContent() {
  state.poem = generatePoem(state.wordMap);
  const interpret = generateInterpretation(state.wordMap);
  const words = state.rolled.map((r) => r.word);

  $("#ai-poem").textContent = state.poem;
  $("#interpret-text").textContent = interpret;

  initTagDrag($("#tag-list"), words, (order) => {
    state.customPoem = composeCustomPoem(order);
    $("#custom-poem").textContent = state.customPoem;
  });

  renderResultDice();
  track("poem_generated", { words });
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
  vibrate();

  animateRoll(stage, state.rolled, () => {
    spawnParticles();
    renderResultContent();
    switchScreen("result");
    state.isRolling = false;
    track("roll_complete", { words: state.rolled.map((r) => r.word) });
  });
}

function openSharePanel() {
  $("#share-panel").hidden = false;
}

function closeSharePanel() {
  $("#share-panel").hidden = true;
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
  const canvas = $("#poster-canvas");
  const words = state.rolled.map((r) => r.word);
  renderPoster(canvas, { poem: state.poem, words, siteUrl: SITE_URL });
  getPosterPreviewScale(canvas, $("#poster-preview").clientWidth);
  switchScreen("share");
  track("poster_view");
}

function initStars() {
  const canvas = $("#stars");
  const ctx = canvas.getContext("2d");
  let stars = [];
  let w = 0;
  let h = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random(),
      speed: Math.random() * 0.003 + 0.001,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach((s) => {
      s.a += s.speed;
      const alpha = 0.2 + Math.abs(Math.sin(s.a)) * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(143,216,255,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}

function bindActions() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    switch (action) {
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
      case "copy-poem":
        copyText(state.poem);
        track("poem_copy");
        break;
      case "save-poster":
        goPoster();
        track("save_poster_click");
        break;
      case "share-friend":
        openSharePanel();
        track("share_click");
        break;
      case "back-result":
        switchScreen("result");
        break;
      case "download-poster":
        downloadPoster($("#poster-canvas"));
        showToast("诗卡已保存");
        track("poster_download");
        break;
      case "copy-share-text":
        copyText(getShareCopy(state.poem));
        track("share_copy");
        break;
      case "close-share":
        closeSharePanel();
        break;
      case "share-copy-link":
        copyText(SITE_URL);
        track("share_link_copy");
        closeSharePanel();
        break;
      case "share-copy-text":
        copyText(getShareCopy(state.poem));
        track("share_text_copy");
        closeSharePanel();
        break;
      case "share-save":
        closeSharePanel();
        goPoster();
        break;
      default:
        break;
    }
  });
}

function init() {
  recordVisit();
  track("page_view", { screen: "home" });

  renderDiceCluster($("#home-dice-cluster"), { size: "sm", floating: true });

  $$(".screen.screen--active .reveal").forEach((el, i) => {
    setTimeout(() => el.classList.add("reveal--visible"), 100 + i * 80);
  });

  initStars();
  bindActions();
}

init();

})();
