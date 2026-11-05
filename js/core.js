/* ============================================================
   MOTOGP PIXEL MANAGER — core: state, chrome, title, helpers
   ============================================================ */
"use strict";

const SAVE_KEY = "motogp-pixel-manager-v1";
const TOTAL_ROUNDS = CIRCUITS.length;
const RACE_LAPS = 10;
const RACE_LAP_SECONDS = 5.75;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rand = (a, b) => a + Math.random() * (b - a);
const esc = (str) => String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let state = null;
let view = "title";
let weekend = null;
let quali = null;
let race = null;
let pendingTeamId = null;
let titleRAF = null;
let titleResize = null;
let qRAF = null;
let qTimer = null;
let raceRAF = null;
let raceResize = null;
let raceHudAccum = 0;
let radioTimer = null;
let bannerTimer = null;
let toastTimer = null;

/* ------------------------------------------------------------------ */
/* Storage and derived data                                            */
/* ------------------------------------------------------------------ */

function freshStandings() {
  const riders = {};
  const teams = {};
  RIDERS.forEach((r) => { riders[r.id] = 0; });
  TEAMS.forEach((t) => { teams[t.id] = 0; });
  return { riders, teams };
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !riderById(data.riderId) || !teamById(data.teamId)) return null;
    if (!data.standings || !data.standings.riders) data.standings = freshStandings();
    RIDERS.forEach((r) => { if (typeof data.standings.riders[r.id] !== "number") data.standings.riders[r.id] = 0; });
    TEAMS.forEach((t) => { if (typeof data.standings.teams[t.id] !== "number") data.standings.teams[t.id] = 0; });
    if (!data.upgrades) data.upgrades = { engine: 1, aero: 1, chassis: 1, electronics: 1 };
    if (!data.career) data.career = { races: 0, wins: 0, podiums: 0, poles: 0, titles: 0 };
    if (!Array.isArray(data.history)) data.history = [];
    data.season = data.season || 1;
    data.round = clamp(Number(data.round) || 0, 0, TOTAL_ROUNDS);
    data.credits = Number(data.credits) || 0;
    return data;
  } catch (err) {
    console.warn("Save load failed", err);
    return null;
  }
}

function saveGame() {
  if (!state) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Save failed", err);
  }
}

function newCareer(teamId, riderId) {
  const team = teamById(teamId);
  state = {
    version: 1,
    createdAt: Date.now(),
    season: 1,
    round: 0,
    teamId,
    riderId,
    credits: 1500,
    upgrades: { engine: 1, aero: 1, chassis: 1, electronics: 1 },
    standings: freshStandings(),
    lastResult: null,
    history: [],
    career: { races: 0, wins: 0, podiums: 0, poles: 0, titles: 0 },
    seasonRewarded: false,
    teamName: team.name
  };
  saveGame();
}

const currentTeam = () => (state ? teamById(state.teamId) : null);
const currentRider = () => (state ? riderById(state.riderId) : null);
const currentCircuit = () => (state ? CIRCUITS[Math.min(state.round, TOTAL_ROUNDS - 1)] : CIRCUITS[0]);
const teammate = () => {
  if (!state) return null;
  return RIDERS.find((r) => r.teamId === state.teamId && r.id !== state.riderId);
};

function bikeStats(team, upgrades) {
  const u = upgrades || { engine: 1, aero: 1, chassis: 1, electronics: 1 };
  return {
    power: team.power + (u.engine - 1) * 2.4 + (u.aero - 1) * 0.9,
    handling: team.handling + (u.chassis - 1) * 2.2 + (u.aero - 1) * 0.7,
    braking: team.braking + (u.chassis - 1) * 1.0,
    reliability: team.reliability + (u.electronics - 1) * 1.8
  };
}

function riderPerf(rider, team, upgrades, aiBoost = 0) {
  const bike = bikeStats(team, upgrades);
  const p = bike.power + aiBoost;
  const h = bike.handling + aiBoost * 0.4;
  return (rider.pace * 0.48) + (rider.racecraft * 0.22) + (rider.braking * 0.12) +
    (p * 0.12) + (h * 0.06) + ((rider.consistency - 82) * 0.035);
}

function riderOverall(rider, team) {
  return Math.round(riderPerf(rider, team, null));
}

function teamOverall(team) {
  const riders = RIDERS.filter((r) => r.teamId === team.id);
  return Math.round(riders.reduce((sum, r) => sum + riderOverall(r, team), 0) / riders.length);
}

function upgradeSum(upgrades) {
  const u = upgrades || state.upgrades;
  return (u.engine + u.aero + u.chassis + u.electronics) - 4;
}

function upgradeCost(level) {
  return 550 + level * 300;
}

function championshipRiders() {
  if (!state) return [];
  return RIDERS.map((rider) => {
    const team = teamById(rider.teamId);
    return { rider, team, points: state.standings.riders[rider.id] || 0 };
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aw = state.history.filter((h) => h.winner === a.rider.id).length;
    const bw = state.history.filter((h) => h.winner === b.rider.id).length;
    if (bw !== aw) return bw - aw;
    return riderOverall(b.rider, b.team) - riderOverall(a.rider, a.team);
  });
}

function championshipTeams() {
  return TEAMS.map((team) => ({
    team,
    points: state.standings.teams[team.id] || 0
  })).sort((a, b) => b.points - a.points || teamOverall(b.team) - teamOverall(a.team));
}

function playerChampPosition() {
  if (!state) return 1;
  return championshipRiders().findIndex((e) => e.rider.id === state.riderId) + 1;
}

function ordinal(n) {
  return "P" + n;
}

function formatLap(seconds) {
  if (!Number.isFinite(seconds)) return "--:--.---";
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return String(m) + ":" + (s < 10 ? "0" : "") + s.toFixed(3);
}

function formatGap(seconds) {
  if (!Number.isFinite(seconds)) return "LEADER";
  return (seconds >= 0 ? "+" : "") + seconds.toFixed(1);
}

function formatNum(n) {
  return Number(n).toLocaleString("en-US");
}

function raceLapTimeFor(rating, circuit, wet, wetSkill = 85, variance = 0) {
  let t = circuit.baseLap - (rating - 85) * 0.36;
  if (wet) t += (1 - wetSkill / 100) * 2.5 + 1.1;
  return t + variance;
}

function conditionFor(circuit) {
  return Math.random() < circuit.rain ? "WET" : "DRY";
}

/* ------------------------------------------------------------------ */
/* Pixel SVG art                                                       */
/* ------------------------------------------------------------------ */

function helmetSVG(color, accent = "#f4f3e9") {
  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="4" y="2" width="8" height="1" fill="${color}"/>
    <rect x="3" y="3" width="10" height="6" fill="${color}"/>
    <rect x="2" y="5" width="12" height="5" fill="${color}"/>
    <rect x="3" y="10" width="10" height="3" fill="${color}"/>
    <rect x="5" y="13" width="6" height="1" fill="${color}"/>
    <rect x="5" y="3" width="2" height="3" fill="${accent}" opacity=".9"/>
    <rect x="7" y="7" width="6" height="3" fill="#0d0f16"/>
    <rect x="8" y="7" width="4" height="1" fill="#4ce5ff" opacity=".72"/>
    <rect x="5" y="12" width="6" height="1" fill="#0d0f16"/>
    <rect x="12" y="8" width="2" height="2" fill="${accent}" opacity=".8"/>
  </svg>`;
}

function bikeSVG(team, number) {
  return `<svg viewBox="0 0 132 76" shape-rendering="crispEdges" aria-hidden="true">
    <ellipse cx="66" cy="68" rx="51" ry="5" fill="#000" opacity=".42"/>
    <g>
      <circle cx="24" cy="56" r="13" fill="#0a0b10"/>
      <circle cx="24" cy="56" r="9" fill="#252838"/>
      <circle cx="24" cy="56" r="3" fill="#747a92"/>
      <circle cx="103" cy="56" r="13" fill="#0a0b10"/>
      <circle cx="103" cy="56" r="9" fill="#252838"/>
      <circle cx="103" cy="56" r="3" fill="#747a92"/>
      <path d="M24 56 L54 48 L62 37 L94 44 L103 56" fill="none" stroke="#747a92" stroke-width="3"/>
      <path d="M38 40 L64 34 L75 47 L46 52 Z" fill="${team.color}"/>
      <path d="M48 29 L78 28 L88 40 L62 45 Z" fill="${team.color}"/>
      <path d="M78 28 L91 34 L96 43 L88 44 L80 36 Z" fill="${team.accent}"/>
      <path d="M54 23 L76 25 L79 31 L55 30 Z" fill="#0f1119"/>
      <path d="M59 17 L69 17 L72 27 L61 27 Z" fill="${team.accent}"/>
      <path d="M59 17 L68 17 L68 12 L63 12 Z" fill="#151722"/>
      <path d="M85 19 L96 24 L94 31 L82 27 Z" fill="rgba(150,200,235,.55)"/>
      <rect x="47" y="33" width="4" height="13" fill="#11131c"/>
      <rect x="64" y="36" width="7" height="8" fill="#151722"/>
      <rect x="49" y="46" width="24" height="5" fill="${team.accent}"/>
      <rect x="92" y="45" width="10" height="5" fill="#11131c"/>
      <circle cx="70" cy="26" r="8" fill="#11131c"/>
      <path d="M63 21 L76 21 L80 28 L71 35 L61 30 Z" fill="${team.color}"/>
      <rect x="66" y="21" width="8" height="2" fill="#f4f3e9"/>
      <rect x="69" y="27" width="6" height="3" fill="#0a0b10"/>
      <rect x="58" y="27" width="13" height="3" fill="#0d0f16"/>
      <rect x="60" y="50" width="3" height="5" fill="#3a3e52"/>
      <rect x="74" y="50" width="3" height="5" fill="#3a3e52"/>
      <rect x="100" y="42" width="11" height="3" fill="${team.accent}"/>
      <text x="101" y="40" font-family="monospace" font-size="8" font-weight="bold" fill="#f4f3e9">${number}</text>
    </g>
  </svg>`;
}

function trackSVG(circuit, color, className = "") {
  const m = circuit.path.match(/M\s*([\d.]+)[ ,]+([\d.]+)/);
  const sx = m ? m[1] : 18;
  const sy = m ? m[2] : 66;
  return `<svg class="${className}" viewBox="-7 -7 114 114" aria-hidden="true">
    <path d="${circuit.path}" fill="none" stroke="#040509" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${circuit.path}" fill="none" stroke="#252a3c" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${circuit.path}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" opacity=".82"/>
    <path d="${circuit.path}" fill="none" stroke="#d9dce8" stroke-width=".55" stroke-dasharray="2 4" opacity=".55"/>
    <rect x="${sx - 2}" y="${sy - 2}" width="4" height="4" fill="#d8ff3e"/>
  </svg>`;
}

function icon(name) {
  const paths = {
    home: "M2 7h2V4h3v2h2V4h3v3h2v7H10v-4H6v4H2z",
    flag: "M2 1h2v14H2zM5 2h9v2h1v4h-1v2H5V7h7V4H5z",
    trophy: "M4 2h8v2h2v4h-2v2H9v2h3v2H4v-2h3V10H5V8H3V4h1zm1 2v3h1V4zm6 0v3h1V4z",
    wrench: "M10 1a4 4 0 0 0-3.4 6.1L1 12.7V15h2.3l5.6-5.6A4 4 0 1 0 10 1zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
    back: "M7 2 1 8l6 6v-4h7V6H7z",
    play: "M3 2l10 6-10 6z",
    power: "M7 1h2v7H7zM3 4h2v2H3v6h10V6h-2V4h2v2h1v8H2V6h1z",
    settings: "M7 1h2v2h2v2h2v5h-2v2H9v2H6v-2H4v-2H2V5h2V3h2V1zm1 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    cross: "M3 1h3v2h1v2h2V3h2V1h3v3h-2v2H9v2h3v2h2v3h-3v-2H9V9H7v2H5v2H2v-3h2V8h2V6H4V4H2V1z",
    chevron: "M5 2l6 6-6 6V9l2-1-2-1z",
    bolt: "M9 1 2 9h5l-1 6 7-8H8z",
    sound: "M2 6h3l4-3v10L5 10H2zm9-3 1 1a6 6 0 0 1 0 8l-1 1-1-1 1-1a4 4 0 0 0 0-6l-1-1z"
  };
  return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${paths[name] || paths.home}" fill="currentColor"/></svg>`;
}

/* ------------------------------------------------------------------ */
/* Chrome, navigation, routing                                         */
/* ------------------------------------------------------------------ */

function renderChrome() {
  const top = $("#topbar");
  const nav = $("#bottomnav");
  const inCareer = state && ["hub", "standings", "garage", "briefing", "quali", "grid", "race", "results", "season-end"].includes(view);
  const showChrome = state && ["hub", "standings", "garage"].includes(view);
  top.classList.toggle("hidden", !showChrome);
  nav.classList.toggle("hidden", !showChrome);

  if (showChrome) {
    const team = currentTeam();
    const rider = currentRider();
    top.innerHTML = `
      <button class="brand" data-action="nav" data-view="hub" aria-label="Paddock home">
        <span class="brand-helmet">${helmetSVG(team.color, team.accent)}</span>
        <span class="brand-copy">
          <span class="brand-name">MOTOGP PIXEL</span>
          <span class="brand-sub">MANAGER · S${state.season}</span>
        </span>
      </button>
      <span class="topbar-spacer"></span>
      <div class="top-stats">
        <span class="stat-chip plain"><span class="k">RIDER</span><span class="v">${esc(rider.short)}</span></span>
        <span class="stat-chip round-chip"><span class="k">ROUND</span><span class="v">${Math.min(state.round + 1, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}</span></span>
        <span class="stat-chip"><span class="k">CREDITS</span><span class="v">${formatNum(state.credits)}</span></span>
      </div>`;
    const active = view === "briefing" ? "briefing" : view;
    nav.innerHTML = [
      { v: "hub", label: "PADDOCK", icon: "home" },
      { v: "briefing", label: "RACE", icon: "flag" },
      { v: "standings", label: "STANDINGS", icon: "trophy" },
      { v: "garage", label: "GARAGE", icon: "wrench" }
    ].map((item) => `<button class="navbtn ${active === item.v ? "active" : ""}" data-action="nav" data-view="${item.v}" aria-label="${item.label}">${icon(item.icon)}<span>${item.label}</span></button>`).join("");
  }
  if (!inCareer) {
    top.classList.add("hidden");
    nav.classList.add("hidden");
  }
}

function setView(next) {
  view = next;
  if (next !== "title") stopTitleLoop();
  if (next !== "quali") stopQualiLoop();
  if (next !== "race") stopRaceLoop();
  render();
}

function render() {
  const screen = $("#screen");
  screen.classList.toggle("scroll", !["race"].includes(view));
  screen.classList.remove("screen-enter");
  // force a reflow so the small entrance animation replays
  void screen.offsetWidth;
  screen.classList.add("screen-enter");

  switch (view) {
    case "title": screen.innerHTML = titleHTML(); renderChrome(); startTitleLoop(); break;
    case "select": screen.innerHTML = selectHTML(); renderChrome(); break;
    case "hub": screen.innerHTML = hubHTML(); renderChrome(); break;
    case "briefing": screen.innerHTML = briefingHTML(); renderChrome(); break;
    case "quali": screen.innerHTML = qualiHTML(); renderChrome(); startQualiLoop(); break;
    case "grid": screen.innerHTML = gridHTML(); renderChrome(); break;
    case "race": screen.innerHTML = raceHTML(); renderChrome(); startRaceLoop(); break;
    case "results": screen.innerHTML = resultsHTML(); renderChrome(); break;
    case "standings": screen.innerHTML = standingsHTML(); renderChrome(); break;
    case "garage": screen.innerHTML = garageHTML(); renderChrome(); break;
    case "season-end": screen.innerHTML = seasonEndHTML(); renderChrome(); break;
    default: setView("title");
  }
}

function navTo(target) {
  if (!state) { setView("title"); return; }
  if (target === "briefing") {
    if (state.round >= TOTAL_ROUNDS) { goSeasonEnd(); return; }
    beginWeekend();
    return;
  }
  if (target === "standings") { setView("standings"); return; }
  if (target === "garage") { setView("garage"); return; }
  setView("hub");
}

/* ------------------------------------------------------------------ */
/* Global click delegation                                             */
/* ------------------------------------------------------------------ */

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;
  switch (action) {
    case "new-career":
      state = null;
      setView("select");
      break;
    case "continue":
      if (!state) { setView("title"); break; }
      if (state.round >= TOTAL_ROUNDS) goSeasonEnd();
      else setView("hub");
      break;
    case "to-title":
      setView("title");
      break;
    case "pick-team":
      openTeamModal(el.dataset.team);
      break;
    case "close-modal":
      if (el.classList.contains("modal-overlay") && event.target !== el) break;
      closeModal();
      break;
    case "sign-rider":
      signRider(el.dataset.rider, el.dataset.team);
      break;
    case "nav":
      navTo(el.dataset.view);
      break;
    case "select-tyre":
      if (weekend) { weekend.tyre = id; render(); }
      break;
    case "select-setup":
      if (weekend) { weekend.setup = id; render(); }
      break;
    case "go-quali":
      startQuali();
      break;
    case "q-push":
      pushQualiSector();
      break;
    case "q-auto":
      autoQuali();
      break;
    case "start-race":
      startRace();
      break;
    case "pace":
      setRacePace(Number(el.dataset.index));
      break;
    case "box":
      requestBox();
      break;
    case "race-speed":
      cycleRaceSpeed();
      break;
    case "pause-race":
      toggleRacePause();
      break;
    case "results-continue":
      continueAfterResults();
      break;
    case "standings-tab":
      standingsTab = el.dataset.tab;
      render();
      break;
    case "upgrade":
      buyUpgrade(id);
      break;
    case "reset-career":
      openResetModal();
      break;
    case "confirm-reset":
      localStorage.removeItem(SAVE_KEY);
      state = null;
      closeModal();
      setView("title");
      break;
    case "new-season":
      startNewSeason();
      break;
    case "season-title":
      if (state) { state.round = 0; saveGame(); setView("hub"); }
      break;
    default:
      break;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && view === "quali") {
    event.preventDefault();
    pushQualiSector();
  }
  if (event.code === "Escape" && $("#modal-root").innerHTML) closeModal();
});

/* ------------------------------------------------------------------ */
/* Modal and toast                                                     */
/* ------------------------------------------------------------------ */

function openModal(html) {
  $("#modal-root").innerHTML = `<div class="modal-overlay" data-action="close-modal"><div class="modal">${html}</div></div>`;
}

function closeModal() {
  $("#modal-root").innerHTML = "";
}

function openTeamModal(teamId) {
  const team = teamById(teamId);
  if (!team) return;
  pendingTeamId = teamId;
  const riders = RIDERS.filter((r) => r.teamId === teamId);
  openModal(`
    <div class="modal-head">
      <div>
        <div class="kicker">SIGN YOUR RIDER</div>
        <h3>${esc(team.short)} GARAGE</h3>
      </div>
      <button class="icon-btn close" data-action="close-modal" aria-label="Close">${icon("cross")}</button>
    </div>
    <div class="modal-team" style="--tc:${team.color};--ta:${team.accent}">
      <span class="sw"></span>
      <div><b>${esc(team.name)}</b><span>${esc(team.model)} · OVR ${teamOverall(team)}</span></div>
    </div>
    <p class="modal-note">Choose who you race as. Your rider's pace, racecraft and consistency shape every result. The bike can be developed between rounds.</p>
    ${riders.map((r) => `
      <button class="modal-rider" style="--tc:${team.color};--ta:${team.accent}" data-action="sign-rider" data-rider="${r.id}" data-team="${team.id}">
        <span class="rh">${helmetSVG(team.color, team.accent)}</span>
        <span class="ri">
          <span class="rn">${esc(r.name)} · #${r.num}</span>
          <span class="rm">${esc(r.country)} · ${esc(r.style)} · PACE ${r.pace} / RACE ${r.racecraft}</span>
        </span>
        <span class="ro">${riderOverall(r, team)}</span>
      </button>`).join("")}
    <div class="modal-foot">
      <button class="btn ghost wide" data-action="close-modal">BACK</button>
    </div>`);
}

function openResetModal() {
  openModal(`
    <div class="modal-head">
      <div><div class="kicker">DANGER ZONE</div><h3>RESET CAREER?</h3></div>
      <button class="icon-btn close" data-action="close-modal" aria-label="Close">${icon("cross")}</button>
    </div>
    <p class="modal-note">This deletes your current season, all championship points, upgrades and history. It cannot be undone.</p>
    <div class="modal-foot">
      <button class="btn ghost" data-action="close-modal">KEEP RACING</button>
      <span class="spacer"></span>
      <button class="btn red" data-action="confirm-reset">DELETE SAVE</button>
    </div>`);
}

function signRider(riderId, teamId) {
  const rider = riderById(riderId);
  if (!rider) return;
  newCareer(teamId, riderId);
  closeModal();
  setView("hub");
  toast(`SIGNED: ${rider.name} · ${teamById(teamId).short}`);
}

function toast(message, error = false) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.toggle("error", Boolean(error));
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}

/* ------------------------------------------------------------------ */
/* Title screen                                                        */
/* ------------------------------------------------------------------ */

function titleHTML() {
  const save = loadGame();
  return `
  <section class="title-screen">
    <canvas id="titleCanvas" aria-hidden="true"></canvas>
    <div class="title-shade"></div>
    <div class="title-top">
      <div class="title-badge">FAN-MADE <b>2025 GRID</b></div>
      <div class="title-badge secondary">2D PIXEL <b>RACE MANAGEMENT</b></div>
    </div>
    <div class="title-content">
      <div class="title-eyebrow">THE PADDOCK IS WAITING</div>
      <h1><span class="title-main">MOTO<em>GP</em></span><span class="title-sub">PIXEL MANAGER</span></h1>
      <p class="title-copy">Run the box wall. Read the tyre. Call the pit stop. Take a full 22-rider MotoGP grid through a 14-round championship in glorious pixel art — built for phone and tablet.</p>
      <div class="title-actions">
        ${save ? `<button class="btn primary big" data-action="continue">${icon("play")} CONTINUE</button>` : `<button class="btn primary big" data-action="new-career">${icon("play")} START CAREER</button>`}
        ${save ? `<button class="btn big" data-action="new-career">NEW CAREER</button>` : ""}
      </div>
      ${save ? `<div class="save-jump">SEASON ${save.season} · ${esc(riderById(save.riderId).name)} / ${esc(teamById(save.teamId).short)}<br><b>ROUND ${Math.min(save.round + 1, TOTAL_ROUNDS)} OF ${TOTAL_ROUNDS} · ${formatNum(save.credits)} CR</b></div>` : `<div class="save-jump">22 RIDERS · 11 TEAMS · 14 CIRCUITS<br><b>ONE CHAMPIONSHIP</b></div>`}
    </div>
    <div class="title-bottom">
      <span>UNOFFICIAL FAN PROJECT · NOT AFFILIATED WITH MOTOGP / DORNA</span>
      <span class="spacer"></span>
      <span>NO ASSETS DOWNLOADED · MADE FOR THE LOVE OF RACING</span>
    </div>
  </section>`;
}

function stopTitleLoop() {
  if (titleRAF) cancelAnimationFrame(titleRAF);
  titleRAF = null;
  if (titleResize) window.removeEventListener("resize", titleResize);
  titleResize = null;
}

function startTitleLoop() {
  stopTitleLoop();
  const canvas = $("#titleCanvas");
  if (!canvas) return;
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
  titleResize = resize;
  window.addEventListener("resize", resize);
  let last = performance.now();
  const loop = (now) => {
    if (!document.getElementById("titleCanvas")) { stopTitleLoop(); return; }
    const t = now / 1000;
    drawTitleScene(ctx, w, h, t);
    titleRAF = requestAnimationFrame(loop);
  };
  titleRAF = requestAnimationFrame(loop);
}

function drawTitleScene(ctx, w, h, t) {
  ctx.clearRect(0, 0, w, h);
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.82);
  sky.addColorStop(0, "#070812");
  sky.addColorStop(0.52, "#111222");
  sky.addColorStop(0.76, "#2d1421");
  sky.addColorStop(1, "#0b0d16");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // pixel stars
  ctx.fillStyle = "rgba(235,240,255,.5)";
  for (let i = 0; i < 34; i++) {
    const x = ((i * 97 + 23) % 100) / 100 * w;
    const y = ((i * 53 + 17) % 46) / 100 * h;
    const s = i % 7 === 0 ? 2 : 1;
    ctx.globalAlpha = 0.35 + ((i * 13) % 40) / 100;
    ctx.fillRect(Math.round(x), Math.round(y), s, s);
  }
  ctx.globalAlpha = 1;

  // moon
  const mx = w * 0.76, my = h * 0.18, mr = Math.max(18, Math.min(w, h) * 0.045);
  ctx.fillStyle = "rgba(255,235,190,.08)";
  ctx.beginPath(); ctx.arc(mx, my, mr * 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f2e4be";
  ctx.fillRect(Math.round(mx - mr), Math.round(my - mr), Math.round(mr * 2), Math.round(mr * 2));
  ctx.fillStyle = "#d8c9a2";
  ctx.fillRect(Math.round(mx - mr * 0.7), Math.round(my - mr * 0.2), Math.round(mr * 0.8), Math.round(mr * 0.5));
  ctx.fillRect(Math.round(mx + mr * 0.2), Math.round(my - mr * 0.65), Math.round(mr * 0.4), Math.round(mr * 0.4));

  // distant skyline / grandstands
  const horizon = h * 0.61;
  ctx.fillStyle = "#0b0c16";
  ctx.fillRect(0, horizon, w, h - horizon);
  ctx.fillStyle = "#0d0f1b";
  for (let i = 0; i < 18; i++) {
    const bw = w / 18 + 4;
    const bh = 18 + ((i * 31) % 52);
    ctx.fillRect(Math.round(i * w / 18 - 2), Math.round(horizon - bh), Math.round(bw), bh);
  }
  // grandstand lights
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 44; i++) {
      const pulse = 0.25 + 0.35 * Math.sin(t * 0.7 + i * 0.9 + row);
      ctx.globalAlpha = clamp(pulse, 0.08, 0.55);
      ctx.fillStyle = i % 5 === 0 ? "#ffd56a" : "#7fe8ff";
      ctx.fillRect(Math.round((i + 0.3) * w / 44), Math.round(horizon - 32 - row * 9), 2, 2);
    }
  }
  ctx.globalAlpha = 1;

  // floodlight towers
  for (const fx of [0.16, 0.48, 0.86]) {
    const x = w * fx, top = h * 0.18;
    ctx.fillStyle = "#151826";
    ctx.fillRect(Math.round(x - 2), Math.round(top), 4, Math.round(horizon - top));
    ctx.fillStyle = "rgba(255,240,190,.85)";
    ctx.fillRect(Math.round(x - 13), Math.round(top - 5), 26, 5);
    const glow = ctx.createRadialGradient(x, top, 4, x, top, 95);
    glow.addColorStop(0, "rgba(255,240,190,.22)");
    glow.addColorStop(1, "rgba(255,240,190,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, top, 95, 0, Math.PI * 2); ctx.fill();
  }

  // track apron
  const trackTop = h * 0.78;
  ctx.fillStyle = "#141720";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, trackTop + 24);
  ctx.lineTo(w, trackTop - 16);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#242737";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, trackTop + 42);
  ctx.lineTo(w, trackTop + 2);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // kerbs
  for (let i = 0; i < 40; i++) {
    const x = (i / 40) * w;
    ctx.fillStyle = i % 2 ? "#e8e8e8" : "#d73541";
    ctx.fillRect(Math.round(x), Math.round(trackTop + 32 - (x / w) * 40), Math.ceil(w / 40) + 1, 5);
  }

  // speed streaks
  ctx.fillStyle = "rgba(255,255,255,.09)";
  for (let i = 0; i < 16; i++) {
    const x = ((i * 119 + t * (140 + i * 8)) % (w + 220)) - 120;
    const y = h * 0.66 + (i % 8) * 14;
    ctx.fillRect(Math.round(w - x), Math.round(y), 28 + (i % 4) * 14, 1);
  }

  // animated side bikes racing across the bottom
  const lanes = [
    { color: "#d8ff3e", offset: 0.0, speed: 118, y: h - 88, scale: 0.88, accent: "#ff5349" },
    { color: "#ff5349", offset: 0.38, speed: 146, y: h - 64, scale: 1.05, accent: "#f4f3e9" },
    { color: "#47e5ff", offset: 0.72, speed: 132, y: h - 40, scale: 0.75, accent: "#ffd23f" }
  ];
  for (const lane of lanes) {
    const span = w + 320;
    const x = ((t * lane.speed + lane.offset * span) % span) - 180;
    drawSideBike(ctx, w - x, lane.y, lane.scale, lane.color, lane.accent, t, lane.offset);
  }

  // foreground grit
  ctx.fillStyle = "rgba(0,0,0,.3)";
  for (let i = 0; i < 38; i++) {
    const x = (i * 89) % w;
    const y = h * 0.83 + ((i * 47) % (h * 0.17));
    ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
  }
}

function drawSideBike(ctx, x, y, scale, color, accent, t, phase) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 12 + phase * 9) * 1.4);
  ctx.scale(scale, scale);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath(); ctx.ellipse(0, 18, 45, 5, 0, 0, Math.PI * 2); ctx.fill();
  // rear wheel
  ctx.fillStyle = "#050608"; ctx.fillRect(-32, 2, 16, 16);
  ctx.fillStyle = "#2b2e3d"; ctx.fillRect(-29, 5, 10, 10);
  ctx.fillStyle = "#e8e8e8"; ctx.fillRect(-26, 8, 4, 4);
  // front wheel
  ctx.fillStyle = "#050608"; ctx.fillRect(27, 2, 16, 16);
  ctx.fillStyle = "#2b2e3d"; ctx.fillRect(30, 5, 10, 10);
  ctx.fillStyle = "#e8e8e8"; ctx.fillRect(33, 8, 4, 4);
  // swingarm
  ctx.strokeStyle = "#858ba1"; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-17, 10); ctx.lineTo(8, 5); ctx.lineTo(29, 10); ctx.stroke();
  // body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-21, 0); ctx.lineTo(2, -6); ctx.lineTo(20, -2); ctx.lineTo(29, 4); ctx.lineTo(17, 9); ctx.lineTo(-8, 9); ctx.lineTo(-24, 6);
  ctx.closePath(); ctx.fill();
  // fairing stripe
  ctx.fillStyle = accent; ctx.fillRect(-16, 1, 26, 3);
  // seat / tail
  ctx.fillStyle = "#12141f"; ctx.fillRect(-18, -7, 13, 5);
  // screen
  ctx.fillStyle = "rgba(160,210,240,.65)";
  ctx.beginPath(); ctx.moveTo(23, -2); ctx.lineTo(33, -12); ctx.lineTo(36, -2); ctx.closePath(); ctx.fill();
  // rider body
  ctx.fillStyle = "#11131d";
  ctx.fillRect(-6, -18, 16, 12);
  ctx.fillStyle = accent;
  ctx.fillRect(-3, -17, 8, 4);
  // helmet
  ctx.fillStyle = color; ctx.fillRect(2, -27, 12, 10);
  ctx.fillStyle = "#f4f3e9"; ctx.fillRect(5, -27, 4, 4);
  ctx.fillStyle = "#0a0b10"; ctx.fillRect(7, -23, 7, 3);
  // exhaust flicker
  ctx.fillStyle = "rgba(255,180,60,.5)";
  ctx.fillRect(-40, 7, 7 + Math.random() * 5, 2);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

window.addEventListener("beforeunload", saveGame);
