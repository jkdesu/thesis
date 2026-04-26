// Facial Expression Change Tracking using MediaPipe
// Measures the rate of change in facial expressions, not discrete emotions

let faceLandmarker = null;
let video = null;
let isTracking = false;
let animationFrameId = null;

// Baseline expression values (captured when user first sees an item)
let baselineBlendshapes = null;
let currentBlendshapes = null;

// Tracking metrics
let reactionIntensity = 0;
let peakReaction = 0;          // Overall session peak (never resets until tracking stops)
let itemPeakReaction = 0;      // Peak for current item (resets per item for recording)
let reactionHistory = [];
const HISTORY_LENGTH = 30; // Keep last 30 frames for smoothing

// Graph data - longer history for visualization
let graphHistory = [];
const GRAPH_HISTORY_LENGTH = 100; // Keep last 100 data points for graph

// Key blendshapes to track for expression changes
const TRACKED_BLENDSHAPES = [
    'browDownLeft', 'browDownRight',
    'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
    'eyeSquintLeft', 'eyeSquintRight',
    'eyeWideLeft', 'eyeWideRight',
    'jawOpen',
    'mouthSmileLeft', 'mouthSmileRight',
    'mouthFrownLeft', 'mouthFrownRight',
    'mouthPucker', 'mouthShrugLower', 'mouthShrugUpper',
    'noseSneerLeft', 'noseSneerRight',
    'cheekSquintLeft', 'cheekSquintRight'
];

// Initialize MediaPipe Face Landmarker
async function initFaceTracking() {
    try {
        // Load MediaPipe vision tasks
        const { FaceLandmarker, FilesetResolver } = await import(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs'
        );

        const filesetResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );

        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU'
            },
            outputFaceBlendshapes: true,
            runningMode: 'VIDEO',
            numFaces: 1
        });

        console.log('Face tracking initialized successfully');
        updateTrackingStatus('ready');
        return true;
    } catch (error) {
        console.error('Failed to initialize face tracking:', error);
        updateTrackingStatus('error');
        return false;
    }
}

// Start webcam and tracking
async function startFaceTracking() {
    if (!faceLandmarker) {
        updateTrackingStatus('Loading...');
        const initialized = await initFaceTracking();
        if (!initialized) return false;
    }

    try {
        video = document.getElementById('webcam-feed');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: 'user' }
        });
        
        video.srcObject = stream;
        await video.play();
        
        // Hide the overlay when camera starts
        const overlay = document.getElementById('webcam-overlay');
        if (overlay) overlay.classList.add('hidden');
        
        isTracking = true;
        updateTrackingStatus('tracking');
        
        // Start detection loop
        detectFace();
        
        return true;
    } catch (error) {
        console.error('Failed to start webcam:', error);
        updateTrackingStatus('no-camera');
        return false;
    }
}

// Stop tracking
function stopFaceTracking() {
    isTracking = false;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    // Show the overlay when camera stops
    const overlay = document.getElementById('webcam-overlay');
    if (overlay) overlay.classList.remove('hidden');
    
    resetBaseline();
    updateTrackingStatus('stopped');
}

// Main detection loop
function detectFace() {
    if (!isTracking || !faceLandmarker || !video) return;
    
    const startTimeMs = performance.now();
    
    try {
        const results = faceLandmarker.detectForVideo(video, startTimeMs);
        
        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            processBlendshapes(results.faceBlendshapes[0].categories);
            updateReactionDisplay();
        } else {
            // No face detected
            updateTrackingStatus('no-face');
        }
    } catch (error) {
        console.error('Detection error:', error);
    }
    
    animationFrameId = requestAnimationFrame(detectFace);
}

// Process blendshapes and calculate change rate
function processBlendshapes(blendshapes) {
    // Convert to a map for easy access
    const blendshapeMap = {};
    blendshapes.forEach(b => {
        if (TRACKED_BLENDSHAPES.includes(b.categoryName)) {
            blendshapeMap[b.categoryName] = b.score;
        }
    });
    
    currentBlendshapes = blendshapeMap;
    
    // If no baseline, set current as baseline
    if (!baselineBlendshapes) {
        baselineBlendshapes = { ...blendshapeMap };
        return;
    }
    
    // Calculate total change from baseline
    let totalChange = 0;
    let trackedCount = 0;
    
    TRACKED_BLENDSHAPES.forEach(name => {
        if (blendshapeMap[name] !== undefined && baselineBlendshapes[name] !== undefined) {
            const change = Math.abs(blendshapeMap[name] - baselineBlendshapes[name]);
            totalChange += change;
            trackedCount++;
        }
    });
    
    // Calculate average change as percentage (0-100)
    const avgChange = trackedCount > 0 ? (totalChange / trackedCount) * 100 : 0;
    
    // Add to history for smoothing
    reactionHistory.push(avgChange);
    if (reactionHistory.length > HISTORY_LENGTH) {
        reactionHistory.shift();
    }
    
    // Calculate smoothed reaction intensity
    reactionIntensity = reactionHistory.reduce((a, b) => a + b, 0) / reactionHistory.length;
    
    // Track peak reactions
    if (reactionIntensity > peakReaction) {
        peakReaction = reactionIntensity;  // Session peak (displayed)
    }
    if (reactionIntensity > itemPeakReaction) {
        itemPeakReaction = reactionIntensity;  // Item peak (for recording)
    }
    
    // Add to graph history
    graphHistory.push(reactionIntensity);
    if (graphHistory.length > GRAPH_HISTORY_LENGTH) {
        graphHistory.shift();
    }
    
    // Draw the graph
    drawExpressionGraph();
    
    updateTrackingStatus('tracking');
}

// Full reset (when tracking stops)
function resetBaseline() {
    baselineBlendshapes = null;
    reactionHistory = [];
    graphHistory = [];
    reactionIntensity = 0;
    peakReaction = 0;
    itemPeakReaction = 0;
    clearExpressionGraph();
}

// Capture new baseline (call when item changes)
// Only resets item peak for recording, NOT the session peak displayed to user
function captureBaseline() {
    if (currentBlendshapes) {
        baselineBlendshapes = { ...currentBlendshapes };
        reactionHistory = [];
        itemPeakReaction = 0;  // Reset item peak for new item recording
        // peakReaction stays - it's the session max shown to user
    }
}

// Get current reaction data
function getReactionData() {
    return {
        intensity: reactionIntensity,
        peak: itemPeakReaction,      // For recording per-item reactions
        sessionPeak: peakReaction,   // Overall session peak (displayed)
        isTracking: isTracking,
        hasFace: currentBlendshapes !== null
    };
}

// Update the reaction display in the UI
function updateReactionDisplay() {
    const intensityBar = document.getElementById('reaction-intensity-bar');
    const intensityValue = document.getElementById('reaction-intensity-value');
    const peakValue = document.getElementById('reaction-peak-value');
    
    if (intensityBar) {
        // Cap at 100% for display, but actual value can go higher
        const displayIntensity = Math.min(reactionIntensity * 2, 100); // Scale up for visibility
        intensityBar.style.width = `${displayIntensity}%`;
        
        // Change color based on intensity
        if (displayIntensity > 60) {
            intensityBar.style.background = '#ff4444';
        } else if (displayIntensity > 30) {
            intensityBar.style.background = '#ffaa00';
        } else {
            intensityBar.style.background = '#44aa44';
        }
    }
    
    if (intensityValue) {
        intensityValue.textContent = `${reactionIntensity.toFixed(1)}%`;
    }
    
    if (peakValue) {
        peakValue.textContent = `${peakReaction.toFixed(1)}%`;
    }
}

// Update tracking status indicator
function updateTrackingStatus(status) {
    const statusEl = document.getElementById('tracking-status');
    const statusDot = document.getElementById('tracking-status-dot');
    
    if (!statusEl || !statusDot) return;
    
    const statusMessages = {
        'ready': 'Ready to track',
        'tracking': 'Tracking active',
        'no-face': 'No face detected',
        'no-camera': 'Camera not available',
        'error': 'Tracking error',
        'stopped': 'Tracking stopped'
    };
    
    statusEl.textContent = statusMessages[status] || status;
    
    // Update status dot color
    statusDot.className = 'tracking-status-dot';
    if (status === 'tracking') {
        statusDot.classList.add('active');
    } else if (status === 'no-face' || status === 'ready') {
        statusDot.classList.add('warning');
    } else if (status === 'error' || status === 'no-camera') {
        statusDot.classList.add('error');
    }
}

// Toggle face tracking on/off
async function toggleFaceTracking() {
    const btn = document.getElementById('toggle-tracking-btn');
    
    if (isTracking) {
        stopFaceTracking();
        if (btn) btn.textContent = 'Enable Face Tracking';
    } else {
        const success = await startFaceTracking();
        if (btn && success) btn.textContent = 'Disable Face Tracking';
    }
}

// Draw the expression graph
function drawExpressionGraph() {
    const canvas = document.getElementById('expression-graph');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    if (graphHistory.length < 2) return;
    
    // Find max value for scaling (min 20 for visibility)
    const maxVal = Math.max(20, ...graphHistory);
    
    // Draw the line
    ctx.beginPath();
    ctx.strokeStyle = '#44aa44';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < graphHistory.length; i++) {
        const x = (i / (GRAPH_HISTORY_LENGTH - 1)) * width;
        const y = height - (graphHistory[i] / maxVal) * (height - 10);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Draw fill under the line
    ctx.lineTo((graphHistory.length - 1) / (GRAPH_HISTORY_LENGTH - 1) * width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(68, 170, 68, 0.2)';
    ctx.fill();
    
    // Draw peak line
    if (peakReaction > 0) {
        const peakY = height - (peakReaction / maxVal) * (height - 10);
        ctx.beginPath();
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(0, peakY);
        ctx.lineTo(width, peakY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Label
        ctx.fillStyle = '#ff4444';
        ctx.font = '10px Arial';
        ctx.fillText(`Peak: ${peakReaction.toFixed(1)}%`, 5, peakY - 3);
    }
}

// Clear the expression graph
function clearExpressionGraph() {
    const canvas = document.getElementById('expression-graph');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = (canvas.height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

