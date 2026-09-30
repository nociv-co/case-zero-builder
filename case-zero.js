/* ==========================================================================
   CASE ZERO BUILDER — APP (v0.5)
   Reads everything from case-zero-data.js. No libraries, no build step.
   Flow: Idea → Circuit (workbench) → Body → Power on → Cost → Build guide → Save
   ========================================================================== */

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => '$' + (Math.round(v * 100) / 100).toFixed(2);
const money0 = v => '$' + Math.round(v);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
function download(name, text, type = 'text/plain') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); }
function copyText(text, msg) { if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => toast(msg), () => prompt('Copy this:', text)); else prompt('Copy this:', text); }
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
const art = (key, label) => `<div class="art" data-art="${esc(key)}"><img src="case-zero-art-${esc(key)}.png" alt="" onerror="this.remove()"><span class="artLabel">${esc(label)}</span></div>`;
const roleTag = r => `<span class="role role-${r}">${ROLES[r].name}</span>`;

/* ---------- icons (simple line drawings, 24x24) ---------- */
const ICONS = {
  button: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3.5" class="fill"/>',
  buttons: '<circle cx="6" cy="8" r="3"/><circle cx="12" cy="8" r="3"/><circle cx="18" cy="8" r="3"/><circle cx="6" cy="16" r="3"/><circle cx="12" cy="16" r="3"/><circle cx="18" cy="16" r="3"/>',
  knob: '<circle cx="12" cy="13" r="7"/><path d="M12 13 L12 7.5"/><path d="M4 20 L6 18 M20 20 L18 18"/>',
  encoder: '<circle cx="12" cy="12" r="7"/><path d="M12 5v3M12 16v3M5 12h3M16 12h3"/>',
  slider: '<path d="M5 12h14"/><rect x="9" y="8" width="5" height="8" rx="1.5" class="fill"/>',
  toggle: '<rect x="4" y="9" width="16" height="7" rx="3.5"/><path d="M12 12.5 L16 5"/><circle cx="16.5" cy="4.5" r="1.8" class="fill"/>',
  thumb: '<circle cx="12" cy="12" r="8"/><circle cx="13.5" cy="10.5" r="3.5" class="fill"/>',
  dpad: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  joystick: '<path d="M7 20h10"/><path d="M12 20V10"/><circle cx="12" cy="7" r="3.5" class="fill"/>',
  pad: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="12" r="3"/>',
  footswitch: '<rect x="5" y="12" width="14" height="7" rx="2"/><path d="M12 12V6"/><circle cx="12" cy="5" r="2.5" class="fill"/>',
  keyboard: '<rect x="2.5" y="7" width="19" height="11" rx="2"/><path d="M6 11h1M9 11h1M12 11h1M15 11h1M18 11h0.5M7 14.5h10"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>',
  sensor: '<path d="M4 15c2-4 4-4 6 0s4 4 6 0 3-3 4-2"/><circle cx="12" cy="7" r="2.2"/>',
  led: '<path d="M9 14V9a3 3 0 0 1 6 0v5z" class="fill"/><path d="M8 14h8M10 14v5M14 14v4M5 6l1.5 1M19 6l-1.5 1M12 2v2"/>',
  screen: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M8 20h8"/>',
  speaker: '<rect x="5" y="4" width="14" height="16" rx="2"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="7.5" r="1"/>',
  jack: '<path d="M4 12h9"/><rect x="13" y="9" width="7" height="6" rx="1"/><circle cx="4" cy="12" r="1.5" class="fill"/>',
  strip: '<rect x="2" y="9" width="20" height="6" rx="2"/><circle cx="6" cy="12" r="1.2" class="fill"/><circle cx="10" cy="12" r="1.2" class="fill"/><circle cx="14" cy="12" r="1.2" class="fill"/><circle cx="18" cy="12" r="1.2" class="fill"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3"/><rect x="5.5" y="9.5" width="7" height="5" class="fill"/>',
  usb: '<rect x="6" y="9" width="12" height="6" rx="3"/><path d="M12 15v5"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/>'
};
const icon = (k, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ICONS.chip}</svg>`;

/* ---------- lookups ---------- */
const FL = Object.fromEntries(FUNCS.map(f => [f.id, f]));
const BOARD = Object.fromEntries(BOARDS.map(b => [b.id, b]));
const TRAYMAP = {};
TRAY.forEach(g => g.items.forEach(([kind, ref, name, ic, desc]) => { TRAYMAP[kind + ':' + ref] = { kind, ref, name, icon: ic, desc, role: g.role }; }));
const trayInfo = it => TRAYMAP[it.kind + ':' + it.ref];
const STEPS = [['make', 'Idea'], ['circuit', 'Circuit'], ['body', 'Body'], ['sim', 'Power on'], ['parts', 'Cost & order'], ['proto', 'Code & test'], ['save', 'Save & print']];

/* ---------- state ---------- */
function freshState() {
  return {
    step: 'make', name: 'My build', preset: null,
    bench: [], needs: { conn: 'usb', budget: 2, extras: [] }, funcs: [], boardPick: null,
    priceMode: 'bal', variantPick: {}, have: {}, overseas: false, ordered: {}, costTab: 'parts',
    proto: { sim: true, breadboard: true, pcb: false, final: 'perf' },
    body: { size: 'M', style: 'briefcase', hinge: 'back', latch: 1, handle: true, lock: false, stay: true, feet: true, battery: 'none' },
    panels: { lid: [], base: [] }, touched: false,
    sim: { on: false, lit: {}, screen: '', log: [], vals: {} }
  };
}
let state = freshState();
let uid = 0;
const ui = { mode: null, sel: null, lastBoard: null, panel: 'base' };

/* ==========================================================================
   BENCH — the circuit people build. Everything else is derived from it.
   ========================================================================== */
const benchItem = bid => state.bench.find(i => i.bid === bid);
const benchFP = () => state.bench.filter(i => i.kind === 'fp');
const defaultPanel = ref => (state.body.style === 'briefcase' && ['oled', 'tft24', 'tft35', 'hdmi5'].includes(ref)) ? 'lid' : 'base';
const FP_FUNC = { tact12: 'buttons', tact6: 'buttons', arcade24: 'buttons', arcade30: 'buttons', cluster6: 'buttons', cluster2: 'buttons', joystick: 'buttons', dpad: 'buttons', pad: 'buttons', footsw: 'buttons', toggle: 'buttons',
  pot: 'knobs', slidepot: 'knobs', encoder: 'knobs', thumb: 'knobs', oled: 'display', tft24: 'display', tft35: 'display', hdmi5: 'video', kbd: 'hid', speaker: 'sound', led5: 'leds' };
const COMP_FUNC = { mic: 'mic', soil: 'sensors', bme280: 'sensors', strip: 'leds' };
function syncFuncs() {
  const f = new Set(state.needs.extras);
  for (const it of state.bench) {
    if (it.kind === 'fp' && FP_FUNC[it.ref]) f.add(FP_FUNC[it.ref]);
    if (it.kind === 'comp' && COMP_FUNC[it.ref]) f.add(COMP_FUNC[it.ref]);
    if (it.kind === 'heart') f.add('battery');
  }
  state.funcs = [...f];
  const heart = state.bench.find(i => i.kind === 'heart');
  state.body.battery = heart ? heart.ref : 'none';
}
function addBench(kind, ref, x, y) {
  if (kind === 'heart') state.bench = state.bench.filter(i => i.kind !== 'heart');
  const it = { bid: ++uid, kind, ref, x, y, tried: false };
  if (kind === 'fp') it.panel = defaultPanel(ref);
  state.bench.push(it);
  syncFuncs();
  return it;
}
function removeBench(bid) {
  state.bench = state.bench.filter(i => i.bid !== bid);
  for (const p of ['lid', 'base']) state.panels[p] = state.panels[p].filter(pl => pl.bid !== bid);
  syncFuncs();
}
/* Tidy layout: every part gets its own spot on a grid around the brain, sized to the screen.
   Parts people moved keep their spot unless it collides with another. */
function layoutBench(W, H) {
  const cs = 74, rs = 70, nx = Math.floor((W / 2 - 36) / cs), ny = Math.floor((H / 2 - 34) / rs), cells = [];
  for (let i = -nx; i <= nx; i++) for (let j = -ny; j <= ny; j++) { const x = i * cs, y = j * rs; if (Math.abs(x) < BR.w / 2 + 64 && Math.abs(y) < BR.h / 2 + 62) continue; cells.push([x, y]); }
  cells.sort((a, b) => (a[0] ** 2 + (a[1] * 1.15) ** 2) - (b[0] ** 2 + (b[1] * 1.15) ** 2));
  const placed = [];
  const ok = (x, y) => Math.abs(x) <= W / 2 - 30 && Math.abs(y) <= H / 2 - 28 && !(Math.abs(x) < BR.w / 2 + 44 && Math.abs(y) < BR.h / 2 + 42) && placed.every(([px, py]) => Math.abs(px - x) >= 66 || Math.abs(py - y) >= 60);
  for (const it of state.bench) {
    if (it.x != null && ok(it.x, it.y)) { placed.push([it.x, it.y]); continue; }
    const c = cells.find(([x, y]) => ok(x, y));
    if (c) { it.x = c[0]; it.y = c[1]; }
    else { it.x = it.x ?? 0; it.y = it.y ?? 0; }
    placed.push([it.x, it.y]);
  }
}
function benchFromPreset(p) {
  state.bench = [];
  const list = [];
  for (const [panel, fp, qty] of (p.panel || [])) for (let k = 0; k < qty; k++) list.push(['fp', fp, panel]);
  for (const [id, qty] of (p.inside || [])) for (let k = 0; k < qty; k++) list.push(['comp', id]);
  if (p.funcs.includes('battery')) list.push(['heart', 'lipo']);
  list.forEach(([kind, ref, panel]) => {
    const it = addBench(kind, ref, null, null);
    if (panel && state.body.style === 'briefcase') it.panel = panel;
  });
  state.needs.extras = p.funcs.filter(f => EXTRAS.some(e => e[0] === f));
  syncFuncs();
}

/* ==========================================================================
   RULES ENGINE — which brain fits
   ========================================================================== */
function scoreBoards() {
  const f = state.funcs, conn = state.needs.conn, needWifi = conn.includes('wifi'), needBt = conn.includes('bt');
  return BOARDS.map(b => {
    let s = 0; const pros = [], good = [], cons = [];
    for (const id of f) {
      if (id === 'video' && !b.linux) continue;
      const v = b.fit[id] ?? 1, w = WEIGHT[id] || 1;
      s += v * 10 * w;
      if (v >= 3) pros.push(FL[id].short); else if (v === 2) good.push(FL[id].short);
      if (v === 0) { s -= 40; cons.push(`needs an add-on for ${FL[id].short}`); }
    }
    if (f.includes('video') && !b.linux) { s -= 80; cons.push('cannot drive a big screen or run Linux'); }
    if (benchFP().some(i => i.ref === 'kbd') && !b.linux) { s -= 60; cons.push('the mini keyboard needs a Linux brain'); }
    if (needWifi && !b.wifi) { s -= 80; cons.push('no Wi-Fi'); }
    if (needBt && !b.bt) { s -= 80; cons.push('no Bluetooth'); }
    if (b.tier > state.needs.budget) { s -= (b.tier - state.needs.budget) * 25; cons.push('above your budget'); }
    s -= b.tier * 3;
    return { b, s, pros, good, cons };
  }).sort((a, c) => c.s - a.s);
}
function chosen() { const r = scoreBoards(); return r.find(x => x.b.id === state.boardPick) || r[0]; }
const board = () => chosen().b;

/* ==========================================================================
   BODY LAYOUT — panel placements, one per bench part that lives on a panel
   ========================================================================== */
const activePanels = () => state.body.style === 'briefcase' ? ['lid', 'base'] : ['base'];
const size = () => SIZES[state.body.size];
function isMagnet(x, y) { const s = size(); return (x === 0 || x === s.cols - 1) && (y === 0 || y === s.rows - 1); }
function dims(fp, rot) { const d = FP[fp]; return rot ? { w: d.h, h: d.w } : { w: d.w, h: d.h }; }
function fits(panel, fp, x, y, rot, ignoreBid) {
  const s = size(), { w, h } = dims(fp, rot);
  if (x < 0 || y < 0 || x + w > s.cols || y + h > s.rows) return 'runs off the edge of the panel';
  for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) if (isMagnet(i, j)) return 'corner squares hold the magnets';
  for (const o of state.panels[panel]) {
    if (o.bid === ignoreBid) continue;
    const od = dims(o.fp, o.rot);
    if (x < o.x + od.w && x + w > o.x && y < o.y + od.h && y + h > o.y) return `overlaps the ${FP[o.fp].name.toLowerCase()}`;
  }
  return null;
}
const placementOf = bid => { for (const p of ['lid', 'base']) { const pl = state.panels[p].find(x => x.bid === bid); if (pl) return { ...pl, panel: p }; } return null; };
function placeFirst(panel, fp, bid) {
  const s = size();
  for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) for (const rot of [0, 1])
    if (!fits(panel, fp, x, y, rot)) { state.panels[panel].push({ bid, fp, x, y, rot }); return true; }
  return false;
}
function syncPlacements() {
  if (state.body.style === 'box') benchFP().forEach(i => { i.panel = 'base'; });
  const live = new Set(benchFP().map(i => i.bid));
  for (const p of ['lid', 'base']) state.panels[p] = state.panels[p].filter(pl => live.has(pl.bid) && activePanels().includes(p) && benchItem(pl.bid).panel === p);
  const items = benchFP().filter(i => !i.tried && !placementOf(i.bid)).sort((a, b) => FP[b.ref].w * FP[b.ref].h - FP[a.ref].w * FP[a.ref].h);
  for (const it of items) { it.tried = true; placeFirst(it.panel, it.ref, it.bid); }
}
function autoArrange() {
  state.panels = { lid: [], base: [] };
  benchFP().forEach(i => { i.tried = false; if (!activePanels().includes(i.panel)) i.panel = 'base'; });
  syncPlacements();
}
function recommendSize() {
  const items = benchFP();
  for (const k of ['XS', 'S', 'M', 'L']) {
    const s = SIZES[k], usable = s.cols * s.rows - 4;
    let ok = true;
    for (const panel of activePanels()) {
      const mine = items.filter(i => (state.body.style === 'box' ? 'base' : i.panel) === panel);
      if (mine.reduce((a, i) => a + FP[i.ref].w * FP[i.ref].h, 0) > usable * 0.7) ok = false;
      const deep = Math.max(0, ...mine.map(i => FP[i.ref].depth));
      if (deep > (panel === 'lid' ? s.lidDepth : s.baseDepth) - SHELL.floor - SHELL.panel - SHELL.disc) ok = false;
    }
    if (!ok) continue;
    const keep = [state.body.size, JSON.stringify(state.panels), items.map(i => i.tried)];
    state.body.size = k; autoArrange();
    const all = items.every(i => placementOf(i.bid));
    state.body.size = keep[0]; state.panels = JSON.parse(keep[1]); items.forEach((i, n) => { i.tried = keep[2][n]; });
    if (all) return k;
  }
  return 'L';
}
function ensureLayout() {
  if (!state.preset) selectPresetSilent('scratch');
  syncFuncs();
  if (!state.touched) { state.body.size = recommendSize(); autoArrange(); }
  else syncPlacements();
}

/* ==========================================================================
   BILL OF MATERIALS
   ========================================================================== */
function variantIdx(id) {
  const c = COMP[id], vs = c.variants;
  if (state.variantPick[id] != null && vs[state.variantPick[id]]) return state.variantPick[id];
  if (vs.length === 1) return 0;
  if (state.priceMode === 'save' && state.savePick?.[id] != null) return state.savePick[id];
  if (state.priceMode === 'save') { let bi = 0, bc = Infinity; vs.forEach((v, i) => { const u = Math.min(...v.src.map(s => s[1])) + (v.needsHeaders ? COMP.headers.variants[0].src[0][1] : 0); if (u < bc) { bc = u; bi = i; } }); return bi; }
  if (state.priceMode === 'best') { const i = vs.findIndex(v => v.tier === 'best'); if (i >= 0) return i; }
  const i = vs.findIndex(v => v.tier === 'bal'); return i >= 0 ? i : 0;
}
const variant = id => COMP[id].variants[variantIdx(id)];
function options(id, qty) {
  return variant(id).src.filter(([st]) => st === 'other' || !STORES[st].overseas || state.overseas).map(([st, price, pack, q, name, url]) => {
    const S = STORES[st], packs = Math.ceil(qty / pack), base = packs * price, duty = S?.overseas ? base * CZ_CONFIG.importEstimate : 0;
    return { store: st, pack, packs, base, duty, cost: base + duty, overseas: !!S?.overseas, days: S?.days || '',
      name: st === 'other' ? name : S.name, url: st === 'other' ? url : S.url(q) };
  }).sort((a, b) => a.cost - b.cost);
}
function add(L, id, qty, why, group = 'parts') {
  if (!COMP[id] || qty <= 0) return;
  const e = L.find(x => x.id === id && x.group === group);
  if (e) { e.qty += qty; if (why && !e.why.includes(why)) e.why.push(why); }
  else L.push({ id, qty, why: why ? [why] : [], group });
}
function baseLines() {
  const L = [], b = board(), f = state.funcs, panels = activePanels();
  add(L, b.id, 1, 'the brain');
  for (const it of benchFP()) for (const [id, q] of FP[it.ref].bom) add(L, id, q, `${state.body.style === 'box' ? 'base' : it.panel} panel`);
  for (const it of state.bench.filter(i => i.kind === 'comp')) add(L, it.ref, 1, 'inside the case');
  const has = id => L.some(l => l.id === id);
  if (has('speaker')) add(L, 'amp', 1, 'drives the speaker');
  if (f.includes('dsp') && b.id !== 'daisy') add(L, 'codec', 1, 'audio in and out');
  if (b.linux) add(L, 'sdcard', 1, 'holds the operating system');
  else if (f.includes('storage')) { add(L, 'sdmod', 1, 'storage'); add(L, 'sdcard', 1, 'storage'); }
  const bat = state.body.battery;
  if (bat !== 'none') { for (const id of BATTERIES[bat].comps) add(L, id, 1, 'power'); if (bat !== 'aa4') add(L, b.linux ? 'boost' : 'charger', 1, 'charges the battery'); }
  add(L, 'hookup', 1, 'nerves');
  /* things people forget until the box shows up */
  const bt = BOARD_TOOLS[b.id] || {};
  if (bt.usb) add(L, bt.usb, 1, 'uploads your code (charge-only cables will not work)');
  if (bt.psu) add(L, bt.psu, 1, b.id === 'pi5' ? 'the Pi 5 needs 5A to run properly' : 'steady power for the Zero');
  if (bt.hdmi && benchFP().some(i => i.ref === 'hdmi5')) add(L, bt.hdmi, 1, 'connects the screen to the brain');
  if (state.bench.some(i => ['led5', 'strip', 'pad'].includes(i.ref))) add(L, 'reskit', 1, state.bench.some(i => i.ref === 'pad') ? '330Ω for lights, 1MΩ for drum pads' : '330Ω protects each light');
  if (state.proto.final === 'perf') add(L, 'perf', 1, 'final wiring');
  if (variant(b.id).needsHeaders) add(L, 'headers', 1, 'solder onto the brain');
  const np = panels.length;
  add(L, 'magnet', 4 * np, 'hold panels in place'); add(L, 'disc', 4 * np, 'glued under panel corners'); add(L, 'glue', 1, 'magnets and discs');
  if (state.body.style === 'briefcase') { add(L, 'hinge', 2, 'lid'); if (state.body.stay) add(L, 'stay', 1, 'holds the lid open'); }
  if (state.body.latch) add(L, 'latch', state.body.latch, 'keeps it closed');
  if (state.body.handle) add(L, 'handle', 1, 'carry');
  if (state.body.lock) add(L, 'lock', 1, 'security');
  if (state.body.feet) add(L, 'feet', 4, 'base');
  add(L, 'screws', 1, 'mount the parts');
  if (state.proto.breadboard) { add(L, 'breadboard', 1, 'test before you build', 'proto'); add(L, 'jumpers', 1, 'test wiring', 'proto'); if (variant(b.id).needsHeaders) add(L, 'headers', 1, 'fits the breadboard', 'proto'); }
  return L;
}
function toolLines(lines) {
  const T = [], need = (id, why) => add(T, id, 1, why, 'tools');
  if (lines.some(l => variant(l.id).solder)) { need('iron', 'soldering'); need('strip_t', 'preparing wire'); }
  need('meter', 'checking connections'); need('drivers', 'assembly');
  if (board().linux) need('sdreader', 'installs the operating system on the card');
  if (state.body.latch || state.body.handle || state.body.lock || state.body.style === 'briefcase') need('pinvise', 'pilot holes for hardware');
  if (lines.some(l => ['arcade24', 'arcade30', 'joystick'].includes(l.id))) need('crimp', 'arcade buttons');
  return T;
}

/* ---------- pins: which nerve goes where ---------- */
const PINMAPS = {
  pico:  { name: n => 'GP' + n, digital: [...Array(23).keys()], analog: [26, 27, 28],
           i2c: { SDA: 4, SCL: 5 }, spi: { SCK: 18, MOSI: 19, MISO: 16 }, i2s: { BCLK: 10, LRC: 11, DOUT: 12, DIN: 13 } },
  pi:    { name: n => 'GPIO' + n, digital: [4, 5, 6, 12, 13, 16, 17, 22, 23, 24, 25, 26, 27, 7, 8, 0, 1], analog: [],
           i2c: { SDA: 2, SCL: 3 }, spi: { SCK: 11, MOSI: 10, MISO: 9 }, i2s: { BCLK: 18, LRC: 19, DOUT: 21, DIN: 20 } },
  esp:   { name: n => 'IO' + n, digital: [15, 16, 17, 18, 21, 38, 39, 40, 41, 42, 47, 48, 14, 1, 2, 3, 10], analog: [1, 2, 3, 10],
           i2c: { SDA: 8, SCL: 9 }, spi: { SCK: 12, MOSI: 11, MISO: 13 }, i2s: { BCLK: 4, LRC: 5, DOUT: 6, DIN: 7 } },
  uno:   { name: n => typeof n === 'string' ? n : 'D' + n, digital: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
           i2c: { SDA: 'SDA', SCL: 'SCL' }, spi: { SCK: 13, MOSI: 11, MISO: 12 }, i2s: null },
  generic: { name: n => typeof n === 'string' ? n : 'D' + n, digital: [...Array(31).keys()], analog: [...Array(12).keys()].map(i => 'A' + i),
           i2c: { SDA: 'D12', SCL: 'D11' }, spi: { SCK: 'D8', MOSI: 'D10', MISO: 'D9' }, i2s: { BCLK: 'SAI', LRC: 'SAI', DOUT: 'SAI', DIN: 'SAI' } }
};
function instances() {
  const out = [], b = board(), f = state.funcs;
  for (const it of state.bench) {
    if (it.kind === 'fp') for (const [id, q] of FP[it.ref].bom) for (let k = 0; k < q; k++) out.push({ id, bid: it.bid });
    else if (it.kind === 'comp') out.push({ id: it.ref, bid: it.bid });
  }
  if (out.some(x => x.id === 'speaker')) out.push({ id: 'amp' });
  if (f.includes('dsp') && b.id !== 'daisy') out.push({ id: 'codec' });
  if (!b.linux && f.includes('storage')) out.push({ id: 'sdmod' });
  return out;
}
function pinPlan() {
  const b = board(), map = PINMAPS[b.pinFamily], N = map.name;
  const rows = [], issues = [], autos = [], used = new Set(), byBid = {};
  const inst = instances().filter(x => COMP[x.id].wire);
  const needs = t => inst.some(x => COMP[x.id].pins?.[t]);
  const bus = {};
  if (needs('i2c')) bus.i2c = map.i2c;
  if (needs('spi')) bus.spi = map.spi;
  if (needs('i2s')) { if (map.i2s) bus.i2s = map.i2s; else issues.push({ level: 'warn', msg: `${COMP[b.id].name} has no I2S audio port. Pick the ESP32-S3 or a Pico for sound.` }); }
  for (const k in bus) for (const v of Object.values(bus[k])) used.add(String(v));
  const dPool = map.digital.filter(p => !used.has(String(p)) && !map.analog.map(String).includes(String(p)));
  let aPool = map.analog.filter(p => !used.has(String(p)));
  const takeD = () => { const p = dPool.shift(); if (p === undefined) return null; used.add(String(p)); return N(p); };
  const aNeed = inst.reduce((s, x) => s + (COMP[x.id].pins?.a || 0), 0);
  let aSource = 'board', muxPins = null;
  if (aNeed > aPool.length) {
    if (aPool.length > 0) { aSource = 'mux'; autos.push({ id: 'mux16', qty: Math.ceil(aNeed / 16), why: [`${aNeed} analog parts but only ${aPool.length} analog pins`] }); muxPins = { S0: takeD(), S1: takeD(), S2: takeD(), S3: takeD(), SIG: N(aPool[0]) }; aPool = aPool.slice(1); }
    else { aSource = 'ads'; autos.push({ id: 'ads1115', qty: Math.ceil(aNeed / 4), why: ['this brain has no analog pins'] }); bus.i2c = bus.i2c || map.i2c; }
  }
  let aIdx = 0;
  const takeA = () => { const k = aIdx++; if (aSource === 'board') { const p = aPool.shift(); return p === undefined ? null : N(p); } if (aSource === 'mux') return `mux C${k}`; return `ADS${Math.floor(k / 4) + 1} A${k % 4}`; };
  const I = bus.i2c ? `SDA → ${N(bus.i2c.SDA)}, SCL → ${N(bus.i2c.SCL)}` : '';
  const S = bus.spi ? `SCK → ${N(bus.spi.SCK)}, MOSI → ${N(bus.spi.MOSI)}, MISO → ${N(bus.spi.MISO)}` : '';
  const S2 = bus.i2s ? `BCLK → ${N(bus.i2s.BCLK)}, LRC → ${N(bus.i2s.LRC)}` : '';
  const vcc = b.logic === 5 ? '5V' : '3V3';
  let dFail = false;
  const count = {};
  for (const x of inst) {
    const c = COMP[x.id]; count[x.id] = (count[x.id] || 0) + 1;
    const total = inst.filter(y => y.id === x.id).length, label = c.name + (total > 1 ? ` ${count[x.id]}` : '');
    const P = []; const d = () => { const v = takeD(); if (v === null) dFail = true; P.push(v ?? '—'); return v ?? 'no pin left'; };
    const a = () => { const v = takeA(); if (v === null) dFail = true; P.push(v ?? '—'); return v ?? 'no pin left'; };
    let signal = '', how = '';
    switch (c.wire) {
      case 'button': { const p = d(); signal = 'digital in'; how = `One leg → ${p}, other leg → GND. Turn on the pin's internal pull-up.`; break; }
      case 'joystick': { const p = [d(), d(), d(), d()]; signal = 'digital in ×4'; how = `Up → ${p[0]}, Down → ${p[1]}, Left → ${p[2]}, Right → ${p[3]}. Common → GND.`; break; }
      case 'thumb': { const ax = a(), ay = a(), sw = d(); signal = 'analog ×2 + digital'; how = `VRx → ${ax}, VRy → ${ay}, SW → ${sw}, +5V → ${vcc}, GND → GND.`; break; }
      case 'pot': { const p = a(); signal = 'analog in'; how = `Outer legs → ${vcc} and GND. Middle leg → ${p}.`; break; }
      case 'analog3': { const p = a(); signal = 'analog in'; how = `AOUT → ${p}, VCC → ${vcc}, GND → GND.`; break; }
      case 'piezo': { const p = a(); signal = 'analog in'; how = `Red → ${p}, black → GND. Add a 1MΩ resistor across the two wires.`; break; }
      case 'encoder': { const p = [d(), d(), d()]; signal = 'digital in ×3'; how = `A → ${p[0]}, B → ${p[1]}, switch → ${p[2]}. Middle pin and switch common → GND.`; break; }
      case 'led': { const p = d(); signal = 'digital out'; how = `${p} → 330Ω resistor → long leg. Short leg → GND.`; break; }
      case 'strip': { const p = d(); signal = 'digital out (data)'; how = `DIN → ${p} through a 330Ω resistor. 5V and GND to the power supply, not the brain.`; break; }
      case 'i2c': P.push('I2C'); signal = 'I2C bus (shared)'; how = `${I}, VCC → ${vcc}, GND → GND.`; break;
      case 'spi': { const cs = d(); const extra = c.pins?.d ? `, DC → ${d()}, RST → ${d()}` : ''; P.unshift('SPI'); signal = 'SPI bus'; how = `${S}, CS → ${cs}${extra}, VCC → 3V3, GND → GND.`; break; }
      case 'i2samp': P.push('I2S'); signal = 'I2S audio out'; how = bus.i2s ? `${S2}, DIN → ${N(bus.i2s.DOUT)}, VIN → 5V, GND → GND. Speaker to + and −.` : 'Needs an I2S port.'; break;
      case 'i2smic': P.push('I2S'); signal = 'I2S audio in'; how = bus.i2s ? `SCK → ${N(bus.i2s.BCLK)}, WS → ${N(bus.i2s.LRC)}, SD → ${N(bus.i2s.DIN)}, L/R → GND, VDD → 3V3.` : 'Needs an I2S port.'; break;
      case 'i2s': P.push('I2S'); signal = 'I2S + I2C'; how = bus.i2s ? `${S2}, DAC → ${N(bus.i2s.DOUT)}, ADC → ${N(bus.i2s.DIN)}. ${I}.` : 'Needs an I2S port.'; break;
      case 'speaker': P.push('amp'); signal = 'from the amp'; how = 'Two wires to the amp’s + and − speaker terminals.'; break;
      case 'jack': P.push('audio'); signal = 'audio'; how = b.id === 'daisy' ? 'Tip → Daisy audio in/out, sleeve → AGND.' : 'Tip → codec in/out, sleeve → GND.'; break;
      case 'usb': P.push('USB'); signal = 'USB'; how = 'Plugs into a USB port on the brain.'; break;
      case 'hdmi': P.push('HDMI'); signal = 'HDMI + USB'; how = 'HDMI cable to the brain. USB for power and touch.'; break;
      case 'usbpanel': P.push('power'); signal = 'power in'; how = 'Panel-mount USB-C extension to the brain or charger input.'; break;
      default: continue;
    }
    rows.push({ id: x.id, bid: x.bid, label, role: c.role, signal, how, pins: P });
    if (x.bid) (byBid[x.bid] = byBid[x.bid] || []).push(...P, '|' + how);
  }
  if (muxPins) rows.unshift({ id: 'mux16', label: 'Analog mux', role: 'nerves', signal: 'shares one analog pin', how: `S0 → ${muxPins.S0}, S1 → ${muxPins.S1}, S2 → ${muxPins.S2}, S3 → ${muxPins.S3}, SIG → ${muxPins.SIG}, VCC → ${vcc}, GND → GND.`, pins: [] });
  if (aSource === 'ads') rows.unshift({ id: 'ads1115', label: 'ADS1115', role: 'nerves', signal: 'I2C bus (shared)', how: `${N(map.i2c.SDA)}/${N(map.i2c.SCL)} for SDA/SCL. Give each board its own address with the ADDR pin.`, pins: [] });
  if (dFail) issues.push({ level: 'err', msg: `The ${COMP[b.id].name} is out of pins. Remove some parts or pick a bigger brain.` });
  const dUsed = map.digital.length - dPool.length;
  return { rows, issues, autos, byBid, bus: Object.keys(bus), dUsed, dMax: b.gpio, aNeed, aMax: b.adc, aSource, vcc };
}
function bom() {
  const L = baseLines(), plan = pinPlan();
  for (const a of plan.autos) add(L, a.id, a.qty, a.why[0]);
  const T = toolLines(L);
  return { lines: [...L, ...T], plan };
}

/* ---------- prices ---------- */
function priceBom(lines) {
  const buy = lines.filter(l => !state.have[l.id]);
  for (const l of lines) l.opts = options(l.id, l.qty);
  const prefs = ['cheapest', ...Object.keys(STORES).filter(k => state.overseas || !STORES[k].overseas)];
  const plans = prefs.map(pref => {
    let sum = 0; const stores = new Set();
    const picks = buy.map(l => { let pick = pref === 'cheapest' ? null : l.opts.find(o => o.store === pref); if (!pick) pick = l.opts[0]; sum += pick.cost; stores.add(pick.store === 'other' ? 'other:' + pick.name : pick.store); return pick; });
    let ship = 0; stores.forEach(k => { ship += CZ_CONFIG.shipping[k] ?? CZ_CONFIG.shipping.other; });
    return { picks, sum, ship, total: sum + ship };
  });
  const best = plans.reduce((a, b) => b.total < a.total ? b : a);
  buy.forEach((l, i) => { l.pick = best.picks[i]; });
  lines.filter(l => state.have[l.id]).forEach(l => { l.pick = l.opts[0]; });
  const by = g => lines.filter(l => l.group === g);
  const sum = arr => arr.reduce((a, l) => a + (state.have[l.id] ? 0 : l.pick.cost), 0);
  const fil = filamentEstimate();
  const storeCounts = {}; buy.forEach(l => { storeCounts[l.pick.name] = (storeCounts[l.pick.name] || 0) + 1; });
  const duty = buy.filter(l => l.group !== 'tools').reduce((a, l) => a + (l.pick.duty || 0), 0);
  const parts = sum(by('parts')), proto = sum(by('proto')), tools = sum(by('tools'));
  const pcb = state.proto.pcb ? CZ_CONFIG.pcbEstimate : 0;
  const byRole = {};
  by('parts').forEach(l => { if (!state.have[l.id]) byRole[COMP[l.id].role] = (byRole[COMP[l.id].role] || 0) + l.pick.cost; });
  byRole.skeleton = (byRole.skeleton || 0) + fil.cost;
  return { parts, proto, tools, pcb, ship: best.ship, fil, storeCounts, byRole, duty, total: parts + proto + pcb + fil.cost + best.ship };
}
function optimizeSave() {
  state.savePick = {};
  if (state.priceMode !== 'save') return;
  const ids = [...new Set(bom().lines.map(l => l.id))].filter(id => COMP[id].variants.length > 1 && state.variantPick[id] == null);
  for (let pass = 0; pass < 2; pass++) for (const id of ids) {
    let best = null, bestT = Infinity;
    COMP[id].variants.forEach((_, i) => { state.savePick[id] = i; const t = priceBom(bom().lines).total; if (t < bestT - 1e-9) { bestT = t; best = i; } });
    state.savePick[id] = best;
  }
}
function quickCost() { const { lines } = bom(); return priceBom(lines).total; }

/* ---------- skill + time ---------- */
function skillFor(lines, b) {
  const reasons = []; let s = 0;
  if (lines.some(l => l.group === 'parts' && variant(l.id).solder)) { s += 1; reasons.push('Some parts need soldering'); } else reasons.push('No soldering needed');
  if (b.linux) { s += 0.5; reasons.push('You will set up Linux on an SD card'); }
  if (state.funcs.includes('dsp')) { s += 1; reasons.push('Audio effects need signal-processing code'); }
  if (state.body.battery !== 'none') { s += 0.5; reasons.push('Battery wiring and charging'); }
  if (state.proto.pcb) { s += 1; reasons.push('Designing a circuit board'); }
  const n = lines.filter(l => l.group === 'parts' && ['senses', 'limbs'].includes(COMP[l.id].role)).reduce((a, l) => a + l.qty, 0);
  if (n > 14) { s += 0.5; reasons.push(`${n} inputs and outputs to wire`); }
  return { level: s < 1 ? 'Beginner' : s < 2 ? 'Intermediate' : 'Advanced', dots: s < 1 ? 1 : s < 2 ? 2 : 3, reasons };
}
function timeFor(lines, fil) {
  const mins = lines.filter(l => l.group !== 'tools').reduce((a, l) => a + (COMP[l.id].min || 0) * (COMP[l.id].role === 'skeleton' ? 1 : l.qty), 0);
  return { build: Math.max(1, Math.round(mins / 30) / 2), print: fil.hours };
}

/* ==========================================================================
   GEOMETRY — watertight meshes from 2.5D height maps
   A shape is a list of regions (polygon + top height). Later regions win.
   ========================================================================== */
const area = p => { let s = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; s += x1 * y2 - x2 * y1; } return s / 2; };
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
function cutsFor(fp, rot) {
  const d = FP[fp], H = d.h * CELL;
  return d.cut.map(c => { if (!rot) return c; const nx = H - c.y, ny = c.x; return c.t === 'r' ? { ...c, x: nx, y: ny, w: c.h, h: c.w } : { ...c, x: nx, y: ny }; });
}
function shapePoly(c) {
  if (c.t === 'r') return rect(c.x - c.w / 2, c.y - c.h / 2, c.x + c.w / 2, c.y + c.h / 2);
  if (c.t === 'c') { const n = 40, r = c.d / 2, p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; p.push([c.x + r * Math.cos(a), c.y + r * Math.sin(a)]); } return p; }
  const s = c.s / 2, a = c.a / 2, x = c.x, y = c.y;
  return [[x - a, y - s], [x + a, y - s], [x + a, y - a], [x + s, y - a], [x + s, y + a], [x + a, y + a], [x + a, y + s], [x - a, y + s], [x - a, y + a], [x - s, y + a], [x - s, y - a], [x - a, y - a]];
}
function heightMesh(regions) {
  const R4 = v => Math.round(v * 1e4) / 1e4;
  let rings = regions.map(r => { const p = r.ring.map(([x, y]) => [R4(x), R4(y)]); return p.filter((q, i) => { const n = p[(i + 1) % p.length]; return q[0] !== n[0] || q[1] !== n[1]; }); });
  /* split edges wherever two rings cross, so edges only ever meet at shared vertices */
  const segs = [];
  rings.forEach((r, ri) => r.forEach((a, i) => segs.push({ ri, a, b: r[(i + 1) % r.length], ins: [] })));
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const s1 = segs[i], s2 = segs[j]; if (s1.ri === s2.ri) continue;
    const [x1, y1] = s1.a, [x2, y2] = s1.b, [x3, y3] = s2.a, [x4, y4] = s2.b;
    if (Math.max(x1, x2) < Math.min(x3, x4) || Math.max(x3, x4) < Math.min(x1, x2) || Math.max(y1, y2) < Math.min(y3, y4) || Math.max(y3, y4) < Math.min(y1, y2)) continue;
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (Math.abs(den) < 1e-12) continue;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den, u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    const e = 1e-7; if (t <= e || t >= 1 - e || u <= e || u >= 1 - e) continue;
    const pt = [R4(x1 + t * (x2 - x1)), R4(y1 + t * (y2 - y1))];
    s1.ins.push([t, pt]); s2.ins.push([u, pt]);
  }
  rings = rings.map((r, ri) => { const out = []; segs.filter(sg => sg.ri === ri).forEach(sg => { out.push(sg.a); sg.ins.sort((m, n) => m[0] - n[0]).forEach(([, pt]) => out.push(pt)); });
    return out.filter((q, i) => { const n = out[(i + 1) % out.length]; return q[0] !== n[0] || q[1] !== n[1]; }); });
  const tops = regions.map(r => r.top);
  const edges = [];
  rings.forEach(r => { for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; edges.push({ a, b, vert: a[0] === b[0], x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]) }); } });
  const inPoly = (p, x, y) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const Hat = (x, y) => { let h = 0; for (let i = 0; i < rings.length; i++) if (inPoly(rings[i], x, y)) h = tops[i]; return h; };
  const ev = (e, x) => { const [p, q] = e.a[0] <= e.b[0] ? [e.a, e.b] : [e.b, e.a]; if (x === p[0]) return p[1]; if (x === q[0]) return q[1]; return p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0]); };
  const xs = [...new Set(rings.flat().map(p => p[0]))].sort((a, b) => a - b);
  const Vc = new Map();
  const V = x => { if (Vc.has(x)) return Vc.get(x); const ys = new Set(); for (const e of edges) { if (e.vert) { if (e.a[0] === x) { ys.add(e.a[1]); ys.add(e.b[1]); } } else if (e.x0 <= x && e.x1 >= x) ys.add(ev(e, x)); } const o = [...ys].sort((a, b) => a - b); Vc.set(x, o); return o; };
  const f = [];
  const fan = (P3, up) => {
    const P = P3.filter((q, i) => { const n = P3[(i + 1) % P3.length]; return q[0] !== n[0] || q[1] !== n[1] || q[2] !== n[2]; });
    if (P.length < 3) return;
    const c = [0, 1, 2].map(k => P.reduce((a, q) => a + q[k], 0) / P.length);
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; f.push(up ? [c, a, b] : [c, b, a]); }
  };
  for (let k = 0; k < xs.length - 1; k++) {
    const x0 = xs[k], x1 = xs[k + 1], xm = (x0 + x1) / 2;
    const span = edges.filter(e => !e.vert && e.x0 <= x0 && e.x1 >= x1).sort((a, b) => ev(a, xm) - ev(b, xm));
    for (let i = 0; i + 1 < span.length; i++) {
      const lo = span[i], hi = span[i + 1], yl = ev(lo, xm), yh = ev(hi, xm);
      if (yh - yl < 1e-9) continue;
      const h = Hat(xm, (yl + yh) / 2); if (h <= 0) continue;
      const bl = [x0, ev(lo, x0)], br = [x1, ev(lo, x1)], tr = [x1, ev(hi, x1)], tl = [x0, ev(hi, x0)];
      const right = V(x1).filter(y => y > br[1] && y < tr[1]).map(y => [x1, y]);
      const left = V(x0).filter(y => y > bl[1] && y < tl[1]).reverse().map(y => [x0, y]);
      const poly = [bl, br, ...right, tr, tl, ...left];
      fan(poly.map(p => [p[0], p[1], h]), true);
      fan(poly.map(p => [p[0], p[1], 0]), false);
    }
  }
  const seen = new Set(), walls = [], zmap = new Map();
  const zk = p => p[0] + ',' + p[1];
  for (const e of edges) {
    let pts;
    if (e.vert) { const lo = Math.min(e.a[1], e.b[1]), hi = Math.max(e.a[1], e.b[1]); const mid = V(e.a[0]).filter(y => y > lo && y < hi).map(y => [e.a[0], y]); if (e.a[1] > e.b[1]) mid.reverse(); pts = [e.a, ...mid, e.b]; }
    else { const mid = xs.filter(x => x > e.x0 && x < e.x1).map(x => [x, ev(e, x)]); if (e.a[0] > e.b[0]) mid.reverse(); pts = [e.a, ...mid, e.b]; }
    for (let i = 0; i + 1 < pts.length; i++) {
      const p = pts[i], q = pts[i + 1], key = [zk(p), zk(q)].sort().join('|');
      if (seen.has(key)) continue; seen.add(key);
      const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy); if (L < 1e-9) continue;
      const nx = dy / L, ny = -dx / L, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, eps = 1e-3;
      const hR = Hat(mx + nx * eps, my + ny * eps), hL = Hat(mx - nx * eps, my - ny * eps);
      if (hR === hL) continue;
      const [a, b] = hR < hL ? [p, q] : [q, p];
      const w = { a, b, zl: Math.min(hR, hL), zh: Math.max(hR, hL) };
      walls.push(w);
      for (const pt of [a, b]) { const k = zk(pt); if (!zmap.has(k)) zmap.set(k, new Set()); zmap.get(k).add(w.zl).add(w.zh); }
    }
  }
  for (const w of walls) {
    const za = [...zmap.get(zk(w.a))].filter(z => z > w.zl && z < w.zh).sort((a, b) => a - b);
    const zb = [...zmap.get(zk(w.b))].filter(z => z > w.zl && z < w.zh).sort((a, b) => a - b);
    const P = [[w.a[0], w.a[1], w.zl], [w.b[0], w.b[1], w.zl], ...zb.map(z => [w.b[0], w.b[1], z]), [w.b[0], w.b[1], w.zh], [w.a[0], w.a[1], w.zh], ...za.reverse().map(z => [w.a[0], w.a[1], z])];
    fan(P, true);
  }
  return f;
}
const meshVolume = f => f.reduce((v, [p, q, r]) => v + (p[0] * (q[1] * r[2] - q[2] * r[1]) - p[1] * (q[0] * r[2] - q[2] * r[0]) + p[2] * (q[0] * r[1] - q[1] * r[0])) / 6, 0);
function panelShape(panel) {
  const s = size(), W = s.cols * CELL, H = s.rows * CELL, g = SHELL.gap;
  const regions = [{ ring: rect(g, g, W - g, H - g), top: SHELL.panel }];
  for (const pl of state.panels[panel])
    for (const c of cutsFor(pl.fp, pl.rot)) regions.push({ ring: shapePoly(c).map(([x, y]) => [x + pl.x * CELL, H - (y + pl.y * CELL)]), top: 0 });
  return regions;
}
function trayShape(panel) {
  const s = size(), W = s.cols * CELL, H = s.rows * CELL, t = SHELL.wall, L = SHELL.ledge;
  const D = panel === 'lid' ? s.lidDepth : s.baseDepth;
  const ledgeTop = D - SHELL.panel - SHELL.disc;
  const r = [{ ring: rect(-t, -t, W + t, H + t), top: D }, { ring: rect(0, 0, W, H), top: ledgeTop }, { ring: rect(L, L, W - L, H - L), top: SHELL.floor }];
  const P = CELL + 2, o = 0.3;
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const x0 = sx ? W - P : 0, y0 = sy ? H - P : 0;
    const mx = sx ? W - CELL / 2 - o : CELL / 2 + o, my = sy ? H - CELL / 2 - o : CELL / 2 + o;
    r.push({ ring: rect(x0, y0, x0 + P, y0 + P), top: ledgeTop });
    r.push({ ring: shapePoly(Cc(mx, my, SHELL.magnetD)), top: ledgeTop - SHELL.magnetH });
  }
  if (state.body.style === 'briefcase') {
    const sw = SHELL.slotW / 2, top = D - SHELL.slotD, hinge = state.body.hinge;
    if (hinge === 'back') r.push({ ring: panel === 'base' ? rect(W / 2 - sw, H - L, W / 2 + sw, H + t) : rect(W / 2 - sw, -t, W / 2 + sw, L), top });
    else { const leftSide = (hinge === 'left') === (panel === 'base'); const y0 = H / 2 - sw, y1 = H / 2 + sw; r.push({ ring: leftSide ? rect(-t, y0, L, y1) : rect(W - L, y0, W + t, y1), top }); }
  }
  return r;
}
let filCache = { key: '', val: null };
function filamentEstimate() {
  const key = JSON.stringify([state.body, state.panels]);
  if (filCache.key === key) return filCache.val;
  let vol = 0;
  for (const p of activePanels()) { vol += meshVolume(heightMesh(trayShape(p))); vol += meshVolume(heightMesh(panelShape(p))); }
  const grams = vol / 1000 * CZ_CONFIG.filament.density * 0.45; /* walls print solid, the rest at ~20% infill */
  const val = { grams: Math.round(grams), cost: grams / 1000 * CZ_CONFIG.filament.pricePerKg, hours: Math.max(1, Math.round(grams / 15)) };
  filCache = { key, val }; return val;
}
function toSTL(name, facets) {
  const out = [`solid ${name}`];
  for (const [a, b, c] of facets) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0];
    const L = Math.hypot(nx, ny, nz) || 1;
    out.push(` facet normal ${(nx / L).toFixed(5)} ${(ny / L).toFixed(5)} ${(nz / L).toFixed(5)}`, '  outer loop');
    for (const p of [a, b, c]) out.push(`   vertex ${p[0].toFixed(4)} ${p[1].toFixed(4)} ${p[2].toFixed(4)}`);
    out.push('  endloop', ' endfacet');
  }
  out.push(`endsolid ${name}`);
  return out.join('\n');
}
function toDXF(panel) {
  const regions = panelShape(panel), out = ['0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '4', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES'];
  for (const r of regions) for (let i = 0; i < r.ring.length; i++) {
    const a = r.ring[i], b = r.ring[(i + 1) % r.ring.length];
    out.push('0', 'LINE', '8', r.top ? 'OUTLINE' : 'CUTOUTS', '10', a[0].toFixed(4), '20', a[1].toFixed(4), '30', '0', '11', b[0].toFixed(4), '21', b[1].toFixed(4), '31', '0');
  }
  out.push('0', 'ENDSEC', '0', 'EOF');
  return out.join('\n');
}

/* ==========================================================================
   CHECKS
   ========================================================================== */
function bodyIssues(plan) {
  const s = size(), out = [], b = board();
  const inner = { lid: s.lidDepth - SHELL.floor - SHELL.panel - SHELL.disc, base: s.baseDepth - SHELL.floor - SHELL.panel - SHELL.disc };
  for (const panel of activePanels()) for (const pl of state.panels[panel]) {
    const d = FP[pl.fp], err = fits(panel, pl.fp, pl.x, pl.y, pl.rot, pl.bid);
    if (err) out.push({ level: 'err', bid: pl.bid, msg: `${d.name} (${panel}) ${err}.` });
    if (d.depth > inner[panel]) out.push({ level: 'err', bid: pl.bid, msg: `${d.name} needs ${d.depth}mm below the panel; the ${panel} has ${inner[panel]}mm.${panel === 'lid' ? ' Move it to the base.' : ' Pick a bigger size.'}` });
    for (const [id] of d.bom) if (COMP[id].linuxOnly && !b.linux) out.push({ level: 'err', bid: pl.bid, msg: `${d.name} needs a Linux brain (Zero 2 W or Pi 5).` });
  }
  const unplaced = benchFP().filter(i => !placementOf(i.bid));
  if (unplaced.length) out.push({ level: 'warn', msg: `${plural(unplaced.length, 'part')} not on a panel yet: ${[...new Set(unplaced.map(i => FP[i.ref].name))].join(', ')}.` });
  const tallest = Math.max(0, ...state.panels.base.map(i => FP[i.fp].depth));
  if (b.size[2] + tallest > inner.base) out.push({ level: 'warn', msg: `The brain (${b.size[2]}mm tall) and the deepest base part (${tallest}mm) can't stack in ${inner.base}mm. Put the brain beside that part, not under it.` });
  const cav = (s.cols * CELL - 2 * SHELL.ledge) * (s.rows * CELL - 2 * SHELL.ledge);
  const bat = BATTERIES[state.body.battery].comps.map(id => COMP[id].size).filter(Boolean);
  const floorUse = b.size[0] * b.size[1] + bat.reduce((a, z) => a + z[0] * z[1], 0);
  if (floorUse > cav * 0.6) out.push({ level: 'warn', msg: `The brain and battery cover ${Math.round(floorUse / cav * 100)}% of the base floor. Consider a bigger size.` });
  for (const z of bat) if (z[2] > inner.base) out.push({ level: 'err', msg: `The battery is ${z[2]}mm tall; the base only has ${inner.base}mm.` });
  if (state.body.battery === 'aa4' && b.pinFamily === 'pico') out.push({ level: 'warn', msg: 'Use rechargeable NiMH AAs (4.8V). Fresh alkaline AAs (6V) are above the Pico’s 5.5V limit.' });
  const outer = Math.max(s.cols, s.rows) * CELL + 2 * SHELL.wall;
  if (outer > CZ_CONFIG.printBed) out.push({ level: 'warn', msg: `The shell is ${outer}mm across, bigger than a common ${CZ_CONFIG.printBed}mm print bed. Use a larger printer or a print service.` });
  return [...out, ...(plan?.issues || [])];
}

/* ==========================================================================
   PAGE VIEWS
   ========================================================================== */
function renderSteps() {
  const cur = STEPS.findIndex(s => s[0] === state.step);
  $('#steps').innerHTML = STEPS.map(([id, l], i) => `<button class="step ${state.step === id ? 'active' : ''} ${cur > i ? 'done' : ''}" data-s="${id}"><span class="num">${i + 1}</span>${l}</button>`).join('');
  $$('.step').forEach(b => b.onclick = () => go(b.dataset.s));
  const a = $('.step.active'); if (a && a.scrollIntoView) a.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

/* ---- 1 Idea ---- */
function renderMake() {
  const cats = {};
  for (const [k, p] of Object.entries(PRESETS)) (cats[p.cat] = cats[p.cat] || []).push([k, p]);
  $('#v-make').innerHTML = `
    <section class="hero">
      <div class="heroText">
        <div class="eyebrow">Case Zero Builder</div>
        <h1>Build your own device.</h1>
        <p class="lead">Drag parts onto a workbench and watch them wire themselves to the brain. Then give it a body, power it on, and see what it costs. Every piece is yours to change or fix.</p>
        <div class="row">
          <button class="btn primary" id="startScratch">Start from scratch</button>
          <label class="btn ghost fileBtn">Open a saved build<input type="file" accept=".json,.casezero" id="openFile"></label>
        </div>
      </div>
      ${art('hero', 'Hero artwork')}
    </section>
    <section class="block">
      <div class="blockHead"><h2>Every device has a body</h2><p>Learn these six words and every build makes sense.</p></div>
      <div class="bodyMap">${['brain', 'nerves', 'senses', 'limbs', 'heart', 'skeleton'].map(r => `
        <div class="bodyCard r-${r}">${art('role-' + r, ROLES[r].name)}
          <div class="bodyTxt"><div class="bodyName">${ROLES[r].name} <span>${ROLES[r].what}</span></div><p>${ROLES[r].text}</p></div>
        </div>`).join('')}</div>
    </section>
    <section class="block">
      <div class="blockHead"><h2>What do you want to make?</h2><p>Start from a preset. You can move, add or remove every part.</p></div>
      ${Object.entries(cats).map(([cat, list]) => `<div class="cat"><div class="eyebrow">${esc(cat)}</div><div class="presetGrid">${list.map(([k, p]) => `
        <button class="preset ${state.preset === k ? 'sel' : ''} ${k === 'scratch' ? 'scratch' : ''}" data-k="${k}">
          ${art('preset-' + k, p.name)}
          <span class="pName">${esc(p.name)}</span><span class="pDesc">${esc(p.desc)}</span>
        </button>`).join('')}</div></div>`).join('')}
    </section>`;
  $$('.preset').forEach(b => b.onclick = () => selectPreset(b.dataset.k));
  $('#startScratch').onclick = () => selectPreset('scratch');
  $('#openFile').onchange = e => openFile(e.target.files[0]);
}
function selectPresetSilent(k) {
  const p = PRESETS[k], step = state.step;
  state = freshState();
  state.step = step;
  state.preset = k; state.needs = { conn: p.conn, budget: p.budget, extras: [] };
  state.body.style = p.style;
  state.name = k === 'scratch' ? 'My build' : 'My ' + p.name;
  benchFromPreset(p);
}
function selectPreset(k) { selectPresetSilent(k); go('circuit'); }

/* ---- 2 Circuit ---- */
function renderCircuit() {
  ensureLayout();
  const c = chosen(), b = c.b, plan = pinPlan();
  const groups = ['senses', 'limbs', 'heart'].map(r => [r, state.bench.filter(i => trayInfo(i)?.role === r)]);
  const count = list => { const m = {}; list.forEach(i => { const n = trayInfo(i).name; m[n] = (m[n] || 0) + 1; }); return Object.entries(m); };
  $('#v-circuit').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 2</div><h1>Build the circuit</h1><p class="lead">Open the workbench, drag parts next to the brain, and watch each nerve snap into place. Tap any part to learn what it does.</p></div></div>
    <button class="benchPreview" id="openBench" aria-label="Open the workbench">
      <svg viewBox="-190 -240 380 480" class="miniBench">${(layoutBench(380, 480), benchSVG(true))}</svg>
      <span class="openCta">${icon('chip')}Open the workbench</span>
    </button>
    <div class="two" style="margin-top:14px">
      <div class="card brainMini">${roleTag('brain')}<h3 style="margin-top:8px">${esc(COMP[b.id].name)}</h3>
        <p class="small">${plan.dUsed} of ${plan.dMax} pins used · ${plan.aNeed} analog${plan.aSource !== 'board' ? ` (${plan.aSource === 'mux' ? 'mux' : 'ADS1115'} added)` : ''}</p>
        ${c.cons.map(x => `<div class="warnLine">${esc(x[0].toUpperCase() + x.slice(1))}</div>`).join('')}
        ${plan.issues.map(i => `<div class="warnLine">${esc(i.msg)}</div>`).join('')}</div>
      <div class="card"><h3>On your bench</h3>${state.bench.length ? groups.map(([r, list]) => list.length ? `<div class="benchList">${roleTag(r)}<span>${count(list).map(([n, k]) => `${k}× ${esc(n)}`).join(' · ')}</span></div>` : '').join('') : '<p class="small">Nothing yet. Open the workbench and drag in your first part.</p>'}
        <p class="small" style="margin-top:10px">Estimated so far: <b>${money0(quickCost())}</b>. Full breakdown on the Cost step.</p></div>
    </div>`;
  $('#openBench').onclick = () => enterMode('bench');
}

/* ---- 3 Body ---- */
function renderBody() {
  ensureLayout();
  const s = size(), bd = state.body, { plan } = bom(), issues = bodyIssues(plan);
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const W = s.cols * CELL, H = s.rows * CELL;
  $('#v-body').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 3</div><h1>Build the body</h1><p class="lead">Pick a size and style, then open the body builder and drag each part where you want it. Every cutout is drawn to scale.</p></div></div>
    <div class="bodyGrid">
      <div class="stack">
        <div class="card"><h3>Size</h3>${seg('sizeSeg', Object.entries(SIZES).map(([k, v]) => [k, `${k}<small>${v.cols * CELL}×${v.rows * CELL}</small>`]), bd.size)}
          <p class="small">${s.name}: ${W + 2 * SHELL.wall}×${H + 2 * SHELL.wall}mm outside · base ${s.baseDepth}mm${bd.style === 'briefcase' ? ` · lid ${s.lidDepth}mm` : ''} deep</p></div>
        <div class="card"><h3>Style</h3>${seg('styleSeg', Object.entries(STYLES).map(([k, v]) => [k, v.name]), bd.style)}<p class="small">${STYLES[bd.style].text}</p>
          ${bd.style === 'briefcase' ? `<h4>Hinge side</h4>${seg('hingeSeg', [['back', 'Back'], ['left', 'Left'], ['right', 'Right']], bd.hinge)}` : ''}</div>
        <div class="card"><h3>Attachments</h3>
          <div class="att"><span>Latches</span>${seg('latchSeg', [[0, 'None'], [1, 'One'], [2, 'Two']], bd.latch)}</div>
          <label class="att"><span>Carry handle</span><input type="checkbox" data-att="handle" ${bd.handle ? 'checked' : ''}></label>
          <label class="att"><span>Key lock</span><input type="checkbox" data-att="lock" ${bd.lock ? 'checked' : ''}></label>
          ${bd.style === 'briefcase' ? `<label class="att"><span>Lid stay</span><input type="checkbox" data-att="stay" ${bd.stay ? 'checked' : ''}></label>` : ''}
          <label class="att"><span>Rubber feet</span><input type="checkbox" data-att="feet" ${bd.feet ? 'checked' : ''}></label>
          <div class="att col"><span>Battery</span><span class="small">${state.body.battery === 'none' ? 'USB power. Add a battery on the workbench.' : esc(BATTERIES[state.body.battery].name) + ' (change it on the workbench)'}</span></div>
        </div>
      </div>
      <div class="stack">
        <button class="benchPreview bodyPreview" id="openBody" aria-label="Open the body builder">
          <div class="panelsPreview">${activePanels().map(p => `<div><span class="small">${p === 'lid' ? 'Lid' : bd.style === 'box' ? 'Top panel' : 'Base'}</span><svg viewBox="-3 -3 ${W + 6} ${H + 6}">${panelSVG(p, {})}</svg></div>`).join('')}</div>
          <span class="openCta">${icon('pad')}Open the body builder</span>
        </button>
        <div class="card"><h3>Checks</h3><ul class="issues">${issues.length ? issues.map(i => `<li class="${i.level}">${esc(i.msg)}</li>`).join('') : '<li class="ok">Everything fits.</li>'}</ul></div>
      </div>
    </div>`;
  const bindSeg = (id, fn) => $$(`#${id} button`).forEach(bt => bt.onclick = () => fn(bt.dataset.v));
  bindSeg('sizeSeg', v => { bd.size = v; if (!state.touched) autoArrange(); else syncPlacements(); renderBody(); });
  bindSeg('styleSeg', v => { bd.style = v; benchFP().forEach(i => { i.panel = defaultPanel(i.ref); }); state.touched = false; ensureLayout(); renderBody(); });
  bindSeg('hingeSeg', v => { bd.hinge = v; renderBody(); });
  bindSeg('latchSeg', v => { bd.latch = +v; renderBody(); });
  $$('[data-att]').forEach(cb => cb.onchange = () => { bd[cb.dataset.att] = cb.checked; renderBody(); });
  $('#openBody').onclick = () => enterMode('body');
}
function panelSVG(panel, opts = {}) {
  const s = size(), W = s.cols * CELL, H = s.rows * CELL, bad = opts.bad || new Set();
  let g = `<rect class="plate" x="0" y="0" width="${W}" height="${H}" rx="3"/>`;
  for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) {
    g += `<rect class="cell" x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}"/>`;
    if (isMagnet(x, y)) g += `<circle class="mag" cx="${x * CELL + 10}" cy="${y * CELL + 10}" r="${SHELL.magnetD / 2 - 1}"/>`;
  }
  for (const pl of state.panels[panel]) {
    const { w, h } = dims(pl.fp, pl.rot), d = FP[pl.fp], role = COMP[d.bom[0][0]].role;
    g += `<g class="part p-${role} ${pl.bid === opts.sel ? 'sel' : ''} ${bad.has(pl.bid) ? 'bad' : ''} ${opts.sim && state.sim.lit[pl.bid] ? 'lit' : ''}" data-bid="${pl.bid}" transform="translate(${pl.x * CELL},${pl.y * CELL})"><title>${esc(d.name)}</title>`;
    g += `<rect class="fp" x="0.8" y="0.8" width="${w * CELL - 1.6}" height="${h * CELL - 1.6}" rx="2"/>`;
    for (const c of cutsFor(pl.fp, pl.rot)) g += `<polygon class="cut" points="${shapePoly(c).map(p => p.map(v => v.toFixed(2)).join(',')).join(' ')}"/>`;
    if (opts.sim && COMP[d.bom[0][0]].sim === 'screen') { const r = cutsFor(pl.fp, pl.rot)[0]; g += `<text class="scr" x="${r.x}" y="${r.y}" text-anchor="middle" dominant-baseline="middle">${esc(state.sim.on ? (state.sim.screen || state.name) : '')}</text>`; }
    if (w >= 2 && h >= 2 && !opts.sim) g += `<text class="lbl" x="3" y="${h * CELL - 3}">${esc(d.name)}</text>`;
    g += '</g>';
  }
  return g;
}

/* ==========================================================================
   BUILD MODE — full screen, stable, rail on the side, build area in the middle
   ========================================================================== */
const modeEl = () => $('#mode');
function enterMode(kind) {
  ensureLayout();
  ui.mode = kind; ui.sel = null; ui.lastBoard = board().id;
  if (!activePanels().includes(ui.panel)) ui.panel = 'base';
  const m = modeEl();
  m.hidden = false; m.dataset.kind = kind; m.classList.remove('sheetOpen');
  document.body.classList.add('inMode');
  try { history.pushState({ mode: kind }, ''); } catch (e) { }
  renderMode();
  requestAnimationFrame(() => requestAnimationFrame(() => { m.classList.add('open'); renderMode(); }));
  if (!store.get('cz-coach-' + kind)) setTimeout(() => { if (ui.mode === kind) coach(kind); }, 500);
}
function exitMode(fromPop) {
  const m = modeEl(); if (!ui.mode) return;
  closeCoach();
  m.classList.remove('open', 'sheetOpen');
  document.body.classList.remove('inMode');
  const kind = ui.mode; ui.mode = null;
  if (!fromPop && history.state?.mode) { try { history.back(); } catch (e) { } }
  setTimeout(() => { if (!ui.mode) { m.hidden = true; m.querySelector('.mStage').innerHTML = ''; } }, 320);
  RENDER[state.step]?.();
  if (kind === 'bench') toast(`${plural(state.bench.length, 'part')} on your bench`);
}
window.addEventListener('popstate', () => { if (ui.mode) exitMode(true); });
function renderMode() {
  const m = modeEl(), kind = ui.mode; if (!kind) return;
  m.querySelector('.mTitle').innerHTML = kind === 'bench' ? '<b>Workbench</b><span id="mSub"></span>' : '<b>Body builder</b><span id="mSub"></span>';
  m.querySelector('#mExit').onclick = () => exitMode();
  if (kind === 'bench') renderBenchMode(); else renderBodyMode();
}

/* ---- drag engine: one pointer, ghost follows the finger ---- */
function startDrag(e, { ghost, onMove, onDrop }) {
  const g = document.createElement('div');
  g.className = 'dragGhost'; g.innerHTML = ghost;
  document.body.appendChild(g);
  const move = ev => { g.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px) translate(-50%, -50%) scale(1.08)`; onMove?.(ev); };
  move(e);
  const up = ev => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    const ok = onDrop(ev); g.classList.add(ok ? 'drop' : 'cancel'); setTimeout(() => g.remove(), 220); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}
/* A tray tile: tap adds it; drag it out of the rail toward the build area to drop it where you want. */
function trayGesture(el, onTap, dragOpts) {
  el.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const sx = e.clientX, sy = e.clientY; let done = false;
    const bottomRail = getComputedStyle(modeEl().querySelector('.mBody')).flexDirection === 'column-reverse';
    const mv = ev => {
      if (done) return;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      const dragging = bottomRail ? (dy < -8 && Math.abs(dy) > Math.abs(dx)) : (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy));
      const scrolling = bottomRail ? Math.abs(dx) > 8 : Math.abs(dy) > 8;
      if (dragging) { done = true; cleanup(); startDrag(ev, dragOpts()); }
      else if (scrolling) { done = true; cleanup(); }
    };
    const upH = () => { if (!done) { done = true; onTap(); } cleanup(); };
    const cleanup = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', upH); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', upH);
  });
}
function svgPoint(svg, ev) { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
function overEl(el, ev) { const r = el.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; }

/* ---- the workbench ---- */
const BR = { w: 118, h: 72 };
function nodeSize(it) { return it.kind === 'fp' && ['hdmi5', 'kbd', 'cluster6', 'joystick', 'tft35'].includes(it.ref) ? [78, 60] : [62, 56]; }
function nervePath(it) {
  const [w, h] = nodeSize(it), x = it.x, y = it.y;
  const ang = Math.atan2(y, x), ex = clamp(Math.cos(ang) * 200, -BR.w / 2, BR.w / 2), ey = clamp(Math.sin(ang) * 200, -BR.h / 2, BR.h / 2);
  const sx = x - Math.cos(ang) * Math.min(w, h) / 2, sy = y - Math.sin(ang) * Math.min(w, h) / 2;
  const mx = (sx + ex) / 2;
  return { d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${mx.toFixed(1)} ${sy.toFixed(1)} ${mx.toFixed(1)} ${ey.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, lx: ex + (sx - ex) * 0.62, ly: ey + (sy - ey) * 0.62 };
}
function benchSVG(mini, opts = {}) {
  const b = board(), plan = pinPlan();
  let g = '<g class="nerves">';
  for (const it of state.bench) {
    const role = trayInfo(it).role, n = nervePath(it), pins = (plan.byBid[it.bid] || []).filter(p => !p.startsWith('|'));
    g += `<path class="nerve n-${role} ${opts.fresh === it.bid ? 'grow' : ''}" data-nerve="${it.bid}" d="${n.d}" pathLength="1"/>`;
    if (!mini && pins.length) g += `<g class="pinTag" data-pin="${it.bid}" transform="translate(${n.lx.toFixed(1)},${n.ly.toFixed(1)})"><rect x="-21" y="-8" width="42" height="16" rx="8"/><text text-anchor="middle" y="3.5">${esc(pins[0] + (pins.length > 1 ? '+' : ''))}</text></g>`;
  }
  g += '</g>';
  g += `<g class="brainNode ${ui.sel === 'brain' ? 'sel' : ''}" data-brain="1"><rect x="${-BR.w / 2}" y="${-BR.h / 2}" width="${BR.w}" height="${BR.h}" rx="12"/>
    <g transform="translate(${-BR.w / 2 + 10},${-BR.h / 2 + 8}) scale(.8)" class="bIco">${ICONS.chip}</g>
    <text class="bRole" x="${-BR.w / 2 + 34}" y="${-BR.h / 2 + 20}">BRAIN</text>
    <text class="bName" x="0" y="8" text-anchor="middle">${esc(COMP[b.id].name.replace('Raspberry Pi', 'Pi').replace('Arduino ', '').replace(' (4GB)', ''))}</text>
    <text class="bPins" x="0" y="24" text-anchor="middle">${plan.dUsed}/${plan.dMax} pins</text></g>`;
  for (const it of state.bench) {
    const t = trayInfo(it), [w, h] = nodeSize(it);
    g += `<g class="node r-${t.role} ${ui.sel === it.bid ? 'sel' : ''} ${opts.fresh === it.bid ? 'pop' : ''}" data-bid="${it.bid}" transform="translate(${it.x},${it.y})">
      <g class="nIn"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10"/>
      <g transform="translate(-11,${-h / 2 + 7})" class="nIco">${ICONS[t.icon]}</g>
      <text x="0" y="${h / 2 - 9}" text-anchor="middle" class="nLbl">${esc(t.name.length > 12 ? t.name.slice(0, 11) + '…' : t.name)}</text></g></g>`;
  }
  return g;
}
function benchBox(stage) {
  const r = stage.getBoundingClientRect(), cw = r.width || 390, ch = r.height || 600;
  if (cw < ch) return { W: 380, H: 380 * ch / cw };
  return { W: 480 * cw / ch, H: 480 };
}
function renderBenchMode(fresh) {
  const m = modeEl(), stage = m.querySelector('.mStage'), rail = m.querySelector('.mRail');
  const plan = pinPlan();
  $('#mSub').textContent = `${plural(state.bench.length, 'part')} · ${plan.dUsed}/${plan.dMax} pins`;
  m.querySelector('.mTopR').innerHTML = `<span class="costPill" title="Estimated cost">${money0(quickCost())}</span>`;
  rail.innerHTML = TRAY.map(g => `<div class="railGroup"><div class="railHead"><span class="dot d-${g.role}"></span>${ROLES[g.role].name}</div>${g.items.map(([kind, ref, name, ic]) => `
    <button class="tile r-${g.role}" data-kind="${kind}" data-ref="${ref}">${icon(ic)}<span>${esc(name)}</span></button>`).join('')}</div>`).join('');
  const { W, H } = benchBox(stage);
  layoutBench(W, H);
  stage.innerHTML = `<svg id="benchSvg" class="benchSvg" viewBox="${-W / 2} ${-H / 2} ${W} ${H}">${benchSVG(false, { fresh })}</svg>
    <div class="trash" id="trash"><span>Drop here to remove</span></div>
    ${state.bench.length ? '' : '<div class="emptyHint">Drag a part from the tray,<br>or tap it to add it.</div>'}`;
  const svg = $('#benchSvg');
  const clampPos = p => [clamp(Math.round(p.x), -W / 2 + 36, W / 2 - 36), clamp(Math.round(p.y), -H / 2 + 34, H / 2 - 34)];
  $$('.mRail .tile').forEach(t => {
    const kind = t.dataset.kind, ref = t.dataset.ref, info = TRAYMAP[kind + ':' + ref];
    trayGesture(t, () => { afterBenchChange(addBench(kind, ref, null, null)); }, () => ({
      ghost: `<div class="tile r-${info.role} lifted">${icon(info.icon)}<span>${esc(info.name)}</span></div>`,
      onDrop: ev => { if (!overEl(svg, ev)) return false; const [x, y] = clampPos(svgPoint(svg, ev)); afterBenchChange(addBench(kind, ref, Math.round(x / 74) * 74, Math.round(y / 70) * 70)); return true; }
    }));
  });
  $$('#benchSvg .node').forEach(el => {
    const bid = +el.dataset.bid, it = benchItem(bid);
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { }
      const start = svgPoint(svg, e), ox = it.x, oy = it.y; let moved = false;
      const trash = $('#trash'), nerve = svg.querySelector(`[data-nerve="${bid}"]`), tag = svg.querySelector(`[data-pin="${bid}"]`);
      const mv = ev => {
        const p = svgPoint(svg, ev), dx = p.x - start.x, dy = p.y - start.y;
        if (!moved && Math.hypot(dx, dy) < 5) return;
        if (!moved) { moved = true; el.classList.add('dragging'); trash.classList.add('show'); }
        [it.x, it.y] = clampPos({ x: ox + dx, y: oy + dy });
        el.setAttribute('transform', `translate(${it.x},${it.y})`);
        const n = nervePath(it); nerve?.setAttribute('d', n.d); tag?.setAttribute('transform', `translate(${n.lx.toFixed(1)},${n.ly.toFixed(1)})`);
        trash.classList.toggle('hot', overEl(trash, ev));
      };
      const up = ev => {
        el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        trash.classList.remove('show');
        if (!moved) { ui.sel = bid; renderBenchMode(); openSheet(); return; }
        if (overEl(trash, ev)) { const name = trayInfo(it).name; removeBench(bid); if (ui.sel === bid) { ui.sel = null; closeSheet(); } afterBenchChange(null); toast(`${name} removed`); return; }
        it.x = Math.round(it.x / 74) * 74; it.y = Math.round(it.y / 70) * 70;
        const other = state.bench.find(o => o !== it && Math.abs(o.x - it.x) < 66 && Math.abs(o.y - it.y) < 60);
        if (other) state.bench = [...state.bench.filter(o => o !== it), it];
        renderBenchMode();
      };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  });
  svg.querySelector('.brainNode').addEventListener('click', () => { ui.sel = 'brain'; renderBenchMode(); openSheet(); });
  svg.addEventListener('click', e => { if (e.target === svg) { ui.sel = null; closeSheet(); renderBenchMode(); } });
  renderSheet();
}
function afterBenchChange(fresh) {
  const before = ui.lastBoard, now = board().id;
  if (fresh) ui.sel = fresh.bid;
  renderBenchMode(fresh?.bid);
  if (fresh) openSheet();
  if (before && now !== before) { toast(`Brain switched to ${COMP[now].name} to fit your parts`); $('#benchSvg .brainNode')?.classList.add('swap'); }
  ui.lastBoard = now;
  if (fresh && navigator.vibrate) try { navigator.vibrate(8); } catch (e) { }
}

/* ---- info sheet (slides up on phones, side panel on wide screens) ---- */
function openSheet() { modeEl().classList.add('sheetOpen'); }
function closeSheet() { modeEl().classList.remove('sheetOpen'); }
function renderSheet() {
  const sh = modeEl().querySelector('.mSheet');
  if (ui.mode === 'body') return renderBodySheet(sh);
  if (ui.sel === 'brain') return renderBrainSheet(sh);
  const it = ui.sel && benchItem(ui.sel);
  if (!it) { sh.innerHTML = `<div class="shIdle"><h3>How it works</h3><p>Every part needs a nerve to the brain. Drag one in and watch it connect.</p><p class="small">Tap a part to learn what it does. Drag a part onto the bin to remove it. Tap the brain to change it.</p></div>`; return; }
  const t = trayInfo(it), plan = pinPlan(), info = plan.byBid[it.bid] || [], how = info.filter(p => p.startsWith('|')).map(p => p.slice(1));
  const same = state.bench.filter(i => i.kind === it.kind && i.ref === it.ref).length;
  const comp = it.kind === 'fp' ? FP[it.ref].bom[0][0] : it.ref, est = options(comp, 1)[0];
  sh.innerHTML = `<button class="shClose" aria-label="Close">×</button>
    <div class="shHead">${icon(t.icon, 'big r-' + t.role)}<div><div class="shName">${esc(t.name)}</div>${roleTag(t.role)}</div></div>
    <p class="analogy">${ANALOGY[t.role]}</p>
    <p>${esc(t.desc)}</p>
    ${how.length ? `<div class="shBlock"><div class="eyebrow">How its nerve connects</div><p class="mono">${esc(how[0])}</p></div>` : it.kind === 'heart' ? '<div class="shBlock"><div class="eyebrow">How it connects</div><p class="mono">Battery → charger → brain power pins.</p></div>' : ''}
    <div class="shRow"><span>About ${money(est.cost)}${est.pack > 1 ? ` for a pack of ${est.pack}` : ''}</span><span class="small">${same} on the bench</span></div>
    ${it.kind === 'fp' && state.body.style === 'briefcase' ? `<div class="shRow"><span>Goes on the</span><div class="seg mini" id="panelPick"><button class="${it.panel === 'lid' ? 'on' : ''}" data-v="lid">Lid</button><button class="${it.panel === 'base' ? 'on' : ''}" data-v="base">Base</button></div></div>` : ''}
    <div class="shActions">${it.kind !== 'heart' ? '<button class="btn primary" id="dupBtn">Add another</button>' : ''}<button class="btn ghost" id="rmBtn">Remove</button></div>`;
  sh.querySelector('.shClose').onclick = () => { ui.sel = null; closeSheet(); renderBenchMode(); };
  const dup = sh.querySelector('#dupBtn');
  if (dup) dup.onclick = () => { const n = addBench(it.kind, it.ref, null, null); n.panel = it.panel; afterBenchChange(n); };
  sh.querySelector('#rmBtn').onclick = () => { removeBench(it.bid); ui.sel = null; closeSheet(); afterBenchChange(null); toast(`${t.name} removed`); };
  sh.querySelectorAll('#panelPick button').forEach(bt => bt.onclick = () => { it.panel = bt.dataset.v; for (const p of ['lid', 'base']) state.panels[p] = state.panels[p].filter(pl => pl.bid !== it.bid); it.tried = false; renderSheet(); });
}
function renderBrainSheet(sh) {
  const ranked = scoreBoards(), c = chosen(), b = c.b, plan = pinPlan();
  const why = c.pros.length ? `Strong at ${c.pros.slice(0, 4).join(', ')}.` : c.good.length ? `Good at ${c.good.slice(0, 4).join(', ')}.` : 'Closest match for your parts.';
  const max = ranked[0].s, min = ranked[ranked.length - 1].s, pct = r => max === min ? 100 : Math.max(4, Math.round((r.s - min) / (max - min) * 100));
  sh.innerHTML = `<button class="shClose" aria-label="Close">×</button>
    <div class="shHead">${icon('chip', 'big r-brain')}<div><div class="shName">${esc(COMP[b.id].name)}</div>${roleTag('brain')}</div></div>
    <p class="analogy">${ANALOGY.brain}</p>
    <p>${esc(why)} <span class="small">${esc(b.specs)}</span></p>
    ${c.cons.map(x => `<div class="warnLine">${esc(x[0].toUpperCase() + x.slice(1))}</div>`).join('')}
    <div class="shBlock"><div class="eyebrow">Pins</div><div class="usage"><div><span class="small">Digital</span><div class="meter wide"><i style="width:${Math.min(100, plan.dUsed / plan.dMax * 100)}%"></i></div><span class="mono">${plan.dUsed}/${plan.dMax}</span></div>
      <div><span class="small">Analog</span><div class="meter wide"><i style="width:${plan.aMax ? Math.min(100, plan.aNeed / plan.aMax * 100) : plan.aNeed ? 100 : 0}%"></i></div><span class="mono">${plan.aNeed}/${plan.aMax}</span></div></div></div>
    <div class="shBlock"><div class="eyebrow">How should it connect?</div><div class="chips" id="connR">${CONNS.map(([v, l]) => `<button class="chip ${state.needs.conn === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div class="shBlock"><div class="eyebrow">Budget for the brain</div><div class="chips" id="budR">${BUDGETS.map(([v, s]) => `<button class="chip ${state.needs.budget === v ? 'on' : ''}" data-v="${v}"><b>${s}</b></button>`).join('')}</div></div>
    <div class="shBlock"><div class="eyebrow">Anything else it should do?</div><div class="chips" id="extR">${EXTRAS.map(([v, l]) => `<button class="chip ${state.needs.extras.includes(v) ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div class="shBlock"><div class="eyebrow">Other brains</div>${ranked.map(r => `<button class="brainRow ${r.b.id === b.id ? 'on' : ''}" data-id="${r.b.id}"><span>${esc(COMP[r.b.id].name)}${r.b.id === ranked[0].b.id ? '<i>best match</i>' : ''}</span><span class="meter"><i style="width:${pct(r)}%"></i></span></button>`).join('')}
      ${state.boardPick ? '<button class="btn small ghost" id="autoBrain">Let Nociv choose</button>' : ''}</div>`;
  sh.querySelector('.shClose').onclick = () => { ui.sel = null; closeSheet(); renderBenchMode(); };
  const redo = () => { ui.lastBoard = board().id; renderBenchMode(); };
  sh.querySelectorAll('#connR .chip').forEach(bt => bt.onclick = () => { state.needs.conn = bt.dataset.v; state.boardPick = null; redo(); });
  sh.querySelectorAll('#budR .chip').forEach(bt => bt.onclick = () => { state.needs.budget = +bt.dataset.v; state.boardPick = null; redo(); });
  sh.querySelectorAll('#extR .chip').forEach(bt => bt.onclick = () => { const v = bt.dataset.v, e = state.needs.extras; state.needs.extras = e.includes(v) ? e.filter(x => x !== v) : [...e, v]; syncFuncs(); redo(); });
  sh.querySelectorAll('.brainRow').forEach(bt => bt.onclick = () => { state.boardPick = bt.dataset.id; redo(); });
  const ab = sh.querySelector('#autoBrain'); if (ab) ab.onclick = () => { state.boardPick = null; redo(); };
}

/* ---- body builder ---- */
function renderBodyMode() {
  const m = modeEl(), stage = m.querySelector('.mStage'), rail = m.querySelector('.mRail');
  if (!activePanels().includes(ui.panel)) ui.panel = 'base';
  syncPlacements();
  const s = size(), W = s.cols * CELL, H = s.rows * CELL, panel = ui.panel;
  const { plan } = bom(), bad = new Set(bodyIssues(plan).filter(i => i.bid && i.level === 'err').map(i => i.bid));
  const mine = benchFP().filter(i => i.panel === panel), unplaced = mine.filter(i => !placementOf(i.bid));
  $('#mSub').textContent = `${s.name} · ${mine.length - unplaced.length}/${mine.length} placed`;
  m.querySelector('.mTopR').innerHTML = activePanels().length > 1 ? `<div class="seg mini" id="mPanel"><button class="${panel === 'lid' ? 'on' : ''}" data-v="lid">Lid</button><button class="${panel === 'base' ? 'on' : ''}" data-v="base">Base</button></div>` : '';
  rail.innerHTML = `<div class="railGroup"><div class="railHead">To place</div>${unplaced.length ? unplaced.map(i => { const t = trayInfo(i); return `<button class="tile r-${t.role}" data-bid="${i.bid}">${icon(t.icon)}<span>${esc(t.name)}</span></button>`; }).join('') : '<p class="railEmpty">All placed</p>'}</div>
    <div class="railGroup"><button class="tile util" id="arrangeBtn">${icon('buttons')}<span>Auto-arrange</span></button></div>`;
  stage.innerHTML = `<div class="plateWrap"><svg id="bodySvg" class="bodySvg" viewBox="-4 -4 ${W + 8} ${H + 8}">${panelSVG(panel, { bad, sel: ui.sel })}<g id="preview"></g></svg></div>`;
  const svg = $('#bodySvg'), prev = $('#preview');
  const showPrev = (fp, rot, ax, ay, ignore) => {
    const { w, h } = dims(fp, rot), err = fits(panel, fp, ax, ay, rot, ignore);
    prev.innerHTML = `<rect class="pv ${err ? 'no' : 'ok'}" x="${ax * CELL + 1}" y="${ay * CELL + 1}" width="${w * CELL - 2}" height="${h * CELL - 2}" rx="3"/>` + cutsFor(fp, rot).map(c => `<polygon class="pvCut" transform="translate(${ax * CELL},${ay * CELL})" points="${shapePoly(c).map(p => p.join(',')).join(' ')}"/>`).join('');
    return err;
  };
  const anchor = (ev, fp, rot) => { const p = svgPoint(svg, ev), { w, h } = dims(fp, rot); return [Math.round(p.x / CELL - w / 2), Math.round(p.y / CELL - h / 2)]; };
  $$('.mRail .tile[data-bid]').forEach(t => {
    const bid = +t.dataset.bid, it = benchItem(bid), info = trayInfo(it);
    const tryPlace = (ax, ay) => { for (const rot of [0, 1]) if (!fits(panel, it.ref, ax, ay, rot)) { state.panels[panel].push({ bid, fp: it.ref, x: ax, y: ay, rot }); return true; } return false; };
    trayGesture(t, () => { it.tried = false; syncPlacements(); state.touched = true; ui.sel = bid; if (!placementOf(bid)) toast('No room left on this panel. Try a bigger size.'); renderBodyMode(); openSheet(); }, () => ({
      ghost: `<div class="tile r-${info.role} lifted">${icon(info.icon)}<span>${esc(info.name)}</span></div>`,
      onMove: ev => { if (overEl(svg, ev)) { const [ax, ay] = anchor(ev, it.ref, 0); showPrev(it.ref, 0, ax, ay); } else prev.innerHTML = ''; },
      onDrop: ev => { prev.innerHTML = ''; if (!overEl(svg, ev)) return false; const [ax, ay] = anchor(ev, it.ref, 0); if (tryPlace(ax, ay)) { it.tried = true; state.touched = true; ui.sel = bid; renderBodyMode(); openSheet(); return true; } toast(`Can't go there: ${fits(panel, it.ref, ax, ay, 0)}`); return false; }
    }));
  });
  $$('#bodySvg .part').forEach(el => {
    const bid = +el.dataset.bid, pl = state.panels[panel].find(x => x.bid === bid);
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { }
      const sx = e.clientX, sy = e.clientY; let moved = false, last = null;
      const mv = ev => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        if (!moved) { moved = true; el.classList.add('ghosted'); }
        last = anchor(ev, pl.fp, pl.rot); showPrev(pl.fp, pl.rot, last[0], last[1], bid);
      };
      const up = () => {
        el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        prev.innerHTML = '';
        if (!moved) { ui.sel = bid; renderBodyMode(); openSheet(); return; }
        const err = last && fits(panel, pl.fp, last[0], last[1], pl.rot, bid);
        if (last && !err) { pl.x = last[0]; pl.y = last[1]; state.touched = true; } else if (err) toast(`Can't go there: ${err}`);
        ui.sel = bid; renderBodyMode(); openSheet();
      };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  });
  m.querySelectorAll('#mPanel button').forEach(bt => bt.onclick = () => { ui.panel = bt.dataset.v; ui.sel = null; closeSheet(); renderBodyMode(); });
  $('#arrangeBtn').onclick = () => { autoArrange(); state.touched = true; ui.sel = null; renderBodyMode(); toast('Arranged'); };
  svg.addEventListener('click', e => { const c = e.target.classList; if (e.target === svg || c.contains('cell') || c.contains('plate') || c.contains('mag')) { ui.sel = null; closeSheet(); renderBodyMode(); } });
  renderSheet();
}
function renderBodySheet(sh) {
  const pl = ui.sel && placementOf(ui.sel), it = ui.sel && benchItem(ui.sel);
  const { plan } = bom(), issues = bodyIssues(plan);
  if (!pl || !it) {
    sh.innerHTML = `<div class="shIdle"><h3>Place your parts</h3><p>Drag a part from the tray onto the panel. It snaps to the 20mm grid. Green means it fits.</p>
      <ul class="issues">${issues.length ? issues.map(i => `<li class="${i.level}">${esc(i.msg)}</li>`).join('') : '<li class="ok">Everything fits.</li>'}</ul></div>`;
    return;
  }
  const t = trayInfo(it), d = FP[pl.fp], other = pl.panel === 'lid' ? 'base' : 'lid';
  const mineIssues = issues.filter(i => i.bid === pl.bid);
  sh.innerHTML = `<button class="shClose" aria-label="Close">×</button>
    <div class="shHead">${icon(t.icon, 'big r-' + t.role)}<div><div class="shName">${esc(t.name)}</div>${roleTag(t.role)}</div></div>
    <p class="mono">${d.w * CELL}×${d.h * CELL}mm on the panel · needs ${d.depth}mm below it</p>
    ${mineIssues.map(i => `<div class="alert ${i.level}">${esc(i.msg)}</div>`).join('')}
    <div class="shActions"><button class="btn" id="rotBtn">Rotate</button>
      ${activePanels().length > 1 ? `<button class="btn" id="swapBtn">Move to ${other}</button>` : ''}
      <button class="btn ghost" id="offBtn">Take off panel</button></div>`;
  sh.querySelector('.shClose').onclick = () => { ui.sel = null; closeSheet(); renderBodyMode(); };
  sh.querySelector('#rotBtn').onclick = () => { const real = state.panels[pl.panel].find(x => x.bid === pl.bid), err = fits(pl.panel, pl.fp, pl.x, pl.y, pl.rot ? 0 : 1, pl.bid); if (err) { toast(`Can't rotate: ${err}`); return; } real.rot = real.rot ? 0 : 1; state.touched = true; renderBodyMode(); };
  const sw = sh.querySelector('#swapBtn');
  if (sw) sw.onclick = () => { state.panels[pl.panel] = state.panels[pl.panel].filter(x => x.bid !== pl.bid); it.panel = other; it.tried = false; syncPlacements(); state.touched = true; ui.panel = other; renderBodyMode(); if (!placementOf(it.bid)) toast(`No room on the ${other}. It's waiting in the tray.`); };
  sh.querySelector('#offBtn').onclick = () => { state.panels[pl.panel] = state.panels[pl.panel].filter(x => x.bid !== pl.bid); it.tried = true; state.touched = true; ui.sel = null; closeSheet(); renderBodyMode(); };
}

/* ---- first-time walkthrough ---- */
const COACH = {
  bench: [['.mRail', 'These are your parts. Drag one toward the brain, or tap it to add it.'], ['#benchSvg .brainNode', 'This is the brain. Every part gets a nerve to it, and each nerve shows the pin it uses.'], ['#mExit', 'Tap Done when you are finished. Everything saves as you go.']],
  body: [['.mRail', 'Parts waiting to go on the panel. Drag one onto the grid.'], ['#bodySvg', 'Green means it fits. Drag placed parts to move them, or tap one to rotate it.'], ['#mExit', 'Tap Done to go back and keep going.']]
};
let coachLayer = null;
function coach(kind) {
  closeCoach();
  const steps = COACH[kind]; let i = 0;
  const layer = document.createElement('div'); layer.className = 'coach'; document.body.appendChild(layer);
  coachLayer = layer;
  const show = () => {
    const [sel, text] = steps[i], el = $(sel); if (!el) { closeCoach(); return; }
    const r = el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    const tipTop = r.top + r.height / 2 < vh / 2 ? Math.min(r.bottom + 14, vh - 160) : null;
    layer.innerHTML = `<div class="coachRing" style="left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px"></div>
      <div class="coachTip" style="left:${clamp(r.left + r.width / 2 - 140, 12, vw - 292)}px;${tipTop !== null ? `top:${tipTop}px` : `bottom:${Math.max(12, vh - r.top + 14)}px`}">
        <p>${text}</p><div class="row"><span class="small">${i + 1} of ${steps.length}</span><button class="btn small primary" id="coachNext">${i < steps.length - 1 ? 'Next' : 'Got it'}</button></div></div>`;
    $('#coachNext').onclick = () => { i++; if (i < steps.length) show(); else { store.set('cz-coach-' + kind, '1'); closeCoach(); } };
  };
  show();
}
function closeCoach() { coachLayer?.remove(); coachLayer = null; }

/* ---- 4 Power on (simulator) ---- */
function simOutputs() { const out = []; for (const p of activePanels()) for (const i of state.panels[p]) { const c = COMP[FP[i.fp].bom[0][0]]; if (['glow', 'screen', 'sound'].includes(c.sim)) out.push(i); } return out; }
function renderSim() {
  ensureLayout();
  const { lines } = bom(), b = board(), s = size(), W = s.cols * CELL, H = s.rows * CELL, gap = 34, m = 12, colW = 150;
  const panels = activePanels(), briefcase = panels.length > 1;
  const baseY = briefcase ? m + H + gap : m, hingeY = m + H + gap / 2;
  const inside = lines.filter(l => l.group === 'parts' && !['skeleton', 'nerves'].includes(COMP[l.id].role) && !l.why.some(w => w.includes('panel')) && l.id !== b.id);
  const blocks = [{ id: b.id, label: COMP[b.id].name, role: 'brain', h: 64 }, ...inside.map(l => ({ id: l.id, label: COMP[l.id].name + (l.qty > 1 ? ` ×${l.qty}` : ''), role: COMP[l.id].role, h: 34 }))];
  let by = m; const bx = m + W + 36;
  blocks.forEach(k => { k.x = bx; k.y = by; by += k.h + 10; });
  const brain = blocks[0], bc = [brain.x, brain.y + brain.h / 2];
  const totalH = Math.max(baseY + H + m, by + m), totalW = bx + colW + m;
  const wires = [];
  for (const p of panels) for (const i of state.panels[p]) {
    const { w, h } = dims(i.fp, i.rot), c = COMP[FP[i.fp].bom[0][0]];
    const oy = p === 'lid' ? m : baseY, cx = m + i.x * CELL + w * CELL / 2, cy = oy + i.y * CELL + h * CELL / 2;
    const amp = blocks.find(k => k.id === 'amp'), tgt = c.wire === 'speaker' && amp ? [amp.x, amp.y + amp.h / 2] : bc;
    const d = p === 'lid' ? `M ${cx} ${cy} Q ${m + W / 2} ${cy + 20} ${m + W / 2} ${hingeY} T ${tgt[0]} ${tgt[1]}` : `M ${cx} ${cy} Q ${(cx + tgt[0]) / 2} ${cy} ${tgt[0]} ${tgt[1]}`;
    wires.push({ inst: i.bid, role: c.role, d });
  }
  blocks.slice(1).forEach(k => wires.push({ block: k.id, role: k.role, d: `M ${k.x} ${k.y + k.h / 2} C ${k.x - 24} ${k.y + k.h / 2} ${bc[0] - 24} ${bc[1]} ${bc[0]} ${bc[1]}` }));
  let g = '';
  if (briefcase) g += `<g transform="translate(${m},${m})">${panelSVG('lid', { sim: true })}</g><rect class="hingeBar" x="${m}" y="${m + H + 6}" width="${W}" height="${gap - 12}" rx="3"/><rect class="slot" x="${m + W / 2 - 15}" y="${m + H + 6}" width="30" height="${gap - 12}" rx="2"/><text class="tiny" x="${m + W / 2 + 20}" y="${hingeY + 3}">cable slot</text>`;
  g += `<g transform="translate(${m},${baseY})">${panelSVG('base', { sim: true })}</g>`;
  g += wires.map(w => `<path class="nerve n-${w.role} ${w.inst && state.sim.lit['w' + w.inst] ? 'pulse' : ''}" d="${w.d}"/>`).join('');
  g += blocks.map(k => `<g class="block b-${k.role} ${state.sim.lit['b' + k.id] ? 'lit' : ''}" data-block="${k.id}"><rect x="${k.x}" y="${k.y}" width="${colW}" height="${k.h}" rx="6"/><text x="${k.x + 8}" y="${k.y + 14}" class="bRole">${ROLES[k.role].name.toUpperCase()}</text><text x="${k.x + 8}" y="${k.y + 27}" class="bName">${esc(k.label.length > 24 ? k.label.slice(0, 23) + '…' : k.label)}</text></g>`).join('');
  const mA = lines.filter(l => l.group === 'parts').reduce((a, l) => a + (COMP[l.id].mA || 0) * l.qty, 0);
  const batId = BATTERIES[state.body.battery].comps[0], bat = batId && COMP[batId];
  const hours = bat ? (b.linux ? bat.mAh * bat.volt * 0.85 / (5 * mA) : bat.mAh * 0.85 / mA) : 0;
  $('#v-sim').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 4</div><h1>Power it on</h1><p class="lead">See how the nerves connect. Tap any sense (an input) to send a signal to the brain and watch the limbs react. The starter code on Code & test does the same thing on your real board.</p></div>
      <button class="btn primary powerBtn ${state.sim.on ? 'on' : ''}" id="powerBtn">${state.sim.on ? 'Power off' : 'Power on'}</button></div>
    <div class="simGrid">
      <div class="card simCard"><svg id="simSvg" class="${state.sim.on ? 'on' : ''}" viewBox="0 0 ${totalW} ${totalH}">${g}</svg></div>
      <div class="stack">
        <div class="card"><h3>Power</h3>
          <div class="kv"><span>Draws about</span><b>${mA} mA</b></div>
          <div class="kv"><span>Powered by</span><b>${bat ? esc(BATTERIES[state.body.battery].name) : 'USB'}</b></div>
          ${bat ? `<div class="kv"><span>Battery life</span><b>about ${hours >= 1 ? Math.round(hours * 10) / 10 + ' h' : Math.round(hours * 60) + ' min'}</b></div>` : ''}
          ${b.id === 'pi5' ? '<p class="small">The Pi 5 wants a 5V 5A USB-C supply for full power.</p>' : ''}
          <p class="small">Rough estimate from typical draw. Real numbers depend on your code, screen brightness and Wi-Fi use.</p></div>
        <div class="card"><h3>Signal log</h3><ol class="log">${state.sim.log.slice(-6).reverse().map(x => `<li>${esc(x)}</li>`).join('') || `<li class="small">${state.sim.on ? 'Tap a button, knob or sensor.' : 'Power on to begin.'}</li>`}</ol></div>
      </div>
    </div>`;
  $('#powerBtn').onclick = () => { state.sim.on = !state.sim.on; state.sim.lit = {}; state.sim.screen = ''; if (state.sim.on) { state.sim.log.push(`${COMP[b.id].name} boots. Heart → brain: power on.`); simOutputs().forEach(o => { if (COMP[FP[o.fp].bom[0][0]].sim === 'glow') state.sim.lit[o.bid] = true; }); } renderSim(); };
  $$('#simSvg .part').forEach(el => el.onclick = () => simInput(+el.dataset.bid));
  $$('#simSvg .block').forEach(el => el.onclick = () => simBlock(el.dataset.block));
}
function flash(keys, ms = 650) { keys.forEach(k => state.sim.lit[k] = true); renderSim(); setTimeout(() => { keys.forEach(k => { if (!state.sim.keep?.[k]) delete state.sim.lit[k]; }); if (state.step === 'sim') renderSim(); }, ms); }
function simInput(bid) {
  if (!state.sim.on) { toast('Power it on first'); return; }
  const pl = placementOf(bid); if (!pl) return;
  const fp = FP[pl.fp], c = COMP[fp.bom[0][0]], b = board();
  if (c.role !== 'senses') { toast(`${fp.name} is a limb: the brain controls it.`); return; }
  let msg;
  if (c.sim === 'turn') { const v = ((state.sim.vals[bid] || 0) + 25) % 125; state.sim.vals[bid] = v; msg = `${fp.name} → ${v}%`; } else msg = `${fp.name} pressed`;
  state.sim.screen = msg;
  const outs = simOutputs();
  state.sim.log.push(`${fp.name} (sense) → nerve → ${COMP[b.id].name} → ${outs.length ? [...new Set(outs.map(o => FP[o.fp].name))].join(', ') + ' react' : 'no limbs to react yet'}.`);
  state.sim.keep = {};
  outs.forEach(o => { if (COMP[FP[o.fp].bom[0][0]].sim === 'glow') { state.sim.lit[o.bid] = !state.sim.lit[o.bid]; state.sim.keep[o.bid] = true; } });
  flash(['w' + bid, bid, 'b' + b.id, ...outs.filter(o => COMP[FP[o.fp].bom[0][0]].sim !== 'glow').map(o => o.bid), ...outs.map(o => 'w' + o.bid)]);
}
function simBlock(id) {
  if (!state.sim.on) { toast('Power it on first'); return; }
  const c = COMP[id], b = board();
  if (id === b.id) { toast('This is the brain. Tap a sense to send it a signal.'); return; }
  let msg = `${c.name} is ${ROLES[c.role].name.toLowerCase()}`;
  if (c.sim === 'sense') { const v = 20 + Math.round(Math.random() * 60); msg = `${c.name} reads ${v}${id === 'soil' ? '% moisture' : '°F'}`; }
  if (c.sim === 'listen') msg = 'Microphone hears a voice';
  if (c.role === 'heart') msg = `${c.name} feeds the brain`;
  state.sim.screen = msg; state.sim.log.push(`${msg} → ${COMP[b.id].name}.`);
  flash(['b' + id, 'b' + b.id]);
}

/* ---- 5 Cost & order ---- */
function renderParts() {
  ensureLayout(); optimizeSave();
  const { lines } = bom(), c = chosen(), b = c.b, P = priceBom(lines), sk = skillFor(lines, b), tm = timeFor(lines, P.fil);
  const tab = state.costTab || 'parts';
  const forgot = lines.filter(l => COMP[l.id].forgot);
  const head = `
    <div class="pageHead"><div><div class="eyebrow">Step 5</div><h1>Cost & order</h1><p class="lead">Everything you need in one list, so nothing shows up missing. Check off what you already own, then order it store by store.</p></div></div>
    <div class="summary">
      <div class="stat big"><span class="sLabel">Estimated cost</span><span class="sVal" data-count="${Math.round(P.total)}">${money0(P.total)}</span><span class="sSub">parts ${money0(P.parts)} · printing ${money0(P.fil.cost)}${P.proto ? ` · prototype ${money0(P.proto)}` : ''}${P.pcb ? ` · PCB ${money0(P.pcb)}` : ''} · shipping ${money0(P.ship)}${P.duty ? ` · import est. ${money0(P.duty)}` : ''}</span></div>
      <div class="stat"><span class="sLabel">Skill</span><span class="sVal">${sk.level}</span><span class="skill">${[1, 2, 3].map(i => `<i class="${i <= sk.dots ? 'on' : ''}"></i>`).join('')}</span><span class="sSub">${esc(sk.reasons.slice(0, 2).join(' · '))}</span></div>
      <div class="stat"><span class="sLabel">Time</span><span class="sVal">${tm.build}h</span><span class="sSub">+ about ${tm.print}h of printing</span></div>
      <div class="stat"><span class="sLabel">Tools (one time)</span><span class="sVal">${money0(P.tools)}</span><span class="sSub">${lines.filter(t => t.group === 'tools' && !state.have[t.id]).length} still needed</span></div>
    </div>
    <div class="tabs" id="costTabs"><button class="${tab === 'parts' ? 'on' : ''}" data-v="parts">Parts list</button><button class="${tab === 'order' ? 'on' : ''}" data-v="order">Order checklist</button><span class="tabInk"></span></div>`;
  $('#v-parts').innerHTML = head + `<div class="tabBody">${tab === 'parts' ? partsTab(lines, P, forgot) : orderTab(lines, P)}</div>`;
  const ink = $('#costTabs .tabInk'), on = $('#costTabs .on'); if (ink && on) { ink.style.width = on.offsetWidth + 'px'; ink.style.transform = `translateX(${on.offsetLeft}px)`; }
  $$('#costTabs button').forEach(bt => bt.onclick = () => { if (state.costTab === bt.dataset.v) return; state.costTab = bt.dataset.v; renderParts(); $('.tabBody').classList.add('swap'); });
  bindCost();
}
function lineRow(l) {
  const comp = COMP[l.id], vs = comp.variants, vi = variantIdx(l.id), have = !!state.have[l.id];
  return `<div class="line ${have ? 'have' : ''}">
    <div class="lMain"><div class="lName">${esc(comp.name)}${l.qty > 1 ? ` <span class="qty">×${l.qty}</span>` : ''}${comp.forgot ? '<span class="forgotTag">easy to forget</span>' : ''}</div>
      ${vs.length > 1 ? `<select class="variant" data-id="${l.id}">${vs.map((v, i) => `<option value="${i}" ${i === vi ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>` : `<div class="lVar">${esc(vs[0].label)}</div>`}
      <div class="lWhy">${esc(l.why.join(' · '))}${l.pick.pack > 1 ? ` · comes in packs of ${l.pick.pack}` : ''}</div></div>
    <div class="lCost"><span class="est">${have ? 'have it' : money(l.pick.cost)}</span><label class="haveBox"><input type="checkbox" data-have="${l.id}" ${have ? 'checked' : ''}> I have it</label></div>
    <div class="lBuy">${l.opts.map(o => `<a class="buy ${o === l.pick && !have ? 'best' : ''} ${o.overseas ? 'far' : ''}" href="${esc(o.url)}" target="_blank" rel="noopener sponsored"><span>${esc(o.name)}${o === l.pick && !have ? '<i>best pick</i>' : ''}</span><small>${money(o.cost)}${o.days ? ' · ' + o.days : ''}</small></a>`).join('')}</div>
  </div>`;
}
function partsTab(lines, P, forgot) {
  const roleOrder = ['brain', 'senses', 'limbs', 'heart', 'nerves', 'skeleton'];
  const parts = lines.filter(l => l.group === 'parts'), tools = lines.filter(l => l.group === 'tools'), proto = lines.filter(l => l.group === 'proto');
  const barTotal = Object.values(P.byRole).reduce((a, v) => a + v, 0) || 1;
  return `
    <div class="costBar">${roleOrder.filter(r => P.byRole[r]).map(r => `<span class="seg-${r}" style="flex:${P.byRole[r] / barTotal}"></span>`).join('')}</div>
    <div class="costLegend">${roleOrder.filter(r => P.byRole[r]).map(r => `<span><i class="dot d-${r}"></i>${ROLES[r].name} ${money0(P.byRole[r])}</span>`).join('')}</div>
    ${forgot.length ? `<div class="card forgotCard"><h3>Did you forget?</h3><p class="small">We added ${plural(forgot.length, 'thing')} people usually find out they need after ordering. Tick "I have it" on any you already own.</p>
      <div class="chips">${forgot.map(l => `<span class="chip static ${state.have[l.id] ? 'done' : ''}">${esc(COMP[l.id].name)}<span class="n">${esc(l.why[0])}</span></span>`).join('')}</div></div>` : ''}
    <div class="card priceCard">
      <div><h3>Adjust by price</h3><p class="small">Swaps every part to its cheapest or best version. You can still change any single part below.</p></div>
      <div class="seg" id="priceMode">${[['save', 'Save money'], ['bal', 'Balanced'], ['best', 'Best quality']].map(([v, l]) => `<button class="${state.priceMode === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>
      <label class="overseas"><span class="switch"><input type="checkbox" id="overseasT" ${state.overseas ? 'checked' : ''}><span></span></span>
        <span><b>Include overseas stores</b><span class="small">AliExpress and LCSC. Often cheaper, but 1 to 4 weeks slower. US imports no longer have a duty-free limit, so we add an estimated ${Math.round(CZ_CONFIG.importEstimate * 100)}% for import charges. Your checkout shows the real amount.</span></span></label>
    </div>
    ${roleOrder.map(r => { const L = parts.filter(l => COMP[l.id].role === r); if (!L.length) return ''; const tot = L.reduce((a, l) => a + (state.have[l.id] ? 0 : l.pick.cost), 0);
      return `<details class="card group g-${r}" ${['brain', 'senses', 'limbs'].includes(r) ? 'open' : ''}><summary class="groupHead">${roleTag(r)}<span class="small">${ROLES[r].what}</span><span class="gTot">${money0(tot)}</span></summary>${L.map(lineRow).join('')}</details>`; }).join('')}
    ${proto.length ? `<details class="card group g-nerves"><summary class="groupHead"><span class="role role-nerves">Prototype</span><span class="small">for testing on a breadboard</span><span class="gTot">${money0(P.proto)}</span></summary>${proto.map(lineRow).join('')}</details>` : ''}
    <details class="card group g-tools"><summary class="groupHead">${roleTag('tools')}<span class="small">one time, not in the estimate</span><span class="gTot">${money0(P.tools)}</span></summary>${tools.map(lineRow).join('')}</details>
    <div class="card note">
      <p><b>Where these numbers come from.</b> Prices are Nociv estimates from typical store prices (${CZ_CONFIG.priceDate}), not live prices. The best pick is the cheapest way to buy the quantity you need, counting pack sizes and shipping. Always check the store before you buy.</p>
      <p class="small">As an Amazon Associate, Nociv earns from qualifying purchases. Some links may earn Nociv a small commission at no cost to you.</p>
    </div>`;
}
function orderTab(lines, P) {
  const buy = lines.filter(l => !state.have[l.id]);
  const byStore = {};
  for (const l of buy) { const k = l.pick.name; (byStore[k] = byStore[k] || { name: k, days: l.pick.days, overseas: l.pick.overseas, items: [] }).items.push(l); }
  const groups = Object.values(byStore).sort((a, b) => b.items.length - a.items.length);
  const done = buy.filter(l => state.ordered[l.id]).length;
  return `
    <div class="card orderTop"><div><h3>${done === buy.length && buy.length ? 'Everything is ordered' : `${done} of ${buy.length} ordered`}</h3><p class="small">${groups.length ? `${plural(groups.length, 'store')}. Open each link, add it to your cart, then tick it off here. Your ticks save with your build.` : 'You already have everything.'}</p></div>
      <div class="progress"><i style="width:${buy.length ? done / buy.length * 100 : 100}%"></i></div>
      <div class="row"><button class="btn small" id="csvBtn">Download full list (CSV)</button></div></div>
    ${groups.map(g => { const sub = g.items.reduce((a, l) => a + l.pick.cost, 0), ship = CZ_CONFIG.shipping[Object.keys(STORES).find(k => STORES[k].name === g.name)] ?? CZ_CONFIG.shipping.other;
      return `<div class="card storeCard"><div class="storeHead"><div><h3>${esc(g.name)}</h3><span class="small">${plural(g.items.length, 'item')} · ${money0(sub)} + about ${money0(ship)} shipping${g.days ? ' · arrives in ' + g.days : ''}</span>${g.overseas ? '<span class="small warnTxt">Import charges may be added at checkout or collected before delivery.</span>' : ''}</div>
        <button class="btn small ghost" data-copy="${esc(g.name)}">Copy list</button></div>
        ${g.items.map(l => `<label class="orderRow ${state.ordered[l.id] ? 'done' : ''}"><input type="checkbox" data-ordered="${l.id}" ${state.ordered[l.id] ? 'checked' : ''}>
          <span class="oName">${esc(COMP[l.id].name)}${l.pick.packs > 1 ? ` <span class="qty">×${l.pick.packs} packs</span>` : l.qty > 1 && l.pick.pack === 1 ? ` <span class="qty">×${l.qty}</span>` : ''}<small>${esc(variant(l.id).label)}${l.group === 'tools' ? ' · tool' : ''}</small></span>
          <span class="oCost">${money(l.pick.cost)}</span><a class="btn small primary" href="${esc(l.pick.url)}" target="_blank" rel="noopener sponsored">Open</a></label>`).join('')}
      </div>`; }).join('')}
    <p class="small">Links open a search for the exact part. Pick a listing that matches the description and quantity.</p>`;
}
function bindCost() {
  $$('#priceMode button').forEach(bt => bt.onclick = () => { state.priceMode = bt.dataset.v; state.variantPick = {}; renderParts(); });
  $$('.variant').forEach(sel => sel.onchange = () => { state.variantPick[sel.dataset.id] = +sel.value; renderParts(); });
  $$('[data-have]').forEach(cb => cb.onchange = () => { state.have[cb.dataset.have] = cb.checked; renderParts(); });
  const ov = $('#overseasT'); if (ov) ov.onchange = () => { state.overseas = ov.checked; renderParts(); toast(ov.checked ? 'Overseas stores added' : 'Overseas stores removed'); };
  $$('[data-ordered]').forEach(cb => cb.onchange = () => { state.ordered[cb.dataset.ordered] = cb.checked; cb.closest('.orderRow').classList.toggle('done', cb.checked); setTimeout(renderParts, 180); });
  const { lines } = bom(); priceBom(lines);
  const buy = lines.filter(l => !state.have[l.id]);
  $$('[data-copy]').forEach(bt => bt.onclick = () => copyText(buy.filter(l => l.pick.name === bt.dataset.copy).map(l => `${l.pick.packs > 1 ? l.pick.packs + ' packs' : l.qty + '×'} ${COMP[l.id].name} (${variant(l.id).label}) ${l.pick.url}`).join('\n'), 'List copied'));
  const csv = $('#csvBtn'); if (csv) csv.onclick = () => {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['Part', 'Version', 'Quantity needed', 'Packs to buy', 'Store', 'Estimated cost', 'Link', 'Why']].concat(buy.map(l => [COMP[l.id].name, variant(l.id).label, l.qty, l.pick.packs, l.pick.name, l.pick.cost.toFixed(2), l.pick.url, l.why.join('; ')]));
    download(slug() + '-order.csv', rows.map(r => r.map(q).join(',')).join('\n'), 'text/csv');
  };
}

/* ---- 6 Code & test ---- */
const CODE_NAMES = { tact12: 'button', tact6: 'button', arcade24: 'button', arcade30: 'button', footsw: 'button', toggle: 'switch', pot: 'knob', slidepot: 'slider', encoder: 'encoder', thumb: 'stick', joystick: 'joy', piezo: 'pad', soil: 'soil', led5: 'led', strip: 'strip' };
function codeParts() {
  const plan = pinPlan(), n = {}, out = [];
  const num = s => { const m = String(s).match(/(\d+)$/); return m ? +m[1] : null; };
  for (const r of plan.rows) {
    const base = CODE_NAMES[r.id]; if (!base) { out.push({ kind: 'note', r }); continue; }
    n[base] = (n[base] || 0) + 1;
    const total = plan.rows.filter(x => CODE_NAMES[x.id] === base).length;
    const name = total > 1 ? `${base}_${n[base]}` : base, label = base[0].toUpperCase() + base.slice(1) + (total > 1 ? ' ' + n[base] : '');
    const pins = r.pins.map(p => ({ raw: p, n: num(p), mux: /^mux C(\d+)/.test(p) ? +p.match(/C(\d+)/)[1] : null, ads: /^ADS/.test(p), analogName: /^A\d+$/.test(p) ? p : null }));
    out.push({ kind: base, id: r.id, name, label, pins, r });
  }
  return { plan, parts: out };
}
function pyAnalog(p, esp) {
  if (p.mux != null) return { init: null, read: `read_mux(${p.mux})` };
  if (p.ads) return { init: null, read: '0  # read this input from the ADS1115 (see note at top)' };
  return { init: `ADC(Pin(${p.n})${esp ? ', atten=ADC.ATTN_11DB' : ''})`, read: null };
}
function genMicroPython(b, parts, plan, map) {
  const esp = b.pinFamily === 'esp', L = [], setup = [], loop = [], notes = [];
  L.push(`# ${state.name}: starter code from Case Zero Builder (nociv.co)`, `# Brain: ${COMP[b.id].name}. This checks every part you wired.`, `# Press buttons and turn knobs, then watch the messages in the Shell window.`, '');
  const imp = new Set(['from machine import Pin, ADC', 'import time']);
  const hasMux = parts.some(p => p.pins?.some(x => x.mux != null)), hasAds = parts.some(p => p.pins?.some(x => x.ads));
  if (plan.bus.includes('i2c')) { imp.add('from machine import I2C'); setup.push(`i2c = I2C(0, sda=Pin(${map.i2c.SDA}), scl=Pin(${map.i2c.SCL}))`, `print('I2C parts found:', [hex(a) for a in i2c.scan()])  # screens and sensors show up here`); }
  if (parts.some(p => p.kind === 'strip')) imp.add('import neopixel');
  L.push(...imp, '');
  if (hasMux) {
    const r = plan.rows.find(x => x.id === 'mux16'), nums = [...r.how.matchAll(/→ [A-Z]*?(\d+)/g)].map(m => +m[1]);
    L.push('# Analog mux: lets one analog pin read up to 16 knobs or pads', `mux_select = [Pin(p, Pin.OUT) for p in (${nums.slice(0, 4).join(', ')})]`, `mux_signal = ADC(Pin(${nums[4]})${esp ? ', atten=ADC.ATTN_11DB' : ''})`,
      'def read_mux(channel):', '    for i, pin in enumerate(mux_select):', '        pin.value((channel >> i) & 1)', '    time.sleep_us(50)', '    return mux_signal.read_u16()', '');
  }
  if (hasAds) notes.push('This brain has no analog pins, so knobs go through an ADS1115. Install an "ads1115" MicroPython driver and replace the 0 readings below.');
  L.push('def percent(raw):', '    return round(raw * 100 / 65535)', '', 'last = {}', 'def changed(name, value, step=0):', '    old = last.get(name)', '    if old is None or abs(value - old) > step:', '        last[name] = value', '        return old is not None', '    return False', '');
  const leds = parts.filter(p => p.kind === 'led'), strip = parts.find(p => p.kind === 'strip');
  for (const p of parts) {
    const P = p.pins || [];
    if (['button', 'switch'].includes(p.kind)) { setup.push(`${p.name} = Pin(${P[0].n}, Pin.IN, Pin.PULL_UP)`); loop.push(`    if changed('${p.name}', ${p.name}.value()) and ${p.name}.value() == 0:`, `        print('${p.label} pressed')`, '        react()'); }
    else if (['knob', 'slider', 'pad', 'soil'].includes(p.kind)) {
      const a = pyAnalog(P[0], esp); if (a.init) setup.push(`${p.name} = ${a.init}`);
      const rd = a.read || `${p.name}.read_u16()`;
      if (p.kind === 'pad') loop.push(`    hit = percent(${rd})`, `    if hit > 20 and changed('${p.name}', hit, 15):`, `        print('${p.label} hit:', hit, '%')`, '        react()');
      else loop.push(`    value = percent(${rd})`, `    if changed('${p.name}', value, 2):`, `        print('${p.label}:', value, '%')`);
    }
    else if (p.kind === 'stick') { const ax = pyAnalog(P[0], esp), ay = pyAnalog(P[1], esp); if (ax.init) setup.push(`${p.name}_x = ${ax.init}`); if (ay.init) setup.push(`${p.name}_y = ${ay.init}`); setup.push(`${p.name}_press = Pin(${P[2].n}, Pin.IN, Pin.PULL_UP)`);
      loop.push(`    x, y = percent(${ax.read || p.name + '_x.read_u16()'}), percent(${ay.read || p.name + '_y.read_u16()'})`, `    if changed('${p.name}_x', x, 5) or changed('${p.name}_y', y, 5):`, `        print('${p.label}:', x, y)`, `    if changed('${p.name}_press', ${p.name}_press.value()) and ${p.name}_press.value() == 0:`, `        print('${p.label} pressed')`); }
    else if (p.kind === 'joy') { ['up', 'down', 'left', 'right'].forEach((d, i) => { setup.push(`${p.name}_${d} = Pin(${P[i].n}, Pin.IN, Pin.PULL_UP)`); loop.push(`    if changed('${p.name}_${d}', ${p.name}_${d}.value()) and ${p.name}_${d}.value() == 0:`, `        print('${p.label} ${d}')`); }); }
    else if (p.kind === 'encoder') { setup.push(`${p.name}_a = Pin(${P[0].n}, Pin.IN, Pin.PULL_UP)`, `${p.name}_b = Pin(${P[1].n}, Pin.IN, Pin.PULL_UP)`, `${p.name}_press = Pin(${P[2].n}, Pin.IN, Pin.PULL_UP)`);
      loop.push(`    if changed('${p.name}_a', ${p.name}_a.value()) and ${p.name}_a.value() == 0:`, `        print('${p.label} turned', 'right' if ${p.name}_b.value() else 'left')`, `    if changed('${p.name}_press', ${p.name}_press.value()) and ${p.name}_press.value() == 0:`, `        print('${p.label} pressed')`); }
    else if (p.kind === 'led') setup.push(`${p.name} = Pin(${P[0].n}, Pin.OUT)`);
    else if (p.kind === 'strip') setup.push(`${p.name} = neopixel.NeoPixel(Pin(${P[0].n}), 60)`);
    else if (p.kind === 'note') {
      const r = p.r;
      if (r.signal.startsWith('SPI')) notes.push(`${r.label}: ${r.how} Install a driver for your screen (search "MicroPython ILI9341") to draw on it.`);
      else if (r.id === 'oled') notes.push(`${r.label}: shows up in the I2C scan. Install the "sh1106" driver to draw text on it.`);
      else if (r.signal.includes('I2S')) notes.push(`${r.label}: ${r.how} Sound uses MicroPython's I2S: docs.micropython.org/en/latest/library/machine.I2S.html`);
      else if (r.id === 'bme280') notes.push(`${r.label}: shows up in the I2C scan. Install a "bme280" driver to read it.`);
    }
  }
  if (notes.length) L.splice(3, 0, ...notes.map(n => '# NOTE: ' + n), '');
  L.push('# ---- set up every part ----', ...setup, '');
  L.push('colors = [(40, 0, 0), (0, 40, 0), (0, 0, 40), (30, 20, 0)]', 'color = 0', 'def react():', '    """Something was pressed: flip the lights."""', '    global color');
  leds.forEach(l => L.push(`    ${l.name}.value(not ${l.name}.value())`));
  if (strip) L.push(`    color = (color + 1) % len(colors)`, `    ${strip.name}.fill(colors[color])`, `    ${strip.name}.write()`);
  if (!leds.length && !strip) L.push('    pass  # add lights to see a reaction');
  L.push('', `print('${state.name.replace(/'/g, '')} is alive.')`, 'while True:', ...(loop.length ? loop : ['    pass']), '    time.sleep_ms(20)', '');
  return L.join('\n');
}
function genArduino(b, parts, plan, map) {
  const L = [], setup = [], loop = [], globals = [], notes = [];
  const pin = p => p.analogName || p.n;
  L.push(`// ${state.name}: starter code from Case Zero Builder (nociv.co)`, `// Brain: ${COMP[b.id].name}. This checks every part you wired.`, '// Open Tools > Serial Monitor at 115200 baud, then press buttons and turn knobs.', '');
  const strip = parts.find(p => p.kind === 'strip');
  if (plan.bus.includes('i2c')) L.push('#include <Wire.h>');
  if (strip) { L.push('#include <Adafruit_NeoPixel.h>  // install "Adafruit NeoPixel" from the Library Manager'); globals.push(`Adafruit_NeoPixel ${strip.name}(60, ${pin(strip.pins[0])}, NEO_GRB + NEO_KHZ800);`); }
  const hasMux = parts.some(p => p.pins?.some(x => x.mux != null));
  if (hasMux) { const r = plan.rows.find(x => x.id === 'mux16'), nums = [...r.how.matchAll(/→ (A?\d+|D\d+|[A-Z]+\d+)/g)].map(m => m[1].replace(/^D/, ''));
    globals.push(`const int MUX_SELECT[4] = {${nums.slice(0, 4).join(', ')}};`, `const int MUX_SIGNAL = ${nums[4]};`, 'int readMux(int channel) {', '  for (int i = 0; i < 4; i++) digitalWrite(MUX_SELECT[i], (channel >> i) & 1);', '  delayMicroseconds(50);', '  return analogRead(MUX_SIGNAL);', '}');
    setup.push('  for (int i = 0; i < 4; i++) pinMode(MUX_SELECT[i], OUTPUT);'); }
  const aread = p => p.mux != null ? `readMux(${p.mux})` : `analogRead(${pin(p)})`;
  const leds = parts.filter(p => p.kind === 'led');
  for (const p of parts) {
    const P = p.pins || [], N = (p.name || '').toUpperCase();
    if (['button', 'switch'].includes(p.kind)) { globals.push(`const int ${N} = ${pin(P[0])};`, `int last_${p.name} = HIGH;`); setup.push(`  pinMode(${N}, INPUT_PULLUP);`);
      loop.push(`  int ${p.name}_now = digitalRead(${N});`, `  if (${p.name}_now != last_${p.name}) {`, `    last_${p.name} = ${p.name}_now;`, `    if (${p.name}_now == LOW) { Serial.println("${p.label} pressed"); react(); }`, '  }'); }
    else if (['knob', 'slider', 'pad', 'soil'].includes(p.kind)) { globals.push(`int last_${p.name} = -100;`);
      if (p.kind === 'pad') loop.push(`  int ${p.name}_now = ${aread(P[0])} * 100L / 1023;`, `  if (${p.name}_now > 20 && abs(${p.name}_now - last_${p.name}) > 15) { Serial.print("${p.label} hit: "); Serial.println(${p.name}_now); react(); }`, `  last_${p.name} = ${p.name}_now;`);
      else loop.push(`  int ${p.name}_now = ${aread(P[0])} * 100L / 1023;`, `  if (abs(${p.name}_now - last_${p.name}) > 2) { last_${p.name} = ${p.name}_now; Serial.print("${p.label}: "); Serial.print(${p.name}_now); Serial.println("%"); }`); }
    else if (p.kind === 'stick') { globals.push(`int last_${p.name}_x = -100, last_${p.name}_y = -100;`, `const int ${N}_PRESS = ${pin(P[2])};`); setup.push(`  pinMode(${N}_PRESS, INPUT_PULLUP);`);
      loop.push(`  int ${p.name}_x = ${aread(P[0])} * 100L / 1023, ${p.name}_y = ${aread(P[1])} * 100L / 1023;`, `  if (abs(${p.name}_x - last_${p.name}_x) > 5 || abs(${p.name}_y - last_${p.name}_y) > 5) { last_${p.name}_x = ${p.name}_x; last_${p.name}_y = ${p.name}_y; Serial.print("${p.label}: "); Serial.print(${p.name}_x); Serial.print(", "); Serial.println(${p.name}_y); }`); }
    else if (p.kind === 'joy') ['up', 'down', 'left', 'right'].forEach((d, i) => { const V = `${N}_${d.toUpperCase()}`; globals.push(`const int ${V} = ${pin(P[i])};`, `int last_${p.name}_${d} = HIGH;`); setup.push(`  pinMode(${V}, INPUT_PULLUP);`);
      loop.push(`  if (digitalRead(${V}) != last_${p.name}_${d}) { last_${p.name}_${d} = digitalRead(${V}); if (last_${p.name}_${d} == LOW) Serial.println("${p.label} ${d}"); }`); });
    else if (p.kind === 'encoder') { globals.push(`const int ${N}_A = ${pin(P[0])}, ${N}_B = ${pin(P[1])}, ${N}_PRESS = ${pin(P[2])};`, `int last_${p.name}_a = HIGH;`); setup.push(`  pinMode(${N}_A, INPUT_PULLUP); pinMode(${N}_B, INPUT_PULLUP); pinMode(${N}_PRESS, INPUT_PULLUP);`);
      loop.push(`  int ${p.name}_a = digitalRead(${N}_A);`, `  if (${p.name}_a != last_${p.name}_a && ${p.name}_a == LOW) Serial.println(digitalRead(${N}_B) ? "${p.label} turned right" : "${p.label} turned left");`, `  last_${p.name}_a = ${p.name}_a;`); }
    else if (p.kind === 'led') { globals.push(`const int ${N} = ${pin(P[0])};`); setup.push(`  pinMode(${N}, OUTPUT);`); }
    else if (p.kind === 'note') { const r = p.r; if (r.signal.startsWith('SPI')) notes.push(`${r.label}: ${r.how} Install a library for your screen (for example "Adafruit ILI9341").`); else if (r.id === 'oled') notes.push(`${r.label}: install the "U8g2" library to draw on it.`); else if (r.signal.includes('I2S')) notes.push(`${r.label}: this brain has no I2S port for sound.`); }
  }
  if (notes.length) L.splice(3, 0, ...notes.map(n => '// NOTE: ' + n), '');
  L.push(...globals, '', 'int color = 0;', 'void react() {');
  leds.forEach(l => L.push(`  digitalWrite(${l.name.toUpperCase()}, !digitalRead(${l.name.toUpperCase()}));`));
  if (strip) L.push('  color = (color + 1) % 4;', `  uint32_t c[4] = {${strip.name}.Color(40,0,0), ${strip.name}.Color(0,40,0), ${strip.name}.Color(0,0,40), ${strip.name}.Color(30,20,0)};`, `  ${strip.name}.fill(c[color]);`, `  ${strip.name}.show();`);
  L.push('}', '', 'void setup() {', '  Serial.begin(115200);', ...setup);
  if (strip) L.push(`  ${strip.name}.begin();`);
  if (plan.bus.includes('i2c')) L.push('  Wire.begin();', '  Serial.print("I2C parts found:");', '  for (byte a = 1; a < 127; a++) { Wire.beginTransmission(a); if (Wire.endTransmission() == 0) { Serial.print(" 0x"); Serial.print(a, HEX); } }', '  Serial.println();');
  L.push(`  Serial.println("${state.name.replace(/"/g, '')} is alive.");`, '}', '', 'void loop() {', ...loop, '  delay(20);', '}', '');
  return L.join('\n');
}
function genGpiozero(b, parts, plan) {
  const L = [], notes = [];
  L.push(`# ${state.name}: starter code from Case Zero Builder (nociv.co)`, `# Brain: ${COMP[b.id].name}. Run it with: python3 starter.py`, '');
  L.push('from gpiozero import Button, LED, RotaryEncoder', 'from signal import pause', '');
  const leds = parts.filter(p => p.kind === 'led'), body = [];
  for (const p of parts) {
    const P = p.pins || [];
    if (['button', 'switch'].includes(p.kind)) body.push(`${p.name} = Button(${P[0].n})`, `${p.name}.when_pressed = lambda: (print('${p.label} pressed'), react())`);
    else if (p.kind === 'joy') ['up', 'down', 'left', 'right'].forEach((d, i) => body.push(`${p.name}_${d} = Button(${P[i].n})`, `${p.name}_${d}.when_pressed = lambda: print('${p.label} ${d}')`));
    else if (p.kind === 'encoder') body.push(`${p.name} = RotaryEncoder(${P[0].n}, ${P[1].n})`, `${p.name}.when_rotated = lambda: print('${p.label}:', ${p.name}.steps)`, `${p.name}_press = Button(${P[2].n})`, `${p.name}_press.when_pressed = lambda: print('${p.label} pressed')`);
    else if (p.kind === 'led') body.push(`${p.name} = LED(${P[0].n})`);
    else if (['knob', 'slider', 'pad', 'soil', 'stick'].includes(p.kind)) { if (!notes.length) notes.push('Knobs and sensors go through the ADS1115 (the Pi has no analog pins). Install the "adafruit-circuitpython-ads1x15" library to read them.'); }
    else if (p.kind === 'strip') notes.push('LED strip: install "adafruit-circuitpython-neopixel" and run with sudo.');
    else if (p.kind === 'note' && p.r.signal.startsWith('HDMI')) notes.push('The 5" screen works as a normal monitor once Raspberry Pi OS is installed.');
  }
  if (notes.length) L.push(...notes.map(n => '# NOTE: ' + n), '');
  L.push(...body, '', 'def react():', '    """Something was pressed: flip the lights."""');
  leds.forEach(l => L.push(`    ${l.name}.toggle()`));
  if (!leds.length) L.push('    pass');
  L.push('', `print('${state.name.replace(/'/g, '')} is alive. Press Ctrl+C to stop.')`, 'pause()', '');
  return L.join('\n');
}
function starterCode() {
  const b = board(), t = BOARD_TOOLS[b.id], { plan, parts } = codeParts(), map = PINMAPS[b.pinFamily];
  if (t.lang === 'MicroPython') return { lang: 'MicroPython', file: 'main.py', code: genMicroPython(b, parts, plan, map) };
  if (t.lang === 'Arduino') return { lang: 'Arduino', file: slug().replace(/-/g, '_') + '.ino', code: genArduino(b, parts, plan, map) };
  if (t.lang === 'Python') return { lang: 'Python (gpiozero)', file: 'starter.py', code: genGpiozero(b, parts, plan) };
  return null;
}
function renderProto() {
  ensureLayout();
  const plan = pinPlan(), b = board(), bd = COMP[b.id].name, pr = state.proto, t = BOARD_TOOLS[b.id], sc = starterCode();
  const q = (PRESETS[state.preset] && state.preset !== 'scratch' ? PRESETS[state.preset].name : state.funcs.slice(0, 2).map(f => FL[f].short).join(' ')) + ' ' + bd.replace('Raspberry Pi ', '');
  const station = (key, n, title, text, body, locked) => `
    <div class="station ${pr[key] || locked ? 'on' : ''}">
      <div class="stHead"><span class="stNum">${n}</span><div><h3>${title}</h3><p>${text}</p></div>
        ${locked ? '<span class="pill">always</span>' : `<label class="switch"><input type="checkbox" data-st="${key}" ${pr[key] ? 'checked' : ''}><span></span></label>`}</div>
      ${pr[key] || locked ? `<div class="stBody">${body}</div>` : ''}
    </div>`;
  const wiring = `<div class="tableWrap"><table class="wire"><thead><tr><th>Part</th><th>Signal</th><th>Connect it</th></tr></thead><tbody>${plan.rows.map(r => `<tr><td><span class="dot d-${r.role}"></span>${esc(r.label)}</td><td class="mono">${esc(r.signal)}</td><td>${esc(r.how)}</td></tr>`).join('')}</tbody></table></div>`;
  $('#v-proto').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 6</div><h1>Code & test</h1><p class="lead">Your starter code is written for your exact wiring. Try it free in a simulator, then on your real board. For bigger ideas, borrow from projects other makers already shared.</p></div></div>
    ${plan.issues.map(i => `<div class="alert ${i.level}">${esc(i.msg)}</div>`).join('')}
    <div class="codeGrid">
      <div class="card codeCard">
        <div class="codeHead"><div><h3>Starter code</h3><span class="small">${sc ? `${esc(sc.lang)} · ${esc(sc.file)} · tests every part` : esc(t.lang)}</span></div>
          ${sc ? '<div class="row"><button class="btn small" id="copyCode">Copy</button><button class="btn small ghost" id="dlCode">Download</button></div>' : ''}</div>
        ${sc ? `<pre class="code"><code>${esc(sc.code)}</code></pre>` : `<p>The Daisy is programmed in C++. The fastest start is loading a ready-made example with the Daisy web programmer, then changing it.</p>`}
      </div>
      <div class="stack">
        ${t.sim ? `<div class="card toolCard"><div class="eyebrow">Free · no parts needed</div><h3>Try it in Wokwi</h3>
          <ol class="checks tight"><li>Open a new ${esc(t.lang)} project.</li><li>Paste your starter code into <span class="mono">${sc ? esc(sc.file === 'main.py' ? 'main.py' : 'sketch.ino') : ''}</span>.</li><li>Add the same parts with the + button and wire them like the table below.</li><li>Press play.</li></ol>
          <a class="btn primary" href="${t.sim}" target="_blank" rel="noopener">Open Wokwi</a>${t.simNote ? `<p class="small">${esc(t.simNote)}</p>` : ''}</div>` : `<div class="card toolCard"><h3>Simulator</h3><p class="small">Browser simulators don't cover the ${esc(bd)} yet. Test on the real board with the steps below.</p></div>`}
        <div class="card toolCard"><h3>On your real board</h3><ol class="checks tight">${t.setup.map(([l, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join('')}<li>Load your starter code and watch for the messages.</li></ol></div>
        <div class="card toolCard"><h3>Projects like this</h3><p class="small">Real builds other makers shared, with their code.</p><div class="row">${PROJECT_SEARCH.map(([n, u]) => `<a class="btn small ghost" href="${u(q)}" target="_blank" rel="noopener">${n}</a>`).join('')}</div></div>
      </div>
    </div>
    <h2 class="secHead">Build it for real</h2>
    <div class="line4">
      ${station('breadboard', 1, 'Breadboard first', 'Push wires into a breadboard. Nothing is permanent.', `${wiring}
        <ol class="checks"><li>Wire the brain's power and ground first, then one part at a time.</li><li>Run the starter code after each part. It tells you when it sees a press or a turn.</li><li>If a part stays quiet, check the wire against the table. Most problems are a loose wire or a swapped pin.</li></ol>`)}
      ${station('pcb', 2, 'Make a circuit board (optional)', 'Turn the breadboard into a real board you order online.', `
        <ol class="checks"><li>Draw the schematic in <a href="https://www.kicad.org" target="_blank" rel="noopener">KiCad</a> or <a href="https://easyeda.com" target="_blank" rel="noopener">EasyEDA</a> (both free). Copy the connections from the table above.</li>
        <li>Lay out the board, then export Gerber files.</li><li>Upload them to <a href="https://jlcpcb.com" target="_blank" rel="noopener">JLCPCB</a> for a live quote. Five small boards usually cost a few dollars plus shipping.</li></ol>`)}
      ${station('final', 3, 'Final wiring', 'How the nerves live inside the body.', `<div class="chips" id="finalR">${[['perf', 'Perfboard (solder it by hand)'], ['pcb', 'My own circuit board'], ['jumper', 'Keep jumper wires']].map(([v, l]) => `<button class="chip ${pr.final === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>`, true)}
    </div>`;
  $$('[data-st]').forEach(cb => cb.onchange = () => { pr[cb.dataset.st] = cb.checked; if (cb.dataset.st === 'pcb' && cb.checked && pr.final === 'perf') pr.final = 'pcb'; renderProto(); });
  $$('#finalR .chip').forEach(c => c.onclick = () => { pr.final = c.dataset.v; renderProto(); });
  if (sc) { $('#copyCode').onclick = () => copyText(sc.code, 'Code copied'); $('#dlCode').onclick = () => download(sc.file, sc.code); }
}

/* ---- 7 Save & print ---- */
function renderSave() {
  ensureLayout();
  const { lines, plan } = bom(), P = priceBom(lines), s = size(), issues = bodyIssues(plan), errs = issues.filter(i => i.level === 'err');
  const outer = `${s.cols * CELL + 2 * SHELL.wall}×${s.rows * CELL + 2 * SHELL.wall}mm`;
  const files = [];
  for (const p of activePanels()) { files.push(['tray-' + p, `${p === 'lid' ? 'Lid' : 'Base'} shell`, `${outer}, ${p === 'lid' ? s.lidDepth : s.baseDepth}mm tall`]); files.push(['panel-' + p, `${p === 'lid' ? 'Lid' : 'Base'} panel`, '3mm plate with cutouts']); }
  $('#v-save').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 7</div><h1>Save & print</h1><p class="lead">${esc(state.name)} · ${s.name} ${STYLES[state.body.style].name.toLowerCase()} · ${esc(COMP[board().id].name)} · about ${money0(P.total)}</p></div></div>
    ${errs.length ? `<div class="alert err">${plural(errs.length, 'problem')} to fix in Body before printing. You can still download.</div>` : ''}
    <div class="two">
      <div class="card"><h3>Your build file</h3><p class="small">Saves everything, like a Tinkercad project. Open it here any time to keep working.</p>
        <label class="field">Name<input id="saveName" value="${esc(state.name)}" maxlength="40"></label>
        <div class="row"><button class="btn primary" id="saveBtn">Save build file</button><label class="btn ghost fileBtn">Open build file<input type="file" accept=".json,.casezero" id="openFile2"></label><button class="btn ghost" id="linkBtn">Copy share link</button></div></div>
      <div class="card"><h3>Print files (STL)</h3><p class="small">Free to print. Open them in a slicer, or import into Tinkercad to change them.</p>
        <div class="files">${files.map(([k, t, d]) => `<button class="fileRow" data-stl="${k}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>
        <p class="small">Filament: about ${P.fil.grams}g of PLA (${money(P.fil.cost)}), roughly ${P.fil.hours}h of printing.</p></div>
    </div>
    <div class="card"><h3>How to print it</h3>
      <ol class="checks">
        <li>Open each STL in a free slicer: <a href="https://ultimaker.com/software/ultimaker-cura/" target="_blank" rel="noopener">Cura</a>, <a href="https://www.prusa3d.com/page/prusaslicer_424/" target="_blank" rel="noopener">PrusaSlicer</a> or <a href="https://github.com/SoftFever/OrcaSlicer" target="_blank" rel="noopener">OrcaSlicer</a>.</li>
        <li>Shells print open side up and panels print flat. No supports needed.</li>
        <li>Start with PLA or PETG, 0.2mm layers, 3 walls, 20% infill.</li>
        <li>Press a magnet into each corner pocket with a drop of super glue. Glue a steel disc under each panel corner.</li>
        <li>Mark and drill 2mm pilot holes for the hinges, latch and handle, then screw them on.</li>
      </ol>
      <p class="small">Outside size ${outer}. ${Math.max(s.cols, s.rows) * CELL + 2 * SHELL.wall > CZ_CONFIG.printBed ? `That is bigger than a ${CZ_CONFIG.printBed}mm bed.` : `Fits a ${CZ_CONFIG.printBed}mm bed.`}</p></div>
    <div class="two">
      <div class="card"><h3>No printer?</h3><p>Many city libraries and makerspaces offer 3D printing for a small fee. Bring the STL files on a USB stick.</p>
        <p class="small">Online print services like Craftcloud or JLC3DP also print from STL and ship to you.</p>
        <button class="btn" disabled>Order a printed shell from Nociv · coming soon</button></div>
      <div class="card"><h3>Panels in metal or acrylic</h3><p>Download the panels as DXF and upload them to <a href="https://sendcutsend.com" target="_blank" rel="noopener">SendCutSend</a> to laser-cut them in aluminum, steel or acrylic. They cut flat sheets, not 3D prints.</p>
        <div class="row">${activePanels().map(p => `<button class="btn ghost" data-dxf="${p}">${p === 'lid' ? 'Lid' : 'Base'} panel .dxf</button>`).join('')}</div></div>
    </div>`;
  $('#saveName').oninput = e => { state.name = e.target.value || 'My build'; };
  $('#saveBtn').onclick = () => download(slug() + '.casezero.json', JSON.stringify(snapshot(), null, 2), 'application/json');
  $('#openFile2').onchange = e => openFile(e.target.files[0]);
  $('#linkBtn').onclick = () => copyText(location.origin + location.pathname + '#b=' + btoa(unescape(encodeURIComponent(JSON.stringify(snapshot())))), 'Share link copied');
  $$('[data-stl]').forEach(bt => bt.onclick = () => { const [kind, p] = bt.dataset.stl.split('-'); const f = heightMesh(kind === 'tray' ? trayShape(p) : panelShape(p)); download(`${slug()}-${state.body.size.toLowerCase()}-${p}-${kind === 'tray' ? 'shell' : 'panel'}.stl`, toSTL(`case_zero_${p}_${kind}`, f), 'model/stl'); });
  $$('[data-dxf]').forEach(bt => bt.onclick = () => download(`${slug()}-${state.body.size.toLowerCase()}-${bt.dataset.dxf}-panel.dxf`, toDXF(bt.dataset.dxf), 'application/dxf'));
}
const slug = () => (state.name || 'case-zero').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'case-zero';

/* ---------- save / open ---------- */
function snapshot() { const { step, sim, savePick, costTab, ...rest } = state; return { app: 'case-zero', v: 5, ...JSON.parse(JSON.stringify(rest)) }; }
function applySnapshot(d) {
  if (!d || d.app !== 'case-zero') throw new Error('not a Case Zero file');
  if (!(d.v >= 5)) throw new Error('old file');
  const base = freshState();
  state = { ...base, ...d, needs: { ...base.needs, ...d.needs }, proto: { ...base.proto, ...d.proto }, body: { ...base.body, ...d.body }, sim: base.sim, step: 'body' };
  if (!PRESETS[state.preset]) state.preset = 'scratch';
  if (!SIZES[state.body.size]) state.body.size = 'M';
  if (state.boardPick && !BOARD[state.boardPick]) state.boardPick = null;
  const map = {};
  state.bench = (d.bench || []).filter(i => TRAYMAP[i.kind + ':' + i.ref]).map(i => { const n = { ...i, bid: ++uid, tried: true }; map[i.bid] = n.bid; return n; });
  state.panels = { lid: [], base: [] };
  for (const p of ['lid', 'base']) state.panels[p] = ((d.panels || {})[p] || []).filter(pl => FP[pl.fp] && map[pl.bid]).map(pl => ({ bid: map[pl.bid], fp: pl.fp, x: pl.x | 0, y: pl.y | 0, rot: pl.rot ? 1 : 0 }));
  state.touched = true;
  syncFuncs();
}
function openFile(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => { try { applySnapshot(JSON.parse(r.result)); go('body'); toast(`Opened ${state.name}`); } catch (e) { toast(e.message === 'old file' ? 'That file is from an older version. Start again from a preset.' : 'That file is not a Case Zero build.'); } };
  r.readAsText(file);
}
function loadFromHash() {
  const m = location.hash.match(/#b=(.+)/); if (!m) return false;
  try { applySnapshot(JSON.parse(decodeURIComponent(escape(atob(m[1]))))); return true; } catch (e) { return false; }
}

/* ---------- navigation with smooth transitions ---------- */
const RENDER = { make: renderMake, circuit: renderCircuit, body: renderBody, sim: renderSim, parts: renderParts, proto: renderProto, save: renderSave };
function go(step) {
  if (step !== 'make' && !state.preset) selectPresetSilent('scratch');
  const from = STEPS.findIndex(s => s[0] === state.step), to = STEPS.findIndex(s => s[0] === step);
  state.step = step;
  $$('.view').forEach(v => v.classList.remove('active', 'fwd', 'back'));
  RENDER[step]();
  const view = $('#v-' + step); void view.offsetWidth;
  view.classList.add('active', to >= from ? 'fwd' : 'back');
  renderSteps();
  $('#backBtn').style.visibility = to === 0 ? 'hidden' : 'visible';
  $('#nextBtn').style.visibility = to === STEPS.length - 1 ? 'hidden' : 'visible';
  if (to < STEPS.length - 1) $('#nextBtn').textContent = `Next: ${STEPS[to + 1][1]}`;
  window.scrollTo({ top: 0 });
}
$('#backBtn').onclick = () => { const i = STEPS.findIndex(s => s[0] === state.step); if (i > 0) go(STEPS[i - 1][0]); };
$('#nextBtn').onclick = () => { const i = STEPS.findIndex(s => s[0] === state.step); if (i < STEPS.length - 1) go(STEPS[i + 1][0]); };
let rsT; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { if (ui.mode) renderMode(); }, 120); });
go(loadFromHash() ? 'body' : 'make');
