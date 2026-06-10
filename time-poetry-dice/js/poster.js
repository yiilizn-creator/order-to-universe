const POSTER_W = 1080;
const POSTER_H = 1920;

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

export function renderPoster(canvas, { words, bestPoem, siteUrl }) {
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  const w = POSTER_W;
  const h = POSTER_H;

  ctx.fillStyle = "#FAFAFA";
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.55);
  glow.addColorStop(0, "rgba(217,242,255,0.5)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "center";
  ctx.font = "500 56px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#1e293b";
  ctx.fillText("时间的诗", w / 2, 200);

  ctx.font = "300 32px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(30,41,59,0.55)";
  ctx.fillText("我掷出了这组词：", w / 2, 320);

  ctx.font = "400 36px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#1e293b";
  ctx.fillText(words.join("｜"), w / 2, 400);

  ctx.font = "300 32px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(30,41,59,0.55)";
  ctx.fillText("它们最终组成：", w / 2, 520);

  ctx.font = "400 52px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#1e293b";
  wrapText(ctx, bestPoem, 120, 620, w - 240, 84);

  ctx.font = "300 34px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(30,41,59,0.45)";
  ctx.fillText("你也来试试", w / 2, h - 280);
  ctx.fillText("看看你的词语会怎么排列", w / 2, h - 220);

  ctx.font = "300 24px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(30,41,59,0.3)";
  const url = (siteUrl || window.location.href).replace(/^https?:\/\//, "");
  ctx.fillText(url, w / 2, h - 80);

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
