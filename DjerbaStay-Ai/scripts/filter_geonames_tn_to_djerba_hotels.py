#!/usr/bin/env python3
"""
Filter a GeoNames Tunisia dump to Djerba hotels.

Usage:
    python DjerbaStay-Ai/scripts/filter_geonames_tn_to_djerba_hotels.py \
      --input TN.txt \
      --output DjerbaStay-Ai/data/hotels_djerba_from_geonames.csv

Input format:
    Tab-delimited GeoNames file from https://download.geonames.org/export/dump/
    (e.g. unzip TN.zip, then pass TN.txt as --input)
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

# Approximate bounding box covering Djerba island and immediate surroundings.
DJERBA_LAT_MIN = 33.65
DJERBA_LAT_MAX = 33.95
DJERBA_LON_MIN = 10.65
DJERBA_LON_MAX = 11.15

DJERBA_KEYWORDS = (
    "djerba",
    "jerba",
    "midoun",
    "houmt",
    "ajim",
    "aghir",
    "mezraia",
    "guellala",
    "erriadh",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract Djerba hotels from a GeoNames Tunisia dump."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to GeoNames text file (for example unzipped TN.txt).",
    )
    parser.add_argument(
        "--output",
        default="DjerbaStay-Ai/data/hotels_djerba_from_geonames.csv",
        help="Output CSV path (default: DjerbaStay-Ai/data/hotels_djerba_from_geonames.csv).",
    )
    return parser.parse_args()


def in_djerba_bbox(lat: float, lon: float) -> bool:
    return (
        DJERBA_LAT_MIN <= lat <= DJERBA_LAT_MAX
        and DJERBA_LON_MIN <= lon <= DJERBA_LON_MAX
    )


def has_djerba_keyword(*values: str) -> bool:
    blob = " ".join(values).lower()
    return any(keyword in blob for keyword in DJERBA_KEYWORDS)


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    selected_rows: list[dict[str, str]] = []

    with input_path.open("r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            # GeoNames expected schema length is 19 columns.
            if len(row) < 19:
                continue

            (
                geonameid,
                name,
                asciiname,
                alternatenames,
                latitude,
                longitude,
                feature_class,
                feature_code,
                country_code,
                _cc2,
                admin1_code,
                admin2_code,
                admin3_code,
                admin4_code,
                _population,
                _elevation,
                _dem,
                _timezone,
                _modification_date,
            ) = row[:19]

            if country_code != "TN":
                continue
            if feature_class != "S" or feature_code != "HTL":
                continue

            try:
                lat = float(latitude)
                lon = float(longitude)
            except ValueError:
                continue

            # Keep rows in Djerba area. If coordinates are borderline,
            # allow a fallback textual match to avoid missing nearby records.
            if not in_djerba_bbox(lat, lon) and not has_djerba_keyword(
                name, asciiname, alternatenames
            ):
                continue

            selected_rows.append(
                {
                    "geonameid": geonameid,
                    "name": name,
                    "latitude": f"{lat:.6f}",
                    "longitude": f"{lon:.6f}",
                    "feature_code": feature_code,
                    "country_code": country_code,
                    "admin1_code": admin1_code,
                    "admin2_code": admin2_code,
                    "admin3_code": admin3_code,
                    "admin4_code": admin4_code,
                    "price_tnd": "",
                    "price_source": "",
                    "dataset_source": "GeoNames TN dump",
                }
            )

    # Deduplicate by geonameid while preserving first appearance.
    deduped: dict[str, dict[str, str]] = {}
    for item in selected_rows:
        deduped.setdefault(item["geonameid"], item)

    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "geonameid",
                "name",
                "latitude",
                "longitude",
                "feature_code",
                "country_code",
                "admin1_code",
                "admin2_code",
                "admin3_code",
                "admin4_code",
                "price_tnd",
                "price_source",
                "dataset_source",
            ],
        )
        writer.writeheader()
        writer.writerows(deduped.values())

    print(
        f"Done. Wrote {len(deduped)} Djerba hotel rows to: {output_path.as_posix()}"
    )


if __name__ == "__main__":
    main()
