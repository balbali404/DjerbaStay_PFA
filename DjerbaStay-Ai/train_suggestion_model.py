"""
Suggestion Model Training Script

Builds and saves the recommendation bundle used by `app.py`:
- Personality prediction vectorizer + profile vectors
- Place-scoring vectorizer + place vectors
- Synonym expansion map

Output:
    models/suggestion_model.pkl
"""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

PROFILES_PATH = DATA_DIR / "traveler_profiles.csv"
PLACES_PATH = DATA_DIR / "places_djerba.csv"
SYNONYMS_PATH = DATA_DIR / "synonyms.csv"
OUTPUT_PATH = MODEL_DIR / "suggestion_model.pkl"


def build_synonym_map(synonyms_df: pd.DataFrame) -> dict[str, str]:
    """Create synonym lookup dictionary."""
    synonym_map: dict[str, str] = {}
    for _, row in synonyms_df.iterrows():
        term = str(row["term"]).strip().lower()
        expansion = str(row["expansion"]).strip().lower()
        if term and expansion:
            synonym_map[term] = expansion
    return synonym_map


def main() -> None:
    """Train and persist the suggestion model bundle."""
    print("Loading datasets...")
    profiles = pd.read_csv(PROFILES_PATH)
    places = pd.read_csv(PLACES_PATH)
    synonyms = pd.read_csv(SYNONYMS_PATH)

    print("Training profile vectorizer...")
    profile_vectorizer = TfidfVectorizer(sublinear_tf=True)
    profile_vectors = profile_vectorizer.fit_transform(profiles["keywords"].fillna(""))

    print("Training place vectorizer...")
    place_vectorizer = TfidfVectorizer()
    place_vectors = place_vectorizer.fit_transform(places["tags"].fillna(""))

    synonym_map = build_synonym_map(synonyms)
    profile_labels = profiles["personality"].astype(str).str.lower().tolist()
    profile_token_sets = [
        set(str(keywords).lower().split()) for keywords in profiles["keywords"].fillna("")
    ]

    bundle = {
        "profile_vectorizer": profile_vectorizer,
        "profile_vectors": profile_vectors,
        "profile_labels": profile_labels,
        "profile_token_sets": profile_token_sets,
        "place_vectorizer": place_vectorizer,
        "place_vectors": place_vectors,
        "synonym_map": synonym_map,
        "metadata": {
            "profiles_count": len(profiles),
            "places_count": len(places),
            "synonyms_count": len(synonym_map),
            "version": 1,
        },
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, OUTPUT_PATH)

    print(f"Suggestion model saved to: {OUTPUT_PATH}")
    print(f"Profiles: {len(profiles)} | Places: {len(places)} | Synonyms: {len(synonym_map)}")


if __name__ == "__main__":
    main()
