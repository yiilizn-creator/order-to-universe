const POSTER_W = 1080;
const POSTER_H = 1920;

function drawStarfield(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#0F172A");
  grad.addColorStop(0.45, "#1a2744");
  grad.addColorStop(1, "#0F172A");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6 + 0.2})`;
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, w * 0.6);
  glow.addColorStop(0, "rgba(255,183,213,0.18)");
  glow.addColorStop(0.5, "rgba(143,216,255,0.08)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function drawGlassCard(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  const r = 32;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = text.split("\n");
  let cy = y;
  lines.forEach((line) => {
    const chars = [...line];
    let current = "";
    chars.forEach((ch) => {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current) {
        ctx.fillText(current, x, cy);
        cy += lineHeight;
        current = ch;
      } else {
        current = test;
      }
    });
    if (current) {
      ctx.fillText(current, x, cy);
      cy += lineHeight;
    }
  });
  return cy;
}

function drawQRPlaceholder(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  const cell = size / 7;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if ((r + c) % 2 === 0) ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
    }
  }
  ctx.restore();
}

export function renderPoster(canvas, { poem, words, siteUrl }) {
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  const w = POSTER_W;
  const h = POSTER_H;

  drawStarfield(ctx, w, h);

  ctx.textAlign = "center";

  ctx.font = "500 52px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("时间的诗", w / 2, 180);

  ctx.font = "300 28px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(255,183,213,0.9)";
  ctx.fillText(words.join(" · "), w / 2, 260);

  const cardX = 80;
  const cardY = 340;
  const cardW = w - 160;
  const cardH = 720;
  drawGlassCard(ctx, cardX, cardY, cardW, cardH);

  ctx.textAlign = "left";
  ctx.font = "400 56px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  wrapText(ctx, poem, cardX + 48, cardY + 120, cardW - 96, 88);

  ctx.textAlign = "center";
  ctx.font = "300 36px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("我掷出了这一首诗", w / 2, h - 420);
  ctx.fillText("你会掷出什么？", w / 2, h - 360);

  drawQRPlaceholder(ctx, w / 2 - 80, h - 280, 160);

  ctx.font="300 24px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  const url = siteUrl || window.location.href;
  ctx.fillText(url.replace(/^https?:\/\//, ""), w / 2, h - 80);

  return canvas;
}

export function downloadPoster(canvas, filename = "时间的诗.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function getPosterPreviewScale(canvas, maxWidth) {
  const scale = Math.min(1, maxWidth / POSTER_W);
  canvas.style.width = `${POSTER_W * scale}px`;
  canvas.style.height = `${POSTER_H * scale}px`;
}
