// ============================================================
// BANANA POEM GENERATOR — MediaPipe object detection
// ============================================================

const bananaVideo  = document.getElementById('video');
const bananaCanvas = document.getElementById('bananaCanvas');
const bananaCtx    = bananaCanvas.getContext('2d');

let objectDetector   = null;
let lastObjectResult = null;
let currentScene     = 'both';
let poemWords        = [];
let wasBananaVisible = false;

const audioTokyo     = new Audio('../mp3_data/grateful.mp3');
const audioManhattan = new Audio('../mp3_data/true.mp3');

// MediaPipe CDN paths
const WASM_PATH   = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const OBJECT_MODEL = 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite';

// COCO label map for efficientdet_lite0
const COCO_LABELS = [
  'background','person','bicycle','car','motorcycle','airplane','bus','train','truck','boat',
  'traffic light','fire hydrant','stop sign','parking meter','bench','bird','cat','dog','horse','sheep',
  'cow','elephant','bear','zebra','giraffe','backpack','umbrella','handbag','tie','suitcase',
  'frisbee','skis','snowboard','sports ball','kite','baseball bat','baseball glove','skateboard','surfboard','tennis racket',
  'bottle','wine glass','cup','fork','knife','spoon','bowl','banana','apple','sandwich',
  'orange','broccoli','carrot','hot dog','pizza','donut','cake','chair','couch','potted plant',
  'bed','dining table','toilet','tv','laptop','mouse','remote','keyboard','cell phone','microwave',
  'oven','toaster','sink','refrigerator','book','clock','vase','scissors','teddy bear','hair drier','toothbrush'
];

async function init() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    bananaVideo.srcObject = stream;
    await bananaVideo.play();

    const { ObjectDetector, FilesetResolver } = await import(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js'
    );
    const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
    objectDetector = await ObjectDetector.createFromModelPath(vision, OBJECT_MODEL);
    objectDetector.setOptions({ runningMode: 'VIDEO', maxResults: 10, scoreThreshold: 0.25 });

    const txt = await fetch('../data/extrinsic_value.txt').then(r => r.text()).catch(() => '');
    poemWords = extractWords(txt);

    setupArrowKeys();
    resize();
    window.addEventListener('resize', resize);
    detectLoop();
  } catch (e) {
    console.error('Banana init error:', e);
  }
}

function resize() {
  const vw = bananaVideo.videoWidth  || 640;
  const vh = bananaVideo.videoHeight || 480;
  bananaCanvas.width  = vw;
  bananaCanvas.height = vh;
}

function detectLoop() {
  if (!bananaVideo.videoWidth) { requestAnimationFrame(detectLoop); return; }
  const ts = performance.now();
  if (objectDetector) {
    try { lastObjectResult = objectDetector.detectForVideo(bananaVideo, ts); } catch (_) {}
  }
  draw();
  updatePoemOverlay();
  requestAnimationFrame(detectLoop);
}

function draw() {
  bananaCtx.clearRect(0, 0, bananaCanvas.width, bananaCanvas.height);
  if (!lastObjectResult?.detections?.length) return;
  for (const d of lastObjectResult.detections) {
    const cat  = d.categories?.[0];
    const name = (cat?.categoryName ?? COCO_LABELS[cat?.index ?? -1] ?? '').toLowerCase();
    if (name !== 'banana') continue;
    const box = d.boundingBox;
    if (!box) continue;
    const { originX: x = 0, originY: y = 0, width: w = 0, height: h = 0 } = box;
    bananaCtx.drawImage(bananaVideo, x, y, w, h, x, y, w, h);
  }
}

// ---- Poem generation ----

const STOP = new Set(
  'the a an and or but in on at to for of with by from as is was are were be been being have has had do does did will would could should may might must shall can need'
  .split(' ')
);

function extractWords(txt) {
  const words = txt
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
  return [...new Set(words)];
}

function pick(arr, n) {
  const out = [], copy = [...arr];
  for (let i = 0; i < n && copy.length; i++)
    out.push(...copy.splice(Math.floor(Math.random() * copy.length), 1));
  return out;
}

function generatePoem() {
  if (!poemWords.length) return 'banana — comfort — value — accessibility — stability';
  const w = () => pick(poemWords, 1)[0];
  const templates = [
    () => [`the ${w()} of ${w()}`, `${w()}, ${w()} —`, pick(poemWords, 3).join(' '), `${w()} and ${w()}`, `when ${w()} becomes ${w()}`],
    () => [`${w()} beneath ${w()}`, pick(poemWords, 2).join(', '), `the ${w()} we forget`, pick(poemWords, 3).join(' '), `${w()} persists`],
    () => [pick(poemWords, 2).join(' '), `${w()} in the ${w()}`, pick(poemWords, 2).join(', '), `small ${w()}`, `${w()} and ${w()}`],
    () => [`what ${w()} conceals`, pick(poemWords, 3).join(' '), `${w()} or ${w()}`, pick(poemWords, 2).join(' '), `the ${w()} remains`],
    () => [pick(poemWords, 2).join(' '), `a ${w()} of ${w()}`, pick(poemWords, 3).join(' '), `${w()} embedded`, pick(poemWords, 2).join(' ')]
  ];
  return templates[Math.floor(Math.random() * templates.length)]().join(' — ');
}

function updatePoemOverlay() {
  let bananaFound = false, largestBoxArea = 0;
  if (lastObjectResult?.detections?.length) {
    for (const d of lastObjectResult.detections) {
      const cat  = d.categories?.[0];
      const name = (cat?.categoryName ?? COCO_LABELS[cat?.index ?? -1] ?? '').toLowerCase();
      if (name === 'banana') {
        bananaFound = true;
        const box = d.boundingBox;
        if (box?.width && box?.height) {
          const area = box.width * box.height;
          if (area > largestBoxArea) largestBoxArea = area;
        }
      }
    }
  }

  const frame  = document.getElementById('poemFrame');
  const poemEl = document.getElementById('poemText');

  if (bananaFound) {
    frame.classList.add('visible');
    if (!wasBananaVisible) poemEl.textContent = generatePoem();
    wasBananaVisible = true;
    const canvasArea = bananaCanvas.width * bananaCanvas.height;
    const t = Math.max(0, Math.min(1, (largestBoxArea - canvasArea * 0.02) / (canvasArea * 0.33)));
    poemEl.style.fontSize = Math.round(20 + t * (80 - 20)) + 'px';
  } else {
    frame.classList.remove('visible');
    wasBananaVisible = false;
    poemEl.style.fontSize = '';
  }
}

// ---- Scene switching ----

function setScene(scene) {
  currentScene = scene;
  const sceneEl = document.querySelector('.scene');
  if (sceneEl) sceneEl.className = 'scene scene-' + scene;

  const label = document.getElementById('banana-city-label');
  if (label) {
    label.textContent = scene === 'both' ? 'Tokyo + Manhattan'
      : scene === 'tokyo' ? 'Tokyo' : 'Manhattan';
  }

  updateMarquee(scene);

  audioTokyo.pause();    audioTokyo.currentTime    = 0;
  audioManhattan.pause(); audioManhattan.currentTime = 0;
  if (scene === 'tokyo')     audioTokyo.play().catch(() => {});
  else if (scene === 'manhattan') audioManhattan.play().catch(() => {});
  else if (scene === 'both') {
    audioTokyo.play().catch(() => {});
    audioManhattan.play().catch(() => {});
  }
}

// ---- Marquee (3 bars, different speeds) ----

function getMarqueeUnitHTML(scene) {
  const red   = t => `<span style="color:#e63946">${t}</span>`;
  const green = t => `<span style="color:#00cc66">${t}</span>`;
  const sep = '  —  ';
  let part;
  if (scene === 'tokyo')     part = red('BANANA FOR $1');
  else if (scene === 'manhattan') part = green('BANANA FOR $2');
  else part = red('BANANA FOR $1') + ' AND ' + green('BANANA FOR $2');
  return Array(3).fill(part).join(sep) + '  —  ';
}

function updateMarquee(scene) {
  const tracks = document.querySelectorAll('.marquee-track');
  const unitHTML = getMarqueeUnitHTML(scene);
  const baseStyle = 'font-family:Arial,sans-serif;font-weight:bold;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;flex-shrink:0;padding-right:2em';
  tracks.forEach(track => {
    track.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const span = document.createElement('span');
      span.className = 'marquee-content';
      span.setAttribute('style', baseStyle);
      span.innerHTML = unitHTML;
      track.appendChild(span);
    }
  });
}

// Arrow keys for scene switching
function setupArrowKeys() {
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setScene('tokyo'); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setScene('manhattan'); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); setScene('both'); }
  });
}

bananaVideo.addEventListener('loadedmetadata', resize);

setScene('both');
init();
