/**
 * js/electrostatics.js
 * Decoupled Simulation Engines for Electrostatics:
 * 1. Coulomb Force Simulator
 * 2. 2D Electric Field Vector & Equipotential Mapper
 * 3. Parallel Plate Capacitor & Charged Particle Deflection
 */

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function openElectroModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (!modal) return;
    modal.classList.remove('hidden');

    setTimeout(() => {
        if (simKey === 'coulomb') {
            safeResize(electroCanvas);
            drawElectro();
        } else if (simKey === 'field') {
            safeResize(fieldCanvas);
            drawField();
        } else if (simKey === 'capacitor') {
            safeResize(capCanvas);
            drawCapacitor();
        }
    }, 50);
}

function closeElectroModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (modal) modal.classList.add('hidden');
}

function safeResize(canvas) {
    if (!canvas || !canvas.parentElement) return;
    canvas.width = canvas.parentElement.clientWidth || 700;
    canvas.height = canvas.parentElement.clientHeight || 320;
}

// ==========================================
// 1. COULOMB FORCE SIMULATOR ENGINE
// ==========================================
let electroCanvas, electroCtx;
const electroState = { q1: 5, q2: -5, r: 0.50 };

function updateElectroParams() {
    electroState.q1 = parseFloat(document.getElementById('slider-q1').value);
    electroState.q2 = parseFloat(document.getElementById('slider-q2').value);
    electroState.r = parseFloat(document.getElementById('slider-coul-r').value);

    document.getElementById('lbl-q1').textContent = (electroState.q1 > 0 ? '+' : '') + electroState.q1 + ' µC';
    document.getElementById('lbl-q2').textContent = (electroState.q2 > 0 ? '+' : '') + electroState.q2 + ' µC';
    document.getElementById('lbl-coul-r').textContent = electroState.r.toFixed(2) + ' m';

    drawElectro();
}

function drawElectro() {
    if (!electroCtx || !electroCanvas) return;
    const w = electroCanvas.width, h = electroCanvas.height;
    electroCtx.clearRect(0, 0, w, h);

    const midY = h / 2;
    const pxSpan = electroState.r * 340;
    const c1x = w / 2 - pxSpan / 2;
    const c2x = w / 2 + pxSpan / 2;

    // Distance ruler line
    electroCtx.strokeStyle = '#475569';
    electroCtx.lineWidth = 1.5;
    electroCtx.setLineDash([4, 4]);
    electroCtx.beginPath();
    electroCtx.moveTo(c1x, midY + 46);
    electroCtx.lineTo(c2x, midY + 46);
    electroCtx.stroke();
    electroCtx.setLineDash([]);

    electroCtx.fillStyle = '#94A3B8';
    electroCtx.font = "11px 'JetBrains Mono', monospace";
    electroCtx.textAlign = "center";
    electroCtx.fillText(`r = ${electroState.r.toFixed(2)} m`, w / 2, midY + 64);

    // Coulomb Force calculation: F = k * |q1 * q2| / r^2 (q in microCoulombs)
    const k = 8.9875e9;
    const q1C = electroState.q1 * 1e-6;
    const q2C = electroState.q2 * 1e-6;
    const forceMag = (k * Math.abs(q1C * q2C)) / (electroState.r * electroState.r);

    const product = electroState.q1 * electroState.q2;
    const isAttractive = product < 0;
    const isZero = product === 0;

    // Force Vectors
    if (!isZero) {
        const arrowLen = Math.min(115, Math.max(24, forceMag * 28));
        const dir1 = isAttractive ? 1 : -1;
        const dir2 = isAttractive ? -1 : 1;

        drawElectroArrow(electroCtx, c1x, midY, c1x + dir1 * arrowLen, midY, '#F59E0B', 'F₂₁');
        drawElectroArrow(electroCtx, c2x, midY, c2x + dir2 * arrowLen, midY, '#F59E0B', 'F₁₂');
    }

    // Charge 1 Sphere
    const r1 = 16 + Math.abs(electroState.q1) * 0.8;
    electroCtx.fillStyle = electroState.q1 > 0 ? '#06B6D4' : (electroState.q1 < 0 ? '#EC4899' : '#64748B');
    electroCtx.beginPath();
    electroCtx.arc(c1x, midY, r1, 0, Math.PI * 2);
    electroCtx.fill();
    electroCtx.fillStyle = '#FFFFFF';
    electroCtx.font = "bold 11px 'JetBrains Mono', monospace";
    electroCtx.fillText(`${electroState.q1 > 0 ? '+' : ''}${electroState.q1}µC`, c1x, midY + 4);

    // Charge 2 Sphere
    const r2 = 16 + Math.abs(electroState.q2) * 0.8;
    electroCtx.fillStyle = electroState.q2 > 0 ? '#06B6D4' : (electroState.q2 < 0 ? '#EC4899' : '#64748B');
    electroCtx.beginPath();
    electroCtx.arc(c2x, midY, r2, 0, Math.PI * 2);
    electroCtx.fill();
    electroCtx.fillStyle = '#FFFFFF';
    electroCtx.fillText(`${electroState.q2 > 0 ? '+' : ''}${electroState.q2}µC`, c2x, midY + 4);
    electroCtx.textAlign = "left";

    // Update Telemetry
    document.getElementById('coul-force').textContent = forceMag.toFixed(2) + ' N';
    const natureEl = document.getElementById('coul-nature');
    if (isZero) {
        natureEl.textContent = "NEUTRAL (ZERO FORCE)";
        natureEl.className = "text-gray-400";
    } else if (isAttractive) {
        natureEl.textContent = "ATTRACTIVE";
        natureEl.className = "text-emerald-400";
    } else {
        natureEl.textContent = "REPULSIVE";
        natureEl.className = "text-rose-400";
    }
}

function drawElectroArrow(ctx, x1, y1, x2, y2, color, label) {
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
        ctx.fillText(label, x2 - 8, y2 - 10);
    }
}

// ==========================================
// 2. 2D ELECTRIC FIELD VECTOR MAPPER ENGINE
// ==========================================
let fieldCanvas, fieldCtx;
const fieldState = { preset: 'dipole', showEquipotential: true };

function updateFieldParams() {
    fieldState.preset = document.getElementById('select-field-preset').value;
    fieldState.showEquipotential = document.getElementById('chk-equipotential').checked;
    drawField();
}

function getFieldCharges(w, h) {
    const cx = w / 2, cy = h / 2;
    if (fieldState.preset === 'dipole') {
        return [
            { x: cx - 110, y: cy, q: 1 },
            { x: cx + 110, y: cy, q: -1 }
        ];
    } else if (fieldState.preset === 'like') {
        return [
            { x: cx - 110, y: cy, q: 1 },
            { x: cx + 110, y: cy, q: 1 }
        ];
    } else {
        return [
            { x: cx - 95, y: cy - 65, q: 1 },
            { x: cx + 95, y: cy - 65, q: -1 },
            { x: cx - 95, y: cy + 65, q: -1 },
            { x: cx + 95, y: cy + 65, q: 1 }
        ];
    }
}

function drawField() {
    if (!fieldCtx || !fieldCanvas) return;
    const w = fieldCanvas.width, h = fieldCanvas.height;
    fieldCtx.clearRect(0, 0, w, h);

    const charges = getFieldCharges(w, h);

    // Optional Equipotential Rings around charges
    if (fieldState.showEquipotential) {
        charges.forEach(c => {
            for (let rad = 32; rad <= 96; rad += 32) {
                fieldCtx.strokeStyle = c.q > 0 ? 'rgba(6, 182, 212, 0.22)' : 'rgba(236, 72, 153, 0.22)';
                fieldCtx.lineWidth = 1;
                fieldCtx.setLineDash([3, 3]);
                fieldCtx.beginPath();
                fieldCtx.arc(c.x, c.y, rad, 0, Math.PI * 2);
                fieldCtx.stroke();
            }
        });
        fieldCtx.setLineDash([]);
    }

    // 2D Electric Field Vector Grid
    const spacing = 36;
    for (let gx = 28; gx < w - 20; gx += spacing) {
        for (let gy = 26; gy < h - 20; gy += spacing) {
            let ex = 0, ey = 0;
            let tooClose = false;

            for (const c of charges) {
                const dx = gx - c.x;
                const dy = gy - c.y;
                const r2 = dx * dx + dy * dy;
                if (r2 < 550) {
                    tooClose = true;
                    break;
                }
                const r = Math.sqrt(r2);
                const eMag = (c.q * 15000) / r2;
                ex += eMag * (dx / r);
                ey += eMag * (dy / r);
            }

            if (tooClose) continue;

            const mag = Math.hypot(ex, ey);
            if (mag < 0.05) continue;

            const ux = ex / mag;
            const uy = ey / mag;
            const arrowLen = Math.min(20, Math.max(8, mag * 6));
            const alpha = Math.min(0.9, Math.max(0.25, mag * 0.4));

            const tx = gx + ux * arrowLen;
            const ty = gy + uy * arrowLen;

            fieldCtx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            fieldCtx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
            fieldCtx.lineWidth = 1.4;
            fieldCtx.beginPath();
            fieldCtx.moveTo(gx, gy);
            fieldCtx.lineTo(tx, ty);
            fieldCtx.stroke();

            const ang = Math.atan2(uy, ux);
            fieldCtx.beginPath();
            fieldCtx.moveTo(tx, ty);
            fieldCtx.lineTo(tx - 4.5 * Math.cos(ang - Math.PI / 6), ty - 4.5 * Math.sin(ang - Math.PI / 6));
            fieldCtx.lineTo(tx - 4.5 * Math.cos(ang + Math.PI / 6), ty - 4.5 * Math.sin(ang + Math.PI / 6));
            fieldCtx.closePath();
            fieldCtx.fill();
        }
    }

    // Draw Point Charges on top
    charges.forEach(c => {
        fieldCtx.fillStyle = c.q > 0 ? '#06B6D4' : '#EC4899';
        fieldCtx.beginPath();
        fieldCtx.arc(c.x, c.y, 14, 0, Math.PI * 2);
        fieldCtx.fill();

        fieldCtx.fillStyle = '#FFFFFF';
        fieldCtx.font = "bold 13px 'JetBrains Mono', monospace";
        fieldCtx.textAlign = "center";
        fieldCtx.fillText(c.q > 0 ? '+' : '−', c.x, c.y + 4.5);
    });
    fieldCtx.textAlign = "left";
}

// ==========================================
// 3. PARALLEL PLATE CAPACITOR BEAM ENGINE
// ==========================================
let capCanvas, capCtx;
const capState = { particle: 'electron', voltage: 200, vx: 1.5e7, pulsePhase: 0 };

function updateCapacitorParams() {
    capState.particle = document.getElementById('select-cap-particle').value;
    capState.voltage = parseFloat(document.getElementById('slider-cap-v').value);
    const vxScaled = parseFloat(document.getElementById('slider-cap-vx').value);
    capState.vx = vxScaled * 1e7;

    document.getElementById('lbl-cap-v').textContent = capState.voltage + ' V';
    document.getElementById('lbl-cap-vx').textContent = vxScaled.toFixed(1) + ' × 10⁷ m/s';

    drawCapacitor();
}

function drawCapacitor() {
    if (!capCtx || !capCanvas) return;
    const w = capCanvas.width, h = capCanvas.height;
    capCtx.clearRect(0, 0, w, h);

    const midY = h / 2;
    const plateLeft = w * 0.28;
    const plateRight = w * 0.72;
    const plateLengthM = 0.08; // 8 cm physical plate length
    const plateSepM = 0.04;    // 4 cm physical separation
    const topPlateY = 48;
    const botPlateY = h - 48;

    // Top Plate (+ Positive)
    capCtx.fillStyle = '#06B6D4';
    capCtx.fillRect(plateLeft, topPlateY - 8, plateRight - plateLeft, 8);
    capCtx.fillStyle = '#E0F2FE';
    capCtx.font = "bold 11px 'JetBrains Mono', monospace";
    capCtx.fillText(`+ + + + +  (+${capState.voltage} V)`, plateLeft + 12, topPlateY - 14);

    // Bottom Plate (- Negative)
    capCtx.fillStyle = '#EC4899';
    capCtx.fillRect(plateLeft, botPlateY, plateRight - plateLeft, 8);
    capCtx.fillStyle = '#FCE7F3';
    capCtx.fillText(`− − − − −  (0 V)`, plateLeft + 12, botPlateY + 22);

    // Uniform Vertical Electric Field Lines (Top -> Bottom)
    capCtx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    capCtx.lineWidth = 1.2;
    for (let fx = plateLeft + 24; fx < plateRight - 15; fx += 34) {
        capCtx.beginPath();
        capCtx.moveTo(fx, topPlateY + 4);
        capCtx.lineTo(fx, botPlateY - 4);
        capCtx.stroke();

        // Downward arrowhead
        capCtx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        capCtx.beginPath();
        capCtx.moveTo(fx, midY + 6);
        capCtx.lineTo(fx - 3.5, midY - 2);
        capCtx.lineTo(fx + 3.5, midY - 2);
        capCtx.closePath();
        capCtx.fill();
    }

    // Emitter Nozzle on Left
    capCtx.fillStyle = '#334155';
    capCtx.fillRect(25, midY - 12, 35, 24);

    // Physics Calculation
    const eField = capState.voltage / plateSepM; // V/m
    const q = 1.602e-19;
    // Scale proton deflection visually so both trajectories are clearly observable
    const m = capState.particle === 'electron' ? 9.11e-31 : 1.67e-28;
    const sign = capState.particle === 'electron' ? -1 : 1; // electron deflects upward (-y on canvas)
    const accelY = sign * (q * eField) / m;

    const tTransit = plateLengthM / capState.vx;
    const dyFinalM = 0.5 * accelY * tTransit * tTransit;
    const vyExit = accelY * tTransit;

    // Pixel mapping
    const pxPerMeterY = (botPlateY - topPlateY) / plateSepM;
    const platePxW = plateRight - plateLeft;

    // Draw Parabolic Particle Trajectory
    capCtx.strokeStyle = capState.particle === 'electron' ? '#10B981' : '#F59E0B';
    capCtx.lineWidth = 3;
    capCtx.beginPath();
    capCtx.moveTo(60, midY);
    capCtx.lineTo(plateLeft, midY);

    let hitPlate = false;
    let exitX = plateRight;
    let exitY = midY + dyFinalM * pxPerMeterY;

    const steps = 30;
    for (let i = 1; i <= steps; i++) {
        const frac = i / steps;
        const t = frac * tTransit;
        const py = midY + (0.5 * accelY * t * t) * pxPerMeterY;
        const px = plateLeft + frac * platePxW;

        if (py <= topPlateY + 2 || py >= botPlateY - 2) {
            hitPlate = true;
            exitX = px;
            exitY = Math.max(topPlateY + 2, Math.min(botPlateY - 2, py));
            capCtx.lineTo(exitX, exitY);
            break;
        }
        capCtx.lineTo(px, py);
    }

    // Straight tangent trajectory after exiting plates
    if (!hitPlate) {
        const remDistM = ((w - 25 - plateRight) / platePxW) * plateLengthM;
        const tAfter = remDistM / capState.vx;
        const finalY = exitY + (vyExit * tAfter) * pxPerMeterY;
        capCtx.lineTo(w - 25, finalY);
    }
    capCtx.stroke();

    // Animated particle pulse along beam
    const pulseX = 60 + capState.pulsePhase * (exitX - 60);
    let pulseY = midY;
    if (pulseX > plateLeft) {
        const frac = (pulseX - plateLeft) / platePxW;
        const t = frac * tTransit;
        pulseY = midY + (0.5 * accelY * t * t) * pxPerMeterY;
    }
    capCtx.fillStyle = '#FFFFFF';
    capCtx.beginPath();
    capCtx.arc(pulseX, pulseY, 4, 0, Math.PI * 2);
    capCtx.fill();

    // Update Telemetry
    document.getElementById('cap-efield').textContent = Math.round(eField).toLocaleString() + ' V/m';
    const dyMm = Math.abs(dyFinalM) * 1000;
    document.getElementById('cap-dy').textContent = hitPlate ? 'PLATE IMPACT' : dyMm.toFixed(1) + ' mm';
}

// ==========================================
// UNIFIED ANIMATION LOOP & BOOTSTRAP
// ==========================================
window.onload = function() {
    electroCanvas = document.getElementById('electroCanvas');
    electroCtx = electroCanvas?.getContext('2d');

    fieldCanvas = document.getElementById('fieldCanvas');
    fieldCtx = fieldCanvas?.getContext('2d');

    capCanvas = document.getElementById('capacitorCanvas');
    capCtx = capCanvas?.getContext('2d');

    updateElectroParams();
    updateFieldParams();
    updateCapacitorParams();

    requestAnimationFrame(electroLoop);
};

let lastElectroTs = 0;
function electroLoop(ts) {
    const dt = Math.min(0.05, (ts - lastElectroTs) / 1000 || 0.016);
    lastElectroTs = ts;

    const capModal = document.getElementById('modal-capacitor');
    if (capModal && !capModal.classList.contains('hidden')) {
        capState.pulsePhase = (capState.pulsePhase + dt * 1.3) % 1;
        drawCapacitor();
    }

    requestAnimationFrame(electroLoop);
}