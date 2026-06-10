import { parseCsv, loadRefereeCsv } from "./data/csv.js";
import { state } from "./state.js";
import { filteredRecords, populateFilters } from "./services/filters.js";
import { aggregateByReferee } from "./services/refereeMetrics.js";
import { drawLeaderChart, drawSignalChart } from "./ui/chart.js";
import { el } from "./ui/dom.js";
import { bindNavigation, showPage } from "./ui/nav.js";
import { renderMetrics, renderWatchlist } from "./ui/renderMetrics.js";
import { renderGameCards, renderRefTable } from "./ui/renderTables.js";

function render() {
  const records = filteredRecords(state.records, state.filters);
  const groups = aggregateByReferee(records, state.sortBest);

  renderMetrics(groups, records, el);
  renderWatchlist(groups, el);
  renderRefTable(groups, el);
  renderGameCards(records, el);
  drawLeaderChart(groups, el);
  drawSignalChart(records, el);
}

function resetFilters() {
  state.filters = { season: "all", split: "all", minGames: 1, query: "" };
  el.minGames.value = "1";
  el.minGamesValue.textContent = "1";
  el.seasonFilter.value = "all";
  el.teamFilter.value = "all";
  el.searchInput.value = "";
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
      state.records = imported;
      resetFilters();
      populateFilters(state.records, el);
      render();
    }
  });

  el.resetData.addEventListener("click", async () => {
    state.records = await loadRefereeCsv();
    resetFilters();
    populateFilters(state.records, el);
    render();
  });

  window.addEventListener("resize", render);
}

async function init() {
  state.records = await loadRefereeCsv();
  populateFilters(state.records, el);
  bindNavigation(render);
  bindControls();

  const hashPage = {
    "#intro": "intro-page",
    "#data": "data-page",
    "#future": "future-page"
  }[window.location.hash];

  if (hashPage) {
    showPage(hashPage, render, false);
  }

  render();
}

init().catch((error) => {
  console.error(error);
  el.recordCount.textContent = "Data failed to load";
});
