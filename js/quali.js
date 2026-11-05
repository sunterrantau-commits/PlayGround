/* ============================================================
   MOTOGP PIXEL MANAGER — qualifying and starting grid
   ============================================================ */

/* ------------------------------------------------------------------ */
/* Qualifying set-up                                                   */
/* ------------------------------------------------------------------ */

function startQuali() {
  if (!state || !weekend) return;
  const team = currentTeam();
  const rider = currentRider();
  const circuit = weekend.circuit;
  const wet = weekend.condition === "WET";
  const playerRating = riderPerf(rider, team, state.upgrades) + upgradeSum() * 0.09;
  const baseTime = raceLapTimeFor(playerRating, circuit, wet, rider.wet, rand(-0.08, 0.08));

  const aiTimes = {};
  RIDERS.forEach((r) => {
    if (r.id === rider.id) return;
    const t = teamById(r.teamId);
    const boost = (state.season - 1) * 1.1;
    const rating = riderPerf(r, t, null, boost);
    const spread = r.consistency >= 87 ? 0.22 : r.consistency >= 83 ? 0.38 : 0.55;
    aiTimes[r.id] = raceLapTimeFor(rating, circuit, wet, r.wet, rand(-spread, spread + 0.1));
  });

  quali = {
    circuit,
    condition: weekend.condition,
    wet,
    baseTime,
    aiTimes,
    sector: 0,
    sectors: [],
    cursor: 0,
    sectorStart: performance.now(),
    complete: false,
    playerTime: null,
    grid: null,
    position: null,
    timer: null
  };
  clearTimeout(qTimer);
  setView("quali");
}

function qualiHTML() {
  if (!quali) { setTimeout(startQuali, 0); return "<div class='page'>Loading qualifying…</div>"; }
  const team = currentTeam();
  const rider = currentRider();
  const c = quali.circuit;
  const roundNo = state.round + 1;
  return `
  <div class="quali-shell" style="--tc:${team.color};--ta:${team.accent}">
    <header class="weekend-head">
      <button class="icon-btn" data-action="nav" data-view="hub" aria-label="Back to paddock">${icon("back")}</button>
      <div><div class="kicker">ROUND ${roundNo} · ${esc(c.code)}</div><div style="font-family:var(--display);font-size:9px">FLYING LAP</div></div>
      <div class="weekend-progress"><span class="wp-step done">BRIEF</span><span class="wp-step active">QUALI</span><span class="wp-step">RACE</span></div>
    </header>

    <div class="quali-body">
      <div class="quali-header">
        <div>
          <div class="kicker">${quali.wet ? "WET QUALIFYING" : "DRY QUALIFYING"} · ${esc(c.name)}</div>
          <h1 class="weekend-title" style="font-size:clamp(14px,3vw,22px)">THREE TAPS. ONE LAP.</h1>
          <p class="weekend-sub">Hit the lime zone as the marker sweeps across. Three clean sectors put you at the front. The grid is watching.</p>
        </div>
        <div class="quali-grid-mini">
          <span class="tag">${esc(rider.short)} #${rider.num}</span>
          <span class="tag">${esc(team.model)}</span>
          <span class="tag lime">${esc(weekend.tyre.toUpperCase())} TYRE</span>
        </div>
      </div>

      <div class="quali-stage">
        <div class="quali-lights">
          <span>SECTOR</span>
          <span class="q-leds"><i class="q-led on"></i><i class="q-led"></i><i class="q-led"></i></span>
          <span id="qSectorLabel">1 / 3</span>
        </div>

        <div class="panel quali-gauge-card">
          <div class="gauge-readout">
            <span class="sector-word" id="qStatus">FLYING LAP</span>
            <span class="delta" id="qDelta">—.———</span>
          </div>
          <div class="gauge-track" id="qGauge" data-action="q-push" role="slider" aria-label="Flying lap timing gauge" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="gauge-zone"></div>
            <div class="gauge-cursor" id="qCursor"></div>
          </div>
          <div class="gauge-labels"><span>TOO EARLY</span><span>PERFECT</span><span>TOO LATE</span></div>
          <div class="sector-row">
            ${[0, 1, 2].map((i) => `<div class="sector-cell ${i === 0 ? "live" : ""}" id="qSector${i}"><span class="sk">SECTOR ${i + 1}</span><span class="sv" id="qSectorVal${i}">—</span></div>`).join("")}
          </div>
          <div class="q-push-wrap">
            <button class="q-push" id="qPushBtn" data-action="q-push">PUSH!</button>
            <span class="q-hint" id="qHint">TAP WHEN THE MARKER ENTERS THE LIME ZONE</span>
          </div>
          <div class="quali-progress-note">
            <span>P1 TIME <b id="qPoleTarget">—</b></span>
            <span>YOUR BEST <b id="qPlayerTarget">—</b></span>
            <span><button class="btn ghost" style="padding:2px 7px;min-height:23px;font-size:6px;box-shadow:none" data-action="q-auto">AUTO LAP</button></span>
          </div>
        </div>
      </div>
      <div class="quali-progress-note" style="margin-top:14px"><span>GRID: 22 RIDERS</span><span>POLE POSITION: 1 POINT OF PRIDE</span></div>
    </div>
  </div>`;
}

function startQualiLoop() {
  stopQualiLoop();
  if (!quali || quali.complete) return;
  const cursor = $("#qCursor");
  if (!cursor) return;
  let last = performance.now();
  const tick = (now) => {
    if (!quali || quali.complete || view !== "quali") { stopQualiLoop(); return; }
    if (!document.getElementById("qCursor")) { stopQualiLoop(); return; }
    const speed = [0.52, 0.68, 0.86][Math.min(quali.sector, 2)];
    const elapsed = (now - quali.sectorStart) / 1000;
    const phase = (elapsed * speed) % 2;
    const x = phase <= 1 ? phase : 2 - phase;
    quali.cursor = x;
    cursor.style.left = (x * 100).toFixed(2) + "%";
    cursor.setAttribute("aria-valuenow", Math.round(x * 100));
    qRAF = requestAnimationFrame(tick);
  };
  qRAF = requestAnimationFrame(tick);
}

function stopQualiLoop() {
  if (qRAF) cancelAnimationFrame(qRAF);
  qRAF = null;
  clearTimeout(qTimer);
}

function recordQualiSector(x) {
  if (!quali || quali.complete || quali.sector >= 3) return;
  const dist = Math.abs(x - 0.5);
  const penalty = clamp((dist - 0.026) * 2.25, 0, 1.2);
  const sectorTime = quali.baseTime / 3 + penalty;
  quali.sectors.push({ x, penalty, time: sectorTime });
  const i = quali.sector;
  const cell = document.getElementById("qSector" + i);
  const val = document.getElementById("qSectorVal" + i);
  if (cell) {
    cell.classList.remove("live");
    if (penalty < 0.12) cell.classList.add("good");
    else if (penalty > 0.5) cell.classList.add("bad");
    if (i < 2) document.getElementById("qSector" + (i + 1))?.classList.add("live");
  }
  if (val) val.textContent = "+" + penalty.toFixed(3);
  const delta = $("#qDelta");
  if (delta) delta.textContent = (penalty < 0.12 ? "CLEAN · " : penalty < 0.5 ? "MISSED APEX · " : "WIDE · ") + "+" + penalty.toFixed(3);

  quali.sector += 1;
  const label = $("#qSectorLabel");
  if (label) label.textContent = Math.min(quali.sector + 1, 3) + " / 3";
  const leds = $$(".q-led");
  leds.forEach((led, n) => led.classList.toggle("on", n <= quali.sector - 1));
  const status = $("#qStatus");
  if (status) status.textContent = quali.sector >= 3 ? "LAP COMPLETE" : "SECTOR " + (quali.sector + 1);
  const hint = $("#qHint");
  if (hint) hint.textContent = quali.sector >= 3 ? "TIMING BEAM CROSSED · CALCULATING GRID" : "TAP WHEN THE MARKER ENTERS THE LIME ZONE";
  const pushBtn = $("#qPushBtn");
  if (quali.sector >= 3) {
    if (pushBtn) { pushBtn.disabled = true; pushBtn.textContent = "LAP COMPLETE"; }
    quali.complete = true;
    stopQualiLoop();
    quali.playerTime = quali.baseTime + quali.sectors.reduce((sum, s) => sum + s.penalty, 0) + rand(-0.03, 0.13);
    qTimer = setTimeout(() => { if (quali && view === "quali") finishQuali(); }, 760);
  } else {
    quali.sectorStart = performance.now();
    if (pushBtn) pushBtn.textContent = "SECTOR " + (quali.sector + 1);
  }
}

function pushQualiSector() {
  if (!quali || quali.complete || view !== "quali") return;
  recordQualiSector(quali.cursor);
}

function autoQuali() {
  if (!quali || quali.complete) return;
  const targets = [rand(0.47, 0.53), rand(0.46, 0.54), rand(0.47, 0.53)];
  for (const t of targets) recordQualiSector(t);
}

function finishQuali() {
  if (!state || !quali) return;
  const team = currentTeam();
  const player = currentRider();
  const playerTime = quali.playerTime || quali.baseTime + 0.5;
  const entries = RIDERS.map((r) => {
    const t = teamById(r.teamId);
    return {
      riderId: r.id,
      teamId: t.id,
      time: r.id === player.id ? playerTime : quali.aiTimes[r.id]
    };
  }).sort((a, b) => a.time - b.time);
  quali.grid = entries.map((e, i) => ({ ...e, position: i + 1 }));
  quali.position = entries.findIndex((e) => e.riderId === player.id) + 1;
  if (quali.position === 1) {
    state.career.poles += 1;
    saveGame();
  }
  setView("grid");
}

/* ------------------------------------------------------------------ */
/* Starting grid                                                       */
/* ------------------------------------------------------------------ */

function gridHTML() {
  if (!quali || !quali.grid) { setTimeout(() => setView("quali"), 0); return "<div class='page'>Loading grid…</div>"; }
  const team = currentTeam();
  const pole = quali.grid[0];
  const playerEntry = quali.grid.find((e) => e.riderId === state.riderId);
  const gap = playerEntry.time - pole.time;
  return `
  <div class="weekend-shell" style="--tc:${team.color};--ta:${team.accent}">
    <header class="weekend-head">
      <button class="icon-btn" data-action="nav" data-view="hub" aria-label="Back to paddock">${icon("back")}</button>
      <div><div class="kicker">ROUND ${state.round + 1} · ${esc(quali.circuit.code)}</div><div style="font-family:var(--display);font-size:9px">QUALIFYING RESULT</div></div>
      <div class="weekend-progress"><span class="wp-step done">BRIEF</span><span class="wp-step active">GRID</span><span class="wp-step">RACE</span></div>
    </header>
    <div class="weekend-body" style="max-width:820px">
      <div class="kicker">THE GRID IS SET</div>
      <h1 class="weekend-title" style="font-size:clamp(16px,3.4vw,26px)">${quali.position === 1 ? "POLE POSITION" : ordinal(quali.position) + " ON THE GRID"}</h1>
      <div class="weekend-sub">${esc(playerEntry.riderId === state.riderId ? currentRider().name : "")} · ${formatLap(playerEntry.time)} ${quali.position === 1 ? "· P1" : "· " + formatGap(gap) + " OFF POLE"}</div>

      <div class="grid-overlay" style="margin-top:18px">
        <div class="grid-overlay-head">
          <h3>STARTING GRID</h3>
          <span class="tag lime">${esc(quali.circuit.name)}</span>
        </div>
        <div class="grid-table-wrap">
          <table class="grid-table">
            <thead><tr><th>POS</th><th>NO</th><th>RIDER</th><th>TEAM</th><th style="text-align:right">TIME</th></tr></thead>
            <tbody>
              ${quali.grid.map((e) => {
                const r = riderById(e.riderId);
                const t = teamById(e.teamId);
                return `<tr class="${e.riderId === state.riderId ? "you" : ""}" style="--tc:${t.color}">
                  <td class="pos">${String(e.position).padStart(2, "0")}</td>
                  <td class="rnum">${r.num}</td>
                  <td><span class="dot"></span>${esc(r.name)}</td>
                  <td class="muted" style="font-size:8px">${esc(t.short)}</td>
                  <td style="text-align:right;font-size:8px">${formatLap(e.time)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
        <div class="grid-overlay-foot">
          <span class="tag">${quali.condition}</span>
          <span class="tag">${RACE_LAPS} LAPS</span>
          <span class="spacer"></span>
          <button class="btn primary" data-action="start-race">${icon("flag")} START RACE</button>
        </div>
      </div>
    </div>
  </div>`;
}
