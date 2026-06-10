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

export function generateBestPoem(wordMap) {
  const vars = varsFromMap(wordMap);
  const shuffled = [...BEST_TEMPLATES].sort(() => Math.random() - 0.5);

  for (const tpl of shuffled) {
    const poem = tpl(vars).trim();
    const len = countChars(poem);
    if (len >= 18 && len <= 36) return poem;
  }

  return `${vars.color}${vars.nature}${vars.action}${vars.object}，\n${vars.emotion}的${vars.object}终于抬起头。`;
}

export function getBestOrder(wordMap, rolledWords) {
  const v = varsFromMap(wordMap);
  const ordered = [v.color, v.nature, v.action, v.object, v.emotion, v.time].filter(Boolean);
  const unique = [...new Set(ordered)];
  const rest = rolledWords.filter((w) => !unique.includes(w));
  return [...unique, ...rest].slice(0, 6);
}

export function composeCustomPoem(words) {
  if (!words.length) return "";
  const mid = Math.ceil(words.length / 2);
  return `${words.slice(0, mid).join("")}\n${words.slice(mid).join("")}`;
}

export function getShareCopy(words, bestPoem) {
  return `时间的诗\n\n我掷出了这组词：\n${words.join("｜")}\n\n它们最终组成：\n${bestPoem.replace(/\n/g, "")}\n\n你也来试试，看看你的词语会怎么排列`;
}
