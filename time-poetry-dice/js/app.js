import {
  rollDice,
  wordsToMap,
  renderDiceCluster,
  renderDiceStage,
  animateRoll,
  createDiceElement,
  DICE_SETS,
} from "./dice.js";
import { generateBestPoem, getBestOrder, composeCustomPoem, getShareCopy } from "./poem.js";
import { initDiceDrag } from "./drag.js";
import { renderPoster, downloadPoster, getPosterPreviewScale } from "./poster.js";
import { track, recordVisit, incrementRollCount } from "./analytics.js";

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

function initStars() {
  const canvas = $("#stars");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let stars = [];
  let w = 0;
  let h = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1 + 0.3,
      a: Math.random(),
      speed: Math.random() * 0.003 + 0.001,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach((s) => {
      s.a += s.speed;
      const alpha = 0.15 + Math.abs(Math.sin(s.a)) * 0.35;
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

function init() {
  recordVisit();
  track("page_view", { screen: "home" });

  renderDiceCluster($("#home-dice-cluster"), { count: 6, size: "sm", floating: true });

  document.querySelectorAll(".screen.screen--active .reveal").forEach((el, i) => {
    setTimeout(() => el.classList.add("reveal--visible"), 80 + i * 70);
  });

  initStars();
  bindActions();
}

init();
