from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000)


class StackChoice(BaseModel):
    choice: str
    reason: str
    alternatives: list[str]


class RecommendationResult(BaseModel):
    frontend: StackChoice
    backend: StackChoice
    database: StackChoice
    auth: StackChoice
    deployment: StackChoice
    additional: list[str]


class RetrievedSource(BaseModel):
    technology: str
    source_url: str
    relevance_score: float


class RecommendResponse(BaseModel):
    recommendations: RecommendationResult
    retrieved_sources: list[RetrievedSource]
