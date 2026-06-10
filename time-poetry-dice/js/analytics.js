const STORAGE_KEY = "time-poetry-dice-analytics";

export function track(event, data = {}) {
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

export function recordVisit() {
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

export function incrementRollCount() {
  const key = "time-poetry-dice-rolls";
  try {
    const n = Number(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(n));
    return n;
  } catch {
    return 1;
  }
}
