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

export function generateBestPoem(wordMap) {
  const vars = varsFromMap(wordMap);
  const shuffled = [...BEST_TEMPLATES].sort(() => Math.random() - 0.5);

  for (const tpl of shuffled) {
    const poem = tpl(vars).trim();
    const len = countChars(poem);
    if (len >= 14 && len <= 32) return poem;
  }

  return `${vars.nature}${vars.action}${vars.object}\n${vars.emotion}终于被看见`;
}

export function getBestOrder(wordMap, rolledWords) {
  const v = varsFromMap(wordMap);
  const ordered = [v.nature, v.action, v.object, v.color, v.emotion, v.time].filter(Boolean);
  const unique = [...new Set(ordered)];
  const rest = rolledWords.filter((w) => !unique.includes(w));
  return [...unique, ...rest].slice(0, 6);
}

export function getShareCopy(bestPoem) {
  return `${bestPoem.replace(/\n/g, "\n")}\n\n—— 时间的诗\n随机六个词，组成一句话`;
}
