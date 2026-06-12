import { splitLabel } from "../data/normalize.js";

export function filteredRecords(records, filters) {
  return records.filter((record) => {
    const seasonMatch = filters.season === "all" || record.season === filters.season;
    const splitMatch = filters.split === "all" || record.split === filters.split;
    const gamesMatch = (record.gamesOfficiated || 0) >= filters.minGames;
    const haystack = `${record.referee} ${record.role} ${record.gender} ${record.season} ${splitLabel(record.split)}`.toLowerCase();

    return seasonMatch && splitMatch && gamesMatch && haystack.includes(filters.query.toLowerCase());
  });
}

export function populateFilters(records, el) {
  const seasons = [...new Set(records.map((record) => record.season).filter(Boolean))].sort().reverse();
  const splits = [...new Set(records.map((record) => record.split).filter(Boolean))].sort();

  el.seasonFilter.innerHTML = '<option value="all">All seasons</option>'
    + seasons.map((season) => `<option value="${season}">${season}</option>`).join("");
  el.teamFilter.innerHTML = '<option value="all">All splits</option>'
    + splits.map((split) => `<option value="${split}">${splitLabel(split)}</option>`).join("");
}

export function populateFiltersFromApi(seasons, splits, el) {
  el.seasonFilter.innerHTML = '<option value="all">All seasons</option>'
    + seasons.map((season) => `<option value="${season}">${season}</option>`).join("");
  el.teamFilter.innerHTML = '<option value="all">All splits</option>'
    + splits.map((split) => `<option value="${split}">${splitLabel(split)}</option>`).join("");
}
