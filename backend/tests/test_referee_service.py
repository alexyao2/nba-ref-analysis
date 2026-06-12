from services.referee_service import to_float
from services.referee_service import filter_rows
from services.referee_service import get_seasons
from services.referee_service import get_splits

def test_to_float():
    assert to_float("3.14") == 3.14
    assert to_float("2.718") == 2.718

def test_to_float_blank():
    assert to_float("") == 0.0
    assert to_float("   ") == 0.0

def test_to_float_none():
    assert to_float(None) == 0.0

def test_filter_rows_min():
    rows = [
        {"season": "2025-26", "split": "regular-season", "games_officiated": "10"},
        {"season": "2025-26", "split": "regular-season", "games_officiated": "40"},
    ]
    result = filter_rows(rows, min_games=20)
    assert len(result) == 1
    assert result[0]["games_officiated"] == "40"


def test_filter_rows_by_season_and_split():
    rows = [
        {"season": "2025-26", "split": "regular_season", "games_officiated": "40"},
        {"season": "2025-26", "split": "playoffs", "games_officiated": "8"},
        {"season": "2024-25", "split": "regular_season", "games_officiated": "55"},
    ]

    result = filter_rows(rows, season="2025-26", split="regular_season")

    assert result == [
        {"season": "2025-26", "split": "regular_season", "games_officiated": "40"}
    ]


def test_filter_rows_combines_all_filters():
    rows = [
        {"season": "2025-26", "split": "regular_season", "games_officiated": "10"},
        {"season": "2025-26", "split": "regular_season", "games_officiated": "40"},
        {"season": "2025-26", "split": "playoffs", "games_officiated": "40"},
        {"season": "2024-25", "split": "regular_season", "games_officiated": "40"},
    ]

    result = filter_rows(rows, season="2025-26", split="regular_season", min_games=20)

    assert len(result) == 1
    assert result[0]["games_officiated"] == "40"


def test_get_seasons():
    rows = [
        {"season": "2025-26"},
        {"season": "2024-25"},
        {"season": "2025-26"},
    ]
    seasons = get_seasons(rows)
    assert seasons == ["2025-26", "2024-25"]

def test_get_splits():
    rows = [
        {"split": "regular-season"},
        {"split": "playoffs"},
        {"split": "regular-season"},
    ]
    splits = get_splits(rows)
    assert splits == ["playoffs", "regular-season"]
