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
