/**
 * js/modern.js
 * Decoupled Simulation Engines for Modern Physics:
 * 1. Einstein's Photoelectric Effect Lab
 * 2. Bohr Hydrogen Atom & Emission Spectrum
 * 3. Radioactive Decay & Half-Life Simulator
 */

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function openModernModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (!modal) return;
    modal.classList.remove('hidden');

    setTimeout(() => {
        if (simKey === 'photoelectric') {
            safeResize(modernCanvas);
            drawModern();
        } else if (simKey === 'bohr') {
            safeResize(bohrCanvas);
            drawBohr();
        } else if (simKey === 'decay') {
            safeResize(decayCanvas);
            drawDecay();
        }
    }, 50);
}

function closeModernModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (!modal) return;
    modal.classList.add('hidden');

    if (simKey === 'decay') {
        decayState.isPlaying = false;
        const btn = document.getElementById('btn-play-decay');
        if (btn) btn.textContent = "Start Decay";
    }
}

function safeResize(canvas) {
    if (!canvas || !canvas.parentElement) return;
    canvas.width = canvas.parentElement.clientWidth || 700;
    canvas.height = canvas.parentElement.clientHeight || 320;
}

// ==========================================
// 1. PHOTOELECTRIC EFFECT ENGINE
// ==========================================
let modernCanvas, modernCtx;
const modernState = { metalPhi: 2.28, lambda: 400 };

function updateModernParams() {
    modernState.metalPhi = parseFloat(document.getElementById('select-pe-metal').value);
    modernState.lambda = parseFloat(document.getElementById('slider-wavelength').value);
    document.getElementById('lbl-wavelength').textContent = modernState.lambda + ' nm';

    const ePhoton = 1240 / modernState.lambda; // eV
    const kMax = Math.max(0, ePhoton - modernState.metalPhi);

    document.getElementById('pe-ephoton').textContent = ePhoton.toFixed(2) + ' eV';
    document.getElementById('pe-kmax').textContent = kMax.toFixed(2) + ' eV';

    const statusEl = document.getElementById('pe-status');
    if (kMax > 0) {
        statusEl.textContent = "PHOTOELECTRONS EJECTED";
        statusEl.className = "text-emerald-400";
    } else {
        statusEl.textContent = "BELOW THRESHOLD (NO EMISSION)";
        statusEl.className = "text-rose-400";
    }

    drawModern();
}

function getWavelengthColor(nm) {
    if (nm < 380) return '#A855F7'; // UV (Purple)
    if (nm < 450) return '#3B82F6'; // Violet/Blue
    if (nm < 495) return '#06B6D4'; // Cyan
    if (nm < 570) return '#10B981'; // Green
    if (nm < 590) return '#EAB308'; // Yellow
    if (nm < 620) return '#F97316'; // Orange
    return '#EF4444';               // Red
}

function drawModern() {
    if (!modernCtx || !modernCanvas) return;
    const w = modernCanvas.width, h = modernCanvas.height;
    modernCtx.clearRect(0, 0, w, h);

    // Emitter Metal Plate (Left) & Collector Plate (Right)
    modernCtx.fillStyle = '#475569';
    modernCtx.fillRect(105, 45, 18, h - 90);
    modernCtx.fillStyle = '#334155';
    modernCtx.fillRect(w - 65, 45, 12, h - 90);

    modernCtx.fillStyle = '#94A3B8';
    modernCtx.font = "11px 'JetBrains Mono', monospace";
    modernCtx.fillText(`Emitter (Φ=${modernState.metalPhi}eV)`, 55, 32);
    modernCtx.fillText(`Collector`, w - 95, 32);

    // Incident Photon Wave Beams
    const beamColor = getWavelengthColor(modernState.lambda);
    modernCtx.strokeStyle = beamColor;
    modernCtx.lineWidth = 3.5;
    for (let b = -1; b <= 1; b++) {
        modernCtx.beginPath();
        modernCtx.moveTo(15, 35 + b * 18);
        modernCtx.lineTo(105, h / 2 + b * 28);
        modernCtx.stroke();
    }

    // Ejected Photoelectrons drifting across vacuum gap
    const ePhoton = 1240 / modernState.lambda;
    const kMax = ePhoton - modernState.metalPhi;
    if (kMax > 0) {
        const speedFactor = 1.8 + kMax * 1.4;
        const travelSpan = w - 195;
        for (let i = 0; i < 6; i++) {
            const ex = 128 + ((Date.now() / 16 * speedFactor + i * (travelSpan / 6)) % travelSpan);
            const ey = h / 2 + (i - 2.5) * 24;
            modernCtx.fillStyle = '#10B981';
            modernCtx.beginPath();
            modernCtx.arc(ex, ey, 5.5, 0, Math.PI * 2);
            modernCtx.fill();

            modernCtx.fillStyle = '#070A13';
            modernCtx.font = "bold 9px 'JetBrains Mono', monospace";
            modernCtx.fillText('-', ex - 2.5, ey + 3);
        }
    }
}

// ==========================================
// 2. BOHR HYDROGEN ATOM & SPECTRUM ENGINE
// ==========================================
let bohrCanvas, bohrCtx;
const bohrState = { currentN: 3, prevN: 3, angle: 0, photonFlash: 0, photonColor: '#F43F5E', isEmission: true };

function setBohrOrbit(targetN) {
    if (targetN === bohrState.currentN) return;

    bohrState.prevN = bohrState.currentN;
    bohrState.currentN = targetN;
    bohrState.isEmission = targetN < bohrState.prevN;
    bohrState.photonFlash = 1.0;

    const ePrev = -13.6 / (bohrState.prevN * bohrState.prevN);
    const eCurr = -13.6 / (targetN * targetN);
    const dE = Math.abs(eCurr - ePrev);
    const lambdaNm = 1240 / dE;

    bohrState.photonColor = getWavelengthColor(lambdaNm);

    document.getElementById('bohr-trans').textContent = `n = ${bohrState.prevN} → n = ${targetN}`;
    document.getElementById('bohr-lambda').textContent = `${lambdaNm.toFixed(1)} nm`;
    document.getElementById('bohr-energy').textContent = `${eCurr.toFixed(2)} eV (ΔE = ${dE.toFixed(2)} eV)`;

    const lowerN = Math.min(bohrState.prevN, targetN);
    const seriesEl = document.getElementById('bohr-series');
    if (lowerN === 1) {
        seriesEl.textContent = "LYMAN (UV)";
        seriesEl.className = "text-purple-400";
    } else if (lowerN === 2) {
        seriesEl.textContent = "BALMER (VISIBLE)";
        seriesEl.className = "text-emerald-400";
    } else {
        seriesEl.textContent = "PASCHEN / IR";
        seriesEl.className = "text-amber-400";
    }

    drawBohr();
}

function drawBohr() {
    if (!bohrCtx || !bohrCanvas) return;
    const w = bohrCanvas.width, h = bohrCanvas.height;
    bohrCtx.clearRect(0, 0, w, h);

    const cx = w * 0.42;
    const cy = h * 0.52;

    // Draw concentric shells n = 1 to 6
    for (let n = 1; n <= 6; n++) {
        const r = 18 + n * 21;
        bohrCtx.strokeStyle = n === bohrState.currentN ? 'rgba(6, 182, 212, 0.75)' : 'rgba(71, 85, 105, 0.35)';
        bohrCtx.lineWidth = n === bohrState.currentN ? 2 : 1;
        bohrCtx.beginPath();
        bohrCtx.arc(cx, cy, r, 0, Math.PI * 2);
        bohrCtx.stroke();
    }

    // Proton Nucleus
    bohrCtx.fillStyle = '#F43F5E';
    bohrCtx.beginPath();
    bohrCtx.arc(cx, cy, 8, 0, Math.PI * 2);
    bohrCtx.fill();
    bohrCtx.fillStyle = '#FFFFFF';
    bohrCtx.font = "bold 10px 'JetBrains Mono', monospace";
    bohrCtx.fillText('+', cx - 3, cy + 3.5);

    // Orbiting Electron
    const orbitR = 18 + bohrState.currentN * 21;
    const ex = cx + orbitR * Math.cos(bohrState.angle);
    const ey = cy + orbitR * Math.sin(bohrState.angle);

    bohrCtx.fillStyle = '#06B6D4';
    bohrCtx.beginPath();
    bohrCtx.arc(ex, ey, 6, 0, Math.PI * 2);
    bohrCtx.fill();

    // Animated Photon Wave Packet during transition
    if (bohrState.photonFlash > 0.02) {
        const dist = (1 - bohrState.photonFlash) * 140;
        const px = bohrState.isEmission ? (ex + dist) : (ex + 140 - dist);
        const py = ey - 14;

        bohrCtx.strokeStyle = bohrState.photonColor;
        bohrCtx.lineWidth = 3;
        bohrCtx.beginPath();
        for (let wx = 0; wx < 36; wx += 3) {
            const wy = py + Math.sin(wx * 0.4) * 6;
            if (wx === 0) bohrCtx.moveTo(px + wx, wy);
            else bohrCtx.lineTo(px + wx, wy);
        }
        bohrCtx.stroke();
    }

    // Right-side Balmer Visible Emission Spectrum Reference Bar
    const specX = w - 135;
    bohrCtx.fillStyle = '#0F172A';
    bohrCtx.fillRect(specX, 30, 110, h - 60);
    bohrCtx.strokeStyle = '#1E293B';
    bohrCtx.strokeRect(specX, 30, 110, h - 60);

    bohrCtx.fillStyle = '#94A3B8';
    bohrCtx.font = "10px 'JetBrains Mono', monospace";
    bohrCtx.fillText("Balmer Lines", specX + 14, 48);

    const balmerLines = [
        { label: "H-α 656nm", color: "#EF4444", y: 85 },
        { label: "H-β 486nm", color: "#06B6D4", y: 130 },
        { label: "H-γ 434nm", color: "#3B82F6", y: 175 },
        { label: "H-δ 410nm", color: "#A855F7", y: 220 }
    ];
    balmerLines.forEach(line => {
        bohrCtx.strokeStyle = line.color;
        bohrCtx.lineWidth = 3;
        bohrCtx.beginPath();
        bohrCtx.moveTo(specX + 12, line.y);
        bohrCtx.lineTo(specX + 98, line.y);
        bohrCtx.stroke();

        bohrCtx.fillStyle = '#CBD5E1';
        bohrCtx.fillText(line.label, specX + 14, line.y - 6);
    });
}

// ==========================================
// 3. RADIOACTIVE DECAY & HALF-LIFE ENGINE
// ==========================================
let decayCanvas, decayCtx;
const decayState = {
    halfLife: 3.0,
    totalNuclei: 100,
    nuclei: [],
    elapsed: 0,
    isPlaying: false,
    history: []
};

function updateDecayParams() {
    decayState.halfLife = parseFloat(document.getElementById('slider-decay-hl').value);
    document.getElementById('lbl-decay-hl').textContent = decayState.halfLife.toFixed(1) + ' s';
    resetDecay();
}

function resetDecay() {
    decayState.isPlaying = false;
    decayState.elapsed = 0;
    decayState.nuclei = Array(decayState.totalNuclei).fill(false); // false = undecayed parent
    decayState.history = [{ t: 0, n: decayState.totalNuclei }];

    const btn = document.getElementById('btn-play-decay');
    if (btn) btn.textContent = "Start Decay";
    updateDecayTelemetry();
    drawDecay();
}

function toggleDecay() {
    decayState.isPlaying = !decayState.isPlaying;
    const btn = document.getElementById('btn-play-decay');
    if (btn) btn.textContent = decayState.isPlaying ? "Pause" : "Start Decay";
}

function updateDecayTelemetry() {
    const rem = decayState.nuclei.filter(decayed => !decayed).length;
    document.getElementById('decay-time').textContent = decayState.elapsed.toFixed(1) + ' s';
    document.getElementById('decay-rem').textContent = `${rem} / ${decayState.totalNuclei}`;
}

function drawDecay() {
    if (!decayCtx || !decayCanvas) return;
    const w = decayCanvas.width, h = decayCanvas.height;
    decayCtx.clearRect(0, 0, w, h);

    // Left Panel: 10x10 Grid of Nuclei
    const cols = 10, rows = 10;
    const cellSpan = 24;
    const startX = 28, startY = 42;

    decayCtx.fillStyle = '#94A3B8';
    decayCtx.font = "11px 'JetBrains Mono', monospace";
    decayCtx.fillText("Isotope Sample (N₀ = 100)", startX, 26);

    for (let i = 0; i < decayState.totalNuclei; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const nx = startX + c * cellSpan + 8;
        const ny = startY + r * cellSpan + 8;

        decayCtx.fillStyle = decayState.nuclei[i] ? '#10B981' : '#A855F7';
        decayCtx.beginPath();
        decayCtx.arc(nx, ny, 7.5, 0, Math.PI * 2);
        decayCtx.fill();
    }

    // Right Panel: Live Exponential Decay Graph
    const gx = 305, gy = 40;
    const gw = w - gx - 25, gh = h - 75;

    decayCtx.strokeStyle = '#334155';
    decayCtx.lineWidth = 1.5;
    decayCtx.strokeRect(gx, gy, gw, gh);

    decayCtx.fillStyle = '#94A3B8';
    decayCtx.fillText("Remaining Parent Nuclei N(t)", gx, 26);

    const maxT = Math.max(15, decayState.halfLife * 4);

    // Theoretical Curve (Dashed)
    decayCtx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    decayCtx.setLineDash([4, 4]);
    decayCtx.beginPath();
    for (let px = 0; px <= gw; px += 4) {
        const t = (px / gw) * maxT;
        const nTheory = decayState.totalNuclei * Math.pow(0.5, t / decayState.halfLife);
        const py = gy + gh - (nTheory / decayState.totalNuclei) * gh;
        if (px === 0) decayCtx.moveTo(gx + px, py);
        else decayCtx.lineTo(gx + px, py);
    }
    decayCtx.stroke();
    decayCtx.setLineDash([]);

    // Simulated Experimental Curve (Solid Cyan)
    if (decayState.history.length > 1) {
        decayCtx.strokeStyle = '#06B6D4';
        decayCtx.lineWidth = 2.5;
        decayCtx.beginPath();
        decayState.history.forEach((pt, idx) => {
            const px = gx + Math.min(1, pt.t / maxT) * gw;
            const py = gy + gh - (pt.n / decayState.totalNuclei) * gh;
            if (idx === 0) decayCtx.moveTo(px, py);
            else decayCtx.lineTo(px, py);
        });
        decayCtx.stroke();
    }
}

// ==========================================
// UNIFIED ANIMATION LOOP & BOOTSTRAP
// ==========================================
window.onload = function() {
    modernCanvas = document.getElementById('modernCanvas');
    modernCtx = modernCanvas?.getContext('2d');

    bohrCanvas = document.getElementById('bohrCanvas');
    bohrCtx = bohrCanvas?.getContext('2d');

    decayCanvas = document.getElementById('decayCanvas');
    decayCtx = decayCanvas?.getContext('2d');

    updateModernParams();
    setBohrOrbit(2);
    updateDecayParams();

    requestAnimationFrame(modernLoop);
};

let lastModernTs = 0;
function modernLoop(ts) {
    const dt = Math.min(0.05, (ts - lastModernTs) / 1000 || 0.016);
    lastModernTs = ts;

    // 1. Photoelectric drift animation
    const peModal = document.getElementById('modal-photoelectric');
    if (peModal && !peModal.classList.contains('hidden')) {
        drawModern();
    }

    // 2. Bohr orbit & photon wave animation
    const bohrModal = document.getElementById('modal-bohr');
    if (bohrModal && !bohrModal.classList.contains('hidden')) {
        bohrState.angle += (2.2 / bohrState.currentN) * dt * 2.5;
        if (bohrState.photonFlash > 0) {
            bohrState.photonFlash = Math.max(0, bohrState.photonFlash - dt * 0.9);
        }
        drawBohr();
    }

    // 3. Stochastic radioactive decay step
    if (decayState.isPlaying) {
        decayState.elapsed += dt;
        const lambda = Math.LN2 / decayState.halfLife;
        const pDecay = 1 - Math.exp(-lambda * dt);

        let remaining = 0;
        for (let i = 0; i < decayState.totalNuclei; i++) {
            if (!decayState.nuclei[i]) {
                if (Math.random() < pDecay) {
                    decayState.nuclei[i] = true;
                } else {
                    remaining++;
                }
            }
        }

        decayState.history.push({ t: decayState.elapsed, n: remaining });
        updateDecayTelemetry();
        drawDecay();

        if (remaining === 0) {
            decayState.isPlaying = false;
            const btn = document.getElementById('btn-play-decay');
            if (btn) btn.textContent = "Sample Decayed";
        }
    }

    requestAnimationFrame(modernLoop);
}