/* ==========================================================================
   CASE ZERO BUILDER — APP
   Reads everything from case-zero-data.js. No libraries, no build step.
   Steps: Make → Define → Parts & cost → Prototype → Body → Power on → Save & print
   ========================================================================== */

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => '$' + (Math.round(v * 100) / 100).toFixed(2);
const money0 = v => '$' + Math.round(v);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }
function download(name, text, type = 'text/plain') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); }
function copyText(text, msg) { if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => toast(msg), () => prompt('Copy this:', text)); else prompt('Copy this:', text); }
const art = (key, label) => `<div class="art" data-art="${esc(key)}"><img src="case-zero-art-${esc(key)}.png" alt="" onerror="this.remove()"><span class="artLabel">${esc(label)}</span></div>`;
const roleTag = r => `<span class="role role-${r}">${ROLES[r].name}</span>`;

const FL = Object.fromEntries(FUNCS.map(f => [f.id, f]));
const BOARD = Object.fromEntries(BOARDS.map(b => [b.id, b]));
const STEPS = [['make', 'Make'], ['define', 'Define'], ['parts', 'Parts & cost'], ['proto', 'Prototype'], ['body', 'Body'], ['sim', 'Power on'], ['save', 'Save & print']];

/* ---------- state ---------- */
function freshState() {
  return {
    step: 'make', name: 'My build', preset: null, funcs: [], conn: 'usb', budget: 2, boardPick: null,
    priceMode: 'bal', variantPick: {}, have: {},
    proto: { sim: true, breadboard: true, pcb: false, final: 'perf' },
    body: { size: 'M', style: 'briefcase', hinge: 'back', latch: 1, handle: true, lock: false, stay: true, feet: true, battery: 'none', batteryAuto: true },
    panels: { lid: [], base: [] }, panel: 'base', sel: null, mode: null, touched: false,
    sim: { on: false, lit: {}, screen: '', log: [], vals: {} }
  };
}
let state = freshState();
let uid = 0;

/* ==========================================================================
   RULES ENGINE — which brain fits
   ========================================================================== */
function scoreBoards() {
  const f = state.funcs, needWifi = state.conn.includes('wifi'), needBt = state.conn.includes('bt');
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
    if (needWifi && !b.wifi) { s -= 80; cons.push('no Wi-Fi'); }
    if (needBt && !b.bt) { s -= 80; cons.push('no Bluetooth'); }
    if (b.tier > state.budget) { s -= (b.tier - state.budget) * 25; cons.push('above your budget'); }
    s -= b.tier * 3;
    return { b, s, pros, good, cons };
  }).sort((a, c) => c.s - a.s);
}
function chosen() { const r = scoreBoards(); return r.find(x => x.b.id === state.boardPick) || r[0]; }
const board = () => chosen().b;

/* ==========================================================================
   LAYOUT — footprints on the grid
   ========================================================================== */
const activePanels = () => state.body.style === 'briefcase' ? ['lid', 'base'] : ['base'];
const size = () => SIZES[state.body.size];
function panelNeeds() {
  const p = PRESETS[state.preset];
  let list;
  if (p && p.panel) list = p.panel.map(([panel, fp, qty]) => ({ panel, fp, qty }));
  else {
    const f = state.funcs, n = [], add = (panel, fp, qty) => n.push({ panel, fp, qty });
    if (f.includes('video')) add('lid', 'hdmi5', 1); else if (f.includes('display')) add('lid', 'oled', 1);
    if (f.includes('hid')) add('base', 'dpad', 1);
    if (f.includes('buttons')) add('base', 'tact12', 4);
    if (f.includes('knobs')) add('base', 'pot', 2);
    if (f.includes('sound')) add('base', 'speaker', 1);
    if (f.includes('leds')) add('base', 'led5', 2);
    if (f.includes('dsp')) add('base', 'jack', 2);
    if (f.includes('battery')) add('base', 'usbc', 1);
    list = n;
  }
  if (state.body.style === 'box') list = list.map(n => ({ ...n, panel: 'base' }));
  const merged = [];
  for (const n of list) { const e = merged.find(m => m.panel === n.panel && m.fp === n.fp); if (e) e.qty += n.qty; else merged.push({ ...n }); }
  return merged;
}
function isMagnet(x, y) { const s = size(); return (x === 0 || x === s.cols - 1) && (y === 0 || y === s.rows - 1); }
function dims(fp, rot) { const d = FP[fp]; return rot ? { w: d.h, h: d.w } : { w: d.w, h: d.h }; }
function fits(panel, fp, x, y, rot, ignoreId) {
  const s = size(), { w, h } = dims(fp, rot);
  if (x < 0 || y < 0 || x + w > s.cols || y + h > s.rows) return 'runs off the edge of the panel';
  for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) if (isMagnet(i, j)) return 'corner squares hold the magnets';
  for (const o of state.panels[panel]) {
    if (o.id === ignoreId) continue;
    const od = dims(o.fp, o.rot);
    if (x < o.x + od.w && x + w > o.x && y < o.y + od.h && y + h > o.y) return `overlaps the ${FP[o.fp].name.toLowerCase()}`;
  }
  return null;
}
function placeFirst(panel, fp) {
  const s = size();
  for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) for (const rot of [0, 1])
    if (!fits(panel, fp, x, y, rot)) { state.panels[panel].push({ id: ++uid, fp, x, y, rot }); return true; }
  return false;
}
function autoArrange() {
  for (const panel of ['lid', 'base']) {
    state.panels[panel] = [];
    if (!activePanels().includes(panel)) continue;
    const items = [];
    for (const n of panelNeeds()) if (n.panel === panel) for (let k = 0; k < n.qty; k++) items.push(n.fp);
    items.sort((a, b) => FP[b].w * FP[b].h - FP[a].w * FP[a].h);
    items.forEach(fp => placeFirst(panel, fp));
  }
  state.sel = null; state.mode = null;
}
function recommendSize() {
  const needs = panelNeeds();
  for (const k of ['XS', 'S', 'M', 'L']) {
    const s = SIZES[k], usable = s.cols * s.rows - 4;
    let ok = true;
    for (const panel of activePanels()) {
      const items = needs.filter(n => n.panel === panel);
      const cells = items.reduce((a, n) => a + FP[n.fp].w * FP[n.fp].h * n.qty, 0);
      if (cells > usable * 0.7) ok = false;
      for (const n of items) { const d = FP[n.fp]; if (!((d.w <= s.cols && d.h <= s.rows - 2) || (d.h <= s.cols && d.w <= s.rows - 2) || (d.w <= s.cols - 2 && d.h <= s.rows) || (d.h <= s.cols - 2 && d.w <= s.rows))) ok = false; }
      const deep = Math.max(0, ...items.map(n => FP[n.fp].depth));
      const room = (panel === 'lid' ? s.lidDepth : s.baseDepth) - SHELL.floor - SHELL.panel - SHELL.disc;
      if (deep > room) ok = false;
    }
    if (ok) {
      const saveSize = state.body.size; state.body.size = k; autoArrange();
      const placedAll = needs.every(n => state.panels[n.panel].filter(i => i.fp === n.fp).length >= n.qty);
      state.body.size = saveSize;
      if (placedAll) return k;
    }
  }
  return 'L';
}
function ensureLayout() {
  if (!state.preset) selectPresetSilent('scratch');
  if (state.body.batteryAuto) state.body.battery = state.funcs.includes('battery') ? 'lipo' : 'none';
  if (!state.touched) { state.body.size = recommendSize(); autoArrange(); }
}

/* ==========================================================================
   BILL OF MATERIALS
   ========================================================================== */
function variantIdx(id) {
  const c = COMP[id], vs = c.variants;
  if (state.variantPick[id] != null && vs[state.variantPick[id]]) return state.variantPick[id];
  if (vs.length === 1) return 0;
  if (state.priceMode === 'save' && state.savePick?.[id] != null) return state.savePick[id];
  if (state.priceMode === 'save') { /* what you actually pay: cheapest pack, plus headers if you must solder them */ let bi = 0, bc = Infinity; vs.forEach((v, i) => { const u = Math.min(...v.src.map(s => s[1])) + (v.needsHeaders ? COMP.headers.variants[0].src[0][1] * (state.proto.breadboard ? 1 : 1) : 0); if (u < bc) { bc = u; bi = i; } }); return bi; }
  if (state.priceMode === 'best') { const i = vs.findIndex(v => v.tier === 'best'); if (i >= 0) return i; }
  const i = vs.findIndex(v => v.tier === 'bal'); return i >= 0 ? i : 0;
}
const variant = id => COMP[id].variants[variantIdx(id)];
function options(id, qty) {
  return variant(id).src.map(([store, price, pack, q, name, url]) => ({
    store, pack, packs: Math.ceil(qty / pack), cost: Math.ceil(qty / pack) * price,
    name: store === 'other' ? name : STORES[store].name,
    url: store === 'other' ? url : STORES[store].url(q)
  })).sort((a, b) => a.cost - b.cost);
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
  for (const p of panels) for (const inst of state.panels[p]) for (const [id, q] of FP[inst.fp].bom) add(L, id, q, `${p} panel`);
  const has = id => L.some(l => l.id === id);
  for (const [id, q] of (PRESETS[state.preset]?.inside || [])) add(L, id, q, 'inside the case');
  if (has('speaker') || f.includes('sound')) { if (!has('speaker')) add(L, 'speaker', 1, 'sound'); add(L, 'amp', 1, 'drives the speaker'); }
  if (f.includes('dsp') && b.id !== 'daisy') add(L, 'codec', 1, 'audio in and out');
  if (f.includes('mic')) add(L, 'mic', 1, 'hearing');
  if (f.includes('sensors') && !L.some(l => COMP[l.id].sim === 'sense')) add(L, 'bme280', 1, 'sensing');
  if (f.includes('leds') && !has('led5') && !has('strip')) add(L, 'strip', 1, 'lights');
  if (b.linux) add(L, 'sdcard', 1, 'holds the operating system');
  else if (f.includes('storage')) { add(L, 'sdmod', 1, 'storage'); add(L, 'sdcard', 1, 'storage'); }
  const bat = state.body.battery;
  if (bat !== 'none') { for (const id of BATTERIES[bat].comps) add(L, id, 1, 'power'); if (bat !== 'aa4') add(L, b.linux ? 'boost' : 'charger', 1, 'charges the battery'); }
  add(L, 'hookup', 1, 'nerves');
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
  if (state.body.latch || state.body.handle || state.body.lock || state.body.style === 'briefcase') need('pinvise', 'pilot holes for hardware');
  if (lines.some(l => ['arcade24', 'arcade30', 'joystick'].includes(l.id))) need('crimp', 'arcade buttons');
  return T;
}

/* ---------- pins: which nerve goes where ---------- */
const PINMAPS = {
  pico:  { name: n => 'GP' + n, digital: [...Array(23).keys()], analog: [26, 27, 28],
           i2c: { SDA: 4, SCL: 5 }, spi: { SCK: 18, MOSI: 19, MISO: 16 }, i2s: { BCLK: 10, LRC: 11, DOUT: 12, DIN: 13 }, uart: { TX: 0, RX: 1 } },
  pi:    { name: n => 'GPIO' + n, digital: [4, 5, 6, 12, 13, 16, 17, 22, 23, 24, 25, 26, 27, 7, 8, 0, 1], analog: [],
           i2c: { SDA: 2, SCL: 3 }, spi: { SCK: 11, MOSI: 10, MISO: 9 }, i2s: { BCLK: 18, LRC: 19, DOUT: 21, DIN: 20 }, uart: { TX: 14, RX: 15 } },
  esp:   { name: n => 'IO' + n, digital: [15, 16, 17, 18, 21, 38, 39, 40, 41, 42, 47, 48, 14, 1, 2, 3, 10], analog: [1, 2, 3, 10],
           i2c: { SDA: 8, SCL: 9 }, spi: { SCK: 12, MOSI: 11, MISO: 13 }, i2s: { BCLK: 4, LRC: 5, DOUT: 6, DIN: 7 }, uart: { TX: 43, RX: 44 } },
  uno:   { name: n => typeof n === 'string' ? n : 'D' + n, digital: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
           i2c: { SDA: 'SDA', SCL: 'SCL' }, spi: { SCK: 13, MOSI: 11, MISO: 12 }, i2s: null, uart: { TX: 1, RX: 0 } },
  generic: { name: n => typeof n === 'string' ? n : 'D' + n, digital: [...Array(31).keys()], analog: [...Array(12).keys()].map(i => 'A' + i),
           i2c: { SDA: 'D12', SCL: 'D11' }, spi: { SCK: 'D8', MOSI: 'D10', MISO: 'D9' }, i2s: { BCLK: 'SAI', LRC: 'SAI', DOUT: 'SAI', DIN: 'SAI' }, uart: { TX: 'D13', RX: 'D14' } }
};
function pinPlan(lines) {
  const b = board(), map = PINMAPS[b.pinFamily], N = map.name;
  const rows = [], issues = [], autos = [], used = new Set();
  const inst = [];
  for (const l of lines) if (l.group === 'parts') for (let i = 0; i < l.qty; i++) if (COMP[l.id].wire) inst.push({ id: l.id, n: l.qty > 1 ? i + 1 : 0 });
  const needs = t => inst.some(x => COMP[x.id].pins?.[t]);
  const bus = {};
  if (needs('i2c')) bus.i2c = map.i2c;
  if (needs('spi')) bus.spi = map.spi;
  if (needs('i2s')) { if (map.i2s) bus.i2s = map.i2s; else issues.push({ level: 'warn', msg: `${COMP[b.id].name} has no I2S audio port. Use a board like the ESP32-S3 or Pico for sound, or a simple buzzer.` }); }
  for (const k in bus) for (const v of Object.values(bus[k])) used.add(String(v));
  const dPool = map.digital.filter(p => !used.has(String(p)) && !map.analog.map(String).includes(String(p)));
  let aPool = map.analog.filter(p => !used.has(String(p)));
  const takeD = () => { const p = dPool.shift(); if (p === undefined) return null; used.add(String(p)); return N(p); };
  /* analog budget */
  const aNeed = inst.reduce((s, x) => s + (COMP[x.id].pins?.a || 0), 0);
  let aSource = 'board', muxPins = null, adsCount = 0;
  if (aNeed > aPool.length) {
    if (aPool.length > 0) { aSource = 'mux'; autos.push({ id: 'mux16', qty: Math.ceil((aNeed) / 16), why: [`${aNeed} analog parts but only ${aPool.length} analog pins`] }); muxPins = { S0: takeD(), S1: takeD(), S2: takeD(), S3: takeD(), SIG: N(aPool[0]) }; aPool = aPool.slice(1); }
    else { aSource = 'ads'; adsCount = Math.ceil(aNeed / 4); autos.push({ id: 'ads1115', qty: adsCount, why: ['this brain has no analog pins'] }); bus.i2c = bus.i2c || map.i2c; }
  }
  let aIdx = 0;
  const takeA = () => {
    const k = aIdx++;
    if (aSource === 'board') { const p = aPool.shift(); return p === undefined ? null : N(p); }
    if (aSource === 'mux') return `mux channel C${k}`;
    return `ADS1115 #${Math.floor(k / 4) + 1} input A${k % 4}`;
  };
  const csFor = () => takeD();
  const I = bus.i2c ? `SDA → ${N(bus.i2c.SDA)}, SCL → ${N(bus.i2c.SCL)}` : '';
  const S = bus.spi ? `SCK → ${N(bus.spi.SCK)}, MOSI → ${N(bus.spi.MOSI)}, MISO → ${N(bus.spi.MISO)}` : '';
  const S2 = bus.i2s ? `BCLK → ${N(bus.i2s.BCLK)}, LRC → ${N(bus.i2s.LRC)}` : '';
  const vcc = b.logic === 5 ? '5V' : '3V3';
  let dFail = false;
  const need = v => { if (v === null) dFail = true; return v ?? 'no pin left'; };
  for (const x of inst) {
    const c = COMP[x.id], label = c.name + (x.n ? ` ${x.n}` : ''); let signal = '', how = '';
    switch (c.wire) {
      case 'button': { const p = need(takeD()); signal = 'digital in'; how = `One leg → ${p}, other leg → GND. Turn on the pin's internal pull-up.`; break; }
      case 'joystick': { const p = [takeD(), takeD(), takeD(), takeD()].map(need); signal = 'digital in ×4'; how = `Up → ${p[0]}, Down → ${p[1]}, Left → ${p[2]}, Right → ${p[3]}. Common → GND.`; break; }
      case 'thumb': { const ax = need(takeA()), ay = need(takeA()), sw = need(takeD()); signal = 'analog in ×2 + digital'; how = `VRx → ${ax}, VRy → ${ay}, SW → ${sw}, +5V → ${vcc}, GND → GND.`; break; }
      case 'pot': { const p = need(takeA()); signal = 'analog in'; how = `Outer legs → ${vcc} and GND. Middle leg → ${p}.`; break; }
      case 'analog3': { const p = need(takeA()); signal = 'analog in'; how = `AOUT → ${p}, VCC → ${vcc}, GND → GND.`; break; }
      case 'piezo': { const p = need(takeA()); signal = 'analog in'; how = `Red → ${p}, black → GND. Add a 1MΩ resistor across the two wires.`; break; }
      case 'encoder': { const p = [takeD(), takeD(), takeD()].map(need); signal = 'digital in ×3'; how = `A → ${p[0]}, B → ${p[1]}, switch → ${p[2]}. Middle pin and switch common → GND.`; break; }
      case 'led': { const p = need(takeD()); signal = 'digital out'; how = `${p} → 330Ω resistor → long leg. Short leg → GND.`; break; }
      case 'strip': { const p = need(takeD()); signal = 'digital out (data)'; how = `DIN → ${p} through a 330Ω resistor. 5V and GND to the power supply, not the brain.`; break; }
      case 'i2c': signal = 'I2C bus (shared)'; how = `${I}, VCC → ${vcc}, GND → GND.`; break;
      case 'spi': { const cs = need(csFor()); const extra = c.pins?.d ? `, DC → ${need(takeD())}, RST → ${need(takeD())}` : ''; signal = 'SPI bus'; how = `${S}, CS → ${cs}${extra}, VCC → 3V3, GND → GND.`; break; }
      case 'i2samp': signal = 'I2S audio out'; how = bus.i2s ? `${S2}, DIN → ${N(bus.i2s.DOUT)}, VIN → 5V, GND → GND. Speaker to + and −.` : 'Needs an I2S port.'; break;
      case 'i2smic': signal = 'I2S audio in'; how = bus.i2s ? `SCK → ${N(bus.i2s.BCLK)}, WS → ${N(bus.i2s.LRC)}, SD → ${N(bus.i2s.DIN)}, L/R → GND, VDD → 3V3.` : 'Needs an I2S port.'; break;
      case 'i2s': signal = 'I2S + I2C'; how = bus.i2s ? `${S2}, DAC → ${N(bus.i2s.DOUT)}, ADC → ${N(bus.i2s.DIN)}. ${I}.` : 'Needs an I2S port.'; break;
      case 'speaker': signal = 'from the amp'; how = 'Two wires to the amp’s + and − speaker terminals.'; break;
      case 'jack': signal = 'audio'; how = b.id === 'daisy' ? 'Tip → Daisy audio in/out, sleeve → AGND.' : 'Tip → codec in/out, sleeve → GND.'; break;
      case 'usb': signal = 'USB'; how = 'Plugs into a USB port on the brain.'; break;
      case 'hdmi': signal = 'HDMI + USB'; how = 'HDMI cable to the brain. USB for power and touch.'; break;
      case 'usbpanel': signal = 'power in'; how = 'Panel-mount USB-C extension to the brain or charger input.'; break;
      default: continue;
    }
    rows.push({ id: x.id, label, role: c.role, signal, how });
  }
  if (muxPins) rows.unshift({ id: 'mux16', label: 'Analog mux', role: 'nerves', signal: 'shares one analog pin', how: `S0 → ${muxPins.S0}, S1 → ${muxPins.S1}, S2 → ${muxPins.S2}, S3 → ${muxPins.S3}, SIG → ${muxPins.SIG}, VCC → ${vcc}, GND → GND.` });
  if (aSource === 'ads') rows.unshift({ id: 'ads1115', label: 'ADS1115', role: 'nerves', signal: 'I2C bus (shared)', how: `${N(map.i2c.SDA)}/${N(map.i2c.SCL)} for SDA/SCL. Give each board its own address with the ADDR pin.` });
  if (dFail) issues.push({ level: 'err', msg: `Not enough digital pins on the ${COMP[b.id].name}. Remove some parts or pick a bigger brain.` });
  const dUsed = map.digital.length - dPool.length;
  return { rows, issues, autos, bus: Object.keys(bus), dUsed, dMax: b.gpio, aNeed, aMax: b.adc, aSource, vcc };
}
function bom() {
  const L = baseLines(), plan = pinPlan(L);
  for (const a of plan.autos) add(L, a.id, a.qty, a.why[0]);
  const T = toolLines(L);
  return { lines: [...L, ...T], plan };
}

/* ---------- prices ---------- */
function priceBom(lines) {
  const buy = lines.filter(l => !state.have[l.id]);
  for (const l of lines) l.opts = options(l.id, l.qty);
  const plans = ['cheapest', 'az', 'dk'].map(pref => {
    let sum = 0; const stores = new Set();
    const picks = buy.map(l => { let pick = pref === 'cheapest' ? null : l.opts.find(o => o.store === pref); if (!pick) pick = l.opts[0]; sum += pick.cost; stores.add(pick.name); return pick; });
    let ship = 0; stores.forEach(n => { const k = Object.keys(STORES).find(s => STORES[s].name === n); ship += k ? CZ_CONFIG.shipping[k] : CZ_CONFIG.shipping.other; });
    return { pref, picks, sum, ship, total: sum + ship, stores };
  });
  const best = plans.reduce((a, b) => b.total < a.total ? b : a);
  buy.forEach((l, i) => { l.pick = best.picks[i]; });
  lines.filter(l => state.have[l.id]).forEach(l => { l.pick = l.opts[0]; });
  const by = g => lines.filter(l => l.group === g);
  const sum = (arr, onlyBuy = true) => arr.reduce((a, l) => a + (onlyBuy && state.have[l.id] ? 0 : l.pick.cost), 0);
  const fil = filamentEstimate();
  const storeCounts = {}; buy.forEach(l => { storeCounts[l.pick.name] = (storeCounts[l.pick.name] || 0) + 1; });
  const parts = sum(by('parts')), proto = sum(by('proto')), tools = sum(by('tools'));
  const pcb = state.proto.pcb ? CZ_CONFIG.pcbEstimate : 0;
  const byRole = {};
  by('parts').forEach(l => { if (!state.have[l.id]) byRole[COMP[l.id].role] = (byRole[COMP[l.id].role] || 0) + l.pick.cost; });
  byRole.skeleton = (byRole.skeleton || 0) + fil.cost;
  return { parts, proto, tools, pcb, ship: best.ship, fil, storeCounts, byRole, total: parts + proto + pcb + fil.cost + best.ship, withTools: parts + proto + pcb + fil.cost + best.ship + tools };
}

/* Save money: try every version of every part and keep whichever lowers the whole order, shipping included. */
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

/* ---------- skill + time ---------- */
function skillFor(lines, b) {
  const reasons = []; let s = 0;
  if (lines.some(l => l.group === 'parts' && variant(l.id).solder)) { s += 1; reasons.push('Some parts need soldering'); }
  else reasons.push('No soldering needed');
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

/* Panel: flat plate with every cutout, to scale. y is flipped so the print matches the screen. */
function panelShape(panel) {
  const s = size(), W = s.cols * CELL, H = s.rows * CELL, g = SHELL.gap;
  const regions = [{ ring: rect(g, g, W - g, H - g), top: SHELL.panel }];
  for (const inst of state.panels[panel])
    for (const c of cutsFor(inst.fp, inst.rot)) regions.push({ ring: shapePoly(c).map(([x, y]) => [x + inst.x * CELL, H - (y + inst.y * CELL)]), top: 0 });
  return regions;
}
/* Shell tray: walls, ledge, magnet posts with pockets, and the hinge-side cable slot. */
function trayShape(panel) {
  const s = size(), W = s.cols * CELL, H = s.rows * CELL, t = SHELL.wall, L = SHELL.ledge;
  const D = panel === 'lid' ? s.lidDepth : s.baseDepth;
  const ledgeTop = D - SHELL.panel - SHELL.disc;
  const r = [
    { ring: rect(-t, -t, W + t, H + t), top: D },
    { ring: rect(0, 0, W, H), top: ledgeTop },
    { ring: rect(L, L, W - L, H - L), top: SHELL.floor }
  ];
  /* corner posts reach 2mm past the magnet cell so the pocket sits fully inside them */
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
  const cm3 = vol / 1000, grams = cm3 * CZ_CONFIG.filament.density * 0.45; /* walls print solid, the rest at ~20% infill */
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
   CHECKS — honest warnings everywhere
   ========================================================================== */
function bodyIssues(plan) {
  const s = size(), out = [], b = board();
  const inner = { lid: s.lidDepth - SHELL.floor - SHELL.panel - SHELL.disc, base: s.baseDepth - SHELL.floor - SHELL.panel - SHELL.disc };
  for (const panel of activePanels()) {
    for (const inst of state.panels[panel]) {
      const d = FP[inst.fp], err = fits(panel, inst.fp, inst.x, inst.y, inst.rot, inst.id);
      if (err) out.push({ level: 'err', id: inst.id, panel, msg: `${d.name} (${panel}) ${err}.` });
      if (d.depth > inner[panel]) out.push({ level: 'err', id: inst.id, panel, msg: `${d.name} needs ${d.depth}mm below the panel; the ${panel} has ${inner[panel]}mm.${panel === 'lid' ? ' Move it to the base.' : ' Pick a bigger size.'}` });
      for (const [id] of d.bom) if (COMP[id].linuxOnly && !b.linux) out.push({ level: 'err', id: inst.id, panel, msg: `${d.name} needs a Linux brain (Zero 2 W or Pi 5).` });
    }
  }
  for (const n of panelNeeds()) {
    if (!activePanels().includes(n.panel)) continue;
    const placed = state.panels[n.panel].filter(i => i.fp === n.fp).length;
    if (placed < n.qty) out.push({ level: 'warn', panel: n.panel, msg: `${n.qty - placed}× ${FP[n.fp].name} not placed on the ${n.panel} yet.` });
  }
  const tallest = Math.max(0, ...state.panels.base.map(i => FP[i.fp].depth));
  if (b.size[2] + tallest > inner.base) out.push({ level: 'warn', msg: `The brain (${b.size[2]}mm tall) and the deepest base part (${tallest}mm) can't stack in ${inner.base}mm. Place the brain beside, not under, that part.` });
  const cav = (s.cols * CELL - 2 * SHELL.ledge) * (s.rows * CELL - 2 * SHELL.ledge);
  const bat = BATTERIES[state.body.battery].comps.map(id => COMP[id].size).filter(Boolean);
  const floorUse = b.size[0] * b.size[1] + bat.reduce((a, z) => a + z[0] * z[1], 0);
  if (floorUse > cav * 0.6) out.push({ level: 'warn', msg: `The brain and battery cover ${Math.round(floorUse / cav * 100)}% of the base floor. It will be tight; consider a bigger size.` });
  for (const z of bat) if (z[2] > inner.base) out.push({ level: 'err', msg: `The battery is ${z[2]}mm tall; the base only has ${inner.base}mm.` });
  if (state.body.battery === 'aa4' && b.pinFamily === 'pico') out.push({ level: 'warn', msg: 'Use rechargeable NiMH AAs (4.8V). Fresh alkaline AAs (6V) are above the Pico’s 5.5V limit.' });
  const outer = Math.max(s.cols, s.rows) * CELL + 2 * SHELL.wall;
  if (outer > CZ_CONFIG.printBed) out.push({ level: 'warn', msg: `The shell is ${outer}mm across, bigger than a common ${CZ_CONFIG.printBed}mm print bed. Use a larger printer or a print service.` });
  return [...out, ...(plan?.issues || [])];
}

/* ==========================================================================
   VIEWS
   ========================================================================== */
function renderSteps() {
  $('#steps').innerHTML = STEPS.map(([id, l], i) => `<button class="step ${state.step === id ? 'active' : ''} ${STEPS.findIndex(s => s[0] === state.step) > i ? 'done' : ''}" data-s="${id}"><span class="num">${i + 1}</span>${l}</button>`).join('');
  $$('.step').forEach(b => b.onclick = () => go(b.dataset.s));
}

/* ---- 1 Make ---- */
function renderMake() {
  const cats = {};
  for (const [k, p] of Object.entries(PRESETS)) (cats[p.cat] = cats[p.cat] || []).push([k, p]);
  $('#v-make').innerHTML = `
    <section class="hero">
      <div class="heroText">
        <div class="eyebrow">Case Zero Builder</div>
        <h1>Build your own device.</h1>
        <p class="lead">Pick what you want to make. We match the parts, show you what it really costs, and give you the files to print its body. Every piece is yours to change or fix.</p>
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
      <div class="blockHead"><h2>What do you want to make?</h2><p>Start from a preset. Everything is editable after.</p></div>
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
  const p = PRESETS[k];
  state.preset = k; state.funcs = [...p.funcs]; state.conn = p.conn; state.budget = p.budget; state.boardPick = null;
  state.body.style = p.style; state.body.batteryAuto = true; state.touched = false; state.name = p.name === 'I Have an Idea' ? 'My build' : 'My ' + p.name;
  state.panel = 'base'; state.variantPick = {}; state.sim = freshState().sim;
}
function selectPreset(k) { selectPresetSilent(k); go('define'); }

/* ---- 2 Define ---- */
function renderDefine() {
  const groups = [['senses', 'What should it sense?'], ['limbs', 'What should it do?'], ['other', 'Anything else?']];
  const tile = f => `<label class="tile ${state.funcs.includes(f.id) ? 'on' : ''}"><input type="checkbox" value="${f.id}" ${state.funcs.includes(f.id) ? 'checked' : ''}><span class="dot d-${f.role}"></span>${esc(f.label)}</label>`;
  $('#v-define').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 2</div><h1>Define your machine</h1><p class="lead">Tell us what it should do. The brain and parts update as you choose.</p></div>
      <label class="nameField">Build name<input id="buildName" value="${esc(state.name)}" maxlength="40"></label></div>
    <div class="stack">
      ${groups.map(([g, title]) => `<div class="card"><h3>${title}</h3><div class="tiles">${FUNCS.filter(f => g === 'other' ? !['senses', 'limbs'].includes(f.role) : f.role === g).map(tile).join('')}</div></div>`).join('')}
      <div class="two">
        <div class="card"><h3>How should it connect?</h3><div class="chips" id="connR">${CONNS.map(([v, l]) => `<button class="chip ${state.conn === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div></div>
        <div class="card"><h3>How much do you want to spend?</h3><div class="chips" id="budR">${BUDGETS.map(([v, s, l]) => `<button class="chip ${state.budget === v ? 'on' : ''}" data-v="${v}"><b>${s}</b> ${l}</button>`).join('')}</div>
          <p class="small">This sets which brains we suggest. You can fine-tune every part's price on the next step.</p></div>
      </div>
      <div class="card preview" id="definePreview"></div>
    </div>`;
  const preview = () => { const c = chosen(); $('#definePreview').innerHTML = `${roleTag('brain')}<div><div class="small">Suggested brain right now</div><b>${esc(COMP[c.b.id].name)}</b> · ${'$'.repeat(c.b.tier)}</div>`; };
  preview();
  $$('#v-define input[type=checkbox]').forEach(cb => cb.onchange = () => { state.funcs = $$('#v-define input:checked').map(i => i.value); cb.closest('.tile').classList.toggle('on', cb.checked); state.boardPick = null; preview(); });
  $$('#connR .chip').forEach(r => r.onclick = () => { state.conn = r.dataset.v; state.boardPick = null; renderDefine(); });
  $$('#budR .chip').forEach(r => r.onclick = () => { state.budget = +r.dataset.v; state.boardPick = null; renderDefine(); });
  $('#buildName').oninput = e => { state.name = e.target.value || 'My build'; };
}

/* ---- 3 Parts & cost ---- */
function renderParts() {
  ensureLayout();
  optimizeSave();
  const { lines, plan } = bom(), c = chosen(), b = c.b, P = priceBom(lines), sk = skillFor(lines, b), tm = timeFor(lines, P.fil);
  const ranked = scoreBoards(), max = ranked[0].s, min = ranked[ranked.length - 1].s, pct = r => max === min ? 100 : Math.max(4, Math.round((r.s - min) / (max - min) * 100));
  const why = c.pros.length ? `Strong at ${c.pros.slice(0, 4).join(', ')}.` : c.good.length ? `Good at ${c.good.slice(0, 4).join(', ')}.` : 'Closest match for what you picked.';
  const roleOrder = ['brain', 'senses', 'limbs', 'heart', 'nerves', 'skeleton'];
  const lineRow = l => {
    const comp = COMP[l.id], vs = comp.variants, vi = variantIdx(l.id), have = !!state.have[l.id];
    return `<div class="line ${have ? 'have' : ''}">
      <div class="lMain"><div class="lName">${esc(comp.name)}${l.qty > 1 ? ` <span class="qty">×${l.qty}</span>` : ''}</div>
        ${vs.length > 1 ? `<select class="variant" data-id="${l.id}">${vs.map((v, i) => `<option value="${i}" ${i === vi ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>` : `<div class="lVar">${esc(vs[0].label)}</div>`}
        <div class="lWhy">${esc(l.why.join(' · '))}${l.pick.pack > 1 ? ` · comes in packs of ${l.pick.pack}` : ''}</div></div>
      <div class="lCost"><span class="est">${have ? 'have it' : money(l.pick.cost)}</span><label class="haveBox"><input type="checkbox" data-have="${l.id}" ${have ? 'checked' : ''}> I have it</label></div>
      <div class="lBuy">${l.opts.map(o => `<a class="buy ${o === l.pick && !have ? 'best' : ''}" href="${esc(o.url)}" target="_blank" rel="noopener sponsored">${esc(o.name)}${o === l.pick && !have ? '<i>best pick</i>' : ''}</a>`).join('')}</div>
    </div>`;
  };
  const parts = lines.filter(l => l.group === 'parts'), tools = lines.filter(l => l.group === 'tools');
  const barTotal = Object.values(P.byRole).reduce((a, v) => a + v, 0) || 1;
  $('#v-parts').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 3</div><h1>Parts & cost</h1><p class="lead">Every part, why it's here, and what it should cost. Check off anything you already own.</p></div></div>
    <div class="summary">
      <div class="stat big"><span class="sLabel">Estimated cost</span><span class="sVal">${money0(P.total)}</span><span class="sSub">parts ${money0(P.parts)} · printing ${money0(P.fil.cost)}${P.proto ? ` · prototype ${money0(P.proto)}` : ''}${P.pcb ? ` · PCB ${money0(P.pcb)}` : ''} · shipping ${money0(P.ship)}</span></div>
      <div class="stat"><span class="sLabel">Skill</span><span class="sVal">${sk.level}</span><span class="skill">${[1, 2, 3].map(i => `<i class="${i <= sk.dots ? 'on' : ''}"></i>`).join('')}</span></div>
      <div class="stat"><span class="sLabel">Time</span><span class="sVal">${tm.build}h</span><span class="sSub">+ about ${tm.print}h of printing</span></div>
      <div class="stat"><span class="sLabel">Tools (one time)</span><span class="sVal">${money0(P.tools)}</span><span class="sSub">${tools.filter(t => !state.have[t.id]).length} of ${tools.length} still needed</span></div>
    </div>
    <div class="costBar" title="Where the money goes">${roleOrder.filter(r => P.byRole[r]).map(r => `<span class="seg-${r}" style="flex:${P.byRole[r] / barTotal}"></span>`).join('')}</div>
    <div class="costLegend">${roleOrder.filter(r => P.byRole[r]).map(r => `<span><i class="dot d-${r}"></i>${ROLES[r].name} ${money0(P.byRole[r])}</span>`).join('')}</div>
    <div class="card priceCard">
      <div><h3>Adjust by price</h3><p class="small">Swaps every part to its cheapest or best version. You can still change any single part below.</p></div>
      <div class="seg" id="priceMode">${[['save', 'Save money'], ['bal', 'Balanced'], ['best', 'Best quality']].map(([v, l]) => `<button class="${state.priceMode === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>
    </div>
    <div class="card brainCard">
      <div class="brainTop">${roleTag('brain')}<div class="eyebrow">${c.b.id === ranked[0].b.id ? 'Recommended brain' : 'Your pick'}</div></div>
      <h2>${esc(COMP[b.id].name)}</h2>
      <div class="spec">${esc(b.specs)} · ${b.logic}V logic · ${b.gpio} pins${b.adc ? ` · ${b.adc} analog` : ' · no analog pins'}</div>
      <p>${esc(why)}${COMP[b.id].note ? ' ' + esc(COMP[b.id].note) : ''}</p>
      ${c.cons.map(x => `<div class="warnLine">${esc(x[0].toUpperCase() + x.slice(1))}</div>`).join('')}
      <details class="compare"><summary>Compare brains</summary><div class="tableWrap"><table class="cmp">
        <thead><tr><th>Brain</th><th>Est. price</th><th>Wireless</th><th>Linux</th><th>Match</th></tr></thead>
        <tbody>${ranked.map(r => { const o = options(r.b.id, 1)[0]; return `<tr class="cmpRow ${r.b.id === b.id ? 'pick' : ''}" data-id="${r.b.id}"><td><b>${esc(COMP[r.b.id].name)}</b>${r.b.id === ranked[0].b.id ? '<span class="tagRec">recommended</span>' : ''}</td><td>${money0(o.cost)}</td><td>${r.b.wifi ? 'Wi-Fi + BT' : '—'}</td><td>${r.b.linux ? 'Yes' : '—'}</td><td><div class="meter"><i style="width:${pct(r)}%"></i></div></td></tr>`; }).join('')}</tbody>
      </table></div><p class="small">Tap a row to switch brains. Everything below updates.</p></details>
    </div>
    ${roleOrder.map(r => { const L = parts.filter(l => COMP[l.id].role === r); if (!L.length) return ''; return `<div class="card group g-${r}"><div class="groupHead">${roleTag(r)}<span class="small">${ROLES[r].what}</span></div>${L.map(lineRow).join('')}</div>`; }).join('')}
    <div class="card group g-tools"><div class="groupHead">${roleTag('tools')}<span class="small">not counted in the estimate</span></div>${tools.map(lineRow).join('')}</div>
    <div class="card note">
      <p><b>Where these numbers come from.</b> Prices are Nociv estimates from typical store prices (${CZ_CONFIG.priceDate}), not live prices. The store marked best pick is usually cheapest for the quantity you need, including shipping (est.). Always check the store before you buy.</p>
      <p><b>Order plan:</b> ${Object.entries(P.storeCounts).map(([n, k]) => `${plural(k, 'part')} from ${esc(n)}`).join(', ') || 'nothing to buy'}.</p>
      <p class="small">As an Amazon Associate, Nociv earns from qualifying purchases. Some links may earn Nociv a small commission at no cost to you.</p>
    </div>`;
  $$('#priceMode button').forEach(bt => bt.onclick = () => { state.priceMode = bt.dataset.v; state.variantPick = {}; renderParts(); });
  $$('.variant').forEach(sel => sel.onchange = () => { state.variantPick[sel.dataset.id] = +sel.value; renderParts(); });
  $$('[data-have]').forEach(cb => cb.onchange = () => { state.have[cb.dataset.have] = cb.checked; renderParts(); });
  $$('.cmpRow').forEach(tr => tr.onclick = () => { state.boardPick = tr.dataset.id; renderParts(); });
}

/* ---- 4 Prototype ---- */
function renderProto() {
  ensureLayout();
  const { lines, plan } = bom(), b = board(), bd = COMP[b.id].name;
  const pr = state.proto;
  const station = (key, n, title, text, body, locked) => `
    <div class="station ${pr[key] || locked ? 'on' : ''}">
      <div class="stHead"><span class="stNum">${n}</span><div><h3>${title}</h3><p>${text}</p></div>
        ${locked ? '<span class="pill">always</span>' : `<label class="switch"><input type="checkbox" data-st="${key}" ${pr[key] ? 'checked' : ''}><span></span></label>`}</div>
      ${pr[key] || locked ? `<div class="stBody">${body}</div>` : ''}
    </div>`;
  const wok = b.wokwi ? `<a class="btn primary" href="https://wokwi.com/projects/new/${b.wokwi}" target="_blank" rel="noopener">Open a ${esc(bd)} in Wokwi</a><p class="small">Wokwi is a free simulator in your browser. Add your parts, paste the starter code, and watch it run before you buy anything.</p>`
    : `<p class="small">Browser simulators don't cover the ${esc(bd)} yet. Skip to the breadboard.</p>`;
  const wiring = `<div class="tableWrap"><table class="wire"><thead><tr><th>Part</th><th>Signal</th><th>Connect it</th></tr></thead><tbody>${plan.rows.map(r => `<tr><td><span class="dot d-${r.role}"></span>${esc(r.label)}</td><td class="mono">${esc(r.signal)}</td><td>${esc(r.how)}</td></tr>`).join('')}</tbody></table></div>`;
  const usage = `<div class="usage"><div><span class="small">Digital pins</span><div class="meter wide"><i style="width:${Math.min(100, plan.dUsed / plan.dMax * 100)}%"></i></div><span class="mono">${plan.dUsed} of ${plan.dMax}</span></div>
    <div><span class="small">Analog inputs</span><div class="meter wide"><i style="width:${plan.aMax ? Math.min(100, plan.aNeed / plan.aMax * 100) : (plan.aNeed ? 100 : 0)}%"></i></div><span class="mono">${plan.aNeed} needed · ${plan.aMax} on board${plan.aSource === 'mux' ? ' · mux added' : plan.aSource === 'ads' ? ' · ADS1115 added' : ''}</span></div>
    ${plan.bus.length ? `<div><span class="small">Shared buses</span><span class="mono">${plan.bus.map(x => x.toUpperCase()).join(' · ')}</span></div>` : ''}</div>`;
  $('#v-proto').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 4</div><h1>Prototype first</h1><p class="lead">Test the nerves before you build the body. Pick the stations you want. Each one is optional and you can skip straight to the body.</p></div></div>
    ${plan.issues.map(i => `<div class="alert ${i.level}">${esc(i.msg)}</div>`).join('')}
    <div class="line4">
      ${station('sim', 1, 'Try it in your browser', 'Free. No parts needed.', wok)}
      ${station('breadboard', 2, 'Breadboard prototype', 'Push wires into a breadboard. Nothing is permanent.', `${usage}${wiring}
        <ol class="checks"><li>Wire one part at a time, starting with the brain's power and ground.</li><li>Upload a test sketch and check each part does what the table says.</li><li>Use the multimeter if something is quiet: most problems are a loose wire or a swapped pin.</li></ol>`)}
      ${station('pcb', 3, 'Make a circuit board (optional)', 'Turn the breadboard into a real board you order online.', `
        <ol class="checks"><li>Draw the schematic in <a href="https://www.kicad.org" target="_blank" rel="noopener">KiCad</a> or <a href="https://easyeda.com" target="_blank" rel="noopener">EasyEDA</a> (both free). Copy the connections from the table above.</li>
        <li>Lay out the board, then export Gerber files.</li><li>Upload them to <a href="https://jlcpcb.com" target="_blank" rel="noopener">JLCPCB</a> for a live quote. Five small boards usually cost a few dollars plus shipping.</li></ol>`)}
      ${station('final', 4, 'Final wiring', 'How the nerves live inside the body.', `<div class="chips" id="finalR">${[['perf', 'Perfboard (solder it by hand)'], ['pcb', 'My own circuit board'], ['jumper', 'Keep jumper wires']].map(([v, l]) => `<button class="chip ${pr.final === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>`, true)}
    </div>`;
  $$('[data-st]').forEach(cb => cb.onchange = () => { pr[cb.dataset.st] = cb.checked; if (cb.dataset.st === 'pcb' && cb.checked && pr.final === 'perf') pr.final = 'pcb'; renderProto(); });
  $$('#finalR .chip').forEach(c => c.onclick = () => { pr.final = c.dataset.v; renderProto(); });
}

/* ---- 5 Body ---- */
function renderBody() {
  ensureLayout();
  if (!activePanels().includes(state.panel)) state.panel = 'base';
  const s = size(), bd = state.body, { plan } = bom();
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button class="${cur === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>`;
  $('#v-body').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 5</div><h1>Build the body</h1><p class="lead">Pick a size and style, add hardware, then place your parts. Every cutout is drawn to scale.</p></div></div>
    <div class="bodyGrid">
      <div class="stack">
        <div class="card"><h3>Size</h3>${seg('sizeSeg', Object.entries(SIZES).map(([k, v]) => [k, `${k}<small>${v.cols * CELL}×${v.rows * CELL}</small>`]), bd.size)}
          <p class="small">${s.name}: ${s.cols * CELL + 2 * SHELL.wall}×${s.rows * CELL + 2 * SHELL.wall}mm outside · base ${s.baseDepth}mm${bd.style === 'briefcase' ? ` · lid ${s.lidDepth}mm` : ''} deep</p></div>
        <div class="card"><h3>Style</h3>${seg('styleSeg', Object.entries(STYLES).map(([k, v]) => [k, v.name]), bd.style)}<p class="small">${STYLES[bd.style].text}</p>
          ${bd.style === 'briefcase' ? `<h4>Hinge side</h4>${seg('hingeSeg', [['back', 'Back'], ['left', 'Left'], ['right', 'Right']], bd.hinge)}` : ''}</div>
        <div class="card"><h3>Attachments</h3>
          <div class="att"><span>Latches</span>${seg('latchSeg', [[0, 'None'], [1, 'One'], [2, 'Two']], bd.latch)}</div>
          <label class="att"><span>Carry handle</span><input type="checkbox" data-att="handle" ${bd.handle ? 'checked' : ''}></label>
          <label class="att"><span>Key lock</span><input type="checkbox" data-att="lock" ${bd.lock ? 'checked' : ''}></label>
          ${bd.style === 'briefcase' ? `<label class="att"><span>Lid stay</span><input type="checkbox" data-att="stay" ${bd.stay ? 'checked' : ''}></label>` : ''}
          <label class="att"><span>Rubber feet</span><input type="checkbox" data-att="feet" ${bd.feet ? 'checked' : ''}></label>
          <div class="att col"><span>Battery holder</span><select id="batSel">${Object.entries(BATTERIES).map(([k, v]) => `<option value="${k}" ${bd.battery === k ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></div>
        </div>
      </div>
      <div class="stack">
        <div class="card workCard">
          <div class="workTop">${activePanels().length > 1 ? seg('panelSeg', [['lid', `Lid (${state.panels.lid.length})`], ['base', `Base (${state.panels.base.length})`]], state.panel) : '<span class="small">Top panel</span>'}
            <div class="row"><button class="btn small" id="autoBtn">Auto-arrange</button><button class="btn small ghost" id="clearBtn">Clear</button></div></div>
          <div id="gridHost" class="workplane"></div>
          <div class="selBar" id="selBar"></div>
          <div class="legend"><span><i class="lg mag"></i>magnet corner</span><span><i class="lg cut"></i>cutout to scale</span><span class="mono">1 square = 20mm</span></div>
        </div>
        <div class="two">
          <div class="card"><h3>Parts for this panel</h3><div class="chips" id="tray"></div><select class="any" id="anyPart"></select></div>
          <div class="card"><h3>Checks</h3><ul class="issues" id="issueList"></ul></div>
        </div>
      </div>
    </div>`;
  const bindSeg = (id, fn) => $$(`#${id} button`).forEach(bt => bt.onclick = () => fn(bt.dataset.v));
  bindSeg('sizeSeg', v => { bd.size = v; if (!state.touched) autoArrange(); state.sel = null; renderBody(); });
  bindSeg('styleSeg', v => { bd.style = v; state.touched = false; autoArrange(); renderBody(); });
  bindSeg('hingeSeg', v => { bd.hinge = v; renderBody(); });
  bindSeg('latchSeg', v => { bd.latch = +v; renderBody(); });
  bindSeg('panelSeg', v => { state.panel = v; state.sel = null; state.mode = null; renderBody(); });
  $$('[data-att]').forEach(cb => cb.onchange = () => { bd[cb.dataset.att] = cb.checked; renderBody(); });
  $('#batSel').onchange = e => { bd.battery = e.target.value; bd.batteryAuto = false; renderBody(); };
  $('#autoBtn').onclick = () => { autoArrange(); state.touched = true; renderBody(); toast('Arranged from your parts list'); };
  $('#clearBtn').onclick = () => { state.panels[state.panel] = []; state.sel = null; state.mode = null; state.touched = true; renderBody(); };
  renderGrid(plan); renderSelBar(); renderTray(); renderIssues(plan);
}
function panelSVG(panel, opts = {}) {
  const s = size(), W = s.cols * CELL, H = s.rows * CELL, bad = opts.bad || new Set();
  let g = `<rect class="plate" x="0" y="0" width="${W}" height="${H}" rx="3"/>`;
  for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) {
    g += `<rect class="cell" x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}"/>`;
    if (isMagnet(x, y)) g += `<circle class="mag" cx="${x * CELL + 10}" cy="${y * CELL + 10}" r="${SHELL.magnetD / 2 - 1}"/>`;
  }
  for (const inst of state.panels[panel]) {
    const { w, h } = dims(inst.fp, inst.rot), d = FP[inst.fp], role = COMP[d.bom[0][0]].role;
    g += `<g class="part p-${role} ${inst.id === state.sel ? 'sel' : ''} ${bad.has(inst.id) ? 'bad' : ''} ${opts.sim && state.sim.lit[inst.id] ? 'lit' : ''}" data-inst="${inst.id}" transform="translate(${inst.x * CELL},${inst.y * CELL})"><title>${esc(d.name)}</title>`;
    g += `<rect class="fp" x="0.8" y="0.8" width="${w * CELL - 1.6}" height="${h * CELL - 1.6}" rx="2"/>`;
    for (const c of cutsFor(inst.fp, inst.rot)) g += `<polygon class="cut" points="${shapePoly(c).map(p => p.map(v => v.toFixed(2)).join(',')).join(' ')}"/>`;
    if (opts.sim && COMP[d.bom[0][0]].sim === 'screen') { const r = cutsFor(inst.fp, inst.rot)[0]; g += `<text class="scr" x="${r.x}" y="${r.y}" text-anchor="middle" dominant-baseline="middle">${esc(state.sim.on ? (state.sim.screen || state.name) : '')}</text>`; }
    if (w >= 2 && h >= 2 && !opts.sim) g += `<text class="lbl" x="3" y="${h * CELL - 3}">${esc(d.name)}</text>`;
    g += '</g>';
  }
  return g;
}
function renderGrid(plan) {
  const s = size(), W = s.cols * CELL, H = s.rows * CELL;
  const bad = new Set(bodyIssues(plan).filter(i => i.id && i.level === 'err').map(i => i.id));
  $('#gridHost').innerHTML = `<svg id="gridSvg" viewBox="-3 -3 ${W + 6} ${H + 6}" xmlns="http://www.w3.org/2000/svg">${panelSVG(state.panel, { bad })}</svg>`;
  $('#gridHost').classList.toggle('placing', !!state.mode);
  const svg = $('#gridSvg');
  svg.addEventListener('click', e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); onCell(Math.floor(p.x / CELL), Math.floor(p.y / CELL)); });
}
const needFor = fp => panelNeeds().filter(n => n.panel === state.panel && n.fp === fp).reduce((a, n) => a + n.qty, 0);
function onCell(gx, gy) {
  const s = size(); if (gx < 0 || gy < 0 || gx >= s.cols || gy >= s.rows) return;
  const list = state.panels[state.panel];
  if (state.mode?.type === 'place') {
    const fp = state.mode.fp; let rot = 0, err = fits(state.panel, fp, gx, gy, 0);
    if (err && !fits(state.panel, fp, gx, gy, 1)) { rot = 1; err = null; }
    if (err) { toast(`Can't place there: ${err}`); return; }
    const inst = { id: ++uid, fp, x: gx, y: gy, rot }; list.push(inst); state.sel = inst.id; state.touched = true;
    if (list.filter(i => i.fp === fp).length >= needFor(fp)) state.mode = null;
  } else if (state.mode?.type === 'move') {
    const inst = list.find(i => i.id === state.mode.id), err = inst && fits(state.panel, inst.fp, gx, gy, inst.rot, inst.id);
    if (err) { toast(`Can't move there: ${err}`); return; }
    if (inst) { inst.x = gx; inst.y = gy; state.touched = true; }
    state.mode = null;
  } else {
    const hit = list.find(i => { const { w, h } = dims(i.fp, i.rot); return gx >= i.x && gx < i.x + w && gy >= i.y && gy < i.y + h; });
    state.sel = hit ? hit.id : null;
  }
  renderBody();
}
function renderSelBar() {
  const bar = $('#selBar'), list = state.panels[state.panel];
  if (state.mode) {
    const label = state.mode.type === 'place' ? `Tap a square to place the ${FP[state.mode.fp].name.toLowerCase()} (its top-left corner).` : 'Tap where its top-left corner should go.';
    bar.innerHTML = `<span>${esc(label)}</span><button class="btn small ghost" id="cancelMode">Cancel</button>`;
    $('#cancelMode').onclick = () => { state.mode = null; renderBody(); }; return;
  }
  const inst = list.find(i => i.id === state.sel);
  if (!inst) { bar.innerHTML = '<span>Tap a part to place it, or tap a placed part to move, rotate or remove it.</span>'; return; }
  const d = FP[inst.fp];
  bar.innerHTML = `<b>${esc(d.name)}</b><span class="mono">${d.w * CELL}×${d.h * CELL}mm · ${d.depth}mm deep</span>
    <button class="btn small" id="mvBtn">Move</button><button class="btn small" id="rtBtn">Rotate</button><button class="btn small ghost" id="rmBtn">Remove</button>`;
  $('#mvBtn').onclick = () => { state.mode = { type: 'move', id: inst.id }; renderBody(); };
  $('#rtBtn').onclick = () => { const err = fits(state.panel, inst.fp, inst.x, inst.y, inst.rot ? 0 : 1, inst.id); if (err) { toast(`Can't rotate: ${err}`); return; } inst.rot = inst.rot ? 0 : 1; state.touched = true; renderBody(); };
  $('#rmBtn').onclick = () => { state.panels[state.panel] = list.filter(i => i.id !== inst.id); state.sel = null; state.touched = true; renderBody(); };
}
function renderTray() {
  const s = size(), list = state.panels[state.panel], needs = panelNeeds().filter(n => n.panel === state.panel);
  const tooBig = fp => { const d = FP[fp]; return !((d.w <= s.cols && d.h <= s.rows) || (d.h <= s.cols && d.w <= s.rows)); };
  $('#tray').innerHTML = needs.length ? needs.map(n => {
    const placed = list.filter(i => i.fp === n.fp).length, active = state.mode?.type === 'place' && state.mode.fp === n.fp;
    return `<button class="chip ${placed >= n.qty ? 'done' : ''} ${active ? 'on' : ''}" data-fp="${n.fp}"><span class="dot d-${COMP[FP[n.fp].bom[0][0]].role}"></span>${esc(FP[n.fp].name)}<span class="n">${placed}/${n.qty}</span></button>`;
  }).join('') : '<span class="small">Nothing suggested for this panel. Add any part below.</span>';
  $$('#tray .chip').forEach(c => c.onclick = () => { state.mode = { type: 'place', fp: c.dataset.fp }; state.sel = null; renderBody(); });
  const sel = $('#anyPart');
  sel.innerHTML = '<option value="">Add any part…</option>' + Object.entries(FP).map(([k, d]) => `<option value="${k}" ${tooBig(k) ? 'disabled' : ''}>${esc(d.name)} · ${d.w}×${d.h}${tooBig(k) ? ' (too big)' : ''}</option>`).join('');
  sel.onchange = () => { if (sel.value) { state.mode = { type: 'place', fp: sel.value }; state.sel = null; renderBody(); } };
}
function renderIssues(plan) {
  const all = bodyIssues(plan);
  $('#issueList').innerHTML = all.length ? all.map(i => `<li class="${i.level}">${esc(i.msg)}</li>`).join('') : '<li class="ok">Everything fits.</li>';
}

/* ---- 6 Power on (simulator) ---- */
function simOutputs() { const out = []; for (const p of activePanels()) for (const i of state.panels[p]) { const c = COMP[FP[i.fp].bom[0][0]]; if (['glow', 'screen', 'sound'].includes(c.sim)) out.push(i); } return out; }
function renderSim() {
  ensureLayout();
  const { lines, plan } = bom(), b = board(), s = size(), W = s.cols * CELL, H = s.rows * CELL, gap = 34, m = 12, colW = 150;
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
    const via = p === 'lid' ? ` Q ${m + W / 2} ${cy + 20} ${m + W / 2} ${hingeY} T ` : ' Q ';
    const d = p === 'lid' ? `M ${cx} ${cy}${via}${tgt[0]} ${tgt[1]}` : `M ${cx} ${cy} Q ${(cx + tgt[0]) / 2} ${cy} ${tgt[0]} ${tgt[1]}`;
    wires.push({ inst: i.id, role: c.role, d });
  }
  blocks.slice(1).forEach(k => wires.push({ block: k.id, role: k.role, d: `M ${k.x} ${k.y + k.h / 2} C ${k.x - 24} ${k.y + k.h / 2} ${bc[0] - 24} ${bc[1]} ${bc[0]} ${bc[1]}` }));
  let g = '';
  if (briefcase) g += `<g transform="translate(${m},${m})">${panelSVG('lid', { sim: true })}</g><rect class="hingeBar" x="${m}" y="${m + H + 6}" width="${W}" height="${gap - 12}" rx="3"/><rect class="slot" x="${m + W / 2 - 15}" y="${m + H + 6}" width="30" height="${gap - 12}" rx="2"/><text class="tiny" x="${m + W / 2 + 20}" y="${hingeY + 3}">cable slot</text>`;
  g += `<g transform="translate(${m},${baseY})">${panelSVG('base', { sim: true })}</g>`;
  g += wires.map(w => `<path class="nerve n-${w.role} ${w.inst && state.sim.lit['w' + w.inst] ? 'pulse' : ''}" ${w.inst ? `data-w="${w.inst}"` : `data-wb="${w.block}"`} d="${w.d}"/>`).join('');
  g += blocks.map(k => `<g class="block b-${k.role} ${state.sim.lit['b' + k.id] ? 'lit' : ''}" data-block="${k.id}"><rect x="${k.x}" y="${k.y}" width="${colW}" height="${k.h}" rx="6"/><text x="${k.x + 8}" y="${k.y + 14}" class="bRole">${ROLES[k.role].name.toUpperCase()}</text><text x="${k.x + 8}" y="${k.y + 27}" class="bName">${esc(k.label.length > 24 ? k.label.slice(0, 23) + '…' : k.label)}</text></g>`).join('');
  const mA = lines.filter(l => l.group === 'parts').reduce((a, l) => a + (COMP[l.id].mA || 0) * l.qty, 0);
  const batId = BATTERIES[state.body.battery].comps[0], bat = batId && COMP[batId];
  const hours = bat ? (b.linux ? bat.mAh * bat.volt * 0.85 / (5 * mA) : bat.mAh * 0.85 / mA) : 0;
  $('#v-sim').innerHTML = `
    <div class="pageHead"><div><div class="eyebrow">Step 6</div><h1>Power it on</h1><p class="lead">See how the nerves connect. Tap any sense (an input) to send a signal to the brain and watch the limbs react.</p></div>
      <button class="btn primary powerBtn ${state.sim.on ? 'on' : ''}" id="powerBtn">${state.sim.on ? 'Power off' : 'Power on'}</button></div>
    <div class="simGrid">
      <div class="card simCard"><svg id="simSvg" class="${state.sim.on ? 'on' : ''}" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg">${g}</svg></div>
      <div class="stack">
        <div class="card"><h3>Power</h3>
          <div class="kv"><span>Draws about</span><b>${mA} mA</b></div>
          <div class="kv"><span>Powered by</span><b>${bat ? esc(BATTERIES[state.body.battery].name) : 'USB'}</b></div>
          ${bat ? `<div class="kv"><span>Battery life</span><b>about ${hours >= 1 ? Math.round(hours * 10) / 10 + ' h' : Math.round(hours * 60) + ' min'}</b></div>` : ''}
          ${b.id === 'pi5' ? '<p class="small">The Pi 5 wants a 5V 5A USB-C supply for full power.</p>' : ''}
          <p class="small">Rough estimate from typical draw. Real numbers depend on your code, screen brightness and Wi-Fi use.</p></div>
        <div class="card"><h3>Pins</h3><div class="kv"><span>Digital</span><b>${plan.dUsed} of ${plan.dMax}</b></div><div class="kv"><span>Analog</span><b>${plan.aNeed} needed · ${plan.aMax} on board</b></div>${plan.bus.length ? `<div class="kv"><span>Buses</span><b>${plan.bus.map(x => x.toUpperCase()).join(' · ')}</b></div>` : ''}</div>
        <div class="card"><h3>Signal log</h3><ol class="log" id="simLog">${state.sim.log.slice(-6).reverse().map(x => `<li>${esc(x)}</li>`).join('') || `<li class="small">${state.sim.on ? 'Tap a button, knob or sensor.' : 'Power on to begin.'}</li>`}</ol></div>
      </div>
    </div>`;
  $('#powerBtn').onclick = () => { state.sim.on = !state.sim.on; state.sim.lit = {}; state.sim.screen = ''; if (state.sim.on) { state.sim.log.push(`${COMP[b.id].name} boots. Heart → brain: power on.`); simOutputs().forEach(o => { if (COMP[FP[o.fp].bom[0][0]].sim === 'glow') state.sim.lit[o.id] = true; }); } renderSim(); };
  $$('#simSvg .part').forEach(el => el.onclick = () => simInput(+el.dataset.inst));
  $$('#simSvg .block').forEach(el => el.onclick = () => simBlock(el.dataset.block));
}
function findInst(id) { for (const p of activePanels()) { const i = state.panels[p].find(x => x.id === id); if (i) return i; } return null; }
function flash(keys, ms = 650) { keys.forEach(k => state.sim.lit[k] = true); renderSim(); setTimeout(() => { keys.forEach(k => { if (!state.sim.keep?.[k]) delete state.sim.lit[k]; }); if (state.step === 'sim') renderSim(); }, ms); }
function simInput(id) {
  if (!state.sim.on) { toast('Power it on first'); return; }
  const inst = findInst(id); if (!inst) return;
  const fp = FP[inst.fp], c = COMP[fp.bom[0][0]], b = board();
  if (c.role !== 'senses') { toast(`${fp.name} is a limb: the brain controls it.`); return; }
  let msg;
  if (c.sim === 'turn') { const v = ((state.sim.vals[id] || 0) + 25) % 125; state.sim.vals[id] = v; msg = `${fp.name} → ${v}%`; }
  else msg = `${fp.name} pressed`;
  state.sim.screen = msg;
  state.sim.log.push(`${fp.name} (sense) → nerve → ${COMP[b.id].name} → ${simOutputs().length ? simOutputs().map(o => FP[o.fp].name).filter((v, i, a) => a.indexOf(v) === i).join(', ') + ' react' : 'no limbs to react yet'}.`);
  state.sim.keep = {};
  const outs = simOutputs();
  outs.forEach(o => { const k = COMP[FP[o.fp].bom[0][0]].sim; if (k === 'glow') { state.sim.lit[o.id] = !state.sim.lit[o.id]; state.sim.keep[o.id] = true; } });
  flash(['w' + id, id, 'b' + b.id, ...outs.filter(o => COMP[FP[o.fp].bom[0][0]].sim !== 'glow').map(o => o.id), ...outs.map(o => 'w' + o.id)]);
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

/* ---- 7 Save & print ---- */
function renderSave() {
  ensureLayout();
  const { lines, plan } = bom(), P = priceBom(lines), s = size(), issues = bodyIssues(plan), errs = issues.filter(i => i.level === 'err');
  const outer = `${s.cols * CELL + 2 * SHELL.wall}×${s.rows * CELL + 2 * SHELL.wall}mm`;
  const files = [];
  for (const p of activePanels()) { files.push(['tray-' + p, `${p === 'lid' ? 'Lid' : 'Base'} shell`, `${outer}, ${p === 'lid' ? s.lidDepth : s.baseDepth}mm tall`]); files.push(['panel-' + p, `${p === 'lid' ? 'Lid' : 'Base'} panel`, `${s.cols * CELL - 2 * SHELL.gap}mm square-ish plate, 3mm`]); }
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
function snapshot() {
  const { step, sel, mode, sim, ...rest } = state;
  return { app: 'case-zero', v: 4, ...JSON.parse(JSON.stringify(rest)) };
}
function applySnapshot(d) {
  if (!d || d.app !== 'case-zero') throw new Error('not a Case Zero file');
  const base = freshState();
  state = { ...base, ...d, proto: { ...base.proto, ...d.proto }, body: { ...base.body, ...d.body }, sim: base.sim, step: 'body', sel: null, mode: null };
  if (!PRESETS[state.preset]) state.preset = 'scratch';
  if (!SIZES[state.body.size]) state.body.size = 'M';
  state.funcs = (state.funcs || []).filter(f => FL[f]);
  if (state.boardPick && !BOARD[state.boardPick]) state.boardPick = null;
  for (const p of ['lid', 'base']) state.panels[p] = ((d.panels || {})[p] || []).filter(i => FP[i.fp]).map(i => ({ id: ++uid, fp: i.fp, x: i.x | 0, y: i.y | 0, rot: i.rot ? 1 : 0 }));
  state.touched = true;
}
function openFile(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => { try { applySnapshot(JSON.parse(r.result)); go('body'); toast(`Opened ${state.name}`); } catch (e) { toast('That file is not a Case Zero build.'); } };
  r.readAsText(file);
}
function loadFromHash() {
  const m = location.hash.match(/#b=(.+)/); if (!m) return false;
  try { applySnapshot(JSON.parse(decodeURIComponent(escape(atob(m[1]))))); return true; } catch (e) { return false; }
}

/* ---------- navigation ---------- */
const RENDER = { make: renderMake, define: renderDefine, parts: renderParts, proto: renderProto, body: renderBody, sim: renderSim, save: renderSave };
function go(step) {
  if (step !== 'make' && !state.preset) selectPresetSilent('scratch');
  state.step = step;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'v-' + step));
  RENDER[step]();
  renderSteps();
  const i = STEPS.findIndex(s => s[0] === step);
  $('#backBtn').style.visibility = i === 0 ? 'hidden' : 'visible';
  $('#nextBtn').style.visibility = i === STEPS.length - 1 ? 'hidden' : 'visible';
  if (i < STEPS.length - 1) $('#nextBtn').textContent = `Next: ${STEPS[i + 1][1]}`;
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
$('#backBtn').onclick = () => { const i = STEPS.findIndex(s => s[0] === state.step); if (i > 0) go(STEPS[i - 1][0]); };
$('#nextBtn').onclick = () => { const i = STEPS.findIndex(s => s[0] === state.step); if (i < STEPS.length - 1) go(STEPS[i + 1][0]); };
go(loadFromHash() ? 'body' : 'make');