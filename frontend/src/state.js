export const state = {
  dataMode: "api",
  loading: false,
  error: null,
  records: [],
  sortBest: true,
  filters: {
    season: "all",
    split: "all",
    minGames: 1,
    query: ""
  }
};
