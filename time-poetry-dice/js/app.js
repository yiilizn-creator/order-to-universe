import {
  rollDice,
  wordsToMap,
  renderDiceCluster,
  renderDiceStage,
  animateRoll,
  renderMiniDice,
} from "./dice.js";
import { generateBestPoem, getBestOrder, composeCustomPoem, getShareCopy } from "./poem.js";
import { initTagDrag } from "./drag.js";
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
  tagCtrl: null,
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

function showBestPoem(animate = true) {
  const poemEl = $("#best-poem");
  poemEl.textContent = state.bestPoem;
  if (animate) {
    poemEl.classList.remove("best-poem--visible");
    requestAnimationFrame(() => poemEl.classList.add("best-poem--visible"));
  } else {
    poemEl.classList.add("best-poem--visible");
  }
}

function renderResultContent() {
  state.words = state.rolled.map((r) => r.word);
  state.bestPoem = generateBestPoem(state.wordMap);
  state.bestOrder = getBestOrder(state.wordMap, state.words);

  $("#best-loading").hidden = true;
  $("#best-poem").classList.remove("best-poem--visible");
  $("#best-poem").textContent = "";

  renderMiniDice($("#result-dice-row"), state.rolled);

  setTimeout(() => showBestPoem(true), 400);

  state.tagCtrl = initTagDrag($("#tag-list"), state.words, (order, dragUsed) => {
    $("#custom-poem").textContent = composeCustomPoem(order);
    if (dragUsed) track("drag_used");
  });

  track("words_revealed", { words: state.words });
}

function showBestArrangement() {
  if (!state.tagCtrl) return;
  track("best_arrange_click");

  const loading = $("#best-loading");
  const poemEl = $("#best-poem");
  loading.hidden = false;
  poemEl.classList.remove("best-poem--visible");

  setTimeout(() => {
    state.tagCtrl.setOrder(state.bestOrder);
    loading.hidden = true;
    showBestPoem(true);
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
  const canvas = $("#poster-canvas");
  renderPoster(canvas, { bestPoem: state.bestPoem, siteUrl: SITE_URL });
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
    setTimeout(() => el.classList.add("reveal--visible"), 80 + i * 70);
  });

  bindActions();
}

init();
