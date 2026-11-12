/**
 * js/fluids.js
 * Decoupled Simulation Engines for Fluid Dynamics:
 * 1. Archimedes' Buoyancy Tank
 * 2. Bernoulli's Principle & Venturi Pipe
 * 3. Torricelli's Law Fluid Efflux
 */

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function openFluidModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (!modal) return;
    modal.classList.remove('hidden');

    setTimeout(() => {
        if (simKey === 'buoyancy') {
            safeResize(fluidCanvas);
            drawFluid();
        } else if (simKey === 'venturi') {
            safeResize(venturiCanvas);
            initVenturiParticles();
            drawVenturi();
        } else if (simKey === 'torricelli') {
            safeResize(torricelliCanvas);
            drawTorricelli();
        }
    }, 50);
}

function closeFluidModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (modal) modal.classList.add('hidden');
}

function safeResize(canvas) {
    if (!canvas || !canvas.parentElement) return;
    canvas.width = canvas.parentElement.clientWidth || 700;
    canvas.height = canvas.parentElement.clientHeight || 320;
}

// ==========================================
// 1. ARCHIMEDES' BUOYANCY ENGINE
// ==========================================
let fluidCanvas, fluidCtx;
const fluidState = { rhoFluid: 1000, rhoBlock: 600, volBlock: 0.05, g: 9.81 };

function updateFluidParams() {
    fluidState.rhoFluid = parseFloat(document.getElementById('select-fluid').value);
    fluidState.rhoBlock = parseFloat(document.getElementById('slider-block-rho').value);
    document.getElementById('lbl-block-rho').textContent = fluidState.rhoBlock + ' kg/m³';
    drawFluid();
}

function drawFluid() {
    if (!fluidCtx || !fluidCanvas) return;
    const w = fluidCanvas.width, h = fluidCanvas.height;
    fluidCtx.clearRect(0, 0, w, h);

    const surfaceY = h * 0.42;
    const tankLeft = 60, tankRight = w - 60, tankBottom = h - 25;

    // Fluid color tint based on medium
    let fluidFill = 'rgba(6, 182, 212, 0.25)';
    let fluidStroke = '#06B6D4';
    if (fluidState.rhoFluid === 915) {
        fluidFill = 'rgba(234, 179, 8, 0.25)';
        fluidStroke = '#EAB308';
    } else if (fluidState.rhoFluid === 1420) {
        fluidFill = 'rgba(217, 119, 6, 0.35)';
        fluidStroke = '#D97706';
    } else if (fluidState.rhoFluid === 13600) {
        fluidFill = 'rgba(148, 163, 184, 0.45)';
        fluidStroke = '#94A3B8';
    }

    fluidCtx.fillStyle = fluidFill;
    fluidCtx.fillRect(tankLeft, surfaceY, tankRight - tankLeft, tankBottom - surfaceY);
    fluidCtx.strokeStyle = fluidStroke;
    fluidCtx.lineWidth = 2;
    fluidCtx.strokeRect(tankLeft, surfaceY, tankRight - tankLeft, tankBottom - surfaceY);

    // Tank walls extending above waterline
    fluidCtx.strokeStyle = '#334155';
    fluidCtx.beginPath();
    fluidCtx.moveTo(tankLeft, 30);
    fluidCtx.lineTo(tankLeft, tankBottom);
    fluidCtx.lineTo(tankRight, tankBottom);
    fluidCtx.lineTo(tankRight, 30);
    fluidCtx.stroke();

    const subFraction = Math.min(1.0, fluidState.rhoBlock / fluidState.rhoFluid);
    const side = 68;
    const bx = w / 2 - side / 2;
    const isSunk = fluidState.rhoBlock > fluidState.rhoFluid;
    const by = isSunk
        ? (tankBottom - side)
        : (surfaceY - (1 - subFraction) * side);

    // Draw Block
    fluidCtx.fillStyle = '#A855F7';
    fluidCtx.fillRect(bx, by, side, side);
    fluidCtx.strokeStyle = '#E9D5FF';
    fluidCtx.lineWidth = 2;
    fluidCtx.strokeRect(bx, by, side, side);

    fluidCtx.fillStyle = '#FFFFFF';
    fluidCtx.font = "bold 11px 'JetBrains Mono', monospace";
    fluidCtx.textAlign = "center";
    fluidCtx.fillText(`${fluidState.rhoBlock}`, w / 2, by + side / 2 - 2);
    fluidCtx.font = "10px 'JetBrains Mono', monospace";
    fluidCtx.fillText(`kg/m³`, w / 2, by + side / 2 + 11);
    fluidCtx.textAlign = "left";

    // Force Vectors (Gravity vs Buoyancy)
    const cx = w / 2, cy = by + side / 2;
    const fg = fluidState.rhoBlock * fluidState.volBlock * fluidState.g;
    const fb = fluidState.rhoFluid * fluidState.volBlock * subFraction * fluidState.g;
    const vecScale = 0.08;

    // Gravity Down (Rose)
    drawFluidArrow(fluidCtx, cx - 10, cy, cx - 10, cy + Math.min(85, Math.max(22, fg * vecScale)), '#F43F5E', 'Fg');
    // Buoyancy Up (Emerald)
    drawFluidArrow(fluidCtx, cx + 10, cy, cx + 10, cy - Math.min(85, Math.max(22, fb * vecScale)), '#10B981', 'Fb');

    document.getElementById('tele-fb').textContent = fb.toFixed(1) + ' N';
    document.getElementById('tele-sub').textContent = Math.round(subFraction * 100) + '%';
    const statusEl = document.getElementById('tele-status');
    statusEl.textContent = isSunk ? "SUNK" : "FLOATING";
    statusEl.className = isSunk ? "text-rose-400" : "text-physics-cyan";
}

function drawFluidArrow(ctx, x1, y1, x2, y2, color, label) {
    const head = 7;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.fillText(label, x2 + 6, y2 + 4);
    }
}

// ==========================================
// 2. BERNOULLI & VENTURI PIPE ENGINE
// ==========================================
let venturiCanvas, venturiCtx;
const venturiState = { v1: 2.0, throatRatio: 0.50, particles: [] };

function updateVenturiParams() {
    venturiState.v1 = parseFloat(document.getElementById('slider-vent-v1').value);
    const pct = parseFloat(document.getElementById('slider-vent-ratio').value);
    venturiState.throatRatio = pct / 100;

    document.getElementById('lbl-vent-v1').textContent = venturiState.v1.toFixed(1) + ' m/s';
    document.getElementById('lbl-vent-ratio').textContent = pct + '%';

    // Continuity: A1 * v1 = A2 * v2 => v2 = v1 / ratio
    const v2 = venturiState.v1 / venturiState.throatRatio;
    // Bernoulli (water rho = 1000 kg/m^3): dP = 0.5 * rho * (v2^2 - v1^2)
    const dP_kPa = (0.5 * 1000 * (v2 * v2 - venturiState.v1 * venturiState.v1)) / 1000;

    document.getElementById('vent-v2').textContent = v2.toFixed(2) + ' m/s';
    document.getElementById('vent-dp').textContent = dP_kPa.toFixed(2) + ' kPa';

    drawVenturi();
}

function initVenturiParticles() {
    venturiState.particles = [];
    const w = venturiCanvas?.width || 700;
    for (let i = 0; i < 42; i++) {
        venturiState.particles.push({
            x: Math.random() * w,
            lane: (Math.random() - 0.5) * 1.7 // normalized -0.85 to +0.85
        });
    }
}

function getPipeHalfHeight(x, w, h) {
    const wideH = h * 0.25;
    const throatH = wideH * venturiState.throatRatio;
    const center = w * 0.5;
    const span = w * 0.22;
    const dist = Math.abs(x - center);
    if (dist >= span) return wideH;
    // Smooth cosine taper into throat
    const t = 0.5 * (1 + Math.cos((Math.PI * dist) / span));
    return wideH - t * (wideH - throatH);
}

function drawVenturi() {
    if (!venturiCtx || !venturiCanvas) return;
    const w = venturiCanvas.width, h = venturiCanvas.height;
    venturiCtx.clearRect(0, 0, w, h);

    const midY = h * 0.62;

    // Draw Pipe Interior & Walls
    venturiCtx.fillStyle = 'rgba(6, 182, 212, 0.16)';
    venturiCtx.beginPath();
    for (let x = 0; x <= w; x += 6) {
        const hh = getPipeHalfHeight(x, w, h);
        if (x === 0) venturiCtx.moveTo(x, midY - hh);
        else venturiCtx.lineTo(x, midY - hh);
    }
    for (let x = w; x >= 0; x -= 6) {
        const hh = getPipeHalfHeight(x, w, h);
        venturiCtx.lineTo(x, midY + hh);
    }
    venturiCtx.closePath();
    venturiCtx.fill();

    // Pipe Outer Strokes
    venturiCtx.strokeStyle = '#06B6D4';
    venturiCtx.lineWidth = 2.5;
    venturiCtx.beginPath();
    for (let x = 0; x <= w; x += 6) {
        const hh = getPipeHalfHeight(x, w, h);
        if (x === 0) venturiCtx.moveTo(x, midY - hh);
        else venturiCtx.lineTo(x, midY - hh);
    }
    venturiCtx.stroke();

    venturiCtx.beginPath();
    for (let x = 0; x <= w; x += 6) {
        const hh = getPipeHalfHeight(x, w, h);
        if (x === 0) venturiCtx.moveTo(x, midY + hh);
        else venturiCtx.lineTo(x, midY + hh);
    }
    venturiCtx.stroke();

    // Manometer Pressure Columns (Wide Section vs Throat Section)
    const wideH = h * 0.25;
    const throatH = wideH * venturiState.throatRatio;
    const v2 = venturiState.v1 / venturiState.throatRatio;
    const dP_kPa = (0.5 * 1000 * (v2 * v2 - venturiState.v1 * venturiState.v1)) / 1000;

    const p1Height = 75;
    const p2Height = Math.max(12, p1Height - dP_kPa * 2.2);

    drawManometer(venturiCtx, w * 0.20, midY - wideH, p1Height, '#38BDF8', 'P1 (High)');
    drawManometer(venturiCtx, w * 0.50, midY - throatH, p2Height, '#F59E0B', 'P2 (Low)');

    // Draw Flow Particles
    venturiState.particles.forEach(p => {
        const hh = getPipeHalfHeight(p.x, w, h);
        const py = midY + p.lane * (hh - 6);
        const localRatio = hh / wideH;
        venturiCtx.fillStyle = localRatio < 0.75 ? '#38BDF8' : '#A855F7';
        venturiCtx.beginPath();
        venturiCtx.arc(p.x, py, 3.5, 0, Math.PI * 2);
        venturiCtx.fill();
    });
}

function drawManometer(ctx, x, topPipeY, colH, color, label) {
    const tubeW = 14;
    const maxTubeH = 90;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - tubeW / 2, topPipeY - maxTubeH, tubeW, maxTubeH);

    ctx.fillStyle = color;
    ctx.fillRect(x - tubeW / 2 + 1, topPipeY - colH, tubeW - 2, colH);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, x, topPipeY - maxTubeH - 6);
    ctx.textAlign = "left";
}

// ==========================================
// 3. TORRICELLI'S LAW EFFLUX ENGINE
// ==========================================
let torricelliCanvas, torricelliCtx;
const torrState = { H: 10.0, y: 5.0, g: 9.81, streamPhase: 0 };

function updateTorricelliParams() {
    torrState.H = parseFloat(document.getElementById('slider-torr-H').value);
    torrState.y = parseFloat(document.getElementById('slider-torr-y').value);

    // Ensure spigot is never above water surface
    if (torrState.y >= torrState.H) {
        torrState.y = Math.max(1, torrState.H - 0.5);
        document.getElementById('slider-torr-y').value = torrState.y;
    }

    document.getElementById('lbl-torr-H').textContent = torrState.H.toFixed(1) + ' m';
    document.getElementById('lbl-torr-y').textContent = torrState.y.toFixed(1) + ' m';

    const depth = torrState.H - torrState.y;
    const vEfflux = Math.sqrt(2 * torrState.g * depth);
    const tFall = Math.sqrt((2 * torrState.y) / torrState.g);
    const range = vEfflux * tFall;

    document.getElementById('torr-v').textContent = vEfflux.toFixed(2) + ' m/s';
    document.getElementById('torr-range').textContent = range.toFixed(2) + ' m';

    drawTorricelli();
}

function drawTorricelli() {
    if (!torricelliCtx || !torricelliCanvas) return;
    const w = torricelliCanvas.width, h = torricelliCanvas.height;
    torricelliCtx.clearRect(0, 0, w, h);

    const groundY = h - 28;
    const tankX = 65;
    const tankW = 110;
    const scaleY = 18; // pixels per meter
    const scaleX = 24;

    // Ground line
    torricelliCtx.strokeStyle = '#334155';
    torricelliCtx.lineWidth = 2;
    torricelliCtx.beginPath();
    torricelliCtx.moveTo(20, groundY);
    torricelliCtx.lineTo(w - 20, groundY);
    torricelliCtx.stroke();

    // Water Column inside Tank
    const waterTopY = groundY - torrState.H * scaleY;
    torricelliCtx.fillStyle = 'rgba(6, 182, 212, 0.3)';
    torricelliCtx.fillRect(tankX, waterTopY, tankW, torrState.H * scaleY);

    // Tank Walls
    const tankTopY = groundY - 13 * scaleY;
    torricelliCtx.strokeStyle = '#94A3B8';
    torricelliCtx.lineWidth = 2.5;
    torricelliCtx.beginPath();
    torricelliCtx.moveTo(tankX, tankTopY);
    torricelliCtx.lineTo(tankX, groundY);
    torricelliCtx.lineTo(tankX + tankW, groundY);
    torricelliCtx.lineTo(tankX + tankW, tankTopY);
    torricelliCtx.stroke();

    // Spigot Hole
    const spigotX = tankX + tankW;
    const spigotY = groundY - torrState.y * scaleY;
    torricelliCtx.fillStyle = '#070A13';
    torricelliCtx.fillRect(spigotX - 3, spigotY - 4, 6, 8);

    // Parabolic Water Jet
    const depth = torrState.H - torrState.y;
    const vEfflux = Math.sqrt(2 * torrState.g * depth);
    const tTotal = Math.sqrt((2 * torrState.y) / torrState.g);

    torricelliCtx.strokeStyle = '#38BDF8';
    torricelliCtx.lineWidth = 4;
    torricelliCtx.beginPath();
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tTotal;
        const dx = vEfflux * t * scaleX;
        const dy = 0.5 * torrState.g * t * t * scaleY;
        const px = spigotX + dx;
        const py = spigotY + dy;
        if (i === 0) torricelliCtx.moveTo(px, py);
        else torricelliCtx.lineTo(px, py);
    }
    torricelliCtx.stroke();

    // Animated droplets along the stream
    for (let d = 0; d < 6; d++) {
        const frac = ((torrState.streamPhase + d / 6) % 1);
        const t = frac * tTotal;
        const px = spigotX + vEfflux * t * scaleX;
        const py = spigotY + 0.5 * torrState.g * t * t * scaleY;
        torricelliCtx.fillStyle = '#E0F2FE';
        torricelliCtx.beginPath();
        torricelliCtx.arc(px, py, 3, 0, Math.PI * 2);
        torricelliCtx.fill();
    }

    // Impact Range Marker
    const landX = spigotX + vEfflux * tTotal * scaleX;
    torricelliCtx.fillStyle = '#F59E0B';
    torricelliCtx.beginPath();
    torricelliCtx.arc(landX, groundY, 5, 0, Math.PI * 2);
    torricelliCtx.fill();
}

// ==========================================
// UNIFIED ANIMATION LOOP & BOOTSTRAP
// ==========================================
window.onload = function() {
    fluidCanvas = document.getElementById('fluidCanvas');
    fluidCtx = fluidCanvas?.getContext('2d');

    venturiCanvas = document.getElementById('venturiCanvas');
    venturiCtx = venturiCanvas?.getContext('2d');

    torricelliCanvas = document.getElementById('torricelliCanvas');
    torricelliCtx = torricelliCanvas?.getContext('2d');

    updateFluidParams();
    initVenturiParticles();
    updateVenturiParams();
    updateTorricelliParams();

    requestAnimationFrame(fluidsLoop);
};

let lastFluidTs = 0;
function fluidsLoop(ts) {
    const dt = Math.min(0.05, (ts - lastFluidTs) / 1000 || 0.016);
    lastFluidTs = ts;

    // Animate Venturi particles if modal is open
    const venturiModal = document.getElementById('modal-venturi');
    if (venturiModal && !venturiModal.classList.contains('hidden') && venturiCanvas) {
        const w = venturiCanvas.width, h = venturiCanvas.height;
        const wideH = h * 0.25;
        venturiState.particles.forEach(p => {
            const localH = getPipeHalfHeight(p.x, w, h);
            const localSpeed = venturiState.v1 * (wideH / localH);
            p.x += localSpeed * 45 * dt;
            if (p.x > w) p.x = 0;
        });
        drawVenturi();
    }

    // Animate Torricelli droplets if modal is open
    const torrModal = document.getElementById('modal-torricelli');
    if (torrModal && !torrModal.classList.contains('hidden')) {
        torrState.streamPhase = (torrState.streamPhase + dt * 1.4) % 1;
        drawTorricelli();
    }

    requestAnimationFrame(fluidsLoop);
}