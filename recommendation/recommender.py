import csv
from pathlib import Path


ACTIVITIES = {
    "memory": {
        "name": "Memory Match",
        "culturalTheme": "Tea Garden Flowers & Utensils",
        "reason": "Gentle visual recall with familiar cultural artifacts.",
    },
    "attention": {
        "name": "Attention Challenge",
        "culturalTheme": "Bihu Rhythm & Weaving Motifs",
        "reason": "Active focus stimulation through rhythmic patterns.",
    },
    "pattern": {
        "name": "Pattern Recognition",
        "culturalTheme": "Muga Silk & Traditional Borders",
        "reason": "Pattern continuity promotes logical sequence recall.",
    },
    "routine": {
        "name": "Daily Routine Recall",
        "culturalTheme": "Morning Tea & Garden Stroll",
        "reason": "Grounding routine sequence reinforcement for calmness.",
    },
}


def load_sessions():
    csv_path = (
        Path(__file__).resolve().parent.parent
        / "backend"
        / "csv"
        / "game_sessions.csv"
    )

    if not csv_path.exists():
        return []

    with open(csv_path, newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def recommend_activity(completed_today, interests):
    completed_today = set(completed_today or [])
    interests = [item.lower() for item in (interests or [])]

    sessions = load_sessions()

    # Find activities that were not completed today.
    candidates = [
        activity
        for key, activity in ACTIVITIES.items()
        if activity["name"] not in completed_today
    ]

    if not candidates:
        candidates = list(ACTIVITIES.values())

    # Simple scoring.
    scores = {activity["name"]: 0 for activity in candidates}

    for activity in candidates:
        name = activity["name"].lower()

        # Give a small score if the activity has not been done today.
        if activity["name"] not in completed_today:
            scores[activity["name"]] += 2

        # Look at recent game performance from the team's CSV.
        matching = [
            row for row in sessions
            if row.get("gameTitle", "").lower().startswith(name)
        ]

        if matching:
            recent = matching[:3]

            try:
                avg_accuracy = sum(
                    float(row["accuracy"]) for row in recent
                ) / len(recent)

                # Prefer activities with moderate recent performance.
                if avg_accuracy < 75:
                    scores[activity["name"]] += 3
                elif avg_accuracy < 85:
                    scores[activity["name"]] += 2
                else:
                    scores[activity["name"]] += 1

            except (ValueError, KeyError):
                pass

    # Simple interest matching.
    interest_text = " ".join(interests)

    if any(word in interest_text for word in ["music", "garden", "flower", "festival"]):
        scores["Memory Match"] = scores.get("Memory Match", 0) + 2

    if any(word in interest_text for word in ["weaving", "craft", "pattern", "silk"]):
        scores["Pattern Recognition"] = scores.get("Pattern Recognition", 0) + 2

    if any(word in interest_text for word in ["routine", "family", "daily"]):
        scores["Daily Routine Recall"] = scores.get("Daily Routine Recall", 0) + 2

    # Highest score wins.
    selected_name = max(scores, key=scores.get)

    selected = next(
        activity
        for activity in candidates
        if activity["name"] == selected_name
    )

    return {
        "recommendedActivity": selected["name"],
        "culturalTheme": selected["culturalTheme"],
        "reasoning": selected["reason"],
        "encouragement": "Take your time and enjoy the activity.",
        "isAiGenerated": False,
    }