import os
import json
import joblib
import numpy as np
from typing import Dict, Any, List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

GAME_TYPE_MAP = {
    "memory": 0,
    "attention": 1,
    "pattern": 2,
    "routine": 3
}

class PatientCognitiveAnalyzer:
    def __init__(self):
        self.scaler = None
        self.reg_model = None
        self.risk_model = None
        self.diff_model = None
        self.metadata = {}
        self.load_models()

    def load_models(self):
        try:
            self.scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.joblib"))
            self.reg_model = joblib.load(os.path.join(MODELS_DIR, "performance_regressor.joblib"))
            self.risk_model = joblib.load(os.path.join(MODELS_DIR, "risk_classifier.joblib"))
            self.diff_model = joblib.load(os.path.join(MODELS_DIR, "difficulty_classifier.joblib"))
            with open(os.path.join(MODELS_DIR, "metadata.json"), "r") as f:
                self.metadata = json.load(f)
            print("✓ Cognitive ML models loaded into memory.")
        except Exception as e:
            print(f"⚠️ Warning: Could not load models ({e}). Models may need to be trained via train.py.")

    def analyze(self, patient_info: Dict[str, Any], sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        age = float(patient_info.get("age", 72))

        if not sessions:
            return {
                "total_sessions": 0,
                "overall_accuracy_avg": 75.0,
                "average_response_time_sec": 4.5,
                "predicted_stability_score": 75.0,
                "fatigue_risk_level": "Low Risk (Stable)",
                "fatigue_risk_score": 0.15,
                "recommended_difficulty": 2,
                "modality_breakdown": {},
                "feature_importances": self.metadata.get("feature_importances", {}),
                "stability_trend": "stable",
                "model_status": "default_baseline"
            }

        total_sessions = len(sessions)
        accuracies = [float(s.get("accuracy", 70)) for s in sessions]
        response_times = [float(s.get("responseTime", 4.5)) for s in sessions]
        difficulties = [float(s.get("difficulty", 2)) for s in sessions]

        overall_accuracy_avg = float(round(np.mean(accuracies), 1))
        average_response_time_sec = float(round(np.mean(response_times), 2))
        avg_difficulty = float(round(np.mean(difficulties), 1))

        # Modality breakdown
        breakdown: Dict[str, Dict[str, Any]] = {}
        for s in sessions:
            gtype = str(s.get("gameType", "memory")).lower()
            if gtype not in breakdown:
                breakdown[gtype] = {"count": 0, "accuracies": [], "response_times": []}
            breakdown[gtype]["count"] += 1
            breakdown[gtype]["accuracies"].append(float(s.get("accuracy", 70)))
            breakdown[gtype]["response_times"].append(float(s.get("responseTime", 4.5)))

        modality_summary = {}
        for gtype, data in breakdown.items():
            modality_summary[gtype] = {
                "sessions_count": data["count"],
                "average_accuracy": round(float(np.mean(data["accuracies"])), 1),
                "average_response_time": round(float(np.mean(data["response_times"])), 2)
            }

        # Trend detection (first half vs second half if sufficient sessions)
        if len(accuracies) >= 4:
            mid = len(accuracies) // 2
            recent_half = np.mean(accuracies[:mid]) # newest first
            older_half = np.mean(accuracies[mid:])
            diff = recent_half - older_half
            if diff >= 4.0:
                trend = "improving"
            elif diff <= -4.0:
                trend = "declining"
            elif np.std(accuracies) > 12:
                trend = "fluctuating"
            else:
                trend = "stable"
        else:
            trend = "stable"

        # ML Model Inference using most recent session or aggregate profile
        latest_session = sessions[0] if sessions else {}
        latest_gtype_idx = GAME_TYPE_MAP.get(str(latest_session.get("gameType", "memory")).lower(), 0)
        latest_difficulty = float(latest_session.get("difficulty", avg_difficulty))
        latest_rt = float(latest_session.get("responseTime", average_response_time_sec))
        latest_attempts = float(latest_session.get("attempts", 1))

        features = np.array([[latest_difficulty, latest_rt, latest_attempts, age, latest_gtype_idx]])

        if self.scaler and self.reg_model and self.risk_model and self.diff_model:
            scaled_features = self.scaler.transform(features)

            # Predict stability score (regression)
            predicted_acc = float(self.reg_model.predict(scaled_features)[0])
            predicted_stability = float(round(np.clip(predicted_acc, 40.0, 99.0), 1))

            # Predict risk
            risk_class = int(self.risk_model.predict(scaled_features)[0])
            risk_probs = self.risk_model.predict_proba(scaled_features)[0]
            risk_labels = ["Low Risk (Stable)", "Moderate Risk (Watch)", "Elevated Risk (Fatigue Detected)"]
            fatigue_risk_level = risk_labels[min(risk_class, len(risk_labels) - 1)]
            fatigue_risk_score = float(round(1.0 - risk_probs[0], 2)) # probability of non-low risk

            # Predict recommended difficulty
            rec_diff = int(self.diff_model.predict(scaled_features)[0])
        else:
            # Mathematical fallback if models unpickled
            predicted_stability = overall_accuracy_avg
            fatigue_risk_level = "Low Risk (Stable)" if overall_accuracy_avg >= 75 else "Moderate Risk (Watch)"
            fatigue_risk_score = 0.20
            rec_diff = 2

        return {
            "total_sessions": total_sessions,
            "overall_accuracy_avg": overall_accuracy_avg,
            "average_response_time_sec": average_response_time_sec,
            "predicted_stability_score": predicted_stability,
            "fatigue_risk_level": fatigue_risk_level,
            "fatigue_risk_score": fatigue_risk_score,
            "recommended_difficulty": rec_diff,
            "modality_breakdown": modality_summary,
            "feature_importances": self.metadata.get("feature_importances", {}),
            "stability_trend": trend,
            "model_status": "trained_sklearn"
        }

analyzer = PatientCognitiveAnalyzer()
