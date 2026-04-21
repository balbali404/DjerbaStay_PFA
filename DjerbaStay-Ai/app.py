"""
Djerba Smart Trip Planner - Flask Backend

Provides two ML-powered services:
- Suggestion model for personality + itinerary generation
- Budget model for cost estimation
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template, request
from geopy.distance import geodesic
from sklearn.metrics.pairwise import cosine_similarity

# =============================================================================
# Configuration
# =============================================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

PLACES_PATH = DATA_DIR / "places_djerba.csv"
ACCOMMODATIONS_PATH = DATA_DIR / "accommodations_djerba.csv"

BUDGET_MODEL_PATH = MODEL_DIR / "budget_models.pkl"
SUGGESTION_MODEL_PATH = MODEL_DIR / "suggestion_model.pkl"

MAX_TRIP_DAYS = 7
MAX_DISTANCE_KM = 20
MAX_HOURS_PER_DAY = 8

# Recommendation scoring weights
WEIGHT_INTEREST = 0.40
WEIGHT_RATING = 0.35
WEIGHT_TRAVEL_TYPE = 0.25

# Budget split
BUDGET_ACTIVITIES_PERCENT = 0.45
BUDGET_FOOD_PERCENT = 0.35
BUDGET_TRANSPORT_PERCENT = 0.20

ALLOWED_TRANSPORT = {"taxi", "car_rental", "bus"}


# =============================================================================
# Loading helpers
# =============================================================================

def load_csv(path: Path, required: bool = True) -> pd.DataFrame | None:
    """Load a CSV file as DataFrame."""
    try:
        return pd.read_csv(path)
    except FileNotFoundError as exc:
        if required:
            raise SystemExit(f"Error: Required file not found: {path}") from exc
        return None


def load_pickle(path: Path) -> Any | None:
    """Load a pickle file. Returns None if loading fails."""
    try:
        return joblib.load(path)
    except Exception as exc:
        print(f"Warning: could not load {path.name}: {exc}")
        return None


# =============================================================================
# Data and model bootstrap
# =============================================================================

PLACES_DF = load_csv(PLACES_PATH)
ACCOMMODATIONS_DF = load_csv(ACCOMMODATIONS_PATH)


def load_budget_bundle() -> tuple[Any | None, Any | None, list[str]]:
    """Load budget regressors and feature names from pickle."""
    bundle = load_pickle(BUDGET_MODEL_PATH)
    if not isinstance(bundle, dict):
        return None, None, []

    required_keys = {"lr_model", "ridge_model", "feature_names"}
    missing = required_keys.difference(bundle.keys())
    if missing:
        print(f"Warning: budget model missing keys: {sorted(missing)}")
        return None, None, []

    feature_names = bundle["feature_names"]
    if not isinstance(feature_names, list):
        print("Warning: budget feature_names must be a list")
        return None, None, []

    return bundle["lr_model"], bundle["ridge_model"], feature_names


def load_suggestion_bundle() -> dict[str, Any] | None:
    """Load suggestion model bundle from pickle."""
    bundle = load_pickle(SUGGESTION_MODEL_PATH)
    if not isinstance(bundle, dict):
        return None

    required_keys = {
        "profile_vectorizer",
        "profile_vectors",
        "profile_labels",
        "profile_token_sets",
        "place_vectorizer",
        "place_vectors",
        "synonym_map",
    }
    missing = required_keys.difference(bundle.keys())
    if missing:
        print(f"Warning: suggestion model missing keys: {sorted(missing)}")
        return None

    return bundle


BUDGET_LR_MODEL, BUDGET_RIDGE_MODEL, BUDGET_FEATURE_NAMES = load_budget_bundle()
SUGGESTION_BUNDLE = load_suggestion_bundle()


# =============================================================================
# Utilities
# =============================================================================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in km between two coordinates."""
    return round(geodesic((lat1, lon1), (lat2, lon2)).km, 2)


def normalize_series(series: pd.Series) -> pd.Series:
    """Normalize numeric series to [0, 1]."""
    min_val, max_val = series.min(), series.max()
    if max_val == min_val:
        return series.apply(lambda _: 0.5)
    return (series - min_val) / (max_val - min_val)


def expand_query(query: str, synonym_map: dict[str, str]) -> str:
    """Expand query terms with synonym expansions."""
    tokens = query.lower().split()
    expansions: list[str] = []

    for token in tokens:
        expansion = synonym_map.get(token)
        if expansion:
            expansions.extend(expansion.split())

    if not expansions:
        return query
    return f"{query} {' '.join(expansions)}"


def parse_int_field(
    data: dict[str, Any],
    key: str,
    *,
    default: int,
    min_value: int,
    max_value: int,
) -> int:
    """Parse and validate an integer field."""
    raw = data.get(key, default)

    if isinstance(raw, bool):
        raise ValueError(f"'{key}' must be an integer")

    try:
        value = int(raw)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"'{key}' must be an integer") from exc

    if value < min_value or value > max_value:
        raise ValueError(f"'{key}' must be between {min_value} and {max_value}")

    return value


def parse_float_field(data: dict[str, Any], key: str) -> float:
    """Parse and validate a numeric field."""
    raw = data.get(key)
    try:
        return float(raw)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"'{key}' must be a number") from exc


def parse_required_str(data: dict[str, Any], key: str) -> str:
    """Parse and validate a required string field."""
    value = str(data.get(key, "")).strip()
    if not value:
        raise ValueError(f"'{key}' field is required")
    return value


# =============================================================================
# Suggestion model logic
# =============================================================================

def _require_suggestion_bundle() -> dict[str, Any]:
    if not SUGGESTION_BUNDLE:
        raise RuntimeError("Suggestion model is not loaded")
    return SUGGESTION_BUNDLE


def _get_place_vectors(bundle: dict[str, Any]):
    """Use stored place vectors when possible, else recompute."""
    place_vectors = bundle.get("place_vectors")
    if place_vectors is not None and getattr(place_vectors, "shape", (0,))[0] == len(PLACES_DF):
        return place_vectors

    return bundle["place_vectorizer"].transform(PLACES_DF["tags"].fillna(""))


def predict_personality(user_interests: str) -> tuple[str, float]:
    """Predict traveler personality from interests using suggestion model."""
    bundle = _require_suggestion_bundle()

    expanded = expand_query(user_interests, bundle["synonym_map"])
    user_vector = bundle["profile_vectorizer"].transform([expanded])

    tfidf_scores = cosine_similarity(user_vector, bundle["profile_vectors"])[0]

    query_tokens = set(expanded.lower().split())
    num_tokens = max(len(query_tokens), 1)
    overlap_scores = np.array(
        [
            len(query_tokens.intersection(token_set)) / num_tokens
            for token_set in bundle["profile_token_sets"]
        ],
        dtype=float,
    )

    combined_scores = 0.6 * tfidf_scores + 0.4 * overlap_scores
    best_index = int(combined_scores.argmax())

    sorted_scores = sorted(combined_scores, reverse=True)
    denominator = sorted_scores[0] + (sorted_scores[1] if len(sorted_scores) > 1 else 0.0)
    confidence = sorted_scores[0] / denominator if denominator > 0 else 0.0

    personality = bundle["profile_labels"][best_index]
    return personality, round(float(confidence), 3)


def score_places(user_interests: str, personality: str) -> pd.DataFrame:
    """Score places using interest similarity, ratings, and travel-type match."""
    bundle = _require_suggestion_bundle()
    places_df = PLACES_DF.copy()

    expanded = expand_query(user_interests, bundle["synonym_map"])
    user_vector = bundle["place_vectorizer"].transform([expanded])
    place_vectors = _get_place_vectors(bundle)

    places_df["interest_score"] = cosine_similarity(user_vector, place_vectors)[0]
    places_df["travel_score"] = places_df["travel_type"].apply(
        lambda value: 1.0 if personality in str(value).lower() else 0.0
    )
    places_df["rating_norm"] = normalize_series(places_df["rating"])

    places_df["final_score"] = (
        WEIGHT_INTEREST * places_df["interest_score"]
        + WEIGHT_RATING * places_df["rating_norm"]
        + WEIGHT_TRAVEL_TYPE * places_df["travel_score"]
    )

    return places_df.sort_values("final_score", ascending=False).reset_index(drop=True)


def build_itinerary(
    scored_places: pd.DataFrame,
    requested_days: int,
    home_lat: float,
    home_lon: float,
) -> list[dict[str, Any]]:
    """Build day-by-day itinerary with time and distance constraints."""
    visited_ids: set[int] = set()
    itinerary: list[dict[str, Any]] = []

    for day_num in range(1, requested_days + 1):
        day_places: list[dict[str, Any]] = []
        hours_used = 0.0

        for _, place in scored_places.iterrows():
            place_id = int(place["id"])

            if place_id in visited_ids:
                continue

            duration = float(place["duration"])
            if hours_used + duration > MAX_HOURS_PER_DAY:
                continue

            distance = calculate_distance(
                home_lat,
                home_lon,
                float(place["latitude"]),
                float(place["longitude"]),
            )
            if distance > MAX_DISTANCE_KM:
                continue

            day_places.append(
                {
                    "name": place["name"],
                    "type": place["type"],
                    "category": place["category"],
                    "latitude": round(float(place["latitude"]), 4),
                    "longitude": round(float(place["longitude"]), 4),
                    "duration_hours": duration,
                    "score": round(float(place["final_score"]), 3),
                    "distance_from_accommodation_km": round(distance, 2),
                }
            )

            hours_used += duration
            visited_ids.add(place_id)

        if day_places:
            itinerary.append(
                {
                    "day": day_num,
                    "total_hours": round(hours_used, 1),
                    "places": day_places,
                }
            )

    for index, day in enumerate(itinerary, start=1):
        day["day"] = index

    return itinerary


def plan_trip(
    user_interests: str,
    days: int,
    accommodation_name: str,
    accommodation_lat: float,
    accommodation_lon: float,
) -> dict[str, Any]:
    """Generate a complete trip plan."""
    personality, confidence = predict_personality(user_interests)
    scored_places = score_places(user_interests, personality)
    itinerary = build_itinerary(scored_places, days, accommodation_lat, accommodation_lon)

    actual_days = len(itinerary)
    warning = None
    if actual_days < days:
        day_word = "day" if actual_days == 1 else "days"
        warning = (
            f"Only {actual_days} {day_word} could be planned for your criteria "
            f"({days} requested). Try broadening your interests."
        )

    return {
        "personality": personality,
        "confidence": confidence,
        "accommodation": {
            "name": accommodation_name,
            "latitude": round(accommodation_lat, 4),
            "longitude": round(accommodation_lon, 4),
        },
        "total_days": actual_days,
        "requested_days": days,
        "itinerary": itinerary,
        "warning": warning,
    }


# =============================================================================
# Budget model logic
# =============================================================================

def _require_budget_models() -> tuple[Any, Any, list[str]]:
    if BUDGET_LR_MODEL is None or BUDGET_RIDGE_MODEL is None:
        raise RuntimeError("Budget model is not loaded")
    return BUDGET_LR_MODEL, BUDGET_RIDGE_MODEL, BUDGET_FEATURE_NAMES


def build_budget_features(
    days: int,
    persons: int,
    budget_level: int,
    transport: str,
    feature_names: list[str],
) -> pd.DataFrame:
    """Build input feature frame aligned with trained feature names."""
    features = {name: 0 for name in feature_names}

    features["days"] = days
    features["persons"] = persons
    features["budget_level"] = budget_level

    features["days_x_persons"] = days * persons
    features["days_x_level"] = days * budget_level
    features["persons_x_level"] = persons * budget_level
    features["days_x_persons_x_level"] = days * persons * budget_level

    transport_col = f"transport_{transport}"
    if transport_col in features:
        features[transport_col] = 1

    return pd.DataFrame([features])[feature_names]


def estimate_budget(days: int, persons: int, budget_level: int, transport: str) -> dict[str, Any]:
    """Estimate total and breakdown budget using both regressors."""
    lr_model, ridge_model, feature_names = _require_budget_models()

    input_frame = build_budget_features(days, persons, budget_level, transport, feature_names)

    prediction_lr = max(10.0, float(lr_model.predict(input_frame)[0]))
    prediction_ridge = max(10.0, float(ridge_model.predict(input_frame)[0]))
    total = (prediction_lr + prediction_ridge) / 2

    return {
        "total_cost": round(total),
        "per_day": round(total / days),
        "activities_cost": round(total * BUDGET_ACTIVITIES_PERCENT),
        "food_cost": round(total * BUDGET_FOOD_PERCENT),
        "transport_cost": round(total * BUDGET_TRANSPORT_PERCENT),
        "lr_prediction": round(prediction_lr, 2),
        "ridge_prediction": round(prediction_ridge, 2),
    }


# =============================================================================
# Flask app
# =============================================================================

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    """Enable CORS for local frontend development."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.route("/")
def index():
    return render_template("index.html", max_days=MAX_TRIP_DAYS)


@app.route("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "suggestion_model_loaded": SUGGESTION_BUNDLE is not None,
            "budget_model_loaded": BUDGET_LR_MODEL is not None and BUDGET_RIDGE_MODEL is not None,
            "places_count": len(PLACES_DF),
            "accommodations_count": len(ACCOMMODATIONS_DF),
        }
    )


@app.route("/accommodations")
def get_accommodations():
    columns = ["id", "name", "type", "area", "latitude", "longitude", "rating"]
    return jsonify(ACCOMMODATIONS_DF[columns].to_dict(orient="records"))


@app.route("/plan_trip", methods=["POST"])
def api_plan_trip():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    try:
        interests = parse_required_str(data, "interests")
        days = parse_int_field(
            data,
            "days",
            default=3,
            min_value=1,
            max_value=MAX_TRIP_DAYS,
        )
        accommodation_name = parse_required_str(data, "accommodation_name")
        accommodation_lat = parse_float_field(data, "accommodation_lat")
        accommodation_lon = parse_float_field(data, "accommodation_lon")

        result = plan_trip(
            interests,
            days,
            accommodation_name,
            accommodation_lat,
            accommodation_lon,
        )
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        return jsonify({"error": f"Unexpected server error: {exc}"}), 500


@app.route("/estimate_budget", methods=["POST"])
def api_estimate_budget():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    try:
        days = parse_int_field(data, "days", default=3, min_value=1, max_value=MAX_TRIP_DAYS)
        persons = parse_int_field(data, "persons", default=2, min_value=1, max_value=10)
        budget_level = parse_int_field(data, "budget_level", default=2, min_value=1, max_value=3)

        transport = str(data.get("transport", "taxi")).strip().lower()
        if transport not in ALLOWED_TRANSPORT:
            allowed = ", ".join(sorted(ALLOWED_TRANSPORT))
            raise ValueError(f"'transport' must be one of: {allowed}")

        result = estimate_budget(days, persons, budget_level, transport)
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        return jsonify({"error": f"Unexpected server error: {exc}"}), 500


if __name__ == "__main__":
    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.run(debug=True)
