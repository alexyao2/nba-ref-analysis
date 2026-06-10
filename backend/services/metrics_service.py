from services.referee_service import to_float


ALLOWED_METRIC_FIELDS = {
    "home_team_win_pct",
    "home_team_point_differential",
    "total_points_per_game",
    "called_fouls_per_game",
    "foul_pct_against_road_teams",
    "foul_pct_against_home_teams",
    "foul_differential_road_minus_home",
}


def validate_metric_field(field):
    if field not in ALLOWED_METRIC_FIELDS:
        valid_fields = ", ".join(sorted(ALLOWED_METRIC_FIELDS))
        raise ValueError(f"Invalid metric field. Choose one of: {valid_fields}")
    return field


def weighted_average(rows, field):
    validate_metric_field(field)
    total_games = sum(to_float(row["games_officiated"]) for row in rows)
    if total_games == 0:
        return 0

    weighted_sum = sum(
        to_float(row[field]) * to_float(row["games_officiated"])
        for row in rows
    )
    return weighted_sum / total_games


def weighted_std_dev(rows, field):
    validate_metric_field(field)
    total_games = sum(to_float(row["games_officiated"]) for row in rows)
    if total_games == 0:
        return 0

    mean = weighted_average(rows, field)
    variance = sum(
        ((to_float(row[field]) - mean) ** 2) * to_float(row["games_officiated"])
        for row in rows
    ) / total_games
    return variance ** 0.5


def z_score(value, mean, std_dev):
    if std_dev == 0:
        return 0
    return (value - mean) / std_dev


def build_overview_metrics(rows):
    total_games = sum(to_float(row["games_officiated"]) for row in rows)

    return {
        "total_rows": len(rows),
        "total_games": total_games,
        "avg_home_win_pct": weighted_average(rows, "home_team_win_pct"),
        "avg_fouls_per_game": weighted_average(rows, "called_fouls_per_game"),
        "avg_home_pts_diff": weighted_average(rows, "home_team_point_differential"),
    }


def foul_differential(rows):
    return weighted_average(rows, "foul_differential_road_minus_home")


def foul_differential_leaders(rows, limit=10):
    ranked = sorted(
        rows,
        key=lambda row: abs(to_float(row["foul_differential_road_minus_home"])),
        reverse=True,
    )

    return [
        {
            "referee": row["referee"],
            "season": row["season"],
            "split": row["split"],
            "role": row["role"],
            "games_officiated": to_float(row["games_officiated"]),
            "foul_differential_road_minus_home": to_float(row["foul_differential_road_minus_home"]),
            "interpretation": interpret_foul_differential(row["foul_differential_road_minus_home"]),
        }
        for row in ranked[:limit]
    ]


def interpret_foul_differential(value):
    differential = to_float(value)
    if differential > 0:
        return "More fouls called against road teams"
    if differential < 0:
        return "More fouls called against home teams"
    return "Even foul split"


def home_bias_baseline(rows):
    return {
        "home_team_win_pct": {
            "mean": weighted_average(rows, "home_team_win_pct"),
            "std_dev": weighted_std_dev(rows, "home_team_win_pct"),
        },
        "home_team_point_differential": {
            "mean": weighted_average(rows, "home_team_point_differential"),
            "std_dev": weighted_std_dev(rows, "home_team_point_differential"),
        },
        "foul_differential_road_minus_home": {
            "mean": weighted_average(rows, "foul_differential_road_minus_home"),
            "std_dev": weighted_std_dev(rows, "foul_differential_road_minus_home"),
        },
    }


def confidence_score(games_officiated):
    games = to_float(games_officiated)
    return games / (games + 25) if games > 0 else 0


def home_bias_index_for_row(row, baseline):
    home_win_z = z_score(
        to_float(row["home_team_win_pct"]),
        baseline["home_team_win_pct"]["mean"],
        baseline["home_team_win_pct"]["std_dev"],
    )
    point_diff_z = z_score(
        to_float(row["home_team_point_differential"]),
        baseline["home_team_point_differential"]["mean"],
        baseline["home_team_point_differential"]["std_dev"],
    )
    foul_diff_z = z_score(
        to_float(row["foul_differential_road_minus_home"]),
        baseline["foul_differential_road_minus_home"]["mean"],
        baseline["foul_differential_road_minus_home"]["std_dev"],
    )

    raw_index = (0.35 * home_win_z) + (0.35 * point_diff_z) + (0.30 * foul_diff_z)
    confidence = confidence_score(row["games_officiated"])

    return {
        "referee": row["referee"],
        "season": row["season"],
        "split": row["split"],
        "role": row["role"],
        "games_officiated": to_float(row["games_officiated"]),
        "home_bias_index": raw_index,
        "confidence_adjusted_index": raw_index * confidence,
        "confidence": confidence,
        "components": {
            "home_win_z": home_win_z,
            "home_point_diff_z": point_diff_z,
            "foul_diff_z": foul_diff_z,
        },
        "interpretation": interpret_home_bias(raw_index),
    }


def home_bias_index(rows, limit=10):
    baseline = home_bias_baseline(rows)
    ranked = sorted(
        (home_bias_index_for_row(row, baseline) for row in rows),
        key=lambda row: row["confidence_adjusted_index"],
        reverse=True,
    )
    road_favorable = sorted(
        ranked,
        key=lambda row: row["confidence_adjusted_index"],
    )

    return {
        "baseline": baseline,
        "home_favorable": ranked[:limit],
        "road_favorable": road_favorable[:limit],
    }


def interpret_home_bias(index):
    if index >= 1:
        return "Strong home-favorable statistical profile"
    if index >= 0.5:
        return "Moderately home-favorable statistical profile"
    if index <= -1:
        return "Strong road-favorable statistical profile"
    if index <= -0.5:
        return "Moderately road-favorable statistical profile"
    return "Near baseline"


def outlier_analysis(rows, field, threshold=2.0, limit=20):
    validate_metric_field(field)
    mean = weighted_average(rows, field)
    std_dev = weighted_std_dev(rows, field)

    outliers = []
    for row in rows:
        value = to_float(row[field])
        z = z_score(value, mean, std_dev)
        if abs(z) >= threshold:
            outliers.append({
                "referee": row["referee"],
                "season": row["season"],
                "split": row["split"],
                "role": row["role"],
                "games_officiated": to_float(row["games_officiated"]),
                field: value,
                "z_score": z,
                "interpretation": interpret_outlier(z),
            })

    return sorted(outliers, key=lambda row: abs(row["z_score"]), reverse=True)[:limit]


def interpret_outlier(z):
    direction = "above average" if z > 0 else "below average"
    abs_z = abs(z)

    if abs_z >= 3:
        return f"Extreme {direction} outlier"
    if abs_z >= 2:
        return f"Significantly {direction}"
    if abs_z >= 1:
        return f"Notably {direction}"
    return "Normal range"


def group_rows_by_referee(rows):
    grouped = {}
    for row in rows:
        referee = row["referee"]
        if referee not in grouped:
            grouped[referee] = []
        grouped[referee].append(row)
    return grouped


def interpret_consistency(volatility_ratio):
    if volatility_ratio <= 0.5:
        return "More consistent than baseline"
    if volatility_ratio <= 1:
        return "Near baseline consistency"
    if volatility_ratio <= 1.5:
        return "More variable than baseline"
    return "Highly inconsistent"


def consistency_analysis(rows, field, limit=20):
    validate_metric_field(field)
    rows_by_referee = group_rows_by_referee(rows)
    population_std_dev = weighted_std_dev(rows, field)

    consistency_scores = []

    for referee, referee_rows in rows_by_referee.items():
        mean = weighted_average(referee_rows, field)
        std_dev = weighted_std_dev(referee_rows, field)
        volatility_ratio = std_dev / population_std_dev if population_std_dev else 0

        consistency_scores.append({
            "referee": referee,
            "rows_counted": len(referee_rows),
            "seasons_counted": len({row["season"] for row in referee_rows}),
            "total_games": sum(to_float(row["games_officiated"]) for row in referee_rows),
            field + "_weighted_mean": mean,
            field + "_weighted_std_dev": std_dev,
            "population_weighted_std_dev": population_std_dev,
            "volatility_ratio": volatility_ratio,
            "consistency_interpretation": interpret_consistency(volatility_ratio),
        })

    return sorted(
        consistency_scores,
        key=lambda row: row["volatility_ratio"],
        reverse=True,
    )[:limit]
