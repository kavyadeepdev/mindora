from fastapi import FastAPI
from pydantic import BaseModel

from .recommender import recommend_activity


app = FastAPI(title="Mindora Recommendation Service")


class RecommendationRequest(BaseModel):
    patientId: str | None = None
    patientName: str = "Patient"
    age: int = 72
    language: str = "English"
    interests: list[str] = []
    recentPerformance: dict = {}
    completedToday: list[str] = []


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/v1/recommendation")
def recommendation(request: RecommendationRequest):
    result = recommend_activity(
        completed_today=request.completedToday,
        interests=request.interests,
    )

    return {
        **result,
        "patientName": request.patientName,
    }