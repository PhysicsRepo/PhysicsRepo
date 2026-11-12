/**
 * js/optics.js
 * Decoupled Simulation Engines for Geometric Optics:
 * 1. Thin Lens Ray Optics Visualizer (Convex & Concave)
 * 2. Snell's Law & Total Internal Reflection (TIR)
 * 3. Spherical Mirrors Ray Tracer (Concave & Convex)
 */

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function openOpticsModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (!modal) return;
    modal.classList.remove('hidden');

    setTimeout(() => {
        if (simKey === 'lens') {
            safeResize(opticsCanvas);
            drawOptics();
        } else if (simKey === 'snell') {
            safeResize(snellCanvas);
            drawSnell();
        } else if (simKey === 'mirror') {
            safeResize(mirrorCanvas);
            drawMirror();
        }
    }, 50);
}

function closeOpticsModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (modal) modal.classList.add('hidden');
}

function safeResize(canvas) {
    if (!canvas || !canvas.parentElement) return;
    canvas.width = canvas.parentElement.clientWidth || 700;
    canvas.height = canvas.parentElement.clientHeight || 320;
}

// ==========================================
// 1. THIN LENS RAY OPTICS ENGINE
// ==========================================
let opticsCanvas, opticsCtx;
const opticsState = { type: 'convex', fMag: 12, do: 25, ho: 48 };

function updateOpticsParams() {
    opticsState.type = document.getElementById('select-lens-type').value;
    opticsState.fMag = parseFloat(document.getElementById('slider-lens-f').value);
    opticsState.do = parseFloat(document.getElementById('slider-obj-dist').value);

    document.getElementById('lbl-lens-f').textContent = opticsState.fMag + ' cm';
    document.getElementById('lbl-obj-dist').textContent = opticsState.do + ' cm';

    drawOptics();
}

function drawOptics() {
    if (!opticsCtx || !opticsCanvas) return;
    const w = opticsCanvas.width, h = opticsCanvas.height;
    opticsCtx.clearRect(0, 0, w, h);

    const midY = h / 2;
    const lx = w / 2;
    const scale = 7;
    const f = opticsState.type === 'convex' ? opticsState.fMag : -opticsState.fMag;

    // Optical Axis
    opticsCtx.strokeStyle = '#475569';
    opticsCtx.lineWidth = 1;
    opticsCtx.setLineDash([4, 4]);
    opticsCtx.beginPath();
    opticsCtx.moveTo(0, midY);
    opticsCtx.lineTo(w, midY);
    opticsCtx.stroke();
    opticsCtx.setLineDash([]);

    // Focal Points F1 and F2
    const fPx = opticsState.fMag * scale;
    drawFocalMarker(opticsCtx, lx - fPx, midY, 'F');
    drawFocalMarker(opticsCtx, lx + fPx, midY, "F'");

    // Lens Shape
    opticsCtx.strokeStyle = '#F59E0B';
    opticsCtx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    opticsCtx.lineWidth = 2.5;
    const lensH = 105;
    opticsCtx.beginPath();
    if (opticsState.type === 'convex') {
        opticsCtx.moveTo(lx, midY - lensH);
        opticsCtx.quadraticCurveTo(lx + 16, midY, lx, midY + lensH);
        opticsCtx.quadraticCurveTo(lx - 16, midY, lx, midY - lensH);
    } else {
        opticsCtx.moveTo(lx - 10, midY - lensH);
        opticsCtx.quadraticCurveTo(lx - 2, midY, lx - 10, midY + lensH);
        opticsCtx.lineTo(lx + 10, midY + lensH);
        opticsCtx.quadraticCurveTo(lx + 2, midY, lx + 10, midY - lensH);
        opticsCtx.closePath();
    }
    opticsCtx.fill();
    opticsCtx.stroke();

    // Object Arrow
    const ox = lx - opticsState.do * scale;
    const oyTop = midY - opticsState.ho;
    drawOpticsArrow(opticsCtx, ox, midY, ox, oyTop, '#06B6D4', 'Obj');

    // Thin Lens Equation: 1/di = 1/f - 1/do
    if (Math.abs(opticsState.do - f) < 0.05) {
        document.getElementById('lens-di').textContent = "∞";
        document.getElementById('lens-mag').textContent = "∞";
        document.getElementById('lens-type-lbl').textContent = "AT FOCAL POINT (NO IMAGE)";
        return;
    }

    const di = (f * opticsState.do) / (opticsState.do - f);
    const mag = -di / opticsState.do;
    const ix = lx + di * scale;
    const iyTop = midY - (opticsState.ho * mag);

    // Ray 1: Parallel to axis -> refracts through focal point
    opticsCtx.strokeStyle = '#38BDF8';
    opticsCtx.lineWidth = 1.6;
    opticsCtx.beginPath();
    opticsCtx.moveTo(ox, oyTop);
    opticsCtx.lineTo(lx, oyTop);
    if (di > 0) {
        opticsCtx.lineTo(ix, iyTop);
    } else {
        // Extend forward diverging
        const slope = (oyTop - midY) / (-f * scale);
        opticsCtx.lineTo(w, oyTop + slope * (w - lx));
    }
    opticsCtx.stroke();

    // Ray 2: Straight through optical center
    opticsCtx.strokeStyle = '#A855F7';
    opticsCtx.beginPath();
    opticsCtx.moveTo(ox, oyTop);
    if (di > 0) {
        opticsCtx.lineTo(ix, iyTop);
    } else {
        const slopeCenter = (midY - oyTop) / (lx - ox);
        opticsCtx.lineTo(w, midY + slopeCenter * (w - lx));
    }
    opticsCtx.stroke();

    // Virtual ray extensions (dashed) when di < 0
    if (di < 0) {
        opticsCtx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
        opticsCtx.setLineDash([4, 4]);
        opticsCtx.beginPath();
        opticsCtx.moveTo(lx, oyTop);
        opticsCtx.lineTo(ix, iyTop);
        opticsCtx.moveTo(lx, midY);
        opticsCtx.lineTo(ix, iyTop);
        opticsCtx.stroke();
        opticsCtx.setLineDash([]);
    }

    // Draw Image Arrow
    const isReal = di > 0;
    drawOpticsArrow(opticsCtx, ix, midY, ix, iyTop, isReal ? '#10B981' : '#EC4899', 'Img', !isReal);

    // Telemetry
    document.getElementById('lens-di').textContent = di.toFixed(1) + ' cm';
    document.getElementById('lens-mag').textContent = mag.toFixed(2) + 'x';
    const typeLbl = document.getElementById('lens-type-lbl');
    typeLbl.textContent = isReal ? "REAL / INVERTED" : "VIRTUAL / UPRIGHT";
    typeLbl.className = isReal ? "text-emerald-400" : "text-pink-400";
}

function drawFocalMarker(ctx, x, y, text) {
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(text, x - 4, y + 16);
}

function drawOpticsArrow(ctx, x1, y1, x2, y2, color, label, isDashed = false) {
    const head = 7;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    if (isDashed) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.fillText(label, x2 - 10, y2 < y1 ? y2 - 8 : y2 + 16);
    }
}

// ==========================================
// 2. SNELL'S LAW & TIR ENGINE
// ==========================================
let snellCanvas, snellCtx;
const snellState = { theta1: 35, n1: 1.33, n2: 1.00 };

function updateSnellParams() {
    snellState.theta1 = parseFloat(document.getElementById('slider-snell-theta1').value);
    snellState.n1 = parseFloat(document.getElementById('select-snell-n1').value);
    snellState.n2 = parseFloat(document.getElementById('select-snell-n2').value);

    document.getElementById('lbl-snell-theta1').textContent = snellState.theta1 + '°';
    drawSnell();
}

function drawSnell() {
    if (!snellCtx || !snellCanvas) return;
    const w = snellCanvas.width, h = snellCanvas.height;
    snellCtx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;

    // Medium 1 (Top) & Medium 2 (Bottom) shading based on refractive index
    snellCtx.fillStyle = `rgba(6, 182, 212, ${Math.min(0.32, (snellState.n1 - 0.9) * 0.16)})`;
    snellCtx.fillRect(0, 0, w, cy);

    snellCtx.fillStyle = `rgba(168, 85, 247, ${Math.min(0.35, (snellState.n2 - 0.9) * 0.16)})`;
    snellCtx.fillRect(0, cy, w, cy);

    // Interface boundary
    snellCtx.strokeStyle = '#94A3B8';
    snellCtx.lineWidth = 2;
    snellCtx.beginPath();
    snellCtx.moveTo(0, cy);
    snellCtx.lineTo(w, cy);
    snellCtx.stroke();

    // Normal Line
    snellCtx.strokeStyle = '#64748B';
    snellCtx.lineWidth = 1.2;
    snellCtx.setLineDash([5, 5]);
    snellCtx.beginPath();
    snellCtx.moveTo(cx, 15);
    snellCtx.lineTo(cx, h - 15);
    snellCtx.stroke();
    snellCtx.setLineDash([]);

    // Media Labels
    snellCtx.fillStyle = '#CBD5E1';
    snellCtx.font = "11px 'JetBrains Mono', monospace";
    snellCtx.fillText(`Medium 1 (n₁ = ${snellState.n1.toFixed(2)})`, 16, 26);
    snellCtx.fillText(`Medium 2 (n₂ = ${snellState.n2.toFixed(2)})`, 16, cy + 24);

    const rad1 = snellState.theta1 * Math.PI / 180;
    const rayLen = 190;

    // Incident Laser Ray (from top-left to center)
    const ix = cx - rayLen * Math.sin(rad1);
    const iy = cy - rayLen * Math.cos(rad1);
    snellCtx.strokeStyle = '#F43F5E';
    snellCtx.lineWidth = 3;
    snellCtx.beginPath();
    snellCtx.moveTo(ix, iy);
    snellCtx.lineTo(cx, cy);
    snellCtx.stroke();

    // Snell's Law: n1 * sin(theta1) = n2 * sin(theta2)
    const sinTheta2 = (snellState.n1 / snellState.n2) * Math.sin(rad1);
    const isTIR = sinTheta2 > 1.0;

    // Reflected Ray (stronger during TIR)
    const rx = cx + rayLen * Math.sin(rad1);
    const ry = cy - rayLen * Math.cos(rad1);
    snellCtx.strokeStyle = isTIR ? '#F43F5E' : 'rgba(244, 63, 94, 0.35)';
    snellCtx.lineWidth = isTIR ? 3 : 1.8;
    snellCtx.beginPath();
    snellCtx.moveTo(cx, cy);
    snellCtx.lineTo(rx, ry);
    snellCtx.stroke();

    // Critical angle calculation
    const thetaCEl = document.getElementById('snell-thetac');
    if (snellState.n1 > snellState.n2) {
        const tcDeg = Math.asin(snellState.n2 / snellState.n1) * 180 / Math.PI;
        thetaCEl.textContent = tcDeg.toFixed(1) + '°';
    } else {
        thetaCEl.textContent = 'None (n₁ ≤ n₂)';
    }

    const theta2El = document.getElementById('snell-theta2');
    const statusEl = document.getElementById('snell-status');

    if (isTIR) {
        theta2El.textContent = 'TIR';
        statusEl.textContent = 'TOTAL INTERNAL REFLECTION';
        statusEl.className = 'text-rose-400';
    } else {
        const rad2 = Math.asin(sinTheta2);
        const deg2 = rad2 * 180 / Math.PI;
        const tx = cx + rayLen * Math.sin(rad2);
        const ty = cy + rayLen * Math.cos(rad2);

        snellCtx.strokeStyle = '#06B6D4';
        snellCtx.lineWidth = 3;
        snellCtx.beginPath();
        snellCtx.moveTo(cx, cy);
        snellCtx.lineTo(tx, ty);
        snellCtx.stroke();

        theta2El.textContent = deg2.toFixed(1) + '°';
        statusEl.textContent = 'REFRACTION';
        statusEl.className = 'text-emerald-400';
    }
}

// ==========================================
// 3. SPHERICAL MIRRORS RAY TRACER ENGINE
// ==========================================
let mirrorCanvas, mirrorCtx;
const mirrorState = { type: 'concave', radius: 24, do: 28, ho: 46 };

function updateMirrorParams() {
    mirrorState.type = document.getElementById('select-mirror-type').value;
    mirrorState.radius = parseFloat(document.getElementById('slider-mirr-r').value);
    mirrorState.do = parseFloat(document.getElementById('slider-mirr-do').value);

    document.getElementById('lbl-mirr-r').textContent = mirrorState.radius + ' cm';
    document.getElementById('lbl-mirr-do').textContent = mirrorState.do + ' cm';

    drawMirror();
}

function drawMirror() {
    if (!mirrorCtx || !mirrorCanvas) return;
    const w = mirrorCanvas.width, h = mirrorCanvas.height;
    mirrorCtx.clearRect(0, 0, w, h);

    const midY = h / 2;
    const mx = w * 0.68; // Mirror vertex on right-center
    const scale = 6.5;
    const fMag = mirrorState.radius / 2;
    const f = mirrorState.type === 'concave' ? fMag : -fMag;

    // Principal Axis
    mirrorCtx.strokeStyle = '#475569';
    mirrorCtx.lineWidth = 1;
    mirrorCtx.setLineDash([4, 4]);
    mirrorCtx.beginPath();
    mirrorCtx.moveTo(0, midY);
    mirrorCtx.lineTo(w, midY);
    mirrorCtx.stroke();
    mirrorCtx.setLineDash([]);

    // Focal Point (F) and Center of Curvature (C)
    const dir = mirrorState.type === 'concave' ? -1 : 1;
    drawFocalMarker(mirrorCtx, mx + dir * fMag * scale, midY, 'F');
    drawFocalMarker(mirrorCtx, mx + dir * mirrorState.radius * scale, midY, 'C');

    // Curved Mirror Arc
    mirrorCtx.strokeStyle = '#A855F7';
    mirrorCtx.lineWidth = 3.5;
    const arcH = 105;
    const curveOffset = mirrorState.type === 'concave' ? -22 : 22;
    mirrorCtx.beginPath();
    mirrorCtx.moveTo(mx + curveOffset, midY - arcH);
    mirrorCtx.quadraticCurveTo(mx - curveOffset, midY, mx + curveOffset, midY + arcH);
    mirrorCtx.stroke();

    // Object Arrow (always placed in front/left of mirror)
    const ox = mx - mirrorState.do * scale;
    const oyTop = midY - mirrorState.ho;
    drawOpticsArrow(mirrorCtx, ox, midY, ox, oyTop, '#06B6D4', 'Obj');

    // Mirror Equation: 1/di = 1/f - 1/do
    if (Math.abs(mirrorState.do - f) < 0.05) {
        document.getElementById('mirr-di').textContent = "∞";
        document.getElementById('mirr-mag').textContent = "∞";
        document.getElementById('mirr-type-lbl').textContent = "AT FOCAL POINT (NO IMAGE)";
        return;
    }

    const di = (f * mirrorState.do) / (mirrorState.do - f);
    const mag = -di / mirrorState.do;
    // Real images form in front (left) of mirror (di > 0 => mx - di*scale)
    const ix = mx - di * scale;
    const iyTop = midY - (mirrorState.ho * mag);

    // Ray 1: Parallel to axis -> reflects through F
    mirrorCtx.strokeStyle = '#38BDF8';
    mirrorCtx.lineWidth = 1.6;
    mirrorCtx.beginPath();
    mirrorCtx.moveTo(ox, oyTop);
    mirrorCtx.lineTo(mx, oyTop);
    if (di > 0) {
        mirrorCtx.lineTo(ix, iyTop);
    } else {
        // Diverges outward to left
        const fx = mx + fMag * scale;
        const slope = (oyTop - midY) / (mx - fx);
        mirrorCtx.lineTo(0, oyTop - slope * mx);
    }
    mirrorCtx.stroke();

    // Ray 2: Strikes vertex at equal angle
    mirrorCtx.strokeStyle = '#F59E0B';
    mirrorCtx.beginPath();
    mirrorCtx.moveTo(ox, oyTop);
    mirrorCtx.lineTo(mx, midY);
    if (di > 0) {
        mirrorCtx.lineTo(ix, iyTop);
    } else {
        const slopeV = (midY - oyTop) / (mx - ox);
        mirrorCtx.lineTo(0, midY + slopeV * mx);
    }
    mirrorCtx.stroke();

    // Virtual ray extensions behind mirror (dashed)
    if (di < 0) {
        mirrorCtx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
        mirrorCtx.setLineDash([4, 4]);
        mirrorCtx.beginPath();
        mirrorCtx.moveTo(mx, oyTop);
        mirrorCtx.lineTo(ix, iyTop);
        mirrorCtx.moveTo(mx, midY);
        mirrorCtx.lineTo(ix, iyTop);
        mirrorCtx.stroke();
        mirrorCtx.setLineDash([]);
    }

    const isReal = di > 0;
    drawOpticsArrow(mirrorCtx, ix, midY, ix, iyTop, isReal ? '#10B981' : '#EC4899', 'Img', !isReal);

    document.getElementById('mirr-di').textContent = di.toFixed(1) + ' cm';
    document.getElementById('mirr-mag').textContent = mag.toFixed(2) + 'x';
    const typeLbl = document.getElementById('mirr-type-lbl');
    typeLbl.textContent = isReal ? "REAL / INVERTED" : "VIRTUAL / UPRIGHT";
    typeLbl.className = isReal ? "text-emerald-400" : "text-pink-400";
}

// ==========================================
// BOOTSTRAP
// ==========================================
window.onload = function() {
    opticsCanvas = document.getElementById('opticsCanvas');
    opticsCtx = opticsCanvas?.getContext('2d');

    snellCanvas = document.getElementById('snellCanvas');
    snellCtx = snellCanvas?.getContext('2d');

    mirrorCanvas = document.getElementById('mirrorCanvas');
    mirrorCtx = mirrorCanvas?.getContext('2d');

    updateOpticsParams();
    updateSnellParams();
    updateMirrorParams();
};