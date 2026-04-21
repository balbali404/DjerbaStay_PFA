# pfa-v2 — Djerba Smart Trip Planner

ML-powered itinerary generator for Djerba, Tunisia using TF-IDF + Cosine Similarity.

## Setup

```bash
pip install -r requirements.txt
```

## Train ML models

Run both training scripts once before starting the API:

```bash
python train_budget_model.py
python train_suggestion_model.py
```

This generates:
- `models/budget_models.pkl`
- `models/suggestion_model.pkl`

## Running the app

```bash
python app.py
```

Then open **http://127.0.0.1:5000/** in your browser.

> **Important:** Always access the app through the Flask server URL above.  
> Opening `templates/index.html` directly from disk (`file:///…`) will not work because the fetch calls use relative URLs that require the Flask server.

## Realistic Budget Estimation

Prices in the datasets reflect real 2024 costs for Djerba/Tunisia:

| Category | Price range (€) |
|---|---|
| Free sites (beaches, mosques, street art, markets) | €0 |
| Budget attractions (forts, ruins, synagogue) | €5–9 |
| Museums (pottery, art, heritage) | €9–15 |
| Activities / theme parks | €15–25 |
| Café / breakfast | €7–10 |
| Budget restaurant | €11–15 |
| Mid-range restaurant | €15–20 |
| Upscale / seafood restaurant | €22–32 |

## Transportation Options

The planner supports five common transport modes in Djerba.  
When a mode is selected the daily transport cost is added to every day's budget and rolled up into the trip totals.

| Key | Label | Price | Unit |
|---|---|---|---|
| `taxi` | Taxi | €1.20/km | per km travelled |
| `car_rental` | Car Rental | €35/day | flat daily rate |
| `public_bus` | Public Bus / Louage | €1/day | flat daily rate |
| `shuttle` | Hotel Shuttle | €10/day | flat daily rate (~2 return trips) |
| `moped` | Moped / Scooter | €20/day | flat daily rate |

The available modes and their descriptions are also exposed at the `GET /transport_options` endpoint so the frontend (or any API client) can fetch them dynamically.

The API response now includes:
- **`daily_spend_estimate`** — average cost per day per person (EUR), including transport if selected
- **`total_trip_estimate`** — sum of all item + transport costs for the full trip per person (EUR)
- **`daily_spend_estimate_party`** — average cost per day for the whole party (EUR)
- **`total_trip_estimate_party`** — total trip cost for all participants (EUR)
- **`num_people`** — number of travelers used for party calculations
- **`transport_mode`** — the selected transport mode key (or `null`)
- **`transport_label`** — human-readable name of the selected transport mode (or `null`)
- **`transport_description`** — pricing description of the selected mode (or `null`)
- **`day_cost_eur`** on each itinerary day — sum of place/restaurant costs for that day per person (EUR)
- **`day_cost_eur_party`** on each itinerary day — sum of item costs for that day for the whole party (EUR)
- **`transport_cost_eur`** on each itinerary day — transport cost for that day per person (EUR; 0 if no mode selected)
- **`transport_cost_eur_party`** on each itinerary day — transport cost for that day for the whole party (EUR)

These are calculated directly from the prices of places and restaurants selected for the itinerary, so they reflect the actual stops chosen rather than a fixed formula.

## API

### `POST /plan_trip`

Request body (JSON):

```json
{
  "interests": "beach sunset seafood couple",
  "budget": 100,
  "days": 3,
  "num_people": 2,
  "transport_mode": "taxi"
}
```

Response (JSON):

```json
{
  "personality": "romantic",
  "confidence": 0.82,
  "total_days": 3,
  "num_people": 2,
  "budget_eur": 100,
  "transport_mode": "taxi",
  "transport_label": "Taxi",
  "transport_description": "Metered taxi (~€1.20/km)",
  "daily_spend_estimate": 44.90,
  "total_trip_estimate": 134.70,
  "daily_spend_estimate_party": 89.80,
  "total_trip_estimate_party": 269.40,
  "itinerary": [
    {
      "day": 1,
      "total_distance_km": 4.5,
      "total_hours": 7.0,
      "day_cost_eur": 40.0,
      "day_cost_eur_party": 80.0,
      "transport_cost_eur": 5.40,
      "transport_cost_eur_party": 10.80,
      "places": [
        {
          "name": "Plage Sidi Mahrez",
          "type": "beach",
          "category": "beach",
          "latitude": 33.8625,
          "longitude": 10.9831,
          "duration_hours": 3.0,
          "price_eur": 0.0,
          "score": 0.812,
          "distance_from_prev_km": 0.0
        }
      ]
    }
  ]
}
```

### `GET /transport_options`

Returns all available transport modes with pricing details:

```json
{
  "taxi":       { "label": "Taxi",               "description": "Metered taxi (~€1.20/km)",                       "price_per_km": 1.20, "price_per_day": null, "unit": "per km" },
  "car_rental": { "label": "Car Rental",          "description": "Economy car rental, fuel included (~€35/day)",    "price_per_km": null, "price_per_day": 35.0, "unit": "per day" },
  "public_bus": { "label": "Public Bus / Louage", "description": "Shared minibus (louage) or public bus (~€1/day)", "price_per_km": null, "price_per_day": 1.0,  "unit": "per day" },
  "shuttle":    { "label": "Hotel Shuttle",        "description": "Hotel/resort shuttle service (~€10/day)",         "price_per_km": null, "price_per_day": 10.0, "unit": "per day" },
  "moped":      { "label": "Moped / Scooter",      "description": "Moped or scooter rental (~€20/day)",              "price_per_km": null, "price_per_day": 20.0, "unit": "per day" }
}
```
```

### `GET /health`

Returns server status and dataset counts.
