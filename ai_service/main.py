import os
import sys
from typing import Dict, Any, List, Optional

# Ensure ai_service directory is on sys.path regardless of execution working directory
AI_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

try:
    from ai_service.analyzer import analyzer
    from ai_service.llm_summary import generate_nemotron_summary, GROQ_MODEL, GROQ_API_KEY
    from ai_service.train import train_models
except ImportError:
    from analyzer import analyzer
    from llm_summary import generate_nemotron_summary, GROQ_MODEL, GROQ_API_KEY
    from train import train_models


app = FastAPI(
    title="Mindora AI Microservice",
    description="Cognitive Analysis Engine powered by Scikit-Learn and Groq Nemotron",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientAnalysisRequest(BaseModel):
    patient: Dict[str, Any] = Field(default_factory=dict)
    sessions: List[Dict[str, Any]] = Field(default_factory=list)

class RecommendationRequest(BaseModel):
    patientName: Optional[str] = "Patient"
    age: Optional[int] = 72
    language: Optional[str] = "en"
    interests: Optional[List[str]] = Field(default_factory=list)
    recentPerformance: Optional[Dict[str, Any]] = Field(default_factory=dict)
    completedToday: Optional[List[str]] = Field(default_factory=list)

@app.get("/health")
def health():
    return {
        "status": "online",
        "service": "mindora-ai-fastapi",
        "models_loaded": analyzer.reg_model is not None,
        "groq_configured": bool(GROQ_API_KEY),
        "groq_model": GROQ_MODEL,
    }

@app.post("/analyze/patient")
def analyze_patient(req: PatientAnalysisRequest):
    """
    Combines Scikit-Learn performance analysis with Groq Nemotron clinical executive summary.
    """
    try:
        ml_results = analyzer.analyze(req.patient, req.sessions)
        ai_summary = generate_nemotron_summary(req.patient, ml_results, req.sessions)

        return {
            "status": "success",
            "patientId": req.patient.get("id"),
            "ml_analysis": ml_results,
            "ai_summary": ai_summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/recommendation")
def get_recommendation(req: RecommendationRequest):
    """
    Suggests the optimal next cognitive activity based on patient interests and pacing.
    """
    completed = set(req.completedToday or [])
    all_activities = [
        {"type": "memory", "title": "Memory Match", "reason": "Familiar visual recall promotes comfort and reminiscence."},
        {"type": "routine", "title": "Daily Routine Recall", "reason": "Reinforces chronological memory for hydration and daily steps."},
        {"type": "attention", "title": "Attention Challenge", "reason": "Gentle visual filtering without time pressure."},
        {"type": "pattern", "title": "Pattern Recognition", "reason": "Stimulates working memory rhythm with regional motifs."}
    ]

    # Pick first uncompleted activity, or cycle to memory
    chosen = next((a for a in all_activities if a["type"] not in completed), all_activities[0])

    return {
        "recommendedActivity": chosen["title"],
        "gameType": chosen["type"],
        "culturalTheme": "Assam Brahmaputra Valley",
        "reasoning": chosen["reason"],
        "encouragement": f"A peaceful, calming activity specially chosen for {req.patientName}.",
        "isAiGenerated": True,
        "source": "fastapi-ai-service"
    }

@app.post("/retrain")
def retrain():
    """
    Retrains the Scikit-Learn models on backend/csv/*.csv files.
    """
    try:
        metadata = train_models()
        analyzer.load_models()
        return {
            "status": "success",
            "message": "Models successfully retrained from CSV data",
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
