import {
  rollDice,
  wordsToMap,
  renderDiceCluster,
  renderDiceStage,
  createDiceElement,
  animateRoll,
  DICE_SETS,
} from "./dice.js";
import { generatePoem, generateInterpretation, composeCustomPoem, getShareCopy } from "./poem.js";
import { initTagDrag } from "./drag.js";
import { renderPoster, downloadPoster, getPosterPreviewScale } from "./poster.js";
import { track, recordVisit, incrementRollCount } from "./analytics.js";

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
