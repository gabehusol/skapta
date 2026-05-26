import logging

from fastapi import APIRouter, HTTPException

from models.recommend import RecommendRequest, RecommendResponse
from services.recommend_service import get_recommendations

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest) -> RecommendResponse:
    try:
        return get_recommendations(request.description)
    except Exception:
        logger.exception("Unexpected error in /api/recommend")
        raise HTTPException(status_code=500, detail="Internal server error")
