/* ============================================================
   MOTOGP PIXEL MANAGER — career screens
   ============================================================ */

let standingsTab = "riders";

/* ------------------------------------------------------------------ */
/* Team / rider selection                                              */
/* ------------------------------------------------------------------ */

function selectHTML() {
  return `
  <section class="select-screen">
    <div class="select-head">
      <div class="select-nav">
        <button class="icon-btn" data-action="to-title" aria-label="Back to title">${icon("back")}</button>
        <span class="tag">NEW CAREER</span>
        <span class="spacer"></span>
        <span class="tag lime">22 RIDERS</span>
        <span class="tag">11 TEAMS</span>
      </div>
      <div class="select-title-wrap">
        <div class="kicker">PICK YOUR GARAGE</div>
        <h2 class="select-title">WHO ARE <span>YOU</span>?</h2>
        <p class="select-lead">Sign for one of the eleven teams and choose your rider. You will run their race weekends: tyre choice, setup, qualifying and the box wall. The bike can be developed as the season unfolds.</p>
      </div>
    </div>
    <div class="team-grid">
      ${TEAMS.map((team) => teamCard(team)).join("")}
    </div>
  </section>`;
}

function teamCard(team) {
  const riders = RIDERS.filter((r) => r.teamId === team.id);
  const overall = teamOverall(team);
  return `
  <article class="team-card" style="--tc:${team.color};--ta:${team.accent}">
    <div class="team-head">
      <div class="team-logo-row">
        <span class="team-swatch"></span>
        <div style="min-width:0;flex:1">
          <div class="team-name">${esc(team.short)}</div>
          <div class="team-bike">${esc(team.model)}</div>
          <div class="team-meta">
            <span class="tag">PWR ${Math.round(team.power)}</span>
            <span class="tag">HND ${Math.round(team.handling)}</span>
          </div>
        </div>
        <div class="team-rating"><b>${overall}</b><span>TEAM OVR</span></div>
      </div>
    </div>
    ${riders.map((r) => `
      <button class="rider-pick" style="--tc:${team.color};--ta:${team.accent}" data-action="pick-team" data-team="${team.id}" aria-label="Sign ${esc(r.name)}">
        <span class="rider-helmet">${helmetSVG(team.color, team.accent)}<span class="rider-num">${r.num}</span></span>
        <span class="rider-info">
          <span class="rider-name">${esc(r.name)}</span>
          <span class="rider-meta">${esc(r.country)} · ${esc(r.style)}</span>
        </span>
        <span class="rider-ovr">${riderOverall(r, team)}</span>
        <span class="rider-arrow">›</span>
      </button>`).join("")}
  </article>`;
}

/* ------------------------------------------------------------------ */
/* Paddock hub                                                         */
/* ------------------------------------------------------------------ */

function beginWeekend() {
  if (!state) return;
  const circuit = currentCircuit();
  const condition = conditionFor(circuit);
  weekend = {
    round: state.round,
    circuit,
    condition,
    tyre: condition === "WET" ? "wet" : "medium",
    setup: "balanced"
  };
  setView("briefing");
}

function teamMapColor(team) {
  const hex = team.color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
  return lum < 0.27 ? team.accent : team.color;
}

function hubHTML() {
  const team = currentTeam();
  const rider = currentRider();
  const circuit = currentCircuit();
  const roundNo = Math.min(state.round + 1, TOTAL_ROUNDS);
  const rank = playerChampPosition();
  const titleContender = rank <= 3;
  const mini = championshipRiders();
  const playerEntry = mini.find((e) => e.rider.id === state.riderId);
  const topRows = mini.slice(0, 5);
  if (playerEntry && !topRows.some((e) => e.rider.id === state.riderId)) topRows.push(playerEntry);
  const last = state.lastResult;
  const newsIndex = (state.round + state.season) % NEWS.length;
  const nextRaceLabel = state.round >= TOTAL_ROUNDS ? "SEASON COMPLETE" : circuit.name;
  const rainChance = Math.round(circuit.rain * 100);

  return `
  <div class="page" style="--tc:${team.color};--ta:${team.accent}">
    <div class="hub-topline">
      <span class="team-strip" style="--tc:${team.color}"><span class="sq"></span>${esc(team.short)} · ${esc(rider.short)} #${rider.num}</span>
      <span class="tag ${titleContender ? "lime" : ""}">CHAMPIONSHIP ${ordinal(rank)}</span>
      <span class="tag">${state.season > 1 ? "SEASON " + state.season : "ROOKIE SEASON"}</span>
      <span class="spacer"></span>
      <span class="tag">FORM ${rider.consistency >= 85 ? "STEADY" : "WILD"}</span>
    </div>

    <div class="hub-grid">
      <section class="panel race-hero span-8" aria-label="Next race">
        <div class="race-hero-copy">
          <div class="round-kicker">ROUND ${roundNo} <b>/ ${TOTAL_ROUNDS}</b></div>
          <h2 class="race-name">${esc(nextRaceLabel)}</h2>
          <div class="circuit-name">${esc(circuit.circuit)} · ${esc(circuit.country)}</div>
          <div class="race-facts">
            <span class="race-fact"><b>${esc(circuit.length)}</b> LENGTH</span>
            <span class="race-fact"><b>${circuit.turns}</b> TURNS</span>
            <span class="race-fact"><b>${RACE_LAPS}</b> LAPS</span>
            <span class="race-fact"><b>${rainChance}%</b> RAIN</span>
            <span class="race-fact"><b>${circuit.abrasion >= 0.95 ? "HIGH" : "MED"}</b> WEAR</span>
          </div>
          <div class="race-hero-actions">
            <button class="btn primary" data-action="nav" data-view="briefing">${icon("flag")} ENTER RACE WEEKEND</button>
            <button class="btn" data-action="nav" data-view="standings">${icon("trophy")} STANDINGS</button>
          </div>
        </div>
        <div class="race-map-mini">
          ${trackSVG(circuit, teamMapColor(team))}
          <span class="map-caption">${esc(circuit.code)} · ${esc(circuit.circuit)}</span>
        </div>
      </section>

      <section class="panel paddock-card span-4">
        <div class="panel-title"><span class="dot"></span> YOUR RIDER</div>
        <div class="rider-hero">
          <div class="rider-big-helmet" style="--tc:${team.color}">${helmetSVG(team.color, team.accent)}</div>
          <div style="min-width:0">
            <div class="rider-big-name">${esc(rider.name)}</div>
            <div class="rider-big-team">${esc(team.short)} · #${rider.num} · ${esc(rider.country)}</div>
          </div>
          <div class="ovr-badge"><b>${riderOverall(rider, team)}</b><span>OVR</span></div>
        </div>
        <div class="attr-list">
          ${attrRow("PACE", rider.pace)}
          ${attrRow("RACECRAFT", rider.racecraft)}
          ${attrRow("BRAKING", rider.braking)}
          ${attrRow("CONSISTENCY", rider.consistency)}
        </div>
        <div class="divider"></div>
        <div class="row wrap">
          <span class="tag">${esc(rider.style)}</span>
          <span class="tag">WET ${rider.wet}</span>
          <span class="tag">${state.season > 1 ? "S" + state.season : "ROOKIE"}</span>
        </div>
      </section>

      <section class="panel pad span-5">
        <div class="panel-head">
          <div class="panel-title"><span class="dot"></span> CHAMPIONSHIP</div>
          <span class="spacer"></span>
          <span class="tag">AFTER R${state.round}</span>
        </div>
        <div class="mini-table">
          ${topRows.map((entry, i) => `
            <div class="mini-row ${entry.rider.id === state.riderId ? "you" : ""}" style="--tc:${entry.team.color}">
              <span class="mini-pos">${String(mini.indexOf(entry) + 1).padStart(2, "0")}</span>
              <span class="mini-name"><i></i>${esc(entry.rider.short)}</span>
              <span class="mini-pts">${entry.points}</span>
            </div>`).join("")}
        </div>
        <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
          <span class="tag ${titleContender ? "lime" : ""}">${ordinal(rank)} IN TITLE FIGHT</span>
          <span class="tag">${playerEntry ? playerEntry.points : 0} PTS</span>
        </div>
      </section>

      <section class="panel pad span-7">
        <div class="panel-head">
          <div class="panel-title"><span class="dot"></span> PADDOCK WIRE</div>
          <span class="spacer"></span>
          <span class="tag">LIVE FEED</span>
        </div>
        <div class="news-feed">
          <div class="news-item"><div>${esc(NEWS[newsIndex])}<small>PADDOCK INSIDER · ROUND ${roundNo}</small></div></div>
          <div class="news-item"><div>${esc(circuit.note)}<small>TRACK NOTES · ${esc(circuit.country)}</small></div></div>
          <div class="news-item"><div>${last ? `${esc(riderById(last.winner).short)} won last time out. The garage has been rebuilt around that data.` : `Your first weekend starts now. The team expects clean decisions, not heroics.`}<small>${last ? "LAST RACE REPORT" : "TEAM BRIEFING"}</small></div></div>
        </div>
        <div class="money-strip">
          <div class="money-cell"><span class="k">BANK</span><span class="v lime">${formatNum(state.credits)} CR</span></div>
          <div class="money-cell"><span class="k">TEAM MATE</span><span class="v">${esc(teammate().short)}</span></div>
          <div class="money-cell"><span class="k">BIKE LEVEL</span><span class="v">${upgradeSum()}/16</span></div>
        </div>
      </section>

      <section class="panel pad span-12">
        <div class="panel-head">
          <div class="panel-title"><span class="dot"></span> 2025 FAN CALENDAR</div>
          <span class="spacer"></span>
          <span class="tag">${TOTAL_ROUNDS} ROUNDS</span>
        </div>
        <div class="calendar-strip">
          ${CIRCUITS.map((c, i) => `<div class="cal-chip ${i < state.round ? "done" : ""} ${i === state.round ? "next" : ""}">
            <div class="r">R${String(i + 1).padStart(2, "0")}</div>
            <div class="c">${esc(c.code)}</div>
            <div class="w">${esc(c.length)}</div>
          </div>`).join("")}
        </div>
      </section>
    </div>
  </div>`;
}

function attrRow(label, value) {
  return `<div class="attr-row"><span>${label}</span><span class="meter small"><i style="width:${clamp(value, 0, 99)}%"></i></span><b>${value}</b></div>`;
}

/* ------------------------------------------------------------------ */
/* Weekend briefing                                                    */
/* ------------------------------------------------------------------ */

function briefingHTML() {
  if (!weekend) { setTimeout(beginWeekend, 0); return "<div class='page'>Loading weekend…</div>"; }
  const team = currentTeam();
  const rider = currentRider();
  const c = weekend.circuit;
  const wet = weekend.condition === "WET";
  const options = wet ? [TYRES.wet] : [TYRES.soft, TYRES.medium, TYRES.hard];
  const tyre = TYRES[weekend.tyre] || options[0];
  const setup = SETUPS[weekend.setup] || SETUPS.balanced;
  const roundNo = state.round + 1;
  const dryWear = TYRES[weekend.tyre] || TYRES.medium;

  return `
  <div class="weekend-shell" style="--tc:${team.color};--ta:${team.accent}">
    <header class="weekend-head">
      <button class="icon-btn" data-action="nav" data-view="hub" aria-label="Back to paddock">${icon("back")}</button>
      <div>
        <div class="kicker">ROUND ${roundNo} · ${esc(c.code)}</div>
        <div style="font-family:var(--display);font-size:9px;line-height:1.5">RACE BRIEFING</div>
      </div>
      <div class="weekend-progress">
        <span class="wp-step active">BRIEF</span>
        <span class="wp-step">QUALI</span>
        <span class="wp-step">RACE</span>
      </div>
    </header>

    <div class="weekend-body">
      <div class="kicker">${wet ? "WET RACE DECLARED" : "DRY RACE DECLARED"} · ${wet ? "FIND THE LIMIT" : "MANAGE THE TYRE"}</div>
      <h1 class="weekend-title">${esc(c.name)}</h1>
      <div class="weekend-sub">${esc(c.circuit)} · ${esc(c.country)} · ${esc(c.length)} · ${c.turns} TURNS · ${RACE_LAPS} LAPS</div>

      <div class="panel weather-panel">
        <div class="weather-icon">${wet ? "///" : "SUN"}</div>
        <div class="weather-main">
          <b>${wet ? "WET · " : "DRY · "}${wet ? "18°C" : "27°C"}</b>
          <span>Track ${wet ? "COLD / SLICK" : "HOT / ABRASIVE"} · ${Math.round(c.rain * 100)}% rain risk</span>
        </div>
        <div class="weather-note">${esc(c.note)}<br>${wet ? "The race will be declared wet. Wet tyres only, lower grip, less wear." : "Set the bike up for the long game. Rear tyre life is your biggest weapon."}</div>
      </div>

      <div class="option-section">
        <div class="section-label"><span class="num">01</span> STARTING TYRE ${wet ? "· WET DECLARED" : ""}</div>
        <div class="tyre-grid">
          ${options.map((t) => {
            const pace = ((t.pace - 1) * 100);
            return `<button class="tyre-card ${weekend.tyre === t.id ? "selected" : ""}" data-action="select-tyre" data-id="${t.id}">
              <span class="tyre-dot" style="background:${t.color}"></span>
              <span class="tname">${t.name}</span>
              <span class="tdesc">${t.desc}</span>
              <span class="tyre-stats"><span>PACE <b>${pace >= 0 ? "+" : ""}${pace.toFixed(1)}%</b></span><span>WEAR <b>${t.wear.toFixed(1)}</b></span></span>
            </button>`;
          }).join("")}
        </div>
      </div>

      <div class="option-section">
        <div class="section-label"><span class="num">02</span> BIKE SETUP</div>
        <div class="setup-grid">
          ${Object.values(SETUPS).map((s) => `<button class="setup-card ${weekend.setup === s.id ? "selected" : ""}" data-action="select-setup" data-id="${s.id}">
            <span class="setup-glyph">${s.icon}</span>
            <span class="sname">${s.name}</span>
            <span class="snote">${s.note}</span>
          </button>`).join("")}
        </div>
      </div>

      <div class="panel brief-summary">
        <div>
          <div class="panel-title" style="margin-bottom:9px"><span class="dot"></span> YOUR CALL</div>
          <div class="summary-line">
            <span class="tag lime">${tyre.name} TYRE</span>
            <span class="tag">${setup.name} SETUP</span>
            <span class="tag">${wet ? "WET RACE" : "DRY RACE"}</span>
            <span class="tag">${esc(rider.short)} #${rider.num}</span>
          </div>
          <p class="weekend-sub" style="margin-top:8px">Projected tyre life: ${estimateTyreLife(dryWear, c, setup, wet)} laps · ${team.power > 93 ? "strong top speed" : "corner-speed package"}.</p>
        </div>
        <button class="btn primary big" data-action="go-quali">${icon("play")} TO QUALIFYING</button>
      </div>
    </div>

    <div class="weekend-foot">
      <div class="inner">
        <span class="hint">NEXT: 3-TAP FLYING LAP · SET THE GRID</span>
        <span class="spacer"></span>
        <button class="btn" data-action="go-quali">CONTINUE TO QUALI ›</button>
      </div>
    </div>
  </div>`;
}

function estimateTyreLife(tyre, circuit, setup, wet) {
  const laps = 100 / (tyre.wear * circuit.abrasion * setup.wear * (wet ? 0.55 : 1) * 1.15);
  return Math.max(3, Math.round(laps));
}

/* ------------------------------------------------------------------ */
/* Standings                                                           */
/* ------------------------------------------------------------------ */

function standingsHTML() {
  const team = currentTeam();
  const riders = championshipRiders();
  const teams = championshipTeams();
  const leaderPts = riders[0]?.points || 0;
  const roundNo = state.round;
  return `
  <div class="page" style="--tc:${team.color};--ta:${team.accent}">
    <div class="page-head">
      <div>
        <div class="kicker">2025 FAN CHAMPIONSHIP · SEASON ${state.season}</div>
        <h1 class="page-title">THE TITLE FIGHT</h1>
        <div class="page-sub">${roundNo === 0 ? "Lights out. Nothing settled." : "After round " + roundNo + " of " + TOTAL_ROUNDS + " · " + (TOTAL_ROUNDS - roundNo) + " races remain"}</div>
      </div>
      <span class="spacer"></span>
      <div class="tabs">
        <button class="tab ${standingsTab === "riders" ? "active" : ""}" data-action="standings-tab" data-tab="riders">RIDERS</button>
        <button class="tab ${standingsTab === "teams" ? "active" : ""}" data-action="standings-tab" data-tab="teams">TEAMS</button>
      </div>
    </div>

    <section class="panel table-panel">
      ${standingsTab === "riders" ? `
        <table class="champ-table">
          <thead><tr><th>POS</th><th>RIDER</th><th>TEAM</th><th>PTS</th><th class="bar"></th></tr></thead>
          <tbody>
          ${riders.map((entry, i) => {
            const you = entry.rider.id === state.riderId;
            const width = leaderPts ? (entry.points / leaderPts) * 100 : 0;
            return `<tr class="${you ? "you" : ""}" style="--tc:${entry.team.color}">
              <td class="pos">${String(i + 1).padStart(2, "0")}</td>
              <td><span class="dot" style="--tc:${entry.team.color}"></span>${esc(entry.rider.name)} <span class="muted" style="font-size:7px">#${entry.rider.num}</span></td>
              <td class="team-cell">${esc(entry.team.short)}</td>
              <td class="pts">${entry.points}</td>
              <td class="bar"><span class="pts-bar"><i style="width:${width}%"></i></span></td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>` : `
        <table class="champ-table">
          <thead><tr><th>POS</th><th>TEAM</th><th>BIKE</th><th>PTS</th><th class="bar"></th></tr></thead>
          <tbody>
          ${teams.map((entry, i) => {
            const you = entry.team.id === state.teamId;
            const max = teams[0]?.points || 1;
            return `<tr class="${you ? "you" : ""}" style="--tc:${entry.team.color}">
              <td class="pos">${String(i + 1).padStart(2, "0")}</td>
              <td><span class="dot" style="--tc:${entry.team.color}"></span>${esc(entry.team.name)}</td>
              <td class="team-cell">${esc(entry.team.model)}</td>
              <td class="pts">${entry.points}</td>
              <td class="bar"><span class="pts-bar"><i style="width:${max ? (entry.points / max) * 100 : 0}%"></i></span></td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>`}
    </section>
    <div class="legend-row">
      <span><b>POINTS</b> 25 · 20 · 16 · 13 · 11 · 10 · 9 · 8 · 7 · 6 · 5 · 4 · 3 · 2 · 1</span>
      <span><b>22 RIDERS</b> full grid · 11 teams</span>
      <span><b>YOUR SEASON</b> ${state.career.wins} wins · ${state.career.podiums} podiums</span>
    </div>

    <div class="page-head" style="margin-top:26px;margin-bottom:12px">
      <div><div class="kicker">CALENDAR</div><h2 class="page-title" style="font-size:clamp(14px,2.4vw,20px)">14 ROUNDS</h2></div>
    </div>
    <div class="calendar-grid">
      ${CIRCUITS.map((c, i) => `<div class="calendar-card ${i < state.round ? "done" : ""} ${i === state.round ? "next" : ""}">
        <div class="r">ROUND ${String(i + 1).padStart(2, "0")}</div>
        <div class="n">${esc(c.name.replace(" GRAND PRIX", ""))}<br><span class="muted">${esc(c.code)}</span></div>
        <div class="s">${i < state.round ? "COMPLETE" : i === state.round ? "NEXT" : esc(c.length)}</div>
      </div>`).join("")}
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Garage / development                                                */
/* ------------------------------------------------------------------ */

const UPGRADE_INFO = {
  engine: { name: "ENGINE", icon: "E", desc: "More peak power and stronger drive off the corners.", effect: "Top speed" },
  aero: { name: "AERO", icon: "A", desc: "Efficient wings. More speed with less drag.", effect: "Speed + balance" },
  chassis: { name: "CHASSIS", icon: "C", desc: "Sharper direction change and better braking stability.", effect: "Handling + brakes" },
  electronics: { name: "ELECTRONICS", icon: "X", desc: "Traction control and anti-wheelie finesse.", effect: "Consistency + reliability" }
};

function garageHTML() {
  const team = currentTeam();
  const rider = currentRider();
  const bike = bikeStats(team, state.upgrades);
  const mate = teammate();
  return `
  <div class="page" style="--tc:${team.color};--ta:${team.accent}">
    <div class="page-head">
      <div>
        <div class="kicker">${esc(team.short)} · SEASON ${state.season}</div>
        <h1 class="page-title">THE GARAGE</h1>
        <div class="page-sub">Every credit makes the motorcycle faster. Every upgrade is permanent.</div>
      </div>
      <span class="spacer"></span>
      <span class="tag lime">${formatNum(state.credits)} CR AVAILABLE</span>
    </div>

    <div class="garage-grid">
      <section class="panel bike-card">
        <div class="panel-title"><span class="dot"></span> RACE MACHINE</div>
        <div class="bike-visual">${bikeSVG(team, rider.num)}</div>
        <div class="bike-model">${esc(team.model)}</div>
        <div class="bike-team">${esc(team.name)} · #${rider.num} ${esc(rider.short)}</div>
        <div class="bike-stats">
          ${bikeStatRow("POWER", bike.power)}
          ${bikeStatRow("HANDLING", bike.handling)}
          ${bikeStatRow("BRAKING", bike.braking)}
          ${bikeStatRow("RELIABILITY", bike.reliability)}
        </div>
        <div class="divider"></div>
        <div class="row wrap">
          <span class="tag">OVR ${riderOverall(rider, team)}</span>
          <span class="tag">UPGRADES ${upgradeSum()}/16</span>
          <span class="tag">${esc(rider.style)}</span>
        </div>
        <div class="career-stats">
          <div class="career-stat"><b>${state.career.races}</b><span>RACES</span></div>
          <div class="career-stat"><b>${state.career.wins}</b><span>WINS</span></div>
          <div class="career-stat"><b>${state.career.podiums}</b><span>PODIUMS</span></div>
          <div class="career-stat"><b>${state.career.titles}</b><span>TITLES</span></div>
        </div>
      </section>

      <section class="panel pad">
        <div class="panel-head">
          <div class="panel-title"><span class="dot"></span> DEVELOPMENT</div>
          <span class="spacer"></span>
          <span class="tag">R&D CREDITS</span>
        </div>
        <div class="upgrade-grid">
          ${Object.entries(UPGRADE_INFO).map(([key, info]) => {
            const level = state.upgrades[key];
            const maxed = level >= 5;
            const cost = upgradeCost(level);
            const canAfford = state.credits >= cost;
            return `<article class="upgrade-card">
              <div class="upgrade-top">
                <span class="upgrade-icon">${info.icon}</span>
                <div style="flex:1"><div class="upgrade-name">${info.name}</div><div class="upgrade-lvl">LV ${level} / 5 · ${info.effect}</div></div>
              </div>
              <div class="pips">${[1,2,3,4,5].map((n) => `<span class="pip ${n <= level ? "on" : ""}"></span>`).join("")}</div>
              <div class="upgrade-desc">${info.desc}</div>
              <button class="btn upgrade-btn ${maxed ? "maxed" : ""}" data-action="upgrade" data-id="${key}" ${maxed || !canAfford ? "disabled" : ""}>
                ${maxed ? "FULLY DEVELOPED" : `UPGRADE · ${formatNum(cost)} CR`}
              </button>
            </article>`;
          }).join("")}
        </div>
        <div class="divider"></div>
        <div class="row wrap">
          <span class="tag">TEAM MATE ${esc(mate.short)}</span>
          <span class="tag">BIKE ${esc(team.model)}</span>
          <span class="tag">${state.credits < 850 ? "BANK LOW · RACE FOR CREDITS" : "DEVELOPMENT WINDOW OPEN"}</span>
        </div>
      </section>

      <section class="panel settings-panel span-12" style="grid-column:span 2">
        <div>
          <div class="panel-title"><span class="dot"></span> CAREER CONTROL</div>
          <p class="weekend-sub" style="margin-top:6px">Autosaves after every session. Your save lives in this browser.</p>
        </div>
        <span class="spacer"></span>
        <span class="tag">${esc(rider.country)} · ${esc(team.short)}</span>
        <button class="btn ghost danger-btn" data-action="reset-career">RESET CAREER</button>
      </section>
    </div>
  </div>`;
}

function bikeStatRow(label, value) {
  const pct = clamp((value / 110) * 100, 0, 100);
  return `<div class="bike-stat"><div class="lab"><span>${label}</span><b>${Math.round(value)}</b></div><span class="meter small"><i style="width:${pct}%"></i></span></div>`;
}

function buyUpgrade(key) {
  if (!state || !UPGRADE_INFO[key]) return;
  const level = state.upgrades[key];
  if (level >= 5) return;
  const cost = upgradeCost(level);
  if (state.credits < cost) { toast("Not enough credits. Score points this weekend.", true); return; }
  state.credits -= cost;
  state.upgrades[key] = level + 1;
  saveGame();
  render();
  toast(`${UPGRADE_INFO[key].name} upgraded to LV ${level + 1}`);
}

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

function resultsHTML() {
  const team = currentTeam();
  const rider = currentRider();
  const result = state.lastResult;
  if (!result) { setTimeout(() => setView("hub"), 0); return "<div class='page'>Loading result…</div>"; }
  const showRows = result.results.slice(0, 12);
  if (!showRows.some((row) => row.riderId === state.riderId)) {
    showRows.push(result.results.find((row) => row.riderId === state.riderId));
  }
  const raceNo = result.round;
  const finalRound = state.round >= TOTAL_ROUNDS;
  return `
  <div class="results-shell" style="--tc:${team.color};--ta:${team.accent}">
    <div class="results-body">
      <div class="weekend-head" style="position:static;padding-left:0;padding-right:0;background:transparent;border-bottom:0;margin-bottom:15px">
        <button class="icon-btn" data-action="nav" data-view="hub" aria-label="Back to paddock">${icon("back")}</button>
        <div><div class="kicker">ROUND ${raceNo} · ${esc(result.circuitCode)}</div><div style="font-family:var(--display);font-size:9px">CHEQUERED FLAG</div></div>
        <div class="weekend-progress"><span class="wp-step done">BRIEF</span><span class="wp-step done">QUALI</span><span class="wp-step active">RACE</span></div>
      </div>

      <section class="result-hero">
        <div>
          <div class="result-pos">${ordinal(result.position)}<small>${result.position <= 3 ? "PODIUM FINISH" : result.position <= 10 ? "POINTS FINISH" : "KEEP DIGGING"}</small></div>
          <div class="result-title">${esc(result.circuitName)}</div>
          <div class="result-sub">${esc(rider.name)} · ${esc(team.short)} · ${result.condition} · ${RACE_LAPS} LAPS ${result.pole ? "· POLE POSITION" : ""}</div>
        </div>
        <div class="result-reward">
          <div class="k">PRIZE MONEY</div>
          <div class="v">+${formatNum(result.prize)} CR</div>
          ${result.bonus > 0 ? `<div class="bonus">${result.position <= 3 ? "PODIUM" : "TOP-FIVE"} BONUS +${formatNum(result.bonus)} CR</div>` : `<div class="bonus">${result.points} CHAMPIONSHIP POINTS</div>`}
        </div>
      </section>

      <div class="results-grid">
        <section class="panel table-panel">
          <table class="result-table">
            <thead><tr><th>POS</th><th>RIDER</th><th class="team-hide">TEAM</th><th style="text-align:right">PTS</th></tr></thead>
            <tbody>
              ${showRows.map((row) => {
                const r = riderById(row.riderId);
                const t = teamById(row.teamId);
                return `<tr class="${row.riderId === state.riderId ? "you" : ""}" style="--tc:${t.color}">
                  <td class="pos">${String(row.position).padStart(2, "0")}</td>
                  <td><span class="dot"></span>${esc(r.name)}</td>
                  <td class="team-hide">${esc(t.short)}</td>
                  <td class="pts">${row.points || 0}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </section>
        <section class="panel result-story">
          <div class="panel-title" style="margin-bottom:10px"><span class="dot"></span> THE BOX WALL REPORT</div>
          <p>${esc(result.story)}</p>
          <div class="race-feed-list">
            <div class="feed-line"><b>WINNER</b> ${esc(riderById(result.winner).name)} · ${esc(teamById(result.winnerTeam).short)}</div>
            <div class="feed-line"><b>YOUR PACE</b> ${esc(result.paceLabel)} · ${esc(result.tyreLabel)} tyre</div>
            <div class="feed-line"><b>CHAMPIONSHIP</b> ${ordinal(result.champPosition)} · ${result.points} points scored</div>
            <div class="feed-line"><b>NEXT</b> ${finalRound ? "Season complete" : esc(CIRCUITS[state.round]?.name || "Season complete")}</div>
          </div>
          <div style="margin-top:16px">
            <button class="btn primary wide" data-action="results-continue">${finalRound ? "SEASON REVIEW" : "BACK TO PADDOCK"} ›</button>
          </div>
        </section>
      </div>
    </div>
  </div>`;
}

function continueAfterResults() {
  if (!state) { setView("title"); return; }
  if (state.round >= TOTAL_ROUNDS) goSeasonEnd();
  else setView("hub");
}

/* ------------------------------------------------------------------ */
/* Season end                                                          */
/* ------------------------------------------------------------------ */

function goSeasonEnd() {
  if (!state) { setView("title"); return; }
  if (!state.seasonRewarded) {
    const champ = championshipRiders()[0];
    if (champ && champ.rider.id === state.riderId) {
      state.career.titles += 1;
      state.credits += 3000;
      toast("WORLD CHAMPION! +3,000 CR");
    }
    state.seasonRewarded = true;
    saveGame();
  }
  setView("season-end");
}

function seasonEndHTML() {
  const team = currentTeam();
  const rider = currentRider();
  const standings = championshipRiders();
  const champion = standings[0];
  const youChampion = champion && champion.rider.id === state.riderId;
  const top8 = standings.slice(0, 8);
  if (!top8.some((e) => e.rider.id === state.riderId)) {
    top8.push(standings.find((e) => e.rider.id === state.riderId));
  }
  return `
  <section class="season-end" style="--tc:${team.color};--ta:${team.accent}">
    <div class="season-card">
      <div class="season-trophy">${youChampion ? "T1" : "P" + Math.max(1, standings.findIndex((e) => e.rider.id === state.riderId) + 1)}</div>
      <div class="kicker">SEASON ${state.season} · FINAL CLASSIFICATION</div>
      <h1 class="season-title">${youChampion ? "YOU ARE THE CHAMPION" : "THE SEASON IS DONE"}</h1>
      <p class="season-sub">${youChampion
        ? `A perfect campaign. ${esc(rider.name)} lifts the title for ${esc(team.short)}. The paddock will remember this one.`
        : `${esc(champion.rider.name)} takes the title for ${esc(champion.team.short)}. You finished ${ordinal(standings.findIndex((e) => e.rider.id === state.riderId) + 1)} with ${state.standings.riders[state.riderId]} points. The garage gets another winter.`}
      </p>

      <table class="season-table">
        <tbody>
          ${top8.map((entry, i) => `<tr class="${entry.rider.id === state.riderId ? "you" : ""}">
            <td class="pos">${String(standings.indexOf(entry) + 1).padStart(2, "0")}</td>
            <td>${esc(entry.rider.name)}</td>
            <td class="muted" style="font-size:8px">${esc(entry.team.short)}</td>
            <td class="pts">${entry.points}</td>
          </tr>`).join("")}
        </tbody>
      </table>

      <div class="money-strip" style="text-align:left;margin-bottom:20px">
        <div class="money-cell"><span class="k">TITLES</span><span class="v lime">${state.career.titles}</span></div>
        <div class="money-cell"><span class="k">CAREER WINS</span><span class="v">${state.career.wins}</span></div>
        <div class="money-cell"><span class="k">BANK</span><span class="v lime">${formatNum(state.credits)} CR</span></div>
      </div>

      <div class="season-actions">
        <button class="btn primary big" data-action="new-season">START SEASON ${state.season + 1} ›</button>
        <button class="btn big" data-action="to-title">TITLE SCREEN</button>
      </div>
    </div>
  </section>`;
}

function startNewSeason() {
  if (!state) return;
  state.season += 1;
  state.round = 0;
  state.standings = freshStandings();
  state.lastResult = null;
  state.seasonRewarded = false;
  saveGame();
  setView("hub");
  toast(`SEASON ${state.season} · THE GRID RESETS`);
}
