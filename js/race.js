/* ============================================================
   MOTOGP PIXEL MANAGER — live race engine + pixel circuit
   ============================================================ */

function chooseAiTyre(rider) {
  const r = Math.random();
  if (rider.style === "SMOOTH" || rider.style === "CALCULATED") {
    if (r < 0.5) return "hard";
    if (r < 0.85) return "medium";
    return "soft";
  }
  if (rider.style === "AGGRESSIVE" || rider.style === "EXPLOSIVE" || rider.style === "FEARLESS") {
    if (r < 0.48) return "soft";
    if (r < 0.86) return "medium";
    return "hard";
  }
  if (r < 0.4) return "soft";
  if (r < 0.84) return "medium";
  return "hard";
}

function startRace() {
  if (!state || !quali || !quali.grid) return;
  const circuit = quali.circuit;
  const wet = weekend.condition === "WET";
  const playerRider = currentRider();
  const playerTeam = currentTeam();
  const playerPerf = riderPerf(playerRider, playerTeam, state.upgrades) + upgradeSum() * 0.09;

  const racers = quali.grid.map((entry) => {
    const r = riderById(entry.riderId);
    const t = teamById(entry.teamId);
    const isPlayer = r.id === state.riderId;
    const perf = isPlayer
      ? playerPerf
      : riderPerf(r, t, null, (state.season - 1) * 1.1);
    const tyreId = isPlayer ? weekend.tyre : (wet ? "wet" : chooseAiTyre(r));
    return {
      id: r.id,
      riderId: r.id,
      teamId: t.id,
      name: r.short,
      num: r.num,
      isPlayer,
      color: t.color,
      accent: t.accent,
      gridPos: entry.position,
      progress: -(entry.position - 1) * 0.0034,
      finished: false,
      finishTime: null,
      tyreId,
      tyreLife: 100,
      tyreBaseWear: TYRES[tyreId].wear,
      speedBase: 0.934 + (perf - 80) * 0.0042 + (isPlayer ? upgradeSum() * 0.0008 : 0),
      aiPhase: rand(0, 6.28),
      aiPush: rand(-0.004, 0.011),
      aiMistakeTimer: 0,
      lastLap: 1,
      position: entry.position
    };
  });

  const player = racers.find((r) => r.isPlayer);
  race = {
    circuit,
    condition: weekend.condition,
    wet,
    totalLaps: RACE_LAPS,
    racers,
    player,
    playerPaceIdx: 1,
    state: "countdown",
    countdown: 4.2,
    elapsed: 0,
    timeScale: 1,
    paused: false,
    pitTimer: 0,
    pitUsed: false,
    finishing: 0,
    finishOrder: [],
    startOverlayHide: 0,
    lastPlayerLap: 1,
    warn35: false,
    warn18: false,
    playerPosition: player.gridPos,
    finished: false,
    track: null,
    svg: null
  };
  setView("race");
}

/* ------------------------------------------------------------------ */
/* Race markup                                                         */
/* ------------------------------------------------------------------ */

function raceHTML() {
  if (!race) { setTimeout(() => setView("hub"), 0); return "<div class='page'>Loading race…</div>"; }
  const p = race.player;
  const team = currentTeam();
  return `
  <section class="race-shell" style="--tc:${team.color};--ta:${team.accent}">
    <header class="race-top">
      <button class="icon-btn" data-action="pause-race" aria-label="Pause race"><span style="font-family:var(--display);font-size:8px">II</span></button>
      <div class="race-heading">
        <div class="k">ROUND ${state.round + 1} · ${esc(race.circuit.code)}</div>
        <div class="n">${esc(race.circuit.circuit)}</div>
      </div>
      <div class="race-weather">${race.wet ? "/// WET" : "SUN DRY"} <b>${RACE_LAPS} LAPS</b></div>
      <button class="speed-toggle" id="speedBtn" data-action="race-speed">1X</button>
    </header>

    <div class="race-track-wrap">
      <canvas id="raceCanvas" aria-label="Top-down live race circuit"></canvas>
      <div class="race-vignette"></div>
      <div class="race-hud">
        <div class="race-hud-top">
          <div class="pos-block"><div class="k">POSITION</div><div class="v" id="hudPos">P${p.gridPos}<small>/22</small></div></div>
          <div class="lap-block"><div class="k">LAP</div><div class="v" id="hudLap">1/${RACE_LAPS}</div></div>
          <div class="gap-block"><div class="k">INTERVAL</div><div class="v" id="hudGap">—</div></div>
        </div>
        <div class="race-board" id="raceBoard">
          <div class="race-board-title">LIVE ORDER</div>
        </div>
      </div>

      <div class="start-overlay" id="startOverlay">
        <div class="start-lights" id="startLights">
          <div class="start-lamp"></div><div class="start-lamp"></div><div class="start-lamp"></div><div class="start-lamp"></div><div class="start-lamp"></div>
        </div>
        <div class="start-caption" id="startCaption">HOLD YOUR LINE</div>
      </div>
      <div class="race-banner" id="raceBanner"></div>
      <div class="race-radio" id="raceRadio"></div>
      <div class="pit-overlay" id="pitOverlay">
        <div class="pit-card">
          <div class="big">PIT STOP</div>
          <div class="sm" id="pitCountdown">FRESH TYRES · 3.2</div>
        </div>
      </div>
    </div>

    <div class="race-console">
      <div class="race-metrics">
        <div class="metric-box tyre">
          <div class="k"><span>TYRE · <b id="tyreName">${TYRES[p.tyreId].name}</b></span><b id="tyrePct">100%</b></div>
          <div class="meter"><i id="tyreBar" style="width:100%;background:${TYRES[p.tyreId].color}"></i></div>
        </div>
        <div class="metric-box">
          <div class="k"><span>FUEL</span><b id="fuelPct">100%</b></div>
          <div class="meter cyan"><i id="fuelBar" style="width:100%"></i></div>
        </div>
      </div>
      <div class="pace-row" id="paceRow">
        ${PACES.map((pce, i) => `<button class="pace-btn ${i === 1 ? "selected" : ""}" style="--pc:${pce.color}" data-action="pace" data-index="${i}">${pce.name}<span class="wear">WEAR ${pce.wear.toFixed(1)}x</span></button>`).join("")}
      </div>
      <div class="race-actions">
        <button class="box-btn" id="boxBtn" data-action="box">BOX THIS LAP · FRESH TYRES</button>
        <button class="speed-toggle" id="speedBtn2" data-action="race-speed">1X</button>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------------ */
/* Race loop                                                           */
/* ------------------------------------------------------------------ */

function stopRaceLoop() {
  if (raceRAF) cancelAnimationFrame(raceRAF);
  raceRAF = null;
  if (raceResize) window.removeEventListener("resize", raceResize);
  raceResize = null;
  if (race && race.svg && race.svg.parentNode) race.svg.parentNode.removeChild(race.svg);
  if (race) race.svg = null;
}

function startRaceLoop() {
  stopRaceLoop();
  const canvas = $("#raceCanvas");
  if (!canvas || !race) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  let w = 0, h = 0, dpr = 1;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  raceResize = resize;
  window.addEventListener("resize", resize);
  race.track = buildRaceTrack(race.circuit);
  race.svg = race.track.svg;
  let last = performance.now();
  const loop = (now) => {
    if (!race || view !== "race") { stopRaceLoop(); return; }
    const rawDt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    updateRace(rawDt);
    drawRaceScene(ctx, w, h, now / 1000);
    raceHudAccum += rawDt;
    if (raceHudAccum > 0.08) {
      updateRaceHud();
      raceHudAccum = 0;
    }
    raceRAF = requestAnimationFrame(loop);
  };
  raceRAF = requestAnimationFrame(loop);
}

function updateRace(dt) {
  if (!race || race.finished) return;
  if (race.state === "countdown") {
    race.countdown -= dt;
    updateStartLights();
    if (race.countdown <= 0) {
      race.state = "running";
      race.elapsed = 0;
      race.startOverlayHide = 0.9;
      showRaceBanner("LIGHTS OUT", "RIDE IT HOME", 1200);
      showRadio("Lights out! Manage the opening laps. Keep the tyre under you.");
    }
    return;
  }

  if (race.startOverlayHide > 0) {
    race.startOverlayHide -= dt;
    if (race.startOverlayHide <= 0) $("#startOverlay")?.classList.add("hidden");
  }

  if (race.finishing > 0) {
    race.finishing -= dt;
    if (race.finishing <= 0) finalizeRace();
    return;
  }

  const scaled = dt * race.timeScale;
  race.elapsed += scaled;

  if (race.paused) return;

  if (race.pitTimer > 0) {
    race.pitTimer -= scaled;
    const el = $("#pitCountdown");
    if (el) el.textContent = "FRESH TYRES · " + Math.max(0, race.pitTimer).toFixed(1);
    if (race.pitTimer <= 0) {
      $("#pitOverlay")?.classList.remove("show");
      race.player.tyreId = race.wet ? "wet" : "medium";
      race.player.tyreLife = 100;
      race.player.fuel = 100;
      showRadio("Box complete. Fresh rubber fitted. Go and hunt them down.");
      updateRaceHud();
    }
  }

  const pace = PACES[race.playerPaceIdx];
  for (const r of race.racers) {
    if (r.finished) continue;
    if (r.isPlayer && race.pitTimer > 0) continue;

    let speed;
    if (r.isPlayer) {
      const tyre = TYRES[r.tyreId];
      const setup = SETUPS[weekend.setup] || SETUPS.balanced;
      const wearGrip = 0.958 + (r.tyreLife / 100) * 0.042;
      speed = r.speedBase * pace.speed * tyre.pace * wearGrip * (1 + setup.pace + setup.grip * 0.3);
      let fuel = 100;
      if (typeof r.fuel === "number") fuel = r.fuel;
      speed *= 1 - (100 - fuel) * 0.00012;
      if (r.tyreLife < 14 && pace.id === "attack") speed *= 0.988;
      speed *= 1 + Math.sin(race.elapsed * 2.1 + r.aiPhase) * 0.0007;
    } else {
      const wearGrip = 0.958 + (r.tyreLife / 100) * 0.042;
      let aiPace = 1;
      if (r.tyreLife < 32) aiPace = 0.976;
      else if (r.tyreLife < 52) aiPace = 0.991;
      else if (r.gridPos > 7) aiPace = 1.006 + r.aiPush;
      else aiPace = 0.998 + r.aiPush * 0.5;
      if (race.elapsed > 18 && r.gridPos <= 5) aiPace += 0.005;
      speed = r.speedBase * aiPace * wearGrip;
      speed *= 1 + Math.sin(race.elapsed * 0.72 + r.aiPhase) * 0.0032;
    }

    r.progress += (scaled / RACE_LAP_SECONDS) * speed;

    if (r.isPlayer) {
      const setup = SETUPS[weekend.setup] || SETUPS.balanced;
      const wearRate = TYRES[r.tyreId].wear * pace.wear * race.circuit.abrasion * setup.wear * (race.wet ? 0.55 : 1);
      r.tyreLife = clamp(r.tyreLife - (scaled / RACE_LAP_SECONDS) * wearRate, 0, 100);
      r.fuel = clamp((r.fuel ?? 100) - (scaled / RACE_LAP_SECONDS) * 4.2 * pace.fuel, 0, 100);
      const lapNow = Math.max(1, Math.min(RACE_LAPS, Math.floor(r.progress) + 1));
      if (lapNow > race.lastPlayerLap) {
        race.lastPlayerLap = lapNow;
        if (lapNow === RACE_LAPS - 1) showRadio("FINAL LAP. Everything you have left, right now.", 2800);
        else if (lapNow === 4) showRadio("Halfway. Tyre is talking to you — listen to it.", 2600);
      }
      if (!race.warn35 && r.tyreLife < 35 && r.tyreLife > 18) {
        race.warn35 = true;
        showRadio("Tyre is going away. Ease the pace or box for fresh rubber.", 3000);
      }
      if (!race.warn18 && r.tyreLife < 18) {
        race.warn18 = true;
        showRadio("Tyre is gone! Attack mode is now a gamble.", 3000);
      }
    } else {
      r.tyreLife = clamp(r.tyreLife - (scaled / RACE_LAP_SECONDS) * r.tyreBaseWear * race.circuit.abrasion * (race.wet ? 0.55 : 1), 0, 100);
    }

    if (r.progress >= RACE_LAPS) {
      r.progress = RACE_LAPS;
      r.finished = true;
      r.finishTime = race.elapsed;
      race.finishOrder.push(r.id);
      if (r.isPlayer) {
        const pos = race.finishOrder.length;
        race.playerPosition = pos;
        race.finishing = 1.45;
        const tyre = TYRES[r.tyreId];
        showRaceBanner(ordinal(pos), pos <= 3 ? "PODIUM FINISH · CHEQUERED FLAG" : "CHEQUERED FLAG", 1500);
        showRadio(pos === 1 ? "YES! You've won it. Brilliant ride." : "Chequered flag. P" + pos + " — bring it home to the box.");
        race.playerTyreLabel = tyre.name;
      }
    }
  }
}

function updateStartLights() {
  if (!race) return;
  const lamps = $$("#startLights .start-lamp");
  if (!lamps.length) return;
  let lit = 0;
  const c = race.countdown;
  if (c <= 3.35 && c > 2.55) lit = 1;
  else if (c <= 2.55 && c > 1.75) lit = 2;
  else if (c <= 1.75 && c > 0.95) lit = 3;
  else if (c <= 0.95 && c > 0.12) lit = 4;
  else if (c <= 0.12) lit = 5;
  lamps.forEach((lamp, i) => {
    lamp.classList.toggle("on", i < lit && lit < 5);
    lamp.classList.toggle("go", lit === 5);
  });
  const cap = $("#startCaption");
  if (cap) cap.textContent = lit === 5 ? "GO!" : lit === 0 ? "HOLD YOUR LINE" : lit < 4 ? "GET READY" : "HOLD…";
}

/* ------------------------------------------------------------------ */
/* Race controls                                                       */
/* ------------------------------------------------------------------ */

function setRacePace(index) {
  if (!race || race.finished) return;
  race.playerPaceIdx = clamp(index, 0, 3);
  const pace = PACES[race.playerPaceIdx];
  $$("#paceRow .pace-btn").forEach((btn, i) => btn.classList.toggle("selected", i === race.playerPaceIdx));
  showRadio("Pace mode: " + pace.name + ". " + (pace.id === "attack" ? "Tyre wear is going to hurt." : pace.id === "save" ? "Protect the tyre, make the finish." : pace.id === "push" ? "Time to make a move." : "Steady as she goes."), 2200);
}

function cycleRaceSpeed() {
  if (!race) return;
  race.timeScale = race.timeScale === 1 ? 2 : 1;
  const label = race.timeScale + "X";
  if ($("#speedBtn")) $("#speedBtn").textContent = label;
  if ($("#speedBtn2")) $("#speedBtn2").textContent = label;
}

function requestBox() {
  if (!race || race.pitUsed || race.finished || race.state !== "running") return;
  if (race.pitTimer > 0) return;
  // A real stop costs ~3s of a ~100s lap. Races here are compressed to ~5.75s
  // per lap, so the equivalent stop is a fraction of a second on the clock.
  race.pitTimer = 0.35;
  race.pitUsed = true;
  $("#pitOverlay")?.classList.add("show");
  $("#boxBtn")?.setAttribute("disabled", "disabled");
  if ($("#boxBtn")) $("#boxBtn").textContent = "PIT COMPLETE";
  showRadio("Box, box. Calm and clean. We'll get you fresh rubber.");
}

function toggleRacePause() {
  if (!race || race.finished) return;
  race.paused = !race.paused;
  if (race.paused) showRaceBanner("PAUSED", "TAKE A BREATH", 0);
  else {
    $("#raceBanner")?.classList.remove("show");
    showRaceBanner("BACK TO THE WALL", "", 900);
  }
}

function raceOrder() {
  if (!race) return [];
  return [...race.racers].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });
}

function updateRaceHud() {
  if (!race || view !== "race") return;
  const order = raceOrder();
  const p = race.player;
  const pos = order.findIndex((r) => r.isPlayer) + 1;
  race.playerPosition = pos;
  const lap = p.finished ? RACE_LAPS : clamp(Math.floor(p.progress) + 1, 1, RACE_LAPS);
  const posEl = $("#hudPos");
  if (posEl) posEl.innerHTML = `P${pos}<small>/22</small>`;
  const lapEl = $("#hudLap");
  if (lapEl) lapEl.textContent = p.finished ? "FIN" : lap + "/" + RACE_LAPS;
  const gapEl = $("#hudGap");
  if (gapEl) {
    if (pos === 1) gapEl.textContent = "LEADER";
    else {
      const ahead = order[pos - 2];
      let gap = 0;
      if (p.finished && ahead && ahead.finished) gap = p.finishTime - ahead.finishTime;
      else if (ahead) gap = (ahead.progress - p.progress) * race.circuit.baseLap;
      gapEl.textContent = "+" + Math.abs(gap).toFixed(1);
    }
  }

  const tyrePct = $("#tyrePct");
  const tyreBar = $("#tyreBar");
  const tyreName = $("#tyreName");
  const tyre = TYRES[p.tyreId];
  if (tyrePct) tyrePct.textContent = Math.round(p.tyreLife) + "%";
  if (tyreBar) {
    tyreBar.style.width = Math.round(p.tyreLife) + "%";
    tyreBar.style.background = p.tyreLife < 25 ? "var(--red)" : tyre.color;
  }
  if (tyreName) tyreName.textContent = tyre.name;
  const fuelPct = $("#fuelPct");
  const fuelBar = $("#fuelBar");
  if (fuelPct) fuelPct.textContent = Math.round(p.fuel ?? 100) + "%";
  if (fuelBar) fuelBar.style.width = Math.round(p.fuel ?? 100) + "%";

  const board = $("#raceBoard");
  if (board) {
    const rows = order.slice(0, 4);
    if (!rows.some((r) => r.isPlayer)) {
      const row = order.find((r) => r.isPlayer);
      if (row) rows.push(row);
    }
    const leader = order[0];
    board.innerHTML = `<div class="race-board-title">LIVE ORDER</div>` + rows.map((r) => {
      const rowPos = order.indexOf(r) + 1;
      let gap = "";
      if (rowPos === 1) gap = "LEAD";
      else if (leader) gap = "+" + Math.abs((leader.progress - r.progress) * race.circuit.baseLap).toFixed(1);
      return `<div class="race-board-row ${r.isPlayer ? "you" : ""}"><span class="p">${String(rowPos).padStart(2, "0")}</span><span class="n">${esc(r.name)}</span><span class="g">${gap}</span></div>`;
    }).join("");
  }
  if ($("#boxBtn") && (race.pitUsed || p.finished)) {
    $("#boxBtn").setAttribute("disabled", "disabled");
  }
}

function showRadio(text, duration = 2800) {
  const el = $("#raceRadio");
  if (!el) return;
  el.innerHTML = `<b>BOX:</b> ${esc(text)}`;
  el.classList.add("show");
  clearTimeout(radioTimer);
  radioTimer = setTimeout(() => el.classList.remove("show"), duration);
}

function showRaceBanner(text, sub = "", duration = 1000) {
  const el = $("#raceBanner");
  if (!el) return;
  el.innerHTML = `${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ""}`;
  el.classList.add("show");
  clearTimeout(bannerTimer);
  if (duration > 0) bannerTimer = setTimeout(() => el.classList.remove("show"), duration);
}

/* ------------------------------------------------------------------ */
/* Final classification                                                */
/* ------------------------------------------------------------------ */

function finalizeRace() {
  if (!race || race.finished) return;
  race.finished = true;
  const order = raceOrder();
  const p = race.player;
  const playerPosition = order.findIndex((r) => r.isPlayer) + 1;
  const pointsTable = POINTS;
  const basePrize = [0, 1800, 1500, 1300, 1100, 1000, 900, 800, 750, 700, 650, 600, 550, 500, 450, 400];
  const prize = basePrize[playerPosition] || 300;
  const bonus = playerPosition === 1 ? 500 : playerPosition <= 3 ? 300 : playerPosition <= 5 ? 150 : 0;

  const rows = order.map((r, i) => {
    const pts = i < pointsTable.length ? pointsTable[i] : 0;
    if (pts > 0) {
      state.standings.riders[r.riderId] = (state.standings.riders[r.riderId] || 0) + pts;
      state.standings.teams[r.teamId] = (state.standings.teams[r.teamId] || 0) + pts;
    }
    return { position: i + 1, riderId: r.riderId, teamId: r.teamId, points: pts, finished: r.finished };
  });

  state.credits += prize + bonus;
  state.career.races += 1;
  if (playerPosition === 1) state.career.wins += 1;
  if (playerPosition <= 3) state.career.podiums += 1;

  const winner = order[0];
  const pace = PACES[race.playerPaceIdx];
  const tyre = TYRES[p.tyreId];
  const roundNo = state.round + 1;
  const posLabel = ordinal(playerPosition);
  let story;
  if (playerPosition === 1) {
    story = `A controlled masterpiece from the box wall. ${p.name} read the race, protected the ${tyre.name.toLowerCase()} when it mattered and took the win.`;
  } else if (playerPosition <= 3) {
    story = `A podium is a statement. The ${tyre.name.toLowerCase()} tyre held on just long enough, and the late pace call pulled ${p.name} through the field.`;
  } else if (playerPosition <= 8) {
    story = `Solid points, but the box wall will want more. The ${tyre.name.toLowerCase()} choice cost time late in the race. There is pace in this package.`;
  } else {
    story = `A tough afternoon. ${p.name} fought the bike and the tyre, but the gap to the front was already there. The data will make the next round better.`;
  }
  if (race.pitUsed) story += " The mid-race stop gave fresh rubber but surrendered track position.";

  const result = {
    round: roundNo,
    circuitCode: race.circuit.code,
    circuitName: race.circuit.name,
    condition: race.wet ? "WET" : "DRY",
    position: playerPosition,
    points: playerPosition <= pointsTable.length ? pointsTable[playerPosition - 1] : 0,
    prize,
    bonus,
    results: rows,
    winner: winner.riderId,
    winnerTeam: winner.teamId,
    story,
    paceLabel: pace.name,
    tyreLabel: tyre.name,
    pole: quali && quali.position === 1,
    champPosition: playerChampPosition()
  };

  state.lastResult = result;
  state.round += 1;
  state.history.push({ round: roundNo, winner: winner.riderId, playerPosition });
  if (state.history.length > 40) state.history = state.history.slice(-40);
  saveGame();
  setView("results");
  race = null;
}

/* ------------------------------------------------------------------ */
/* Track builder and renderer                                          */
/* ------------------------------------------------------------------ */

function buildRaceTrack(circuit) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", circuit.path);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const total = path.getTotalLength();
  const bbox = path.getBBox();
  const samples = [];
  const N = 320;
  for (let i = 0; i < N; i++) {
    const p = path.getPointAtLength((i / N) * total);
    samples.push({ x: p.x, y: p.y });
  }
  return { path, svg, total, bbox, samples, circuit };
}

function raceMap(track, w, h) {
  const bbox = track.bbox;
  const pad = clamp(Math.min(w, h) * 0.06, 20, 40);
  let sx = (w - pad * 2) / Math.max(1, bbox.width);
  let sy = (h - pad * 2) / Math.max(1, bbox.height);
  const ratio = sx / sy;
  if (ratio > 1.45) sx = sy * 1.45;
  else if (ratio < 0.7) sy = sx / 0.7;
  const tw = bbox.width * sx;
  const th = bbox.height * sy;
  return {
    sx, sy,
    ox: (w - tw) / 2 - bbox.x * sx,
    oy: (h - th) / 2 - bbox.y * sy,
    mapX: (x) => (w - tw) / 2 + (x - bbox.x) * sx,
    mapY: (y) => (h - th) / 2 + (y - bbox.y) * sy
  };
}

function drawRaceScene(ctx, w, h, time) {
  if (!race || !race.track) return;
  const track = race.track;
  const map = raceMap(track, w, h);
  const mapX = (x) => (w - (track.bbox.width * map.sx)) / 2 + (x - track.bbox.x) * map.sx;
  const mapY = (y) => (h - (track.bbox.height * map.sy)) / 2 + (y - track.bbox.y) * map.sy;

  // surroundings
  const base = race.wet ? "#111a20" : race.circuit.night ? "#0a1414" : "#122018";
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const bg = ctx.createRadialGradient(w * 0.48, h * 0.42, 20, w * 0.48, h * 0.42, Math.max(w, h) * 0.65);
  bg.addColorStop(0, race.wet ? "rgba(58,86,105,.34)" : race.circuit.night ? "rgba(22,59,72,.35)" : "rgba(38,78,44,.3)");
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // mown grass blocks / grit
  ctx.globalAlpha = 0.34;
  const step = 17;
  for (let y = 0; y < h; y += step) {
    for (let x = (Math.floor(y / step) % 2) * step; x < w; x += step * 2) {
      ctx.fillStyle = race.wet ? "#18262d" : race.circuit.night ? "#102020" : "#1a2c1f";
      ctx.fillRect(x, y, step, step);
    }
  }
  ctx.globalAlpha = 1;

  // run-off + track
  const pts = track.samples.map((p) => ({ x: mapX(p.x), y: mapY(p.y) }));
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
  };
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const baseW = clamp(Math.min(w, h) * 0.13, 38, 78);
  trace(); ctx.strokeStyle = "rgba(5,6,10,.9)"; ctx.lineWidth = baseW * 1.12; ctx.stroke();
  trace(); ctx.strokeStyle = "#202536"; ctx.lineWidth = baseW; ctx.stroke();
  trace(); ctx.strokeStyle = "#d84646"; ctx.lineWidth = baseW * 0.82; ctx.stroke();
  ctx.save();
  ctx.lineCap = "butt";
  trace(); ctx.strokeStyle = "#f2f0e4"; ctx.lineWidth = baseW * 0.82; ctx.setLineDash([9, 9]); ctx.stroke();
  ctx.restore();
  trace(); ctx.strokeStyle = race.wet ? "#343b4c" : "#3b3f52"; ctx.lineWidth = baseW * 0.5; ctx.stroke();
  trace(); ctx.strokeStyle = "rgba(255,255,255,.11)"; ctx.lineWidth = 1; ctx.setLineDash([2, 9]); ctx.stroke(); ctx.setLineDash([]);

  // trackside sponsor boards
  const boardFractions = [0.075, 0.2, 0.34, 0.48, 0.63, 0.79, 0.91];
  const boardColors = ["#d8ff3e", "#ff5349", "#47e5ff", "#ffd23f", "#a887ff", "#58d68d", "#f4f3e9"];
  boardFractions.forEach((f, i) => {
    const bp = track.path.getPointAtLength(f * track.total);
    const bp2 = track.path.getPointAtLength(((f + 0.003) % 1) * track.total);
    const bx = mapX(bp.x), by = mapY(bp.y);
    const bx2 = mapX(bp2.x), by2 = mapY(bp2.y);
    const bang = Math.atan2(by2 - by, bx2 - bx);
    const nx = Math.cos(bang + Math.PI / 2);
    const ny = Math.sin(bang + Math.PI / 2);
    const off = baseW * 0.85 + 12;
    ctx.save();
    ctx.translate(bx + nx * off, by + ny * off);
    ctx.rotate(bang);
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.fillRect(-12, -2, 24, 7);
    ctx.fillStyle = boardColors[i % boardColors.length];
    ctx.fillRect(-12, -3, 24, 5);
    ctx.fillStyle = "rgba(8,9,15,.55)";
    ctx.fillRect(-8, -1.5, 12, 2);
    ctx.restore();
  });

  // start / finish strip
  const p0 = track.path.getPointAtLength(0);
  const p1 = track.path.getPointAtLength(Math.min(2, track.total * 0.01));
  const x0 = mapX(p0.x), y0 = mapY(p0.y);
  const x1 = mapX(p1.x), y1 = mapY(p1.y);
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const trackW = baseW * 0.49;
  ctx.save();
  ctx.translate(x0, y0);
  ctx.rotate(angle);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#f4f3e9" : "#0b0c12";
      ctx.fillRect(-2 + row * 2, -trackW / 2 + col * (trackW / 8), 2, trackW / 8);
    }
  }
  ctx.restore();

  // pit wall blocks near start
  ctx.save();
  ctx.translate(x0, y0);
  ctx.rotate(angle);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#202633" : "#171b26";
    ctx.fillRect(-15 - i * 7, -trackW / 2 - 13, 5, 6);
  }
  ctx.restore();

  // floodlight pools at night
  if (race.circuit.night) {
    const spots = [[0.18, 0.2], [0.78, 0.2], [0.18, 0.8], [0.78, 0.8]];
    for (const [sx, sy] of spots) {
      const g = ctx.createRadialGradient(w * sx, h * sy, 5, w * sx, h * sy, Math.min(w, h) * 0.45);
      g.addColorStop(0, "rgba(255,239,183,.15)");
      g.addColorStop(1, "rgba(255,239,183,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // riders: draw non-player then player
  const sorted = [...race.racers].sort((a, b) => (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0));
  for (const r of sorted) {
    const frac = ((r.progress % 1) + 1) % 1;
    const p = track.path.getPointAtLength(frac * track.total);
    const p2 = track.path.getPointAtLength(((frac + 0.004) % 1) * track.total);
    const x = mapX(p.x), y = mapY(p.y);
    const xa = mapX(p2.x), ya = mapY(p2.y);
    const ang = Math.atan2(ya - y, xa - x);
    const laneOffset = r.isPlayer ? 0 : ((r.num % 5) - 2) * 1.35;
    const rx = x + Math.cos(ang + Math.PI / 2) * laneOffset;
    const ry = y + Math.sin(ang + Math.PI / 2) * laneOffset;
    drawRacerSprite(ctx, rx, ry, ang, r, time, w);
  }

  // rain
  if (race.wet) {
    ctx.save();
    ctx.strokeStyle = "rgba(170,210,230,.32)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 54; i++) {
      const x = ((i * 127 + time * 120) % (w + 40)) - 20;
      const y = ((i * 73 + time * 250) % (h + 60)) - 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + 13);
      ctx.stroke();
    }
    ctx.restore();
  }

  // tiny track label
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.fillStyle = "rgba(255,255,255,.26)";
  ctx.textAlign = "left";
  ctx.fillText(race.circuit.code, 8, h - 8);
  ctx.textAlign = "right";
  ctx.fillText(race.wet ? "WET" : "DRY", w - 8, h - 8);
  ctx.textAlign = "left";
}

function drawRacerSprite(ctx, x, y, angle, r, time, w) {
  const size = w < 520 ? 0.82 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath(); ctx.ellipse(0, 1.5, 6.5, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  if (r.isPlayer) {
    const pulse = 0.5 + Math.sin(time * 5.4) * 0.18;
    ctx.strokeStyle = `rgba(216,255,62,${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#d8ff3e";
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(3, -9); ctx.lineTo(-3, -9); ctx.closePath(); ctx.fill();
  }
  // wheels
  ctx.fillStyle = "#07080c";
  ctx.fillRect(-5.4, -1.9, 3.1, 3.8);
  ctx.fillRect(3.2, -1.7, 3.0, 3.4);
  // body
  ctx.fillStyle = r.color;
  ctx.beginPath();
  ctx.moveTo(-2.4, -2.2); ctx.lineTo(2.5, -1.7); ctx.lineTo(4.0, 0); ctx.lineTo(2.5, 1.7); ctx.lineTo(-2.4, 2.2);
  ctx.closePath(); ctx.fill();
  // stripe
  ctx.fillStyle = r.accent;
  ctx.fillRect(-2.8, -0.45, 5.5, 0.9);
  // rider
  ctx.fillStyle = "#12141d";
  ctx.fillRect(-0.8, -1.5, 3.0, 3.0);
  ctx.fillStyle = "#f4f3e9";
  ctx.fillRect(0.1, -1.0, 1.5, 2.0);
  if (r.finished) ctx.globalAlpha = 0.55;
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Boot (after all screens and race functions exist)                   */
/* ------------------------------------------------------------------ */

state = loadGame();
setView("title");
