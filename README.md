# NBA Ref Analytics

NBA Ref Analytics is an informational data project that explores NBA referee trends across seasons using publicly available referee statistics. The project analyzes officiating patterns such as foul differential, home-team indicators, referee consistency, and statistical outliers.

The goal is to make referee data easier to explore and to surface patterns that may be worth deeper analysis. The results should be interpreted as statistical indicators, not proof of referee bias or game manipulation.

## Features

- Browse NBA referee statistics across multiple seasons
- Filter referee data by season, split, and minimum games officiated
- Analyze foul differential between home and road teams
- Calculate a home bias index using multiple weighted indicators
- Identify statistical outliers using z-scores
- Compare referee consistency across seasons
- Display results through an informational frontend and FastAPI backend

## Project Structure

```txt
nba-ref-analytics/
  frontend/
    index.html
    styles.css
    src/
    data/
  backend/
    main.py
    data/
    services/
    requirements.txt
  data/
    raw/
```

## Installation

Clone the repository:
```bash
git clone <repo-url>
cd nba-ref-analytics
```

## Frontend

The frontend is currently a static website:

```bash
cd frontend
python3 -m http.server 3000
```

Then open:

```txt
http://localhost:3000
```

## Backend

Install backend dependencies:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

Which will be available at:

```txt
http://127.0.0.1:8000
```

## Docker

Run the frontend and backend together:

```bash
docker compose up --build
```

The frontend will be available at:

```txt
http://localhost:3000
```

The backend API will be available at:

```txt
http://localhost:8000
```

## API Endpoints

```txt
GET /api/health
GET /api/referees
GET /api/seasons
GET /api/splits
GET /api/metrics/overview
GET /api/metrics/foul-differential
GET /api/metrics/foul-differential/leaders
GET /api/metrics/home-bias
GET /api/metrics/outliers
GET /api/metrics/consistency
```

## Data

The data aggregated and used in this project is sourced from NBAstuffer.com. The stored CSV data is located in `data/raw/`. The backend reads this CSV and calculates derived metrics via service functions.

## Methodology

This project currently uses descriptive statistics, weighted averages, standard deviation, and z-scores to identify officiating patterns.

Current metrics include:

- Foul Differential: compares fouls called against road teams versus home teams.
- Home Bias Index: combines home win percentage, home point differential, and foul differential into a weighted score.
- Outlier Analysis: identifies referee-season rows that differ meaningfully from the population average.
- Consistency Analysis: compares a referee’s variation across seasons against the overall population baseline.

Note: These metrics are calculated from public data and should be interpreted cautiously. The results can highlight unusual patterns or trends, but they do not independently prove intent, bias, or causation.

## Future Work

- Connect frontend charts directly to backend endpoints
- Add automated tests for metric calculations
- Add game-level data for deeper analysis
- Incorporate coach's challenge data
- Deploy the frontend and backend to the cloud
