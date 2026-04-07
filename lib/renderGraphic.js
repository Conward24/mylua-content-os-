// Platform canvas sizes
export const PLATFORM_SIZES = {
  'Instagram Feed':  { w: 1080, h: 1080, label: '1080×1080' },
  'LinkedIn Feed':   { w: 1200, h: 627,  label: '1200×627'  },
  'X / Twitter':     { w: 1200, h: 675,  label: '1200×675'  },
  'Instagram Story': { w: 1080, h: 1920, label: '1080×1920' },
};

export const PLATFORM_LIST = Object.keys(PLATFORM_SIZES);

export const POST_TYPES = [
  { id: 'announce', label: 'Announce',  desc: 'Photo bg, dark overlay, stats' },
  { id: 'quote',    label: 'Quote',     desc: 'Photo + gradient, pull quote' },
  { id: 'stats',    label: 'Stats',     desc: 'Light cream, photo side panel' },
  { id: 'insight',  label: 'Insight',   desc: 'Community photo, thought lead' },
  { id: 'event',    label: 'Event',     desc: 'Photo-forward, minimal text' },
];

const PLAT_COLORS = {
  'Instagram Feed':  '#c13584',
  'LinkedIn Feed':   '#0077b5',
  'X / Twitter':     '#1da1f2',
  'Instagram Story': '#c13584',
};

const PRIMARY   = '#2C4D45';
const SECONDARY = '#A86D53';
const TERTIARY  = '#DFAC7A';
const CREAM     = '#FAF7F2';

// Image cache
const _imgCache = {};
function loadImg(src) {
  if (!src) return Promise.resolve(null);
  if (_imgCache[src]) return Promise.resolve(_imgCache[src]);
  return new Promise(res => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { _imgCache[src] = img; res(img); };
    img.onerror = () => res(null);
    img.src = src;
  });
}

function knockBlack(img, threshold = 80) {
  if (!img) return null;
  const tmp = document.createElement('canvas');
  tmp.width = img.naturalWidth || img.width;
  tmp.height = img.naturalHeight || img.height;
  const ctx = tmp.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, tmp.width, tmp.height);
  for (let i = 0; i < d.data.length; i += 4) {
    const br = (d.data[i] + d.data[i+1] + d.data[i+2]) / 3;
    d.data[i+3] = br < threshold ? Math.floor((br/threshold)*255) : 255;
  }
  ctx.putImageData(d, 0, 0);
  return tmp;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function wt(ctx, text, maxW, fontStr) {
  ctx.font = fontStr;
  const words = (text||'').split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur+' '+w : w;
    if (ctx.measureText(t).width <= maxW) cur = t;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Draw photo full-bleed with cover fit
function drawPhotoBg(ctx, img, W, H, alpha = 1) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(W/iw, H/ih);
  const sw = iw*scale, sh = ih*scale;
  const sx = (W-sw)/2, sy = (H-sh)/2;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, sw, sh);
  ctx.globalAlpha = 1;
}

// Draw logo white on dark bg
function drawLogo(ctx, img, x, y, w) {
  if (!img) { ctx.font=`700 ${Math.round(w*0.18)}px Arial`; ctx.fillStyle='white'; ctx.fillText('MyLÚA Health',x,y+w*0.18); return; }
  const h = Math.round(w * (img.naturalHeight/img.naturalWidth));
  ctx.save(); ctx.filter='brightness(10)'; ctx.drawImage(img,x,y,w,h); ctx.filter='none'; ctx.restore();
}

// Draw IBM badge
function drawIBM(ctx, img, x, y, w) {
  if (!img) return;
  const knocked = knockBlack(img, 80);
  if (!knocked) return;
  const h = Math.round(w * (img.naturalHeight/img.naturalWidth));
  ctx.drawImage(knocked, x, y, w, h);
}

// Draw lotus
function drawLotus(ctx, img, cx, cy, size, alpha=1) {
  if (!img) return;
  const knocked = knockBlack(img, 70);
  if (!knocked) return;
  ctx.globalAlpha = alpha;
  ctx.drawImage(knocked, cx-size/2, cy-size/2, size, size);
  ctx.globalAlpha = 1;
}

// Platform badge bottom right
function drawPlatBadge(ctx, platform, W, H) {
  const col = PLAT_COLORS[platform] || PRIMARY;
  const label = platform.replace(' Feed','').replace(' Story','');
  ctx.font = `600 ${Math.round(H*0.018)}px Arial`;
  const tw = ctx.measureText(label).width;
  const bw = tw+48, bh = Math.round(H*0.044), bx=W-bw-Math.round(W*0.048), by=H-bh-Math.round(H*0.016);
  ctx.fillStyle = col; rr(ctx,bx,by,bw,bh,bh/2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText(label,bx+bw/2,by+bh*0.65); ctx.textAlign='left';
}

// Footer bar
function drawFooter(ctx, W, H) {
  const fh = Math.round(H*0.09);
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,H-fh,W,fh);
  const fs = Math.round(H*0.019);
  ctx.font=`400 ${fs}px Arial`; ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.fillText('myluahealth.com', Math.round(W*0.048), H-Math.round(fh*0.3));
  ctx.fillStyle=TERTIARY;
  ctx.fillText('ibm.com/case-studies/mylua-health →', Math.round(W*0.27), H-Math.round(fh*0.3));
}

// ── TEMPLATE: ANNOUNCE ───────────────────────────────
async function tAnnounce(ctx, post, W, H, photo, brand) {
  const [photoImg, logoImg, lotusImg, ibmImg] = await Promise.all([
    loadImg(photo?.url), loadImg(brand.logo), loadImg(brand.lotus), loadImg(brand.ibm)
  ]);

  // Photo bg + dark overlay
  drawPhotoBg(ctx, photoImg, W, H);
  const ov = ctx.createLinearGradient(0,0,W,H);
  ov.addColorStop(0,'rgba(44,77,69,0.80)'); ov.addColorStop(1,'rgba(20,45,40,0.92)');
  ctx.fillStyle=ov; ctx.fillRect(0,0,W,H);

  // Bottom gradient
  const bg2 = ctx.createLinearGradient(0,H*0.4,0,H);
  bg2.addColorStop(0,'rgba(20,45,40,0)'); bg2.addColorStop(1,'rgba(20,45,40,0.7)');
  ctx.fillStyle=bg2; ctx.fillRect(0,H*0.4,W,H*0.6);

  // Header
  ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(0,0,W,Math.round(H*0.085));
  drawLogo(ctx,logoImg,Math.round(W*0.045),Math.round(H*0.022),Math.round(W*0.145));
  drawIBM(ctx,ibmImg,W-Math.round(W*0.21),Math.round(H*0.022),Math.round(W*0.17));

  // Lotus
  drawLotus(ctx,lotusImg,W/2,Math.round(H*0.18),Math.round(W*0.1));

  // Eyebrow
  const fs1=Math.round(H*0.02);
  ctx.font=`600 ${fs1}px Arial`; ctx.fillStyle=TERTIARY;
  ctx.fillText((post.contentType||'UPDATE').toUpperCase(),Math.round(W*0.048),Math.round(H*0.31));

  // Headline
  const hfs=Math.round(H*0.058);
  const hlines=wt(ctx,post.graphicHeadline||post.headline||'',W*0.9,`800 ${hfs}px Arial`);
  ctx.font=`800 ${hfs}px Arial`;
  let ty=Math.round(H*0.365);
  const lx=Math.round(W*0.048);
  hlines.slice(0,2).forEach((l,i)=>{
    ctx.fillStyle=i===hlines.slice(0,2).length-1?TERTIARY:'#fff';
    ctx.fillText(l,lx,ty); ty+=Math.round(hfs*1.3);
  });

  // Body
  if(post.graphicBody){
    const bfs=Math.round(H*0.026);
    ctx.font=`400 ${bfs}px Arial`; ctx.fillStyle='rgba(255,255,255,0.7)'; ty+=8;
    wt(ctx,post.graphicBody,W*0.9,`400 ${bfs}px Arial`).slice(0,2).forEach(l=>{ctx.fillText(l,lx,ty);ty+=Math.round(bfs*1.5);});
  }
  ty+=Math.round(H*0.022);

  // Stats
  const stats=post.stats||[];
  if(stats.length&&ty<H*0.76){
    const cw=Math.min(Math.round(W*0.28),(W*0.9-(stats.length-1)*Math.round(W*0.016))/stats.length);
    const ch=Math.round(H*0.135);
    stats.slice(0,3).forEach((s,i)=>{
      const sx=lx+i*(cw+Math.round(W*0.016));
      ctx.fillStyle='rgba(255,255,255,0.1)'; rr(ctx,sx,ty,cw,ch,12); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; rr(ctx,sx,ty,cw,ch,12); ctx.stroke();
      const nfs=Math.round(H*0.046);
      ctx.font=`700 ${nfs}px Arial`; ctx.fillStyle=TERTIARY;
      const nw=ctx.measureText(s.num).width; ctx.fillText(s.num,sx+(cw-nw)/2,ty+Math.round(ch*0.47));
      const lfs=Math.round(H*0.018);
      ctx.font=`400 ${lfs}px Arial`; ctx.fillStyle='rgba(255,255,255,0.6)';
      wt(ctx,s.label,cw-16,`400 ${lfs}px Arial`).slice(0,2).forEach((l,li)=>{
        const lw=ctx.measureText(l).width; ctx.fillText(l,sx+(cw-lw)/2,ty+Math.round(ch*0.62)+li*Math.round(lfs*1.3));
      });
    });
  }

  drawFooter(ctx,W,H);
  drawPlatBadge(ctx,post.platform||'Instagram Feed',W,H);
}

// ── TEMPLATE: QUOTE ──────────────────────────────────
async function tQuote(ctx, post, W, H, photo, brand) {
  const [photoImg, logoImg, lotusImg] = await Promise.all([
    loadImg(photo?.url), loadImg(brand.logo), loadImg(brand.lotus)
  ]);

  drawPhotoBg(ctx,photoImg,W,H);
  const grad=ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,'rgba(44,77,69,0.88)');
  grad.addColorStop(0.5,'rgba(44,77,69,0.55)');
  grad.addColorStop(1,'rgba(168,109,83,0.85)');
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

  const lx=Math.round(W*0.048);
  ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(0,0,W,Math.round(H*0.085));
  drawLogo(ctx,logoImg,lx,Math.round(H*0.025),Math.round(W*0.13));

  // Pill
  const pill='Research Pilot User';
  const pfs=Math.round(H*0.022);
  ctx.font=`600 ${pfs}px Arial`;
  const pw=ctx.measureText(pill).width;
  const ph2=Math.round(pfs*1.8),px2=W-pw-80-Math.round(W*0.04);
  ctx.fillStyle=TERTIARY; rr(ctx,px2,Math.round(H*0.028),pw+48,ph2,ph2/2); ctx.fill();
  ctx.fillStyle=PRIMARY; ctx.fillText(pill,px2+24,Math.round(H*0.028)+Math.round(ph2*0.68));

  // Quote mark
  const qmfs=Math.round(H*0.22);
  ctx.font=`italic 900 ${qmfs}px Georgia`; ctx.fillStyle='rgba(255,255,255,0.1)';
  ctx.fillText('\u201c',Math.round(W*0.04),Math.round(H*0.38));

  // Quote
  const qfs=Math.round(H*0.054);
  ctx.font=`700 ${qfs}px Arial`; ctx.fillStyle='white';
  const ql=wt(ctx,post.quote||post.graphicHeadline||'',W*0.88,`700 ${qfs}px Arial`);
  let ty=Math.round(H*0.4);
  ql.slice(0,3).forEach(l=>{ctx.fillText(l,lx,ty);ty+=Math.round(qfs*1.3);});

  // Attribution
  ty+=Math.round(H*0.02);
  ctx.fillStyle=TERTIARY; ctx.fillRect(lx,ty,Math.round(W*0.033),3); ty+=Math.round(H*0.02);
  ctx.font=`400 ${Math.round(H*0.026)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.8)';
  ctx.fillText('Mother · MyLÚA Research Pilot',lx+Math.round(W*0.05),ty);

  // Lotus watermark
  drawLotus(ctx,lotusImg,W-Math.round(W*0.14),H-Math.round(H*0.14),Math.round(W*0.13),0.1);

  drawFooter(ctx,W,H);
  drawPlatBadge(ctx,post.platform||'Instagram Feed',W,H);
}

// ── TEMPLATE: STATS ──────────────────────────────────
async function tStats(ctx, post, W, H, photo, brand) {
  const [photoImg, logoImg, lotusImg] = await Promise.all([
    loadImg(photo?.url), loadImg(brand.logo), loadImg(brand.lotus)
  ]);

  ctx.fillStyle=CREAM; ctx.fillRect(0,0,W,H);

  // Right photo panel
  const px=Math.round(W*0.57);
  if(photoImg){
    ctx.save();
    ctx.beginPath(); ctx.rect(px,0,W-px,H); ctx.clip();
    drawPhotoBg(ctx,photoImg,W-px,H,1);
    ctx.restore();
    const fade=ctx.createLinearGradient(px,0,px+Math.round(W*0.16),0);
    fade.addColorStop(0,CREAM); fade.addColorStop(1,'rgba(250,247,242,0)');
    ctx.fillStyle=fade; ctx.fillRect(px-10,0,Math.round(W*0.17)+10,H);
  }

  const lx=Math.round(W*0.048), cw2=px-lx-Math.round(W*0.04);
  let ty=Math.round(H*0.052);

  // Logo
  if(logoImg){
    const lw=Math.round(W*0.148),lh=Math.round(lw*logoImg.naturalHeight/logoImg.naturalWidth);
    ctx.drawImage(logoImg,lx,ty,lw,lh);
    ctx.fillStyle='#e8e0d8'; ctx.fillRect(lx+lw+Math.round(W*0.018),ty+4,2,lh-8);
    ctx.font=`600 ${Math.round(H*0.021)}px Arial`; ctx.fillStyle=SECONDARY;
    ctx.fillText('Pilot Outcomes',lx+lw+Math.round(W*0.034),ty+lh*0.65);
    ty+=lh+Math.round(H*0.04);
  } else { ty+=Math.round(H*0.1); }

  // Heading
  const hfs2=Math.round(H*0.048);
  ctx.font=`700 ${hfs2}px Arial`; ctx.fillStyle=PRIMARY;
  ctx.fillText('Moms engage when they',lx,ty); ty+=Math.round(hfs2*1.25);
  ctx.fillStyle=SECONDARY; ctx.fillText('feel seen and supported.',lx,ty); ty+=Math.round(hfs2*1.6);

  const stats2=[
    ['64%','HRA Completion Rate','Exceeds digital health benchmarks.'],
    ['79%','Moms Share Sensitive Data','When they trust the platform.'],
    ['48%','Engaged with Wellness','During the pilot period.'],
  ];
  const nfs2=Math.round(H*0.062),tfs2=Math.round(H*0.024),dfs2=Math.round(H*0.021);
  stats2.forEach(([num,title,desc])=>{
    ctx.fillStyle='#e8e0d8'; ctx.fillRect(lx,ty,cw2,1); ty+=Math.round(H*0.016);
    ctx.font=`800 ${nfs2}px Arial`; ctx.fillStyle=PRIMARY;
    const nw2=ctx.measureText(num).width; ctx.fillText(num,lx,ty+Math.round(nfs2*0.85));
    const tx3=lx+nw2+Math.round(W*0.018);
    ctx.font=`700 ${tfs2}px Arial`; ctx.fillStyle=PRIMARY;
    ctx.fillText(title,tx3,ty+Math.round(tfs2*0.85));
    ctx.font=`400 ${dfs2}px Arial`; ctx.fillStyle='#666';
    ctx.fillText(desc,tx3,ty+Math.round(tfs2*0.85)+Math.round(dfs2*1.4));
    ty+=Math.round(nfs2*1.4);
  });

  // Footer
  const fy=H-Math.round(H*0.07);
  ctx.fillStyle='#e8e0d8'; ctx.fillRect(lx,fy,cw2,1);
  drawLotus(ctx,lotusImg,lx+16,fy+Math.round(H*0.03),Math.round(W*0.028),0.5);
  ctx.font=`400 ${Math.round(H*0.019)}px Arial`; ctx.fillStyle='#aaa';
  ctx.fillText('myluahealth.com · ibm.com/case-studies/mylua-health',lx+Math.round(W*0.05),fy+Math.round(H*0.042));

  // Platform badge (dark for light bg)
  const plat=post.platform||'LinkedIn Feed';
  ctx.fillStyle=PLAT_COLORS[plat]||PRIMARY;
  const bl=plat.replace(' Feed','').replace(' Story','');
  ctx.font=`600 ${Math.round(H*0.018)}px Arial`;
  const bw2=ctx.measureText(bl).width+48,bh2=Math.round(H*0.044);
  rr(ctx,W-bw2-Math.round(W*0.048),H-bh2-Math.round(H*0.016),bw2,bh2,bh2/2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.textAlign='center';
  ctx.fillText(bl,W-bw2/2-Math.round(W*0.048),H-Math.round(H*0.016)-Math.round(bh2*0.35));
  ctx.textAlign='left';
}

// ── TEMPLATE: EVENT ──────────────────────────────────
async function tEvent(ctx, post, W, H, photo, brand) {
  const [photoImg, logoImg] = await Promise.all([loadImg(photo?.url), loadImg(brand.logo)]);

  // Full bleed photo — EVENT template is photo-forward
  drawPhotoBg(ctx,photoImg,W,H);

  // Subtle vignette
  const vig=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.85);
  vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

  // Bottom text area
  const th=Math.round(H*0.28);
  const tg=ctx.createLinearGradient(0,H-th,0,H);
  tg.addColorStop(0,'rgba(44,77,69,0)'); tg.addColorStop(1,'rgba(44,77,69,0.92)');
  ctx.fillStyle=tg; ctx.fillRect(0,H-th,W,th);

  // Logo top left — small
  ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,0,W,Math.round(H*0.1));
  drawLogo(ctx,logoImg,Math.round(W*0.045),Math.round(H*0.025),Math.round(W*0.13));

  // Event label top right
  if(post.eventLabel){
    const efs=Math.round(H*0.022);
    ctx.font=`600 ${efs}px Arial`;
    const ew=ctx.measureText(post.eventLabel).width;
    ctx.fillStyle='rgba(223,172,122,0.2)';
    rr(ctx,W-ew-80-Math.round(W*0.04),Math.round(H*0.028),ew+40,Math.round(efs*1.8),Math.round(efs*0.9)); ctx.fill();
    ctx.strokeStyle=TERTIARY; ctx.lineWidth=1;
    rr(ctx,W-ew-80-Math.round(W*0.04),Math.round(H*0.028),ew+40,Math.round(efs*1.8),Math.round(efs*0.9)); ctx.stroke();
    ctx.fillStyle=TERTIARY; ctx.fillText(post.eventLabel,W-ew-60-Math.round(W*0.04),Math.round(H*0.028)+Math.round(efs*1.25));
  }

  // Headline bottom
  const lx2=Math.round(W*0.048);
  const hfs3=Math.round(H*0.056);
  const hl2=wt(ctx,post.graphicHeadline||post.headline||'',W*0.88,`700 ${hfs3}px Arial`);
  ctx.font=`700 ${hfs3}px Arial`;
  let ty3=H-Math.round(H*0.24);
  hl2.slice(0,2).forEach(l=>{ctx.fillStyle='white';ctx.fillText(l,lx2,ty3);ty3+=Math.round(hfs3*1.25);});

  // Subtext
  if(post.graphicBody){
    const sfs=Math.round(H*0.025);
    ctx.font=`400 ${sfs}px Arial`; ctx.fillStyle='rgba(255,255,255,0.75)'; ty3+=4;
    wt(ctx,post.graphicBody,W*0.85,`400 ${sfs}px Arial`).slice(0,1).forEach(l=>{ctx.fillText(l,lx2,ty3);});
  }

  drawFooter(ctx,W,H);
  drawPlatBadge(ctx,post.platform||'Instagram Feed',W,H);
}

// ── TEMPLATE: INSIGHT ────────────────────────────────
async function tInsight(ctx, post, W, H, photo, brand) {
  const [photoImg, logoImg, lotusImg] = await Promise.all([
    loadImg(photo?.url), loadImg(brand.logo), loadImg(brand.lotus)
  ]);

  drawPhotoBg(ctx,photoImg,W,H);
  ctx.fillStyle='rgba(44,77,69,0.78)'; ctx.fillRect(0,0,W,H);
  const bg3=ctx.createLinearGradient(0,H*0.35,0,H);
  bg3.addColorStop(0,'rgba(20,45,40,0)'); bg3.addColorStop(1,'rgba(20,45,40,0.88)');
  ctx.fillStyle=bg3; ctx.fillRect(0,H*0.35,W,H*0.65);

  ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(0,0,W,Math.round(H*0.085));
  drawLogo(ctx,logoImg,Math.round(W*0.045),Math.round(H*0.022),Math.round(W*0.13));
  drawLotus(ctx,lotusImg,W/2,Math.round(H*0.18),Math.round(W*0.095));

  const lx4=Math.round(W*0.048);
  ctx.font=`600 ${Math.round(H*0.02)}px Arial`; ctx.fillStyle=TERTIARY;
  ctx.fillText((post.contentType||'INSIGHT').toUpperCase(),lx4,Math.round(H*0.31));

  const hfs4=Math.round(H*0.056);
  const hl3=wt(ctx,post.graphicHeadline||post.headline||'',W*0.9,`800 ${hfs4}px Arial`);
  ctx.font=`800 ${hfs4}px Arial`;
  let ty4=Math.round(H*0.365);
  hl3.slice(0,2).forEach((l,i)=>{
    ctx.fillStyle=i===hl3.slice(0,2).length-1?TERTIARY:'white';
    ctx.fillText(l,lx4,ty4); ty4+=Math.round(hfs4*1.28);
  });

  if(post.graphicBody){
    ctx.font=`400 ${Math.round(H*0.026)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.7)'; ty4+=8;
    wt(ctx,post.graphicBody,W*0.9,`400 ${Math.round(H*0.026)}px Arial`).slice(0,2).forEach(l=>{ctx.fillText(l,lx4,ty4);ty4+=Math.round(H*0.038);});
  }

  if(post.quote){
    ty4+=Math.round(H*0.03);
    ctx.font=`italic 700 ${Math.round(H*0.05)}px Georgia`; ctx.fillStyle='rgba(255,255,255,0.1)';
    ctx.fillText('\u201c',lx4-8,ty4+Math.round(H*0.035));
    ctx.font=`600 ${Math.round(H*0.032)}px Arial`; ctx.fillStyle='white';
    const ql2=wt(ctx,post.quote,W*0.88,`600 ${Math.round(H*0.032)}px Arial`);
    ty4+=Math.round(H*0.028); ql2.slice(0,2).forEach(l=>{ctx.fillText(l,lx4+Math.round(W*0.03),ty4);ty4+=Math.round(H*0.044);});
    ctx.fillStyle=TERTIARY; ctx.fillRect(lx4+Math.round(W*0.03),ty4+8,Math.round(W*0.032),3);
    ctx.font=`400 ${Math.round(H*0.02)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.fillText('MyLÚA Research Pilot',lx4+Math.round(W*0.07),ty4+Math.round(H*0.022));
  }

  drawFooter(ctx,W,H);
  drawPlatBadge(ctx,post.platform||'LinkedIn Feed',W,H);
}

// ── MAIN EXPORT ──────────────────────────────────────
export async function renderGraphic(post, photo, brand) {
  if (typeof document === 'undefined') return null;
  const size = PLATFORM_SIZES[post.platform || 'Instagram Feed'];
  const W = size.w, H = size.h;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  try {
    const type = post.graphicType || 'announce';
    if      (type === 'quote')   await tQuote(ctx,post,W,H,photo,brand);
    else if (type === 'stats')   await tStats(ctx,post,W,H,photo,brand);
    else if (type === 'event')   await tEvent(ctx,post,W,H,photo,brand);
    else if (type === 'insight') await tInsight(ctx,post,W,H,photo,brand);
    else                         await tAnnounce(ctx,post,W,H,photo,brand);
  } catch(e) {
    console.error('renderGraphic error:', e);
    ctx.fillStyle=PRIMARY; ctx.fillRect(0,0,W,H);
    ctx.font=`700 ${Math.round(H*0.05)}px Arial`; ctx.fillStyle=TERTIARY;
    ctx.textAlign='center'; ctx.fillText(post.graphicHeadline||'MyLÚA Health',W/2,H/2);
    ctx.textAlign='left';
  }
  return canvas.toDataURL('image/png');
}
