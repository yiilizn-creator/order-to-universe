const STORAGE_KEY = "order-to-universe";
const SITE_URL = "https://yiilizn-creator.github.io/order-to-universe/";
let answersData = [];
const SPECIAL_NUMBERS = [11, 22, 33, 44, 55, 66, 77, 88, 99];
const SPECIAL_TIMES = ["01:11", "02:22", "03:33", "04:44"];
const LOADING_MESSAGES = [
  "正在接收你的信号",
  "宇宙听见了",
  "正在寻找与你同频的答案",
  "请稍候",
];
const VISIT_EASTER_EGGS = {
  3: "宇宙记得你又来了",
  7: "最近发生什么了吗？你来得比以前频繁",
  30: "很高兴你还愿意来这里",
};
const TIME_EASTER_EGGS = {
  "01:11": "深夜的信号格外清晰——宇宙在静谧中听见了你",
  "02:22": "凌晨的共振时刻——你与宇宙的频率正在对齐",
  "03:33": "三更的觉醒之门——潜意识此刻最为活跃",
  "04:44": "黎明前的守护——黑暗即将退去，答案正在靠近",
};

const sessionUsedIds = new Set();

const state = {
  inputNumber: null,
  answer: null,
  screen: "welcome",
  showReminder: false,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function track(event, data = {}) {
  const payload = { event, timestamp: Date.now(), ...data };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  document.dispatchEvent(new CustomEvent("universe:track", { detail: payload }));
}

function getVisitData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveVisitData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function recordVisit() {
  const data = getVisitData();
  const today = new Date().toISOString().slice(0, 10);
  const days = new Set(data.visitDays || []);
  days.add(today);
  data.visitDays = [...days];
  data.visitCount = (data.visitCount || 0) + 1;
  data.lastVisit = today;
  saveVisitData(data);
  return data;
}

function getVisitEasterEgg() {
  const days = getVisitData().visitDays?.length || 0;
  if (days >= 30) return VISIT_EASTER_EGGS[30];
  if (days >= 7) return VISIT_EASTER_EGGS[7];
  if (days >= 3) return VISIT_EASTER_EGGS[3];
  return null;
}

function getTimeEasterEgg() {
  const now = new Date();
  const key = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return TIME_EASTER_EGGS[key] || null;
}

function getRandomAnswer() {
  if (!answersData.length) return null;

  let available = answersData.filter((a) => !sessionUsedIds.has(a.id));
  if (!available.length) {
    sessionUsedIds.clear();
    available = answersData;
  }

  const picked = available[Math.floor(Math.random() * available.length)];
  sessionUsedIds.add(picked.id);
  return picked;
}

function setCosmosReminder(visible) {
  state.showReminder = visible;
  const welcome = $('.screen[data-screen="welcome"]');
  const hero = $("#welcome-hero");
  const reminder = $("#cosmos-reminder");

  welcome.classList.toggle("screen--reminder", visible);
  hero.hidden = visible;
  reminder.hidden = !visible;
}

function resetWelcomeHidden() {
  state.showReminder = false;
  const welcome = $('.screen[data-screen="welcome"]');
  welcome.classList.remove("screen--reminder", "screen--leaving", "screen--entering", "screen--active");
  $("#welcome-hero").hidden = false;
  $("#cosmos-reminder").hidden = true;
  welcome.querySelectorAll(".reveal").forEach((el) => el.classList.remove("reveal--visible"));
}

const PAGE_TRANSITION_MS = 900;
let isPageTransitioning = false;

function getResultId() {
  return state.answer?.id ?? 0;
}

function getDisplayNumber() {
  return state.inputNumber ?? getResultId();
}

function formatDisplayNo() {
  return String(getDisplayNumber()).padStart(2, "0");
}

function showScreen(name, { direct = false } = {}) {
  if (isPageTransitioning && state.screen === name) return;

  const current = $(`.screen[data-screen="${state.screen}"]`);
  const next = $(`.screen[data-screen="${name}"]`);
  if (!next || current === next) return;

  isPageTransitioning = true;
  const unlockMs = direct ? 500 : PAGE_TRANSITION_MS + 120;
  setTimeout(() => { isPageTransitioning = false; }, unlockMs);

  next.querySelectorAll(".reveal").forEach((el) => el.classList.remove("reveal--visible"));

  if (direct) {
    if (current) {
      current.classList.remove("screen--active", "screen--entering", "screen--leaving");
    }
    next.classList.remove("screen--leaving", "screen--active");
    next.classList.add("screen--entering");
    void next.offsetWidth;
    requestAnimationFrame(() => {
      next.classList.remove("screen--entering");
      next.classList.add("screen--active");
      animateReveals(next, 100);
    });
    state.screen = name;
    return;
  }

  if (current) {
    current.classList.remove("screen--active", "screen--entering");
    current.classList.add("screen--leaving");

    const finishLeave = () => {
      current.classList.remove("screen--leaving");
    };
    const onLeaveEnd = (e) => {
      if (e.target !== current || e.propertyName !== "opacity") return;
      current.removeEventListener("transitionend", onLeaveEnd);
      finishLeave();
    };
    current.addEventListener("transitionend", onLeaveEnd);
    setTimeout(finishLeave, PAGE_TRANSITION_MS + 100);
  }

  next.classList.remove("screen--leaving", "screen--active");
  next.classList.add("screen--entering");
  void next.offsetWidth;

  requestAnimationFrame(() => {
    next.classList.remove("screen--entering");
    next.classList.add("screen--active");
    animateReveals(next, 180);
  });

  state.screen = name;
}

function animateReveals(container, baseDelay = 0) {
  const items = container.querySelectorAll(".reveal");
  items.forEach((el) => el.classList.remove("reveal--visible"));
  items.forEach((el, i) => {
    const delay = baseDelay + Number(el.dataset.delay || 0) * 350 + i * 70;
    setTimeout(() => el.classList.add("reveal--visible"), delay);
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runLoadingAnimation(num) {
  const floating = $("#floating-number");
  const textEl = $("#loading-text");
  floating.textContent = num;

  for (const msg of LOADING_MESSAGES) {
    textEl.style.opacity = "0";
    await delay(300);
    textEl.textContent = msg;
    textEl.style.opacity = "1";
    await delay(1200);
  }

  await delay(500);
  track("loading_finish", { number: num });
}

function formatParagraphs(text) {
  if (!text) return "";
  return text.split(/\n\n+/).map((p) => p.replace(/\n/g, "")).join("\n\n");
}

function renderResult() {
  const { answer } = state;
  const resultId = getResultId();
  $("#result-oneline").textContent = answer.oneLine;
  $("#result-interpretation").textContent = formatParagraphs(answer.interpretation);
  $("#result-keywords").textContent = answer.keywords.join(" · ");
  $("#result-action").textContent = formatParagraphs(answer.action);

  const eggEl = $("#easter-egg-msg");
  const messages = [];
  const visitEgg = getVisitEasterEgg();
  const timeEgg = getTimeEasterEgg();
  if (visitEgg) messages.push(visitEgg);
  if (timeEgg) messages.push(timeEgg);
  if (answer.rare) messages.push("✦ 稀有宇宙回信");

  if (messages.length) {
    eggEl.textContent = messages.join("\n");
    eggEl.hidden = false;
  } else {
    eggEl.hidden = true;
  }

  configWeChatShare();
  track("result_view", {
    result_id: resultId,
    input_number: state.inputNumber,
    category: answer.category,
    rare: !!answer.rare,
  });
}

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function getShareUrl() {
  return SITE_URL;
}

function getPosterQrUrl() {
  return getShareUrl();
}

function getShareTitle() {
  return "向宇宙下单";
}

function getShareDesc() {
  if (!state.answer) {
    return "输入一个问题，再输入一个数字，看看宇宙会回你什么";
  }
  const no = formatDisplayNo();
  const line = state.answer.oneLine.split("\n")[0];
  return `宇宙回信 No.${no}：${line}`;
}

function configWeChatShare() {
  if (!window.wx?.updateAppMessageShareData) return false;

  const payload = {
    title: getShareTitle(),
    desc: getShareDesc(),
    link: getShareUrl(),
    imgUrl: `${getShareUrl().replace(/\/$/, "")}/assets/share-cover.png`,
    success: () => track("share_success", { result_id: getResultId(), type: "wechat_sdk" }),
  };

  wx.updateAppMessageShareData(payload);
  wx.updateTimelineShareData({
    title: getShareDesc(),
    link: getShareUrl(),
    imgUrl: payload.imgUrl,
    success: payload.success,
  });
  return true;
}

function buildShareCopy() {
  const no = formatDisplayNo();
  const keywords = state.answer.keywords.join(" · ");
  return `宇宙回信 No.${no}

「一句话真相」
${state.answer.oneLine}

✨ 今日宇宙关键词
${keywords}

输入一个问题
再输入一个数字
看看宇宙会回你什么
${getShareUrl()}`;
}

function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  el.classList.add("toast--visible");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    el.classList.remove("toast--visible");
    setTimeout(() => { el.hidden = true; }, 400);
  }, 2200);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawDivider(ctx, w, y) {
  ctx.strokeStyle = "rgba(181, 140, 255, 0.25)";
  ctx.beginPath();
  ctx.moveTo(w / 2 - 48, y);
  ctx.lineTo(w / 2 + 48, y);
  ctx.stroke();
}

function getPosterWidth() {
  return Math.min(window.innerWidth - 24, 480);
}

function measureWrapText(ctx, text, maxWidth, lineHeight) {
  let cy = 0;
  const paragraphs = text.split(/\n+/).filter(Boolean);

  for (const para of paragraphs) {
    const normalized = para.replace(/\n/g, "");
    const chunks = normalized.match(/[^，。！？；、]+[，。！？；、]?/g) || [normalized];
    let line = "";

    for (const chunk of chunks) {
      const test = line + chunk;
      if (ctx.measureText(test).width > maxWidth && line) {
        cy += lineHeight;
        line = chunk;
      } else {
        line = test;
      }
    }
    if (line) cy += lineHeight;
  }

  return cy;
}

function calcPosterHeight(ctx, w) {
  const padX = 28;
  const contentW = w - padX * 2;
  ctx.font = "400 22px 'Noto Sans SC', sans-serif";
  const truthH = measureWrapText(ctx, state.answer.oneLine, contentW, 34);
  const qrSize = Math.round(w * 0.38);
  return 44 + 36 + 28 + 22 + truthH + 36 + 22 + 28 + 40 + 3 * 26 + 20 + qrSize + 48;
}

async function drawPoster() {
  const canvas = $("#poster-canvas");
  const ctx = canvas.getContext("2d");
  const w = getPosterWidth();
  const padX = 28;
  const contentW = w - padX * 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  ctx.font = "400 22px 'Noto Sans SC', sans-serif";
  const h = calcPosterHeight(ctx, w);

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0a0e20");
  bg.addColorStop(0.5, "#060816");
  bg.addColorStop(1, "#0d1230");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < Math.floor(w / 6); i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.4 + 0.3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(181, 140, 255, ${Math.random() * 0.35 + 0.08})`;
    ctx.fill();
  }

  ctx.textAlign = "center";
  let y = 44;

  ctx.fillStyle = "#f6d17a";
  ctx.font = "500 24px 'Noto Sans SC', sans-serif";
  ctx.fillText(`宇宙回信 No.${formatDisplayNo()}`, w / 2, y);
  y += 28;
  drawDivider(ctx, w, y);
  y += 36;

  ctx.fillStyle = "rgba(181, 140, 255, 0.9)";
  ctx.font = "300 13px 'Noto Sans SC', sans-serif";
  ctx.fillText("「一句话真相」", w / 2, y);
  y += 28;

  ctx.fillStyle = "#7de2ff";
  ctx.font = "400 22px 'Noto Sans SC', sans-serif";
  const truthEndY = wrapText(ctx, state.answer.oneLine, w / 2, y, contentW, 34);
  y = truthEndY + 36;

  ctx.fillStyle = "rgba(246, 247, 251, 0.55)";
  ctx.font = "300 13px 'Noto Sans SC', sans-serif";
  ctx.fillText("✨ 今日宇宙关键词", w / 2, y);
  y += 26;

  ctx.fillStyle = "#f6d17a";
  ctx.font = "400 17px 'Noto Sans SC', sans-serif";
  ctx.fillText(state.answer.keywords.join(" · "), w / 2, y);
  y += 40;
  drawDivider(ctx, w, y);
  y += 36;

  ctx.fillStyle = "rgba(246, 247, 251, 0.75)";
  ctx.font = "300 16px 'Noto Sans SC', sans-serif";
  ["输入一个问题", "再输入一个数字", "看看宇宙会回你什么"].forEach((line) => {
    ctx.fillText(line, w / 2, y);
    y += 26;
  });

  y += 12;
  const qrSize = Math.round(w * 0.38);
  const qrX = w / 2 - qrSize / 2;

  try {
    const qrImg = await loadImage(
      `https://api.qrserver.com/v1/create-qr-code/?size=400x400&bgcolor=060816&color=f6f7fb&data=${encodeURIComponent(getPosterQrUrl())}`
    );
    ctx.fillStyle = "rgba(246, 247, 251, 0.08)";
    ctx.fillRect(qrX - 10, y - 10, qrSize + 20, qrSize + 20);
    ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);
  } catch {
    ctx.strokeStyle = "rgba(246, 247, 251, 0.25)";
    ctx.strokeRect(qrX, y, qrSize, qrSize);
    ctx.fillStyle = "rgba(246, 247, 251, 0.35)";
    ctx.font = "300 12px 'Noto Sans SC', sans-serif";
    ctx.fillText("扫码体验", w / 2, y + qrSize / 2 + 4);
  }

  ctx.fillStyle = "rgba(246, 247, 251, 0.45)";
  ctx.font = "300 11px 'Noto Sans SC', sans-serif";
  ctx.fillText("扫码体验", w / 2, y + qrSize + 24);

  ctx.fillStyle = "#b58cff";
  ctx.font = "300 12px 'Noto Sans SC', sans-serif";
  ctx.fillText("向宇宙下单", w / 2, y + qrSize + 44);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let cy = y;
  const paragraphs = text.split(/\n+/).filter(Boolean);

  for (const para of paragraphs) {
    const normalized = para.replace(/\n/g, "");
    const chunks = normalized.match(/[^，。！？；、]+[，。！？；、]?/g) || [normalized];
    let line = "";

    for (const chunk of chunks) {
      const test = line + chunk;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, cy);
        line = chunk;
        cy += lineHeight;
      } else {
        line = test;
      }
    }

    if (line) {
      ctx.fillText(line, x, cy);
      cy += lineHeight;
    }
  }

  return cy - lineHeight;
}

function openSharePanel() {
  configWeChatShare();
  $("#share-panel").hidden = false;
  document.body.style.overflow = "hidden";
  track("share_click", { result_id: getResultId(), type: "invite_panel" });
}

function closeSharePanel() {
  $("#share-panel").hidden = true;
  document.body.style.overflow = "";
}

function openWeChatGuide(type) {
  closeSharePanel();
  const text =
    type === "group"
      ? "点击右上角 ···\n选择「发送给朋友」\n再选择一个微信群聊"
      : "点击右上角 ···\n选择「发送给朋友」\n分享给微信好友";
  $("#wechat-guide-text").textContent = text;
  $("#wechat-guide").hidden = false;
  track("share_click", { result_id: getResultId(), type: type === "group" ? "wechat_group" : "wechat_friend" });
}

function closeWeChatGuide() {
  $("#wechat-guide").hidden = true;
}

function handleWeChatShare(type) {
  if (isWeChat()) {
    configWeChatShare();
    openWeChatGuide(type);
    return;
  }
  closeSharePanel();
  showToast("请在微信中打开链接后分享");
}

async function copyShareLink() {
  closeSharePanel();
  try {
    await copyText(getShareUrl());
    showToast("链接已复制");
    track("share_success", { result_id: getResultId(), type: "copy_link" });
  } catch {
    showToast("复制失败，请手动复制");
  }
}

function inviteFriend() {
  openSharePanel();
}

async function copyShareCopy() {
  try {
    await copyText(buildShareCopy());
    showToast("文案已复制");
    track("share_success", { result_id: getResultId(), type: "copy" });
  } catch {
    showToast("复制失败，请长按手动复制");
  }
}

function savePoster() {
  const canvas = $("#poster-canvas");
  const link = document.createElement("a");
  link.download = `宇宙回信-No${formatDisplayNo()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("图片已保存");
  track("poster_save", { result_id: getResultId() });
  track("share_success", { result_id: getResultId(), type: "save" });
}

function initCosmos() {
  const canvas = $("#cosmos");
  const ctx = canvas.getContext("2d");
  let w, h;
  const particles = [];

  function resize() {
    w = canvas.width = window.innerWidth * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function initParticles() {
    particles.length = 0;
    const count = Math.min(80, Math.floor(window.innerWidth / 8));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.2 + 0.3,
        dx: (Math.random() - 0.5) * 0.15,
        dy: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? "181, 140, 255" : "125, 226, 255",
      });
    }
  }

  let t = 0;
  function draw() {
    t += 0.008;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const grd = ctx.createRadialGradient(
      window.innerWidth * 0.5,
      window.innerHeight * 0.4,
      0,
      window.innerWidth * 0.5,
      window.innerHeight * 0.4,
      window.innerWidth * 0.8
    );
    grd.addColorStop(0, "rgba(181, 140, 255, 0.06)");
    grd.addColorStop(0.5, "rgba(125, 226, 255, 0.03)");
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0) p.x = window.innerWidth;
      if (p.x > window.innerWidth) p.x = 0;
      if (p.y < 0) p.y = window.innerHeight;
      if (p.y > window.innerHeight) p.y = 0;

      const alpha = 0.15 + Math.sin(t + p.phase) * 0.15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  resize();
  initParticles();
  draw();
  window.addEventListener("resize", () => {
    resize();
    initParticles();
  });
}

function handleResize() {
  if (state.screen === "poster" && state.answer) {
    drawPoster();
  }
}

function bindEvents() {
  const numberInput = $(".number-input");
  const submitBtn = $('[data-action="submit-number"]');
  const errorEl = $(".number-error");

  document.addEventListener("click", async (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    switch (action) {
      case "start":
        if (state.showReminder) {
          showScreen("meditate", { direct: true });
          resetWelcomeHidden();
        } else {
          showScreen("meditate");
        }
        break;
      case "confirm-question":
        track("question_confirm");
        showScreen("number");
        numberInput.focus();
        break;
      case "submit-number": {
        const val = parseInt(numberInput.value, 10);
        if (val < 1 || val > 99 || isNaN(val)) {
          errorEl.hidden = false;
          return;
        }
        errorEl.hidden = true;
        state.inputNumber = val;
        state.answer = getRandomAnswer();
        track("number_submit", {
          input_number: val,
          result_id: getResultId(),
          session_used_count: sessionUsedIds.size,
        });
        showScreen("loading");
        await runLoadingAnimation(val);
        renderResult();
        showScreen("result");
        break;
      }
      case "share-poster":
        track("share_click", { result_id: getResultId(), type: "poster" });
        showScreen("poster");
        await drawPoster();
        break;
      case "back-result":
        showScreen("result");
        break;
      case "invite-friend":
        inviteFriend();
        break;
      case "close-share":
        closeSharePanel();
        break;
      case "share-wechat-friend":
        handleWeChatShare("friend");
        break;
      case "share-wechat-group":
        handleWeChatShare("group");
        break;
      case "share-copy-link":
        await copyShareLink();
        break;
      case "close-wechat-guide":
        closeWeChatGuide();
        break;
      case "save-poster":
        savePoster();
        break;
      case "copy-copy":
        await copyShareCopy();
        break;
      case "retry":
        track("retry_click", { used_count: sessionUsedIds.size });
        numberInput.value = "";
        submitBtn.disabled = true;
        errorEl.hidden = true;
        setCosmosReminder(true);
        showScreen("welcome");
        break;
    }
  });

  numberInput.addEventListener("input", () => {
    const raw = numberInput.value.replace(/\D/g, "");
    numberInput.value = raw.slice(0, 2);
    const val = parseInt(raw, 10);
    const valid = val >= 1 && val <= 99;
    submitBtn.disabled = !valid;
    errorEl.hidden = true;
  });

  numberInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !submitBtn.disabled) {
      submitBtn.click();
    }
  });
}

async function init() {
  try {
    const res = await fetch("./data/answers.json");
    answersData = await res.json();
  } catch {
    console.error("无法加载宇宙回信库");
  }

  recordVisit();
  track("enter_page", { uv: 1, pv: 1 });
  initCosmos();
  bindEvents();
  window.addEventListener("resize", handleResize);
  setCosmosReminder(false);
  animateReveals($('.screen[data-screen="welcome"]'));
}

init();
