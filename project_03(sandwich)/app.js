(function () {
  "use strict";

  const MOOD_CSV_FALLBACK = `index,observation,your feeling ,feeling after constructed sandwich
1,airy,open,open
2,charged,tense,tense
3,warm,content,content
4,sharp,alert,alert
5,hazy,uncertain,uncertain
6,heavy,drained,drained
7,bright,hopeful,hopeful
8,calm,steady,steady
9,noisy,overwhelmed,overwhelmed
10,soft,comforted,comforted
11,restless,impatient,impatient
12,grounded,balanced,balanced
13,focused,determined,determined
14,playful,curious,curious
15,flat,numb,numb
16,uneasy,anxious,anxious
17,clear,confident,confident
18,sensitive,tender,tender
19,pressured,stressed,stressed
20,light,relieved,relieved
21,skeptical,distant,distant
22,connected,supported,supported
23,fired-up,energized,energized
24,settled,peaceful,peaceful
25,hungry,hungry,hungry
26,unhealthy,unhealthy,unhealthy
27,happy,happy,happy
28,judged,judged,judged
29,delightful,delightful,delightful
30,satisfied,satisfied,satisfied`;

  const CATEGORIES = [
    {
      title: "Bread",
      folder: "bread_png",
      items: [
        { id: "white_toast", name: "White Toast", file: "white_toast.png" },
        { id: "wheat", name: "Wheat", file: "wheat.png" },
        { id: "sourdough", name: "Sourdough", file: "sourdough.png" },
        { id: "crossaint", name: "Crossaint", file: "crossaint.png" },
        { id: "bun", name: "Bun", file: "bun.png" },
      ],
    },
    {
      title: "Vegetables",
      folder: "vegetables_png",
      items: [
        { id: "brocolli", name: "Broccoli", file: "brocolli.png" },
        { id: "carrots", name: "Carrots", file: "carrots.png" },
        { id: "cucumber", name: "Cucumber", file: "cucumber.png" },
        { id: "eggplant", name: "Eggplant", file: "eggplant.png" },
        { id: "jalepeno", name: "Jalapeño", file: "jalepeno.png" },
        { id: "lettuce", name: "Lettuce", file: "lettuce.png" },
        { id: "olives", name: "Olives", file: "olives.png" },
        { id: "onion", name: "Onion", file: "onion.png" },
        { id: "spinach", name: "Spinach", file: "spinach.png" },
        { id: "tomato", name: "Tomato", file: "tomato.png" },
      ],
    },
    {
      title: "Protein",
      folder: "protein_png",
      items: [
        { id: "carnitas", name: "Carnitas", file: "carnitas.png" },
        { id: "chickenbites", name: "Chicken bites", file: "chickenbites.png" },
        { id: "chickentender", name: "Chicken tender", file: "chickentender.png" },
        { id: "chickpeas", name: "Chickpeas", file: "chickpeas.png" },
        { id: "egg", name: "Egg", file: "egg.png" },
        { id: "greekyogurt", name: "Greek yogurt", file: "greekyogurt.png" },
        { id: "peanuts", name: "Peanuts", file: "peanuts.png" },
        { id: "roastbeef", name: "Roast beef", file: "roastbeef.png" },
        { id: "tofu", name: "Tofu", file: "tofu.png" },
        { id: "tuna", name: "Tuna", file: "tuna.png" },
      ],
    },
    {
      title: "Cheese",
      folder: "cheese_png",
      items: [
        { id: "bluecheese", name: "Blue cheese", file: "bluecheese.png" },
        { id: "cheddarcheese", name: "Cheddar", file: "cheddarcheese.png" },
        { id: "cottagecheese", name: "Cottage cheese", file: "cottagecheese.png" },
        { id: "creamcheese", name: "Cream cheese", file: "creamcheese.png" },
        { id: "fetacheese", name: "Feta", file: "fetacheese.png" },
        { id: "gouda", name: "Gouda", file: "gouda.png" },
        { id: "macandcheese", name: "Mac and cheese", file: "macandcheese.png" },
        { id: "mozzarella", name: "Mozzarella", file: "mozzarella.png" },
        { id: "paramasan", name: "Parmesan", file: "paramasan.png" },
        { id: "pepperjack", name: "Pepper jack", file: "pepperjack.png" },
      ],
    },
    {
      title: "Dressing & more",
      folder: "dressing_png",
      items: [
        { id: "bbq_sauce", name: "BBQ sauce", file: "bbq_sauce.png" },
        { id: "blackpeppers", name: "Black pepper", file: "blackpeppers.png" },
        { id: "chipotle", name: "Chipotle", file: "chipotle.png" },
        { id: "hotsauce", name: "Hot sauce", file: "hotsauce.png" },
        { id: "ketchup", name: "Ketchup", file: "ketchup.png" },
        { id: "mayo", name: "Mayo", file: "mayo.png" },
        { id: "mustard", name: "Mustard", file: "mustard.png" },
        { id: "oliveoil", name: "Olive oil", file: "oliveoil.png" },
        { id: "ranch_dressing", name: "Ranch", file: "ranch_dressing.png" },
        { id: "salt", name: "Salt", file: "salt.png" },
      ],
    },
  ];

  const byId = new Map();
  CATEGORIES.forEach((cat) => {
    cat.items.forEach((it) => {
      byId.set(it.id, { ...it, folder: cat.folder });
    });
  });

  let stack = [];
  let globalIndex = 0;
  let moodRows = [];
  let selectedMood = null; /* step 0 mood pick */
  let imageMoodIndex = null; /* step 1 mood pick */
  let afterIndex = null; /* step 3 mood pick */
  let firstMoodFacePhoto = "";
  let finalMoodFacePhoto = "";
  let currentStep = 0;
  let faceLandmarker = null;
  let faceCaptureVideo = null;
  let faceCaptureCanvas = null;
  let faceCaptureStream = null;
  let mediaPipeReady = false;
  let mediaPipeError = false;
  let activityPhotoSamples = [];
  let activitySamplerId = null;
  let activityStartedAt = 0;
  let activityEndedAt = 0;
  let firstCaptureInProgress = false;
  const faceDetectionPreviewCache = new Map();
  let faceDetectionRenderToken = 0;

  const plateStack = document.getElementById("plateStack");
  const receiptPlateStack = document.getElementById("receiptPlateStack");
  const emptyHint = document.getElementById("emptyHint");
  const bodegaRoot = document.getElementById("bodegaRoot");
  const btnReset = document.getElementById("btnReset");
  const moodGrid = document.getElementById("moodGrid");
  const moodLoadError = document.getElementById("moodLoadError");
  const checkinMoodGrid = document.getElementById("checkinMoodGrid");
  const afterMoodGrid = document.getElementById("afterMoodGrid");
  const step1Context = document.getElementById("step1Context");
  const doneBanner = document.getElementById("doneBanner");
  const btnToBuild = document.getElementById("btnToBuild");
  const btnBack1 = document.getElementById("btnBack1");
  const btnBack2 = document.getElementById("btnBack2");
  const btnToReceipt = document.getElementById("btnToReceipt");
  const btnBack3 = document.getElementById("btnBack3");
  const btnPrintReceipt = document.getElementById("btnPrintReceipt");
  const btnToFinalReceipt = document.getElementById("btnToFinalReceipt");
  const btnBack4 = document.getElementById("btnBack4");
  const receiptPanel = document.getElementById("receiptPanel");
  const activityPhotoGrid = document.getElementById("activityPhotoGrid");
  const timeTakenValue = document.getElementById("timeTakenValue");
  const timeTakenSub = document.getElementById("timeTakenSub");
  const faceDetectionGrid = document.getElementById("faceDetectionGrid");
  const btnClearPlate = document.getElementById("btnClearPlate");
  const btnClearLast = document.getElementById("btnClearLast");
  const btnToNextFromMood0 = document.getElementById("btnToNextFromMood0");

  function getPlateTargets() {
    return [plateStack, receiptPlateStack].filter(Boolean);
  }

  async function ensureFaceCaptureNodes() {
    if (!faceCaptureVideo) {
      faceCaptureVideo = document.createElement("video");
      faceCaptureVideo.setAttribute("playsinline", "");
      faceCaptureVideo.setAttribute("autoplay", "");
      faceCaptureVideo.muted = true;
      faceCaptureVideo.style.position = "fixed";
      faceCaptureVideo.style.width = "1px";
      faceCaptureVideo.style.height = "1px";
      faceCaptureVideo.style.opacity = "0";
      faceCaptureVideo.style.pointerEvents = "none";
      faceCaptureVideo.style.left = "-9999px";
      faceCaptureVideo.style.top = "-9999px";
      document.body.appendChild(faceCaptureVideo);
    }
    if (!faceCaptureCanvas) {
      faceCaptureCanvas = document.createElement("canvas");
      faceCaptureCanvas.width = 640;
      faceCaptureCanvas.height = 480;
    }
  }

  async function ensureMediaPipeReady() {
    if (mediaPipeReady || mediaPipeError) return mediaPipeReady;
    try {
      const { FaceLandmarker, FilesetResolver } = await import(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs"
      );
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );
      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        outputFaceBlendshapes: false,
        runningMode: "IMAGE",
        numFaces: 1,
      });
      mediaPipeReady = true;
      return true;
    } catch (err) {
      mediaPipeError = true;
      console.warn("Face capture unavailable:", err);
      return false;
    }
  }

  async function ensureFaceCameraStream() {
    await ensureFaceCaptureNodes();
    if (faceCaptureStream) return true;
    try {
      faceCaptureStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      faceCaptureVideo.srcObject = faceCaptureStream;
      await faceCaptureVideo.play();
      return true;
    } catch (err) {
      console.warn("Camera permission denied/unavailable:", err);
      return false;
    }
  }

  function stopFaceCapture() {
    if (faceCaptureStream) {
      faceCaptureStream.getTracks().forEach((t) => t.stop());
      faceCaptureStream = null;
    }
    if (faceCaptureVideo) {
      faceCaptureVideo.srcObject = null;
    }
  }

  async function captureFacePhoto() {
    const mpReady = await ensureMediaPipeReady();
    if (!mpReady) return "";
    const camReady = await ensureFaceCameraStream();
    if (!camReady) return "";
    if (!faceCaptureCanvas || !faceCaptureVideo) return "";
    if (faceCaptureVideo.readyState < 2) {
      await new Promise((resolve) => {
        faceCaptureVideo.onloadeddata = () => resolve();
      });
    }
    const ctx = faceCaptureCanvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(faceCaptureVideo, 0, 0, faceCaptureCanvas.width, faceCaptureCanvas.height);
    try {
      const result = faceLandmarker.detect(faceCaptureCanvas);
      if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
        return "";
      }
    } catch (err) {
      console.warn("Face detection failed:", err);
      return "";
    }
    return faceCaptureCanvas.toDataURL("image/jpeg", 0.82);
  }

  /** Frame grab for the per-second grid only (camera on); does not require a face landmark hit. */
  async function captureTimelineFrame() {
    const camReady = await ensureFaceCameraStream();
    if (!camReady) return "";
    await ensureFaceCaptureNodes();
    if (!faceCaptureCanvas || !faceCaptureVideo) return "";
    if (faceCaptureVideo.readyState < 2) {
      await new Promise((resolve) => {
        faceCaptureVideo.onloadeddata = () => resolve();
      });
    }
    const ctx = faceCaptureCanvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(faceCaptureVideo, 0, 0, faceCaptureCanvas.width, faceCaptureCanvas.height);
    return faceCaptureCanvas.toDataURL("image/jpeg", 0.72);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function startActivitySampling() {
    if (activitySamplerId) return;
    activitySamplerId = window.setInterval(async () => {
      let shot = await captureFacePhoto();
      if (!shot) shot = await captureTimelineFrame();
      if (!shot) return;
      activityPhotoSamples.push({
        ts: Date.now(),
        src: shot,
      });
      if (activityPhotoSamples.length > 240) {
        activityPhotoSamples = activityPhotoSamples.slice(-240);
      }
      if (currentStep === 4) renderActivityTimeline();
    }, 1000);
  }

  function stopActivitySampling() {
    if (!activitySamplerId) return;
    window.clearInterval(activitySamplerId);
    activitySamplerId = null;
  }

  function formatDuration(ms) {
    if (!ms || ms < 0) return "--:--";
    const total = Math.floor(ms / 1000);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const DISPLAY_GRID_SLOTS = 56;
  const FACE_DETECTION_SLOTS = 12;

  function getSamplesForDisplayGrid() {
    const s = activityPhotoSamples;
    const out = [];
    for (let i = 0; i < DISPLAY_GRID_SLOTS; i++) {
      out.push({ sample: s[i] || null, label: i + 1 });
    }
    return out;
  }

  function renderActivityTimeline() {
    if (!activityPhotoGrid) return;
    activityPhotoGrid.textContent = "";
    const displayRows = getSamplesForDisplayGrid();
    displayRows.forEach(({ sample, label }) => {
      const fig = document.createElement("figure");
      if (sample && sample.src) {
        fig.className = "activity-grid-shot";
        fig.innerHTML = `<img src="${escapeHtml(sample.src)}" alt="Activity snapshot ${label}" loading="lazy" /><figcaption>#${label}</figcaption>`;
      } else {
        fig.className = "activity-grid-shot activity-grid-shot--empty";
        fig.innerHTML = `<div class="activity-grid-shot__placeholder" aria-hidden="true"></div><figcaption>#${label}</figcaption>`;
      }
      activityPhotoGrid.appendChild(fig);
    });
  }

  function renderTimeTaken() {
    if (!timeTakenValue) return;
    const end = activityEndedAt || Date.now();
    const start = activityStartedAt || end;
    const duration = Math.max(0, end - start);
    timeTakenValue.textContent = formatDuration(duration);
    if (timeTakenSub) {
      timeTakenSub.textContent = `Started at ${new Date(start).toLocaleTimeString()} and ended at ${new Date(end).toLocaleTimeString()}.`;
    }
  }

  function getSamplesForDetectionPanel() {
    const s = activityPhotoSamples;
    const out = [];
    for (let i = 0; i < FACE_DETECTION_SLOTS; i++) {
      out.push({ sample: s[i] || null, label: i + 1 });
    }
    return out;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function drawFaceDetectionOverlay(ctx, width, height, landmarks) {
    if (!landmarks || landmarks.length < 3) return false;
    const pts = landmarks.map((p) => ({ x: p.x * width, y: p.y * height }));
    const maxNeighborDist = Math.max(width, height) * 0.16;
    const neighborCount = 6;
    const triangles = new Set();

    for (let i = 0; i < pts.length; i++) {
      const base = pts[i];
      const nearest = [];
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;
        const dx = pts[j].x - base.x;
        const dy = pts[j].y - base.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > maxNeighborDist * maxNeighborDist) continue;
        nearest.push({ idx: j, d2 });
      }
      nearest.sort((a, b) => a.d2 - b.d2);
      const n = nearest.slice(0, neighborCount).map((x) => x.idx);
      for (let a = 0; a < n.length; a++) {
        for (let b = a + 1; b < n.length; b++) {
          const j = n[a];
          const k = n[b];
          const key = [i, j, k].sort((m, n2) => m - n2).join("-");
          triangles.add(key);
        }
      }
    }

    ctx.lineWidth = Math.max(0.6, width / 1200);
    ctx.strokeStyle = "rgba(41, 216, 255, 0.72)";
    ctx.fillStyle = "rgba(41, 216, 255, 0.08)";

    triangles.forEach((key) => {
      const [a, b, c] = key.split("-").map(Number);
      const p1 = pts[a];
      const p2 = pts[b];
      const p3 = pts[c];
      if (!p1 || !p2 || !p3) return;

      const e1 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
      const e2 = (p2.x - p3.x) ** 2 + (p2.y - p3.y) ** 2;
      const e3 = (p3.x - p1.x) ** 2 + (p3.y - p1.y) ** 2;
      const maxEdge = Math.max(e1, e2, e3);
      if (maxEdge > (maxNeighborDist * maxNeighborDist * 1.35)) return;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    return triangles.size > 0;
  }

  async function createFaceDetectionPreview(src) {
    if (!src) return "";
    if (faceDetectionPreviewCache.has(src)) return faceDetectionPreviewCache.get(src);
    const ready = await ensureMediaPipeReady();
    if (!ready) {
      faceDetectionPreviewCache.set(src, "");
      return "";
    }
    try {
      const img = await loadImage(src);
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || 640;
      c.height = img.naturalHeight || 480;
      const ctx = c.getContext("2d");
      if (!ctx) {
        faceDetectionPreviewCache.set(src, "");
        return "";
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const result = faceLandmarker.detect(c);
      const landmarks = result.faceLandmarks && result.faceLandmarks.length ? result.faceLandmarks[0] : null;
      const hasFace = drawFaceDetectionOverlay(ctx, c.width, c.height, landmarks);
      const out = hasFace ? c.toDataURL("image/jpeg", 0.82) : "";
      faceDetectionPreviewCache.set(src, out);
      return out;
    } catch (err) {
      console.warn("Failed generating face detection preview:", err);
      faceDetectionPreviewCache.set(src, "");
      return "";
    }
  }

  async function renderFaceDetectionVisuals() {
    if (!faceDetectionGrid) return;
    faceDetectionGrid.textContent = "";
    const rows = getSamplesForDetectionPanel();
    const token = ++faceDetectionRenderToken;
    const cards = rows.map(({ sample, label }) => {
      const card = document.createElement("figure");
      if (sample && sample.src) {
        card.className = "face-detection-card";
        card.innerHTML = `
          <figcaption>#${label}</figcaption>
          <div class="face-detection-pair">
            <img src="${escapeHtml(sample.src)}" alt="Captured photo ${label}" loading="lazy" />
            <img data-detect-target="true" alt="Face detection mesh overlay for captured photo ${label}" />
          </div>
        `;
      } else {
        card.className = "face-detection-card face-detection-card--empty";
        card.innerHTML = `
          <figcaption>#${label}</figcaption>
          <div class="face-detection-pair">
            <div class="face-detection-placeholder" aria-hidden="true"></div>
            <div class="face-detection-placeholder" aria-hidden="true"></div>
          </div>
        `;
      }
      faceDetectionGrid.appendChild(card);
      return { sample, card };
    });
    for (const { sample, card } of cards) {
      if (!sample || !sample.src) continue;
      const target = card.querySelector('[data-detect-target="true"]');
      if (!target) continue;
      target.classList.add("is-pending");
      const overlay = await createFaceDetectionPreview(sample.src);
      if (token !== faceDetectionRenderToken) return;
      if (overlay) {
        target.src = overlay;
        target.classList.remove("is-pending");
      } else {
        target.classList.remove("is-pending");
        target.classList.add("is-fallback");
        target.src = sample.src;
      }
    }
  }

  function countFor(ingId) {
    return stack.filter((x) => x === ingId).length;
  }

  function pathFor(ingId) {
    const meta = byId.get(ingId);
    return meta ? `${meta.folder}/${meta.file}` : "";
  }

  function ensurePlateNode(container) {
    if (!container) return;
    if (!container.querySelector("img.plate")) {
      const im = document.createElement("img");
      im.className = "layer plate";
      im.src = "plate/plate.png";
      im.width = 600;
      im.height = 400;
      im.alt = "";
      container.insertBefore(im, container.firstChild);
    }
  }

  function renderInto(container) {
    if (!container) return;
    ensurePlateNode(container);
    container.querySelectorAll("img.layer.ingredient").forEach((n) => n.remove());
    if (stack.length === 0) return;
    const stepsN = Math.max(1, stack.length);
    const gapPx = Math.max(16, Math.min(30, Math.floor(165 / (stepsN - 0.2))));
    const baseY = 26;
    stack.forEach((ingId, i) => {
      const meta = byId.get(ingId);
      const im = document.createElement("img");
      im.className = "layer ingredient";
      im.alt = meta ? meta.name : ingId;
      im.src = pathFor(ingId);
      im.width = 600;
      im.height = 400;
      im.style.zIndex = String(1 + i);
      im.dataset.ingId = ingId;
      const nudgeX = ((i * 7) % 5 - 2) * 1.2;
      const liftY = baseY - i * gapPx;
      im.style.setProperty("--stack-nudge-x", `${nudgeX}px`);
      im.style.setProperty("--stack-lift", `${liftY}px`);
      container.appendChild(im);
    });
  }

  function renderAllPlates() {
    getPlateTargets().forEach(renderInto);
    if (emptyHint) {
      emptyHint.classList.toggle("is-hidden", stack.length > 0);
    }
    if (btnClearPlate) btnClearPlate.disabled = stack.length === 0;
    if (btnClearLast) btnClearLast.disabled = stack.length === 0;
    document.querySelectorAll("[data-card-id]").forEach((card) => {
      const id = card.getAttribute("data-card-id");
      const n = countFor(id);
      const v = card.querySelector(".qty-value");
      if (v) v.textContent = String(n);
      const minus = card.querySelector('button[data-act="dec"]');
      if (minus) minus.disabled = n === 0;
    });
  }

  function renderPlate() {
    renderAllPlates();
  }

  function addIngredient(ingId) {
    stack.push(ingId);
    renderAllPlates();
  }

  function removeIngredient(ingId) {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i] === ingId) {
        stack.splice(i, 1);
        break;
      }
    }
    renderAllPlates();
  }

  function clearPlate() {
    if (stack.length === 0) return;
    stack = [];
    renderAllPlates();
  }

  function removeMostRecentTopping() {
    if (stack.length === 0) return;
    stack.pop();
    renderAllPlates();
  }

  function buildBodega() {
    if (!bodegaRoot) return;
    bodegaRoot.textContent = "";
    globalIndex = 0;
    CATEGORIES.forEach((cat) => {
      const wrap = document.createElement("div");
      wrap.className = "bodega-category";
      const h3 = document.createElement("h3");
      h3.className = "category-title";
      h3.textContent = cat.title;
      wrap.appendChild(h3);
      const grid = document.createElement("div");
      grid.className = "item-grid";
      cat.items.forEach((it) => {
        globalIndex += 1;
        const card = document.createElement("article");
        card.className = "item-card";
        card.setAttribute("data-card-id", it.id);
        card.innerHTML = `
          <button type="button" class="item-card-add-zone" data-ingredient-id="${escapeHtml(
            it.id
          )}" aria-label="Add ${escapeHtml(
            it.name
          )} on top of the sandwich">
            <span class="item-card-thumb">
              <img src="${cat.folder}/${it.file}" alt="" loading="lazy" />
            </span>
            <span class="item-id">#${globalIndex}</span>
            <span class="item-name">${escapeHtml(it.name)}</span>
            <span class="item-tap-hint" aria-hidden="true">Tap to add a layer on top</span>
          </button>
          <div class="qty" role="group" aria-label="Adjust quantity for ${escapeHtml(
            it.name
          )}">
            <button type="button" data-act="dec" aria-label="Remove one">−</button>
            <span class="qty-sep" aria-hidden="true"></span>
            <span class="qty-value">0</span>
            <span class="qty-sep" aria-hidden="true"></span>
            <button type="button" data-act="inc" aria-label="Add one (same as above)">+</button>
          </div>
        `;
        const addBtn = card.querySelector("button.item-card-add-zone");
        const dec = card.querySelector('button[data-act="dec"]');
        const inc = card.querySelector('button[data-act="inc"]');
        addBtn.addEventListener("click", () => addIngredient(it.id));
        dec.addEventListener("click", (e) => {
          e.stopPropagation();
          removeIngredient(it.id);
        });
        inc.addEventListener("click", (e) => {
          e.stopPropagation();
          addIngredient(it.id);
        });
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      bodegaRoot.appendChild(wrap);
    });
    renderAllPlates();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseMoodCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const p = line.split(",");
      if (p.length < 4) continue;
      out.push({
        index: p[0].trim(),
        observation: p[1].trim(),
        yourFeeling: p[2].trim(),
        feelingAfter: p[3].trim(),
      });
    }
    return out;
  }

  function startRowIndex() {
    if (!selectedMood) return 0;
    return moodRows.findIndex((r) => r.index === selectedMood.index);
  }

  function computeVolatility() {
    const s = startRowIndex();
    const c = imageMoodIndex;
    const a = afterIndex;
    if (c === null || a === null || s < 0) return null;
    const dist = (x, y) => Math.abs(x - y);
    const dCheckVsStart = dist(c, s);
    const dAfterVsCheck = dist(a, c);
    const dAfterVsStart = dist(a, s);
    const mean = (dCheckVsStart + dAfterVsCheck + dAfterVsStart) / 3;
    const n = Math.max(1, moodRows.length - 1);
    const outOf10 = Math.min(10, (mean / n) * 10);
    let band = "high";
    if (outOf10 < 3.4) band = "low";
    else if (outOf10 < 6.2) band = "moderate";
    const deltaNet = a - s;
    let flow = "steady on the index";
    if (deltaNet > 0) flow = "shifted up the 15-mood line";
    else if (deltaNet < 0) flow = "shifted down the 15-mood line";
    return {
      d0: dCheckVsStart,
      d1: dAfterVsCheck,
      d2: dAfterVsStart,
      mean,
      outOf10: Number(outOf10.toFixed(1)),
      band,
      flow,
    };
  }

  function buildReceiptBody() {
    if (!selectedMood || imageMoodIndex === null || afterIndex === null) return "";
    const start = startRowIndex();
    const cRow = moodRows[imageMoodIndex];
    const aRow = moodRows[afterIndex];
    const v = computeVolatility();
    if (!v) return "";
    const ts = new Date().toLocaleString();
    const nMax = Math.max(1, moodRows.length);
    const exerciseMs =
      activityStartedAt && activityEndedAt && activityEndedAt >= activityStartedAt
        ? activityEndedAt - activityStartedAt
        : 0;
    const exerciseDuration = formatDuration(exerciseMs);
    const firstTimelinePhoto = activityPhotoSamples.length > 0 ? activityPhotoSamples[0].src : "";
    const lastTimelinePhoto =
      activityPhotoSamples.length > 0 ? activityPhotoSamples[activityPhotoSamples.length - 1].src : "";
    const photoBlock = `
  <hr class="receipt-thermal__hr" />
  <p class="receipt-thermal__h">CAPTURED PHOTOS (FIRST / LAST)</p>
  <div class="receipt-thermal__photos">
    <div class="receipt-thermal__photo">
      <span>FIRST capture</span>
      ${
        firstTimelinePhoto || firstMoodFacePhoto
          ? `<img src="${escapeHtml(firstTimelinePhoto || firstMoodFacePhoto)}" alt="First captured photo in activity timeline" />`
          : `<p class="receipt-thermal__missing">No photo captured</p>`
      }
    </div>
    <div class="receipt-thermal__photo">
      <span>LAST capture</span>
      ${
        lastTimelinePhoto || finalMoodFacePhoto
          ? `<img src="${escapeHtml(lastTimelinePhoto || finalMoodFacePhoto)}" alt="Last captured photo in activity timeline" />`
          : `<p class="receipt-thermal__missing">No photo captured</p>`
      }
    </div>
  </div>`;
    return `
  <p class="receipt-thermal__h">EMOTIONAL VOLATILITY RECEIPT</p>
  <p class="receipt-thermal__s">${escapeHtml(ts)}</p>
  <hr class="receipt-thermal__hr" />
  <div class="receipt-thermal__row"><span>START mood</span><span>${escapeHtml(selectedMood.yourFeeling)}</span></div>
  <div class="receipt-thermal__row"><span>map position (1–15)</span><span>${start + 1} / ${
    moodRows.length
  }</span></div>
  <div class="receipt-thermal__row"><span>start observation</span><span>${escapeHtml(selectedMood.observation)}</span></div>
  <hr class="receipt-thermal__hr" />
  <div class="receipt-thermal__row"><span>IMAGE mood (while viewing sandwiches)</span><span>${escapeHtml(
    cRow.yourFeeling
  )}</span></div>
  <div class="receipt-thermal__row"><span>check · slot</span><span>#${
    cRow.index
  } (+${v.d0} from start)</span></div>
  <hr class="receipt-thermal__hr" />
  <div class="receipt-thermal__row"><span>Sandwich (layers)</span><span>${stack.length}</span></div>
  <hr class="receipt-thermal__hr" />
  <div class="receipt-thermal__row"><span>BUILD mood (after building)</span><span>${escapeHtml(
    aRow.yourFeeling
  )}</span></div>
  <div class="receipt-thermal__row"><span>after · slot</span><span>#${
    aRow.index
  } (${v.d2} from start)</span></div>
  <p class="receipt-thermal__m">${escapeHtml(v.flow)}</p>
  <hr class="receipt-thermal__hr" />
  <div class="receipt-thermal__row receipt-thermal__row--strong"><span>volatility (0–10)</span><span>${
    v.outOf10
  }</span></div>
  <div class="receipt-thermal__row"><span>read</span><span>${escapeHtml(v.band)}</span></div>
  <div class="receipt-thermal__row"><span>completion time</span><span>${escapeHtml(exerciseDuration)}</span></div>
  <p class="receipt-thermal__f">moves: build phase Δ=${v.d1} · net vs start Δ=${v.d2}</p>
  ${photoBlock}
  <p class="receipt-thermal__note">~${nMax} mood slots. Index column is a map, not a label.</p>
  <p class="receipt-thermal__d">---- end ----</p>`;
  }

  function getReceiptWindowStyles() {
    return `body { margin: 0; padding: 0.75rem; background: #f2efe8; color: #0a0a0a; min-height: 100vh; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
      .receipt-outer { max-width: 28rem; margin: 0 auto; }
      .receipt-wrap { border: 2px dashed #0a0a0a; background: #faf7f0; padding: 0.9rem 1rem 1.1rem; font-size: 0.72rem; line-height: 1.35; }
      .receipt-thermal { font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Monaco, monospace; }
      .receipt-thermal p { margin: 0 0 0.4rem; }
      .receipt-thermal__h { text-align: center; font-weight: 800; letter-spacing: 0.08em; font-size: 0.7rem; }
      .receipt-thermal__s { text-align: center; font-size: 0.6rem; color: #444; }
      .receipt-thermal__hr { border: none; border-top: 1px dashed #0a0a0a; margin: 0.45rem 0; }
      .receipt-thermal__row { display: flex; justify-content: space-between; gap: 0.75rem; margin: 0.2rem 0; }
      .receipt-thermal__row > span:first-child { color: #444; text-align: left; }
      .receipt-thermal__row > span:last-child { text-align: right; text-transform: capitalize; max-width: 9rem; word-wrap: break-word; }
      .receipt-thermal__row--strong { font-weight: 800; font-size: 0.78rem; }
      .receipt-thermal__m { text-align: center; font-style: italic; color: #333; font-size: 0.7rem; }
      .receipt-thermal__f, .receipt-thermal__note { font-size: 0.62rem; color: #333; line-height: 1.25; }
      .receipt-thermal__d { text-align: center; font-size: 0.58rem; color: #888; margin-top: 0.4rem; }
      .receipt-thermal__photos { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.4rem 0 0.5rem; }
      .receipt-thermal__photo { border: 1px solid #111; padding: 0.35rem; background: #fff; }
      .receipt-thermal__photo > span { display: block; font-size: 0.58rem; color: #333; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.04em; }
      .receipt-thermal__photo img { width: 100%; aspect-ratio: auto; object-fit: contain; height: auto; display: block; background: #fff; }
      .receipt-thermal__missing { margin: 0; font-size: 0.58rem; color: #666; text-align: center; padding: 0.8rem 0.2rem; border: 1px dashed #aaa; background: #f7f7f7; }
      .receipt-thermal__timeline { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 2px; margin: 0.3rem 0 0.35rem; }
      .receipt-thermal__tl-cell { border: 1px solid #111; background: #fff; font-size: 0.42rem; text-align: center; overflow: hidden; }
      .receipt-thermal__tl-cell img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
      .receipt-thermal__tl-cell span { display: block; padding: 1px 0; line-height: 1.1; }
      .receipt-bar { max-width: 28rem; margin: 0.9rem auto 0; text-align: center; padding: 0.4rem; }
      .receipt-bar button { font: inherit; font-size: 0.85rem; font-weight: 600; margin: 0 0.35rem; padding: 0.4rem 0.75rem; border: 1px solid #0a0a0a; background: #fff; cursor: pointer; }
      .receipt-bar button.printbtn { color: #fff; background: #0a0a0a; }
      @page { margin: 0.5in; }
      @media print {
        .receipt-bar { display: none !important; }
        body { background: #fff; }
        .receipt-wrap { border: 1px solid #0a0a0a; }
      }`;
  }

  function openReceiptWindow() {
    const bodyHtml = buildReceiptBody();
    if (!bodyHtml) return;
    const w = window.open("about:blank", "receipt", "width=560,height=820,scrollbars=yes");
    if (!w) {
      window.alert("Pop-up blocked. Allow pop-ups for this page to open the receipt.");
      return;
    }
    try {
      w.opener = null;
    } catch (e) {
      // ignore
    }
    const styleBlock = getReceiptWindowStyles();
    w.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />
  <title>Emotional volatility receipt</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${styleBlock}</style>
  </head><body>
  <div class="receipt-outer">
    <div class="receipt-wrap" id="rBody">${bodyHtml}</div>
    <div class="receipt-bar" id="receiptBar">
      <button type="button" class="printbtn" id="pBtn">Print receipt</button>
      <button type="button" id="cBtn">Close</button>
    </div>
  </div>
  <script>document.getElementById("pBtn").addEventListener("click", function(){ window.print(); });
  document.getElementById("cBtn").addEventListener("click", function(){ window.close(); });
  <\/script>
  </body></html>`);
    w.document.close();
    try {
      w.focus();
    } catch (e) {
      // ignore
    }
  }

  function goToStep(n) {
    currentStep = n;
    document.querySelectorAll(".flow-step").forEach((el) => {
      const s = parseInt(el.getAttribute("data-step"), 10);
      const on = s === n;
      el.hidden = !on;
      el.classList.toggle("flow-step--active", on);
    });
    document.querySelectorAll(".journey-map__item").forEach((el) => {
      const s = parseInt(el.getAttribute("data-step"), 10);
      if (Number.isNaN(s)) return;
      el.classList.toggle("journey-map__item--active", s === n);
      el.classList.toggle("journey-map__item--done", s < n);
      if (s === n) el.setAttribute("aria-current", "step");
      else el.removeAttribute("aria-current");
    });
    if (n === 0) {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (_) {
        window.scrollTo(0, 0);
      }
      syncStep0MoodVisualAndNextButton();
    }
    if (n === 3) {
      renderAllPlates();
    }
    if (n === 4) {
      if (!activityEndedAt) {
        activityEndedAt = Date.now();
      }
      stopActivitySampling();
      stopFaceCapture();
      renderAllPlates();
      if (receiptPanel) {
        receiptPanel.innerHTML = buildReceiptBody();
      }
      renderActivityTimeline();
      renderTimeTaken();
      renderFaceDetectionVisuals();
    }
  }

  function fillCheckIn() {
    if (!step1Context || !selectedMood) return;
    step1Context.textContent = `You started with “${selectedMood.yourFeeling}” (mood #${selectedMood.index}). Look at the sandwich images and choose one mood from the same index.`;
  }

  function clearMoodPicks() {
    document
      .querySelectorAll("#moodGrid .mood-pick, #checkinMoodGrid .mood-pick, #afterMoodGrid .mood-pick")
      .forEach((b) => {
        b.classList.remove("mood-pick--selected");
        b.setAttribute("aria-pressed", "false");
      });
  }

  function syncStep0MoodVisualAndNextButton() {
    if (!moodGrid) return;
    moodGrid.querySelectorAll(".mood-pick").forEach((b) => {
      b.classList.remove("mood-pick--selected");
      b.setAttribute("aria-pressed", "false");
    });
    if (selectedMood) {
      const idx = moodRows.findIndex((r) => r.index === selectedMood.index);
      if (idx >= 0) {
        const btn = moodGrid.querySelector(`[data-mood-index="${idx}"]`);
        if (btn) {
          btn.classList.add("mood-pick--selected");
          btn.setAttribute("aria-pressed", "true");
        }
      }
    }
    if (btnToNextFromMood0) {
      btnToNextFromMood0.disabled = selectedMood == null || firstCaptureInProgress;
    }
  }

  async function proceedFromMoodNowToImageMood() {
    if (!selectedMood) return;
    if (btnToNextFromMood0) btnToNextFromMood0.disabled = true;
    try {
      if (doneBanner) doneBanner.hidden = true;
      imageMoodIndex = null;
      afterIndex = null;
      finalMoodFacePhoto = "";
      activityPhotoSamples = [];
      stopActivitySampling();
      activityEndedAt = 0;
      activityStartedAt = Date.now();
      if (btnToBuild) btnToBuild.disabled = true;
      if (btnToFinalReceipt) btnToFinalReceipt.disabled = true;
      if (!firstMoodFacePhoto && !firstCaptureInProgress) {
        firstCaptureInProgress = true;
        try {
          await ensureFaceCameraStream();
          await sleep(3000);
          firstMoodFacePhoto = await captureFacePhoto();
        } finally {
          firstCaptureInProgress = false;
        }
      }
      startActivitySampling();
      buildFeelingPickers();
      fillCheckIn();
      goToStep(1);
    } finally {
      if (btnToNextFromMood0 && currentStep === 0) {
        btnToNextFromMood0.disabled = selectedMood == null;
      }
    }
  }

  function buildFeelingPickers() {
    function fillGrid(container, mode) {
      if (!container) return;
      container.textContent = "";
      moodRows.forEach((row, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mood-pick";
        b.dataset.moodIndex = String(idx);
        b.innerHTML = `<span class="mood-pick__word">${escapeHtml(row.yourFeeling)}</span><span class="mood-pick__ix">#${escapeHtml(
          String(row.index)
        )}</span>`;
        b.setAttribute("aria-pressed", "false");
        b.setAttribute("aria-label", `Feeling ${row.yourFeeling}, index ${row.index}`);
        b.addEventListener("click", () => {
          container.querySelectorAll(".mood-pick--selected").forEach((n) => {
            n.classList.remove("mood-pick--selected");
            n.setAttribute("aria-pressed", "false");
          });
          b.classList.add("mood-pick--selected");
          b.setAttribute("aria-pressed", "true");
          if (mode === "checkin") {
            imageMoodIndex = idx;
            if (btnToBuild) btnToBuild.disabled = false;
          } else {
            afterIndex = idx;
            if (btnToFinalReceipt) btnToFinalReceipt.disabled = false;
            captureFacePhoto().then((shot) => {
              if (shot) finalMoodFacePhoto = shot;
            });
          }
        });
        container.appendChild(b);
      });
    }
    fillGrid(checkinMoodGrid, "checkin");
    fillGrid(afterMoodGrid, "after");
    if (imageMoodIndex != null && checkinMoodGrid) {
      const c = checkinMoodGrid.querySelector(`[data-mood-index="${imageMoodIndex}"]`);
      if (c) {
        c.classList.add("mood-pick--selected");
        c.setAttribute("aria-pressed", "true");
      }
    }
    if (afterIndex != null && afterMoodGrid) {
      const c2 = afterMoodGrid.querySelector(`[data-mood-index="${afterIndex}"]`);
      if (c2) {
        c2.classList.add("mood-pick--selected");
        c2.setAttribute("aria-pressed", "true");
      }
    }
  }

  function renderMoodGrid() {
    if (!moodGrid) return;
    moodGrid.textContent = "";
    moodRows.forEach((row, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mood-pick";
      b.dataset.moodIndex = String(idx);
      b.setAttribute("aria-label", `Mood ${row.yourFeeling}, index ${row.index}`);
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = `
        <span class="mood-pick__word">${escapeHtml(row.yourFeeling)}</span>
        <span class="mood-pick__ix">#${escapeHtml(String(row.index))}</span>
      `;
      b.addEventListener("click", () => {
        clearMoodPicks();
        b.classList.add("mood-pick--selected");
        b.setAttribute("aria-pressed", "true");
        if (doneBanner) doneBanner.hidden = true;
        selectedMood = row;
        imageMoodIndex = null;
        afterIndex = null;
        firstMoodFacePhoto = "";
        finalMoodFacePhoto = "";
        activityPhotoSamples = [];
        stopActivitySampling();
        activityEndedAt = 0;
        activityStartedAt = 0;
        if (btnToBuild) btnToBuild.disabled = true;
        if (btnToFinalReceipt) btnToFinalReceipt.disabled = true;
        if (btnToNextFromMood0) btnToNextFromMood0.disabled = false;
      });
      moodGrid.appendChild(b);
    });
    syncStep0MoodVisualAndNextButton();
  }

  async function loadMoods() {
    if (moodGrid) {
      moodGrid.textContent = "Loading mood index…";
    }
    let usedFallback = false;
    let text;
    try {
      const r = await fetch(`mood_index.csv?v=30&t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      text = await r.text();
    } catch (e) {
      text = MOOD_CSV_FALLBACK;
      usedFallback = true;
    }
    moodRows = parseMoodCSV(text);
    if (moodRows.length === 0) {
      text = MOOD_CSV_FALLBACK;
      usedFallback = true;
      moodRows = parseMoodCSV(MOOD_CSV_FALLBACK);
    }
    if (moodLoadError) {
      moodLoadError.textContent = usedFallback
        ? "Using embedded mood copy. For live CSV, run a local server."
        : "";
      moodLoadError.hidden = !usedFallback;
    }
    buildFeelingPickers();
    renderMoodGrid();
  }

  function fullReset() {
    stack = [];
    selectedMood = null;
    imageMoodIndex = null;
    afterIndex = null;
    firstMoodFacePhoto = "";
    finalMoodFacePhoto = "";
    activityPhotoSamples = [];
    activityStartedAt = 0;
    activityEndedAt = 0;
    firstCaptureInProgress = false;
    if (doneBanner) doneBanner.hidden = true;
    if (btnToBuild) btnToBuild.disabled = true;
    if (btnToFinalReceipt) btnToFinalReceipt.disabled = true;
    if (btnToNextFromMood0) btnToNextFromMood0.disabled = true;
    if (receiptPanel) receiptPanel.innerHTML = "";
    if (activityPhotoGrid) activityPhotoGrid.textContent = "";
    if (faceDetectionGrid) faceDetectionGrid.textContent = "";
    if (timeTakenValue) timeTakenValue.textContent = "--:--";
    if (timeTakenSub) {
      timeTakenSub.textContent = "The timer starts at first mood selection and ends at receipt view.";
    }
    stopActivitySampling();
    stopFaceCapture();
    clearMoodPicks();
    goToStep(0);
    buildFeelingPickers();
    renderAllPlates();
  }

  if (btnReset) {
    btnReset.addEventListener("click", fullReset);
  }

  if (btnToNextFromMood0) {
    btnToNextFromMood0.addEventListener("click", () => {
      proceedFromMoodNowToImageMood();
    });
  }

  if (btnToBuild) {
    btnToBuild.addEventListener("click", () => {
      if (imageMoodIndex === null) return;
      goToStep(2);
    });
  }
  if (btnBack1) {
    btnBack1.addEventListener("click", () => goToStep(0));
  }
  if (btnBack2) {
    btnBack2.addEventListener("click", () => goToStep(1));
  }
  if (btnToReceipt) {
    btnToReceipt.addEventListener("click", () => {
      goToStep(3);
    });
  }
  if (btnBack3) {
    btnBack3.addEventListener("click", () => goToStep(2));
  }
  if (btnToFinalReceipt) {
    btnToFinalReceipt.addEventListener("click", () => {
      if (afterIndex === null) return;
      goToStep(4);
    });
  }
  if (btnBack4) {
    btnBack4.addEventListener("click", () => {
      activityEndedAt = 0;
      startActivitySampling();
      goToStep(3);
    });
  }
  if (btnPrintReceipt) {
    btnPrintReceipt.addEventListener("click", () => {
      if (afterIndex === null) return;
      openReceiptWindow();
    });
  }
  if (btnClearPlate) {
    btnClearPlate.addEventListener("click", clearPlate);
  }
  if (btnClearLast) {
    btnClearLast.addEventListener("click", removeMostRecentTopping);
  }

  buildBodega();
  loadMoods().then(() => goToStep(0));
})();
