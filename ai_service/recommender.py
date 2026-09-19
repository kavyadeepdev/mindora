import csv
from pathlib import Path
from typing import List, Dict, Any, Optional

ACTIVITIES = {
    "memory": {
        "gameType": "memory",
        "name": "Memory Match",
        "culturalTheme": "Tea Garden Flowers & Utensils",
        "reason": "Gentle visual recall with familiar cultural artifacts.",
        "defaultRounds": 5,
        "defaultDifficulty": 2,
    },
    "attention": {
        "gameType": "attention",
        "name": "Attention Challenge",
        "culturalTheme": "Bihu Rhythm & Weaving Motifs",
        "reason": "Active focus stimulation through rhythmic patterns.",
        "defaultRounds": 5,
        "defaultDifficulty": 2,
    },
    "pattern": {
        "gameType": "pattern",
        "name": "Pattern Recognition",
        "culturalTheme": "Muga Silk & Traditional Borders",
        "reason": "Pattern continuity promotes logical sequence recall.",
        "defaultRounds": 5,
        "defaultDifficulty": 2,
    },
    "routine": {
        "gameType": "routine",
        "name": "Daily Routine Recall",
        "culturalTheme": "Morning Tea & Garden Stroll",
        "reason": "Grounding routine sequence reinforcement for calmness.",
        "defaultRounds": 3,
        "defaultDifficulty": 1,
    },
}

def load_fallback_sessions() -> List[Dict[str, Any]]:
    """Loads historical sessions from the backend CSV dataset if live sessions are not provided."""
    csv_path = (
        Path(__file__).resolve().parent.parent
        / "backend"
        / "csv"
        / "game_sessions.csv"
    )

    if not csv_path.exists():
        return []

    try:
        with open(csv_path, newline="", encoding="utf-8") as file:
            return list(csv.DictReader(file))
    except Exception:
        return []

def recommend_activity(
    completed_today: Optional[List[str]] = None,
    interests: Optional[List[str]] = None,
    sessions: Optional[List[Dict[str, Any]]] = None,
    patient_name: str = "Patient",
    age: int = 72,
) -> Dict[str, Any]:
    """
    Analyzes patient performance history (live sessions or CSV), daily completion state,
    and cultural interests to recommend the optimal cognitive activity for clinician review.
    """
    completed_today_set = set(completed_today or [])
    interests_list = [item.lower() for item in (interests or [])]
    interest_text = " ".join(interests_list)

    # Use live sessions if provided, otherwise load from CSV fallback
    active_sessions = sessions if (sessions and len(sessions) > 0) else load_fallback_sessions()

    # Filter candidates: prioritize activities not completed today
    candidates = [
        activity
        for activity in ACTIVITIES.values()
        if activity["name"] not in completed_today_set and activity["gameType"] not in completed_today_set
    ]

    if not candidates:
        candidates = list(ACTIVITIES.values())

    # Scoring dictionary
    scores: Dict[str, float] = {activity["gameType"]: 0.0 for activity in candidates}

    for activity in candidates:
        gtype = activity["gameType"]
        gname = activity["name"].lower()

        # Bonus if not yet played today
        if activity["name"] not in completed_today_set and gtype not in completed_today_set:
            scores[gtype] += 2.0

        # Filter patient's recent sessions for this game type
        matching = [
            row for row in active_sessions
            if (row.get("gameType", "").lower() == gtype) or 
               (row.get("gameTitle", "").lower().startswith(gname)) or
               (gtype in row.get("gameType", "").lower())
        ]

        if matching:
            recent = matching[:5]
            try:
                accuracies = []
                response_times = []
                for row in recent:
                    acc = float(row.get("accuracy", 75))
                    accuracies.append(acc)
                    if "responseTime" in row and row["responseTime"] is not None:
                        response_times.append(float(row["responseTime"]))

                avg_accuracy = sum(accuracies) / len(accuracies) if accuracies else 75.0
                avg_rt = sum(response_times) / len(response_times) if response_times else 4.5

                # Teammate's scoring heuristic:
                # Prioritize activities where patient had moderate/challenging accuracy (<75%)
                # to reinforce gentle learning, or medium accuracy (75-85%)
                if avg_accuracy < 70:
                    scores[gtype] += 3.5  # Needs gentle reinforcement
                elif avg_accuracy < 85:
                    scores[gtype] += 2.5
                else:
                    scores[gtype] += 1.0  # Already strong

                # Pacing bonus: if response times are comfortable (< 5.0s), encourage sequence/pattern
                if avg_rt <= 4.5 and gtype in ["pattern", "attention"]:
                    scores[gtype] += 1.5

            except (ValueError, KeyError):
                pass

    # Cultural & personal interest matching (North Eastern anchors)
    if any(word in interest_text for word in ["music", "garden", "flower", "festival", "nature", "tea"]):
        if "memory" in scores:
            scores["memory"] += 2.5

    if any(word in interest_text for word in ["weaving", "craft", "pattern", "silk", "muga", "loom"]):
        if "pattern" in scores:
            scores["pattern"] += 2.5

    if any(word in interest_text for word in ["routine", "family", "daily", "morning", "stroll", "prayer"]):
        if "routine" in scores:
            scores["routine"] += 2.5

    if any(word in interest_text for word in ["rhythm", "bihu", "instrument", "dhol", "pepa", "focus"]):
        if "attention" in scores:
            scores["attention"] += 2.5

    # Determine highest-scoring activity
    selected_type = max(scores, key=scores.get)
    selected = next(act for act in candidates if act["gameType"] == selected_type)

    # Determine suggested rounds and difficulty based on age and recent performance
    suggested_rounds = selected["defaultRounds"]
    if age >= 80:
        suggested_rounds = max(3, suggested_rounds - 2)

    suggested_diff = selected["defaultDifficulty"]

    return {
        "recommendedActivity": selected["name"],
        "gameType": selected["gameType"],
        "culturalTheme": selected["culturalTheme"],
        "reasoning": f"Curated for {patient_name} based on recent cognitive accuracy, response pacing, and personal affinity for {interests[0] if interests else 'cultural memories'}. {selected['reason']}",
        "suggestedRounds": suggested_rounds,
        "suggestedDifficulty": suggested_diff,
        "encouragement": f"A peaceful, calming activity specially chosen for {patient_name}.",
        "isAiGenerated": True,
        "patientName": patient_name,
        "source": "mindora-ai-recommender",
    }
