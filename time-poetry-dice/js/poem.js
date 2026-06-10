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

export function generatePoem(wordMap) {
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

export function generateInterpretation(wordMap) {
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

export function composeCustomPoem(words, style = "line") {
  if (!words.length) return "";
  if (style === "line") {
    const mid = Math.ceil(words.length / 2);
    return `${words.slice(0, mid).join("")}\n${words.slice(mid).join("")}`;
  }
  return words.join(" ");
}

export function getShareCopy(poem) {
  return `${poem.replace(/\n/g, " ")}\n\n—— 来自《时间的诗》`;
}
