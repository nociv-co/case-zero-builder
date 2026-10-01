/* ==========================================================================
   NOCIV OFFICIAL BUILDER CARD — shared by every Nociv build tool
   Drop this file next to a tool and call:

     NocivCard.open({
       tool: 'Case Zero',                 // which tool issued the card
       toolKey: 'case-zero',              // used for file names and art files
       buildName: 'My MIDI Synth',
       level: 'Novice',
       stats: [['Cost', '$198'], ['Skill', 'Intermediate'], ['Parts', '16'], ['Battery', 'USB']],
       deviceImage: 'data:image/png;base64,...',   // optional picture of the build
       theme: { bg1: '#1f3350', bg2: '#2d4a73', accent: '#c9bb8e', ink: '#ffffff' }
     });

   ARTWORK: put a 1012×638 PNG named  <toolKey>-card-front.png  next to the page
   (for example case-zero-card-front.png). When it exists it replaces the built-in
   background, and the text, photo and stats are drawn on top at these spots:
     photo     x 56,  y 150, 250×316
     fields    x 340, y 168 (name, level, build, member no., issued)
     device    x 700, y 300, 260×180
     stats     y 528, across the bottom
   The photo never leaves the person's device. Nothing is uploaded anywhere.
   ========================================================================== */
(function () {
  const W = 1012, H = 638;
  const keep = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  };
  const memberNo = () => {
    let n = keep.get('nociv-member-no');
    if (!n) { n = 'NCV-' + String(Math.floor(100000 + Math.random() * 900000)); keep.set('nociv-member-no', n); }
    return n;
  };
  const loadImg = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const cover = (c, img, x, y, w, h) => { const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s; c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); };
  const contain = (c, img, x, y, w, h) => { const s = Math.min(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s; c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); };
  const fit = (c, text, max, size, weight, family) => { let s = size; do { c.font = `${weight} ${s}px ${family}`; s -= 1; } while (c.measureText(text).width > max && s > 12); };
  const SANS = '"IBM Plex Sans", system-ui, sans-serif', MONO = '"IBM Plex Mono", ui-monospace, monospace';

  async function draw(canvas, o, st) {
    const c = canvas.getContext('2d'), t = Object.assign({ bg1: '#1f3350', bg2: '#2d4a73', accent: '#c9bb8e', ink: '#ffffff' }, o.theme || {});
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { } }
    const [art, photo, dev] = await Promise.all([loadImg(`${o.toolKey}-card-front.png`), loadImg(st.photo), loadImg(o.deviceImage)]);
    c.clearRect(0, 0, W, H);
    c.save(); rr(c, 0, 0, W, H, 36); c.clip();
    if (art) c.drawImage(art, 0, 0, W, H);
    else {
      const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, t.bg1); g.addColorStop(1, t.bg2); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.globalAlpha = 0.07; c.strokeStyle = t.ink; c.lineWidth = 1;
      for (let x = -H; x < W; x += 22) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + H, 0); c.stroke(); }
      c.globalAlpha = 1;
      c.fillStyle = t.accent; c.fillRect(0, 0, W, 110);
      c.fillStyle = t.bg1; c.font = `700 30px ${MONO}`; c.fillText('N O C I V', 56, 68);
      c.font = `800 40px ${SANS}`; const head = 'OFFICIAL BUILDER'; c.fillText(head, W - 56 - c.measureText(head).width, 64);
      c.font = `600 18px ${MONO}`; const sub = `${(o.tool || '').toUpperCase()} MEMBER CARD`; c.fillText(sub, W - 56 - c.measureText(sub).width, 92);
    }
    // photo
    c.save(); rr(c, 56, 150, 250, 316, 18); c.clip();
    if (photo) cover(c, photo, 56, 150, 250, 316);
    else { c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(56, 150, 250, 316); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(181, 268, 58, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(181, 430, 100, 74, 0, Math.PI, 0); c.fill(); c.font = `600 18px ${SANS}`; c.fillStyle = t.ink; c.textAlign = 'center'; c.fillText('Add your photo', 181, 190); c.textAlign = 'left'; }
    c.restore();
    c.strokeStyle = t.accent; c.lineWidth = 4; rr(c, 56, 150, 250, 316, 18); c.stroke();
    // fields
    const fields = [['NAME', st.name || 'Your name'], ['LEVEL', o.level || ''], ['BUILD', o.buildName || ''], ['MEMBER NO.', memberNo()], ['ISSUED', new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })]];
    let y = 168;
    for (const [k, v] of fields) {
      c.fillStyle = t.accent; c.font = `600 15px ${MONO}`; c.fillText(k, 340, y);
      c.fillStyle = t.ink; fit(c, v, k === 'NAME' ? 600 : 330, k === 'NAME' ? 42 : 26, 700, SANS); c.fillText(v, 340, y + (k === 'NAME' ? 44 : 30));
      y += k === 'NAME' ? 74 : 56;
    }
    // device picture
    c.save(); rr(c, 700, 300, 260, 180, 16); c.clip(); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(700, 300, 260, 180);
    if (dev) contain(c, dev, 708, 308, 244, 164); c.restore();
    c.strokeStyle = t.accent; c.lineWidth = 3; rr(c, 700, 300, 260, 180, 16); c.stroke();
    // stats
    const stats = (o.stats || []).slice(0, 4), sw = (W - 112) / Math.max(1, stats.length);
    c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, 40, 506, W - 80, 92, 16); c.fill();
    stats.forEach(([k, v], i) => { const x = 56 + i * sw; c.fillStyle = t.accent; c.font = `600 14px ${MONO}`; c.fillText(k.toUpperCase(), x + 12, 538); c.fillStyle = t.ink; fit(c, String(v), sw - 24, 28, 700, SANS); c.fillText(String(v), x + 12, 576); });
    // barcode stripes from the member number (decoration)
    const code = memberNo().replace(/\D/g, ''); let bx = 700;
    c.fillStyle = t.ink; c.globalAlpha = 0.85;
    for (let i = 0; i < 40; i++) { const w = 1 + (+code[i % code.length] + i) % 4; c.fillRect(bx, 230, w, 46); bx += w + 2; if (bx > 958) break; }
    c.globalAlpha = 1; c.font = `500 13px ${MONO}`; c.fillText(memberNo(), 700, 292);
    c.restore();
  }

  function shrinkPhoto(file) {
    return new Promise(res => {
      const r = new FileReader();
      r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(1, 600 / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = img.width * s; cv.height = img.height * s; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/jpeg', 0.85)); }; img.onerror = () => res(null); img.src = r.result; };
      r.readAsDataURL(file);
    });
  }

  function open(o) {
    const st = { name: keep.get('nociv-builder-name') || '', photo: keep.get('nociv-builder-photo') || null };
    const wrap = document.createElement('div');
    wrap.className = 'ncCard';
    wrap.innerHTML = `<div class="ncBack"></div><div class="ncPanel" role="dialog" aria-modal="true" aria-label="Your builder card">
      <button class="ncX" aria-label="Close">×</button>
      <div class="ncEyebrow">Nociv Official Builder</div><h2 class="ncH">Your member card</h2>
      <canvas class="ncCanvas" width="${W}" height="${H}"></canvas>
      <div class="ncForm">
        <label class="ncField">Your name<input class="ncName" maxlength="28" placeholder="Builder name" value=""></label>
        <label class="ncPhoto">${st.photo ? 'Change photo' : 'Add your photo'}<input type="file" accept="image/*" class="ncFile"></label>
      </div>
      <p class="ncNote">Your photo stays on this device. Nothing is uploaded.</p>
      <div class="ncRow"><button class="ncBtn ncSave">Save card</button><button class="ncBtn ghost ncPrint">Print</button></div>
    </div>`;
    document.body.appendChild(wrap);
    const cv = wrap.querySelector('canvas'), nameIn = wrap.querySelector('.ncName');
    nameIn.value = st.name;
    const redraw = () => draw(cv, o, st);
    redraw();
    requestAnimationFrame(() => wrap.classList.add('open'));
    let t; nameIn.oninput = () => { st.name = nameIn.value; keep.set('nociv-builder-name', st.name); clearTimeout(t); t = setTimeout(redraw, 120); };
    wrap.querySelector('.ncFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; st.photo = await shrinkPhoto(f); if (st.photo) keep.set('nociv-builder-photo', st.photo); wrap.querySelector('.ncPhoto').firstChild.textContent = 'Change photo'; redraw(); };
    const fname = `nociv-builder-card-${(o.buildName || o.toolKey || 'build').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    wrap.querySelector('.ncSave').onclick = () => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fname; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
    wrap.querySelector('.ncPrint').onclick = () => {
      const url = cv.toDataURL('image/png'), f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
      document.body.appendChild(f);
      f.contentDocument.write(`<!doctype html><title>Builder card</title><style>@page{margin:.5in}body{margin:0}img{width:3.375in;height:2.125in;border-radius:.12in}</style><img src="${url}" onload="setTimeout(()=>print(),50)">`);
      f.contentDocument.close();
      setTimeout(() => f.remove(), 60000);
    };
    const close = () => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 250); };
    wrap.querySelector('.ncX').onclick = close; wrap.querySelector('.ncBack').onclick = close;
  }

  /* styles live here so any Nociv tool can use the card with one file */
  const css = `.ncCard{position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;padding:16px}
  .ncBack{position:absolute;inset:0;background:rgba(15,22,32,.6);opacity:0;transition:opacity .25s}
  .ncPanel{position:relative;width:100%;max-width:560px;max-height:100%;overflow:auto;background:#f6f4ed;border-radius:18px;padding:20px;box-shadow:0 24px 60px -20px rgba(0,0,0,.6);transform:translateY(24px) scale(.96);opacity:0;transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .25s;font-family:"IBM Plex Sans",system-ui,sans-serif;color:#1f2a37}
  .ncCard.open .ncBack{opacity:1}.ncCard.open .ncPanel{transform:none;opacity:1}
  .ncX{position:absolute;right:12px;top:10px;width:36px;height:36px;border-radius:50%;border:0;background:#ece8dc;font-size:22px;cursor:pointer;color:#4a5362}
  .ncEyebrow{font:600 11px "IBM Plex Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:#4b5a2a}
  .ncH{margin:4px 0 14px;font-size:22px}
  .ncCanvas{width:100%;height:auto;border-radius:14px;box-shadow:0 14px 30px -14px rgba(31,51,80,.55);display:block;animation:ncIn .6s cubic-bezier(.2,.9,.3,1.2)}
  @keyframes ncIn{from{transform:rotate(-4deg) scale(.9);opacity:0}to{transform:none;opacity:1}}
  .ncForm{display:flex;gap:10px;align-items:flex-end;margin-top:14px;flex-wrap:wrap}
  .ncField{flex:1;min-width:180px;display:flex;flex-direction:column;gap:4px;font:600 12px "IBM Plex Sans",sans-serif;color:#4a5362}
  .ncField input{font:15px "IBM Plex Sans",sans-serif;padding:9px 11px;border:1px solid #b8b099;border-radius:8px;background:#fff;color:#1f2a37}
  .ncPhoto{position:relative;overflow:hidden;padding:10px 14px;border-radius:8px;border:1px solid #b8b099;background:#fff;font:600 14px "IBM Plex Sans",sans-serif;cursor:pointer}
  .ncPhoto input{position:absolute;inset:0;opacity:0;cursor:pointer}
  .ncNote{font-size:12px;color:#6e695b;margin:8px 0 12px}
  .ncRow{display:flex;gap:8px}
  .ncBtn{flex:1;padding:12px;border-radius:10px;border:1px solid #4b5a2a;background:#4b5a2a;color:#fff;font:700 15px "IBM Plex Sans",sans-serif;cursor:pointer}
  .ncBtn.ghost{background:transparent;color:#1f2a37;border-color:#b8b099}`;
  const tag = document.createElement('style'); tag.textContent = css; document.head.appendChild(tag);

  window.NocivCard = { open, draw, memberNo };
})();
