import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, accuracy_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.path.abspath(os.path.join(BASE_DIR, "../backend/csv"))
MODELS_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(MODELS_DIR, exist_ok=True)

GAME_TYPE_MAP = {
    "memory": 0,
    "attention": 1,
    "pattern": 2,
    "routine": 3
}

def load_data():
    sessions_path = os.path.join(CSV_DIR, "game_sessions.csv")
    patients_path = os.path.join(CSV_DIR, "patients.csv")
    trends_path = os.path.join(CSV_DIR, "performance_trends.csv")

    if not os.path.exists(sessions_path):
        raise FileNotFoundError(f"Missing {sessions_path}")
    
    sessions = pd.read_csv(sessions_path)
    patients = pd.read_csv(patients_path) if os.path.exists(patients_path) else pd.DataFrame()
    trends = pd.read_csv(trends_path) if os.path.exists(trends_path) else pd.DataFrame()

    if not patients.empty and "id" in patients.columns:
        df = sessions.merge(
            patients[["id", "age", "gender", "culturalTheme"]],
            left_on="patientId",
            right_on="id",
            how="left"
        )
    else:
        df = sessions.copy()
        df["age"] = 72

    df["age"] = df["age"].fillna(72).astype(float)
    df["difficulty"] = df["difficulty"].fillna(1).astype(float)
    df["attempts"] = df["attempts"].fillna(1).astype(float)
    df["responseTime"] = df["responseTime"].fillna(4.5).astype(float)
    df["accuracy"] = df["accuracy"].fillna(75.0).astype(float)
    df["score"] = df["score"].fillna(80.0).astype(float)
    df["game_type_idx"] = df["gameType"].map(lambda x: GAME_TYPE_MAP.get(str(x).lower(), 0))

    return df, trends

def train_models():
    print("🧠 Starting Mindora Scikit-Learn Model Training on CSV data...")
    df, trends = load_data()
    print(f"Loaded {len(df)} game session records for training.")

    # -------------------------------------------------------------
    # 1. Model 1: Cognitive Performance / Accuracy Regressor
    # Features: [difficulty, responseTime, attempts, age, game_type_idx]
    # Target: accuracy
    # -------------------------------------------------------------
    feature_cols = ["difficulty", "responseTime", "attempts", "age", "game_type_idx"]
    X = df[feature_cols].values
    y_reg = df["accuracy"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    reg_model = RandomForestRegressor(
        n_estimators=60,
        max_depth=5,
        random_state=42
    )
    reg_model.fit(X_scaled, y_reg)
    train_preds = reg_model.predict(X_scaled)
    rmse = np.sqrt(mean_squared_error(y_reg, train_preds))
    print(f"✓ Trained Performance Predictor (RandomForestRegressor) - RMSE: {rmse:.2f}")

    # Feature Importances
    importances = dict(zip(feature_cols, [float(round(v, 4)) for v in reg_model.feature_importances_]))

    # -------------------------------------------------------------
    # 2. Model 2: Cognitive Fatigue / Strain Risk Classifier
    # Classes: 0: Low Risk, 1: Moderate Risk, 2: Elevated Risk
    # Low Risk: accuracy >= 75 and responseTime <= 5.0
    # Moderate: accuracy >= 60 and responseTime <= 6.5
    # Elevated: accuracy < 60 or responseTime > 6.5
    # -------------------------------------------------------------
    def get_risk_label(row):
        acc = row["accuracy"]
        rt = row["responseTime"]
        if acc >= 75 and rt <= 5.0:
            return 0 # Low Risk
        elif acc >= 60 and rt <= 6.5:
            return 1 # Moderate Risk
        else:
            return 2 # Elevated Risk

    y_risk = df.apply(get_risk_label, axis=1).values
    risk_model = RandomForestClassifier(
        n_estimators=50,
        max_depth=4,
        random_state=42
    )
    risk_model.fit(X_scaled, y_risk)
    risk_preds = risk_model.predict(X_scaled)
    risk_acc = accuracy_score(y_risk, risk_preds)
    print(f"✓ Trained Cognitive Fatigue Risk Classifier - Training Accuracy: {risk_acc * 100:.1f}%")

    # -------------------------------------------------------------
    # 3. Model 3: Optimal Difficulty Tier Recommender (Class 1 to 5)
    # Target: Optimal Difficulty Level based on accuracy & latency
    # -------------------------------------------------------------
    def get_optimal_difficulty(row):
        acc = row["accuracy"]
        diff = row["difficulty"]
        if acc >= 85 and diff < 5:
            return int(diff + 1)
        elif acc < 55 and diff > 1:
            return int(diff - 1)
        return int(diff)

    y_diff = df.apply(get_optimal_difficulty, axis=1).values
    diff_model = RandomForestClassifier(
        n_estimators=50,
        max_depth=4,
        random_state=42
    )
    diff_model.fit(X_scaled, y_diff)
    print(f"✓ Trained Optimal Difficulty Recommender")

    # -------------------------------------------------------------
    # Save Model Artifacts
    # -------------------------------------------------------------
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))
    joblib.dump(reg_model, os.path.join(MODELS_DIR, "performance_regressor.joblib"))
    joblib.dump(risk_model, os.path.join(MODELS_DIR, "risk_classifier.joblib"))
    joblib.dump(diff_model, os.path.join(MODELS_DIR, "difficulty_classifier.joblib"))

    metadata = {
        "features": feature_cols,
        "feature_importances": importances,
        "total_sessions_trained": int(len(df)),
        "rmse": float(round(rmse, 2)),
        "risk_accuracy": float(round(risk_acc, 4)),
        "classes": {
            "risk": ["Low Risk (Stable)", "Moderate Risk (Watch)", "Elevated Risk (Fatigue Detected)"],
            "difficulty": [1, 2, 3, 4, 5]
        }
    }

    with open(os.path.join(MODELS_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("💾 Saved all models and metadata to ai_service/models/")
    return metadata

if __name__ == "__main__":
    train_models()
