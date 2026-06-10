import csv
from pathlib import Path


DATA_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "raw"
    / "nbastuffer-nba-referee-stats-2016-2026.csv"
)


def load_csv_rows():
    with DATA_FILE.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))
