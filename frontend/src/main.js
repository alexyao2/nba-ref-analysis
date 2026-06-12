import { parseCsv } from "./data/csv.js";
import {
  getFoulDifferentialLeaders,
  getOverviewMetrics,
  getReferees,
  getSeasons,
  getSplits,
  normalizeApiReferee,
} from "./services/api.js";
import { state } from "./state.js";
import { filteredRecords, populateFilters, populateFiltersFromApi } from "./services/filters.js";
import { aggregateByReferee } from "./services/refereeMetrics.js";
import { drawLeaderChart, drawSignalChart } from "./ui/chart.js";
import { el } from "./ui/dom.js";
import { bindNavigation, showPage } from "./ui/nav.js";
import { renderConclusions } from "./ui/renderConclusions.js";
import {
  renderMetrics,
  renderMetricsFromApi,
  renderWatchlist,
  renderWatchlistFromApi,
} from "./ui/renderMetrics.js";
import { renderGameCards, renderRefTable } from "./ui/renderTables.js";

let renderRequestId = 0;

function renderCsvDashboard() {
  const records = filteredRecords(state.records, state.filters);
  const groups = aggregateByReferee(records, state.sortBest);

  renderMetrics(groups, records, el);
  renderWatchlist(groups, el);
  renderRefTable(groups, el);
  renderGameCards(records, el);
  drawLeaderChart(groups, el);
  drawSignalChart(records, el);
}

async function renderApiDashboard() {
  const requestId = ++renderRequestId;
  state.loading = true;
  state.error = null;
  el.recordCount.textContent = "Loading backend data";

  try {
    const [rows, overview, leadersPayload] = await Promise.all([
      getReferees(state.filters),
      getOverviewMetrics(state.filters),
      getFoulDifferentialLeaders(state.filters, 3),
    ]);

    if (requestId !== renderRequestId) return;

    state.records = rows.map(normalizeApiReferee);

    const displayRecords = filteredRecords(state.records, {
      ...state.filters,
      season: "all",
      split: "all",
      minGames: 1,
    });
    const groups = aggregateByReferee(displayRecords, state.sortBest);

    renderMetricsFromApi(overview, displayRecords, el);
    renderWatchlistFromApi(leadersPayload.leaders || [], el);
    renderRefTable(groups, el);
    renderGameCards(displayRecords, el);
    drawLeaderChart(groups, el);
    drawSignalChart(displayRecords, el);
  } catch (error) {
    if (requestId !== renderRequestId) return;

    state.error = error.message;
    el.recordCount.textContent = "Backend unavailable";
    el.watchlist.innerHTML = '<p class="empty">Start the backend API to load dashboard data.</p>';
    el.refTable.innerHTML = '<tr><td colspan="8">Backend data failed to load.</td></tr>';
    el.gameCards.innerHTML = '<p class="empty">Backend data failed to load.</p>';
  } finally {
    if (requestId === renderRequestId) {
      state.loading = false;
    }
  }
}

function render() {
  if (state.dataMode === "csv") {
    renderCsvDashboard();
  } else {
    renderApiDashboard();
  }

  renderConclusions(el);
}

function resetFilters() {
  state.filters = { season: "all", split: "all", minGames: 1, query: "" };
  el.minGames.value = "1";
  el.minGamesValue.textContent = "1";
  el.seasonFilter.value = "all";
  el.teamFilter.value = "all";
  el.searchInput.value = "";
}

async function loadApiFilters() {
  const [seasonPayload, splitPayload] = await Promise.all([
    getSeasons(),
    getSplits(),
  ]);

  populateFiltersFromApi(seasonPayload.seasons || [], splitPayload.splits || [], el);
}

function bindControls() {
  el.seasonFilter.addEventListener("change", (event) => {
    state.filters.season = event.target.value;
    render();
  });

  el.teamFilter.addEventListener("change", (event) => {
    state.filters.split = event.target.value;
    render();
  });

  el.minGames.addEventListener("input", (event) => {
    state.filters.minGames = Number(event.target.value);
    el.minGamesValue.textContent = event.target.value;
    render();
  });

  el.searchInput.addEventListener("input", (event) => {
    state.filters.query = event.target.value;
    render();
  });

  el.sortToggle.addEventListener("click", () => {
    state.sortBest = !state.sortBest;
    el.sortToggle.textContent = `Sort: ${state.sortBest ? "Most Games" : "Fewest Games"}`;
    render();
  });

  el.csvInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imported = parseCsv(await file.text()).filter((record) => record.referee && record.season);
    if (imported.length) {
      state.dataMode = "csv";
      state.records = imported;
      resetFilters();
      populateFilters(state.records, el);
      render();
    }
  });

  el.resetData.addEventListener("click", async () => {
    state.dataMode = "api";
    resetFilters();
    await loadApiFilters();
    render();
  });

  window.addEventListener("resize", render);
}

async function init() {
  await loadApiFilters();
  bindNavigation(render);
  bindControls();

  const hashPage = {
    "#intro": "intro-page",
    "#data": "data-page",
    "#future": "future-page",
  }[window.location.hash];

  if (hashPage) {
    showPage(hashPage, render, false);
  }

  render();
}

init().catch((error) => {
  console.error(error);
  el.recordCount.textContent = "Backend data failed to load";
});
