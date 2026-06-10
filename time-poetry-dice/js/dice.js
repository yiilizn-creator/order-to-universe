export const DICE_SETS = [
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

function createFace(word, index) {
  const face = document.createElement("div");
  face.className = "dice-face";
  face.style.transform = FACE_TRANSFORMS[index];
  face.textContent = word;
  return face;
}

export function createDiceElement(set, options = {}) {
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

export function getStoppedRotation(faceIndex) {
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

export function renderDiceCluster(container, { count = 6, size = "sm", floating = true } = {}) {
  container.innerHTML = "";
  DICE_SETS.slice(0, count).forEach((set, i) => {
    container.appendChild(createDiceElement(set, { size, floating, delay: i * 0.4 }));
  });
}

export function renderDiceStage(container, rolled) {
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

export function animateRoll(container, rolled, onComplete) {
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

export function renderMiniDice(container, rolled) {
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
