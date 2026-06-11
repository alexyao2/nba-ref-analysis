import { formatNumber, formatPct, splitLabel } from "../data/normalize.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const API_BASE = window.WHISTLERATE_API_BASE || "http://127.0.0.1:8000";

let scatterData = null;
let scatterRequest = null;

function quadrantFor(profile) {
  if (profile.x >= 0 && profile.y >= 0) return "home";
  if (profile.x < 0 && profile.y < 0) return "road";
  if (profile.x < 0 && profile.y >= 0) return "mixed-home";
  return "mixed-road";
}

function quadrantLabel(value) {
  return {
    home: "Home-favorable profile",
    road: "Road-favorable profile",
    "mixed-home": "Home index, road-favorable whistle",
    "mixed-road": "Home whistle, road-favorable index"
  }[value];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function profileSummary(profile) {
  return `
    <span>Hover profile</span>
    <strong>${escapeHtml(profile.referee)}</strong>
    <p>${escapeHtml(profile.season)} ${escapeHtml(splitLabel(profile.split))} · ${escapeHtml(profile.role || "Role unavailable")} · ${formatNumber(profile.games_officiated, 0)} games</p>
    <dl>
      <div><dt>Quadrant</dt><dd>${quadrantLabel(quadrantFor(profile))}</dd></div>
      <div><dt>Foul diff.</dt><dd>${formatNumber(profile.foul_differential_road_minus_home, 2)}</dd></div>
      <div><dt>Adjusted index</dt><dd>${formatNumber(profile.confidence_adjusted_index, 2)}</dd></div>
      <div><dt>Home win rate</dt><dd>${formatPct(profile.home_team_win_pct)}</dd></div>
      <div><dt>Confidence</dt><dd>${formatPct(profile.confidence)}</dd></div>
    </dl>
  `;
}

function loadingState(el) {
  el.conclusionHomeCount.textContent = "--";
  el.conclusionRoadCount.textContent = "--";
  el.conclusionSampleLeader.textContent = "--";
  el.conclusionPlotCount.textContent = "Loading";
  el.selectedProfile.innerHTML = `
    <span>Backend data</span>
    <strong>Loading profiles</strong>
    <p>Fetching metric results from the FastAPI backend.</p>
  `;
}

function errorState(el, message) {
  el.conclusionHomeCount.textContent = "--";
  el.conclusionRoadCount.textContent = "--";
  el.conclusionSampleLeader.textContent = "--";
  el.conclusionPlotCount.textContent = "Backend unavailable";
  el.selectedProfile.innerHTML = `
    <span>Backend data</span>
    <strong>Unable to load graph</strong>
    <p>${escapeHtml(message)}</p>
  `;
  drawEmptyScatter(el, "Start the backend on port 8000 to load the conclusions graph.");
}

async function loadScatterData() {
  const response = await fetch(`${API_BASE}/api/metrics/conclusions/scatter`);
  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }
  return response.json();
}

export function renderConclusions(el) {
  if (scatterData) {
    renderScatterData(scatterData, el);
    return;
  }

  if (!scatterRequest) {
    loadingState(el);
    drawEmptyScatter(el, "Loading backend metric results...");
    scatterRequest = loadScatterData()
      .then((data) => {
        scatterData = data;
        renderScatterData(scatterData, el);
      })
      .catch((error) => {
        errorState(el, error.message);
      });
  }
}

function renderScatterData(data, el) {
  const profiles = data.profiles || [];
  const sampleLeader = [...profiles].sort((a, b) => b.games_officiated - a.games_officiated)[0];

  el.conclusionHomeCount.textContent = String(data.summary?.home_favorable ?? 0);
  el.conclusionRoadCount.textContent = String(data.summary?.road_favorable ?? 0);
  el.conclusionSampleLeader.textContent = sampleLeader
    ? `${sampleLeader.referee.split(" ").slice(-1)[0]} (${formatNumber(sampleLeader.games_officiated, 0)})`
    : "--";
  el.conclusionPlotCount.textContent = `${profiles.length} plotted`;
  el.selectedProfile.innerHTML = sampleLeader ? profileSummary(sampleLeader) : `
    <span>Hover profile</span>
    <strong>No backend profiles</strong>
    <p>The backend returned no plottable referee profiles.</p>
  `;

  drawConclusionScatter(profiles, el);
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function addText(parent, text, attributes = {}) {
  const node = createSvgElement("text", attributes);
  node.textContent = text;
  parent.append(node);
  return node;
}

function drawEmptyScatter(el, message) {
  const container = el.conclusionScatter;
  const tooltip = el.profileTooltip;
  container.innerHTML = "";
  if (tooltip) container.append(tooltip);

  const { svg } = createBaseSvg([]);
  addText(svg, message, { x: 74, y: 96, class: "scatter-empty" });
  container.append(svg);
}

function createBaseSvg(profiles) {
  const width = 960;
  const height = 560;
  const margin = { top: 48, right: 34, bottom: 66, left: 74 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const centerX = margin.left + plotWidth / 2;
  const centerY = margin.top + plotHeight / 2;
  const maxX = Math.max(1, ...profiles.map((profile) => Math.abs(profile.x)));
  const maxY = Math.max(1, ...profiles.map((profile) => Math.abs(profile.y)));

  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-labelledby": "conclusionScatterTitle conclusionScatterDesc"
  });

  const title = createSvgElement("title", { id: "conclusionScatterTitle" });
  title.textContent = "Interactive referee quadrant map";
  const description = createSvgElement("desc", { id: "conclusionScatterDesc" });
  description.textContent = "Referee profiles plotted by foul differential on the x-axis and confidence-adjusted home bias index on the y-axis.";
  svg.append(title, description);

  svg.append(createSvgElement("rect", { x: 0, y: 0, width, height, class: "scatter-bg" }));
  svg.append(createSvgElement("rect", { x: centerX, y: margin.top, width: plotWidth / 2, height: plotHeight / 2, class: "quadrant-zone home-zone" }));
  svg.append(createSvgElement("rect", { x: margin.left, y: centerY, width: plotWidth / 2, height: plotHeight / 2, class: "quadrant-zone road-zone" }));

  for (let index = -2; index <= 2; index += 1) {
    const x = centerX + (index / 2) * (plotWidth / 2);
    const y = centerY + (index / 2) * (plotHeight / 2);
    svg.append(createSvgElement("line", { x1: x, y1: margin.top, x2: x, y2: margin.top + plotHeight, class: "scatter-grid" }));
    svg.append(createSvgElement("line", { x1: margin.left, y1: y, x2: margin.left + plotWidth, y2: y, class: "scatter-grid" }));
  }

  svg.append(createSvgElement("line", { x1: margin.left, y1: centerY, x2: margin.left + plotWidth, y2: centerY, class: "scatter-axis" }));
  svg.append(createSvgElement("line", { x1: centerX, y1: margin.top, x2: centerX, y2: margin.top + plotHeight, class: "scatter-axis" }));

  addText(svg, "Home-favorable metric profile", { x: centerX + 16, y: margin.top + 24, class: "scatter-label label-home" });
  addText(svg, "Road-favorable metric profile", { x: margin.left + 16, y: margin.top + plotHeight - 18, class: "scatter-label label-road" });
  addText(svg, "Foul differential: road minus home", { x: centerX - 116, y: height - 24, class: "scatter-axis-label" });
  addText(svg, "Confidence-adjusted home bias index", {
    x: -centerY - 156,
    y: 24,
    transform: "rotate(-90)",
    class: "scatter-axis-label"
  });

  return { svg, width, height, margin, plotWidth, plotHeight, centerX, centerY, maxX, maxY };
}

function drawConclusionScatter(profiles, el) {
  const container = el.conclusionScatter;
  const tooltip = el.profileTooltip;
  container.innerHTML = "";
  if (tooltip) {
    tooltip.classList.remove("visible");
    container.append(tooltip);
  }

  const chart = createBaseSvg(profiles);
  const { svg, width, height, margin, plotWidth, plotHeight, centerX, centerY, maxX, maxY } = chart;
  const maxGames = Math.max(1, ...profiles.map((profile) => profile.games_officiated));
  const xFor = (value) => centerX + (value / maxX) * (plotWidth / 2);
  const yFor = (value) => centerY - (value / maxY) * (plotHeight / 2);

  if (!profiles.length) {
    addText(svg, "No referee profiles were returned by the backend.", { x: margin.left, y: margin.top + 42, class: "scatter-empty" });
    container.append(svg);
    return;
  }

  const dotsLayer = createSvgElement("g", { class: "scatter-dots" });

  profiles.forEach((profile, index) => {
    const quadrant = quadrantFor(profile);
    const x = xFor(profile.x);
    const y = yFor(profile.y);
    const radius = 5 + Math.sqrt(profile.games_officiated / maxGames) * 9;
    const dot = createSvgElement("circle", {
      cx: x,
      cy: y,
      r: radius,
      tabindex: 0,
      class: `scatter-dot ${quadrant}`,
      "data-profile-index": index,
      "aria-label": `${profile.referee}, ${quadrantLabel(quadrant)}`
    });

    dot.addEventListener("mouseenter", () => selectProfile(dot, profile, el, x, y));
    dot.addEventListener("mousemove", () => positionTooltip(el, x, y));
    dot.addEventListener("mouseleave", () => hideTooltip(el));
    dot.addEventListener("focus", () => selectProfile(dot, profile, el, x, y));
    dot.addEventListener("blur", () => hideTooltip(el));
    dot.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectProfile(dot, profile, el, x, y);
      }
    });

    dotsLayer.append(dot);
  });

  svg.append(dotsLayer);
  container.append(svg);
}

function selectProfile(dot, profile, el, x, y) {
  el.selectedProfile.innerHTML = profileSummary(profile);
  el.profileTooltip.innerHTML = profileSummary(profile);
  el.conclusionScatter.querySelectorAll(".scatter-dot").forEach((node) => {
    node.classList.toggle("hovered", node === dot);
  });
  el.profileTooltip.classList.add("visible");
  positionTooltip(el, x, y);
}

function positionTooltip(el, x, y) {
  const containerRect = el.conclusionScatter.getBoundingClientRect();
  const svg = el.conclusionScatter.querySelector("svg");
  if (!svg) return;

  const svgRect = svg.getBoundingClientRect();
  const tooltipWidth = el.profileTooltip.offsetWidth || 260;
  const tooltipHeight = el.profileTooltip.offsetHeight || 190;
  const scaleX = containerRect.width / 960;
  const scaleY = svgRect.height / 560;
  const dotLeft = x * scaleX;
  const dotTop = y * scaleY;
  const preferredLeft = dotLeft + 14;
  const preferredTop = dotTop + 14;
  const left = preferredLeft + tooltipWidth > containerRect.width - 12
    ? Math.max(12, dotLeft - tooltipWidth - 14)
    : Math.max(12, preferredLeft);
  const top = preferredTop + tooltipHeight > svgRect.height - 12
    ? Math.max(12, dotTop - tooltipHeight - 14)
    : Math.max(12, preferredTop);

  el.profileTooltip.style.left = `${left}px`;
  el.profileTooltip.style.top = `${top}px`;
}

function hideTooltip(el) {
  el.profileTooltip.classList.remove("visible");
}
