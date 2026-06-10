from fastapi import FastAPI, HTTPException
from data.csv_loader import load_csv_rows
from services.metrics_service import (
    build_overview_metrics,
    consistency_analysis,
    foul_differential,
    foul_differential_leaders,
    home_bias_index,
    outlier_analysis,
)
from services.referee_service import filter_rows, get_seasons, get_splits

app = FastAPI()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/referees")
def get_referees(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
):
    return filter_rows(load_csv_rows(), season, split, min_games)

@app.get("/api/seasons")
def get_available_seasons():
    rows = load_csv_rows()
    return {"seasons": get_seasons(rows)}

@app.get("/api/splits")
def get_available_splits():
    rows = load_csv_rows()
    return {"splits": get_splits(rows)}


@app.get("/api/metrics/overview")
def get_overview_metrics(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
):
    rows = filter_rows(load_csv_rows(), season, split, min_games)
    return build_overview_metrics(rows)

@app.get("/api/metrics/foul-differential")
def get_foul_differential(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
):
    rows = filter_rows(load_csv_rows(), season, split, min_games)
    return {"foul_differential": foul_differential(rows)}


@app.get("/api/metrics/foul-differential/leaders")
def get_foul_differential_leaders(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
    limit: int = 10,
):
    rows = filter_rows(load_csv_rows(), season, split, min_games)
    return {"leaders": foul_differential_leaders(rows, limit)}


@app.get("/api/metrics/home-bias")
def get_home_bias_index(
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
    limit: int = 10,
):
    rows = filter_rows(load_csv_rows(), season, split, min_games)
    return home_bias_index(rows, limit)


@app.get("/api/metrics/outliers")
def get_outlier_analysis(
    field: str = "foul_differential_road_minus_home",
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
    threshold: float = 2.0,
    limit: int = 20,
):
    rows = filter_rows(load_csv_rows(), season, split, min_games)
    try:
        return {
            "field": field,
            "threshold": threshold,
            "outliers": outlier_analysis(rows, field, threshold, limit),
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.get("/api/metrics/consistency")
def get_consistency_analysis(
    field: str = "foul_differential_road_minus_home",
    season: str | None = None,
    split: str | None = None,
    min_games: int | None = None,
    limit: int = 20,
):
    rows = filter_rows(load_csv_rows(), season, split, min_games)
    try:
        return {
            "field": field,
            "results": consistency_analysis(rows, field, limit),
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
