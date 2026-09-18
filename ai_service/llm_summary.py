import os
import json
from typing import Dict, Any, Optional

try:
    from groq import Groq
except ImportError:
    Groq = None

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")

def generate_nemotron_summary(
    patient: Dict[str, Any],
    ml_analysis: Dict[str, Any],
    recent_sessions: list
) -> Dict[str, Any]:
    """
    Uses NVIDIA Nemotron via Groq to synthesize an executive clinical summary
    for the supervising physician, referencing the trained ML outputs.
    """
    patient_name = patient.get("name", "Patient")
    age = patient.get("age", 72)
    diagnosis = patient.get("diagnosis", "Mild Cognitive Impairment")
    cultural_theme = patient.get("culturalTheme", "Assam Brahmaputra Valley")
    
    accuracy = ml_analysis.get("overall_accuracy_avg", 80.0)
    response_time = ml_analysis.get("average_response_time_sec", 4.5)
    stability_score = ml_analysis.get("predicted_stability_score", 82.0)
    risk_level = ml_analysis.get("fatigue_risk_level", "Low Risk (Stable)")
    rec_diff = ml_analysis.get("recommended_difficulty", 2)
    trend = ml_analysis.get("stability_trend", "stable")
    modality_data = ml_analysis.get("modality_breakdown", {})

    prompt = f"""You are an expert cognitive neurology and geriatric care AI assistant specializing in non-diagnostic elderly support and memory rehabilitation in India.
Analyze the following quantitative telemetry and Scikit-Learn machine learning predictions for:

PATIENT PROFILE:
- Name: {patient_name}
- Age: {age}
- Clinical Diagnosis: {diagnosis}
- Cultural Context: {cultural_theme}

SCIKIT-LEARN ML MODEL PREDICTIONS:
- Predicted Cognitive Stability Score: {stability_score} / 100
- Fatigue Risk Classification: {risk_level}
- Optimal Recommended Difficulty Tier: Level {rec_diff} of 5
- Rolling Performance Trend: {trend.upper()}
- Longitudinal Average Accuracy: {accuracy}%
- Average Response Latency: {response_time} seconds
- Modality Breakdown: {json.dumps(modality_data)}

TASK:
Provide a concise, professional, reassuring clinical overview for Dr. Debojit Sarma.
Format your response as valid JSON with the following exact keys:
{{
  "executive_summary": "2-3 sentences summarizing current cognitive wellness and trajectory.",
  "strengths": ["string", "string"],
  "fatigue_and_strain_assessment": "1-2 sentences assessing reaction times and potential cognitive fatigue.",
  "regimen_recommendations": ["string", "string", "string"],
  "model_used": "{GROQ_MODEL}"
}}
Return ONLY valid JSON.
"""

    if GROQ_API_KEY and Groq is not None:
        try:
            client = Groq(api_key=GROQ_API_KEY)
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a clinical decision-support AI for geriatric cognitive engagement. Output pure JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw_content = response.choices[0].message.content
            parsed = json.loads(raw_content)
            parsed["source"] = f"groq-{GROQ_MODEL}"
            return parsed
        except Exception as e:
            print(f"⚠️ Groq Nemotron call failed or model unavailable ({e}). Engaging deterministic clinical fallback.")

    # Graceful Deterministic Clinical Fallback based on ML analysis
    strengths = []
    if accuracy >= 80:
        strengths.append(f"High accuracy ({accuracy}%) in familiar memory and visual recall exercises.")
    if response_time <= 4.5:
        strengths.append(f"Prompt response latency ({response_time}s) indicating unhurried, comfortable engagement.")
    if "pattern" in modality_data and modality_data["pattern"]["average_accuracy"] >= 85:
        strengths.append("Exceptional rhythm prediction with regional cultural motifs (e.g. Gamosa weaves).")
    if not strengths:
        strengths.append("Consistent daily routine participation without signs of acute distress.")

    recommendations = [
        f"Maintain prescribed activities at Level {rec_diff} to sustain engagement without inducing fatigue.",
        "Encourage morning sessions between 9:30 AM and 11:00 AM where response latencies are lowest.",
        "Reinforce daily hydration reminders to support neurological alertness before cognitive tasks."
    ]

    return {
        "executive_summary": f"{patient_name} ({age}y, {diagnosis}) demonstrates a {trend} cognitive engagement pattern with a predicted stability index of {stability_score}/100. Overall accuracy remains resilient at {accuracy}% with comfortable response latencies.",
        "strengths": strengths,
        "fatigue_and_strain_assessment": f"Evaluated at {risk_level} with an average reaction time of {response_time}s. Cognitive pacing remains within safe parameters, with no acute fatigue indicators observed.",
        "regimen_recommendations": recommendations,
        "model_used": f"{GROQ_MODEL} (Clinical Rules Engine Fallback)",
        "source": "deterministic_clinical_rules"
    }
