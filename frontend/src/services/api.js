const API_BASE = window.WHISTLERATE_API_BASE || "http://127.0.0.1:8000";

export async function fetchJson(path, params = {}) {
  const query = new URLSearchParams(params);
  const url = query.toString() ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export function apiParams(filters) {
  const params = {};

  if (filters.season !== "all") params.season = filters.season;
  if (filters.split !== "all") params.split = filters.split;
  if (filters.minGames) params.min_games = filters.minGames;

  return params;
}

export function getReferees(filters) {
  return fetchJson("/api/referees", apiParams(filters));
}

export function getSeasons() {
  return fetchJson("/api/seasons");
}

export function getSplits() {
  return fetchJson("/api/splits");
}

export function getOverviewMetrics(filters) {
  return fetchJson("/api/metrics/overview", apiParams(filters));
}

export function getFoulDifferentialLeaders(filters, limit = 3) {
  return fetchJson("/api/metrics/foul-differential/leaders", {
    ...apiParams(filters),
    limit,
  });
}

export function normalizeApiReferee(row) {
  return {
    season: row.season,
    split: row.split || "regular_season",
    referee: row.referee,
    role: row.role || "",
    gender: row.gender || "",
    experienceYears: toNumber(row.experience_years),
    gamesOfficiated: toNumber(row.games_officiated),
    homeTeamWinPct: toNumber(row.home_team_win_pct),
    homeTeamPointDifferential: toNumber(row.home_team_point_differential),
    totalPointsPerGame: toNumber(row.total_points_per_game),
    calledFoulsPerGame: toNumber(row.called_fouls_per_game),
    foulPctAgainstRoadTeams: toNumber(row.foul_pct_against_road_teams),
    foulPctAgainstHomeTeams: toNumber(row.foul_pct_against_home_teams),
    foulDifferentialRoadMinusHome: toNumber(row.foul_differential_road_minus_home),
    sourceUpdatedNote: row.source_updated_note || "",
    sourceUrl: row.source_url || "",
  };
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
