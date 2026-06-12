def to_float(value, default=0.0):
    if value in (None, ""):
        return default
    if isinstance(value, str) and value.strip() == "":
        return default
    return float(value)


def filter_rows(rows, season=None, split=None, min_games=None):
    if season:
        rows = [row for row in rows if row["season"] == season]
    if split:
        rows = [row for row in rows if row["split"] == split]
    if min_games is not None:
        rows = [
            row for row in rows
            if int(to_float(row["games_officiated"])) >= min_games
        ]
    return rows


def get_seasons(rows):
    return sorted({row["season"] for row in rows}, reverse=True)


def get_splits(rows):
    return sorted({row["split"] for row in rows})
