import logging

from fastapi import APIRouter, HTTPException, Request

from limiter import limiter
from models.recommend import RecommendRequest, RecommendResponse
from services.recommend_service import get_recommendations

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
@limiter.limit("5/minute;50/day")
async def recommend(request: Request, body: RecommendRequest) -> RecommendResponse:
    try:
        return get_recommendations(body.description)
    except Exception:
        logger.exception("Unexpected error in /api/recommend")
        raise HTTPException(status_code=500, detail="Internal server error")
