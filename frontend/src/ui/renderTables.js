import { formatNumber, formatPct, splitLabel } from "../data/normalize.js";

export function renderRefTable(groups, el) {
  el.refTable.innerHTML = groups.map((group) => `
    <tr>
      <td><strong>${group.referee}</strong></td>
      <td>${group.season}</td>
      <td>${splitLabel(group.split)}</td>
      <td>${group.role || "--"}</td>
      <td>${group.gamesOfficiated}</td>
      <td>${formatPct(group.homeTeamWinPct)}</td>
      <td>${formatNumber(group.calledFoulsPerGame, 1)}</td>
      <td>${formatNumber(group.foulDifferentialRoadMinusHome, 1)}</td>
    </tr>
  `).join("") || '<tr><td colspan="8">No referee rows match the current filters.</td></tr>';
}

export function renderGameCards(records, el) {
  const rows = [...records]
    .sort((a, b) => (b.gamesOfficiated || 0) - (a.gamesOfficiated || 0))
    .slice(0, 48);

  el.gameCards.innerHTML = rows.map((record) => `
    <article class="game-card">
      <strong>${record.referee}</strong>
      <span class="game-meta">${record.season} · ${splitLabel(record.split)} · ${record.role || "role n/a"}</span>
      <div class="game-stats">
        <span>Games <b>${record.gamesOfficiated ?? "--"}</b></span>
        <span>Home win <b>${formatPct(record.homeTeamWinPct)}</b></span>
        <span>Fouls/gm <b>${formatNumber(record.calledFoulsPerGame, 1)}</b></span>
      </div>
      <span class="game-meta">Home diff ${formatNumber(record.homeTeamPointDifferential, 1)} · Foul diff ${formatNumber(record.foulDifferentialRoadMinusHome, 1)}</span>
    </article>
  `).join("") || '<p class="empty">No season records match the current filters.</p>';
}
