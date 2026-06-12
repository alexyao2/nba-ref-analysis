import pytest # type: ignore

from services.metrics_service import (
    build_overview_metrics,
    conclusion_scatter_profiles,
    consistency_analysis,
    foul_differential,
    foul_differential_leaders,
    home_bias_index,
    outlier_analysis,
    validate_metric_field,
    weighted_average,
    weighted_std_dev,
)


def referee_row(
    referee,
    games,
    called_fouls,
    foul_diff,
    home_win_pct=0.5,
    home_point_diff=0,
    season="2025-26",
    split="regular_season",
    role="CREW",
):
    return {
        "referee": referee,
        "season": season,
        "split": split,
        "role": role,
        "games_officiated": str(games),
        "home_team_win_pct": str(home_win_pct),
        "home_team_point_differential": str(home_point_diff),
        "total_points_per_game": "225",
        "called_fouls_per_game": str(called_fouls),
        "foul_pct_against_road_teams": "0.52",
        "foul_pct_against_home_teams": "0.48",
        "foul_differential_road_minus_home": str(foul_diff),
    }


def test_weighted_average_fouls():
    rows = [
        referee_row("Ref A", games=2, called_fouls=10, foul_diff=0),
        referee_row("Ref B", games=8, called_fouls=20, foul_diff=0),
    ]
    assert weighted_average(rows, "called_fouls_per_game") == 18


def test_weighted_average_no_games():
    rows = [
        referee_row("Ref A", games=0, called_fouls=10, foul_diff=0),
        referee_row("Ref B", games=0, called_fouls=20, foul_diff=0),
    ]
    assert weighted_average(rows, "called_fouls_per_game") == 0


def test_weighted_average_blank_values():
    rows = [
        referee_row("Ref A", games=2, called_fouls="", foul_diff=0),
        referee_row("Ref B", games=8, called_fouls=20, foul_diff=0),
    ]
    assert weighted_average(rows, "called_fouls_per_game") == 16


def test_weighted_std_dev():
    rows = [
        referee_row("Ref A", games=2, called_fouls=10, foul_diff=0),
        referee_row("Ref B", games=8, called_fouls=20, foul_diff=0),
    ]
    assert weighted_std_dev(rows, "called_fouls_per_game") == 4


def test_validate_metric_field_rejects_unknown_field():
    with pytest.raises(ValueError, match="Invalid metric field"):
        validate_metric_field("made_up_metric")


def test_build_overview_metrics_uses_weighted_values():
    rows = [
        referee_row("Ref A", games=2, called_fouls=10, foul_diff=0, home_win_pct=0.5, home_point_diff=1),
        referee_row("Ref B", games=8, called_fouls=20, foul_diff=0, home_win_pct=0.75, home_point_diff=3),
    ]

    overview = build_overview_metrics(rows)

    assert overview["total_rows"] == 2
    assert overview["total_games"] == 10
    assert overview["avg_fouls_per_game"] == 18
    assert overview["avg_home_win_pct"] == 0.7
    assert overview["avg_home_pts_diff"] == 2.6


def test_foul_differential():
    rows = [
        referee_row("Ref A", games=2, called_fouls=10, foul_diff=2),
        referee_row("Ref B", games=8, called_fouls=20, foul_diff=4),
    ]
    assert foul_differential(rows) == 3.6


def test_foul_differential_leaders_sorts_by_absolute_gap():
    rows = [
        referee_row("Small Positive", games=10, called_fouls=20, foul_diff=1),
        referee_row("Large Negative", games=10, called_fouls=20, foul_diff=-5),
        referee_row("Medium Positive", games=10, called_fouls=20, foul_diff=3),
    ]

    leaders = foul_differential_leaders(rows, limit=2)

    assert [leader["referee"] for leader in leaders] == ["Large Negative", "Medium Positive"]
    assert leaders[0]["interpretation"] == "More fouls called against home teams"


def test_outlier_analysis_flags_large_deviation():
    rows = [
        referee_row("Ref A", games=1, called_fouls=20, foul_diff=0),
        referee_row("Ref B", games=1, called_fouls=20, foul_diff=0),
        referee_row("Ref C", games=1, called_fouls=20, foul_diff=0),
        referee_row("Ref D", games=1, called_fouls=20, foul_diff=0),
        referee_row("Outlier Ref", games=1, called_fouls=75, foul_diff=0),
    ]

    outliers = outlier_analysis(rows, "called_fouls_per_game")

    assert len(outliers) == 1
    assert outliers[0]["referee"] == "Outlier Ref"
    assert outliers[0]["called_fouls_per_game"] == 75.0
    assert outliers[0]["interpretation"] == "Significantly above average"


def test_home_bias_index_returns_home_and_road_lists():
    rows = [
        referee_row("Baseline", games=50, called_fouls=20, foul_diff=0, home_win_pct=0.5, home_point_diff=0),
        referee_row("Home Profile", games=50, called_fouls=20, foul_diff=3, home_win_pct=0.8, home_point_diff=8),
        referee_row("Road Profile", games=50, called_fouls=20, foul_diff=-3, home_win_pct=0.2, home_point_diff=-8),
    ]

    result = home_bias_index(rows, limit=1)

    assert result["home_favorable"][0]["referee"] == "Home Profile"
    assert result["road_favorable"][0]["referee"] == "Road Profile"
    assert "baseline" in result


def test_conclusion_scatter_profiles_returns_graph_payload():
    rows = [
        referee_row("Baseline", games=50, called_fouls=20, foul_diff=0, home_win_pct=0.5, home_point_diff=0),
        referee_row("Home Profile", games=50, called_fouls=20, foul_diff=3, home_win_pct=0.8, home_point_diff=8),
        referee_row("Road Profile", games=50, called_fouls=20, foul_diff=-3, home_win_pct=0.2, home_point_diff=-8),
    ]

    payload = conclusion_scatter_profiles(rows, limit=2)

    assert payload["x_axis"] == "Foul differential: road minus home"
    assert payload["y_axis"] == "Confidence-adjusted home bias index"
    assert payload["profile_count"] == 2
    assert payload["source_row_count"] == 3
    assert len(payload["profiles"]) == 2
    assert {"home_favorable", "road_favorable"} == set(payload["summary"])
    assert {"referee", "x", "y", "confidence_adjusted_index"}.issubset(payload["profiles"][0])


def test_consistency_analysis_groups_by_referee():
    rows = [
        referee_row("Stable Ref", games=20, called_fouls=20, foul_diff=1, season="2023-24"),
        referee_row("Stable Ref", games=20, called_fouls=20, foul_diff=1, season="2024-25"),
        referee_row("Variable Ref", games=20, called_fouls=20, foul_diff=-4, season="2023-24"),
        referee_row("Variable Ref", games=20, called_fouls=20, foul_diff=4, season="2024-25"),
    ]

    results = consistency_analysis(rows, "foul_differential_road_minus_home", limit=2)

    assert results[0]["referee"] == "Variable Ref"
    assert results[0]["seasons_counted"] == 2
    assert results[0]["rows_counted"] == 2
    assert results[0]["volatility_ratio"] > results[1]["volatility_ratio"]
