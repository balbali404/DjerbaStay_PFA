"""
Budget Model Training Script

Trains Linear Regression and Ridge Regression models for trip budget estimation.
Uses synthetic training data generated from real Djerba 2025 prices.

Output:
    - models/budget_models.pkl: Trained models and feature names
    - static/model_comparison.png: Visualization of model performance
"""

import os

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

# =============================================================================
# Configuration
# =============================================================================

DATA_PATH = "data/trip_budgets.csv"
MODEL_OUTPUT_PATH = "models/budget_models.pkl"
CHART_OUTPUT_PATH = "static/model_comparison.png"

TEST_SIZE = 0.2
RANDOM_STATE = 42
RIDGE_ALPHA = 1.0

# =============================================================================
# Data Preparation
# =============================================================================

def load_data():
    """Load training data from CSV."""
    return pd.read_csv(DATA_PATH)


def create_features(df):
    """
    Create feature matrix with interaction terms.
    
    Interaction features capture the multiplicative relationship
    between days, persons, and budget level.
    """
    df = df.copy()
    
    # Create interaction features
    df["days_x_persons"] = df["days"] * df["persons"]
    df["days_x_level"] = df["days"] * df["budget_level"]
    df["persons_x_level"] = df["persons"] * df["budget_level"]
    df["days_x_persons_x_level"] = df["days"] * df["persons"] * df["budget_level"]
    
    # Select features
    feature_cols = [
        "days", "persons", "budget_level",
        "days_x_persons", "days_x_level", "persons_x_level", "days_x_persons_x_level",
        "transport"
    ]
    
    features = df[feature_cols].copy()
    
    # One-hot encode transport type
    features = pd.get_dummies(features, columns=["transport"], drop_first=True)
    
    target = df["total_cost"]
    
    return features, target


# =============================================================================
# Model Training
# =============================================================================

def train_models(X_train, y_train):
    """Train Linear and Ridge regression models."""
    linear_model = LinearRegression()
    ridge_model = Ridge(alpha=RIDGE_ALPHA)
    
    linear_model.fit(X_train, y_train)
    ridge_model.fit(X_train, y_train)
    
    return linear_model, ridge_model


def evaluate_model(model, X_test, y_test, model_name):
    """Evaluate a model and print metrics."""
    predictions = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"\n{model_name}:")
    print(f"  MAE:  {mae:.2f} EUR")
    print(f"  R2:   {r2:.4f}")
    
    return predictions


# =============================================================================
# Visualization
# =============================================================================

def plot_comparison(y_test, pred_linear, pred_ridge, output_path):
    """Create comparison chart of actual vs predicted values."""
    plt.figure(figsize=(10, 6))
    
    # Plot first 50 samples for clarity
    num_samples = min(len(y_test), 50)
    indices = np.arange(num_samples)
    
    plt.scatter(
        indices, y_test.iloc[:num_samples],
        color="black", label="Actual Cost", zorder=3, s=30
    )
    plt.plot(
        indices, pred_linear[:num_samples],
        color="blue", linestyle="--", linewidth=2, label="Linear Regression"
    )
    plt.plot(
        indices, pred_ridge[:num_samples],
        color="red", linestyle=":", linewidth=2, label="Ridge Regression"
    )
    
    plt.title("Trip Budget Estimation: Actual vs Predicted (Djerba 2025)", fontsize=12)
    plt.xlabel("Test Sample Index")
    plt.ylabel("Total Cost (EUR) - Activities, Food & Transport")
    plt.legend(loc="upper left")
    plt.grid(True, linestyle="--", alpha=0.5)
    plt.tight_layout()
    
    plt.savefig(output_path, dpi=150)
    plt.close()


# =============================================================================
# Model Saving
# =============================================================================

def save_models(linear_model, ridge_model, feature_names, output_path):
    """Save trained models and feature names to pickle file."""
    model_data = {
        "lr_model": linear_model,
        "ridge_model": ridge_model,
        "feature_names": feature_names,
    }
    joblib.dump(model_data, output_path)


# =============================================================================
# Main
# =============================================================================

def main():
    """Train models and save results."""
    # Ensure output directories exist
    os.makedirs("models", exist_ok=True)
    os.makedirs("static", exist_ok=True)
    
    # Load and prepare data
    print("Loading training data...")
    df = load_data()
    features, target = create_features(df)
    
    print(f"Dataset: {len(df)} records, {len(features.columns)} features")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        features, target,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE
    )
    
    # Train models
    print("\nTraining models...")
    linear_model, ridge_model = train_models(X_train, y_train)
    
    # Evaluate models
    print("\nModel Evaluation:")
    pred_linear = evaluate_model(linear_model, X_test, y_test, "Linear Regression")
    pred_ridge = evaluate_model(ridge_model, X_test, y_test, "Ridge Regression")
    
    # Save models
    save_models(linear_model, ridge_model, list(features.columns), MODEL_OUTPUT_PATH)
    print(f"\nModels saved to: {MODEL_OUTPUT_PATH}")
    
    # Generate visualization
    plot_comparison(y_test, pred_linear, pred_ridge, CHART_OUTPUT_PATH)
    print(f"Chart saved to: {CHART_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
