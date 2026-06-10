export function aggregateByReferee(records, sortBest = true) {
  const groups = new Map();

  records.forEach((record) => {
    const key = `${record.referee}|${record.season}|${record.split}|${record.role}`;

    if (!groups.has(key)) {
      groups.set(key, {
        referee: record.referee,
        season: record.season,
        split: record.split,
        role: record.role,
        gender: record.gender,
        sourceUrl: record.sourceUrl,
        records: 0,
        gamesOfficiated: 0,
        homeTeamWinPctWeighted: 0,
        homeTeamPointDifferentialWeighted: 0,
        totalPointsWeighted: 0,
        calledFoulsWeighted: 0,
        foulDifferentialWeighted: 0,
        weight: 0
      });
    }

    const group = groups.get(key);
    const games = record.gamesOfficiated || 0;
    group.records += 1;
    group.gamesOfficiated += games;
    group.weight += games;
    group.homeTeamWinPctWeighted += (record.homeTeamWinPct || 0) * games;
    group.homeTeamPointDifferentialWeighted += (record.homeTeamPointDifferential || 0) * games;
    group.totalPointsWeighted += (record.totalPointsPerGame || 0) * games;
    group.calledFoulsWeighted += (record.calledFoulsPerGame || 0) * games;
    group.foulDifferentialWeighted += (record.foulDifferentialRoadMinusHome || 0) * games;
  });

  return [...groups.values()]
    .map((group) => {
      const weight = group.weight || 1;
      const foulDifferential = group.foulDifferentialWeighted / weight;
      const pointDifferential = group.homeTeamPointDifferentialWeighted / weight;

      return {
        ...group,
        homeTeamWinPct: group.homeTeamWinPctWeighted / weight,
        homeTeamPointDifferential: pointDifferential,
        totalPointsPerGame: group.totalPointsWeighted / weight,
        calledFoulsPerGame: group.calledFoulsWeighted / weight,
        foulDifferentialRoadMinusHome: foulDifferential,
        balanceScore: Math.max(0, 100 - Math.abs(foulDifferential || 0) * 12 - Math.abs(pointDifferential || 0) * 2)
      };
    })
    .sort((a, b) => sortBest ? b.gamesOfficiated - a.gamesOfficiated : a.gamesOfficiated - b.gamesOfficiated);
}

export function scoreClass(score) {
  if (score >= 86) return "score-good";
  if (score >= 72) return "score-mid";
  return "score-low";
}
