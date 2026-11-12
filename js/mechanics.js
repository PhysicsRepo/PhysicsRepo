/**
 * js/mechanics.js
 * Decoupled Simulation Engines for Classical Mechanics:
 * 1. 2D Projectile Motion Sandbox
 * 2. Inclined Plane & Free-Body Friction Lab
 * 3. 1D Elastic & Inelastic Collision Track
 */

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function openMechModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (!modal) return;
    modal.classList.remove('hidden');

    setTimeout(() => {
        if (simKey === 'projectile') {
            safeResize(projCanvas);
            drawProjectile();
        } else if (simKey === 'incline') {
            safeResize(inclineCanvas);
            drawIncline();
        } else if (simKey === 'collision') {
            safeResize(collCanvas);
            drawCollision();
        }
    }, 50);
}

function closeMechModal(simKey) {
    const modal = document.getElementById(`modal-${simKey}`);
    if (!modal) return;
    modal.classList.add('hidden');

    if (simKey === 'projectile') {
        projState.isPlaying = false;
        const btn = document.getElementById('btn-play-proj');
        if (btn) btn.textContent = "Launch Projectile";
    } else if (simKey === 'incline') {
        incState.isPlaying = false;
        const btn = document.getElementById('btn-play-incline');
        if (btn) btn.textContent = "Release Block";
    } else if (simKey === 'collision') {
        collState.isPlaying = false;
        const btn = document.getElementById('btn-play-coll');
        if (btn) btn.textContent = "Start Carts";
    }
}

function safeResize(canvas) {
    if (!canvas || !canvas.parentElement) return;
    canvas.width = canvas.parentElement.clientWidth || 700;
    canvas.height = canvas.parentElement.clientHeight || 320;
}

// ==========================================
// 1. 2D PROJECTILE MOTION ENGINE
// ==========================================
let projCanvas, projCtx;
const projState = { angle: 45, v0: 40, g: 9.81, t: 0, isPlaying: false, trail: [] };

function updateProjectileParams() {
    projState.angle = parseFloat(document.getElementById('slider-proj-angle').value);
    projState.v0 = parseFloat(document.getElementById('slider-proj-v0').value);
    document.getElementById('lbl-proj-angle').textContent = projState.angle + '°';
    document.getElementById('lbl-proj-v0').textContent = projState.v0 + ' m/s';
    resetProjectile();
}

function resetProjectile() {
    projState.isPlaying = false;
    projState.t = 0;
    projState.trail = [];
    const btn = document.getElementById('btn-play-proj');
    if (btn) btn.textContent = "Launch Projectile";
    drawProjectile();
}

function toggleProjectile() {
    projState.isPlaying = !projState.isPlaying;
    const btn = document.getElementById('btn-play-proj');
    if (btn) btn.textContent = projState.isPlaying ? "Pause" : "Launch Projectile";
}

function drawProjectile() {
    if (!projCtx || !projCanvas) return;
    const w = projCanvas.width, h = projCanvas.height;
    projCtx.clearRect(0, 0, w, h);

    const groundY = h - 30;
    projCtx.strokeStyle = '#06B6D4';
    projCtx.lineWidth = 2;
    projCtx.beginPath();
    projCtx.moveTo(0, groundY);
    projCtx.lineTo(w, groundY);
    projCtx.stroke();

    const rad = projState.angle * Math.PI / 180;
    const vx0 = projState.v0 * Math.cos(rad);
    const vy0 = projState.v0 * Math.sin(rad);

    const x = vx0 * projState.t;
    const y = vy0 * projState.t - 0.5 * projState.g * projState.t * projState.t;

    if (y < 0 && projState.isPlaying) {
        projState.isPlaying = false;
        const btn = document.getElementById('btn-play-proj');
        if (btn) btn.textContent = "Re-launch Projectile";
    }

    const scale = 5;
    const px = 50 + x * scale;
    const py = groundY - Math.max(0, y) * scale;

    if (projState.isPlaying) projState.trail.push({ x: px, y: py });

    if (projState.trail.length > 1) {
        projCtx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        projCtx.setLineDash([4, 4]);
        projCtx.beginPath();
        projCtx.moveTo(projState.trail[0].x, projState.trail[0].y);
        for (let i = 1; i < projState.trail.length; i++) {
            projCtx.lineTo(projState.trail[i].x, projState.trail[i].y);
        }
        projCtx.stroke();
        projCtx.setLineDash([]);
    }

    projCtx.fillStyle = '#38BDF8';
    projCtx.beginPath();
    projCtx.arc(px, py, 7, 0, Math.PI * 2);
    projCtx.fill();

    const posEl = document.getElementById('proj-pos');
    if (posEl) posEl.textContent = `${x.toFixed(1)}, ${Math.max(0, y).toFixed(1)}`;
}

// ==========================================
// 2. INCLINED PLANE & FRICTION ENGINE
// ==========================================
let inclineCanvas, inclineCtx;
const incState = {
    angle: 30, mass: 5, muS: 0.40, muK: 0.25, g: 9.81,
    s: 0, v: 0, a: 0, isSliding: false, isPlaying: false
};

function updateInclineParams() {
    incState.angle = parseFloat(document.getElementById('slider-inc-angle').value);
    incState.mass = parseFloat(document.getElementById('slider-inc-mass').value);
    incState.muS = parseFloat(document.getElementById('slider-inc-mus').value);
    incState.muK = parseFloat(document.getElementById('slider-inc-muk').value);

    // Ensure kinetic friction never exceeds static friction
    if (incState.muK > incState.muS) {
        incState.muK = incState.muS;
        document.getElementById('slider-inc-muk').value = incState.muK;
    }

    document.getElementById('lbl-inc-angle').textContent = incState.angle + '°';
    document.getElementById('lbl-inc-mass').textContent = incState.mass + ' kg';
    document.getElementById('lbl-inc-mus').textContent = incState.muS.toFixed(2);
    document.getElementById('lbl-inc-muk').textContent = incState.muK.toFixed(2);

    computeInclinePhysics();
    drawIncline();
}

function computeInclinePhysics() {
    const rad = incState.angle * Math.PI / 180;
    const fgParallel = incState.mass * incState.g * Math.sin(rad);
    const fn = incState.mass * incState.g * Math.cos(rad);
    const fsMax = incState.muS * fn;

    if (fgParallel > fsMax) {
        incState.isSliding = true;
        const fk = incState.muK * fn;
        incState.a = (fgParallel - fk) / incState.mass;
    } else {
        incState.isSliding = false;
        incState.a = 0;
        incState.v = 0;
    }

    const statusEl = document.getElementById('incline-status');
    const accelEl = document.getElementById('incline-accel');
    if (statusEl) {
        statusEl.textContent = incState.isSliding ? "SLIDING" : "STATIC";
        statusEl.className = incState.isSliding ? "text-amber-400" : "text-emerald-400";
    }
    if (accelEl) accelEl.textContent = incState.a.toFixed(2);
}

function toggleIncline() {
    incState.isPlaying = !incState.isPlaying;
    const btn = document.getElementById('btn-play-incline');
    if (btn) btn.textContent = incState.isPlaying ? "Pause" : "Release Block";
}

function resetIncline() {
    incState.isPlaying = false;
    incState.s = 0;
    incState.v = 0;
    const btn = document.getElementById('btn-play-incline');
    if (btn) btn.textContent = "Release Block";
    computeInclinePhysics();
    drawIncline();
}

function drawArrow(ctx, fromX, fromY, toX, toY, color, label) {
    const headlen = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillText(label, toX + 6, toY + 4);
    }
}

function drawIncline() {
    if (!inclineCtx || !inclineCanvas) return;
    const w = inclineCanvas.width, h = inclineCanvas.height;
    inclineCtx.clearRect(0, 0, w, h);

    const rad = incState.angle * Math.PI / 180;
    const baseLen = w * 0.65;
    const startX = w * 0.18;
    const baseY = h - 35;
    const topX = startX;
    const topY = baseY - baseLen * Math.tan(rad);
    const endX = startX + baseLen;

    // Draw Ramp Triangle
    inclineCtx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    inclineCtx.strokeStyle = '#10B981';
    inclineCtx.lineWidth = 2;
    inclineCtx.beginPath();
    inclineCtx.moveTo(topX, Math.max(30, topY));
    inclineCtx.lineTo(startX, baseY);
    inclineCtx.lineTo(endX, baseY);
    inclineCtx.closePath();
    inclineCtx.fill();
    inclineCtx.stroke();

    // Calculate slope geometry
    const actualTopY = Math.max(30, topY);
    const dx = endX - topX;
    const dy = baseY - actualTopY;
    const slopeLen = Math.hypot(dx, dy);
    const ux = dx / slopeLen;
    const uy = dy / slopeLen;
    // Outward normal
    const nx = uy;
    const ny = -ux;

    const maxTravel = slopeLen - 70;
    if (incState.s > maxTravel) {
        incState.s = maxTravel;
        incState.isPlaying = false;
        const btn = document.getElementById('btn-play-incline');
        if (btn) btn.textContent = "Reached Bottom";
    }

    const blockSize = 36;
    const distAlong = 35 + incState.s;
    const bx = topX + ux * distAlong + nx * (blockSize / 2);
    const by = actualTopY + uy * distAlong + ny * (blockSize / 2);

    // Draw Block rotated on ramp
    inclineCtx.save();
    inclineCtx.translate(bx, by);
    inclineCtx.rotate(Math.atan2(dy, dx));
    inclineCtx.fillStyle = '#06B6D4';
    inclineCtx.strokeStyle = '#E0F2FE';
    inclineCtx.lineWidth = 1.5;
    inclineCtx.fillRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
    inclineCtx.strokeRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
    inclineCtx.restore();

    // Free-Body Force Vectors from block center
    const fScale = 1.6;
    const mg = incState.mass * incState.g;
    const fn = mg * Math.cos(rad);
    const fFric = incState.isSliding ? (incState.muK * fn) : Math.min(mg * Math.sin(rad), incState.muS * fn);

    // Gravity vector (straight down)
    drawArrow(inclineCtx, bx, by, bx, by + Math.min(85, mg * fScale), '#F43F5E', 'mg');
    // Normal force vector (perpendicular outward)
    drawArrow(inclineCtx, bx, by, bx + nx * Math.min(75, fn * fScale), by + ny * Math.min(75, fn * fScale), '#38BDF8', 'N');
    // Friction vector (up the ramp)
    if (fFric > 0.1) {
        drawArrow(inclineCtx, bx, by, bx - ux * Math.min(70, fFric * fScale), by - uy * Math.min(70, fFric * fScale), '#F59E0B', 'f');
    }
}

// ==========================================
// 3. 1D COLLISION & MOMENTUM ENGINE
// ==========================================
let collCanvas, collCtx;
const collState = {
    e: 1.0, m1: 2.0, v1: 4.0, m2: 3.0, v2: -2.0,
    x1: 160, x2: 520, isPlaying: false, hasCollided: false
};

function updateCollisionParams() {
    collState.e = parseFloat(document.getElementById('slider-coll-e').value);
    collState.m1 = parseFloat(document.getElementById('slider-coll-m1').value);
    collState.v1 = parseFloat(document.getElementById('slider-coll-v1').value);
    collState.m2 = parseFloat(document.getElementById('slider-coll-m2').value);
    collState.v2 = parseFloat(document.getElementById('slider-coll-v2').value);

    const eLabel = collState.e === 1 ? "1.00 (Elastic)" : (collState.e === 0 ? "0.00 (Inelastic)" : collState.e.toFixed(2));
    document.getElementById('lbl-coll-e').textContent = eLabel;
    document.getElementById('lbl-coll-m1').textContent = collState.m1.toFixed(1) + ' kg';
    document.getElementById('lbl-coll-v1').textContent = (collState.v1 >= 0 ? '+' : '') + collState.v1.toFixed(1) + ' m/s';
    document.getElementById('lbl-coll-m2').textContent = collState.m2.toFixed(1) + ' kg';
    document.getElementById('lbl-coll-v2').textContent = collState.v2.toFixed(1) + ' m/s';

    resetCollision();
}

function toggleCollision() {
    collState.isPlaying = !collState.isPlaying;
    const btn = document.getElementById('btn-play-coll');
    if (btn) btn.textContent = collState.isPlaying ? "Pause" : "Start Carts";
}

function resetCollision() {
    collState.isPlaying = false;
    collState.hasCollided = false;
    collState.v1 = parseFloat(document.getElementById('slider-coll-v1').value);
    collState.v2 = parseFloat(document.getElementById('slider-coll-v2').value);
    const w = collCanvas?.width || 700;
    collState.x1 = w * 0.22;
    collState.x2 = w * 0.78;
    const btn = document.getElementById('btn-play-coll');
    if (btn) btn.textContent = "Start Carts";
    drawCollision();
}

function drawCollision() {
    if (!collCtx || !collCanvas) return;
    const w = collCanvas.width, h = collCanvas.height;
    collCtx.clearRect(0, 0, w, h);

    const trackY = h * 0.65;
    // Draw air track
    collCtx.strokeStyle = '#334155';
    collCtx.lineWidth = 4;
    collCtx.beginPath();
    collCtx.moveTo(20, trackY);
    collCtx.lineTo(w - 20, trackY);
    collCtx.stroke();

    const w1 = 44 + collState.m1 * 4;
    const h1 = 36 + collState.m1 * 2;
    const w2 = 44 + collState.m2 * 4;
    const h2 = 36 + collState.m2 * 2;

    // Cart A (Cyan)
    collCtx.fillStyle = '#06B6D4';
    collCtx.fillRect(collState.x1 - w1 / 2, trackY - h1, w1, h1);
    collCtx.fillStyle = '#0F172A';
    collCtx.font = "bold 11px 'JetBrains Mono', monospace";
    collCtx.textAlign = "center";
    collCtx.fillText(`${collState.m1}kg`, collState.x1, trackY - h1 / 2 + 4);

    // Cart B (Pink)
    collCtx.fillStyle = '#EC4899';
    collCtx.fillRect(collState.x2 - w2 / 2, trackY - h2, w2, h2);
    collCtx.fillStyle = '#FFFFFF';
    collCtx.fillText(`${collState.m2}kg`, collState.x2, trackY - h2 / 2 + 4);
    collCtx.textAlign = "left";

    // Velocity Vectors above carts
    if (Math.abs(collState.v1) > 0.05) {
        drawArrow(collCtx, collState.x1, trackY - h1 - 15, collState.x1 + collState.v1 * 12, trackY - h1 - 15, '#38BDF8', `${collState.v1.toFixed(1)}m/s`);
    }
    if (Math.abs(collState.v2) > 0.05) {
        drawArrow(collCtx, collState.x2, trackY - h2 - 15, collState.x2 + collState.v2 * 12, trackY - h2 - 15, '#F472B6', `${collState.v2.toFixed(1)}m/s`);
    }

    // Live Telemetry: Total Momentum & Kinetic Energy
    const netP = collState.m1 * collState.v1 + collState.m2 * collState.v2;
    const totalKE = 0.5 * collState.m1 * collState.v1 * collState.v1 + 0.5 * collState.m2 * collState.v2 * collState.v2;

    const momEl = document.getElementById('coll-mom');
    const keEl = document.getElementById('coll-ke');
    if (momEl) momEl.textContent = netP.toFixed(1);
    if (keEl) keEl.textContent = totalKE.toFixed(1);
}

// ==========================================
// UNIFIED ANIMATION LOOP & BOOTSTRAP
// ==========================================
window.onload = function() {
    projCanvas = document.getElementById('projectileCanvas');
    projCtx = projCanvas?.getContext('2d');

    inclineCanvas = document.getElementById('inclineCanvas');
    inclineCtx = inclineCanvas?.getContext('2d');

    collCanvas = document.getElementById('collisionCanvas');
    collCtx = collCanvas?.getContext('2d');

    updateProjectileParams();
    updateInclineParams();
    updateCollisionParams();

    requestAnimationFrame(mechanicsLoop);
};

let lastTimestamp = 0;
function mechanicsLoop(ts) {
    const dt = Math.min(0.05, (ts - lastTimestamp) / 1000 || 0.016);
    lastTimestamp = ts;

    // 1. Update Projectile
    if (projState.isPlaying) {
        projState.t += dt;
        drawProjectile();
    }

    // 2. Update Inclined Plane
    if (incState.isPlaying && incState.isSliding) {
        incState.v += incState.a * dt * 15;
        incState.s += incState.v * dt;
        drawIncline();
    }

    // 3. Update 1D Collision
    if (collState.isPlaying) {
        const pxScale = 35;
        collState.x1 += collState.v1 * pxScale * dt;
        collState.x2 += collState.v2 * pxScale * dt;

        const w1 = 44 + collState.m1 * 4;
        const w2 = 44 + collState.m2 * 4;

        // Check collision contact
        if (!collState.hasCollided && (collState.x1 + w1 / 2 >= collState.x2 - w2 / 2)) {
            collState.hasCollided = true;
            const m1 = collState.m1, m2 = collState.m2;
            const u1 = collState.v1, u2 = collState.v2;
            const e = collState.e;

            // 1D Conservation of Momentum + Restitution Equation
            collState.v1 = (m1 * u1 + m2 * u2 - m2 * e * (u1 - u2)) / (m1 + m2);
            collState.v2 = (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / (m1 + m2);
        }

        // Stop if carts leave canvas bounds
        const w = collCanvas?.width || 700;
        if (collState.x1 < 30 || collState.x2 > w - 30) {
            collState.isPlaying = false;
            const btn = document.getElementById('btn-play-coll');
            if (btn) btn.textContent = "Reset to Replay";
        }

        drawCollision();
    }

    requestAnimationFrame(mechanicsLoop);
}