export function normalizeRecord(record) {
  return {
    season: record.season,
    split: record.split || "regular_season",
    referee: record.referee,
    role: record.role || "",
    gender: record.gender || "",
    experienceYears: toNumber(record.experience_years),
    gamesOfficiated: toNumber(record.games_officiated),
    homeTeamWinPct: toNumber(record.home_team_win_pct),
    homeTeamPointDifferential: toNumber(record.home_team_point_differential),
    totalPointsPerGame: toNumber(record.total_points_per_game),
    calledFoulsPerGame: toNumber(record.called_fouls_per_game),
    foulPctAgainstRoadTeams: toNumber(record.foul_pct_against_road_teams),
    foulPctAgainstHomeTeams: toNumber(record.foul_pct_against_home_teams),
    foulDifferentialRoadMinusHome: toNumber(record.foul_differential_road_minus_home),
    sourceUpdatedNote: record.source_updated_note || "",
    sourceUrl: record.source_url || ""
  };
}

export function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toFixed(digits).replace(/\.0$/, "");
}

export function formatPct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${Math.round(value * 1000) / 10}%`;
}

export function splitLabel(value) {
  return value === "playoffs" ? "Playoffs" : "Regular season";
}
