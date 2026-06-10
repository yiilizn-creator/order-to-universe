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
}

export function renderPoster(canvas, { bestPoem }) {
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  const w = POSTER_W;
  const h = POSTER_H;

  ctx.fillStyle = "#FAF8F6";
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "center";
  ctx.font = "500 88px 'PingFang SC', 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#111111";
  wrapText(ctx, bestPoem, 120, h * 0.38, w - 240, 132);

  ctx.font = "400 36px 'PingFang SC', 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "#777777";
  ctx.fillText("随机六个词", w / 2, h - 200);
  ctx.fillText("组成一句话", w / 2, h - 140);

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
