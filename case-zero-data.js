/* ==========================================================================
   CASE ZERO BUILDER — DATA
   Everything the builder knows lives here: stores, parts, boards, bodies,
   presets. Edit this file to add parts or update prices; case-zero.js
   never needs to change for that.
   Prices are Nociv planning estimates (Sep 2026), not live store prices.
   ========================================================================== */

const CZ_CONFIG = {
  amazonTag: '',            // Amazon Associates tracking ID, e.g. 'nociv-20'
  digikeyParams: '',        // tracking query from DigiKey's affiliate network, e.g. 'utm_source=nociv'
  priceDate: 'Sep 2026',
  shipping: { dk: 7, az: 0, other: 8 },          // per-order shipping estimates (USD)
  filament: { pricePerKg: 20, density: 1.24 },   // PLA
  printBed: 220,                                  // common bed size (mm), Ender 3 class
  pcbEstimate: 8                                  // 5 small 2-layer boards before shipping (JLCPCB)
};

const STORES = {
  az: { name: 'Amazon',  url: q => `https://www.amazon.com/s?k=${encodeURIComponent(q)}${CZ_CONFIG.amazonTag ? '&tag=' + CZ_CONFIG.amazonTag : ''}` },
  dk: { name: 'DigiKey', url: q => `https://www.digikey.com/en/products/result?keywords=${encodeURIComponent(q)}${CZ_CONFIG.digikeyParams ? '&' + CZ_CONFIG.digikeyParams : ''}` }
};

/* The body analogy. Every part belongs to one of these. */
const ROLES = {
  brain:    { name: 'Brain',    what: 'the microcontroller', text: 'Makes every decision. It reads the senses, runs your code and tells the limbs what to do.' },
  nerves:   { name: 'Nerves',   what: 'wires and connectors', text: 'Carry signals between the brain and every other part. Each wire is one nerve.' },
  senses:   { name: 'Senses',   what: 'inputs', text: 'How the device feels the world: buttons, knobs, sensors and microphones.' },
  limbs:    { name: 'Limbs',    what: 'outputs', text: 'How the device acts: screens show, speakers talk, lights glow.' },
  heart:    { name: 'Heart',    what: 'power', text: 'Batteries and USB power keep everything alive.' },
  skeleton: { name: 'Skeleton', what: 'the body', text: 'The printed shell, magnets, hinges and latches that hold it all together.' },
  tools:    { name: 'Tools',    what: 'one-time', text: 'What you need on your bench. Buy once, use on every build.' }
};

/* --------------------------------------------------------------------------
   PARTS CATALOG
   src rows: [store, price, packSize, searchQuery, storeName?, url?]
   pins: d digital, a analog, plus buses (i2c, spi, i2s, uart, usb, hdmi)
   wire: how the nerves connect (used for the wiring guide)
   sim: how the part behaves in the simulator
   -------------------------------------------------------------------------- */
const V = (label, tier, src, extra = {}) => ({ label, tier, src, ...extra });

const COMP = {
  /* ---- Brains ---- */
  pico2:   { name: 'Raspberry Pi Pico 2', role: 'brain', mA: 25, min: 10, variants: [
             V('Pico 2 H (headers on, no soldering)', 'bal', [['dk', 6, 1, 'Raspberry Pi Pico 2 H'], ['az', 8, 1, 'Raspberry Pi Pico 2 H']]),
             V('Pico 2 (solder your own headers)', 'save', [['dk', 5, 1, 'Raspberry Pi Pico 2'], ['az', 7, 1, 'Raspberry Pi Pico 2']], { solder: true, needsHeaders: true }) ] },
  pico2w:  { name: 'Raspberry Pi Pico 2 W', role: 'brain', mA: 45, min: 10, variants: [
             V('Pico 2 WH (headers on, no soldering)', 'bal', [['dk', 8, 1, 'Raspberry Pi Pico 2 WH'], ['az', 10, 1, 'Raspberry Pi Pico 2 WH']]),
             V('Pico 2 W (solder your own headers)', 'save', [['dk', 7, 1, 'Raspberry Pi Pico 2 W'], ['az', 9, 1, 'Raspberry Pi Pico 2 W']], { solder: true, needsHeaders: true }) ] },
  esp32s3: { name: 'ESP32-S3 DevKit', role: 'brain', mA: 90, min: 10, variants: [
             V('Espressif ESP32-S3-DevKitC-1 (official)', 'bal', [['dk', 15, 1, 'ESP32-S3-DevKitC-1-N8R8'], ['az', 17, 1, 'ESP32-S3-DevKitC-1']]),
             V('Compatible ESP32-S3 board', 'save', [['az', 11, 1, 'ESP32-S3 development board N16R8']]) ] },
  unor4m:  { name: 'Arduino UNO R4 Minima', role: 'brain', mA: 40, min: 5, variants: [
             V('Arduino UNO R4 Minima', 'bal', [['dk', 20, 1, 'Arduino UNO R4 Minima'], ['az', 22, 1, 'Arduino UNO R4 Minima']]) ] },
  unor4w:  { name: 'Arduino UNO R4 WiFi', role: 'brain', mA: 90, min: 5, variants: [
             V('Arduino UNO R4 WiFi', 'bal', [['dk', 27.5, 1, 'Arduino UNO R4 WiFi'], ['az', 29, 1, 'Arduino UNO R4 WiFi']]) ] },
  daisy:   { name: 'Daisy Seed', role: 'brain', mA: 150, min: 15, variants: [
             V('Electrosmith Daisy Seed3', 'bal', [['other', 29.99, 1, 'Daisy Seed3', 'Electrosmith', 'https://daisy.audio/pages/the-daisy-seed']], { solder: true }) ] },
  zero2w:  { name: 'Raspberry Pi Zero 2 W', role: 'brain', mA: 250, min: 30, variants: [
             V('Zero 2 WH (headers on)', 'bal', [['dk', 20, 1, 'Raspberry Pi Zero 2 WH'], ['az', 24, 1, 'Raspberry Pi Zero 2 WH']]),
             V('Zero 2 W (solder your own headers)', 'save', [['dk', 17, 1, 'Raspberry Pi Zero 2 W'], ['az', 21, 1, 'Raspberry Pi Zero 2 W']], { solder: true, needsHeaders: true }) ] },
  pi5:     { name: 'Raspberry Pi 5 (4GB)', role: 'brain', mA: 900, min: 30, note: 'Pi prices rose in 2026 because of memory costs.', variants: [
             V('Raspberry Pi 5 4GB', 'bal', [['dk', 110, 1, 'Raspberry Pi 5 4GB'], ['az', 115, 1, 'Raspberry Pi 5 4GB']]) ] },

  /* ---- Senses (inputs) ---- */
  tact12:   { name: '12mm push button', role: 'senses', pins: { d: 1 }, wire: 'button', sim: 'press', min: 5, variants: [
              V('12mm panel-mount button', 'save', [['az', 7.99, 20, '12mm momentary push button panel mount'], ['dk', 1.35, 1, '12mm pushbutton panel mount momentary']], { solder: true }) ] },
  tact6:    { name: '6mm tactile switch', role: 'senses', pins: { d: 1 }, wire: 'button', sim: 'press', min: 4, variants: [
              V('6x6mm tactile switch', 'save', [['az', 5.99, 100, '6x6mm tactile push button'], ['dk', 0.25, 1, '6x6mm tactile switch through hole']], { solder: true }) ] },
  arcade24: { name: '24mm arcade button', role: 'senses', pins: { d: 1 }, wire: 'button', sim: 'press', min: 4, variants: [
              V('24mm arcade button (quick-connect)', 'save', [['az', 11.99, 10, '24mm arcade buttons']]) ] },
  arcade30: { name: '30mm arcade button', role: 'senses', pins: { d: 1 }, wire: 'button', sim: 'press', min: 4, variants: [
              V('30mm arcade button (quick-connect)', 'save', [['az', 12.99, 10, '30mm arcade buttons']]) ] },
  joystick: { name: 'Arcade joystick', role: 'senses', pins: { d: 4 }, wire: 'joystick', sim: 'press', min: 15, variants: [
              V('8-way arcade joystick', 'save', [['az', 13.99, 1, 'arcade joystick 8 way']]) ] },
  thumb:    { name: 'Thumbstick', role: 'senses', pins: { a: 2, d: 1 }, wire: 'thumb', sim: 'turn', min: 8, variants: [
              V('2-axis thumbstick module', 'save', [['az', 7.99, 5, 'PS2 joystick module arduino'], ['dk', 5.95, 1, 'analog 2-axis thumb joystick breakout']]) ] },
  pot:      { name: 'Knob (10k potentiometer)', role: 'senses', pins: { a: 1 }, wire: 'pot', sim: 'turn', min: 6, variants: [
              V('10k pot + knob kit', 'save', [['az', 9.99, 10, '10k potentiometer with knob kit']], { solder: true }),
              V('Alpha 16mm pot + metal knob', 'best', [['dk', 3.2, 1, 'Alpha 16mm 10k linear potentiometer']], { solder: true }) ] },
  encoder:  { name: 'Rotary encoder', role: 'senses', pins: { d: 3 }, wire: 'encoder', sim: 'turn', min: 6, variants: [
              V('EC11 rotary encoder', 'save', [['az', 7.99, 5, 'EC11 rotary encoder with knob'], ['dk', 1.7, 1, 'EC11 rotary encoder']], { solder: true }) ] },
  slidepot: { name: 'Slide potentiometer', role: 'senses', pins: { a: 1 }, wire: 'pot', sim: 'turn', min: 6, variants: [
              V('45mm slide pot 10k', 'save', [['az', 9.99, 4, '45mm slide potentiometer 10k'], ['dk', 3.4, 1, 'slide potentiometer 45mm 10k']], { solder: true }) ] },
  toggle:   { name: 'Toggle switch', role: 'senses', pins: { d: 1 }, wire: 'button', sim: 'press', min: 5, variants: [
              V('Mini SPDT toggle', 'save', [['az', 7.99, 10, 'mini toggle switch SPDT 6mm'], ['dk', 2.9, 1, 'mini toggle switch SPDT panel mount']], { solder: true }) ] },
  footsw:   { name: 'Footswitch', role: 'senses', pins: { d: 1 }, wire: 'button', sim: 'press', min: 8, variants: [
              V('3PDT footswitch', 'save', [['az', 11.99, 5, '3PDT footswitch guitar pedal']], { solder: true }) ] },
  piezo:    { name: 'Piezo pad sensor', role: 'senses', pins: { a: 1 }, wire: 'piezo', sim: 'press', min: 6, variants: [
              V('27mm piezo disc', 'save', [['az', 6.99, 20, '27mm piezo disc'], ['dk', 0.9, 1, 'piezo disc 27mm']], { solder: true }) ] },
  kbd:      { name: 'Mini keyboard', role: 'senses', pins: { usb: 1 }, wire: 'usb', sim: 'press', min: 5, variants: [
              V('Mini USB keyboard', 'save', [['az', 16.99, 1, 'mini USB keyboard small']]) ] },
  mic:      { name: 'Microphone (INMP441)', role: 'senses', pins: { i2s: 1, d: 1 }, wire: 'i2smic', sim: 'listen', mA: 2, min: 10, variants: [
              V('INMP441 I2S microphone', 'save', [['az', 8.99, 3, 'INMP441 I2S microphone module'], ['dk', 6.95, 1, 'I2S MEMS microphone breakout']], { solder: true }) ] },
  soil:     { name: 'Soil moisture sensor', role: 'senses', pins: { a: 1 }, wire: 'analog3', sim: 'sense', mA: 5, min: 5, variants: [
              V('Capacitive soil sensor', 'save', [['az', 8.99, 5, 'capacitive soil moisture sensor v2.0']]) ] },
  bme280:   { name: 'Temp / humidity sensor', role: 'senses', pins: { i2c: 1 }, wire: 'i2c', sim: 'sense', mA: 1, min: 5, variants: [
              V('BME280 module', 'save', [['az', 8.99, 3, 'BME280 sensor module'], ['dk', 14.95, 1, 'BME280 breakout']], { solder: true }) ] },
  mux16:    { name: '16-channel analog mux', role: 'nerves', pins: { d: 4, a: 1 }, wire: 'mux', mA: 1, min: 15, auto: true, variants: [
              V('CD74HC4067 module', 'save', [['az', 8.99, 5, 'CD74HC4067 multiplexer module'], ['dk', 4.95, 1, 'CD74HC4067 breakout']], { solder: true }) ] },
  ads1115:  { name: 'Analog reader (ADS1115)', role: 'nerves', pins: { i2c: 1 }, wire: 'i2c', mA: 1, min: 10, auto: true, variants: [
              V('ADS1115 module', 'save', [['az', 9.99, 3, 'ADS1115 module'], ['dk', 14.95, 1, 'ADS1115 breakout']], { solder: true }) ] },

  /* ---- Limbs (outputs) ---- */
  led5:    { name: 'LED 5mm', role: 'limbs', pins: { d: 1 }, wire: 'led', sim: 'glow', mA: 10, min: 4, variants: [
             V('5mm LED assortment', 'save', [['az', 6.99, 100, '5mm LED assortment kit with resistors'], ['dk', 0.3, 1, '5mm LED through hole']], { solder: true }) ] },
  strip:   { name: 'LED strip (WS2812B)', role: 'limbs', pins: { d: 1 }, wire: 'strip', sim: 'strip', mA: 300, min: 15, note: 'Full white on 60 LEDs can pull 3.6A. 300mA is a typical animation.', variants: [
             V('WS2812B strip 1m / 60 LEDs', 'save', [['az', 11.99, 1, 'WS2812B LED strip 1m 60 LEDs']]) ] },
  speaker: { name: 'Speaker 40mm', role: 'limbs', wire: 'speaker', sim: 'sound', min: 5, variants: [
             V('40mm 3W 4 ohm speaker', 'save', [['az', 9.99, 4, '40mm 3W 4 ohm speaker'], ['dk', 2.95, 1, '40mm speaker 4 ohm 3W']], { solder: true }) ] },
  amp:     { name: 'Speaker amp (MAX98357A)', role: 'limbs', pins: { i2s: 1 }, wire: 'i2samp', mA: 150, min: 10, auto: true, variants: [
             V('MAX98357A I2S amp', 'save', [['az', 8.99, 3, 'MAX98357A I2S amplifier module'], ['dk', 5.95, 1, 'MAX98357A I2S amp breakout']], { solder: true }) ] },
  codec:   { name: 'Audio codec board', role: 'limbs', pins: { i2s: 1, i2c: 1 }, wire: 'i2s', mA: 60, min: 20, variants: [
             V('WM8960 audio codec board', 'save', [['az', 14.99, 1, 'WM8960 audio codec module']]) ] },
  oled:    { name: 'OLED 1.3"', role: 'limbs', pins: { i2c: 1 }, wire: 'i2c', sim: 'screen', mA: 20, min: 5, variants: [
             V('1.3" OLED 128x64 (I2C)', 'save', [['az', 9.99, 1, '1.3 inch OLED I2C SH1106']]),
             V('Adafruit 1.3" OLED', 'best', [['dk', 19.95, 1, 'Adafruit 1.3 OLED 128x64']]) ] },
  tft24:   { name: '2.4" color screen', role: 'limbs', pins: { spi: 1, d: 2 }, wire: 'spi', sim: 'screen', mA: 80, min: 10, variants: [
             V('2.4" TFT ILI9341 (SPI)', 'save', [['az', 12.99, 1, '2.4 inch TFT SPI ILI9341']]) ] },
  tft35:   { name: '3.5" color screen', role: 'limbs', pins: { spi: 1, d: 2 }, wire: 'spi', sim: 'screen', mA: 120, min: 10, variants: [
             V('3.5" TFT ILI9488 (SPI)', 'save', [['az', 16.99, 1, '3.5 inch TFT SPI ILI9488']]) ] },
  hdmi5:   { name: '5" HDMI screen', role: 'limbs', pins: { hdmi: 1, usb: 1 }, wire: 'hdmi', sim: 'screen', mA: 400, min: 10, linuxOnly: true, variants: [
             V('5" IPS 800x480 HDMI', 'save', [['az', 39.99, 1, '5 inch HDMI display 800x480 IPS']]) ] },
  jack:    { name: '1/4" audio jack', role: 'limbs', wire: 'jack', min: 6, variants: [
             V('6.35mm mono jack', 'save', [['az', 7.99, 10, '6.35mm mono jack panel mount'], ['dk', 3.2, 1, 'Switchcraft 1/4 inch mono jack']], { solder: true }) ] },

  /* ---- Heart (power) ---- */
  usbc:    { name: 'USB-C panel port', role: 'heart', wire: 'usbpanel', min: 5, variants: [
             V('USB-C panel-mount extension', 'save', [['az', 9.99, 5, 'USB-C panel mount extension cable']]) ] },
  lipo:    { name: 'LiPo battery 2000mAh', role: 'heart', mAh: 2000, volt: 3.7, size: [60, 36, 7], wire: 'battery', min: 5, variants: [
             V('3.7V 2000mAh LiPo (JST)', 'save', [['az', 11.99, 1, '3.7V 2000mAh LiPo battery JST'], ['dk', 12.5, 1, 'lithium ion polymer battery 3.7V 2000mAh']]) ] },
  charger: { name: 'LiPo charger (USB-C)', role: 'heart', wire: 'charger', min: 10, variants: [
             V('TP4056 USB-C charger', 'save', [['az', 7.99, 10, 'TP4056 USB-C charger module protection']], { solder: true }),
             V('Adafruit USB-C LiPo charger', 'best', [['dk', 7.95, 1, 'Adafruit USB-C LiPo charger BFF']], { solder: true }) ] },
  boost:   { name: '5V boost + charger', role: 'heart', wire: 'charger', min: 15, variants: [
             V('5V 2A boost/charger module', 'save', [['az', 12.99, 2, '5V 2A boost charger module lithium']], { solder: true }),
             V('Adafruit PowerBoost 1000C', 'best', [['dk', 19.95, 1, 'PowerBoost 1000C']], { solder: true }) ] },
  aa4:     { name: '4xAA battery holder', role: 'heart', mAh: 2000, volt: 6, size: [62, 58, 16], wire: 'battery', min: 5, variants: [
             V('4xAA holder with switch', 'save', [['az', 7.99, 4, '4 AA battery holder with switch'], ['dk', 2.2, 1, '4 AA battery holder']]) ] },
  cell18:  { name: '18650 cell + holder', role: 'heart', mAh: 3000, volt: 3.7, size: [77, 21, 21], wire: 'battery', min: 5, variants: [
             V('18650 cell with holder', 'save', [['az', 16.99, 1, '18650 battery with holder protected']]) ] },
  sdmod:   { name: 'microSD module', role: 'brain', pins: { spi: 1 }, wire: 'spi', min: 5, variants: [
             V('microSD card module', 'save', [['az', 7.99, 5, 'micro SD card module SPI']]) ] },
  sdcard:  { name: 'microSD card 32GB', role: 'brain', min: 2, variants: [
             V('32GB microSD', 'save', [['az', 8.99, 1, '32GB microSD card'], ['dk', 12.95, 1, '32GB microSD card industrial']]) ] },

  /* ---- Nerves ---- */
  hookup:  { name: 'Hookup wire (22AWG)', role: 'nerves', min: 0, variants: [
             V('22AWG solid wire kit', 'save', [['az', 14.99, 1, '22 AWG solid hookup wire kit']]) ] },
  perf:    { name: 'Perfboard', role: 'nerves', min: 0, variants: [
             V('Double-sided perfboard', 'save', [['az', 8.99, 10, 'double sided perfboard prototype']]) ] },
  headers: { name: 'Pin headers', role: 'nerves', min: 10, variants: [
             V('2.54mm male headers', 'save', [['az', 5.99, 20, 'male pin headers 2.54mm breakaway']]) ] },
  breadboard: { name: 'Breadboard', role: 'nerves', min: 0, variants: [
             V('830-point breadboard', 'save', [['az', 9.99, 3, '830 point breadboard'], ['dk', 5.95, 1, '830 tie point breadboard']]) ] },
  jumpers: { name: 'Jumper wires', role: 'nerves', min: 0, variants: [
             V('Jumper wire set (M-M, M-F)', 'save', [['az', 6.99, 1, 'dupont jumper wires 120 pcs']]) ] },

  /* ---- Skeleton ---- */
  magnet:  { name: 'Magnets 20x3mm', role: 'skeleton', min: 2, variants: [
             V('N52 neodymium 20x3mm', 'save', [['az', 11.99, 10, '20x3mm neodymium magnets N52']]) ] },
  disc:    { name: 'Steel discs 20mm', role: 'skeleton', min: 1, variants: [
             V('20mm steel discs (glue under panel corners)', 'save', [['az', 7.99, 20, '20mm steel disc washer']]) ] },
  hinge:   { name: 'Hinge', role: 'skeleton', min: 5, variants: [
             V('Small brass hinge with screws', 'save', [['az', 7.99, 10, 'small brass hinges 25mm with screws']]) ] },
  latch:   { name: 'Toggle latch', role: 'skeleton', min: 5, variants: [
             V('Mini toggle latch', 'save', [['az', 8.99, 4, 'mini toggle latch box']]) ] },
  handle:  { name: 'Strap handle', role: 'skeleton', min: 5, variants: [
             V('Leather strap handle', 'save', [['az', 9.99, 2, 'small leather strap handle box']]) ] },
  lock:    { name: 'Key lock hasp', role: 'skeleton', min: 8, variants: [
             V('Mini hasp with key lock', 'save', [['az', 9.99, 2, 'mini box hasp lock with key']]) ] },
  stay:    { name: 'Lid stay', role: 'skeleton', min: 5, variants: [
             V('Folding lid support', 'save', [['az', 8.99, 2, 'small lid support hinge stay']]) ] },
  feet:    { name: 'Rubber feet', role: 'skeleton', min: 1, variants: [
             V('Adhesive rubber feet', 'save', [['az', 5.99, 100, 'adhesive rubber bumper feet']]) ] },
  screws:  { name: 'Screws + standoffs', role: 'skeleton', min: 0, variants: [
             V('M2/M3 standoff + screw kit', 'save', [['az', 12.99, 1, 'M3 M2 brass standoff screw kit']]) ] },
  glue:    { name: 'Super glue', role: 'skeleton', min: 0, variants: [
             V('CA glue (for magnets + discs)', 'save', [['az', 5.99, 1, 'super glue gel CA']]) ] },

  /* ---- Tools (one-time) ---- */
  iron:    { name: 'Soldering iron kit', role: 'tools', variants: [ V('Soldering iron kit', 'save', [['az', 24.99, 1, 'soldering iron kit temperature control']]) ] },
  strip_t: { name: 'Wire strippers', role: 'tools', variants: [ V('Wire stripper', 'save', [['az', 8.99, 1, 'wire stripper 22 AWG']]) ] },
  meter:   { name: 'Multimeter', role: 'tools', variants: [ V('Basic multimeter', 'save', [['az', 14.99, 1, 'digital multimeter beginner']]) ] },
  drivers: { name: 'Precision screwdrivers', role: 'tools', variants: [ V('Precision screwdriver set', 'save', [['az', 9.99, 1, 'precision screwdriver set']]) ] },
  pinvise: { name: 'Hand drill (pin vise)', role: 'tools', variants: [ V('Pin vise with bits', 'save', [['az', 9.99, 1, 'pin vise hand drill set']]) ] },
  crimp:   { name: 'Quick-connect wires', role: 'tools', variants: [ V('Arcade button wiring harness', 'save', [['az', 9.99, 1, 'arcade button quick connect wire harness']]) ] }
};

/* --------------------------------------------------------------------------
   BRAINS — used by the rules engine
   fit: 0 = needs add-ons, 1 = possible, 2 = good, 3 = great
   tier: 1 $ … 5 $$$$$   size: [w, d, h] mm
   pins: pin family for the wiring guide
   -------------------------------------------------------------------------- */
const F = o => Object.assign({ buttons: 1, knobs: 1, display: 1, power: 0, sound: 1, dsp: 0, midi: 1, mic: 0, leds: 1, sensors: 1, storage: 1, hid: 1, battery: 1 }, o);
const BOARDS = [
  { id: 'pico2', tier: 1, wifi: false, bt: false, linux: false, gpio: 26, adc: 3, logic: 3.3, size: [51, 21, 10], pinFamily: 'pico', wokwi: 'pi-pico',
    specs: 'RP2350 · 520 KB SRAM · 4 MB flash · 3 analog pins',
    fit: F({ buttons: 3, knobs: 3, midi: 3, sound: 2, dsp: 1, display: 2, storage: 2, sensors: 3, leds: 3, battery: 2, hid: 3, mic: 1 }) },
  { id: 'pico2w', tier: 1, wifi: true, bt: true, linux: false, gpio: 26, adc: 3, logic: 3.3, size: [51, 21, 10], pinFamily: 'pico', wokwi: 'pi-pico-w',
    specs: 'RP2350 · 520 KB SRAM · Wi-Fi + Bluetooth',
    fit: F({ buttons: 3, knobs: 3, midi: 3, sound: 2, dsp: 1, display: 2, storage: 2, sensors: 3, leds: 3, battery: 2, hid: 3, mic: 1 }) },
  { id: 'esp32s3', tier: 2, wifi: true, bt: true, linux: false, gpio: 36, adc: 10, logic: 3.3, size: [69, 26, 12], pinFamily: 'esp', wokwi: 'esp32-s3',
    specs: 'Dual-core 240 MHz · native USB · Wi-Fi + Bluetooth LE',
    fit: F({ buttons: 3, knobs: 2, midi: 2, sound: 3, dsp: 2, display: 3, storage: 3, sensors: 3, leds: 3, battery: 3, hid: 3, mic: 3 }) },
  { id: 'unor4m', tier: 2, wifi: false, bt: false, linux: false, gpio: 20, adc: 6, logic: 5, size: [69, 53, 15], pinFamily: 'uno', wokwi: 'arduino-uno',
    specs: 'RA4M1 48 MHz · 32 KB RAM · 5V logic · shield-compatible',
    fit: F({ buttons: 3, knobs: 3, midi: 2, sound: 1, dsp: 0, display: 2, storage: 1, sensors: 3, leds: 2, battery: 1, hid: 3, mic: 0 }) },
  { id: 'unor4w', tier: 3, wifi: true, bt: true, linux: false, gpio: 20, adc: 6, logic: 5, size: [69, 53, 15], pinFamily: 'uno', wokwi: 'arduino-uno',
    specs: 'RA4M1 + ESP32-S3 radio · 12x8 LED matrix · 5V logic',
    fit: F({ buttons: 3, knobs: 3, midi: 2, sound: 1, dsp: 0, display: 3, storage: 1, sensors: 3, leds: 3, battery: 1, hid: 3, mic: 0 }) },
  { id: 'daisy', tier: 3, wifi: false, bt: false, linux: false, gpio: 31, adc: 12, logic: 3.3, size: [51, 18, 10], pinFamily: 'generic',
    specs: 'STM32H750 480 MHz · built-in 24-bit stereo audio codec',
    fit: F({ buttons: 2, knobs: 3, midi: 3, sound: 3, dsp: 3, display: 1, storage: 2, sensors: 1, leds: 1, battery: 1, hid: 1, mic: 2 }) },
  { id: 'zero2w', tier: 2, wifi: true, bt: true, linux: true, gpio: 26, adc: 0, logic: 3.3, size: [65, 30, 12], pinFamily: 'pi',
    specs: 'Quad-core 1 GHz · 512 MB RAM · mini-HDMI · runs Linux',
    fit: F({ buttons: 2, knobs: 0, midi: 2, sound: 2, dsp: 1, display: 2, storage: 3, sensors: 2, leds: 1, battery: 2, hid: 2, mic: 2, video: 2, power: 1 }) },
  { id: 'pi5', tier: 5, wifi: true, bt: true, linux: true, gpio: 26, adc: 0, logic: 3.3, size: [85, 56, 25], pinFamily: 'pi',
    specs: 'Quad-core 2.4 GHz · dual 4K HDMI · runs a full desktop',
    fit: F({ buttons: 2, knobs: 0, midi: 2, sound: 2, dsp: 2, display: 3, storage: 3, sensors: 2, leds: 1, battery: 1, hid: 1, mic: 2, video: 3, power: 3 }) }
];

/* What people pick on the Define step */
const FUNCS = [
  ['buttons', 'Buttons', 'buttons', 'senses'],
  ['knobs', 'Knobs & sliders', 'knobs and sliders', 'senses'],
  ['sensors', 'Read sensors', 'sensors', 'senses'],
  ['mic', 'Hear (microphone)', 'microphones', 'senses'],
  ['hid', 'Act as keyboard / gamepad', 'keyboard and gamepad mode', 'senses'],
  ['display', 'Small screen', 'small screens', 'limbs'],
  ['video', 'Big screen / Linux / emulators', 'big screens and Linux', 'limbs'],
  ['sound', 'Play sounds', 'sound', 'limbs'],
  ['dsp', 'Live audio effects', 'live audio effects', 'limbs'],
  ['leds', 'Lights', 'lights', 'limbs'],
  ['midi', 'MIDI', 'MIDI', 'nerves'],
  ['storage', 'Save files or settings', 'storage', 'brain'],
  ['power', 'Heavy apps (desktop, local AI)', 'heavy apps', 'brain'],
  ['battery', 'Run on battery', 'battery power', 'heart']
].map(([id, label, short, role]) => ({ id, label, short, role }));
const WEIGHT = { dsp: 4, video: 2, power: 2 };
const CONNS = [['none', 'Nothing'], ['usb', 'USB'], ['wifi', 'Wi-Fi'], ['bt', 'Bluetooth'], ['usb+bt', 'USB + Bluetooth'], ['wifi+bt', 'Wi-Fi + Bluetooth']];
const BUDGETS = [[1, '$', 'Basic'], [2, '$$', 'Affordable'], [3, '$$$', 'More capable'], [4, '$$$$', 'Advanced'], [5, '$$$$$', 'Go wild']];

/* --------------------------------------------------------------------------
   PANEL PARTS — footprints on the 20mm grid, cutouts in mm to scale
   bom: the real parts this footprint uses
   -------------------------------------------------------------------------- */
const CELL = 20;
const Cc = (x, y, d) => ({ t: 'c', x, y, d }), Rr = (x, y, w, h) => ({ t: 'r', x, y, w, h }), Pp = (x, y, s, a) => ({ t: 'p', x, y, s, a });
const ring6 = [...Array(6)].map((_, i) => Cc(20 + 10 * Math.cos(i * Math.PI / 3), 20 + 10 * Math.sin(i * Math.PI / 3), 4));
const FP = {
  hdmi5:     { name: '5" screen',        w: 8, h: 5, depth: 12, bom: [['hdmi5', 1]], cut: [Rr(80, 50, 110, 65)] },
  tft35:     { name: '3.5" screen',      w: 5, h: 4, depth: 8,  bom: [['tft35', 1]], cut: [Rr(50, 40, 74, 50)] },
  tft24:     { name: '2.4" screen',      w: 4, h: 3, depth: 7,  bom: [['tft24', 1]], cut: [Rr(40, 30, 50, 38)] },
  oled:      { name: 'OLED 1.3"',        w: 2, h: 2, depth: 6,  bom: [['oled', 1]],  cut: [Rr(20, 20, 30, 17)] },
  kbd:       { name: 'Mini keyboard',    w: 8, h: 3, depth: 14, bom: [['kbd', 1]],   cut: [Rr(80, 30, 150, 52)] },
  joystick:  { name: 'Arcade joystick',  w: 6, h: 4, depth: 45, bom: [['joystick', 1]], cut: [Cc(60, 40, 24), Cc(36, 24, 4.2), Cc(84, 24, 4.2), Cc(36, 56, 4.2), Cc(84, 56, 4.2)] },
  cluster6:  { name: '6-button cluster', w: 6, h: 4, depth: 35, bom: [['arcade24', 6]], cut: [Cc(20, 20, 24), Cc(60, 20, 24), Cc(100, 20, 24), Cc(20, 60, 24), Cc(60, 60, 24), Cc(100, 60, 24)] },
  cluster2:  { name: '2-button cluster', w: 2, h: 4, depth: 35, bom: [['arcade24', 2]], cut: [Cc(20, 20, 24), Cc(20, 60, 24)] },
  arcade30:  { name: 'Arcade button',    w: 2, h: 2, depth: 35, bom: [['arcade30', 1]], cut: [Cc(20, 20, 30)] },
  thumb:     { name: 'Thumbstick',       w: 2, h: 2, depth: 18, bom: [['thumb', 1]], cut: [Cc(20, 20, 22)] },
  dpad:      { name: 'D-pad',            w: 2, h: 2, depth: 8,  bom: [['tact6', 4]], cut: [Pp(20, 20, 30, 10)] },
  pad:       { name: 'Drum pad',         w: 2, h: 2, depth: 12, bom: [['piezo', 1]], cut: [Rr(20, 20, 34, 34)] },
  speaker:   { name: 'Speaker grille',   w: 2, h: 2, depth: 18, bom: [['speaker', 1]], cut: [Cc(20, 20, 4), ...ring6] },
  footsw:    { name: 'Footswitch',       w: 2, h: 2, depth: 35, bom: [['footsw', 1]], cut: [Cc(20, 20, 12.2)] },
  slidepot:  { name: 'Slider',           w: 4, h: 2, depth: 15, bom: [['slidepot', 1]], cut: [Rr(40, 20, 62, 3.5)] },
  tact12:    { name: 'Button',           w: 1, h: 1, depth: 10, bom: [['tact12', 1]], cut: [Cc(10, 10, 12.2)] },
  pot:       { name: 'Knob',             w: 1, h: 1, depth: 20, bom: [['pot', 1]], cut: [Cc(10, 10, 7.5)] },
  encoder:   { name: 'Encoder',          w: 1, h: 1, depth: 20, bom: [['encoder', 1]], cut: [Cc(10, 10, 7.2)] },
  toggle:    { name: 'Toggle',           w: 1, h: 1, depth: 15, bom: [['toggle', 1]], cut: [Cc(10, 10, 6.2)] },
  led5:      { name: 'LED',              w: 1, h: 1, depth: 8,  bom: [['led5', 1]], cut: [Cc(10, 10, 5.2)] },
  jack:      { name: 'Audio jack',       w: 1, h: 1, depth: 30, bom: [['jack', 1]], cut: [Cc(10, 10, 9.5)] },
  usbc:      { name: 'USB-C port',       w: 1, h: 1, depth: 10, bom: [['usbc', 1]], cut: [Rr(10, 10, 10, 4)] }
};

/* --------------------------------------------------------------------------
   BODIES — sizes on the 20mm grid, depths in mm
   Depths are working numbers for the product engineer to confirm by test print.
   -------------------------------------------------------------------------- */
const SIZES = {
  XS: { name: 'Extra small', cols: 5,  rows: 4,  lidDepth: 12, baseDepth: 30 },
  S:  { name: 'Small',       cols: 6,  rows: 6,  lidDepth: 14, baseDepth: 40 },
  M:  { name: 'Medium',      cols: 10, rows: 10, lidDepth: 18, baseDepth: 50 },
  L:  { name: 'Large',       cols: 14, rows: 10, lidDepth: 20, baseDepth: 60 }
};
const SHELL = { wall: 3, floor: 2, panel: 3, disc: 1, gap: 0.3, ledge: 2, slotW: 30, slotD: 8, magnetD: 20.3, magnetH: 3.2 };
const STYLES = {
  briefcase: { name: 'Briefcase', text: 'Hinged lid and base. Two swap panels.' },
  box:       { name: 'Box',       text: 'One tray with a single swap panel on top.' }
};
const BATTERIES = {
  none:  { name: 'No battery (USB power)', comps: [] },
  lipo:  { name: 'LiPo pouch 2000mAh', comps: ['lipo'] },
  aa4:   { name: '4xAA holder', comps: ['aa4'] },
  cell18:{ name: '18650 cell', comps: ['cell18'] }
};

/* --------------------------------------------------------------------------
   PRESETS
   panel: [panel, footprint, qty]    inside: [component, qty]
   -------------------------------------------------------------------------- */
const PRESETS = {
  'midi-synth':      { cat: 'Music', name: 'MIDI Synth', desc: 'Knobs, buttons and a slider that make sound and talk MIDI.',
                       funcs: ['sound', 'buttons', 'knobs', 'midi', 'display'], conn: 'usb', budget: 2, style: 'briefcase',
                       panel: [['lid', 'oled', 1], ['base', 'pot', 4], ['base', 'tact12', 8], ['base', 'slidepot', 1], ['base', 'speaker', 1], ['base', 'usbc', 1]] },
  'guitar-pedal':    { cat: 'Music', name: 'Guitar Pedal', desc: 'Real-time effects with a footswitch and knobs.',
                       funcs: ['dsp', 'knobs', 'buttons', 'storage'], conn: 'none', budget: 3, style: 'box',
                       panel: [['base', 'footsw', 1], ['base', 'pot', 3], ['base', 'led5', 1], ['base', 'jack', 2], ['base', 'toggle', 1]] },
  'pocket-player':   { cat: 'Music', name: 'Pocket Music Player', desc: 'Offline player with SD storage and a speaker.',
                       funcs: ['sound', 'buttons', 'display', 'storage', 'battery'], conn: 'none', budget: 2, style: 'briefcase',
                       panel: [['lid', 'tft24', 1], ['base', 'tact12', 5], ['base', 'pot', 1], ['base', 'speaker', 1], ['base', 'usbc', 1]] },
  'drum-machine':    { cat: 'Music', name: 'Drum Machine', desc: 'Step sequencer with tap pads.',
                       funcs: ['sound', 'buttons', 'knobs', 'midi', 'leds'], conn: 'usb', budget: 2, style: 'briefcase',
                       panel: [['lid', 'oled', 1], ['base', 'speaker', 1], ['base', 'pad', 8], ['base', 'pot', 2], ['base', 'tact12', 4]] },
  'cyberdeck':       { cat: 'Computing', name: 'Cyberdeck', desc: 'Portable field terminal with a screen and keyboard.',
                       funcs: ['video', 'hid', 'storage', 'battery'], conn: 'wifi+bt', budget: 3, style: 'briefcase',
                       panel: [['lid', 'hdmi5', 1], ['base', 'kbd', 1], ['base', 'thumb', 1], ['base', 'tact12', 2], ['base', 'usbc', 1]] },
  'ai-assistant':    { cat: 'Computing', name: 'Personal AI Assistant', desc: 'Voice assistant that runs its model on the device.',
                       funcs: ['mic', 'sound', 'display', 'leds', 'buttons', 'power'], conn: 'wifi', budget: 5, style: 'briefcase',
                       panel: [['lid', 'tft35', 1], ['base', 'speaker', 1], ['base', 'tact12', 2], ['base', 'led5', 3], ['base', 'usbc', 1]] },
  'linux-laptop':    { cat: 'Computing', name: 'Linux Laptop', desc: 'A small laptop around a single-board computer.',
                       funcs: ['video', 'power', 'hid', 'storage', 'battery'], conn: 'wifi+bt', budget: 5, style: 'briefcase',
                       panel: [['lid', 'hdmi5', 1], ['base', 'kbd', 1], ['base', 'thumb', 1], ['base', 'usbc', 1]] },
  'game-controller': { cat: 'Games', name: 'Game Controller', desc: 'Custom USB or Bluetooth gamepad.',
                       funcs: ['buttons', 'hid', 'battery'], conn: 'usb+bt', budget: 2, style: 'box',
                       panel: [['base', 'dpad', 1], ['base', 'thumb', 2], ['base', 'tact12', 6], ['base', 'usbc', 1]] },
  'portable-arcade': { cat: 'Games', name: 'Portable Arcade', desc: 'Retro emulator with a screen, stick and buttons.',
                       funcs: ['video', 'sound', 'buttons', 'hid', 'battery'], conn: 'none', budget: 3, style: 'briefcase',
                       panel: [['lid', 'hdmi5', 1], ['base', 'speaker', 1], ['base', 'joystick', 1], ['base', 'cluster6', 1]] },
  'led-light':       { cat: 'Light + Environment', name: 'LED Light', desc: 'Addressable color lights with modes.',
                       funcs: ['leds', 'buttons', 'knobs'], conn: 'wifi', budget: 1, style: 'box',
                       panel: [['base', 'pot', 2], ['base', 'tact12', 3], ['base', 'toggle', 1]], inside: [['strip', 1]] },
  'plant-monitor':   { cat: 'Light + Environment', name: 'Plant Monitor', desc: 'Soil moisture, temperature and humidity.',
                       funcs: ['sensors', 'display', 'battery'], conn: 'wifi', budget: 1, style: 'box',
                       panel: [['base', 'oled', 1], ['base', 'tact12', 2], ['base', 'led5', 3]], inside: [['soil', 1], ['bme280', 1]] },
  'scratch':         { cat: 'Start from scratch', name: 'I Have an Idea', desc: 'Start blank. Pick what it should do and we suggest the rest.',
                       funcs: ['buttons', 'display'], conn: 'usb', budget: 2, style: 'briefcase', panel: null }
};

/* --------------------------------------------------------------------------
   WORKBENCH — what the parts tray offers, with beginner descriptions
   kind 'fp' = goes on a panel, 'comp' = lives inside, 'heart' = battery
   -------------------------------------------------------------------------- */
const TRAY = [
  { role: 'senses', items: [
    ['fp', 'tact12',   'Button',        'button',   'A push button. The brain feels every press.'],
    ['fp', 'pot',      'Knob',          'knob',     'Turn it and the brain reads a number from 0 to 100%.'],
    ['fp', 'slidepot', 'Slider',        'slider',   'Push it up or down to change a value smoothly.'],
    ['fp', 'encoder',  'Endless knob',  'encoder',  'A knob that turns forever and clicks. Great for menus.'],
    ['fp', 'toggle',   'Flip switch',   'toggle',   'A switch that stays on or off.'],
    ['fp', 'thumb',    'Thumbstick',    'thumb',    'A small stick like a game controller. It tells the brain how far you push.'],
    ['fp', 'dpad',     'D-pad',         'dpad',     'A plus-shaped direction pad made from four tiny buttons.'],
    ['fp', 'joystick', 'Arcade stick',  'joystick', 'An arcade stick. Four switches inside tell the brain up, down, left and right.'],
    ['fp', 'arcade30', 'Big button',    'button',   'One big 30mm arcade button. Made to be smacked.'],
    ['fp', 'cluster6', '6 arcade buttons', 'buttons', 'Six arcade buttons in a block, like a fight stick.'],
    ['fp', 'pad',      'Drum pad',      'pad',      'A piezo disc under the pad feels how hard you hit it.'],
    ['fp', 'footsw',   'Foot switch',   'footswitch', 'A heavy switch you stomp on, like on a guitar pedal.'],
    ['fp', 'kbd',      'Mini keyboard', 'keyboard', 'A small keyboard for typing. Needs a Linux brain.'],
    ['comp', 'mic',    'Microphone',    'mic',      'Lets the device hear you.'],
    ['comp', 'soil',   'Soil sensor',   'sensor',   'Pokes into a plant pot and tells the brain how wet the soil is.'],
    ['comp', 'bme280', 'Temp sensor',   'sensor',   'Feels temperature, humidity and air pressure.'] ] },
  { role: 'limbs', items: [
    ['fp', 'led5',    'Light',          'led',      'A small light the brain can turn on, off or blink.'],
    ['fp', 'oled',    'Tiny screen',    'screen',   'A small sharp screen for words and simple graphics.'],
    ['fp', 'tft24',   'Color screen',   'screen',   'A 2.4-inch color screen for menus, pictures and games.'],
    ['fp', 'tft35',   'Bigger screen',  'screen',   'A 3.5-inch color screen.'],
    ['fp', 'hdmi5',   '5-inch screen',  'screen',   'Shows a full computer desktop. Needs a Linux brain.'],
    ['fp', 'speaker', 'Speaker',        'speaker',  'Lets the device talk and play sound. We add the small amp it needs.'],
    ['fp', 'jack',    'Audio jack',     'jack',     'A 1/4-inch plug for guitars, headphones or amps.'],
    ['comp', 'strip', 'LED strip',      'strip',    'A strip of 60 color lights the brain controls one by one.'] ] },
  { role: 'heart', items: [
    ['heart', 'lipo',   'LiPo battery', 'battery', 'A flat rechargeable battery. Charges over USB-C.'],
    ['heart', 'aa4',    'AA batteries', 'battery', 'Holds four AA batteries. Easy to swap.'],
    ['heart', 'cell18', '18650 battery','battery', 'One big rechargeable cell for long run times.'],
    ['fp', 'usbc',      'USB-C port',   'usb',     'A USB-C port on the outside of the case for power and code.'] ] }
];
/* Things the brain might need that aren't a physical part */
const EXTRAS = [['dsp', 'Live audio effects'], ['midi', 'MIDI'], ['storage', 'Save files'], ['power', 'Heavy apps (desktop, local AI)'], ['hid', 'Act as keyboard / gamepad']];
const ANALOGY = {
  senses: 'This is a sense. It tells the brain what is happening.',
  limbs: 'This is a limb. The brain uses it to act.',
  heart: 'This is the heart. It keeps everything alive.',
  brain: 'This is the brain. Every nerve runs back to it.'
};

/* --------------------------------------------------------------------------
   v0.6 — ORDERING
   Store details, overseas options, and the things people forget to buy.
   -------------------------------------------------------------------------- */
Object.assign(STORES.az, { days: '1–3 days', overseas: false });
Object.assign(STORES.dk, { days: '2–4 days', overseas: false });
STORES.lcsc = { name: 'LCSC', days: '7–15 days', overseas: true, url: q => `https://www.lcsc.com/search?q=${encodeURIComponent(q)}` };
STORES.ali  = { name: 'AliExpress', days: '10–25 days', overseas: true, url: q => `https://www.aliexpress.us/w/wholesale-${encodeURIComponent(q.replace(/\s+/g, '-'))}.html` };
Object.assign(CZ_CONFIG.shipping, { lcsc: 9, ali: 0 });
/* US imports no longer have a duty-free limit. Overseas prices get this added
   so comparisons stay honest; the store checkout shows the real charge. */
CZ_CONFIG.importEstimate = 0.30;

/* Overseas price estimates: [store, price, pack, search]. Batteries are left out
   because shipping lithium cells from overseas is restricted and slow. */
const OVERSEAS = {
  esp32s3: [['ali', 7, 1, 'ESP32-S3 N16R8 development board']],
  tact12: [['ali', 3.5, 20, '12mm momentary push button']], tact6: [['ali', 1.5, 100, '6x6 tactile switch'], ['lcsc', 0.03, 1, 'TS-1187A tactile switch']],
  arcade24: [['ali', 5, 10, '24mm arcade button']], arcade30: [['ali', 6, 10, '30mm arcade button']], joystick: [['ali', 6, 1, 'arcade joystick 8 way']],
  thumb: [['ali', 3, 5, 'PS2 joystick module']], pot: [['ali', 4, 10, '10k potentiometer knob kit'], ['lcsc', 0.6, 1, 'RV09 10k potentiometer']],
  encoder: [['ali', 3, 5, 'EC11 rotary encoder'], ['lcsc', 0.5, 1, 'EC11 rotary encoder']], slidepot: [['ali', 4, 4, '45mm slide potentiometer']],
  toggle: [['ali', 3, 10, 'mini toggle switch SPDT']], footsw: [['ali', 6, 5, '3PDT footswitch']], piezo: [['ali', 2, 20, '27mm piezo disc']],
  mic: [['ali', 3.5, 3, 'INMP441 I2S microphone']], soil: [['ali', 3.5, 5, 'capacitive soil moisture sensor']], bme280: [['ali', 4, 3, 'BME280 module']],
  mux16: [['ali', 3, 5, 'CD74HC4067 module']], ads1115: [['ali', 4, 3, 'ADS1115 module']],
  led5: [['ali', 2.5, 100, '5mm LED kit'], ['lcsc', 0.03, 1, '5mm LED']], strip: [['ali', 5, 1, 'WS2812B 1m 60 LED strip']],
  speaker: [['ali', 4, 4, '40mm 3W 4 ohm speaker']], amp: [['ali', 3.5, 3, 'MAX98357A module']], codec: [['ali', 8, 1, 'WM8960 audio module']],
  oled: [['ali', 3.5, 1, '1.3 inch OLED I2C SH1106']], tft24: [['ali', 6, 1, '2.4 inch TFT ILI9341 SPI']], tft35: [['ali', 9, 1, '3.5 inch TFT ILI9488 SPI']],
  hdmi5: [['ali', 25, 1, '5 inch HDMI display 800x480']], jack: [['ali', 3.5, 10, '6.35mm mono jack']], usbc: [['ali', 4, 5, 'USB-C panel mount extension']],
  charger: [['ali', 3, 10, 'TP4056 USB-C module']], boost: [['ali', 5, 2, '5V 2A boost charger module']], sdmod: [['ali', 3, 5, 'micro SD card module SPI']],
  hookup: [['ali', 7, 1, '22AWG solid wire kit']], perf: [['ali', 4, 10, 'double sided perfboard']], headers: [['ali', 2, 20, '2.54mm male pin header'], ['lcsc', 0.1, 1, '2.54mm 1x40 pin header']],
  breadboard: [['ali', 4, 3, '830 point breadboard']], jumpers: [['ali', 3, 1, 'dupont jumper wire set']],
  magnet: [['ali', 5, 10, '20x3mm neodymium magnet']], disc: [['ali', 3, 20, '20mm steel disc']], hinge: [['ali', 3.5, 10, 'small brass hinge 25mm']],
  latch: [['ali', 4, 4, 'mini toggle latch']], handle: [['ali', 4, 2, 'leather strap handle']], lock: [['ali', 4.5, 2, 'mini hasp lock key']],
  stay: [['ali', 4, 2, 'lid support hinge']], feet: [['ali', 2, 100, 'adhesive rubber feet']], screws: [['ali', 6, 1, 'M3 brass standoff kit']],
  reskit: [['ali', 3, 1, 'resistor assortment kit']], usbMicro: [['ali', 3, 1, 'micro USB data cable']], usbC: [['ali', 3, 1, 'USB-C data cable']], sdreader: [['ali', 3, 1, 'USB micro SD card reader']]
};

/* Things people forget until the box shows up. Added automatically, with the reason. */
Object.assign(COMP, {
  reskit:   { name: 'Resistor kit', role: 'nerves', forgot: true, min: 0, variants: [V('Resistor assortment (includes 330Ω and 1MΩ)', 'save', [['az', 7.99, 1, 'resistor assortment kit 1/4W'], ['dk', 9.95, 1, 'resistor kit assortment through hole']])] },
  usbMicro: { name: 'Micro-USB data cable', role: 'heart', forgot: true, min: 0, variants: [V('Micro-USB cable that carries data', 'save', [['az', 6.99, 2, 'micro USB data sync cable'], ['dk', 3.95, 1, 'micro USB cable data']])] },
  usbC:     { name: 'USB-C data cable', role: 'heart', forgot: true, min: 0, variants: [V('USB-C cable that carries data', 'save', [['az', 7.99, 2, 'USB-C data cable'], ['dk', 4.95, 1, 'USB C to A cable data']])] },
  psuPi5:   { name: 'Pi 5 power supply', role: 'heart', forgot: true, min: 0, variants: [V('Official 27W USB-C supply (5V 5A)', 'bal', [['dk', 12, 1, 'Raspberry Pi 27W USB-C power supply'], ['az', 14, 1, 'Raspberry Pi 27W USB-C power supply']])] },
  psuZero:  { name: 'Zero power supply', role: 'heart', forgot: true, min: 0, variants: [V('Official micro-USB supply (5.1V 2.5A)', 'bal', [['dk', 8, 1, 'Raspberry Pi micro USB power supply 2.5A'], ['az', 10, 1, 'Raspberry Pi micro USB power supply 2.5A']])] },
  miniHdmi: { name: 'Mini-HDMI cable', role: 'nerves', forgot: true, min: 0, variants: [V('Mini-HDMI to HDMI cable', 'save', [['az', 7.99, 1, 'mini HDMI to HDMI cable short'], ['dk', 6.95, 1, 'mini HDMI to HDMI cable']])] },
  microHdmi:{ name: 'Micro-HDMI cable', role: 'nerves', forgot: true, min: 0, variants: [V('Micro-HDMI to HDMI cable', 'save', [['az', 7.99, 1, 'micro HDMI to HDMI cable short'], ['dk', 6.95, 1, 'Raspberry Pi micro HDMI cable']])] },
  sdreader: { name: 'microSD card reader', role: 'tools', forgot: true, min: 0, variants: [V('USB microSD reader (to install the operating system)', 'save', [['az', 7.99, 1, 'USB micro SD card reader']])] }
});
for (const [id, rows] of Object.entries(OVERSEAS)) if (COMP[id]) COMP[id].variants.forEach(v => { v.src = v.src.concat(rows); });

/* Which USB cable each brain needs, and where to go for code + simulation. */
const BOARD_TOOLS = {
  pico2:   { usb: 'usbMicro', lang: 'MicroPython', sim: 'https://wokwi.com/projects/new/micropython-pi-pico', simNote: 'Wokwi simulates the original Pico. Your code runs the same on a Pico 2.',
             setup: [['Put MicroPython on your Pico', 'https://www.raspberrypi.com/documentation/microcontrollers/micropython.html'], ['Get Thonny, a free beginner code editor', 'https://thonny.org']] },
  pico2w:  { usb: 'usbMicro', lang: 'MicroPython', sim: 'https://wokwi.com/projects/new/micropython-pi-pico-w', simNote: 'Wokwi simulates the original Pico W. Your code runs the same on a Pico 2 W.',
             setup: [['Put MicroPython on your Pico', 'https://www.raspberrypi.com/documentation/microcontrollers/micropython.html'], ['Get Thonny, a free beginner code editor', 'https://thonny.org']] },
  esp32s3: { usb: 'usbC', lang: 'MicroPython', sim: 'https://wokwi.com/projects/new/micropython-esp32-s3',
             setup: [['Download MicroPython for the ESP32-S3', 'https://micropython.org/download/ESP32_GENERIC_S3/'], ['Get Thonny, a free beginner code editor', 'https://thonny.org']] },
  unor4m:  { usb: 'usbC', lang: 'Arduino', sim: 'https://wokwi.com/projects/new/arduino-uno', simNote: 'Wokwi simulates the classic UNO. Pins match the UNO R4.',
             setup: [['Get the free Arduino IDE', 'https://www.arduino.cc/en/software']] },
  unor4w:  { usb: 'usbC', lang: 'Arduino', sim: 'https://wokwi.com/projects/new/arduino-uno', simNote: 'Wokwi simulates the classic UNO. Pins match the UNO R4.',
             setup: [['Get the free Arduino IDE', 'https://www.arduino.cc/en/software']] },
  daisy:   { usb: 'usbMicro', lang: 'Daisy (C++)', sim: null,
             setup: [['Flash ready-made programs from your browser', 'https://github.com/electro-smith/Programmer'], ['Official Daisy example projects', 'https://github.com/electro-smith/DaisyExamples']] },
  zero2w:  { usb: null, psu: 'psuZero', hdmi: 'miniHdmi', lang: 'Python', sim: null,
             setup: [['Install Raspberry Pi OS with Raspberry Pi Imager', 'https://www.raspberrypi.com/software/'], ['gpiozero: the easy way to use pins in Python', 'https://gpiozero.readthedocs.io']] },
  pi5:     { usb: null, psu: 'psuPi5', hdmi: 'microHdmi', lang: 'Python', sim: null,
             setup: [['Install Raspberry Pi OS with Raspberry Pi Imager', 'https://www.raspberrypi.com/software/'], ['gpiozero: the easy way to use pins in Python', 'https://gpiozero.readthedocs.io']] }
};
const PROJECT_SEARCH = [
  ['Instructables', q => `https://www.instructables.com/search/?q=${encodeURIComponent(q)}`],
  ['Hackster', q => `https://www.hackster.io/search?q=${encodeURIComponent(q)}`],
  ['Adafruit Learn', q => `https://learn.adafruit.com/search?q=${encodeURIComponent(q)}`]
];
