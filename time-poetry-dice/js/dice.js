export const DICE_SETS = [
  { id: "emotion", label: "情绪", words: ["等待", "重逢", "拥抱", "遗忘", "想念", "告别"] },
  { id: "time", label: "时间", words: ["今天", "昨天", "黄昏", "深夜", "未来", "清晨"] },
  { id: "nature", label: "自然", words: ["晚风", "银河", "潮汐", "月亮", "雨水", "雪地"] },
  { id: "color", label: "颜色", words: ["蓝色", "粉色", "白色", "透明", "灰色", "金色"] },
  { id: "object", label: "事物", words: ["宇宙", "冰川", "灯塔", "小猫", "信件", "车站"] },
  { id: "action", label: "动作", words: ["流过", "经过", "停留", "闪烁", "坠落", "消失"] },
];

const ROLL_DURATION = 2500;

export function rollDice() {
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

export function wordsToMap(rolled) {
  const map = {};
  rolled.forEach((item) => {
    map[item.setId] = item.word;
  });
  return map;
}

export function createDiceTile(set, options = {}) {
  const {
    size = "md",
    word = set.words[0],
    floating = false,
    delay = 0,
    hidden = false,
  } = options;

  const wrap = document.createElement("div");
  wrap.className = `dice-tile dice-tile--${size}`;
  if (floating) {
    wrap.classList.add("dice-tile--float");
    wrap.style.animationDelay = `${delay}s`;
  }
  if (hidden) wrap.classList.add("dice-tile--pending");
  wrap.dataset.setId = set.id;

  const body = document.createElement("div");
  body.className = "dice-tile__body";

  const top = document.createElement("div");
  top.className = "dice-tile__edge dice-tile__edge--top";
  top.setAttribute("aria-hidden", "true");

  const left = document.createElement("div");
  left.className = "dice-tile__edge dice-tile__edge--left";
  left.setAttribute("aria-hidden", "true");

  const front = document.createElement("div");
  front.className = "dice-tile__front";
  front.textContent = word;

  body.appendChild(top);
  body.appendChild(left);
  body.appendChild(front);
  wrap.appendChild(body);
  wrap.setAttribute("role", "img");
  wrap.setAttribute("aria-label", `${set.label}：${word}`);
  return wrap;
}

export function setTileWord(tile, word) {
  const front = tile.querySelector(".dice-tile__front");
  if (front) front.textContent = word;
  tile.setAttribute("aria-label", word);
}

export function renderDiceCluster(container, { count = 3, size = "md", floating = true } = {}) {
  container.innerHTML = "";
  DICE_SETS.slice(0, count).forEach((set, i) => {
    const word = set.words[i % set.words.length];
    container.appendChild(createDiceTile(set, { size, word, floating, delay: i * 0.45 }));
  });
}

export function renderDiceStage(container, rolled) {
  container.innerHTML = "";
  DICE_SETS.forEach((set, i) => {
    const item = rolled.find((r) => r.setId === set.id);
    container.appendChild(
      createDiceTile(set, {
        size: "lg",
        word: "…",
        hidden: i >= 3,
      })
    );
  });
}

export function animateRoll(container, rolled, onComplete) {
  const tiles = [...container.querySelectorAll(".dice-tile")];
  const bodies = tiles.map((t) => t.querySelector(".dice-tile__body"));

  tiles.forEach((tile) => tile.classList.add("dice-tile--toss"));

  setTimeout(() => {
    bodies.forEach((body) => body?.classList.add("dice-tile__body--spin"));
  }, 200);

  setTimeout(() => {
    tiles.slice(3).forEach((tile, i) => {
      setTimeout(() => {
        tile.classList.remove("dice-tile--pending");
        tile.classList.add("dice-tile--appear");
      }, i * 100);
    });
  }, 600);

  const stopStart = 1000;
  const stopGap = 220;

  tiles.forEach((tile, i) => {
    setTimeout(() => {
      const body = tile.querySelector(".dice-tile__body");
      body?.classList.remove("dice-tile__body--spin");
      body?.classList.add("dice-tile__body--land");
      setTileWord(tile, rolled[i].word);
      tile.classList.remove("dice-tile--toss");
      tile.classList.add("dice-tile--settled");
    }, stopStart + i * stopGap);
  });

  setTimeout(() => {
    tiles.forEach((tile) => {
      tile.classList.remove("dice-tile--appear", "dice-tile--settled");
      tile.querySelector(".dice-tile__body")?.classList.remove("dice-tile__body--land");
    });
    onComplete?.();
  }, ROLL_DURATION);
}

export function renderMiniDice(container, rolled) {
  container.innerHTML = "";
  rolled.forEach((item, i) => {
    const set = DICE_SETS.find((s) => s.id === item.setId);
    const el = createDiceTile(set, { size: "xs", word: item.word });
    el.style.animationDelay = `${i * 0.08}s`;
    el.classList.add("dice-tile--mini-in");
    container.appendChild(el);
  });
}
