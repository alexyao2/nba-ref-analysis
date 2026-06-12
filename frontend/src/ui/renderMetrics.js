import { formatNumber, formatPct, splitLabel } from "../data/normalize.js";
import { scoreClass } from "../services/refereeMetrics.js";

export function renderMetrics(groups, records, el) {
  const games = records.reduce((sum, record) => sum + (record.gamesOfficiated || 0), 0);
  const avg = (field) => {
    const weighted = records.reduce((sum, record) => sum + ((record[field] || 0) * (record.gamesOfficiated || 0)), 0);
    return games ? weighted / games : 0;
  };
  const seasons = new Set(records.map((record) => record.season)).size;

  el.overallScore.textContent = formatPct(avg("homeTeamWinPct"));
  el.overallTrend.textContent = "Weighted by games officiated";
  el.challengeRate.textContent = formatNumber(avg("calledFoulsPerGame"), 1);
  el.noCallSeverity.textContent = formatNumber(avg("homeTeamPointDifferential"), 1);
  el.mediaRisk.textContent = formatNumber(games, 0);
  el.recordCount.textContent = `${records.length} rows · ${seasons} seasons`;
}

export function renderMetricsFromApi(overview, records, el) {
  const seasons = new Set(records.map((record) => record.season)).size;

  el.overallScore.textContent = formatPct(overview.avg_home_win_pct);
  el.overallTrend.textContent = "From backend weighted metrics";
  el.challengeRate.textContent = formatNumber(overview.avg_fouls_per_game, 1);
  el.noCallSeverity.textContent = formatNumber(overview.avg_home_pts_diff, 1);
  el.mediaRisk.textContent = formatNumber(overview.total_games, 0);
  el.recordCount.textContent = `${overview.total_rows} rows · ${seasons} seasons`;
}

export function renderWatchlist(groups, el) {
  const watch = [...groups]
    .sort((a, b) => Math.abs(b.foulDifferentialRoadMinusHome || 0) - Math.abs(a.foulDifferentialRoadMinusHome || 0))
    .slice(0, 3);

  el.watchlist.innerHTML = watch.map((group) => `
    <article class="watch-card">
      <div class="watch-score">
        <strong>${group.referee}</strong>
        <span class="score-chip ${scoreClass(group.balanceScore)}">${formatNumber(group.foulDifferentialRoadMinusHome, 1)}</span>
      </div>
      <div class="bar"><span style="width: ${Math.min(100, Math.max(8, Math.abs(group.foulDifferentialRoadMinusHome || 0) * 20))}%"></span></div>
      <span>${group.season} · ${splitLabel(group.split)} · ${group.gamesOfficiated} games · ${group.role || "role n/a"}</span>
    </article>
  `).join("") || '<p class="empty">No rows match the current filters.</p>';
}

export function renderWatchlistFromApi(leaders, el) {
  el.watchlist.innerHTML = leaders.map((leader) => {
    const value = Number(leader.foul_differential_road_minus_home || 0);

    return `
      <article class="watch-card">
        <div class="watch-score">
          <strong>${leader.referee}</strong>
          <span class="score-chip ${scoreClass(Math.max(0, 100 - Math.abs(value) * 12))}">${formatNumber(value, 1)}</span>
        </div>
        <div class="bar"><span style="width: ${Math.min(100, Math.max(8, Math.abs(value) * 20))}%"></span></div>
        <span>${leader.season} · ${splitLabel(leader.split)} · ${leader.games_officiated} games · ${leader.role || "role n/a"}</span>
      </article>
    `;
  }).join("") || '<p class="empty">No backend leader rows match the current filters.</p>';
}
