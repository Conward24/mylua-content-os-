const PLAT_COLORS = {
  'LinkedIn Co.': '#0077b5',
  'LinkedIn Mike': '#004d77',
  'Instagram': '#c13584',
  'X / Twitter': '#1da1f2',
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth, fontStr) {
  ctx.font = fontStr;
  const words = (text || '').split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width <= maxWidth) { cur = t; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawLotus(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 7; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(i * Math.PI * 2 / 7);
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.7, size * 0.28, size * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function renderGraphic(post) {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  const isLight = (post.graphicType || '') === 'stats';
  const isQuote = (post.graphicType || '') === 'quote';

  // Background
  const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  if (isLight) {
    grad.addColorStop(0, '#FAF7F2');
    grad.addColorStop(1, '#EDE5D8');
  } else if (isQuote) {
    grad.addColorStop(0, '#2C4D45');
    grad.addColorStop(1, '#5a2a14');
  } else {
    grad.addColorStop(0, '#2C4D45');
    grad.addColorStop(1, '#1a3530');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Decorative circle
  ctx.beginPath();
  ctx.arc(920, 160, 300, 0, Math.PI * 2);
  ctx.fillStyle = isLight ? 'rgba(168,109,83,0.05)' : 'rgba(223,172,122,0.05)';
  ctx.fill();

  const tc = isLight ? '#2C4D45' : '#ffffff';
  const sc = isLight ? 'rgba(44,77,69,0.6)' : 'rgba(255,255,255,0.6)';
  const ac = '#DFAC7A';

  // Header strip
  ctx.fillStyle = isLight ? 'rgba(44,77,69,0.04)' : 'rgba(255,255,255,0.04)';
  ctx.fillRect(0, 0, 1080, 86);

  // MyLÚA wordmark
  ctx.font = '600 28px Arial, sans-serif';
  ctx.fillStyle = isLight ? '#2C4D45' : 'rgba(255,255,255,0.92)';
  ctx.fillText('MyLÚA Health', 52, 54);

  // IBM badge top right
  ctx.fillStyle = isLight ? 'rgba(44,77,69,0.08)' : 'rgba(255,255,255,0.09)';
  rr(ctx, 784, 22, 248, 44, 22); ctx.fill();
  ctx.font = '500 17px Arial, sans-serif';
  ctx.fillStyle = ac;
  ctx.fillText('IBM Silver Partner', 802, 50);

  // Lotus center
  drawLotus(ctx, 540, 182, 52, isLight ? 'rgba(44,77,69,0.2)' : 'rgba(223,172,122,0.5)');

  // Eyebrow
  ctx.font = '600 20px Arial, sans-serif';
  ctx.fillStyle = ac;
  ctx.letterSpacing = '2px';
  ctx.fillText((post.contentType || 'UPDATE').toUpperCase(), 52, 302);

  // Headline
  const hFont = '700 60px Arial, sans-serif';
  const hLines = wrapText(ctx, post.graphicHeadline || post.headline || '', 970, hFont);
  ctx.font = hFont;
  let ty = 358;
  hLines.slice(0, 2).forEach((line, i) => {
    ctx.fillStyle = i === hLines.slice(0, 2).length - 1 ? ac : tc;
    ctx.fillText(line, 52, ty);
    ty += 76;
  });

  // Body
  if (post.graphicBody) {
    ctx.font = '400 28px Arial, sans-serif';
    ctx.fillStyle = sc;
    ty += 8;
    wrapText(ctx, post.graphicBody, 970, '400 28px Arial, sans-serif')
      .slice(0, 2).forEach(l => { ctx.fillText(l, 52, ty); ty += 40; });
  }
  ty += 24;

  // Stats chips
  const stats = post.stats || [];
  if (stats.length) {
    const cw = Math.min(308, (976 - 16 * (stats.length - 1)) / stats.length);
    stats.slice(0, 3).forEach((s, i) => {
      const sx = 52 + i * (cw + 16);
      ctx.fillStyle = isLight ? 'rgba(44,77,69,0.07)' : 'rgba(255,255,255,0.08)';
      rr(ctx, sx, ty, cw, 144, 14); ctx.fill();
      ctx.strokeStyle = isLight ? 'rgba(44,77,69,0.1)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1; rr(ctx, sx, ty, cw, 144, 14); ctx.stroke();
      ctx.font = '700 48px Arial, sans-serif';
      ctx.fillStyle = ac;
      const nw = ctx.measureText(s.num).width;
      ctx.fillText(s.num, sx + (cw - nw) / 2, ty + 64);
      ctx.font = '400 19px Arial, sans-serif';
      ctx.fillStyle = sc;
      wrapText(ctx, s.label, cw - 16, '400 19px Arial, sans-serif')
        .slice(0, 2).forEach((l, li) => {
          const tw = ctx.measureText(l).width;
          ctx.fillText(l, sx + (cw - tw) / 2, ty + 90 + li * 22);
        });
    });
    ty += 166;
  }

  // Quote
  if (post.quote) {
    ctx.font = 'italic 700 52px Georgia, serif';
    ctx.fillStyle = isLight ? 'rgba(44,77,69,0.1)' : 'rgba(255,255,255,0.1)';
    ctx.fillText('\u201c', 44, ty + 38);
    ctx.font = '600 34px Arial, sans-serif';
    ctx.fillStyle = tc;
    const ql = wrapText(ctx, post.quote, 940, '600 34px Arial, sans-serif');
    ty += 28;
    ql.slice(0, 3).forEach(l => { ctx.fillText(l, 78, ty); ty += 46; });
    ty += 10;
    ctx.fillStyle = ac;
    ctx.fillRect(78, ty, 34, 3); ty += 16;
    ctx.font = '400 21px Arial, sans-serif';
    ctx.fillStyle = sc;
    ctx.fillText('MyLÚA Research Pilot', 122, ty + 4);
  }

  // Footer
  ctx.fillStyle = isLight ? 'rgba(44,77,69,0.05)' : 'rgba(0,0,0,0.16)';
  ctx.fillRect(0, 984, 1080, 96);
  ctx.font = '400 20px Arial, sans-serif';
  ctx.fillStyle = sc;
  ctx.fillText('myluahealth.com', 52, 1038);
  ctx.fillStyle = ac;
  ctx.fillText('ibm.com/case-studies/mylua-health', 278, 1038);

  // Platform badge
  const plat = (post.platforms || ['LinkedIn Co.'])[0];
  ctx.fillStyle = PLAT_COLORS[plat] || '#2C4D45';
  rr(ctx, 852, 998, 192, 46, 23); ctx.fill();
  ctx.font = '600 18px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(plat, 948, 1027);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

export function drawThumb(canvas, post) {
  if (!canvas || !post?.graphicDataUrl) return;
  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = post.graphicDataUrl;
}
